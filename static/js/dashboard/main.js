// ── MAIN ENTRY POINT ─────────────────────────────────────────────────

// Import all modules
import * as sidebar from './sidebar.js';
import * as auth from './auth.js';
import * as appointments from './appointments.js';
import * as pets from './pets.js';
import * as messages from './messages.js';
import * as datepicker from './datepicker.js';
import * as modals from './modals.js';
import * as socket from './socket.js';
import { showToast, formatDuration, formatTime } from './utils.js';

// ── AI RECOMMENDATIONS FUNCTION ──────────────────────────────────────
async function refreshAIRecommendations() {
    const container = document.getElementById('aiRecommendationsContainer');
    if (!container) {
        console.warn('AI Recommendations container not found');
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
            <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #334155; border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 15px;"></div>
            <p style="color: #94a3b8;">⏳ Generating AI recommendations...</p>
        </div>
    `;
    
    try {
        // First, train the model if needed
        const trainRes = await fetch('/api/ml/train', { method: 'POST' });
        const trainData = await trainRes.json();
        
        if (!trainData.success) {
            console.warn('Training warning:', trainData.message);
        }
        
        // Get recommendations for all pets
        const res = await fetch('/api/ml/predict/all');
        const data = await res.json();
        
        if (data.success && data.recommendations && data.recommendations.length > 0) {
            let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">';
            
            data.recommendations.forEach(rec => {
                const riskColor = rec.health_risk === 'High' ? '#ef4444' : 
                                 rec.health_risk === 'Medium' ? '#f59e0b' : '#10b981';
                
                const priorityColor = rec.vaccine_priority === 'High' ? '#ef4444' : 
                                     rec.vaccine_priority === 'Medium' ? '#f59e0b' : '#10b981';
                
                const vaccineClass = rec.vaccine_priority === 'High' ? 'vaccine-high' : 
                                    rec.vaccine_priority === 'Medium' ? 'vaccine-medium' : 'vaccine-low';
                
                const riskClass = rec.health_risk === 'High' ? 'risk-high' : 
                                 rec.health_risk === 'Medium' ? 'risk-medium' : 'risk-low';
                
                let recList = '';
                if (rec.recommendations && Array.isArray(rec.recommendations)) {
                    recList = rec.recommendations.map(r => 
                        `<div class="rec-item">${r}</div>`
                    ).join('');
                }
                
                html += `
                    <div class="ai-rec-card">
                        <div class="pet-name">🐕 ${rec.pet_name || 'Unknown Pet'}</div>
                        <div style="margin-bottom: 10px;">
                            <span class="rec-badge ${vaccineClass}">💉 ${rec.vaccine_priority || 'Medium'} Priority</span>
                            <span class="rec-badge ${riskClass}">🏥 ${rec.health_risk || 'Medium'} Risk</span>
                            <span class="rec-badge grooming">✂️ ${rec.grooming_frequency || 'Bi-weekly'}</span>
                        </div>
                        <div style="margin-top: 8px;">
                            ${recList || '<div class="rec-item">No specific recommendations available.</div>'}
                        </div>
                        ${rec.prediction_date ? `<div style="color: #64748b; font-size: 10px; margin-top: 10px;">Generated: ${rec.prediction_date}</div>` : ''}
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
            
            // Check model status
            try {
                const statusRes = await fetch('/api/ml/status');
                const statusData = await statusRes.json();
                if (statusData.success && statusData.models_loaded) {
                    showToast('✅ AI models ready! Recommendations generated.', 'success');
                } else {
                    showToast('ℹ️ AI recommendations generated with available data.', 'info');
                }
            } catch (e) {
                // Ignore
            }
            
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
                    <div style="font-size: 48px; margin-bottom: 15px;">🐾</div>
                    <h3 style="color: #e2e8f0; margin-bottom: 10px;">No Pets Registered</h3>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Please register your pets first to receive AI-powered care recommendations.</p>
                    <button onclick="document.getElementById('navPets')?.click()" style="margin-top: 15px; background: #10b981; color: #fff; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 16px;">
                        ➕ Add Your Pet
                    </button>
                </div>
            `;
            showToast('ℹ️ Register a pet first to get AI recommendations.', 'info');
        }
        
    } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <h3 style="color: #ef4444; margin-bottom: 10px;">Error Generating Recommendations</h3>
                <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">There was a problem generating AI recommendations. Please try again later.</p>
                <button onclick="refreshAIRecommendations()" style="margin-top: 15px; background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; font-size: 16px;">
                    🔄 Try Again
                </button>
            </div>
        `;
        showToast('❌ Error getting recommendations. Please try again.', 'error');
    }
}

