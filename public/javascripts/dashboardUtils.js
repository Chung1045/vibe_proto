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
    <div class="card" id="vote_card" data-vote-id="1234567890" style="position: absolute; left: 20px; top: 20px;">
        <p>Title</p><div contenteditable="" class="editable_title" style="margin: 0px 0px 15px; display: block; width: 100%;">Which is your favourite programming languages?</div>
        <p>Options</p>
        <div id="vote_option_list" data-vote-id="1234567890">
            <div class="option-wrapper"><div contenteditable="" class="editable_options" data-option-id="1" data-vote-id="1234567890" style="display: block;">C++</div><img src="/images/icns/trash-fill.svg" class="delete-option-icon"></div>
            <div class="option-wrapper"><div contenteditable="" class="editable_options" data-option-id="2" data-vote-id="1234567890" style="display: block;">Java</div><img src="/images/icns/trash-fill.svg" class="delete-option-icon"></div>
            <div class="option-wrapper"><div contenteditable="" class="editable_options" data-option-id="3" data-vote-id="1234567890" style="display: block;">Python</div><img src="/images/icns/trash-fill.svg" class="delete-option-icon"></div>
        </div>
        <div class="div-edit-options"><hr class="editable_hr"><div class="editable_addOptions">Add new options</div></div>
        <div class="d-flex justify-content-end" id="div_container_action_button">
            <img src="/images/icns/trash-fill.svg" alt="icon" id="btn-delete">
            <img src="/images/icns/check2.svg" alt="icon" id="btn-edit">
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
                let voteEntry = document.querySelector(`.card[data-vote-id="${voteID}"]`);
                $(voteEntry).remove();
                $grid.masonry('layout');
            }
        }
    });

    // Function to add a new editable option
    function addNewOption(optionsList) {
        // Create the new editable option
        let newOptionWrapper = $('<div/>').addClass('option-wrapper');
        let newOption = $('<div contenteditable />').addClass('editable_options').text('New option');
        let deleteIcon = $('<img/>').attr('src', '/images/icns/trash-fill.svg').addClass('delete-option-icon');

        // Append the option and the delete icon to the wrapper
        newOptionWrapper.append(newOption, deleteIcon);
        optionsList.append(newOptionWrapper);

        // Handle input for the new option
        newOption.on('input', function () {
            $grid.masonry('layout'); // Recalculate layout when input changes
        });

        deleteIcon.on('click', function () {
            newOptionWrapper.remove();
            $grid.masonry('layout'); // Update Masonry layout
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

        // Make title editable
        makeElementEditable(title, parentElement);

        // Make options editable
        options.each(function () {
            makeOptionEditable($(this), voteID);
        });


        // Append the "Add new options" button after the options list
        divEditOptions.append(horizontalRule, newOptionsBt);
        optionsList.after(divEditOptions);

        // Change edit button icon
        editButton.attr('src', '/images/icns/check2.svg');

        // Check and update delete button visibility
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
        let currentText = option.text();
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

});