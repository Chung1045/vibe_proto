document.addEventListener('DOMContentLoaded', function() {
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
                body: JSON.stringify({ voteID: voteID, voteOptionID: optionID }),
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
    function updateVoteDisplay(card, voteRecord) {
        const options = card.querySelectorAll('.text_voteOptions_p');
        const totalVotes = voteRecord.voteStatistics.length;

        options.forEach(option => {
            option.classList.add('voted');
            option.removeEventListener('click', handleVoteClick);

            const optionId = option.dataset.optionId;
            const voteCount = voteRecord.voteStatistics.filter(v => v.vote === optionId).length;
            const percentage = (voteCount / totalVotes * 100).toFixed(1);

            let percentageSpan = option.querySelector('.vote-percentage');
            if (!percentageSpan) {
                percentageSpan = document.createElement('span');
                percentageSpan.classList.add('vote-percentage');
                option.appendChild(percentageSpan);
            }
            percentageSpan.textContent = `${percentage}%`;
        });
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
    function initializeVoteCards() {
        const voteCards = document.querySelectorAll('#vote_card');
        voteCards.forEach(card => {
            const voteId = card.dataset.voteId;
            const options = card.querySelectorAll('.text_voteOptions_p');

            // Check if this vote has already been voted on
            const isVoted = options[0].classList.contains('voted');

            if (isVoted && window.userVotes && window.userVotes[voteId]) {
                // If already voted, update the display with percentages
                updateVoteDisplay(card, window.userVotes[voteId]);
            } else {
                // If not voted, add click listeners
                options.forEach(option => {
                    option.addEventListener('click', handleVoteClick);
                });
            }
        });
    }

    // Initialize everything
    initializeVoteCards();
});