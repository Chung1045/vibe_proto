$(document).ready(function(){
    function showAlert(message, type = 'danger') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alertContainer').append(alertHtml);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').fadeOut(300, function() {
                $(this).remove();
            });
        }, 10000);
    }

    $(document).on('click', '#btn-register', function(e){
        e.preventDefault(); // Prevent form submission

        let userEmail = $('#input_email').val().trim();
        let userName = $('#input_userName').val().trim();
        let userPhoneNum = $('#input_phoneNumber').val().trim();
        let userPassword = $('#input_password').val();
        let confirmPassword = $('#input_confirmPassword').val();

        // Validation flags
        let hasErrors = false;

        // Check for empty fields
        let emptyFields = [];
        if (!userEmail) emptyFields.push('Email');
        if (!userName) emptyFields.push('Username');
        if (!userPhoneNum) emptyFields.push('Phone number');
        if (!userPassword) emptyFields.push('Password');
        if (!confirmPassword) emptyFields.push('Confirm Password');

        if (emptyFields.length > 0) {
            showAlert(`Please fill in the following fields: ${emptyFields.join(', ')}`);
            hasErrors = true;
        }

        // Check password match
        if (userPassword && confirmPassword && userPassword !== confirmPassword) {
            showAlert('Your password and confirm password do not match, please check again');
            hasErrors = true;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (userEmail && !emailRegex.test(userEmail)) {
            showAlert('Please enter a valid email address');
            hasErrors = true;
        }

        // If no errors, proceed with registration
        if (!hasErrors) {
            // Add your registration logic here
            $.ajax({
                url: '/api/user/register',
                method: 'POST',
                data: JSON.stringify({
                    username: userName,
                    password: userPassword,
                    email: userEmail,
                    phoneNum: userPhoneNum,
                    profilePicURL: null
                }),
                contentType: 'application/json',
                success: function(response) {
                    if (response.success) {
                        showAlert("Registration successful! Redirecting to homepage......", 'success');
                        // Redirect to the homepage after 3 seconds
                        setTimeout(function() {
                            window.location.href = '/index'; // Change this to your homepage URL
                        }, 3000); // 3000 milliseconds = 3 seconds
                    } else {
                        showAlert("Registration failed: " + response.message, 'danger');
                    }
                },
                error: function(xhr, status, error) {
                    // Check if the response contains a JSON object with a message
                    const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Registration failed, please try again.";
                    showAlert(errorMessage, 'danger');
                }
            });
        }
    });

    // Close alert when clicking the close button
    $(document).on('click', '.alert .btn-close', function() {
        $(this).closest('.alert').fadeOut(300, function() {
            $(this).remove();
        });
    });

    $('#togglePassword1, #togglePassword2').on('click', function() {
        const input = $(this).closest('.form-group').find('input');
        const icon = $(this).find('i');

        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
});