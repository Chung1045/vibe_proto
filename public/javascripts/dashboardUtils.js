$(document).ready(function(){
    // Initialize Masonry
    var $grid = $('#container').masonry({
        itemSelector: '.card',
        columnWidth: '.card',
        gutter: 20,
        fitWidth: true
    });

    $(document).on('click', '#btn-edit', function(){
        let parentElement = $(this).closest('.card');
        let voteID = parentElement.attr('data-vote-id');

        //<div class="card" id="vote_card" data-vote-id="<%= vote.voteId %>">
        const editButton = parentElement.find('#btn-edit');
        const title = parentElement.find(`#text_voteTitle_h2[data-vote-id="${voteID}"]`);
        const options = parentElement.find(`.text_voteOptions_p[data-vote-id="${voteID}"]`);

        $("<p>Title</p>").insertBefore($(title));
        $("<p>Options</p>").insertBefore($(options).first());
        // Create a div for editable options and append it after the parentElement
        $('<div/>').text("Add new options").addClass("editable_addOptions").insertAfter($(options).last());

        // Create a horizontal rule and append it after the parentElement
        $("<hr>").addClass("editable_hr").insertAfter($(options).last());
        $(editButton).attr('src', '/images/icns/check2.svg');

        let titleText = title.text();
        let originalClasses = title.attr('class');
        let originalStyles = title.attr('style');
        let originalMargin = title.css('margin');

         // Create <div> element for the title
        let textareaElement = $('<div contenteditable />').text(titleText);

        // Replace <h2> with <div> and preserve styling
        title.replaceWith(textareaElement);
        textareaElement.attr('class', originalClasses)
            .attr('style', originalStyles)
            .css('margin', originalMargin)
            .addClass('editable_title')
            .css({'display': 'block', 'width': '100%'});

        // Handle options
        options.each(function() {
            let currentText = $(this).text();
            let originalStyles = $(this).attr('style');
            let originalMargin = $(this).css('margin');

            // Create <div> element for each option
            let inputElement = $('<div contenteditable />').text(currentText);

            // Replace <p> with input field and preserve styling
            $(this).replaceWith(inputElement);
            inputElement.attr('class', 'editable_options')
                .attr('style', originalStyles)
                .css('margin', originalMargin)
                .css({'display': 'block'});
        });

        // Trigger Masonry layout after changes
        $grid.masonry('layout');

        // Handle input events to adjust Masonry layout
        textareaElement.on('input', function() {
            $grid.masonry('layout'); // Recalculate layout
        });

        // Handle input for options
        parentElement.find('.editable_options').on('input', function() {
            $grid.masonry('layout'); // Recalculate layout
        });
    });
});
