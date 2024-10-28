$(document).ready(function(){
    $(document).on('click', '#btn-edit', function(){
        let parentElement = $(this).parent().parent();
        let voteID = parentElement.attr('data-vote-id');

        const options = document.querySelectorAll(`.text_voteOptions_p[data-vote-id="${voteID}"]`);

        options.forEach(function(option) {
            let currentText = $(option).text(); // Get current text
            let originalClasses = $(option).attr('class'); // Get original classes
            let originalStyles = $(option).attr('style');  // Get inline styles
            let inputElement = $('<input type="text" />').val(currentText); // Create input element

            // Replace <p> with input field and preserve styling
            $(option).replaceWith(inputElement);
            inputElement.attr('class', originalClasses); // Reapply classes to input
            inputElement.attr('style', originalStyles);  // Reapply styles to input

            // // Save on blur or Enter key
            // inputElement.on('blur keydown', function(e) {
            //     if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
            //         let newText = $(this).val(); // Get updated text
            //         let newParagraph = $('<p></p>').text(newText); // Create new <p>
            //         newParagraph.attr('class', originalClasses); // Reapply original classes
            //         newParagraph.attr('style', originalStyles);  // Reapply original styles
            //         $(this).replaceWith(newParagraph); // Replace input with <p>
            //     }
            // });
        });
    });
});
