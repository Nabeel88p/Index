import { getChats, saveChats, addMessage, markAsRead } from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');

    const orderStatusEl = document.getElementById('order-status');
    const orderDetailsEl = document.getElementById('order-details');
    const chatBox = document.getElementById('chat-box');
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const notFoundSection = document.getElementById('not-found');
    const orderInfoSection = document.getElementById('order-info');

    let currentOrder = null;
    let currentChat = null;

    function loadOrderAndChat() {
        if (!orderId) {
            showNotFound();
            return;
        }

        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        currentOrder = orders.find(o => o.id == orderId);

        if (!currentOrder) {
            showNotFound();
            return;
        }
        
        // Save order ID to session storage to remember the user
        sessionStorage.setItem('lastTrackedOrderId', orderId);

        orderInfoSection.style.display = 'block';
        notFoundSection.style.display = 'none';

        renderOrderDetails();
        loadChat();
    }

    function showNotFound() {
        orderInfoSection.style.display = 'none';
        notFoundSection.style.display = 'block';
    }

    function renderOrderDetails() {
        let statusText = 'قيد المراجعة';
        let statusClass = 'pending';
        if (currentOrder.status === 'accepted') {
            statusText = `تم القبول من قبل الفني: ${currentOrder.technicianName}`;
            statusClass = 'accepted';
        } else if (currentOrder.status === 'completed') {
            statusText = 'مكتمل';
            statusClass = 'completed';
        }
        
        orderStatusEl.innerHTML = `حالة الطلب: <span class="status-${statusClass}">${statusText}</span>`;
        orderDetailsEl.innerHTML = `
            <p><strong>رقم الطلب:</strong> #${currentOrder.id}</p>
            <p><strong>الخدمة:</strong> ${currentOrder.service}</p>
            <p><strong>الاسم:</strong> ${currentOrder.name}</p>
        `;

        if (currentOrder.status === 'accepted') {
            chatBox.style.display = 'block';
        } else {
            chatBox.style.display = 'none';
        }
    }

    function loadChat() {
        const chats = getChats();
        currentChat = chats.find(c => c.orderId == orderId);
        renderMessages();
        if (currentChat) {
             markAsRead(currentChat.orderId, 'customer');
        }
    }

    function renderMessages() {
        if (!currentChat) {
            chatMessages.innerHTML = '<p class="chat-notice">سيتم تفعيل الدردشة بعد قبول الفني للطلب.</p>';
            return;
        }
        
        chatMessages.innerHTML = '';
        currentChat.messages.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.classList.add('message', `message-${msg.sender}`);
            messageEl.innerHTML = `<p>${msg.text}</p><span class="timestamp">${msg.timestamp}</span>`;
            chatMessages.appendChild(messageEl);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text && currentChat) {
            addMessage(currentChat.orderId, 'customer', text);
            messageInput.value = '';
            loadChat(); // Reload and render
        }
    });

    // Check for new messages periodically
    setInterval(() => {
        if (currentChat) {
            const chats = getChats();
            const updatedChat = chats.find(c => c.orderId == orderId);
            if (updatedChat && updatedChat.messages.length > currentChat.messages.length) {
                currentChat = updatedChat;
                renderMessages();
            }
        }
        if(currentOrder) {
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const updatedOrder = orders.find(o => o.id == orderId);
            if(updatedOrder.status !== currentOrder.status) {
                 currentOrder = updatedOrder;
                 renderOrderDetails();
            }
        }
    }, 3000);

    // Initial load
    loadOrderAndChat();
});