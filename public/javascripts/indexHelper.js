document.addEventListener('DOMContentLoaded', function () {
    var container = document.querySelector('#container');
    var msnry;

    function initMasonry() {
        if (msnry) {
            msnry.destroy(); // Clean up the old instance
        }

        var containerWidth = container.offsetWidth;
        var gutter = 20; // Gutter width
        var cardWidth;

        // Determine card width based on screen size
        if (window.innerWidth <= 440) {
            // For screens <= 440px, make card fill the width with some margin
            cardWidth = containerWidth - (gutter * 2); // Full width minus margins
        } else {
            cardWidth = 400; // Default card width for larger screens
        }

        var columns = Math.max(Math.floor((containerWidth + gutter) / (cardWidth + gutter)), 1); // Ensure at least 1 column

        // Dynamically adjust container width to fit viewport or calculated columns
        container.style.width = Math.min(columns * (cardWidth + gutter) - gutter, containerWidth) + 'px';

        // Initialize Masonry
        msnry = new Masonry(container, {
            itemSelector: '.card',
            columnWidth: cardWidth,
            gutter: gutter,
            fitWidth: true
        });

        // Adjust the width of all cards
        var cards = container.querySelectorAll('.card');
        cards.forEach(function(card) {
            card.style.width = cardWidth + 'px';
        });

        // Recalculate Masonry layout
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
                    body: JSON.stringify({voteId: voteId}),
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
            try {
                const voteID = card.dataset.voteId;
                const options = card.querySelectorAll('.text_voteOptions_p');

                console.log('Processing vote card:', {voteID, optionsCount: options.length});

                // Use Promise.all to run these fetch operations in parallel
                const [author, lastUpdate, hasVoted] = await Promise.all([
                    getVoteAuthor(voteID),
                    getVoteLastUpdate(voteID),
                    checkIfVoted(voteID)
                ]);

                card.querySelector('.text_voteAuthorName_p').textContent = author || 'Unknown Author';
                card.querySelector('.text_voteLastUpdated_p').textContent = lastUpdate || '---'

                // Assuming you have an element to display the last update
                const lastUpdateElement = card.querySelector('.text_voteLastUpdate');
                if (lastUpdateElement) {
                    lastUpdateElement.textContent = lastUpdate || 'Unknown';
                }

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
            } catch (error) {
                console.error('Error processing vote card:', error);
                // Handle the error appropriately, maybe display an error message on the card
            }
        }
    }

    async function getUserVotedOption(voteID) {
        try {
            const response = await fetch('/api/vote/get-vote-option', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({voteId: voteID}),
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

    async function getVoteAuthor(voteID) {
        try {
            console.log("Checking vote author for voteId:", voteID);
            const response = await fetch(`/api/vote/get-vote-author`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({voteId: voteID})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const voteAuthor = data.voteAuthor;
            console.log(`Vote Author for voteID ${voteID}: ${voteAuthor}`);

            return voteAuthor; // Return the author's username
        } catch (error) {
            console.error('Error fetching vote author:', error);
            throw error; // Re-throw the error if you want calling code to handle it
        }
    }

    async function getVoteLastUpdate(voteID) {
        try {
            console.log("Checking vote last update for voteId:", voteID);
            const response = await fetch(`/api/vote/getDateModified`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({voteId: voteID})
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Raw data received:", data);
            const voteLastModified = data.dateModified;
            console.log(`Vote last modified for voteID ${voteID}: ${voteLastModified}`);
            console.log("Type of voteLastModified:", typeof voteLastModified);

            const date = new Date(voteLastModified);
            console.log("Parsed date:", date);
            console.log("Is valid date:", !isNaN(date.getTime()));

            const timeSince = calcTimeSince(voteLastModified);
            console.log(`Time since last modification: ${timeSince}`);

            return timeSince;
        } catch (error) {
            console.error('Error fetching vote last update:', error);
            return '---'; // indicate that the time since cannot be updated
        }
    }

    function calcTimeSince(dateString) {
        console.log("Input to calcTimeSince:", dateString);
        const date = new Date(dateString);
        console.log("Parsed date in calcTimeSince:", date);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', dateString);
            return 'Unknown';
        }

        const now = new Date();
        console.log("Current date:", now);
        const diffInSeconds = Math.floor((now - date) / 1000);
        console.log("Difference in seconds:", diffInSeconds);

        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
        return `${Math.floor(diffInSeconds / 31536000)}yr`;
    }

    // Initialize everything
    initializeVoteCards();
});