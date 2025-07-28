document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    const errorMessage = document.getElementById('error-message');
    const passwordInput = document.getElementById('password');

    // In a real app, the password should never be stored in plaintext in the frontend.
    // This is a simulation using localStorage for persistence across refreshes.
    const getAdminPassword = () => {
        return localStorage.getItem('adminPassword') || '091230';
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const enteredPassword = passwordInput.value;
        const correctPassword = getAdminPassword();

        if (enteredPassword === correctPassword) {
            // Use sessionStorage to mark the user as logged in for this session
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            window.location.href = 'admin-dashboard.html';
        } else {
            errorMessage.style.display = 'block';
            passwordInput.style.border = '1px solid #dc3545';
        }
    });
});