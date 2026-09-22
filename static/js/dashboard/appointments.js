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
    
    // Update tabs - use classes instead of inline styles
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.classList.remove('active');
        // Remove any inline styles that might interfere
        tab.style.background = '';
        tab.style.color = '';
        if (tab.dataset.tab === status) {
            tab.classList.add('active');
        }
    });
    
    // Filter appointments
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
    
    let html = '';
    appointments.forEach(app => {
        const statusClass = `status-${app.status}`;
        const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        const canCancel = app.status === 'pending' || app.status === 'confirmed';
        
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
                    ${canCancel ? `
                        <button class="btn-cancel-appointment" onclick="window.cancelAppointment(${app.id})">
                            <i class="fas fa-times-circle"></i> Cancel
                        </button>
                    ` : ''}
                    <button class="btn-view-details" onclick="window.showAppointmentDetails(${app.id})">
                        <i class="fas fa-clipboard-list"></i> View Details
                    </button>
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
    
    // Update tab counts
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
    
    // Status icon
    let statusIcon = '';
    if (app.status === 'pending') statusIcon = '<i class="fas fa-hourglass-half" style="color: #f59e0b;"></i>';
    else if (app.status === 'confirmed') statusIcon = '<i class="fas fa-check-circle" style="color: #10b981;"></i>';
    else if (app.status === 'completed') statusIcon = '<i class="fas fa-flag-checkered" style="color: #7ba05b;"></i>';
    else if (app.status === 'cancelled') statusIcon = '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
    
    // Build details HTML
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
    
    // Create custom modal
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
                ${(app.status === 'pending' || app.status === 'confirmed') ? `
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

// ── Cancel Appointment ─────────────────────────────────────────────
export async function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
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

// ── Make functions globally available ──────────────────────────────
window.showAppointmentDetails = showAppointmentDetails;
window.closeAppointmentDetails = closeAppointmentDetails;
window.cancelAppointmentFromDetails = cancelAppointmentFromDetails;
window.cancelAppointment = cancelAppointment;
window.filterAppointments = filterAppointments;