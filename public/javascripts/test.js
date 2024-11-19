describe('Login Form Tests', () => {
    beforeEach(() => {
        render(Login); // Render the Login component before each test
    });

    // Test Case: Successful Login with Valid Credentials
    it('should log in successfully with valid credentials', async () => {
        // Simulate entering valid credentials
        await fireEvent.update(screen.getByPlaceholderText(' '), 'chung@example.com'); // Username/Email
        await fireEvent.update(screen.getByPlaceholderText('Password'), '1234567890'); // Password
        await fireEvent.click(screen.getByText('Login'));

        // Check for success message or redirection (this will depend on your implementation)
        expect(screen.getByText('Welcome')).toBeInTheDocument(); // Adjust based on your success message
    });

    // Test Case: Invalid Credentials
    it('should show an error message for incorrect credentials', async () => {
        await fireEvent.update(screen.getByPlaceholderText(' '), 'invalid@example.com');
        await fireEvent.update(screen.getByPlaceholderText('Password'), 'wrongPassword');
        await fireEvent.click(screen.getByText('Login'));

        expect(screen.getByText('credentials are incorrect')).toBeInTheDocument(); // Adjust based on actual error message
    });

    // Test Case: Password Visibility Toggle
    it('should toggle password visibility', async () => {
        const passwordInput = screen.getByPlaceholderText('Password');
        const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i }); // Adjust based on your implementation

        await fireEvent.click(toggleButton); // Click to toggle
        expect(passwordInput.getAttribute('type')).toBe('text'); // Check if password is visible

        await fireEvent.click(toggleButton); // Click again to toggle
        expect(passwordInput.getAttribute('type')).toBe('password'); // Check if password is hidden
    });

    // Test Case: Redirect to Sign-Up Page
    it('should redirect to the sign-up page when "Sign Up" is clicked', async () => {
        const signUpLink = screen.getByText('Sign Up');
        await fireEvent.click(signUpLink);

        // Assuming you have a router, you might check the route like this:
        expect(window.location.pathname).toBe('/register'); // Adjust based on your routing
    });
});