// ── DOMContentLoaded ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar
    sidebar.restoreSidebarState();
    
    // Switch to overview section
    sidebar.switchSection('overview');
    
    // ✅ Connect to WebSocket AGAD
    socket.connectSocket();
    
    // ✅ Load unread count AGAD
    messages.loadUnreadCount();
    
    // ✅ Double call para siguradong updated
    setTimeout(function() {
        messages.loadUnreadCount();
    }, 500);
    
    // Load initial data
    appointments.loadAppointments();
    pets.loadMyPets();
    messages.loadStaffConversations();
    
    // Add appointment tab click handlers
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            appointments.filterAppointments(this.dataset.tab);
        });
    });
    
    // Add typing indicator for reply input
    const replyInput = document.getElementById('replyMessageStaff');
    if (replyInput) {
        let typingTimer;
        replyInput.addEventListener('input', function() {
            clearTimeout(typingTimer);
            const staffEmail = document.getElementById('replyStaffEmail')?.value;
            if (staffEmail) {
                socket.socketTyping(staffEmail, true);
            }
            
            typingTimer = setTimeout(() => {
                const staffEmail = document.getElementById('replyStaffEmail')?.value;
                if (staffEmail) {
                    socket.socketTyping(staffEmail, false);
                }
            }, 1000);
        });
        
        replyInput.addEventListener('blur', function() {
            const staffEmail = document.getElementById('replyStaffEmail')?.value;
            if (staffEmail) {
                socket.socketTyping(staffEmail, false);
            }
        });
    }
    
    // ── ✅ FIX: Initialize emoji picker with a delay ──────────────────
    // Wait for DOM to be fully ready and messages to load
    setTimeout(() => {
        messages.initEmojiPicker();
        console.log('✅ Emoji picker initialized');
    }, 500);
    
    // ── ADD EMOJI AND IMAGE BUTTONS TO REPLY FORM ──────────────────
    const replyForm = document.querySelector('#replyFormStaff');
    if (replyForm) {
        // Find the input and submit button
        const input = replyForm.querySelector('input[type="text"]');
        const sendBtn = replyForm.querySelector('button[type="submit"]');
        
        if (input && sendBtn) {
            // Check if buttons already exist to avoid duplicates
            if (!document.getElementById('customerEmojiBtn')) {
                // Create button container
                const btnContainer = document.createElement('div');
                btnContainer.style.cssText = `
                    display: flex;
                    gap: 6px;
                    align-items: center;
                `;
                
                // Emoji button
                const emojiBtn = document.createElement('button');
                emojiBtn.id = 'customerEmojiBtn';
                emojiBtn.type = 'button';
                emojiBtn.innerHTML = '😊';
                emojiBtn.title = 'Insert Emoji';
                emojiBtn.style.cssText = `
                    padding: 8px 14px;
                    background: #334155;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    transition: 0.3s;
                `;
                emojiBtn.onmouseover = () => { emojiBtn.style.background = '#475569'; };
                emojiBtn.onmouseout = () => { emojiBtn.style.background = '#334155'; };
                emojiBtn.onclick = () => {
                    console.log('😊 Emoji button clicked');
                    messages.toggleEmojiPicker();
                };
                
                // Image upload button
                const imageBtn = document.createElement('button');
                imageBtn.id = 'customerImageBtn';
                imageBtn.type = 'button';
                imageBtn.innerHTML = '🖼️';
                imageBtn.title = 'Upload Image';
                imageBtn.style.cssText = `
                    padding: 8px 14px;
                    background: #334155;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    transition: 0.3s;
                `;
                imageBtn.onmouseover = () => { imageBtn.style.background = '#475569'; };
                imageBtn.onmouseout = () => { imageBtn.style.background = '#334155'; };
                imageBtn.onclick = () => {
                    import('./messages.js').then(module => {
                        module.showImageUploadModal();
                    });
                };
                
                // Insert buttons before the send button
                const parent = sendBtn.parentNode;
                parent.insertBefore(btnContainer, sendBtn);
                btnContainer.appendChild(emojiBtn);
                btnContainer.appendChild(imageBtn);
                
                // Add some margin to the send button
                sendBtn.style.marginLeft = 'auto';
                console.log('✅ Emoji and image buttons added to reply form');
            }
        }
    }
});

