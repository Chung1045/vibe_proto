$(document).ready(() => {
    // Event listeners for edit buttons
    $("#edit-phoneNum-i").on("click", () => {
        showModal("phoneNum");
    });

    $("#edit-email-i").on("click", () => {
        showModal("email");
    });

    $("#edit-password-i").on("click", () => {
        showModal("password");
    });

    $("#edit-userName-i").on("click", () => {
        showModal("userName");
    });

    // Remove previous event listeners when modal is hidden
    $("#ModalDialogue").on('hidden.bs.modal', function () {
        $(".modal-save-bt").off('click');
        $(this).find('.modal-body').empty();
    });

    function showModal(type = "default") {
        const modal = $("#ModalDialogue");
        let modalContent = '';

        // Clear previous content and event listeners
        $(".modal-save-bt").off('click');

        switch(type) {
            case "phoneNum":
                modal.find(".modal-title").text("Change Phone Number");
                modalContent = `
                    <div class="mb-3">
                        <label for="new-phone" class="form-label">New Phone Number</label>
                        <input type="tel" id="new-phone" class="form-control">
                        <div id="phone-error" class="invalid-feedback"></div>
                    </div>`;

                $(".modal-cancel-bt").on("click", () => {
                    $("#ModalDialogue").modal('hide');
                });

                // Add phone-specific save handler
                $(".modal-save-bt").on("click", () => {
                    const newPhone = $("#new-phone").val();
                    // Reset error state
                    $("#new-phone").removeClass("is-invalid");
                    $("#phone-error").text("");
                    // Handle phone save logic
                    console.log("Saving new phone number:", newPhone);
                    $("#new-phone").prop('disabled', true);
                    updatePhoneNum(newPhone);
                });
                break;

            case "email":
                modal.find(".modal-title").text("Change Email");
                modalContent = `
                    <div class="mb-3">
                    <label for="new-email" class="form-label">New Email</label>
                        <input type="email" id="new-email" class="form-control">
                        <div id="email-error" class="invalid-feedback"></div>
                    </div>`;

                // Add email-specific save handler
                $(".modal-save-bt").on("click", () => {
                    const newEmail = $("#new-email").val();
                    // Handle email save logic
                    console.log("Saving new email:", newEmail);
                    updateEmail(newEmail);
                });

                $(".modal-cancel-bt").on("click", () => {
                   $("#ModalDialogue").modal('hide');
                });
                break;

            case "password":
                modal.find(".modal-title").text("Change Password");
                modalContent = `
                    <div class="mb-3">
                        <label for="current-password" class="form-label">Current Password</label>
                        <input type="password" id="current-password" class="form-control mb-2">
                        <div id="old-password-error" class="invalid-feedback"></div>
                        <label for="new-password" class="form-label">New Password</label>
                        <input type="password" id="new-password" class="form-control mb-2">
                        <div id="new-password-error" class="invalid-feedback"></div>
                        <label for="confirm-password">Confirm New Password</label>
                        <input type="password" id="confirm-password" class="form-control">
                        <div id="confirm-password-error" class="invalid-feedback"></div>
                    </div>`;

                $(".modal-cancel-bt").on("click", () => {
                    $("#ModalDialogue").modal('hide');
                });

                // Add password-specific save handler
                $(".modal-save-bt").on("click", () => {
                    const currentPassword = $("#current-password").val();
                    const newPassword = $("#new-password").val();
                    const confirmPassword = $("#confirm-password").val();

                    $("#current-password").prop('disabled', true);
                    $("#new-password").prop('disabled', true);
                    $("#confirm-password").prop('disabled', true);

                    $("#current-password").removeClass("is-invalid");
                    $("#new-password").removeClass("is-invalid");
                    $("#confirm-password").removeClass("is-invalid");
                    $("#old-password-error").text("");
                    $("#new-password-error").text("");
                    $("#confirm-password-error").text("");

                    // Handle password save logic
                    console.log("Saving new password");
                    updatePassword(currentPassword, newPassword, confirmPassword);
                });
                break;

            case "userName":
                modal.find(".modal-title").text("Change Username");
                modalContent = `
                    <div class="mb-3">
                        <label for="newUserName" class="form-label">New UserName</label>
                        <input type="text" id="newUserName" class="form-control mb-2">
                        <div id="userName-error" class="invalid-feedback"></div>
                    </div>`;

                $(".modal-save-bt").on("click", () => {
                    const newUserName = $("#newUserName").val();
                    updateUserName(newUserName);
                });

                $(".modal-cancel-bt").on("click", () => {
                    $("#ModalDialogue").modal('hide');
                });
                break;

                break;

            default:
                modalContent = '<p>Invalid modal type</p>';
        }

        // Update modal content and show
        modal.find(".modal-body").html(modalContent);
        modal.modal('show');
    }

    async function updatePhoneNum(input) {
        $("#new-phone").prop('disabled', true);
        $("#new-email").removeClass("is-invalid");
        $("#email-error").text("");
        await $.ajax({
            url: '/api/user/change-phone-number',
            method: 'POST',
            data: JSON.stringify({
                newPhoneNum: input
            }),
            contentType: 'application/json',
            success: function (response) {
                showAlert("Phone number updated successfully!", "success");
                fetchUserInfo();
                setTimeout(() => {
                    $("#ModalDialogue").modal('hide');
                }, 5000);

            },
            error: function (xhr) {
                let errorMessage = "An unknown error occurred";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    try {
                        const responseObj = JSON.parse(xhr.responseText);
                        errorMessage = responseObj.message || errorMessage;
                    } catch (e) {
                        errorMessage = xhr.responseText;
                    }
                }
                // Show error in the modal
                $("#new-phone").addClass("is-invalid");
                $("#phone-error").text(errorMessage);
                $("#new-phone").prop('disabled', false);
            }
        });
    }

    async function updateEmail(input) {
        await $.ajax({
            url: '/api/user/change-email',
            method: 'POST',
            data: JSON.stringify({
                newEmail: input
            }),
            contentType: 'application/json',
            success: function (response) {
                showAlert("Email updated successfully!", "success");
                fetchUserInfo();
                setTimeout(() => {
                    $("#ModalDialogue").modal('hide');
                }, 5000);
            },
            error: function (xhr, status, error) {
                let errorMessage = "An unknown error occurred";
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    try {
                        const responseObj = JSON.parse(xhr.responseText);
                        errorMessage = responseObj.message || errorMessage;
                    } catch (e) {
                        // If parsing fails, use the raw responseText
                        errorMessage = xhr.responseText;
                    }
                }
                // Show error in the modal
                $("#new-email").addClass("is-invalid");
                $("#phone-error").text(errorMessage);
            }
        });
    }

    async function updatePassword(currentPassword, newPassword, confirmPassword) {
        if (currentPassword === '' || newPassword === '' || confirmPassword === '') {
            showAlert("Please fill out all fields", "danger");
            $("#current-password").addClass("is-invalid");
            $("#new-password").addClass("is-invalid");
            $("#confirm-password").addClass("is-invalid");
        } else if (newPassword!== confirmPassword) {
            $("#new-password").addClass("is-invalid");
            $("#confirm-password").addClass("is-invalid");
            $("#new-password-error").text("Passwords do not match");
            $("#confirm-password-error").text("Passwords do not match");
        } else {
            await $.ajax({
                url: '/api/user/change-password',
                method: 'POST',
                data: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
                contentType: 'application/json',
                success: function (response) {
                    showAlert("Password updated successfully!", "success");
                    setTimeout(() => {
                        $("#ModalDialogue").modal('hide');
                    }, 5000);
                },
                error: function (xhr, status, error) {
                    let errorMessage = "An unknown error occurred";
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        try {
                            const responseObj = JSON.parse(xhr.responseText);
                            errorMessage = responseObj.message || errorMessage;
                        } catch (e) {
                            // If parsing fails, use the raw responseText
                            errorMessage = xhr.responseText;
                        }
                    }
                    // Show error in the modal
                    showAlert(errorMessage, "danger");
                    $("#current-password").prop('disabled', false);
                    $("#new-password").prop('disabled', false);
                    $("#confirm-password").prop('disabled', false);
                }
            });
        }
    }

    async function updateUserName(input) {
        $("#newUserName").prop('disabled', true);
        $("#newUserName").removeClass("is-invalid");
        $("#userName-error").text("");

        if (!input || input === '') {
            $("#newUserName").addClass("is-invalid");
            $("#userName-error").text("Please enter a username");
            $("#newUserName").prop('disabled', false);
        } else {
            await $.ajax({
                url: '/api/user/change-username',
                method: 'POST',
                data: JSON.stringify({
                    newUserName: input
                }),
                contentType: 'application/json',
                success: function (response) {
                    fetchUserInfo();
                    showAlert("Username updated successfully!", "success");
                    setTimeout(() => {
                        $("#ModalDialogue").modal('hide');
                    }, 5000);
                },
                error: function (xhr, status, error) {
                    let errorMessage = "An unknown error occurred";
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        try {
                            const responseObj = JSON.parse(xhr.responseText);
                            errorMessage = responseObj.message || errorMessage;
                        } catch (e) {
                            // If parsing fails, use the raw responseText
                            errorMessage = xhr.responseText;
                        }
                    }
                    // Show error in the modal
                    showAlert(errorMessage, "danger");
                    $("#newUserName").prop('disabled', false);
                    $("#newUserName").addClass("is-invalid");
                }
            });
        }
    }

    async function fetchUserInfo() {
        try {
            const response = await $.ajax({
                url: '/api/user/fetchInfo',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({}) // You can add any necessary data here
            });
            console.log('Raw response:', response);

            if (response.success && response.data) {
                // Extract relevant fields from response.data
                const { userName, email, phoneNumber } = response.data;
                console.log('Extracted email:', email);

                $("#field-userName-value").text(userName);
                $("#field-email-value").text(email);
                $("#field-phoneNum-value").text(phoneNumber);

                // Return an object with the extracted data
                return { userName, email, phoneNumber };
            } else {
                throw new Error(response.message || "Failed to fetch user info");
            }
        } catch (error) {
            let errorMessage = "An unknown error occurred";
            if (error.responseJSON && error.responseJSON.message) {
                errorMessage = error.responseJSON.message;
            } else if (error.responseText) {
                try {
                    const responseObj = JSON.parse(error.responseText);
                    errorMessage = responseObj.message || errorMessage;
                } catch (e) {
                    errorMessage = error.responseText;
                }
            }
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    }

    function showAlert(message, type = 'info', duration = 5000) {
        const alertId = 'alert-' + Date.now(); // Generate a unique ID for the alert
        const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade" role="alert" style="display: none;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
        const $alert = $(alertHtml);
        $("#alertContainer").append($alert);

        // Fade in the alert
        $alert.fadeIn(300, function () {
            $(this).addClass('show');
        });

        // Set up auto-dismiss
        const dismissAlert = () => {
            $alert.fadeOut(300, function () {
                $(this).remove();
            });
        };

        // Automatically remove the alert after the specified duration
        const timeoutId = setTimeout(dismissAlert, duration);

        // Clear the timeout if the alert is manually closed
        $alert.find('.btn-close').on('click', function () {
            clearTimeout(timeoutId);
            dismissAlert();
        });
    }

    async function main() {
        $(".card").hide()
        await fetchUserInfo();
        $(".card").fadeIn(500);
    }

    main();
});