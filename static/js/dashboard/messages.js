// ── MESSAGE MANAGEMENT ──────────────────────────────────────────────

import { 
    fetchMessages, 
    fetchReceivedMessages,
    fetchConversation,
    fetchCustomerConversation,
    sendMessageAPI,
    fetchUnreadCount as fetchUnreadCountAPI,
    markMessagesRead
} from './services.js';
import { showToast, getLoggedInEmail } from './utils.js';
import { getSocket, socketSendMessage, socketTyping } from './socket.js';
import { getCurrentSection } from './sidebar.js';

// ── EXPORT THIS SO OTHER FILES CAN USE IT ──────────────────────────
export let currentStaffEmail = null;

// ── EMOJI PICKER ──────────────────────────────────────────────────────
let emojiPickerVisible = false;

// ── Toggle Emoji Picker ───────────────────────────────────────────
export function toggleEmojiPicker() {
    console.log('🔍 Toggle emoji picker called');
    
    let picker = document.getElementById('emojiPicker');
    
    if (!picker) {
        console.warn('⚠️ Emoji picker not found, reinitializing...');
        initEmojiPicker();
        picker = document.getElementById('emojiPicker');
        if (picker) {
            emojiPickerVisible = true;
            picker.classList.add('visible');
            console.log('✅ Emoji picker recreated and shown');
        }
        return;
    }
    
    emojiPickerVisible = !emojiPickerVisible;
    console.log('🔍 Emoji picker visibility:', emojiPickerVisible);
    
    if (emojiPickerVisible) {
        picker.classList.add('visible');
        console.log('✅ Emoji picker shown');
    } else {
        picker.classList.remove('visible');
        console.log('✅ Emoji picker hidden');
    }
}

// ── Insert Emoji ──────────────────────────────────────────────────
export function insertEmoji(emoji) {
    let input = document.getElementById('replyMessageStaff');
    
    if (!input) {
        const messagesSection = document.getElementById('section-messages');
        if (messagesSection) {
            input = messagesSection.querySelector('#replyMessageStaff');
        }
    }
    
    if (!input) {
        console.warn('⚠️ Reply input not found for emoji insertion');
        return;
    }
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + emoji.length;
    
    if (emojiPickerVisible) {
        toggleEmojiPicker();
    }
}

// ── Initialize Emoji Picker ──────────────────────────────────────
export function initEmojiPicker() {
    const existingPicker = document.getElementById('emojiPicker');
    if (existingPicker) {
        existingPicker.remove();
    }
    
    let footer = document.querySelector('.conversation-footer');
    
    if (!footer) {
        const messagesSection = document.getElementById('section-messages');
        if (messagesSection) {
            footer = messagesSection.querySelector('.conversation-footer');
        }
    }
    
    if (!footer) {
        footer = document.querySelector('#myMessagesContainer .conversation-footer');
    }
    
    if (!footer) {
        console.warn('⚠️ Conversation footer not found for emoji picker');
        return;
    }
    
    footer.style.position = 'relative';
    
    createEmojiPicker(footer);
}

