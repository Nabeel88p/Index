export function getChats() {
    return JSON.parse(localStorage.getItem('chats')) || [];
}

export function saveChats(chats) {
    localStorage.setItem('chats', JSON.stringify(chats));
}

export function createChat(orderId, customerName, technicianId, technicianName) {
    const chats = getChats();
    if (!chats.find(c => c.orderId === orderId)) {
        chats.push({
            orderId: orderId,
            customerName: customerName,
            technicianId: technicianId,
            technicianName: technicianName,
            messages: [],
            technicianUnread: 0,
            customerUnread: 0,
            lastUpdate: Date.now()
        });
        saveChats(chats);
    }
}

export function addMessage(orderId, sender, text) {
    const chats = getChats();
    const chatIndex = chats.findIndex(c => c.orderId === orderId);

    if (chatIndex > -1) {
        chats[chatIndex].messages.push({
            sender: sender, // 'customer' or 'technician'
            text: text,
            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        });
        
        if (sender === 'customer') {
            chats[chatIndex].technicianUnread = (chats[chatIndex].technicianUnread || 0) + 1;
        } else if (sender === 'technician') {
            chats[chatIndex].customerUnread = (chats[chatIndex].customerUnread || 0) + 1;
        }
        chats[chatIndex].lastUpdate = Date.now();

        saveChats(chats);
        return true;
    }
    return false;
}

export function markAsRead(orderId, userType) {
     const chats = getChats();
    const chatIndex = chats.findIndex(c => c.orderId === orderId);
     if (chatIndex > -1) {
        if (userType === 'customer') {
            chats[chatIndex].customerUnread = 0;
        } else if (userType === 'technician') {
            chats[chatIndex].technicianUnread = 0;
        }
        saveChats(chats);
    }
}