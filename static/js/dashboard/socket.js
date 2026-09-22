// ── SOCKET.IO CONNECTION ────────────────────────────────────────────

import { getLoggedInEmail } from './utils.js';
import { loadStaffConversations, loadUnreadCount, updateMessageBadge } from './messages.js';
import { getCurrentSection } from './sidebar.js';

let socket = null;
let currentStaffEmail = null;

// ── Connect Socket ──────────────────────────────────────────────────
export function connectSocket() {
    if (socket && socket.connected) return;
    
    socket = io();
    
    const currentUser = getLoggedInEmail();
    if (currentUser) {
        socket.emit('register_user', { email: currentUser });
    }
    
    socket.on('new_message', function(data) {
        const currentUser = getLoggedInEmail();
        
        if (data.receiver === currentUser || data.sender === currentUser) {
            // ✅ AGAD na i-update ang badge
            loadUnreadCount();
            // ✅ I-double call para siguradong updated (gaya ng admin)
            setTimeout(function() { loadUnreadCount(); }, 500);
            updateMessageBadge();
            
            const section = getCurrentSection();
            if (section === 'messages') {
                loadStaffConversations();
                // Reload conversation if needed - use dynamic import to avoid circular dependency
                import('./messages.js').then(module => {
                    if (module.currentStaffEmail) {
                        module.loadCustomerConversation(module.currentStaffEmail);
                    }
                });
            }
            
            // Log with image info
            const hasImage = data.image_data ? 'with image' : '';
            console.log(`New message from ${data.sender || 'Staff'} ${hasImage} - Unread count updated.`);
        }
    });
    
    socket.on('user_typing', function(data) {
        if (data.sender === currentStaffEmail) {
            showTypingIndicator(data.is_typing);
        }
    });
    
    socket.on('message_sent', function(data) {
        if (data.success) {
            console.log('Message sent confirmed');
        }
    });
    
    socket.on('connect', function() {
        console.log('Connected to WebSocket server');
        const currentUser = getLoggedInEmail();
        if (currentUser) {
            socket.emit('register_user', { email: currentUser });
        }
        // ✅ I-refresh ang unread count pagka-connect (gaya ng admin)
        loadUnreadCount();
        updateMessageBadge();
    });
    
    socket.on('disconnect', function() {
        console.log('Disconnected from WebSocket server');
        setTimeout(connectSocket, 2000);
    });
}

// ── Get Socket Instance ────────────────────────────────────────────
export function getSocket() {
    return socket;
}

// ── Send Message via Socket ───────────────────────────────────────
export function socketSendMessage(sender, receiver, message, subject = '') {
    if (!socket || !socket.connected) {
        console.warn('Socket not connected. Message will not be sent via WebSocket.');
        return;
    }
    
    socket.emit('send_message', {
        sender: sender,
        receiver: receiver,
        message: message,
        subject: subject,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
}

// ── Send Typing Indicator ─────────────────────────────────────────
export function socketTyping(receiver, isTyping = true) {
    if (!socket || !socket.connected) return;
    
    const sender = getLoggedInEmail();
    if (!sender || !receiver) return;
    
    socket.emit('typing', {
        sender: sender,
        receiver: receiver,
        is_typing: isTyping
    });
}

// ── Show Typing Indicator ─────────────────────────────────────────
let typingTimeout = null;

export function showTypingIndicator(isTyping) {
    const container = document.getElementById('conversationMessagesStaff');
    if (!container) return;
    
    let indicator = document.getElementById('typingIndicator');
    if (isTyping) {
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'typingIndicator';
            indicator.style.cssText = `
                display: flex;
                justify-content: flex-start;
                margin-bottom: 15px;
                padding: 10px 15px;
                background: #f7fbf3;
                border-radius: 12px;
                border-bottom-left-radius: 4px;
                max-width: 70%;
                color: #64748b;
                font-size: 13px;
                border: 1px solid #d4e5c4;
            `;
            indicator.innerHTML = 'Typing...';
            container.appendChild(indicator);
        }
        clearTimeout(typingTimeout);
    } else {
        if (indicator) {
            typingTimeout = setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 1000);
        }
    }
}

// ── Set current staff email for typing indicator ──────────────────
export function setCurrentStaffEmail(email) {
    currentStaffEmail = email;
}