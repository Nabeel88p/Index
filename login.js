document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // --- Simulated Login Logic ---
        // In a real app, this would be an API call to a server.
        const technicians = JSON.parse(localStorage.getItem('technicians')) || [];
        const foundTechnician = technicians.find(tech => tech.email === email && tech.password === password);

        if (foundTechnician) {
            if (foundTechnician.status === 'approved') {
                // Successful login
                console.log('Technician login successful');
                // Store logged-in technician's info
                sessionStorage.setItem('loggedInTechnician', JSON.stringify(foundTechnician));
                window.location.href = 'technician-dashboard.html';
            } else if (foundTechnician.status === 'pending') {
                errorMessage.textContent = 'حسابك قيد المراجعة. سيتم تفعيله بعد موافقة الإدارة.';
                errorMessage.style.display = 'block';
            } else if (foundTechnician.status === 'rejected') {
                 errorMessage.textContent = 'تم رفض طلب تسجيلك. الرجاء التواصل مع الإدارة.';
                 errorMessage.style.display = 'block';
            }
        } else {
            // Failed login
            errorMessage.textContent = 'بيانات الدخول غير صحيحة.';
            errorMessage.style.display = 'block';
        }
    });
});