document.addEventListener('DOMContentLoaded', function () {
    var container = document.querySelector('#container');
    var msnry;

    function initMasonry() {
        if (msnry) {
            msnry.destroy();
        }

        var containerWidth = container.offsetWidth;
        var cardWidth = 400; // Fixed card width
        var gutter = 20; // Gutter width
        var columns = Math.floor((containerWidth + gutter) / (cardWidth + gutter));
        columns = Math.min(Math.max(columns, 1), 4); // Ensure between 1 and 4 columns

        msnry = new Masonry(container, {
            itemSelector: '.card',
            columnWidth: cardWidth,
            gutter: gutter,
            fitWidth: true
        });

        // Set the container width to fit the columns exactly
        container.style.width = (columns * (cardWidth + gutter) - gutter) + 'px';

        msnry.layout();
    }

    // Initialize Masonry after all images have loaded
    imagesLoaded(container, function () {
        initMasonry();
        // Fade in the content
        document.querySelector('#section_voteCard_container').style.opacity = '1';
    });

    // Relayout Masonry on window resize
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(initMasonry, 250);
    });

    // Function to handle vote submission
    async function submitVote(voteID, optionID) {
        try {
            const response = await fetch('/api/vote/vote-for-options', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({voteID: voteID, voteOptionID: optionID}),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Vote submission successful:', data);
            alert('Vote submitted successfully!');
            return data;
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('There was an error submitting your vote. Please try again.');
            throw error;
        }
    }

    // Function to update vote display
    async function updateVoteDisplay(card) {
        const voteId = card.dataset.voteId;
        const options = card.querySelectorAll('.text_voteOptions_p');

        try {
            const [voteResults, userVotedOptionData] = await Promise.all([
                fetch('/api/vote/getStat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ voteId: voteId }),
                }).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch vote results: ${response.status}`);
                    }
                    return response.json();
                }),
                getUserVotedOption(voteId)
            ]);

            if (!voteResults || typeof voteResults.options !== 'object') {
                throw new Error('Invalid vote results structure');
            }

            // Extract the actual option ID from the structure
            const userVotedOption = userVotedOptionData && userVotedOptionData.voteOption && userVotedOptionData.voteOption.optionId;

            console.log('Vote results:', voteResults);
            console.log('User voted option data:', userVotedOptionData);
            console.log('Extracted user voted option:', userVotedOption);

            const hasVotes = Object.values(voteResults.options).some(option => option.percentage > 0);

            // Add voted class to card if there are votes
            if (hasVotes) {
                card.classList.add('voted');
            } else {
                card.classList.remove('voted');
            }

            options.forEach(option => {
                const optionId = option.dataset.optionId;
                const optionResult = voteResults.options[optionId];

                // Create or get percentage span
                let percentageSpan = option.querySelector('.vote-percentage');
                if (!percentageSpan) {
                    percentageSpan = document.createElement('span');
                    percentageSpan.classList.add('vote-percentage');
                    option.appendChild(percentageSpan);
                }

                if (hasVotes) {
                    // Remove click handler and add voted class
                    option.removeEventListener('click', handleVoteClick);
                    option.classList.add('voted');

                    // Update percentage display
                    const percentage = optionResult.percentage.toFixed(1);
                    percentageSpan.textContent = `${percentage}%`;
                    option.style.setProperty('--option-percentage', `${percentage}%`);

                    // Apply selected/unselected styles
                    console.log("Comparing option id:", optionId, "with user voted option:", userVotedOption);
                    if (optionId === userVotedOption) {
                        console.log("Match found! Applying user-selected class to option:", optionId);
                        option.classList.add('user-selected');
                        option.classList.remove('other-option');
                    } else {
                        console.log("No match. Applying other-option class to option:", optionId);
                        option.classList.remove('user-selected');
                        option.classList.add('other-option');
                    }
                } else {
                    // Reset option to unvoted state
                    option.classList.remove('voted', 'user-selected', 'other-option');
                    option.addEventListener('click', handleVoteClick);
                    percentageSpan.textContent = '';
                    option.style.setProperty('--option-percentage', '0%');
                }
            });
        } catch (error) {
            console.error('Error updating vote display:', error);
        }
    }

    // Function to handle vote click
    async function handleVoteClick(event) {
        if (!window.isAuthenticated) {
            alert('Please log in to vote.');
            return;
        }

        const option = event.currentTarget;
        const voteId = option.dataset.voteId;
        const optionId = option.dataset.optionId;
        const card = option.closest('#vote_card');

        try {
            const data = await submitVote(voteId, optionId);
            if (data.message === "Vote recorded successfully") {
                updateVoteDisplay(card, data.updatedVoteRecord);
            }
        } catch (error) {
            // Error is already handled in submitVote function
        }
    }

    // Initialize vote cards
    async function checkIfVoted(voteID) {
        try {
            const response = await fetch('/api/vote/check-voted', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({voteID: voteID}),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.hasVoted;
        } catch (error) {
            console.error('Error checking if voted:', error);
            return false; // Assume not voted in case of error
        }
    }

// In your initializeVoteCards function:
    async function initializeVoteCards() {
        console.log('Initializing vote cards');
        const voteCards = document.querySelectorAll('.card');
        console.log('Number of vote cards:', voteCards.length);

        for (const card of voteCards) {
            const voteID = card.dataset.voteId;
            const options = card.querySelectorAll('.text_voteOptions_p');

            console.log('Processing vote card:', {voteID, optionsCount: options.length});

            const hasVoted = await checkIfVoted(voteID);

            console.log('Has voted:', hasVoted);

            if (hasVoted) {
                console.log('Updating display for voted card:', voteID);
                await updateVoteDisplay(card);
            } else {
                console.log('Adding click listeners for non-voted card:', voteID);
                options.forEach(option => {
                    // Remove any existing listeners first
                    option.removeEventListener('click', handleVoteClick);
                    // Add new click listener
                    option.addEventListener('click', handleVoteClick);
                });
            }
        }
    }

    async function getUserVotedOption(voteId) {
        try {
            const response = await fetch('/api/vote/get-vote-option', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ voteId: voteId }),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // User hasn't voted yet
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw user voted option data:', data);
            return data; // This should be an object with a voteOption property
        } catch (error) {
            console.error('Error getting user voted option:', error);
            return null;
        }
    }

    // Initialize everything
    initializeVoteCards();
});