$(document).ready(function(){
    $('#btn-login').on('click', function(e){
        e.preventDefault(); // Prevent form submission

        $("#input_userName").removeClass("is-invalid");
        $("#input_password").removeClass("is-invalid");
        $("#username-error").text("")
        $("#password-error").text("")

        const username = $('#input_userName').val();
        const password = $('#input_password').val();

        // Basic client-side validation
        if (!username || !password) {
            $("#input_userName").addClass("is-invalid");
            $("#input_password").addClass("is-invalid");
            $("#username-error").text("Please provide this field")
            $("#password-error").text("Please provide this field")

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

    async function fetchBackDrop() {
        try {
            const response = await $.ajax({
                url: '/api/getBackDrop',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({}),
            });

            if (response.success) {
                return response.backgroundURL;
            } else {
                throw new Error("Failed to fetch backdrop");
            }
        } catch (error) {
            console.error("Error fetching backdrop, likely that you don't have an Unsplash API key\n", error);
            return null;
        }
    }

    function loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = reject;
        });
    }

    async function main() {
        try {
            $("body").fadeIn(500);
            const imageUrl = await fetchBackDrop();
            if (imageUrl) {
                await loadImage(imageUrl);

                // Create a new div for the background
                const backgroundDiv = $('<div id="fade-background"></div>');
                backgroundDiv.css({
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0,
                    zIndex: -1
                });

                // Append the background div to the body
                $('body').append(backgroundDiv);

                // Fade in the background
                backgroundDiv.animate({ opacity: 1 }, 500);
            }
        } catch (error) {
            console.error('Error loading the image:', error);
        }
    }


    main();

});