// ── Also reload when coming back to page ─────────────────────────────
window.addEventListener('pageshow', function() {
    appointments.loadAppointments();
    pets.loadMyPets();
    messages.loadStaffConversations();
    messages.loadUnreadCount();
    // ✅ Double call para siguradong updated
    setTimeout(function() {
        messages.loadUnreadCount();
    }, 500);
});

// ── Make functions globally available for inline onclick handlers ────
window.toggleSidebar = sidebar.toggleSidebar;
window.toggleMobileSidebar = sidebar.toggleMobileSidebar;
window.switchSection = sidebar.switchSection;
window.showLogoutModal = auth.showLogoutModal;
window.closeLogoutModal = auth.closeLogoutModal;
window.confirmLogout = auth.confirmLogout;
window.showToast = showToast;
window.formatDuration = formatDuration;
window.formatTime = formatTime;

// Appointment functions
window.showAppointmentDetails = appointments.showAppointmentDetails;
window.cancelAppointment = appointments.cancelAppointment;
window.filterAppointments = appointments.filterAppointments;

// Pet functions
window.loadMyPets = pets.loadMyPets;
window.showAddPetModal = pets.showAddPetModal;
window.closeAddPetModal = pets.closeAddPetModal;
window.submitNewPet = pets.submitNewPet;
window.previewAddPetImage = pets.previewAddPetImage;
window.showEditPetDetailsModal = pets.showEditPetDetailsModal;
window.closeEditPetDetailsModal = pets.closeEditPetDetailsModal;
window.updatePetDetails = pets.updatePetDetails;
window.deletePet = pets.deletePet;
window.showEditPetImageModal = pets.showEditPetImageModal;
window.closeEditPetImageModal = pets.closeEditPetImageModal;
window.submitPetImageUpdate = pets.submitPetImageUpdate;
window.previewEditPetImage2 = pets.previewEditPetImage2;

// Message functions
window.loadStaffConversations = messages.loadStaffConversations;
window.loadCustomerConversation = messages.loadCustomerConversation;
window.loadFirstUnreadConversation = messages.loadFirstUnreadConversation;
window.sendCustomerReply = messages.sendCustomerReply;
window.loadUnreadCount = messages.loadUnreadCount;
window.updateMessageBadge = messages.updateMessageBadge;
window.showContactModal = messages.showContactModal;
window.closeContactModal = messages.closeContactModal;
window.sendMessage = messages.sendMessage;

// Emoji and Image functions
window.toggleEmojiPicker = messages.toggleEmojiPicker;
window.insertEmoji = messages.insertEmoji;
window.showImageUploadModal = messages.showImageUploadModal;
window.closeImageUploadModal = messages.closeImageUploadModal;
window.sendImageMessage = messages.sendImageMessage;
window.openImageFullscreen = messages.openImageFullscreen;
window.initEmojiPicker = messages.initEmojiPicker; // ✅ ADD THIS

// Date picker functions
window.renderDatePicker = datepicker.renderDatePicker;
window.changeMonth = datepicker.changeMonth;
window.selectToday = datepicker.selectToday;
window.selectDate = datepicker.selectDate;
window.selectTime = datepicker.selectTime;
window.loadTimeSlots = datepicker.loadTimeSlots;

// Modal functions
window.showBookAppointmentModal = modals.showBookAppointmentModal;
window.closeBookAppointmentModal = modals.closeBookAppointmentModal;
window.submitAppointment = modals.submitAppointment;
window.showBookingConfirmation = modals.showBookingConfirmation;
window.closeBookingConfirmation = modals.closeBookingConfirmation;
window.confirmBooking = modals.confirmBooking;

// ── AI RECOMMENDATIONS FUNCTION ──────────────────────────────────────
window.refreshAIRecommendations = refreshAIRecommendations;

// ── ✅ INIT SOCKET AGAD (gaya ng admin.js) ───────────────────────────
(function initSocket() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            socket.connectSocket();
            messages.loadUnreadCount();
        });
    } else {
        socket.connectSocket();
        messages.loadUnreadCount();
    }
})();