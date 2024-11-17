$(document).ready(function () {
    // Initialize Masonry
    var $grid = $('#container').masonry({
        itemSelector: '.card',
        columnWidth: '.card',
        gutter: 20,
        fitWidth: true
    });

    function setElementVisibility(element, isVisible) {
        if (isVisible) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    // Function to check the number of options and toggle delete buttons
    function checkOptionsCount(optionsList) {
        const totalOptions = optionsList.children('.option-wrapper').length;
        if (totalOptions < 3) {
            optionsList.find('.delete-option-icon').each((index, element) => setElementVisibility(element, false));
        } else {
            optionsList.find('.delete-option-icon').each((index, element) => setElementVisibility(element, true));
        }
    }

    $(document).on('click', '#btn-fab-createVote', function () {
        let containerView = $('#container');

        const newCardStruct = $(`
    <div class="card" id="vote_card" data-vote-id="new-temporarily" data-creation-type="new" style="position: absolute; left: 20px; top: 20px;">
        <p>Title</p><div contenteditable="" class="editable_title" style="margin: 0px 0px 15px; display: block; width: 100%;">Write your Vote Title here</div>
        <p>Options</p>
        <div id="vote_option_list" data-vote-id="new-temporarily">
            <div class="option-wrapper"><div contenteditable="" class="editable_options" data-option-id="1" data-vote-id="new-temporarily" style="display: block;">Option 1</div></div>
            <div class="option-wrapper"><div contenteditable="" class="editable_options" data-option-id="2" data-vote-id="new-temporarily" style="display: block;">Option 2</div></div>
        </div>
        <div class="div-edit-options"><hr class="editable_hr"><div class="editable_addOptions">Add new options</div></div>
        <div class="d-flex justify-content-end" id="div_container_action_button">
        <p class="p-last-modified" data-vote-id="new-temporarily" data-date-modified="${new Date().toISOString()}"><span class="time-ago">now</span></p>
            <img src="/images/icns/trash-fill.svg" alt="icon" id="btn-delete">
            <img src="/images/icns/check2.svg" alt="icon" id="btn-save-changes">
        </div>
    </div>
    `);

        // Prepend the new card to the container (at the top)
        containerView.prepend(newCardStruct);

        // Add the new item to Masonry
        $grid.masonry('prepended', newCardStruct);

        // Recalculate Masonry layout
        $grid.masonry('layout');
    });


    $(document).on('click', '#btn-delete', function () {
        let voteEntry = $(this).closest('.card');
        let voteID = voteEntry.attr('data-vote-id');
        let parentElement = $(this).closest('.card');
        const optionsList = parentElement.find(`#vote_option_list[data-vote-id="${voteID}"]`);
        $('#ModalDialogue').modal('show');
        $('#btn-modal-confirm').data('vote-id', voteID).data('action', 'delete');
        checkOptionsCount(optionsList);
    });

    // Handle "Add new options" button click
    $(document).on('click', '.editable_addOptions', function () {
        let parentElement = $(this).closest('.card');
        let voteID = parentElement.attr('data-vote-id');
        const optionsList = parentElement.find(`#vote_option_list[data-vote-id="${voteID}"]`);
        addNewOption(optionsList);
        $grid.masonry('layout');
        checkOptionsCount(optionsList);
    });

    // Handle edit button click
    $(document).on('click', '#btn-edit', function () {
        let parentElement = $(this).closest('.card');
        let voteID = parentElement.attr('data-vote-id');
        makeVoteEditable(parentElement, voteID);
        const optionsList = parentElement.find(`#vote_option_list[data-vote-id="${voteID}"]`);
        checkOptionsCount(optionsList);
        $grid.masonry('layout');
    });

    // Handle confirmation of delete action
    $(document).on('click', '#btn-modal-confirm', function () {
        let voteID = $(this).data('vote-id');
        if (voteID !== undefined) {
            if ($(this).data('action') === 'delete') {
                $.ajax({
                    url: '/api/vote/delete',
                    method: 'POST',
                    data: JSON.stringify({
                        voteId: voteID
                    }),
                    contentType: 'application/json',
                    success: function(response) {
                        console.log('Vote deleted successfully:', response);
                    },
                    error: function(xhr, status, error) {
                        console.error('Error deleting vote:', error);
                    }
                });
                let voteEntry = document.querySelector(`.card[data-vote-id="${voteID}"]`);
                $(voteEntry).remove();
                $grid.masonry('layout');
            }
        }
    });

    $(document).on('click', '#btn-save-changes', function () {
        const card = $(this).closest('.card');
        const voteID = card.attr('data-vote-id');

        // Collect edited data
        const newTitle = card.find('.editable_title').text();
        const newOptions = card.find('.editable_options').map(function() {
            return $(this).text();
        }).get();

        // Update title
        card.find('p:contains("Title")').remove();
        const titleElement = $('<h2>').attr({
            'id': 'text_voteTitle_h2',
            'data-vote-id': voteID
        }).text(newTitle);
        card.find('.editable_title').replaceWith(titleElement);

        // Update options
        const optionsList = card.find(`#vote_option_list[data-vote-id="${voteID}"]`);
        optionsList.empty();
        card.find('p:contains("Options")').remove();
        newOptions.forEach((option, index) => {
            const optionElement = $('<p>').addClass('text_voteOptions_p')
                .attr({
                    'data-vote-id': voteID,
                    'data-option-id': index + 1
                })
                .text(option);
            optionsList.append(optionElement);
        });

        // Remove edit-related elements
        card.find('.div-edit-options').remove();
        card.find('.delete-option-icon').remove();

        // Change save button back to edit button
        $(this).attr({
            'src': '/images/icns/pencil-square.svg',
            'id': 'btn-edit'
        });

        // Recalculate Masonry layout
        $('#container').masonry('layout');

        // Extract and save vote data
        const voteData = extractVoteCardData(card);
        saveVoteData(voteData);
    });

    function extractVoteCardData(card) {
        const voteID = card.attr('data-vote-id');
        const title = card.find('#text_voteTitle_h2').text();
        const options = card.find('.text_voteOptions_p').map(function() {
            return {
                id: $(this).attr('data-option-id'),
                name: $(this).contents().filter(function() {
                    return this.nodeType === 3;
                }).text().trim()
            };
        }).get();

        return {
            voteId: voteID,
            voteTitle: title,
            voteOptions: options
        };
    }

    function saveVoteData(voteData) {
        const isNewVote = voteData.voteId === 'new-temporarily';
        const url = '/api/vote/update';

        $.ajax({
            url: url,
            method: 'POST',
            data: JSON.stringify(voteData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    console.log(isNewVote ? 'Vote created successfully:' : 'Vote updated successfully:', response);

                    const newVoteId = response.voteID || response.vote.voteId;
                    const card = $(`.card[data-vote-id="${isNewVote ? 'new-temporarily' : voteData.voteId}"]`);

                    if (isNewVote && newVoteId) {
                        updateVoteId('new-temporarily', newVoteId);
                    }

                    // Update card content
                    updateCardContent(card, voteData, newVoteId);

                    const lastModifiedElement = card.find('.p-last-modified');
                    if (response.vote && response.vote.dateModified) {
                        lastModifiedElement.attr('data-date-modified', response.vote.dateModified);
                        updateAllTimeAgo();
                    } else {
                        // If dateModified is not in the response, fetch it
                        $.ajax({
                            url: '/api/vote/getDateModified',
                            method: 'GET',
                            data: { voteId: newVoteId },
                            success: function(dateResponse) {
                                lastModifiedElement.attr('data-date-modified', dateResponse.dateModified);
                                updateAllTimeAgo();
                            },
                            error: function(xhr, status, error) {
                                console.error('Error fetching updated date modified:', error);
                            }
                        });
                    }

                    // Recalculate Masonry layout
                    $grid.masonry('layout');

                } else {
                    console.error(isNewVote ? 'Error creating vote:' : 'Error updating vote:', response.message);
                    // Handle the error, maybe show an error message to the user
                }
            },
            error: function(xhr, status, error) {
                console.error(isNewVote ? 'Error creating vote:' : 'Error updating vote:', error);
                // You can add error handling here, like showing an error message to the user
            }
        });
    }

    function updateVoteId(oldVoteId, newVoteId) {
        const card = $(`.card[data-vote-id="${oldVoteId}"]`);
        if (card.length) {
            // Update card
            card.attr('data-vote-id', newVoteId);

            card.find(`#vote_option_list[data-vote-id="${oldVoteId}"]`).attr('data-vote-id', newVoteId);
            card.find(`.editable_options[data-vote-id="${oldVoteId}"]`).attr('data-vote-id', newVoteId);
            card.find(`#text_voteTitle_h2[data-vote-id="${oldVoteId}"]`).attr('data-vote-id', newVoteId);
            card.find(`.p-last-modified[data-vote-id="${oldVoteId}"]`).attr('data-vote-id', newVoteId);
            card.find(`.text_voteOptions_p[data-vote-id="${oldVoteId}"]`).attr('data-vote-id', newVoteId);
        }
    }

    // Function to add a new editable option
    function addNewOption(optionsList) {
        // Create the new editable option
        let newOptionWrapper = $('<div/>').addClass('option-wrapper');
        let newOption = $('<div contenteditable />').addClass('editable_options').text('New option');
        let deleteIcon = $('<img/>').attr('src', '/images/icns/trash-fill.svg').addClass('delete-option-icon');

        newOptionWrapper.append(newOption, deleteIcon);
        optionsList.append(newOptionWrapper);

        newOption.on('input', function () {
            $grid.masonry('layout');
        });

        deleteIcon.on('click', function () {
            newOptionWrapper.remove();
            $grid.masonry('layout');
            checkOptionsCount(optionsList);
        });

        newOption.on('focus', function () {
            newOptionWrapper.addClass('focused');
        });

        newOption.on('blur', function () {
            newOptionWrapper.removeClass('focused');
        });
    }

    // Function to make a vote editable
    function makeVoteEditable(parentElement, voteID) {
        const editButton = parentElement.find('#btn-edit');
        const title = parentElement.find(`#text_voteTitle_h2[data-vote-id="${voteID}"]`);
        const optionsList = parentElement.find(`#vote_option_list[data-vote-id="${voteID}"]`);
        const options = optionsList.find(`.text_voteOptions_p[data-vote-id="${voteID}"]`);

        // Add labels
        $("<p>Title</p>").insertBefore(title);
        $("<p>Options</p>").insertBefore(optionsList);

        // Create options editing container
        let divEditOptions = $("<div/>").addClass("div-edit-options");
        let newOptionsBt = $('<div/>').text("Add new options").addClass("editable_addOptions");
        let horizontalRule = $('<hr/>').addClass("editable_hr");

        makeElementEditable(title, parentElement);

        options.each(function () {
            makeOptionEditable($(this), voteID);
        });


        divEditOptions.append(horizontalRule, newOptionsBt);
        optionsList.after(divEditOptions);

        editButton.attr('src', '/images/icns/check2.svg');
        editButton.attr('id', 'btn-save-changes');

        checkOptionsCount(optionsList);
    }

    // Function to make an element editable
    function makeElementEditable(element, parentElement) {
        let originalText = element.text();
        let originalClasses = element.attr('class');
        let originalStyles = element.attr('style');
        let originalMargin = element.css('margin');

        let textareaElement = $('<div contenteditable />').text(originalText);
        element.replaceWith(textareaElement);
        textareaElement.attr('class', originalClasses)
            .attr('style', originalStyles)
            .css('margin', originalMargin)
            .addClass('editable_title')
            .css({'display': 'block', 'width': '100%'});

        // Restore the original title styles
        textareaElement.css({
            'font-size': parentElement.find('#text_voteTitle_h2').css('font-size'),
            'font-weight': parentElement.find('#text_voteTitle_h2').css('font-weight'),
            'color': parentElement.find('#text_voteTitle_h2').css('color')
        });

        textareaElement.on('input', function () {
            $grid.masonry('layout');
        });
    }

    // Function to make an option editable
    function makeOptionEditable(option, voteID) {
        let currentText = option.contents().filter(function() {
            return this.nodeType === 3; // Get only the text node
        }).text().trim(); // Get the text content without the percentage
        let originalStyles = option.attr('style');
        let optionId = option.attr('data-option-id');

        let optionWrapper = $('<div/>').addClass('option-wrapper');
        let inputElement = $('<div contenteditable />').text(currentText);
        let deleteIcon = $('<img/>').attr('src', '/images/icns/trash-fill.svg').addClass('delete-option-icon');

        inputElement.attr('class', 'editable_options')
            .attr('style', originalStyles)
            .attr('data-option-id', optionId)
            .attr('data-vote-id', voteID)
            .css({'display': 'block'});

        // Preserve the percentage span if it exists
        let percentageSpan = option.find('.vote-percentage');
        if (percentageSpan.length) {
            inputElement.after(percentageSpan);
        }

        optionWrapper.append(inputElement, deleteIcon);
        option.replaceWith(optionWrapper);

        // Handle delete option click
        deleteIcon.on('click', function () {
            const parentElement = $(this).closest('.card');
            const optionsList = parentElement.find(`#vote_option_list[data-vote-id="${voteID}"]`);
            optionWrapper.remove();
            checkOptionsCount(optionsList);
            $grid.masonry('layout'); // Update Masonry layout
        });

        inputElement.on('input', function () {
            $grid.masonry('layout');
        });
    }

    function fetchDateModified() {
        const deferreds = [];
        $('.p-last-modified').each(function() {
            const element = $(this);
            const voteId = element.data('vote-id');
            const deferred = $.Deferred();
            deferreds.push(deferred);
            $.ajax({
                url: '/api/vote/getDateModified',
                method: 'POST',
                data: { voteId: voteId },
                success: function(response) {
                    element.attr('data-date-modified', response.dateModified);
                    deferred.resolve();
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching date modified:', error);
                    deferred.reject();
                }
            });
        });

        $.when.apply($, deferreds).then(function() {
            updateAllTimeAgo();
        });
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
        if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo`;
        return `${Math.floor(diffInSeconds / 31536000)} yr`;
    }

    // Call updateTimeAgo initially
    function updateAllTimeAgo() {
        $('.p-last-modified').each(function() {
            const element = $(this);
            const dateModifiedAttr = element.attr('data-date-modified');
            if (dateModifiedAttr) {
                const dateModified = new Date(dateModifiedAttr);
                const timeAgoSpan = element.find('.time-ago');
                timeAgoSpan.text(formatTimeAgo(dateModified));
            }
        });
    }

    async function getVoteStatistics(voteID) {
        try {
            const response = await fetch('/api/vote/getStat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({voteId: voteID}),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch vote results: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching vote statistics:', error);
            return null;
        }
    }

    function updateCardContent(card, voteData, newVoteId) {
        // Update vote ID
        card.attr('data-vote-id', newVoteId);

        // Update title
        card.find('#text_voteTitle_h2').text(voteData.voteTitle).attr('data-vote-id', newVoteId);

        // Update options
        const optionsList = card.find('#vote_option_list');
        optionsList.attr('data-vote-id', newVoteId);

        // Clear existing options
        optionsList.empty();

        // Add updated options
        voteData.voteOptions.forEach((option) => {
            const optionElement = $('<p>')
                .addClass('text_voteOptions_p')
                .attr({
                    'data-vote-id': newVoteId,
                    'data-option-id': option.id
                });

            // Add the option text as a text node
            optionElement.append(document.createTextNode(option.name));

            // Add the percentage span
            const percentageSpan = $('<span>').addClass('vote-percentage').text('0%');
            optionElement.append(percentageSpan);

            optionsList.append(optionElement);
        });

        // Update edit button
        card.find('#btn-save-changes').attr({
            'src': '/images/icns/pencil-square.svg',
            'id': 'btn-edit'
        });

        // Trigger an update of the vote display
        updateVoteDisplay(card);
    }

    async function updateVoteDisplay(card) {
        // Convert to jQuery object if it's not already one
        const $card = $(card);
        const voteID = $card.attr('data-vote-id');

        // If voteID is 'new-temporarily', skip updating as it won't have statistics yet
        if (voteID === 'new-temporarily') {
            console.log('Skipping update for new vote card');
            return;
        }

        const options = $card.find('.text_voteOptions_p');

        try {
            const voteResults = await getVoteStatistics(voteID);

            if (!voteResults || typeof voteResults.options !== 'object') {
                console.log('No vote results available for', voteID);
                resetVoteStatistics($card);
                return;
            }

            const hasVotes = Object.values(voteResults.options).some(option => option.percentage > 0);

            if (hasVotes) {
                $card.addClass('voted');
            } else {
                $card.removeClass('voted');
            }

            let maxPercentage = 0;
            let maxOptionId = null;

            options.each(function() {
                const option = $(this);
                const optionID = option.data('option-id');
                const optionResult = voteResults.options[optionID];

                let percentageSpan = option.find('.vote-percentage');
                if (percentageSpan.length === 0) {
                    percentageSpan = $('<span class="vote-percentage"></span>');
                    option.append(percentageSpan);
                }

                if (hasVotes && optionResult) {
                    const percentage = optionResult.percentage.toFixed(1);
                    percentageSpan.text(`${percentage}%`);
                    option.css('--option-percentage', `${percentage}%`);

                    if (optionResult.percentage > maxPercentage) {
                        maxPercentage = optionResult.percentage;
                        maxOptionId = optionID;
                    }
                } else {
                    percentageSpan.text('0%');
                    option.css('--option-percentage', '0%');
                }
            });

            // Highlight the most voted option
            options.each(function() {
                const option = $(this);
                if (option.data('option-id') === maxOptionId) {
                    option.addClass('most-voted');
                } else {
                    option.removeClass('most-voted');
                }
            });

        } catch (error) {
            console.error('Error updating vote display:', error);
            resetVoteStatistics($card);
        }

        // Recalculate Masonry layout
        $grid.masonry('layout');
    }

// Call updateAllTimeAgo initially
    fetchDateModified();

// Update time ago every minute
    setInterval(updateAllTimeAgo, 60000);

    $('.card').each(function() {
        const $card = $(this);
        const voteID = $card.attr('data-vote-id');
        if (voteID && voteID !== 'new-temporarily') {
            updateVoteDisplay($card);
        }
    });

});