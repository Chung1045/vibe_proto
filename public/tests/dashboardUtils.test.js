import {describe, it, expect, beforeEach, vi} from 'vitest';
import {JSDOM} from 'jsdom';
import jquery from 'jquery';

let dom;
let window;
let document;
let $;

beforeEach(() => {
    // Set up a fresh simulated DOM before each test case
    dom = new JSDOM(`
    <div id="container">
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
    </div>`);

    // Reinitialize window and document from JSDOM
    window = dom.window;
    document = window.document;

    // Initialize a new jQuery instance with the new window
    $ = jquery(window);
});

// Updated checkOptionsCount function to match dashboardUtils.js
function checkOptionsCount(optionsList) {
    const totalOptions = optionsList.children('.option-wrapper').length;
    if (totalOptions < 3) {
        optionsList.find('.delete-option-icon').each((index, element) => setElementVisibility(element, false));
    } else {
        optionsList.find('.delete-option-icon').each((index, element) => setElementVisibility(element, true));
    }
}

function setElementVisibility(element, isVisible) {
    if (isVisible) {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

describe('should show remove option button if options are more than 3', () => {
    it('Add a new option to make the option to become 3', () => {
        const optionsList = $('#vote_option_list');
        expect(optionsList.children('.option-wrapper').length).toBe(3);
        optionsList.find('.delete-option-icon').each(function () {
            expect($(this).css('display')).not.toBe('none');
        });
        // Remove options to have only 2
        optionsList.find('.option-wrapper').last().remove();

        checkOptionsCount(optionsList);

        // Verify that the delete-option-icon is hidden
        const optionCount = optionsList.children('.option-wrapper').length;
        expect(optionCount < 3).toBe(true);
        optionsList.find('.delete-option-icon').each(function () {
            expect($(this).css('display')).toBe('none');
        });
    });
});

describe('should hide remove option button if options are less than 3', () => {
    it('Add a new option to make the option to become 3', () => {
        const optionsList = $('#vote_option_list');
        expect(optionsList.children('.option-wrapper').length).toBe(3);
        optionsList.find('.delete-option-icon').each(function () {
            expect($(this).css('display')).not.toBe('none');
        });
        // Remove options to have only 2
        optionsList.find('.option-wrapper').last().remove();

        checkOptionsCount(optionsList);

        // Verify that the delete-option-icon is hidden
        const optionCount = optionsList.children('.option-wrapper').length;
        expect(optionCount < 3).toBe(true);
        optionsList.find('.delete-option-icon').each(function () {
            expect($(this).css('display')).toBe('none');
        });
    });
});

// Import the function

describe('Check if the option increment by one when pressing add new options', () => {
    it('Add a new option', () => {
        const optionsList = $('#vote_option_list');
        const optionCount = optionsList.children('.option-wrapper').length;
        expect(optionCount).toBe(3);

        // mock the listener
        $('.editable_addOptions').on('click', function () {
            const newOptionWrapper = $('<div/>').addClass('option-wrapper');
            const newOption = $('<div contenteditable />').addClass('editable_options').text('New option');
            const deleteIcon = $('<img/>').attr('src', '/images/icns/trash-fill.svg').addClass('delete-option-icon');
            newOptionWrapper.append(newOption, deleteIcon);
            optionsList.append(newOptionWrapper);
        });

        $('.editable_addOptions').trigger('click');

        expect(optionsList.children('.option-wrapper').length).toBe(4);
    });
});

describe("Add a new vote", () => {
    it('Pressing the fab', () => {
        const container = $('#container');
        const cardAmount = container.children('.card').length;
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
            </div>  `);
        container.append(newCardStruct);
        expect(container.children('.card').length).toBe(cardAmount + 1);
    });
});