function createEmojiPicker(container) {
    const existingPicker = document.getElementById('emojiPicker');
    if (existingPicker) {
        existingPicker.remove();
    }
    
    const picker = document.createElement('div');
    picker.id = 'emojiPicker';
    picker.style.cssText = `
        display: none;
        position: absolute;
        bottom: 75px;
        right: 0;
        background: #ffffff;
        border: 1px solid #d4e5c4;
        border-radius: 12px;
        padding: 12px;
        width: 300px;
        max-height: 250px;
        overflow-y: auto;
        flex-wrap: wrap;
        gap: 6px;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(123, 160, 91, 0.2);
        flex-direction: row;
        align-content: flex-start;
    `;
    
    const emojis = [
        '😊', '😂', '❤️', '🐶', '🐱', '👍', '👋', '🙏', '💪', '✨',
        '⭐', '🎉', '🔥', '💯', '🙌', '😍', '🥰', '😘', '💕', '💖',
        '🐾', '🏥', '💉', '🩺', '🐕', '🐈', '🦮', '🐩', '🐈‍⬛', '🦴',
        '🍖', '🎾', '🏠', '📅', '⏰', '📌', '✅', '❌', '⚠️', '💬',
        '👋', '🤝', '💐', '🌹', '🌺', '🌻', '🌈', '☀️', '🌟', '💫',
        '😅', '🤣', '🥹', '😭', '😤', '😡', '🤬', '🥺', '😱', '🤯',
        '🥳', '🤩', '😎', '🤓', '🥸', '🤠', '🤑', '😇', '😈', '👿',
        '🎵', '🎶', '🎧', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎭'
    ];
    
    emojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.type = 'button';
        btn.style.cssText = `
            width: 36px;
            height: 36px;
            border: 1px solid #d4e5c4;
            background: #ffffff;
            border-radius: 8px;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.2s ease;
            color: #334155;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;
        btn.onmouseover = () => { 
            btn.style.background = '#f7fbf3';
            btn.style.borderColor = '#7ba05b';
            btn.style.transform = 'scale(1.1)';
        };
        btn.onmouseout = () => { 
            btn.style.background = '#ffffff';
            btn.style.borderColor = '#d4e5c4';
            btn.style.transform = 'scale(1)';
        };
        btn.onclick = () => insertEmoji(emoji);
        picker.appendChild(btn);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.type = 'button';
    closeBtn.style.cssText = `
        width: 36px;
        height: 36px;
        border: none;
        background: #ef4444;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        color: white;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `;
    closeBtn.onclick = toggleEmojiPicker;
    closeBtn.onmouseover = () => { 
        closeBtn.style.background = '#dc2626';
        closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseout = () => { 
        closeBtn.style.background = '#ef4444';
        closeBtn.style.transform = 'scale(1)';
    };
    picker.appendChild(closeBtn);
    
    container.appendChild(picker);
    console.log('✅ Emoji picker created successfully');
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────

let pendingImage = null;

// ── Open Image Upload Modal ──────────────────────────────────────
export function showImageUploadModal() {
    let modal = document.getElementById('imageUploadModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageUploadModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        modal.innerHTML = `
            <div class="modal-popup" style="max-width: 450px; width: 90%; background: #ffffff; border-radius: 24px; padding: 30px; border: 1px solid #d4e5c4; box-shadow: 0 20px 40px rgba(123, 160, 91, 0.2); position: relative;">
                <button type="button" onclick="window.closeImageUploadModal()" 
                        class="modal-close-x"
                        title="Close">✕</button>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-image"></i></div>
                    <h3 style="color: #5a7a3f; font-size: 24px; margin: 0;">Upload Image</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Share a photo with your message</p>
                </div>
                
                <div style="background: #f7fbf3; border-radius: 12px; padding: 30px; border: 2px dashed #d4e5c4; text-align: center; cursor: pointer; transition: 0.3s;" 
                     id="imageUploadDropzone"
                     onclick="document.getElementById('imageUploadInput').click()"
                     onmouseover="this.style.borderColor='#7ba05b'; this.style.background='rgba(123, 160, 91, 0.05)'"
                     onmouseout="this.style.borderColor='#d4e5c4'; this.style.background='#f7fbf3'">
                    <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-cloud-upload-alt"></i></div>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Click or drag to upload image</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="imageUploadInput" accept="image/*" style="display: none;">
                
                <div id="imagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="imagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="window.closeImageUploadModal()" style="flex: 1; background: #e2e8f0; color: #475569; border: none; padding: 10px 25px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="modal-btn modal-btn-submit" onclick="window.sendImageMessage()" id="sendImageBtn" style="flex: 1; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #fff; border: none; padding: 10px 25px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-paper-plane"></i> Send Image
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageUploadModal();
            }
        });
        
        const fileInput = document.getElementById('imageUploadInput');
        fileInput.addEventListener('change', function(e) {
            previewImage(e);
        });
        
        const dropzone = document.getElementById('imageUploadDropzone');
        dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#7ba05b';
            this.style.background = 'rgba(123, 160, 91, 0.05)';
        });
        dropzone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#d4e5c4';
            this.style.background = '#f7fbf3';
        });
        dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#d4e5c4';
            this.style.background = '#f7fbf3';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('imageUploadInput').files = files;
                previewImage({ target: { files: files } });
            }
        });
    }
    
    const previewContainer = document.getElementById('imagePreviewContainer');
    const dropzone = document.getElementById('imageUploadDropzone');
    const fileInput = document.getElementById('imageUploadInput');
    const sendBtn = document.getElementById('sendImageBtn');
    
    if (previewContainer) previewContainer.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (dropzone) {
        dropzone.style.borderColor = '#d4e5c4';
        dropzone.style.background = '#f7fbf3';
    }
    if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
    }
    pendingImage = null;
    
    modal.style.display = 'flex';
}

// ── Preview Image ──────────────────────────────────────────────────
function previewImage(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        document.getElementById('imageUploadInput').value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image is too large. Please upload under 5MB.', 'error');
        document.getElementById('imageUploadInput').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        document.getElementById('imagePreviewContainer').style.display = 'block';
        pendingImage = {
            data: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
        };
    };
    reader.readAsDataURL(file);
}

// ── Close Image Upload Modal ──────────────────────────────────────
export function closeImageUploadModal() {
    const modal = document.getElementById('imageUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingImage = null;
}

// ── Send Image Message ────────────────────────────────────────────
export async function sendImageMessage() {
    const imageData = pendingImage;
    if (!imageData) {
        showToast('Please select an image first.', 'error');
        return;
    }
    
    const staffEmail = document.getElementById('replyStaffEmail')?.value;
    if (!staffEmail) {
        showToast('Please select a recipient first.', 'error');
        return;
    }
    
    const btn = document.getElementById('sendImageBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
    
    try {
        const currentUser = getLoggedInEmail();
        
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: '📷 Image',
                message: '📷 Image',
                receiver: staffEmail,
                image_data: imageData.data,
                image_name: imageData.name,
                image_type: imageData.type
            })
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('Image sent successfully!', 'success');
            closeImageUploadModal();
            
            const container = document.getElementById('conversationMessagesStaff');
            appendNewMessage(container, currentUser, staffEmail, '📷 Image', imageData.data);
            
            await loadStaffConversations();
            updateMessageBadge();
            
            const socket = getSocket();
            if (socket && socket.connected) {
                socket.emit('send_message', {
                    sender: currentUser,
                    receiver: staffEmail,
                    message: '📷 Image',
                    subject: '📷 Image',
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    image_data: imageData.data,
                    image_name: imageData.name,
                    image_type: imageData.type
                });
            }
        } else {
            showToast(data.message || 'Error sending image.', 'error');
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error sending image:', error);
        showToast('Something went wrong. Please try again.', 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
        btn.disabled = false;
    }
}

// ── Open image fullscreen ─────────────────────────────────────────
export function openImageFullscreen(imageSrc) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        animation: fadeIn 0.3s ease;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;
    
    overlay.appendChild(img);
    overlay.onclick = function() {
        overlay.remove();
    };
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(overlay);
}

// ── Helper: Append new message to conversation ──────────────────
function appendNewMessage(container, sender, staffEmail, messageText, imageData) {
    if (!container) return;
    
    const isCustomer = true;
    const bgColor = '#7ba05b';
    const textColor = '#ffffff';
    const align = 'flex-end';
    const label = 'You';
    const labelColor = '#ffffff';
    
    const div = document.createElement('div');
    div.style.cssText = `
        display: flex;
        justify-content: ${align};
        margin-bottom: 15px;
        animation: fadeIn 0.3s ease;
    `;
    
    let messageHTML = `
        <div style="max-width: 70%;">
            <div style="background: ${bgColor}; padding: 10px 15px; border-radius: 12px; border-bottom-right-radius: 4px;">
                <div style="font-size: 11px; color: ${labelColor}; font-weight: 600; margin-bottom: 3px;">${label}</div>
                ${messageText && messageText !== '📷 Image' ? `<div style="color: ${textColor}; word-wrap: break-word;">${messageText}</div>` : ''}
    `;
    
    if (imageData && imageData.startsWith('data:image')) {
        messageHTML += `
            <div style="margin-top: 10px;">
                <img src="${imageData}" 
                     style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #d4e5c4; display: block;" 
                     onclick="window.openImageFullscreen('${imageData}')"
                     alt="Image">
            </div>
        `;
    }
    
    const now = new Date();
    const formattedTime = now.toLocaleString();
    
    messageHTML += `
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 3px; text-align: right;">
                ${formattedTime}
            </div>
        </div>
    `;
    
    div.innerHTML = messageHTML;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ── Load Staff Conversations ──────────────────────────────────────
export async function loadStaffConversations() {
    const container = document.getElementById('staffList');
    const conversationContainer = document.getElementById('conversationMessagesStaff');
    
    if (conversationContainer && !currentStaffEmail && conversationContainer.children.length <= 1) {
        conversationContainer.innerHTML = `
            <div style="text-align: center; color: #64748b; padding: 40px;">
                <i class="fas fa-spinner fa-spin"></i> Loading conversations...
            </div>
        `;
    }
    
    try {
        const data = await fetchMessages();
        const allRecipients = [
            { email: 'admin@petlink.com', label: 'Admin', icon: '<i class="fas fa-crown"></i>', color: '#7c3aed' },
            { email: 'staff@petlink.com', label: 'Staff', icon: '<i class="fas fa-user-tie"></i>', color: '#7ba05b' },
            { email: 'vet@petlink.com', label: 'Veterinarian', icon: '<i class="fas fa-user-md"></i>', color: '#10b981' }
        ];
        
        const recipientsWithMessages = new Set();
        const currentUser = getLoggedInEmail();
        
        if (data.success && data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                if (msg.sender_email === currentUser && msg.receiver_email) {
                    recipientsWithMessages.add(msg.receiver_email);
                }
                if (msg.receiver_email === currentUser && msg.sender_email) {
                    recipientsWithMessages.add(msg.sender_email);
                }
            });
        }
        
        container.innerHTML = '';
        
        allRecipients.forEach(recipient => {
            const hasMessages = recipientsWithMessages.has(recipient.email);
            const isActive = currentStaffEmail === recipient.email;
            
            const div = document.createElement('div');
            div.className = `staff-item ${isActive ? 'active' : ''}`;
            div.style.borderLeft = isActive ? `3px solid ${recipient.color}` : '3px solid transparent';
            div.style.opacity = hasMessages ? '1' : '0.7';
            
            div.onclick = () => loadCustomerConversation(recipient.email);
            
            let unreadBadge = '';
            if (data.success && data.messages) {
                const unreadCount = data.messages.filter(m => 
                    m.sender_email === recipient.email && 
                    m.receiver_email === currentUser && 
                    m.is_read === 0
                ).length;
                if (unreadCount > 0) {
                    unreadBadge = `<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: auto;">${unreadCount}</span>`;
                }
            }
            
            const noMessagesText = !hasMessages ? '<span style="font-size: 10px; color: #64748b; margin-left: auto;">No messages</span>' : '';
            
            div.innerHTML = `
                <div class="avatar" style="background: rgba(123, 160, 91, 0.15); color: ${recipient.color}; display: flex; align-items: center; justify-content: center; font-size: 16px;">
                    ${recipient.icon}
                </div>
                <div class="info">
                    <div class="name" style="color: ${recipient.color};">${recipient.label}</div>
                    <div class="email" style="font-size: 11px;">${recipient.email}</div>
                </div>
                ${noMessagesText}
                ${unreadBadge}
            `;
            container.appendChild(div);
        });
        
        updateMessageBadge();
        loadUnreadCount();
        
        // ✅ I-load lang ang conversation KUNG active ang messages section
        const messagesSection = document.getElementById('section-messages');
        const isMessagesSectionActive = messagesSection && messagesSection.classList.contains('active');
        
        if (isMessagesSectionActive) {
            if (!currentStaffEmail && recipientsWithMessages.size > 0) {
                loadCustomerConversation([...recipientsWithMessages][0]);
            } else if (!currentStaffEmail) {
                loadCustomerConversation('admin@petlink.com');
            }
        }
        
    } catch (error) {
        console.error('Error loading staff conversations:', error);
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i> Error loading conversations
            </div>
        `;
        if (conversationContainer) {
            conversationContainer.innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 40px;">
                    <i class="fas fa-exclamation-triangle"></i> Error loading messages
                </div>
            `;
        }
    }
}

// ── LOAD FIRST CONVERSATION WITH UNREAD MESSAGES ──────────────────
export async function loadFirstUnreadConversation() {
    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        
        if (data.success && data.messages && data.messages.length > 0) {
            const currentUser = getLoggedInEmail();
            
            const unreadSenders = new Set();
            data.messages.forEach(msg => {
                if (msg.sender_email !== currentUser && 
                    msg.receiver_email === currentUser && 
                    msg.is_read === 0) {
                    unreadSenders.add(msg.sender_email);
                }
            });
            
            if (unreadSenders.size > 0) {
                const firstUnreadSender = [...unreadSenders][0];
                await loadCustomerConversation(firstUnreadSender);
            } else {
                const allRecipients = ['admin@petlink.com', 'staff@petlink.com', 'vet@petlink.com'];
                const messagesFrom = new Set();
                data.messages.forEach(msg => {
                    if (msg.sender_email === currentUser && msg.receiver_email) {
                        messagesFrom.add(msg.receiver_email);
                    }
                    if (msg.receiver_email === currentUser && msg.sender_email) {
                        messagesFrom.add(msg.sender_email);
                    }
                });
                
                if (messagesFrom.size > 0) {
                    const lastRecipient = [...messagesFrom][0];
                    await loadCustomerConversation(lastRecipient);
                } else {
                    await loadCustomerConversation('admin@petlink.com');
                }
            }
        } else {
            await loadCustomerConversation('admin@petlink.com');
        }
    } catch (error) {
        console.error('Error loading first conversation:', error);
        await loadCustomerConversation('admin@petlink.com');
    }
}

// ── Load Customer Conversation ──────────────────────────────────
export async function loadCustomerConversation(staffEmail) {
    currentStaffEmail = staffEmail;
    
    const container = document.getElementById('conversationMessagesStaff');
    const currentUser = getLoggedInEmail();
    
    let hasExistingMessages = false;
    if (container) {
        const existingMessages = container.querySelectorAll('div[style*="display: flex;"]');
        if (existingMessages.length > 0) {
            hasExistingMessages = true;
        }
    }
    
    if (!hasExistingMessages) {
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    <i class="fas fa-spinner fa-spin"></i> Loading messages...
                </div>
            `;
        }
    }
    
    let roleLabel = 'Staff';
    let roleColor = '#7ba05b';
    let icon = '<i class="fas fa-user-tie"></i>';
    
    if (staffEmail === 'admin@petlink.com') {
        roleLabel = 'Admin';
        roleColor = '#7c3aed';
        icon = '<i class="fas fa-crown"></i>';
    } else if (staffEmail === 'vet@petlink.com') {
        roleLabel = 'Veterinarian';
        roleColor = '#10b981';
        icon = '<i class="fas fa-user-md"></i>';
    } else if (staffEmail.includes('staff')) {
        roleLabel = 'Staff';
        roleColor = '#7ba05b';
        icon = '<i class="fas fa-user-tie"></i>';
    }
    
    let staffName = roleLabel;
    try {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
            const user = usersData.users.find(u => u.email === staffEmail);
            if (user && user.fullname) {
                staffName = user.fullname;
            }
        }
    } catch (error) {
        console.error('Error fetching staff name:', error);
    }
    
    document.getElementById('conversationHeaderStaff').innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px; color: ${roleColor};">${icon}</span>
            <div>
                <div style="color: ${roleColor}; font-weight: 500;">${staffName}</div>
                <div style="color: #64748b; font-size: 12px;">${staffEmail}</div>
            </div>
        </div>
    `;
    
    document.getElementById('replyStaffEmail').value = staffEmail;
    document.getElementById('replyMessageStaff').value = '';
    document.getElementById('replyMessageStaff').style.borderColor = '#d4e5c4';
    document.getElementById('replyMessageStaff').placeholder = `Type your reply to ${staffName}...`;
    
    document.querySelectorAll('.staff-item').forEach(item => {
        item.classList.remove('active');
        item.style.borderLeft = '3px solid transparent';
    });
    document.querySelectorAll('.staff-item').forEach(item => {
        const emailEl = item.querySelector('.email');
        if (emailEl && emailEl.textContent === staffEmail) {
            item.classList.add('active');
            let color = '#7ba05b';
            if (staffEmail === 'admin@petlink.com') color = '#7c3aed';
            else if (staffEmail === 'vet@petlink.com') color = '#10b981';
            item.style.borderLeft = `3px solid ${color}`;
        }
    });
    
    try {
        const data = await fetchCustomerConversation(staffEmail);
        
        if (data.success && data.messages && data.messages.length > 0) {
            container.innerHTML = '';
            
            data.messages.forEach(msg => {
                const isCustomer = msg.sender_email === currentUser;
                const bgColor = isCustomer ? '#7ba05b' : '#f7fbf3';
                const textColor = isCustomer ? '#ffffff' : '#2d3e1f';
                const align = isCustomer ? 'flex-end' : 'flex-start';
                const label = isCustomer ? 'You' : staffName;
                const labelColor = isCustomer ? '#ffffff' : roleColor;
                
                let imageData = null;
                let messageText = msg.message || '';
                
                if (messageText.includes('[IMAGE:')) {
                    const imageMatch = messageText.match(/\[IMAGE:([^\]]+)\]/);
                    if (imageMatch) {
                        imageData = imageMatch[1];
                        messageText = messageText.replace(/\[IMAGE:[^\]]+\]/, '').trim();
                        messageText = messageText.replace(/^Image:\s*/i, '').trim();
                        messageText = messageText.replace(/^📷\s*Image:\s*/i, '').trim();
                    }
                }
                
                if (!imageData && messageText.includes('data:image')) {
                    const dataMatch = messageText.match(/data:image\/[^;]+;base64,[^\s]+/);
                    if (dataMatch) {
                        imageData = dataMatch[0];
                        messageText = messageText.replace(/data:image\/[^;]+;base64,[^\s]+/, '').trim();
                        messageText = messageText.replace(/^Image:\s*/i, '').trim();
                    }
                }
                
                if (!messageText || messageText === 'Image:' || messageText === '📷 Image:' || 
                    messageText === 'Screenshot' || messageText === '📷 Image' || 
                    messageText === 'Image' || messageText === 'image') {
                    messageText = '';
                }
                
                const div = document.createElement('div');
                div.style.cssText = `
                    display: flex;
                    justify-content: ${align};
                    margin-bottom: 15px;
                `;
                
                let messageHTML = `
                    <div style="max-width: 70%;">
                        <div style="background: ${bgColor}; padding: 10px 15px; border-radius: 12px; ${isCustomer ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px; border: 1px solid #d4e5c4;'}">
                            <div style="font-size: 11px; color: ${labelColor}; font-weight: 600; margin-bottom: 3px;">${label}</div>
                            ${messageText ? `<div style="color: ${textColor}; word-wrap: break-word;">${messageText}</div>` : ''}
                `;
                
                if (imageData && imageData.startsWith('data:image')) {
                    messageHTML += `
                        <div style="margin-top: 10px;">
                            <img src="${imageData}" 
                                 style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #d4e5c4; display: block;" 
                                 onclick="window.openImageFullscreen('${imageData}')"
                                 alt="Image">
                        </div>
                    `;
                }
                
                messageHTML += `
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-top: 3px; ${isCustomer ? 'text-align: right;' : ''}">
                            ${new Date(msg.created_at).toLocaleString()}
                        </div>
                    </div>
                `;
                
                div.innerHTML = messageHTML;
                container.appendChild(div);
            });
            
            // ✅ I-scroll at mark as read LANG kung active ang messages section
            const messagesSection = document.getElementById('section-messages');
            const isMessagesSectionActive = messagesSection && messagesSection.classList.contains('active');
            
            if (isMessagesSectionActive) {
                container.scrollTop = container.scrollHeight;
                await markCustomerMessagesAsRead(staffEmail);
                loadUnreadCount();
                updateMessageBadge();
            }
            
        } else {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    No messages yet with ${staffName}. 
                    <br><br>
                    <span style="font-size: 13px;">Click "Contact Clinic" to send a message.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
        container.innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 40px;">
                <i class="fas fa-exclamation-triangle"></i> Error loading messages
            </div>
        `;
    }
}

// ── MARK MESSAGES AS READ ────────────────────────────────────────────
async function markCustomerMessagesAsRead(staffEmail) {
    try {
        const currentUser = getLoggedInEmail();
        
        const res = await fetch('/api/messages/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sender: staffEmail,
                receiver: currentUser
            })
        });
        const data = await res.json();
        
        if (data.success) {
            console.log(`✅ Messages from ${staffEmail} marked as read`);
            
            await loadStaffConversations();
            updateMessageBadge();
            loadUnreadCount();
            
            const activeItem = document.querySelector('.staff-item.active');
            if (activeItem) {
                const badge = activeItem.querySelector('span[style*="background: #ef4444"]');
                if (badge) {
                    badge.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// ── Send Customer Reply ───────────────────────────────────────────
export async function sendCustomerReply(e) {
    e.preventDefault();
    
    const staffEmail = document.getElementById('replyStaffEmail').value;
    const message = document.getElementById('replyMessageStaff').value.trim();
    
    if (!message) {
        const input = document.getElementById('replyMessageStaff');
        input.style.borderColor = '#ef4444';
        input.placeholder = 'Please enter a message';
        setTimeout(() => {
            input.style.borderColor = '#d4e5c4';
            input.placeholder = 'Type your reply...';
        }, 2000);
        return;
    }
    
    if (!staffEmail) {
        showToast('Please select a recipient first.', 'error');
        return;
    }
    
    const btn = document.querySelector('#replyFormStaff button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    try {
        const currentUser = getLoggedInEmail();
        const socket = getSocket();
        if (socket && socket.connected) {
            socket.emit('send_message', {
                sender: currentUser,
                receiver: staffEmail,
                message: message,
                subject: 'Customer Reply',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
        }
        
        const data = await sendMessageAPI({ 
            subject: 'Customer Reply',
            message: message,
            receiver: staffEmail
        });
        
        if (data.success) {
            document.getElementById('replyMessageStaff').value = '';
            
            const input = document.getElementById('replyMessageStaff');
            input.placeholder = 'Message sent!';
            input.style.borderColor = '#7ba05b';
            setTimeout(() => {
                input.placeholder = 'Type your reply...';
                input.style.borderColor = '#d4e5c4';
            }, 2000);
            
            const container = document.getElementById('conversationMessagesStaff');
            appendNewMessage(container, currentUser, staffEmail, message, null);
            
            await loadStaffConversations();
            updateMessageBadge();
            
        } else {
            const input = document.getElementById('replyMessageStaff');
            input.placeholder = data.message || 'Error sending message';
            input.style.borderColor = '#ef4444';
            setTimeout(() => {
                input.placeholder = 'Type your reply...';
                input.style.borderColor = '#d4e5c4';
            }, 3000);
        }
    } catch (error) {
        console.error('Error:', error);
        const input = document.getElementById('replyMessageStaff');
        input.placeholder = 'Error sending message';
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.placeholder = 'Type your reply...';
            input.style.borderColor = '#d4e5c4';
        }, 3000);
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

// ── Load Unread Count ─────────────────────────────────────────────
export async function loadUnreadCount() {
    try {
        const data = await fetchUnreadCountAPI();
        const badge = document.getElementById('messageBadge');
        
        console.log(`📊 Unread count: ${data.count}`);
        
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'inline-flex';
                badge.style.background = '#ef4444';
                badge.style.color = '#ffffff';
                badge.style.padding = '2px 9px';
                badge.style.borderRadius = '10px';
                badge.style.fontSize = '11px';
                badge.style.fontWeight = '700';
                badge.style.marginLeft = 'auto';
                badge.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.5)';
                badge.style.animation = 'pulse 1.5s ease-in-out infinite';
                console.log(`✅ Badge updated: ${data.count} unread messages`);
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                badge.style.animation = 'none';
            }
        } else {
            console.warn('⚠️ Badge element not found!');
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

// ── Update Message Badge ──────────────────────────────────────────
export function updateMessageBadge() {
    loadUnreadCount();
}

// ── Contact Clinic ────────────────────────────────────────────────
export function showContactModal() {
    document.getElementById('contactModal').style.display = 'flex';
    document.getElementById('contactForm').reset();
    const existingError = document.querySelector('#contactForm .error-message');
    if (existingError) existingError.remove();
}

export function closeContactModal() {
    document.getElementById('contactModal').style.display = 'none';
}

export async function sendMessage(e) {
    e.preventDefault();
    
    const recipient = document.getElementById('contactRecipient').value;
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!recipient) {
        const select = document.getElementById('contactRecipient');
        select.style.borderColor = '#ef4444';
        setTimeout(() => {
            select.style.borderColor = '#d4e5c4';
        }, 2000);
        return;
    }
    
    if (!message) {
        const textarea = document.getElementById('contactMessage');
        textarea.style.borderColor = '#ef4444';
        textarea.placeholder = 'Please enter a message';
        setTimeout(() => {
            textarea.style.borderColor = '#d4e5c4';
            textarea.placeholder = 'Type your message here...';
        }, 2000);
        return;
    }
    
    const btn = document.querySelector('#contactForm .modal-btn-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    
    try {
        const recipientNames = {
            'admin@petlink.com': 'Admin',
            'staff@petlink.com': 'Staff',
            'vet@petlink.com': 'Veterinarian'
        };
        const recipientName = recipientNames[recipient] || recipient;
        
        const data = await sendMessageAPI({ 
            subject: subject || `Message for ${recipientName}`,
            message: message,
            receiver: recipient
        });
        
        if (data.success) {
            showToast(`Message sent to ${recipientName}!`, 'success');
            closeContactModal();
            await loadStaffConversations();
            if (currentStaffEmail) {
                await loadCustomerConversation(currentStaffEmail);
            }
            updateMessageBadge();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
    
    btn.innerHTML = originalText;
    btn.disabled = false;
}

// ── Make functions globally available ──────────────────────────────
window.loadStaffConversations = loadStaffConversations;
window.loadCustomerConversation = loadCustomerConversation;
window.loadFirstUnreadConversation = loadFirstUnreadConversation;
window.sendCustomerReply = sendCustomerReply;
window.loadUnreadCount = loadUnreadCount;
window.updateMessageBadge = updateMessageBadge;
window.showContactModal = showContactModal;
window.closeContactModal = closeContactModal;
window.sendMessage = sendMessage;

// Emoji and Image functions
window.toggleEmojiPicker = toggleEmojiPicker;
window.insertEmoji = insertEmoji;
window.showImageUploadModal = showImageUploadModal;
window.closeImageUploadModal = closeImageUploadModal;
window.sendImageMessage = sendImageMessage;
window.openImageFullscreen = openImageFullscreen;
window.initEmojiPicker = initEmojiPicker;