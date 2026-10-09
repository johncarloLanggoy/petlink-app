// ── APPOINTMENT MANAGEMENT ──────────────────────────────────────────

import { 
    fetchAppointments, 
    fetchAllAppointments, 
    cancelAppointmentAPI,
    checkAvailability,
    bookAppointment
} from './services.js';
import { showToast, formatDuration, formatTime } from './utils.js';
import { showBookAppointmentModal } from './modals.js';

let allAppointments = [];
let currentAppointmentFilter = 'all';

// ── Load Appointments ──────────────────────────────────────────────
export async function loadAppointments() {
    const container = document.getElementById('myAppointmentsContainer');
    
    try {
        const data = await fetchAppointments();
        
        if (data.success && data.appointments && data.appointments.length > 0) {
            allAppointments = data.appointments;
            updateAppointmentCounts(allAppointments);
            filterAppointments(currentAppointmentFilter);
        } else {
            allAppointments = [];
            updateAppointmentCounts([]);
            updateOverviewStats({ all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
            
            const badge = document.getElementById('appointmentBadge');
            if (badge) badge.style.display = 'none';
            
            if (container) {
                container.innerHTML = `
                    <div class="no-appointments">
                        <div class="icon"><i class="fas fa-calendar-plus"></i></div>
                        <h3>No Appointments</h3>
                        <p>You haven't booked any appointments yet. Click "Book New Appointment" to get started!</p>
                        <button class="btn-book-appointment" onclick="window.showBookAppointmentModal()" style="display: inline-flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calendar-plus"></i> Book New Appointment
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        if (container) {
            container.innerHTML = `
                <div class="no-appointments" style="border-color: #ef4444;">
                    <div class="icon" style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3>Error Loading Appointments</h3>
                    <p style="color: #ef4444;">There was a problem loading your appointments. Please refresh the page.</p>
                </div>
            `;
        }
    }
}

// ── Filter Appointments ─────────────────────────────────────────────
export function filterAppointments(status) {
    currentAppointmentFilter = status;
    
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = '';
        tab.style.color = '';
        if (tab.dataset.tab === status) {
            tab.classList.add('active');
        }
    });
    
    const container = document.getElementById('myAppointmentsContainer');
    if (!container) return;
    
    let filtered = allAppointments;
    if (status !== 'all') {
        filtered = allAppointments.filter(app => app.status === status);
    }
    
    renderAppointments(filtered, container);
}

// ── Render Appointments ─────────────────────────────────────────────
export function renderAppointments(appointments, container) {
    if (!container) return;
    
    const statusLabels = {
        'all': 'appointments',
        'pending': 'pending appointments',
        'confirmed': 'confirmed appointments',
        'completed': 'completed appointments',
        'cancelled': 'cancelled appointments'
    };
    
    if (appointments.length === 0) {
        const label = statusLabels[currentAppointmentFilter] || 'appointments';
        container.innerHTML = `
            <div class="no-appointments">
                <div class="icon"><i class="fas fa-calendar-times"></i></div>
                <h3>No ${label}</h3>
                <p>${currentAppointmentFilter === 'all' ? 'You haven\'t booked any appointments yet.' : `You have no ${label} at the moment.`}</p>
                ${currentAppointmentFilter === 'all' ? '<button class="btn-book-appointment" onclick="window.showBookAppointmentModal()" style="display: inline-flex; align-items: center; gap: 8px;"><i class="fas fa-calendar-plus"></i> Book New Appointment</button>' : ''}
            </div>
        `;
        return;
    }
    
    // ✅ SORT: Completed at cancelled sa dulo, pending at confirmed sa taas
    const statusPriority = {
        'pending': 1,
        'confirmed': 2,
        'completed': 3,
        'cancelled': 4
    };
    
    const sortedAppointments = [...appointments].sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        
        const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
        return dateA - dateB;
    });
    
    let html = '';
    sortedAppointments.forEach(app => {
        const statusClass = `status-${app.status}`;
        const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        
        const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
        const totalPrice = app.total_price || 0;
        const totalDuration = app.total_duration || 0;
        const formattedDuration = formatDuration(totalDuration);
        
        const dateObj = new Date(app.appointment_date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const timeDisplay = formatTime(app.appointment_time);
        
        // Status icon mapping
        let statusIcon = '';
        if (app.status === 'pending') statusIcon = '<i class="fas fa-hourglass-half"></i>';
        else if (app.status === 'confirmed') statusIcon = '<i class="fas fa-check-circle"></i>';
        else if (app.status === 'completed') statusIcon = '<i class="fas fa-flag-checkered"></i>';
        else if (app.status === 'cancelled') statusIcon = '<i class="fas fa-times-circle"></i>';
        
        // Pet type icon
        const petTypeIcon = '<i class="fas fa-paw"></i>';
        
        // ✅ Payment status flags
        const isPaid = app.payment_status === 'paid';
        const isFailed = app.payment_status === 'failed';
        const isCancelled = app.status === 'cancelled';
        const canCancel = !isPaid && !isCancelled && (app.status === 'pending' || app.status === 'confirmed');
        
        // ═══════════════════════════════════════════════════════════
        // ✅ BUILD ACTION BUTTONS
        // ═══════════════════════════════════════════════════════════
        let actionsHTML = '';
        
        // ── CANCELLED APPOINTMENT: Show "Retrieve" button (WALANG Pay Now) ──
        if (isCancelled) {
            actionsHTML += `
                <button class="btn-retrieve-appointment" onclick="window.retrieveCancelledAppointment(${app.id})"
                        style="background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #fff; border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(123, 160, 91, 0.3)'"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                    <i class="fas fa-undo-alt"></i> Retrieve Appointment
                </button>
            `;
        }
        
        // ── PAY NOW BUTTON (HIDDEN kung PAID o CANCELLED) ──────────
        if (!isPaid && !isCancelled) {
            actionsHTML += `
                <button class="btn-pay-now" onclick="window.payAppointment(${app.id})" 
                        style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(245, 158, 11, 0.3)'"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                    <i class="fas fa-credit-card"></i> ${isFailed ? 'Retry Payment' : 'Pay Now'}
                </button>
            `;
        }
        
        // ── PAID BADGE + VIEW RECEIPT BUTTON (SHOWN kung PAID) ─────
        if (isPaid) {
            actionsHTML += `
                <span style="color: #10b981; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                    <i class="fas fa-check-circle"></i> Paid
                </span>
            `;
            
            actionsHTML += `
                <button class="btn-view-receipt" onclick="window.showAppointmentReceipt(${app.id})"
                        style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; padding: 6px 18px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 6px;"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.3)'"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
                    <i class="fas fa-receipt"></i> View Receipt
                </button>
            `;
        }
        
        // ── CANCEL BUTTON (HIDDEN kung PAID, COMPLETED, o CANCELLED) ─
        if (canCancel) {
            actionsHTML += `
                <button class="btn-cancel-appointment" onclick="window.cancelAppointment(${app.id})">
                    <i class="fas fa-times-circle"></i> Cancel
                </button>
            `;
        }
        
        // ── VIEW DETAILS BUTTON (LAGING VISIBLE) ───────────────────
        actionsHTML += `
            <button class="btn-view-details" onclick="window.showAppointmentDetails(${app.id})">
                <i class="fas fa-clipboard-list"></i> View Details
            </button>
        `;
        
        html += `
            <div class="appointment-card" data-status="${app.status}">
                <div class="appointment-header">
                    <div>
                        <div class="appointment-pet">
                            ${petTypeIcon} ${app.pet_name}
                        </div>
                        <div class="appointment-service">
                            <i class="fas fa-scissors"></i> ${serviceNames}
                        </div>
                        ${totalPrice > 0 ? `
                            <div class="appointment-price">
                                <i class="fas fa-tag"></i> ₱${totalPrice.toFixed(2)} 
                                <span style="color: #94a3b8; margin: 0 6px;">•</span> 
                                <i class="fas fa-clock"></i> ${formattedDuration}
                            </div>
                        ` : ''}
                    </div>
                    <span class="appointment-status ${statusClass}">
                        ${statusIcon} ${statusLabel}
                    </span>
                </div>
                <div class="appointment-details">
                    <span class="detail-item">
                        <i class="fas fa-calendar-alt"></i> ${formattedDate}
                    </span>
                    <span class="detail-item">
                        <i class="fas fa-clock"></i> ${timeDisplay}
                    </span>
                    ${app.notes ? `
                        <span class="detail-item">
                            <i class="fas fa-pencil-alt"></i> ${app.notes}
                        </span>
                    ` : ''}
                </div>
                <div class="appointment-actions">
                    ${actionsHTML}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ── Update Appointment Counts ──────────────────────────────────────
export function updateAppointmentCounts(appointments) {
    const counts = {
        all: appointments.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
    };
    
    appointments.forEach(app => {
        if (counts.hasOwnProperty(app.status)) {
            counts[app.status]++;
        }
    });
    
    const allEl = document.getElementById('allCount');
    const pendingEl = document.getElementById('pendingCount');
    const confirmedEl = document.getElementById('confirmedCount');
    const completedEl = document.getElementById('completedCount');
    const cancelledEl = document.getElementById('cancelledCount');
    
    if (allEl) allEl.textContent = counts.all;
    if (pendingEl) pendingEl.textContent = counts.pending;
    if (confirmedEl) confirmedEl.textContent = counts.confirmed;
    if (completedEl) completedEl.textContent = counts.completed;
    if (cancelledEl) cancelledEl.textContent = counts.cancelled;
    
    updateOverviewStats(counts);
}

// ── Update Overview Stats ──────────────────────────────────────────
export function updateOverviewStats(counts) {
    const appointmentCountEl = document.getElementById('appointmentCount');
    if (appointmentCountEl) appointmentCountEl.textContent = counts.all;
    
    const pendingCountEl = document.getElementById('pendingCountOverview');
    if (pendingCountEl) pendingCountEl.textContent = counts.pending;
    
    const confirmedCountEl = document.getElementById('confirmedCountOverview');
    if (confirmedCountEl) confirmedCountEl.textContent = counts.confirmed;
    
    const completedCountEl = document.getElementById('completedCountOverview');
    if (completedCountEl) completedCountEl.textContent = counts.completed;
    
    const cancelledCountEl = document.getElementById('cancelledCountOverview');
    if (cancelledCountEl) cancelledCountEl.textContent = counts.cancelled;
    
    const upcomingCountEl = document.getElementById('upcomingCount');
    if (upcomingCountEl) {
        upcomingCountEl.textContent = counts.pending + counts.confirmed;
    }
    
    const badge = document.getElementById('appointmentBadge');
    if (badge) {
        const upcoming = counts.pending + counts.confirmed;
        if (upcoming > 0) {
            badge.textContent = upcoming;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── RETRIEVE CANCELLED APPOINTMENT ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export async function retrieveCancelledAppointment(appointmentId) {
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    // ── DIRECTLY SHOW MODAL (hindi na mag-check muna ng availability) ──
    showRetrieveConfirmationModal(app);
}

// ── Show Slot Full Modal ────────────────────────────────────────────
function showSlotFullModal(app, reason) {
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const dateObj = new Date(app.appointment_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeDisplay = formatTime(app.appointment_time);
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'slotFullModal';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 480px; text-align: center; position: relative;">
            <button type="button" class="modal-close-x" onclick="window.closeSlotFullModal()" title="Close">✕</button>
            
            <div style="font-size: 64px; margin-bottom: 15px; color: #f59e0b;">
                <i class="fas fa-calendar-times"></i>
            </div>
            
            <h3 style="color: #ef4444; font-size: 22px; margin: 0 0 10px;">Slot No Longer Available</h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Sorry, the schedule you previously booked is now <strong>fully booked</strong>. Please book another appointment with a different date or time.
            </p>
            
            <div style="background: #fef3c7; border-radius: 12px; padding: 16px 18px; border: 1px solid #fbbf24; margin-bottom: 20px; text-align: left;">
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #fde68a;">
                    <span style="color: #92400e; font-size: 12px; font-weight: 600;">Date</span>
                    <span style="color: #78350f; font-size: 12px; font-weight: 600;">${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #fde68a;">
                    <span style="color: #92400e; font-size: 12px; font-weight: 600;">Time</span>
                    <span style="color: #78350f; font-size: 12px; font-weight: 600;">${timeDisplay}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                    <span style="color: #92400e; font-size: 12px; font-weight: 600;">Services</span>
                    <span style="color: #78350f; font-size: 12px; font-weight: 600; max-width: 200px; text-align: right;">${serviceNames}</span>
                </div>
            </div>
            
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 8px; text-align: left;">
                <i class="fas fa-info-circle" style="color: #ef4444; font-size: 14px; margin-top: 2px;"></i>
                <p style="color: #b91c1c; font-size: 12px; margin: 0; line-height: 1.5;">
                    <strong>Reason:</strong> ${reason || 'The maximum number of appointments for this time slot has been reached.'}
                </p>
            </div>
            
            <div class="modal-buttons" style="justify-content: center;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeSlotFullModal()" 
                        style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-times"></i> Close
                </button>
                <button class="modal-btn modal-btn-submit" 
                        onclick="window.closeSlotFullModal(); window.retrieveWithNewDateTime(${app.id});"
                        style="flex: 1; background: linear-gradient(135deg, #7ba05b, #5a7a3f); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-calendar-plus"></i> Choose New Date
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

window.closeSlotFullModal = function() {
    const modal = document.getElementById('slotFullModal');
    if (modal) modal.remove();
};

// ═══════════════════════════════════════════════════════════════════
// ── Show Retrieve Modal (2 Options: Same Schedule o New Schedule) ──
// ═══════════════════════════════════════════════════════════════════
function showRetrieveConfirmationModal(app) {
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const servicesList = Array.isArray(app.services) ? app.services : [];
    const totalPrice = app.total_price || 0;
    const totalDuration = app.total_duration || 0;
    const formattedDuration = formatDuration(totalDuration);
    
    const dateObj = new Date(app.appointment_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeDisplay = formatTime(app.appointment_time);
    
    const petType = app.pet_type || 'Dog';
    const petIcon = petType === 'Cat' ? '<i class="fas fa-cat"></i>' : '<i class="fas fa-dog"></i>';
    
    // ── Build services HTML (LOCKED) ──
    let servicesHTML = '';
    if (servicesList.length > 0) {
        servicesList.forEach(svc => {
            servicesHTML += `
                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f7fbf3; border: 1px solid #d4e5c4; border-radius: 8px; opacity: 0.9;">
                    <div style="width: 14px; height: 14px; border-radius: 3px; background: #7ba05b; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; flex-shrink: 0;">
                        <i class="fas fa-check"></i>
                    </div>
                    <div style="flex: 1; color: #2d3e1f; font-size: 12px; font-weight: 500;">
                        ${svc}
                    </div>
                    <i class="fas fa-lock" style="color: #94a387; font-size: 10px;"></i>
                </div>
            `;
        });
    } else {
        servicesHTML = `
            <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #f7fbf3; border: 1px solid #d4e5c4; border-radius: 8px;">
                <div style="width: 14px; height: 14px; border-radius: 3px; background: #7ba05b; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 9px; flex-shrink: 0;">
                    <i class="fas fa-check"></i>
                </div>
                <div style="flex: 1; color: #2d3e1f; font-size: 12px; font-weight: 500;">
                    ${serviceNames}
                </div>
                <i class="fas fa-lock" style="color: #94a387; font-size: 10px;"></i>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'retrieveConfirmModal';
    overlay.style.zIndex = '3000';
    overlay.style.overflowY = 'auto';
    overlay.style.padding = '20px';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 480px; text-align: center; position: relative; max-height: 95vh; overflow-y: auto;">
            <button type="button" class="modal-close-x" onclick="window.closeRetrieveConfirmModal()" title="Close">✕</button>
            
            <div style="font-size: 56px; margin-bottom: 12px; color: #7ba05b;">
                <i class="fas fa-undo-alt"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 20px; margin: 0 0 8px;">Retrieve Appointment?</h3>
            
            <p style="color: #4a5a3f; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
                Piliin kung gusto mong gamitin ang <strong>dating schedule</strong> o <strong>bagong date at time</strong>.
            </p>
            
            <!-- ═══ LOCKED INFO ═══ -->
            <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 8px 12px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px; text-align: left;">
                <i class="fas fa-lock" style="color: #0284c7; font-size: 13px; margin-top: 2px;"></i>
                <p style="color: #0369a1; font-size: 11px; margin: 0; line-height: 1.4;">
                    <strong>Pet at Services ay hindi mababago.</strong> Same pa rin sa original booking.
                </p>
            </div>
            
            <!-- ═══ PET (LOCKED) ═══ -->
            <div style="background: #f7fbf3; border-radius: 10px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-bottom: 10px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">${petIcon}</div>
                    <div style="flex: 1;">
                        <div style="color: #2d3e1f; font-size: 12px; font-weight: 600;">
                            ${app.pet_name}
                        </div>
                        <div style="color: #94a387; font-size: 10px; margin-top: 1px;">
                            ${petType} • ${app.breed || 'Mixed Breed'}
                        </div>
                    </div>
                    <i class="fas fa-lock" style="color: #94a387; font-size: 11px;"></i>
                </div>
            </div>
            
            <!-- ═══ SERVICES (LOCKED) ═══ -->
            <div style="background: #f7fbf3; border-radius: 10px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-bottom: 16px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #5a7a3f; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">
                        <i class="fas fa-scissors"></i> Services (Locked)
                    </span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    ${servicesHTML}
                </div>
            </div>
            
            <!-- ═══ OPTION 1: SAME DATE/TIME ═══ -->
            <button onclick="window.retrieveWithOriginalDateTime(${app.id})"
                    style="
                        width: 100%;
                        padding: 14px 16px;
                        background: #ffffff;
                        border: 2px solid #d4e5c4;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: left;
                        font-family: 'Poppins', sans-serif;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 10px;
                    "
                    onmouseover="this.style.borderColor='#7ba05b'; this.style.background='#f7fbf3'; this.style.transform='translateY(-2px)';"
                    onmouseout="this.style.borderColor='#d4e5c4'; this.style.background='#ffffff'; this.style.transform='translateY(0)';">
                <div style="
                    width: 42px; height: 42px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                    color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 17px; flex-shrink: 0;
                ">
                    <i class="fas fa-clock"></i>
                </div>
                <div style="flex: 1; text-align: left;">
                    <div style="color: #2d3e1f; font-size: 13px; font-weight: 600; margin-bottom: 2px;">
                        Use Original Schedule
                    </div>
                    <div style="color: #94a387; font-size: 10px; line-height: 1.4;">
                        ${formattedDate}<br>${timeDisplay}
                    </div>
                </div>
                <i class="fas fa-chevron-right" style="color: #94a387; font-size: 13px;"></i>
            </button>
            
            <!-- ═══ OPTION 2: NEW DATE/TIME ═══ -->
            <button onclick="window.retrieveWithNewDateTime(${app.id})"
                    style="
                        width: 100%;
                        padding: 14px 16px;
                        background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                        border: 2px solid #7ba05b;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        text-align: left;
                        font-family: 'Poppins', sans-serif;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3);
                        margin-bottom: 16px;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(123, 160, 91, 0.4)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(123, 160, 91, 0.3)';">
                <div style="
                    width: 42px; height: 42px;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 17px; flex-shrink: 0;
                ">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div style="flex: 1; text-align: left;">
                    <div style="color: #ffffff; font-size: 13px; font-weight: 600; margin-bottom: 2px;">
                        Choose New Date &amp; Time
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.85); font-size: 10px; line-height: 1.4;">
                        Pumili ng bagong araw at oras
                    </div>
                </div>
                <i class="fas fa-chevron-right" style="color: rgba(255, 255, 255, 0.8); font-size: 13px;"></i>
            </button>
            
            <!-- ═══ CANCEL BUTTON ═══ -->
            <button class="modal-btn modal-btn-cancel" onclick="window.closeRetrieveConfirmModal()" 
                    style="width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

window.closeRetrieveConfirmModal = function() {
    const modal = document.getElementById('retrieveConfirmModal');
    if (modal) modal.remove();
};

// ═══════════════════════════════════════════════════════════════════
// ── Retrieve with ORIGINAL Date/Time ───────────────────────────────
// ── May confirmation modal muna bago mag-retrieve ──────────────────
// ═══════════════════════════════════════════════════════════════════
window.retrieveWithOriginalDateTime = function(appointmentId) {
    window.closeRetrieveConfirmModal();
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    // ✅ Show confirmation modal muna
    showOriginalScheduleConfirmModal(app);
};

// ═══════════════════════════════════════════════════════════════════
// ── Show Original Schedule Confirmation Modal ──────────────────────
// ── Ito ang confirm modal bago mag-retrieve ────────────────────────
// ═══════════════════════════════════════════════════════════════════
function showOriginalScheduleConfirmModal(app) {
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const servicesList = Array.isArray(app.services) ? app.services : [];
    const totalPrice = app.total_price || 0;
    const totalDuration = app.total_duration || 0;
    const formattedDuration = formatDuration(totalDuration);
    
    const dateObj = new Date(app.appointment_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeDisplay = formatTime(app.appointment_time);
    
    const petType = app.pet_type || 'Dog';
    const petIcon = petType === 'Cat' ? '<i class="fas fa-cat"></i>' : '<i class="fas fa-dog"></i>';
    
    // ── Build services HTML ──────────────────────────────────────
    let servicesHTML = '';
    if (servicesList.length > 0) {
        servicesList.forEach(svc => {
            servicesHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eaf3e0; font-size: 12px;">
                    <span style="color: #2d3e1f; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-check-circle" style="color: #7ba05b; font-size: 10px;"></i>
                        ${svc}
                    </span>
                </div>
            `;
        });
    } else {
        servicesHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #eaf3e0; font-size: 12px;">
                <span style="color: #2d3e1f; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-check-circle" style="color: #7ba05b; font-size: 10px;"></i>
                    ${serviceNames}
                </span>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'originalScheduleConfirmModal';
    overlay.style.zIndex = '3500';
    overlay.style.overflowY = 'auto';
    overlay.style.padding = '20px';
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 480px; text-align: center; position: relative; max-height: 95vh; overflow-y: auto;">
            <button type="button" class="modal-close-x" onclick="window.closeOriginalScheduleConfirmModal()" title="Close">✕</button>
            
            <div style="font-size: 56px; margin-bottom: 12px; color: #7ba05b;">
                <i class="fas fa-clipboard-check"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 20px; margin: 0 0 8px;">Confirm Retrieve?</h3>
            
            <p style="color: #4a5a3f; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
                Gusto mo bang i-retrieve ang appointment na ito gamit ang <strong>dating schedule</strong>?
            </p>
            
            <!-- ═══ INFO NOTICE ═══ -->
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 8px 12px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 8px; text-align: left;">
                <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 13px; margin-top: 2px;"></i>
                <p style="color: #d97706; font-size: 11px; margin: 0; line-height: 1.4;">
                    This appointment will be set back to <strong>pending</strong> status. You can pay after retrieving.
                </p>
            </div>
            
            <!-- ═══ PET ═══ -->
            <div style="background: #f7fbf3; border-radius: 10px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-bottom: 10px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="font-size: 18px;">${petIcon}</div>
                    <div style="flex: 1;">
                        <div style="color: #2d3e1f; font-size: 12px; font-weight: 600;">
                            ${app.pet_name}
                        </div>
                        <div style="color: #94a387; font-size: 10px; margin-top: 1px;">
                            ${petType} • ${app.breed || 'Mixed Breed'}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ═══ SERVICES ═══ -->
            <div style="background: #f7fbf3; border-radius: 10px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-bottom: 10px; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: #5a7a3f; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">
                        <i class="fas fa-scissors"></i> Services
                    </span>
                </div>
                <div style="display: flex; flex-direction: column;">
                    ${servicesHTML}
                </div>
            </div>
            
            <!-- ═══ DATE & TIME ═══ -->
            <div style="background: #f7fbf3; border-radius: 10px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-bottom: 16px; text-align: left;">
                <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-calendar-alt" style="color: #7ba05b;"></i> Date
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500; text-align: right; max-width: 220px;">
                        ${formattedDate}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-clock" style="color: #7ba05b;"></i> Time
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500; text-align: right;">
                        ${timeDisplay}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-tag" style="color: #7ba05b;"></i> Total
                    </span>
                    <span style="color: #7ba05b; font-weight: 700; text-align: right;">
                        ₱${totalPrice.toFixed(2)} • ${formattedDuration}
                    </span>
                </div>
            </div>
            
            <!-- ═══ ACTION BUTTONS ═══ -->
            <div class="modal-buttons" style="justify-content: center; gap: 10px;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeOriginalScheduleConfirmModal()" 
                        style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="modal-btn modal-btn-submit" 
                        onclick="window.executeOriginalScheduleRetrieve(${app.id})"
                        id="originalScheduleConfirmBtn"
                        style="flex: 1; background: linear-gradient(135deg, #7ba05b, #5a7a3f); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-check-circle"></i> Yes, Retrieve
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// ── Close Original Schedule Confirm Modal ──────────────────────────
window.closeOriginalScheduleConfirmModal = function() {
    const modal = document.getElementById('originalScheduleConfirmModal');
    if (modal) modal.remove();
};

// ═══════════════════════════════════════════════════════════════════
// ── Execute Original Schedule Retrieve ─────────────────────────────
// ── Ito ang tumatakbo pag clinick ang "Yes, Retrieve" ─────────────
// ═══════════════════════════════════════════════════════════════════
window.executeOriginalScheduleRetrieve = async function(appointmentId) {
    // Close confirmation modal
    window.closeOriginalScheduleConfirmModal();
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    showToast('Checking slot availability...', 'info');
    
    try {
        const checkData = await checkAvailability({
            appointment_date: app.appointment_date,
            appointment_time: app.appointment_time
        });
        
        if (!checkData.success || !checkData.available) {
            showSlotFullModal(app, checkData.message || 'This time slot is already full.');
            return;
        }
        
        // Proceed with retrieval (same date/time)
        await confirmRetrieval(appointmentId);
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════
// ── Retrieve with NEW Date/Time ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
window.retrieveWithNewDateTime = function(appointmentId) {
    window.closeRetrieveConfirmModal();
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    // ── Store retrieve context ────────────────────────────────────
    window._retrieveContext = {
        appointmentId: appointmentId,
        petId: app.pet_id,
        petName: app.pet_name,
        services: app.services || [],
        serviceNames: app.service_names || '',
        isRetrieveMode: true
    };
    
    // ── Open Book Appointment modal ────────────────────────────────
    if (typeof window.showBookAppointmentModal === 'function') {
        window.showBookAppointmentModal();
        
        // Wait for modal to render, then apply retrieve mode
        setTimeout(() => {
            applyRetrieveModeToBookingModal();
        }, 400);
    } else {
        showToast('Book Appointment modal not available.', 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════
// ── Apply Retrieve Mode to Book Appointment Modal ─────────────────
// ═══════════════════════════════════════════════════════════════════
function applyRetrieveModeToBookingModal() {
    const ctx = window._retrieveContext;
    if (!ctx || !ctx.isRetrieveMode) return;
    
    const modal = document.getElementById('bookAppointmentModal');
    if (!modal) return;
    
    const popup = modal.querySelector('.modal-popup');
    if (!popup) return;
    
    // ── 1. Add retrieve banner sa taas ────────────────────────────
    let banner = popup.querySelector('#retrieveModeBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'retrieveModeBanner';
        banner.style.cssText = `
            background: linear-gradient(135deg, rgba(123, 160, 91, 0.12), rgba(90, 122, 63, 0.12));
            border: 2px solid #7ba05b;
            border-radius: 12px;
            padding: 10px 14px;
            margin-bottom: 16px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            text-align: left;
        `;
        banner.innerHTML = `
            <i class="fas fa-undo-alt" style="color: #5a7a3f; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
            <div style="flex: 1;">
                <div style="color: #5a7a3f; font-size: 12px; font-weight: 700; margin-bottom: 2px;">
                    Retrieve Mode
                </div>
                <div style="color: #4a5a3f; font-size: 11px; line-height: 1.4;">
                    Pet ay naka-lock. Pumili lang ng bagong <strong>date at time</strong>. Pwede ring mag-add ng <strong>bagong services</strong>.
                </div>
            </div>
            <button onclick="window.cancelRetrieveMode()" 
                    style="background: transparent; border: none; color: #94a387; font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1;" 
                    title="Cancel retrieve mode">✕</button>
        `;
        
        popup.insertBefore(banner, popup.firstChild);
    }
    
    // ── 2. LOCK ang Pet dropdown ───────────────────────────────────
    const petSelect = document.getElementById('bookingPet');
    if (petSelect) {
        petSelect.value = ctx.petId;
        petSelect.disabled = true;
        petSelect.style.cssText = `
            background: #ececec !important;
            cursor: not-allowed !important;
            opacity: 0.7 !important;
        `;
        
        // Add lock icon sa label
        const petLabel = popup.querySelector('label[for="bookingPet"]');
        if (petLabel && !petLabel.querySelector('.lock-icon-pet')) {
            petLabel.innerHTML += ' <i class="fas fa-lock lock-icon-pet" style="color: #94a387; font-size: 10px;"></i>';
        }
    }
    
    // ── 3. LOCK existing Services, pero PWEDENG mag-add ng BAGO ──
    const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const isSelected = ctx.services.includes(cb.value);
        
        cb.checked = isSelected;
        
        const label = cb.closest('label');
        if (label) {
            if (isSelected) {
                // ✅ LOCKED — existing service, hindi pwedeng i-uncheck
                cb.disabled = true;
                label.style.cursor = 'not-allowed';
                label.style.opacity = '0.85';
                label.style.borderColor = '#7ba05b';
                label.style.background = 'rgba(123, 160, 91, 0.08)';
                
                // Add lock icon
                if (!label.querySelector('.lock-icon-svc')) {
                    const lockIcon = document.createElement('i');
                    lockIcon.className = 'fas fa-lock lock-icon-svc';
                    lockIcon.style.cssText = 'color: #94a387; font-size: 10px; margin-left: 6px;';
                    lockIcon.title = 'Locked — original service';
                    const infoSpan = label.querySelector('span');
                    if (infoSpan) infoSpan.appendChild(lockIcon);
                }
            } else {
                // ✅ UNLOCKED — bagong service, pwedeng i-check para i-add
                cb.disabled = false;
                label.style.cursor = 'pointer';
                label.style.opacity = '1';
                label.style.borderColor = '#e2e8f0';
                label.style.background = '#ffffff';
            }
        }
    });
    
    // ── 4. I-update ang Submit button text ────────────────────────
    const submitBtn = document.getElementById('bookAppointmentBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-undo-alt"></i> Retrieve Appointment';
        submitBtn.style.background = 'linear-gradient(135deg, #7ba05b, #5a7a3f)';
    }
    
    // ── 5. I-update ang modal title ───────────────────────────────
    const modalTitle = popup.querySelector('h3');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-undo-alt"></i> Retrieve Appointment';
    }
    
    // ── 6. I-update ang subtitle ──────────────────────────────────
    const subtitle = popup.querySelector('p');
    if (subtitle) {
        subtitle.innerHTML = '<i class="fas fa-lock"></i> Pet ay naka-lock. Pumili lang ng bagong date at time. Pwede ring mag-add ng bagong services.';
    }
    
    // ── 7. Override ang form submit handler ───────────────────────
    const form = document.getElementById('bookingForm');
    if (form) {
        // ✅ I-remove ang retrieve handler muna (kung meron na)
        form.removeEventListener('submit', handleRetrieveSubmit);
        
        // ✅ Mag-add ng retrieve handler na may capture=true para mauna
        form.addEventListener('submit', handleRetrieveSubmit, true);
    }
    
    showToast('Retrieve mode: Pumili ng bagong date at time', 'info');
}

// ═══════════════════════════════════════════════════════════════════
// ── Handle Retrieve Submit ─────────────────────────────────────────
// ── Ipakita ang Confirm Booking modal (tulad ng normal booking) ────
// ═══════════════════════════════════════════════════════════════════
async function handleRetrieveSubmit(e) {
    const ctx = window._retrieveContext;
    
    // ⚠️ KUNG HINDI RETRIEVE MODE, HUWAG GALAWIN — hayaan ang normal booking
    if (!ctx || !ctx.isRetrieveMode) {
        return;
    }
    
    // ✅ Retrieve mode — i-prevent ang default submit
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    // Validate date at time
    const appointment_date = document.getElementById('bookingDate').value;
    const appointment_time = document.getElementById('bookingTime').value;
    
    if (!appointment_date) {
        showToast('Please select a new date.', 'error');
        return;
    }
    
    if (!appointment_time) {
        showToast('Please select a new time.', 'error');
        return;
    }
    
    // ── Kunin LAHAT ng checked services ─────────────────────────
    const allCheckedServices = [];
    document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        allCheckedServices.push(cb.value);
    });
    
    // ── Compute additional services ─────────────────────────────
    const additionalServices = allCheckedServices.filter(svc => !ctx.services.includes(svc));
    
    console.log('<i class="fas fa-search"></i> Retrieve mode submit:');
    console.log('   All checked:', allCheckedServices);
    console.log('   Additional:', additionalServices);
    
    // ✅ Ipakita ang Confirm Booking modal (may retrieve flag)
    showRetrieveConfirmationBookingModal(
        ctx.appointmentId,
        appointment_date,
        appointment_time,
        allCheckedServices,
        additionalServices
    );
}

// ═══════════════════════════════════════════════════════════════════
// ── Show Retrieve Confirmation Booking Modal ───────────────────────
// ── Ito ang "Confirm Booking" modal para sa retrieve mode ──────────
// ═══════════════════════════════════════════════════════════════════
function showRetrieveConfirmationBookingModal(appointmentId, appointmentDate, appointmentTime, allServices, additionalServices) {
    const ctx = window._retrieveContext;
    if (!ctx) return;
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    // ── Format date at time ──────────────────────────────────────
    const dateObj = new Date(appointmentDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeDisplay = formatTime(appointmentTime);
    
    // ── Compute total price at duration ─────────────────────────
    let totalPrice = 0;
    let totalDuration = 0;
    
    // Hanapin ang price at duration ng bawat service
    document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        const price = parseFloat(cb.dataset.price) || 0;
        const duration = parseInt(cb.dataset.duration) || 0;
        totalPrice += price;
        totalDuration += duration;
    });
    
    const formattedDuration = formatDuration(totalDuration);
    
    // ── Build services HTML ─────────────────────────────────────
    let servicesHTML = '';
    allServices.forEach(svc => {
        const isOriginal = ctx.services.includes(svc);
        const cb = document.querySelector(`#serviceCheckboxes input[value="${svc}"]`);
        const price = cb ? parseFloat(cb.dataset.price) || 0 : 0;
        const duration = cb ? parseInt(cb.dataset.duration) || 0 : 0;
        
        servicesHTML += `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                <span style="color: #2d3e1f; display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;">
                    <i class="fas fa-check-circle" style="color: #7ba05b; font-size: 11px; flex-shrink: 0;"></i> 
                    <span style="word-break: break-word;">
                        ${svc}
                        ${isOriginal 
                            ? '<span style="color: #94a387; font-size: 10px; margin-left: 4px;">(original)</span>' 
                            : '<span style="color: #10b981; font-size: 10px; margin-left: 4px; font-weight: 700;">+ NEW</span>'}
                    </span>
                </span>
                <span style="color: #64748b; display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span><i class="fas fa-tag" style="color: #7ba05b;"></i> ₱${price.toFixed(2)}</span>
                    <span><i class="fas fa-clock" style="color: #7ba05b;"></i> ${duration} min</span>
                </span>
            </div>
        `;
    });
    
    // ── Create modal ──────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'retrieveConfirmBookingModal';
    overlay.style.zIndex = '3500';
    overlay.style.overflowY = 'auto';
    overlay.style.padding = '20px';
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 550px; text-align: left; position: relative; max-height: 95vh; overflow-y: auto;">
            <button type="button" class="modal-close-x" onclick="window.closeRetrieveConfirmBookingModal()" title="Close">✕</button>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;">
                    <i class="fas fa-clipboard-check"></i>
                </div>
                <h3 style="color: #5a7a3f; font-size: 22px; margin: 0;">Confirm Booking</h3>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">
                    Review your retrieved appointment details before confirming
                </p>
            </div>
            
            <!-- Retrieve Mode Banner -->
            <div style="background: linear-gradient(135deg, rgba(123, 160, 91, 0.12), rgba(90, 122, 63, 0.12)); border: 2px solid #7ba05b; border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 10px; text-align: left;">
                <i class="fas fa-undo-alt" style="color: #5a7a3f; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
                <div style="flex: 1;">
                    <div style="color: #5a7a3f; font-size: 12px; font-weight: 700; margin-bottom: 2px;">
                        Retrieving Cancelled Appointment
                    </div>
                    <div style="color: #4a5a3f; font-size: 11px; line-height: 1.4;">
                        This appointment will be set back to <strong>pending</strong> status.
                    </div>
                </div>
            </div>
            
            <!-- Details Box -->
            <div style="background: #f7fbf3; border-radius: 12px; padding: 20px; border: 1px solid #d4e5c4; margin-bottom: 20px;">
                
                <!-- Pet -->
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-paw" style="color: #7ba05b;"></i> Pet
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${app.pet_name}</span>
                </div>
                
                <!-- Services -->
                <div style="padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <div style="color: #64748b; margin-bottom: 5px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-scissors" style="color: #7ba05b;"></i> Services
                    </div>
                    ${servicesHTML}
                    <div style="display: flex; justify-content: space-between; padding-top: 8px; font-weight: 600; border-top: 1px solid #d4e5c4;">
                        <span style="color: #5a7a3f;">Total</span>
                        <span style="color: #7ba05b;">₱${totalPrice.toFixed(2)} • ${formattedDuration}</span>
                    </div>
                </div>
                
                <!-- Date -->
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-calendar-alt" style="color: #7ba05b;"></i> Date
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${formattedDate}</span>
                </div>
                
                <!-- Time -->
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-clock" style="color: #7ba05b;"></i> Time
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${timeDisplay}</span>
                </div>
            </div>
            
            <!-- Info Notice -->
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 16px; margin-top: 2px;"></i>
                <p style="color: #d97706; font-size: 13px; margin: 0; line-height: 1.5;">
                    Please double-check all details. You will receive a confirmation email once your booking is processed.
                </p>
            </div>
            
            <!-- Buttons -->
            <div class="modal-buttons" style="justify-content: center;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeRetrieveConfirmBookingModal()" 
                        style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-pen-to-square"></i> Edit
                </button>
                <button class="modal-btn modal-btn-submit" 
                        onclick="window.executeRetrieveBooking(${appointmentId}, '${appointmentDate}', '${appointmentTime}')"
                        id="retrieveConfirmBookingBtn"
                        style="flex: 1; background: linear-gradient(135deg, #7ba05b, #5a7a3f); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-check-circle"></i> Confirm Booking
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Store the additional services para magamit sa confirm
    window._retrieveAdditionalServices = additionalServices;
}

// ── Close Retrieve Confirm Booking Modal ────────────────────────────
window.closeRetrieveConfirmBookingModal = function() {
    const modal = document.getElementById('retrieveConfirmBookingModal');
    if (modal) modal.remove();
};

// ── Execute Retrieve Booking (after Confirm Booking click) ─────────
window.executeRetrieveBooking = async function(appointmentId, appointmentDate, appointmentTime) {
    const additionalServices = window._retrieveAdditionalServices || [];
    
    // Close confirmation modal
    window.closeRetrieveConfirmBookingModal();
    
    showToast('Retrieving appointment...', 'info');
    
    try {
        const res = await fetch(`/api/appointments/${appointmentId}/retrieve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                new_date: appointmentDate,
                new_time: appointmentTime,
                additional_services: additionalServices
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            // Get pet name bago i-clear ang context
            const petName = window._retrieveContext?.petName || '';
            
            // Close retrieve mode
            window.cancelRetrieveMode();
            
            // Close Book Appointment modal
            if (typeof window.closeBookAppointmentModal === 'function') {
                window.closeBookAppointmentModal();
            }
            
            showToast('<i class="fas fa-check-circle"></i> Appointment retrieved! Please proceed to payment.', 'success');
            
            // Reload appointments
            await loadAppointments();
            
            // Scroll to retrieved appointment
            setTimeout(() => {
                const cards = document.querySelectorAll('.appointment-card');
                for (let card of cards) {
                    if (card.querySelector('.appointment-pet')?.textContent.includes(petName)) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        break;
                    }
                }
            }, 500);
            
            // Clear additional services
            window._retrieveAdditionalServices = null;
            
        } else {
            showToast(data.message || 'Error retrieving appointment.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
};

// ═══════════════════════════════════════════════════════════════════
// ── Cancel Retrieve Mode ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
window.cancelRetrieveMode = function() {
    window._retrieveContext = null;
    window._retrieveAdditionalServices = null;
    
    // Remove banner
    const banner = document.getElementById('retrieveModeBanner');
    if (banner) banner.remove();
    
    // Remove lock icon sa pet label
    document.querySelectorAll('.lock-icon-pet').forEach(icon => icon.remove());
    
    // Remove lock icons sa services
    document.querySelectorAll('.lock-icon-svc').forEach(icon => icon.remove());
    
    // Unlock pet dropdown
    const petSelect = document.getElementById('bookingPet');
    if (petSelect) {
        petSelect.disabled = false;
        petSelect.style.cssText = '';
    }
    
    // Unlock service checkboxes
    const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.disabled = false;
        cb.checked = false;
        const label = cb.closest('label');
        if (label) {
            label.style.cursor = '';
            label.style.opacity = '';
            label.style.borderColor = '';
            label.style.background = '';
        }
    });
    
    // Reset submit button
    const submitBtn = document.getElementById('bookAppointmentBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Now';
        submitBtn.style.background = '';
    }
    
    // Reset form submit handler
    const form = document.getElementById('bookingForm');
    if (form) {
        form.removeEventListener('submit', handleRetrieveSubmit);
    }
};

// ── Confirm Retrieval (Same Date/Time) ────────────────────────────
export async function confirmRetrieval(appointmentId) {
    window.closeRetrieveConfirmModal();
    
    showToast('Retrieving appointment...', 'info');
    
    try {
        const res = await fetch(`/api/appointments/${appointmentId}/retrieve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        if (data.success) {
            showToast('<i class="fas fa-check-circle"></i> Appointment retrieved! Please proceed to payment.', 'success');
            
            await loadAppointments();
            
            setTimeout(() => {
                const retrievedApp = allAppointments.find(a => a.id === appointmentId);
                if (retrievedApp) {
                    const cards = document.querySelectorAll('.appointment-card');
                    for (let card of cards) {
                        if (card.querySelector('.appointment-pet')?.textContent.includes(retrievedApp.pet_name)) {
                            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            break;
                        }
                    }
                }
            }, 500);
            
        } else {
            showToast(data.message || 'Error retrieving appointment.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── SHOW APPOINTMENT RECEIPT (Customer View) ──────────────────────
// ═══════════════════════════════════════════════════════════════════
export function showAppointmentReceipt(appointmentId) {
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const servicesList = Array.isArray(app.services) ? app.services : [];
    const totalPrice = app.total_price || 0;
    const totalDuration = app.total_duration || 0;
    const formattedDuration = formatDuration(totalDuration);
    
    const dateObj = new Date(app.appointment_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeDisplay = formatTime(app.appointment_time);
    
    const pm = (app.payment_method || 'Xendit').toString();
    const pmLower = pm.toLowerCase();
    let pmIcon = '<i class="fas fa-money-bill"></i>';
    let pmDisplay = pm;
    if (pmLower.includes('card') || pmLower.includes('credit')) {
        pmIcon = '<i class="fas fa-credit-card"></i>'; pmDisplay = 'Credit/Debit Card';
    } else if (pmLower.includes('gcash')) {
        pmIcon = '<i class="fas fa-mobile-alt"></i>'; pmDisplay = 'GCash';
    } else if (pmLower.includes('maya') || pmLower.includes('paymaya')) {
        pmIcon = '<i class="fas fa-mobile-alt"></i>'; pmDisplay = 'Maya';
    } else if (pmLower.includes('grab')) {
        pmIcon = '<i class="fas fa-mobile-alt"></i>'; pmDisplay = 'GrabPay';
    } else if (pmLower.includes('bank') || pmLower.includes('bdo') || pmLower.includes('bpi')) {
        pmIcon = '<i class="fas fa-university"></i>'; pmDisplay = pm || 'Online Banking';
    } else if (pmLower.includes('7') || pmLower.includes('retail') || pmLower.includes('outlet')) {
        pmIcon = '<i class="fas fa-store"></i>'; pmDisplay = 'Retail Outlet';
    } else if (pmLower.includes('ewallet') || pmLower.includes('e-wallet')) {
        pmIcon = '<i class="fas fa-mobile-alt"></i>'; pmDisplay = 'E-Wallet';
    }
    
    const paidAt = app.paid_at || 'Just now';
    const paymentRef = app.payment_reference || 'N/A';
    const shortRef = paymentRef !== 'N/A' ? paymentRef.split('-').slice(-2).join('-') : 'N/A';
    
    const petType = app.pet_type || 'Dog';
    const petIcon = petType === 'Cat' ? '<i class="fas fa-cat"></i>' : '<i class="fas fa-dog"></i>';
    
    let servicesHTML = '';
    if (servicesList.length > 0) {
        servicesList.forEach(svc => {
            servicesHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="color: #2d3e1f; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background: #7ba05b; flex-shrink: 0;"></span>
                        ${svc}
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                        <span style="color: #94a387; font-size: 11px;">${formattedDuration}</span>
                        <span style="color: #5a7a3f; font-size: 13px; font-weight: 600; min-width: 60px; text-align: right;">₱${(totalPrice / servicesList.length).toFixed(2)}</span>
                    </div>
                </div>
            `;
        });
    } else {
        servicesHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="color: #2d3e1f; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #7ba05b; flex-shrink: 0;"></span>
                    ${serviceNames}
                </div>
                <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
                    <span style="color: #5a7a3f; font-size: 13px; font-weight: 600; min-width: 60px; text-align: right;">₱${totalPrice.toFixed(2)}</span>
                </div>
            </div>
        `;
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'appointmentReceiptModal';
    overlay.style.zIndex = '3000';
    overlay.style.overflowY = 'auto';
    overlay.style.padding = '20px';
    
    overlay.innerHTML = `
        <div class="receipt-modal-popup" style="
            background: #ffffff;
            border-radius: 24px;
            max-width: 520px;
            width: 100%;
            margin: auto;
            max-height: 95vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            border: 2px solid #10b981;
            position: relative;
        ">
            <button type="button" onclick="window.closeAppointmentReceipt()" 
                    style="position: absolute; top: 12px; right: 14px; background: transparent; border: none; color: #94a387; font-size: 24px; cursor: pointer; padding: 4px 10px; line-height: 1; border-radius: 8px; transition: all 0.2s ease; z-index: 10;"
                    onmouseover="this.style.color='#ef4444'; this.style.background='rgba(239,68,68,0.1)'"
                    onmouseout="this.style.color='#94a387'; this.style.background='transparent'"
                    title="Close">✕</button>
            
            <div style="padding: 30px 30px 20px; text-align: center; border-bottom: 1px solid #eaf3e0;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-size: 30px; margin-bottom: 12px; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);">
                    <i class="fas fa-check"></i>
                </div>
                <h1 style="color: #10b981; font-size: 22px; font-weight: 700; margin: 0 0 4px;">
                    Payment Successful!
                </h1>
                <p style="color: #4a5a3f; font-size: 13px; line-height: 1.5; margin: 0;">
                    Thank you! Your payment has been received.<br>
                    Your appointment is now <strong style="color: #10b981;">confirmed</strong>.
                </p>
            </div>
            
            <div style="padding: 20px 30px; border-bottom: 1px solid #eaf3e0;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, rgba(123, 160, 91, 0.15), rgba(90, 122, 63, 0.15)); color: #7ba05b; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">
                        <i class="fas fa-paw"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h2 style="color: #2d3e1f; font-size: 17px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${app.pet_name || 'Your Pet'}
                        </h2>
                        <p style="color: #94a387; font-size: 12px; margin: 2px 0 0;">
                            ${petType} • ${app.breed || 'Mixed Breed'}
                        </p>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.1); color: #10b981; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 12px; white-space: nowrap; flex-shrink: 0;">
                        <i class="fas fa-check-circle"></i> Confirmed
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <span style="color: #94a387; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-calendar-alt" style="color: #7ba05b; width: 16px;"></i> Date
                        </span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                            ${formattedDate}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <span style="color: #94a387; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-clock" style="color: #7ba05b; width: 16px;"></i> Time
                        </span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                            ${timeDisplay}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <span style="color: #94a387; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-hourglass-half" style="color: #7ba05b; width: 16px;"></i> Duration
                        </span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                            ${formattedDuration}
                        </span>
                    </div>
                </div>
            </div>
            
            <div style="padding: 20px 30px 25px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div>
                        <h3 style="color: #2d3e1f; font-size: 15px; font-weight: 700; margin: 0;">
                            Official Receipt
                        </h3>
                        <p style="color: #94a387; font-size: 11px; margin: 2px 0 0;">
                            PetLink Canine Distemper Center
                        </p>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f7fbf3; padding: 10px 14px; border-radius: 10px; margin-bottom: 15px;">
                    <span style="color: #94a387; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                        Receipt No.
                    </span>
                    <span style="color: #5a7a3f; font-size: 12px; font-weight: 700; font-family: monospace;">
                        #${app.id}-${shortRef}
                    </span>
                </div>
                
                <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-scissors" style="color: #7ba05b;"></i> Services
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${servicesHTML}
                </div>
                
                <div style="height: 1px; background: #eaf3e0; margin: 15px 0; border-top: 1px dashed #d4e5c4;"></div>
                
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; color: #4a5a3f; font-size: 13px;">
                        <span>Subtotal</span>
                        <span>₱${totalPrice.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; color: #2d3e1f; font-size: 16px; font-weight: 700; padding-top: 6px; border-top: 1px solid #eaf3e0;">
                        <span>Total Paid</span>
                        <span style="color: #10b981;">₱${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
                
                <div style="height: 1px; background: #eaf3e0; margin: 15px 0; border-top: 1px dashed #d4e5c4;"></div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-credit-card" style="color: #7ba05b; width: 14px;"></i> Payment Method
                        </span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 500; text-align: right;">
                            ${pmIcon} ${pmDisplay}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-clock" style="color: #7ba05b; width: 14px;"></i> Paid At
                        </span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 500; text-align: right;">
                            ${paidAt}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-hashtag" style="color: #7ba05b; width: 14px;"></i> Reference
                        </span>
                        <span style="color: #2d3e1f; font-size: 10px; font-weight: 500; text-align: right; font-family: monospace; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${paymentRef}
                        </span>
                    </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(123, 160, 91, 0.08)); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 12px 16px; margin-top: 15px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #10b981; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color: #10b981; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">PAID</strong>
                        <span style="color: #4a5a3f; font-size: 11px;">Thank you for your payment!</span>
                    </div>
                </div>
            </div>
            
            <div style="padding: 0 30px 25px; display: flex; gap: 10px;">
                <button onclick="window.printReceiptFromModal()" 
                        style="flex: 1; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; font-family: 'Poppins', sans-serif; background: #ffffff; color: #5a7a3f; border: 2px solid #d4e5c4;"
                        onmouseover="this.style.borderColor='#7ba05b'; this.style.background='#f7fbf3'"
                        onmouseout="this.style.borderColor='#d4e5c4'; this.style.background='#ffffff'">
                    <i class="fas fa-print"></i> Print
                </button>
                <button onclick="window.closeAppointmentReceipt()" 
                        style="flex: 1; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s ease; font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; border: none; box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(123, 160, 91, 0.4)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(123, 160, 91, 0.3)'">
                    <i class="fas fa-check"></i> Done
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeAppointmentReceipt();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeAppointmentReceipt();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// ── Close Appointment Receipt Modal ────────────────────────────────
export function closeAppointmentReceipt() {
    const modal = document.getElementById('appointmentReceiptModal');
    if (modal) {
        modal.remove();
    }
}

// ── Print Receipt from Modal ───────────────────────────────────────
export function printReceiptFromModal() {
    const modalContent = document.querySelector('#appointmentReceiptModal .receipt-modal-popup');
    if (!modalContent) {
        window.print();
        return;
    }
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>PetLink Receipt</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
                body { background: #ffffff; padding: 20px; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            ${modalContent.outerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 500);
}

// ── Show Appointment Details ──────────────────────────────────────
export function showAppointmentDetails(appointmentId) {
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const totalPrice = app.total_price || 0;
    const totalDuration = app.total_duration || 0;
    const formattedDuration = formatDuration(totalDuration);
    
    const dateObj = new Date(app.appointment_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeDisplay = formatTime(app.appointment_time);
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
    
    let statusIcon = '';
    if (app.status === 'pending') statusIcon = '<i class="fas fa-hourglass-half" style="color: #f59e0b;"></i>';
    else if (app.status === 'confirmed') statusIcon = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
    else if (app.status === 'completed') statusIcon = '<i class="fas fa-flag-checkered" style="color: #7ba05b;"></i>';
    else if (app.status === 'cancelled') statusIcon = '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
    
    // ✅ Payment status
    const isPaid = app.payment_status === 'paid';
    const isCancelled = app.status === 'cancelled';
    const canCancelFromDetails = !isPaid && !isCancelled && (app.status === 'pending' || app.status === 'confirmed');
    
    const detailsHTML = `
        <div style="text-align: left;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #d4e5c4;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(123, 160, 91, 0.15); display: flex; align-items: center; justify-content: center; color: #7ba05b; font-size: 22px;">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <div>
                    <h3 style="color: #5a7a3f; font-size: 20px; margin: 0;">Appointment Details</h3>
                    <p style="color: #94a3b8; font-size: 12px; margin: 2px 0 0;">Full information about your booking</p>
                </div>
            </div>
            
            <div style="background: #f7fbf3; border-radius: 12px; padding: 18px; border: 1px solid #d4e5c4; margin-bottom: 18px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-paw" style="color: #7ba05b;"></i> Pet
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${app.pet_name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-scissors" style="color: #7ba05b;"></i> Services
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500; max-width: 250px; text-align: right;">${serviceNames}</span>
                </div>
                ${totalPrice > 0 ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                        <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-tag" style="color: #7ba05b;"></i> Total
                        </span>
                        <span style="color: #7ba05b; font-weight: 600;">₱${totalPrice.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                        <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-clock" style="color: #7ba05b;"></i> Duration
                        </span>
                        <span style="color: #2d3e1f; font-weight: 500;">${formattedDuration}</span>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-calendar-alt" style="color: #7ba05b;"></i> Date
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${formattedDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-clock" style="color: #7ba05b;"></i> Time
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${timeDisplay}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; ${app.notes ? 'border-bottom: 1px solid #d4e5c4;' : ''}">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-info-circle" style="color: #7ba05b;"></i> Status
                    </span>
                    <span style="display: flex; align-items: center; gap: 6px; color: #2d3e1f; font-weight: 500;">${statusIcon} ${statusLabel}</span>
                </div>
                ${isPaid ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; ${app.notes ? 'border-bottom: 1px solid #d4e5c4;' : ''}">
                        <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-credit-card" style="color: #10b981;"></i> Payment
                        </span>
                        <span style="color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-check-circle"></i> Paid
                        </span>
                    </div>
                ` : ''}
                ${app.notes ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                        <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-pencil-alt" style="color: #7ba05b;"></i> Notes
                        </span>
                        <span style="color: #2d3e1f; font-weight: 500; max-width: 250px; text-align: right; word-wrap: break-word;">${app.notes}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'appointmentDetailsModal';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 550px; position: relative;">
            <button type="button" class="modal-close-x" onclick="window.closeAppointmentDetails()" title="Close">✕</button>
            
            ${detailsHTML}
            
            <div class="modal-buttons" style="justify-content: center; margin-top: 10px;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeAppointmentDetails()" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-times"></i> Close
                </button>
                ${isCancelled ? `
                    <button class="modal-btn" onclick="window.closeAppointmentDetails(); window.retrieveCancelledAppointment(${app.id})" style="flex: 1; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: 0.3s;">
                        <i class="fas fa-undo-alt"></i> Retrieve
                    </button>
                ` : ''}
                ${canCancelFromDetails ? `
                    <button class="modal-btn" onclick="window.cancelAppointmentFromDetails(${app.id})" style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: 0.3s;">
                        <i class="fas fa-times-circle"></i> Cancel Appointment
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// ── Close Appointment Details Modal ───────────────────────────────
export function closeAppointmentDetails() {
    const modal = document.getElementById('appointmentDetailsModal');
    if (modal) modal.remove();
}

// ── Cancel Appointment from Details Modal ─────────────────────────
export function cancelAppointmentFromDetails(appointmentId) {
    closeAppointmentDetails();
    cancelAppointment(appointmentId);
}

// ── Cancel Appointment (UPDATED with custom modal) ─────────────────
export async function cancelAppointment(appointmentId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'cancelConfirmModal';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 420px; text-align: center; position: relative;">
            <button type="button" class="modal-close-x" onclick="window.closeCancelConfirmModal()" title="Close">✕</button>
            
            <div style="font-size: 64px; margin-bottom: 15px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 24px; margin: 0 0 10px;">Cancel Appointment?</h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Are you sure you want to cancel this appointment? This action cannot be undone.
            </p>
            
            <div class="modal-buttons" style="justify-content: center;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeCancelConfirmModal()" 
                        style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-times"></i> Keep Appointment
                </button>
                <button class="modal-btn" onclick="window.executeCancelAppointment(${appointmentId})" 
                        style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; padding: 12px 25px; border-radius: 12px; font-weight: 600; cursor: pointer; font-family: 'Poppins', sans-serif; transition: 0.3s;">
                    <i class="fas fa-check-circle"></i> Yes, Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// ── Close Cancel Confirmation Modal ───────────────────────────────
export function closeCancelConfirmModal() {
    const modal = document.getElementById('cancelConfirmModal');
    if (modal) modal.remove();
}

// ── Execute Cancel Appointment ────────────────────────────────────
export async function executeCancelAppointment(appointmentId) {
    closeCancelConfirmModal();
    
    try {
        const data = await cancelAppointmentAPI(appointmentId);
        if (data.success) {
            showToast('Appointment cancelled successfully.', 'success');
            loadAppointments();
        } else {
            showToast(data.message || 'Error cancelling appointment.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ── Pay Appointment (Xendit Integration) — With Custom Modal ─────
export function payAppointment(appointmentId) {
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showToast('Appointment not found.', 'error');
        return;
    }
    
    const totalPrice = app.total_price || 0;
    const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
    const petName = app.pet_name || 'Your Pet';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'paymentConfirmModal';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 450px; text-align: center; position: relative;">
            <button type="button" class="modal-close-x" onclick="window.closePaymentConfirmModal()" title="Close">✕</button>
            
            <div style="font-size: 64px; margin-bottom: 15px; color: #f59e0b;">
                <i class="fas fa-credit-card"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 24px; margin: 0 0 10px;">Proceed to Payment?</h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                You will be redirected to our secure payment gateway (Xendit).
            </p>
            
            <div style="background: #f7fbf3; border-radius: 12px; padding: 16px 18px; border: 1px solid #d4e5c4; margin-bottom: 20px; text-align: left;">
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eaf3e0;">
                    <span style="color: #64748b; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-paw" style="color: #7ba05b;"></i> Pet
                    </span>
                    <span style="color: #2d3e1f; font-weight: 600; font-size: 13px;">${petName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eaf3e0;">
                    <span style="color: #64748b; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-scissors" style="color: #7ba05b;"></i> Service
                    </span>
                    <span style="color: #2d3e1f; font-weight: 600; font-size: 13px; max-width: 200px; text-align: right;">${serviceNames}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0 0;">
                    <span style="color: #64748b; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-tag" style="color: #7ba05b;"></i> Total
                    </span>
                    <span style="color: #7ba05b; font-weight: 700; font-size: 16px;">₱${totalPrice.toFixed(2)}</span>
                </div>
            </div>
            
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 8px; text-align: left;">
                <i class="fas fa-shield-alt" style="color: #f59e0b; font-size: 14px; margin-top: 2px;"></i>
                <p style="color: #d97706; font-size: 12px; margin: 0; line-height: 1.5;">
                    Your payment is secured by Xendit. You can pay via GCash or Maya.
                </p>
            </div>
            
            <div class="modal-buttons" style="justify-content: center;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closePaymentConfirmModal()" 
                        style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="modal-btn modal-btn-submit" 
                        onclick="window.executePayment(${appointmentId})"
                        style="flex: 1; background: linear-gradient(135deg, #f59e0b, #d97706); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-arrow-right"></i> Proceed
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// ── Close Payment Confirmation Modal ──────────────────────────────
export function closePaymentConfirmModal() {
    const modal = document.getElementById('paymentConfirmModal');
    if (modal) modal.remove();
}

// ── Execute Payment (called after confirmation) ───────────────────
export async function executePayment(appointmentId) {
    closePaymentConfirmModal();
    
    showToast('Creating payment link...', 'info');
    
    try {
        const res = await fetch(`/api/payment/create-invoice/${appointmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await res.json();
        
        if (data.success && data.invoice_url) {
            showToast('Redirecting to payment page...', 'success');
            setTimeout(() => {
                window.location.href = data.invoice_url;
            }, 800);
        } else {
            showToast(data.message || 'Error creating payment link.', 'error');
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ── Make functions globally available ──────────────────────────────
window.showAppointmentDetails = showAppointmentDetails;
window.closeAppointmentDetails = closeAppointmentDetails;
window.cancelAppointmentFromDetails = cancelAppointmentFromDetails;
window.cancelAppointment = cancelAppointment;
window.filterAppointments = filterAppointments;
window.payAppointment = payAppointment;
window.closePaymentConfirmModal = closePaymentConfirmModal;
window.executePayment = executePayment;

// ✅ Receipt functions
window.showAppointmentReceipt = showAppointmentReceipt;
window.closeAppointmentReceipt = closeAppointmentReceipt;
window.printReceiptFromModal = printReceiptFromModal;

// ✅ Retrieve functions
window.retrieveCancelledAppointment = retrieveCancelledAppointment;
window.confirmRetrieval = confirmRetrieval;
window.closeSlotFullModal = closeSlotFullModal;
window.closeRetrieveConfirmModal = closeRetrieveConfirmModal;
window.retrieveWithOriginalDateTime = retrieveWithOriginalDateTime;
window.retrieveWithNewDateTime = retrieveWithNewDateTime;
window.cancelRetrieveMode = cancelRetrieveMode;
window.closeRetrieveConfirmBookingModal = closeRetrieveConfirmBookingModal;
window.executeRetrieveBooking = executeRetrieveBooking;
window.closeOriginalScheduleConfirmModal = closeOriginalScheduleConfirmModal;
window.executeOriginalScheduleRetrieve = executeOriginalScheduleRetrieve;

// ✅ Cancel confirmation functions
window.closeCancelConfirmModal = closeCancelConfirmModal;
window.executeCancelAppointment = executeCancelAppointment;