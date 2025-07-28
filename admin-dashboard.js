import { getChats } from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
    // Security check: If not logged in, redirect to the login page.
    if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
        window.location.href = 'admin.html';
        return; // Stop script execution
    }

    const logoutBtn = document.getElementById('logout-btn');
    const chatViewerModal = document.getElementById('chat-viewer-modal');
    const closeChatViewerBtn = document.querySelector('.close-chat-viewer-btn');
    const chatViewerHeader = document.getElementById('chat-viewer-header');
    const chatViewerMessages = document.getElementById('chat-viewer-messages');
    const passwordForm = document.getElementById('password-change-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // --- Mock Data ---
    // In a real app, orders would come from a server, not mock data.
    // We will use localStorage orders for consistency.
    const getOrders = () => JSON.parse(localStorage.getItem('orders')) || [];
    // Technicians will now be managed via localStorage
    const getTechnicians = () => JSON.parse(localStorage.getItem('technicians')) || [];
    const saveTechnicians = (technicians) => localStorage.setItem('technicians', JSON.stringify(technicians));

    // --- Populate UI ---
    function populateLists() {
        // Populate Orders from localStorage
        const ordersList = document.getElementById('orders-list');
        const allOrders = getOrders().sort((a,b) => b.id - a.id).slice(0, 5); // get latest 5
        ordersList.innerHTML = '';
        if (allOrders.length > 0) {
            allOrders.forEach(order => {
                let statusText, statusClass;
                switch(order.status) {
                    case 'new': statusText = 'جديد'; statusClass = 'status-pending'; break;
                    case 'accepted': statusText = 'قيد التنفيذ'; statusClass = 'status-active'; break;
                    case 'completed': statusText = 'مكتمل'; statusClass = 'status-completed'; break; // You can add style for this
                    default: statusText = 'غير معروف'; statusClass = '';
                }
                ordersList.innerHTML += `
                    <li>
                        <span>طلب #${order.id} - ${order.service} (${order.name})</span>
                        <span class="${statusClass}">${statusText}</span>
                    </li>`;
            });
        } else {
            ordersList.innerHTML = '<li>لا توجد طلبات حالياً.</li>';
        }

        const allTechnicians = getTechnicians();
        const approvedTechnicians = allTechnicians.filter(t => t.status === 'approved');
        const pendingTechnicians = allTechnicians.filter(t => t.status === 'pending');

        const techniciansList = document.getElementById('technicians-list');
        techniciansList.innerHTML = '';
        if (approvedTechnicians.length > 0) {
            approvedTechnicians.forEach(tech => {
                techniciansList.innerHTML += `
                    <li>
                        <span>${tech.name} (${tech.service})</span>
                        <span class="status-active">معتمد</span>
                    </li>`;
            });
        } else {
            techniciansList.innerHTML = '<li>لا يوجد فنيون معتمدون حالياً.</li>';
        }

        const pendingTechniciansList = document.getElementById('pending-technicians-list');
        pendingTechniciansList.innerHTML = '';
        if (pendingTechnicians.length > 0) {
            pendingTechnicians.forEach(tech => {
                pendingTechniciansList.innerHTML += `
                    <li data-tech-id="${tech.id}">
                        <span>${tech.name} - ${tech.email} (تخصص: ${tech.service})</span>
                        <div class="actions">
                            <button class="approve-btn">موافقة</button>
                            <button class="reject-btn">رفض</button>
                        </div>
                    </li>
                `;
            });
        } else {
            pendingTechniciansList.innerHTML = '<li>لا توجد طلبات تسجيل جديدة.</li>';
        }
        addApprovalEventListeners();
        populateChatsList();
    }

    function handleApproval(techId, action) {
        let technicians = getTechnicians();
        const techIndex = technicians.findIndex(t => t.id == techId);
        if (techIndex > -1) {
            if (action === 'approve') {
                technicians[techIndex].status = 'approved';
                saveTechnicians(technicians);
            } else { // 'reject'
                technicians[techIndex].status = 'rejected'; // Set status to rejected instead of deleting
                saveTechnicians(technicians);
            }
            populateLists(); // Refresh the lists
        }
    }

    function addApprovalEventListeners() {
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const techId = e.target.closest('li').dataset.techId;
                handleApproval(techId, 'approve');
            });
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const techId = e.target.closest('li').dataset.techId;
                handleApproval(techId, 'reject');
            });
        });
    }

    // --- Chat Monitoring ---
    function populateChatsList() {
        const chatsList = document.getElementById('chats-list');
        const chats = getChats().sort((a, b) => b.lastUpdate - a.lastUpdate);
        chatsList.innerHTML = '';

        if (chats.length > 0) {
            chats.forEach(chat => {
                chatsList.innerHTML += `
                    <li data-order-id="${chat.orderId}">
                        <span>فني: ${chat.technicianName} / عميل: ${chat.customerName} (طلب #${chat.orderId})</span>
                        <a href="#" class="view-chat-btn">مراقبة</a>
                    </li>
                `;
            });

            document.querySelectorAll('.view-chat-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const orderId = e.target.closest('li').dataset.orderId;
                    openChatViewer(orderId);
                });
            });
        } else {
            chatsList.innerHTML = '<li>لا توجد دردشات للمراقبة.</li>';
        }
    }

    function openChatViewer(orderId) {
        const chat = getChats().find(c => c.orderId == orderId);
        if (!chat) return;

        chatViewerHeader.textContent = `مراقبة الدردشة للطلب #${orderId}`;
        chatViewerMessages.innerHTML = '';
        if (chat.messages.length === 0) {
            chatViewerMessages.innerHTML = '<p class="chat-notice">لا توجد رسائل في هذه المحادثة بعد.</p>';
        } else {
            chat.messages.forEach(msg => {
                const msgEl = document.createElement('div');
                msgEl.classList.add('message', `message-${msg.sender}`);
                msgEl.innerHTML = `<p><strong>${msg.sender === 'customer' ? chat.customerName : chat.technicianName}:</strong> ${msg.text}</p><span class="timestamp">${msg.timestamp}</span>`;
                chatViewerMessages.appendChild(msgEl);
            });
        }
        chatViewerMessages.scrollTop = chatViewerMessages.scrollHeight;
        chatViewerModal.style.display = 'flex';
    }

    closeChatViewerBtn.addEventListener('click', () => {
        chatViewerModal.style.display = 'none';
    });

    // Handle logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isAdminLoggedIn');
        window.location.href = 'admin.html';
    });

    // Handle password change
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword.length < 6) {
            errorMessage.textContent = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.';
            errorMessage.style.display = 'block';
            return;
        }

        if (newPassword !== confirmPassword) {
            errorMessage.textContent = 'كلمات المرور غير متطابقة.';
            errorMessage.style.display = 'block';
            return;
        }

        // Save the new password to localStorage for persistence
        localStorage.setItem('adminPassword', newPassword);

        // Show success message and clear fields
        successMessage.style.display = 'block';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';

        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    });

    // --- Chart.js ---
    function renderChart() {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        if(!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو'],
                datasets: [{
                    label: 'الطلبات المكتملة',
                    data: [12, 19, 15, 25, 22, 30, 28],
                    borderColor: 'var(--primary-color)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'الإيرادات (ألف ريال)',
                    data: [5, 8, 7, 12, 10, 15, 14],
                    borderColor: 'var(--success-color)',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: { family: "'Cairo', sans-serif" }
                        }
                    },
                    x: {
                        ticks: {
                            font: { family: "'Cairo', sans-serif" }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: { family: "'Cairo', sans-serif" }
                        }
                    }
                }
            }
        });
    }

    // Initial load
    populateLists();
    renderChart();
    setInterval(populateLists, 10000); // Periodically refresh admin dashboard data
});