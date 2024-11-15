$(document).ready(function(){
    $('#btn-login').on('click', function(e){
        e.preventDefault(); // Prevent form submission

        const username = $('#input_userName').val();
        const password = $('#input_password').val();

        // Basic client-side validation
        if (!username || !password) {
            alert('Please enter both username and password.');
            return;
        }

        // Disable the login button and show loading state
        $('#btn-login').prop('disabled', true).text('Logging in...');

        $.ajax({
            url: '/api/user/check-credentials',
            method: 'POST',
            data: JSON.stringify({
                username: username,
                password: password
            }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    console.log('Login successful', response);
                    // Redirect to dashboard or appropriate page
                    window.location.href = '/dashboard';
                } else {
                    console.log('Login failed', response);
                    alert(response.message || 'Login failed. Please try again.');
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to login', error);
                alert('An error occurred during login. Please try again.');
            },
            complete: function() {
                // Re-enable the login button and restore its text
                $('#btn-login').prop('disabled', false).text('Login');
                // Clear the password field for security
                $('#input_password').val('');
            }
        });
    });
});