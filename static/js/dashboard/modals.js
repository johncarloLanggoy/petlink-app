// ── MODAL MANAGEMENT ─────────────────────────────────────────────────

import { 
    fetchServices, 
    fetchPets, 
    bookAppointment, 
    checkAvailability 
} from './services.js';
import { showToast, formatDuration, formatTime, getLoggedInEmail } from './utils.js';
import { renderDatePicker, changeMonth, selectToday, selectDate, selectTime, loadTimeSlots } from './datepicker.js';
import { loadAppointments, updateOverviewStats } from './appointments.js';
import { getCurrentSection, switchSection } from './sidebar.js';

let selectedServices = [];

// ── Load Services for Booking ──────────────────────────────────────
export async function loadServices() {
    try {
        const data = await fetchServices();
        if (data.success) {
            const container = document.getElementById('serviceCheckboxes');
            container.innerHTML = '';
            selectedServices = [];
            
            data.services.forEach(service => {
                const label = document.createElement('label');
                label.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    background: #ffffff;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    font-size: 13px;
                    color: #334155;
                    position: relative;
                `;
                
                // Hover effect
                label.onmouseenter = () => {
                    if (!label.querySelector('input').checked) {
                        label.style.borderColor = '#7ba05b';
                        label.style.background = 'rgba(123, 160, 91, 0.04)';
                        label.style.transform = 'translateY(-2px)';
                        label.style.boxShadow = '0 4px 12px rgba(123, 160, 91, 0.12)';
                    }
                };
                label.onmouseleave = () => {
                    if (!label.querySelector('input').checked) {
                        label.style.borderColor = '#e2e8f0';
                        label.style.background = '#ffffff';
                        label.style.transform = 'translateY(0)';
                        label.style.boxShadow = 'none';
                    }
                };
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = service.name;
                checkbox.dataset.price = service.price;
                checkbox.dataset.duration = service.duration;
                checkbox.id = `service-${service.id}`;
                checkbox.style.cssText = `
                    width: 18px;
                    height: 18px;
                    accent-color: #7ba05b;
                    cursor: pointer;
                    flex-shrink: 0;
                `;
                
                checkbox.addEventListener('change', function() {
                    if (this.checked) {
                        label.style.borderColor = '#7ba05b';
                        label.style.background = 'rgba(123, 160, 91, 0.08)';
                        label.style.boxShadow = '0 4px 12px rgba(123, 160, 91, 0.15)';
                    } else {
                        label.style.borderColor = '#e2e8f0';
                        label.style.background = '#ffffff';
                        label.style.boxShadow = 'none';
                    }
                    updateServiceSelection();
                });
                
                const info = document.createElement('span');
                info.innerHTML = `
                    <span style="font-weight: 600; display: block; color: #2d3e1f; margin-bottom: 2px;">${service.name}</span>
                    <span style="color: #64748b; font-size: 11px; display: flex; align-items: center; gap: 8px;">
                        <span><i class="fas fa-tag" style="color: #7ba05b;"></i> ₱${service.price}</span>
                        <span><i class="fas fa-clock" style="color: #7ba05b;"></i> ${service.duration} min</span>
                    </span>
                `;
                info.style.cssText = `
                    flex: 1;
                    line-height: 1.4;
                `;
                
                label.appendChild(checkbox);
                label.appendChild(info);
                container.appendChild(label);
            });
            
            updateServiceSelection();
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// ── Update Service Selection ──────────────────────────────────────
function updateServiceSelection() {
    const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
    const selected = [];
    let totalPrice = 0;
    let totalDuration = 0;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selected.push(cb.value);
            totalPrice += parseFloat(cb.dataset.price) || 0;
            totalDuration += parseInt(cb.dataset.duration) || 0;
        }
    });
    
    selectedServices = selected;
    document.getElementById('bookingServices').value = selected.join(',');
    
    const countDisplay = document.getElementById('selectedServicesCount');
    const priceDisplay = document.getElementById('totalServicePrice');
    
    if (selected.length === 0) {
        countDisplay.innerHTML = '<i class="fas fa-info-circle"></i> No services selected';
        countDisplay.style.color = '#94a3b8';
        priceDisplay.innerHTML = '<i class="fas fa-tag"></i> Total: ₱0.00';
        priceDisplay.style.color = '#94a3b8';
    } else {
        countDisplay.innerHTML = `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${selected.length} service${selected.length > 1 ? 's' : ''} selected`;
        countDisplay.style.color = '#5a7a3f';
        priceDisplay.innerHTML = `<i class="fas fa-tag"></i> Total: ₱${totalPrice.toFixed(2)} <span style="color: #64748b; font-weight: 400; font-size: 12px;">(${formatDuration(totalDuration)})</span>`;
        priceDisplay.style.color = '#7ba05b';
    }
}

// ── Load Pets for Booking ─────────────────────────────────────────
export async function loadPetsForBooking() {
    const email = getLoggedInEmail();
    if (!email) return;
    
    try {
        const data = await fetchPets(email);
        if (data.success) {
            const select = document.getElementById('bookingPet');
            select.innerHTML = '<option value="">Choose your pet...</option>';
            data.pets.forEach(pet => {
                const option = document.createElement('option');
                option.value = pet.id;
                const petType = pet.pet_type || 'Dog';
                const petLabel = petType === 'Cat' ? 'Cat' : 'Dog';
                option.textContent = `${pet.name} (${petLabel} · ${pet.breed || 'Mixed Breed'})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// ── Show Book Appointment Modal ───────────────────────────────────
export function showBookAppointmentModal() {
    document.getElementById('bookAppointmentModal').style.display = 'flex';
    loadServices();
    loadPetsForBooking();
    document.getElementById('bookingForm').reset();
    
    const today = new Date();
    window.currentMonth = today.getMonth();
    window.currentYear = today.getFullYear();
    window.selectedDate = null;
    window.selectedTime = null;
    window.cachedAvailability = null;
    
    document.getElementById('timeSlotsGroup').style.display = 'none';
    document.getElementById('selectedDateDisplay').textContent = 'No date selected';
    document.getElementById('bookingDate').value = '';
    document.getElementById('bookingTime').value = '';
    document.getElementById('availabilityMessage').style.display = 'none';
    document.getElementById('availabilityMessage').className = '';
    document.getElementById('availabilityMessage').textContent = '';
    
    const grid = document.getElementById('timeSlotsGrid');
    if (grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;"><i class="fas fa-calendar-alt"></i> Select a date to see available times</div>';
    }
    
    renderDatePicker();
    
    setTimeout(() => {
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const cells = document.querySelectorAll('.day-cell');
        for (const cell of cells) {
            if (cell.dataset.date === dateStr && !cell.classList.contains('disabled') && 
                !cell.classList.contains('closed-day') && !cell.classList.contains('fully-booked')) {
                cell.click();
                break;
            }
        }
    }, 300);
}

// ── Close Book Appointment Modal ──────────────────────────────────
export function closeBookAppointmentModal() {
    document.getElementById('bookAppointmentModal').style.display = 'none';
    
    window.selectedDate = null;
    window.selectedTime = null;
    
    const grid = document.getElementById('timeSlotsGrid');
    if (grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;"><i class="fas fa-calendar-alt"></i> Select a date to see available times</div>';
    }
    
    document.getElementById('timeSlotsGroup').style.display = 'none';
    document.getElementById('selectedDateDisplay').innerHTML = '<i class="fas fa-times-circle"></i> No date selected';
    document.getElementById('bookingDate').value = '';
    document.getElementById('bookingTime').value = '';
    document.getElementById('availabilityMessage').style.display = 'none';
    document.getElementById('availabilityMessage').className = '';
    document.getElementById('availabilityMessage').textContent = '';
    
    const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
    });
    updateServiceSelection();
}

// ── Submit Appointment ────────────────────────────────────────────
export async function submitAppointment(e) {
    e.preventDefault();
    
    const pet_id = document.getElementById('bookingPet').value;
    const servicesInput = document.getElementById('bookingServices').value;
    const services = servicesInput ? servicesInput.split(',').map(s => s.trim()) : [];
    const appointment_date = document.getElementById('bookingDate').value;
    const appointment_time = document.getElementById('bookingTime').value;
    const notes = document.getElementById('bookingNotes').value.trim();
    
    if (!pet_id) {
        showToast('Please select a pet.', 'error');
        return;
    }
    
    if (services.length === 0) {
        showToast('Please select at least one service.', 'error');
        return;
    }
    
    if (!appointment_date || !appointment_time) {
        showToast('Please select a date and time.', 'error');
        return;
    }
    
    showBookingConfirmation(pet_id, services, appointment_date, appointment_time, notes);
}

// ── Show Booking Confirmation ─────────────────────────────────────
export function showBookingConfirmation(pet_id, services, appointment_date, appointment_time, notes) {
    const petSelect = document.getElementById('bookingPet');
    const petName = petSelect.options[petSelect.selectedIndex]?.text || 'Your pet';
    const serviceNames = services.join(', ');
    
    let totalPrice = 0;
    let totalDuration = 0;
    const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (services.includes(cb.value)) {
            totalPrice += parseFloat(cb.dataset.price) || 0;
            totalDuration += parseInt(cb.dataset.duration) || 0;
        }
    });
    
    const formattedDuration = formatDuration(totalDuration);
    
    const [year, month, day] = appointment_date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    const timeDisplay = formatTime(appointment_time);
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'bookingConfirmationModal';
    overlay.style.zIndex = '3000';
    
    let servicesHTML = '';
    checkboxes.forEach(cb => {
        if (services.includes(cb.value)) {
            const price = parseFloat(cb.dataset.price) || 0;
            const duration = parseInt(cb.dataset.duration) || 0;
            servicesHTML += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
                    <span style="color: #2d3e1f; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-check-circle" style="color: #7ba05b; font-size: 11px;"></i> ${cb.value}
                    </span>
                    <span style="color: #64748b; display: flex; align-items: center; gap: 8px;">
                        <span><i class="fas fa-tag" style="color: #7ba05b;"></i> ₱${price.toFixed(2)}</span>
                        <span><i class="fas fa-clock" style="color: #7ba05b;"></i> ${duration} min</span>
                    </span>
                </div>
            `;
        }
    });
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 550px; text-align: left; position: relative;">
            <button type="button" class="modal-close-x" onclick="window.closeBookingConfirmation()" title="Close">✕</button>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-clipboard-check"></i></div>
                <h3 style="color: #5a7a3f; font-size: 24px; margin: 0;">Confirm Appointment</h3>
                <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Please review your appointment details before booking</p>
            </div>
            
            <div style="background: #f7fbf3; border-radius: 12px; padding: 20px; border: 1px solid #d4e5c4; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4e5c4;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-paw" style="color: #7ba05b;"></i> Pet
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500;">${petName}</span>
                </div>
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
                ${notes ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #64748b; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-pencil-alt" style="color: #7ba05b;"></i> Notes
                    </span>
                    <span style="color: #2d3e1f; font-weight: 500; max-width: 200px; text-align: right; word-wrap: break-word;">${notes}</span>
                </div>
                ` : ''}
            </div>
            
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 16px; margin-top: 2px;"></i>
                <p style="color: #d97706; font-size: 13px; margin: 0; line-height: 1.5;">
                    Please double-check all details. You will receive a confirmation email once your booking is processed.
                </p>
            </div>
            
            <div class="modal-buttons" style="justify-content: center;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeBookingConfirmation()" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-pen-to-square"></i> Edit
                </button>
                <button class="modal-btn modal-btn-submit" onclick="window.confirmBooking()" id="confirmBookingBtn" style="flex: 1; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #fff; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                    <i class="fas fa-check-circle"></i> Confirm Booking
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    window._pendingBooking = {
        pet_id,
        services,
        appointment_date,
        appointment_time,
        notes
    };
}

// ── Close Booking Confirmation ────────────────────────────────────
export function closeBookingConfirmation() {
    const modal = document.getElementById('bookingConfirmationModal');
    if (modal) {
        modal.remove();
    }
    window._pendingBooking = null;
}

// ── Confirm Booking ────────────────────────────────────────────────
export async function confirmBooking() {
    const btn = document.getElementById('confirmBookingBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
    btn.disabled = true;
    
    const booking = window._pendingBooking;
    if (!booking) {
        showToast('Booking data not found. Please try again.', 'error');
        closeBookingConfirmation();
        return;
    }
    
    const { pet_id, services, appointment_date, appointment_time, notes } = booking;
    
    try {
        const checkData = await checkAvailability({ appointment_date, appointment_time });
        
        if (!checkData.success || !checkData.available) {
            showToast(checkData.message || 'This time slot is no longer available.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            closeBookingConfirmation();
            loadTimeSlots(appointment_date);
            return;
        }
        
        const data = await bookAppointment({ pet_id, services, appointment_date, appointment_time, notes });
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (data.success) {
            closeBookingConfirmation();
            closeBookAppointmentModal();
            showToast('Appointment booked successfully! Please wait for confirmation.', 'success');
            loadAppointments();
            switchSection('appointments');
        } else {
            showToast(data.message || 'Error booking appointment.', 'error');
            if (data.slot_full || data.daily_full || data.day_closed) {
                loadTimeSlots(appointment_date);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        btn.innerHTML = originalText;
        btn.disabled = false;
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ── Make functions globally available ──────────────────────────────
window.showBookAppointmentModal = showBookAppointmentModal;
window.closeBookAppointmentModal = closeBookAppointmentModal;
window.submitAppointment = submitAppointment;
window.showBookingConfirmation = showBookingConfirmation;
window.closeBookingConfirmation = closeBookingConfirmation;
window.confirmBooking = confirmBooking;