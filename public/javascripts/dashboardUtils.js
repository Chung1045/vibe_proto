$(document).ready(function(){
    // Initialize Masonry
    var $grid = $('#container').masonry({
        itemSelector: '.card',
        columnWidth: '.card',
        gutter: 20,
        fitWidth: true
    });

    $(document).on('click', '#btn-delete', function(){
        let voteEntry = $(this).closest('.card');
        let voteID = voteEntry.attr('data-vote-id');
        $('#ModalDialogue').modal('show');
        $('#btn-modal-confirm').data('vote-id', voteID).data('action', 'delete');
    });

    $(document).on('click', '.editable_addOptions', function(){
        let parentElement = $(this).closest('.card');
        let voteID = parentElement.attr('data-vote-id');

        // Find the options list within the card
        const optionsList = parentElement.find(`#vote_option_list[data-vote-id="${voteID}"]`);

        // Create the new editable option
        let newOption = $('<div contenteditable />').addClass('editable_options').text('New option');

        // Append the new option to the options list
        optionsList.append(newOption);

        // Trigger Masonry layout to adjust the new card size
        $grid.masonry('layout');

        // Handle input for the new option
        newOption.on('input', function() {
            $grid.masonry('layout'); // Recalculate layout when input changes
        });
    });

    $(document).on('click', '#btn-edit', function(){
        let parentElement = $(this).closest('.card');
        let voteID = parentElement.attr('data-vote-id');

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
        let titleText = title.text();
        let originalClasses = title.attr('class');
        let originalStyles = title.attr('style');
        let originalMargin = title.css('margin');

        let textareaElement = $('<div contenteditable />').text(titleText);
        title.replaceWith(textareaElement);
        textareaElement.attr('class', originalClasses)
            .attr('style', originalStyles)
            .css('margin', originalMargin)
            .addClass('editable_title')
            .css({'display': 'block', 'width': '100%'});

        // Make options editable
        options.each(function() {
            let currentText = $(this).text();
            let originalStyles = $(this).attr('style');
            let originalMargin = $(this).css('margin');
            let optionId = $(this).attr('data-option-id');

            let inputElement = $('<div contenteditable />').text(currentText);
            inputElement.attr('class', 'editable_options')
                .attr('style', originalStyles)
                .css('margin', originalMargin)
                .attr('data-option-id', optionId)
                .attr('data-vote-id', voteID)
                .css({'display': 'block'});

            $(this).replaceWith(inputElement);
        });

        // Append the "Add new options" button after the options list
        divEditOptions.append(horizontalRule, newOptionsBt);
        optionsList.after(divEditOptions);

        // Change edit button icon
        editButton.attr('src', '/images/icns/check2.svg');

        // Update Masonry layout
        $grid.masonry('layout');

        // Handle input events for dynamic layout
        textareaElement.on('input', function() {
            $grid.masonry('layout');
        });

        parentElement.find('.editable_options').on('input', function() {
            $grid.masonry('layout');
        });
    });

    $(document).on('click', '#btn-modal-confirm', function(){
        let voteID = $(this).data('vote-id'); // Retrieve voteID from data attribute
        if (voteID !== undefined) {
            if ($(this).data('action') === 'delete') {
                let voteEntry = document.querySelector(`.card[data-vote-id="${voteID}"]`);
                $(voteEntry).remove();
                $grid.masonry('layout');
            }
        }
    });

});
