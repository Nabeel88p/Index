import { createChat, getChats, addMessage, markAsRead } from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
    // Security check & personalization
    const loggedInTechnician = JSON.parse(sessionStorage.getItem('loggedInTechnician'));
    if (!loggedInTechnician) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('welcome-message').textContent = `أهلاً بك، ${loggedInTechnician.name}`;

    const newOrdersList = document.getElementById('new-orders-list');
    const myOrdersList = document.getElementById('my-orders-list');
    const activeChatsList = document.getElementById('active-chats-list');
    const chatModal = document.getElementById('chat-modal');
    const chatHeader = document.getElementById('chat-header');
    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const closeChatBtn = document.querySelector('.close-chat-btn');
    let currentChatOrderId = null;

    const getOrders = () => JSON.parse(localStorage.getItem('orders')) || [];
    const saveOrders = (orders) => localStorage.setItem('orders', JSON.stringify(orders));

    function renderOrders() {
        const allOrders = getOrders();
        
        const availableOrders = allOrders.filter(order => 
            order.status === 'new' && (order.service === loggedInTechnician.service || order.service.includes(loggedInTechnician.service))
        );
        
        const acceptedOrders = allOrders.filter(order => 
            order.status === 'accepted' && order.technicianId === loggedInTechnician.id
        );

        // Render New/Available Orders
        newOrdersList.innerHTML = '';
        if (availableOrders.length > 0) {
            availableOrders.forEach(order => {
                newOrdersList.innerHTML += `
                    <li data-order-id="${order.id}">
                        <div>
                            <strong>طلب #${order.id} - ${order.service}</strong>
                            <p style="font-size: 0.9em; color: #555;">العميل: ${order.name} | الموقع: ${order.location}</p>
                        </div>
                        <div class="actions">
                            <button class="approve-btn">قبول</button>
                            <button class="reject-btn">رفض</button>
                        </div>
                    </li>
                `;
            });
        } else {
            newOrdersList.innerHTML = '<p>لا توجد طلبات جديدة متاحة في تخصصك حالياً.</p>';
        }

        // Render Technician's Accepted Orders
        myOrdersList.innerHTML = '';
        if (acceptedOrders.length > 0) {
            acceptedOrders.forEach(order => {
                myOrdersList.innerHTML += `
                     <li data-order-id="${order.id}">
                        <div>
                            <strong>طلب #${order.id} - ${order.service}</strong>
                            <p style="font-size: 0.9em; color: #555;">العميل: ${order.name}</p>
                        </div>
                        <div class="actions">
                            <button class="chat-btn">دردشة</button>
                            <button class="complete-btn">إنهاء</button>
                        </div>
                    </li>
                `;
            });
        } else {
            myOrdersList.innerHTML = '<p>ليس لديك أي طلبات قيد التنفيذ.</p>';
        }

        addOrderActionListeners();
        renderActiveChats();
    }

    function handleOrderAction(orderId, action) {
        let orders = getOrders();
        const orderIndex = orders.findIndex(o => o.id == orderId);

        if (orderIndex > -1) {
            if (action === 'accept') {
                orders[orderIndex].status = 'accepted';
                orders[orderIndex].technicianId = loggedInTechnician.id;
                orders[orderIndex].technicianName = loggedInTechnician.name;
                // Create a chat for this order
                createChat(orders[orderIndex].id, orders[orderIndex].name, loggedInTechnician.id, loggedInTechnician.name);
            } else if (action === 'complete') {
                 orders[orderIndex].status = 'completed';
            } else if (action === 'reject') {
                // For simplicity, we'll just remove it from 'new' status.
                // A more robust system would handle this server-side.
                orders[orderIndex].status = 'viewed'; // so it no longer appears as 'new' to this tech
            }
            saveOrders(orders);
            renderOrders();
        }
    }

    function addOrderActionListeners() {
        newOrdersList.querySelectorAll('.approve-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.closest('li').dataset.orderId;
                handleOrderAction(orderId, 'accept');
            });
        });
        newOrdersList.querySelectorAll('.reject-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.closest('li').dataset.orderId;
                handleOrderAction(orderId, 'reject');
            });
        });

        myOrdersList.querySelectorAll('.chat-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.closest('li').dataset.orderId;
                openChat(orderId);
            });
        });
        myOrdersList.querySelectorAll('.complete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.closest('li').dataset.orderId;
                if (confirm('هل أنت متأكد من إنهاء هذا الطلب؟')) {
                    handleOrderAction(orderId, 'complete');
                }
            });
        });
    }

    // --- Chat Functions ---
    function renderActiveChats() {
        const chats = getChats().filter(c => c.technicianId === loggedInTechnician.id);
        chats.sort((a, b) => b.lastUpdate - a.lastUpdate);

        activeChatsList.innerHTML = '';
        if (chats.length > 0) {
            chats.forEach(chat => {
                const unreadCount = chat.technicianUnread > 0 ? `<span class="unread-badge">${chat.technicianUnread}</span>` : '';
                activeChatsList.innerHTML += `
                     <li data-order-id="${chat.orderId}" class="chat-list-item">
                        <span>محادثة مع ${chat.customerName} (طلب #${chat.orderId})</span>
                        ${unreadCount}
                    </li>
                `;
            });
            activeChatsList.querySelectorAll('.chat-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    openChat(item.dataset.orderId);
                });
            });
        } else {
            activeChatsList.innerHTML = '<li>لا توجد دردشات نشطة.</li>';
        }
    }
    
    function openChat(orderId) {
        currentChatOrderId = orderId;
        const chats = getChats();
        const chat = chats.find(c => c.orderId == orderId);

        if (chat) {
            markAsRead(orderId, 'technician');
            chatHeader.textContent = `الدردشة بخصوص طلب #${orderId} - ${chat.customerName}`;
            renderChatMessages(chat.messages);
            chatModal.style.display = 'flex';
            renderActiveChats(); // to update unread count
        }
    }

    function renderChatMessages(messages) {
        chatMessages.innerHTML = '';
        if (messages.length === 0) {
            chatMessages.innerHTML = '<p class="chat-notice">ابدأ المحادثة مع العميل.</p>';
        } else {
            messages.forEach(msg => {
                const msgEl = document.createElement('div');
                msgEl.classList.add('message', `message-${msg.sender}`);
                msgEl.innerHTML = `<p>${msg.text}</p><span class="timestamp">${msg.timestamp}</span>`;
                chatMessages.appendChild(msgEl);
            });
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function closeChat() {
        chatModal.style.display = 'none';
        currentChatOrderId = null;
    }

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text && currentChatOrderId) {
            addMessage(currentChatOrderId, 'technician', text);
            const chat = getChats().find(c => c.orderId == currentChatOrderId);
            renderChatMessages(chat.messages);
            messageInput.value = '';
            renderActiveChats(); // Update last update time
        }
    });

    closeChatBtn.addEventListener('click', closeChat);

    // Periodically check for new messages
    setInterval(() => {
        if (chatModal.style.display === 'flex' && currentChatOrderId) {
            // If chat is open, refresh messages
            const chat = getChats().find(c => c.orderId == currentChatOrderId);
            renderChatMessages(chat.messages);
        }
        // Always refresh the active chats list for notifications
        renderActiveChats();
    }, 5000);

    // Initial Load
    renderOrders();
});