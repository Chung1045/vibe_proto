function initializeDynamicButtons() {
    const buttons = document.querySelectorAll('.text_voteOptions_p');

    buttons.forEach(button => {
        function clickHandler() {
            const buttonId = this.getAttribute('data-option-id');
            const parentId = this.closest('.card').getAttribute('data-vote-id');
            alert(`You are now on VoteID ${parentId}\nYou clicked option ${buttonId}`);
            this.classList.add('clicked_selected');
            button.removeEventListener('click', clickHandler);
        }

        button.addEventListener('click', clickHandler);
    });
}


document.addEventListener('DOMContentLoaded', initializeDynamicButtons);