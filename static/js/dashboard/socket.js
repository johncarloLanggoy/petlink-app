// ── SOCKET.IO CONNECTION ────────────────────────────────────────────

import { getLoggedInEmail } from './utils.js';

let socket = null;
let currentStaffEmail = null;

// ── Connect Socket ──────────────────────────────────────────────────
export function connectSocket() {
    // ── Guard: check if Socket.IO client is loaded ─────────────────
    if (typeof io === 'undefined') {
        console.error('❌ [Socket] Socket.IO client not loaded. Please add <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.min.js"></script> to the page.');
        return;
    }
    
    if (socket && socket.connected) {
        console.log('✅ [Socket] Already connected');
        return;
    }
    
    console.log('🔌 [Socket] Connecting...');
    socket = io();
    
    const currentUser = getLoggedInEmail();
    if (currentUser) {
        socket.emit('register_user', { email: currentUser });
        console.log('🔌 [Socket] Registered user:', currentUser);
    }
    
    // ── NEW MESSAGE HANDLER ─────────────────────────────────────────
    socket.on('new_message', function(data) {
        const loggedInUser = getLoggedInEmail();
        
        console.log('📩 [Socket] new_message received:', data);
        console.log('📩 [Socket] Logged in user:', loggedInUser);
        
        // Only handle messages involving the logged-in user
        if (data.receiver === loggedInUser || data.sender === loggedInUser) {
            
            // ✅ Dynamic import to avoid circular dependency
            import('./messages.js').then(module => {
                // ── 1. Update unread count and badge ──────────────
                module.loadUnreadCount();
                setTimeout(function() { 
                    module.loadUnreadCount(); 
                }, 500);
                module.updateMessageBadge();
                
                // ── 2. Reload conversation if on messages section ──
                import('./sidebar.js').then(sidebarModule => {
                    const section = sidebarModule.getCurrentSection();
                    console.log('📩 [Socket] Current section:', section);
                    
                    if (section === 'messages') {
                        // Reload staff list to update unread counts
                        module.loadStaffConversations();
                        
                        const activeStaffEmail = module.currentStaffEmail;
                        console.log('📩 [Socket] Active staff email:', activeStaffEmail);
                        console.log('📩 [Socket] Message sender:', data.sender);
                        console.log('📩 [Socket] Message receiver:', data.receiver);
                        
                        // ── Reload the active conversation ─────────────
                        // IF the message involves the currently-open staff member
                        if (activeStaffEmail && 
                            (data.sender === activeStaffEmail || data.receiver === activeStaffEmail)) {
                            console.log('📩 [Socket] Reloading conversation with:', activeStaffEmail);
                            setTimeout(() => {
                                module.loadCustomerConversation(activeStaffEmail);
                            }, 100);
                        } 
                        // ── Auto-open conversation if none is active ───
                        else if (!activeStaffEmail && data.sender && data.sender !== loggedInUser) {
                            console.log('📩 [Socket] No active conversation, auto-opening with:', data.sender);
                            setTimeout(() => {
                                module.loadCustomerConversation(data.sender);
                            }, 100);
                        }
                    } else {
                        console.log('📩 [Socket] Not on messages section — only updating badge');
                    }
                }).catch(err => {
                    console.error('❌ [Socket] Failed to load sidebar module:', err);
                });
            }).catch(err => {
                console.error('❌ [Socket] Failed to load messages module:', err);
            });
        } else {
            console.log('📩 [Socket] Ignoring message (not related to logged-in user)');
        }
    });
    
    // ── USER TYPING HANDLER ─────────────────────────────────────────
    socket.on('user_typing', function(data) {
        console.log('⌨️ [Socket] user_typing:', data);
        
        // Only show typing indicator if the sender is the active staff member
        if (data.sender === currentStaffEmail) {
            showTypingIndicator(data.is_typing);
        }
    });
    
    // ── MESSAGE SENT CONFIRMATION ───────────────────────────────────
    socket.on('message_sent', function(data) {
        if (data.success) {
            console.log('✅ [Socket] Message sent confirmed');
        }
    });
    
    // ── CONNECT EVENT ───────────────────────────────────────────────
    socket.on('connect', function() {
        console.log('✅ [Socket] Connected to WebSocket server, SID:', socket.id);
        
        const currentUser = getLoggedInEmail();
        if (currentUser) {
            socket.emit('register_user', { email: currentUser });
            console.log('✅ [Socket] Re-registered user on connect:', currentUser);
        }
        
        // Refresh unread count and badge on connect
        import('./messages.js').then(module => {
            module.loadUnreadCount();
            module.updateMessageBadge();
        }).catch(err => {
            console.error('❌ [Socket] Failed to refresh on connect:', err);
        });
    });
    
    // ── DISCONNECT EVENT ────────────────────────────────────────────
    socket.on('disconnect', function() {
        console.log('❌ [Socket] Disconnected from WebSocket server');
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
        console.warn('⚠️ [Socket] Socket not connected. Message will not be sent via WebSocket.');
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