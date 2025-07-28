document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const submitButton = registerForm.querySelector('button[type="submit"]');

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const service = document.getElementById('service').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // --- Validation ---
        if (!name || !email || !phone || !service || !password) {
            errorMessage.textContent = 'الرجاء ملء جميع الحقول المطلوبة.';
            errorMessage.style.display = 'block';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
            errorMessage.style.display = 'block';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'كلمات المرور غير متطابقة.';
            errorMessage.style.display = 'block';
            return;
        }
        
        // In a real app, you'd check if the email is already registered on the server.
        // Here, we'll check localStorage.
        const technicians = JSON.parse(localStorage.getItem('technicians')) || [];
        if (technicians.some(tech => tech.email === email)) {
            errorMessage.textContent = 'هذا البريد الإلكتروني مسجل بالفعل.';
            errorMessage.style.display = 'block';
            return;
        }

        // --- Store New Technician ---
        const newTechnician = {
            id: Date.now(), // Simple unique ID
            name,
            email,
            phone,
            service,
            password, // In a real app, this should be hashed!
            status: 'pending' // 'pending', 'approved', 'rejected'
        };

        technicians.push(newTechnician);
        localStorage.setItem('technicians', JSON.stringify(technicians));

        // --- Show Success ---
        registerForm.style.display = 'none';
        successMessage.style.display = 'block';

        // Optional: Redirect to login page after a few seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 4000);
    });
});