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

// ═══════════════════════════════════════════════════════════════════
// ── Load Services for Booking (COLLAPSIBLE BY CATEGORY) ────────────
// ═══════════════════════════════════════════════════════════════════
export async function loadServices() {
    try {
        const data = await fetchServices();
        if (data.success) {
            const container = document.getElementById('serviceCheckboxes');
            container.innerHTML = '';
            selectedServices = [];
            
            // ── I-group ang services by category ─────────────────────
            const staffServices = data.services.filter(s => 
                (s.service_category || 'staff') === 'staff'
            );
            const vetServices = data.services.filter(s => 
                s.service_category === 'vet'
            );
            
            // ── Helper function para mag-render ng service checkbox ──
            const renderServiceCheckbox = (service) => {
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
                checkbox.dataset.category = service.service_category || 'staff';
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
                    
                    // ✅ Check vet availability kapag may vet service na na-select
                    if (this.dataset.category === 'vet' && this.checked) {
                        const selectedDate = document.getElementById('bookingDate').value;
                        if (selectedDate) {
                            loadTimeSlots(selectedDate, false);
                        }
                    }
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
                return label;
            };
            
            // ── Helper: Gumawa ng collapsible header ─────────────────
            const createCollapsibleHeader = (type, title, subtitle, icon, color, count, isExpanded) => {
                const header = document.createElement('div');
                header.className = `service-collapsible-header service-collapsible-${type}`;
                header.style.cssText = `
                    grid-column: 1 / -1;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    background: ${type === 'staff' 
                        ? 'linear-gradient(135deg, rgba(123, 160, 91, 0.12), rgba(90, 122, 63, 0.12))' 
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.12))'};
                    border: 2px solid ${color};
                    border-radius: 12px;
                    margin-bottom: 4px;
                    margin-top: 4px;
                    cursor: pointer;
                    user-select: none;
                    transition: all 0.25s ease;
                `;
                
                // Hover effect sa header
                header.onmouseenter = () => {
                    header.style.transform = 'translateY(-1px)';
                    header.style.boxShadow = `0 4px 12px ${type === 'staff' 
                        ? 'rgba(123, 160, 91, 0.2)' 
                        : 'rgba(59, 130, 246, 0.2)'}`;
                };
                header.onmouseleave = () => {
                    header.style.transform = 'translateY(0)';
                    header.style.boxShadow = 'none';
                };
                
                header.innerHTML = `
                    <div style="
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        background: ${type === 'staff' 
                            ? 'linear-gradient(135deg, #7ba05b, #5a7a3f)' 
                            : 'linear-gradient(135deg, #3b82f6, #2563eb)'};
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        flex-shrink: 0;
                    ">
                        <i class="${icon}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: #2d3e1f; font-size: 14px; font-weight: 700; margin-bottom: 2px;">
                            ${title}
                            <span style="
                                display: inline-block;
                                margin-left: 8px;
                                background: ${color};
                                color: #fff;
                                font-size: 10px;
                                font-weight: 700;
                                padding: 2px 8px;
                                border-radius: 10px;
                                vertical-align: middle;
                            ">${count}</span>
                        </div>
                        <div style="color: #4a5a3f; font-size: 11px;">
                            ${subtitle}
                        </div>
                    </div>
                    <div class="service-collapsible-arrow" style="
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: ${color};
                        font-size: 12px;
                        flex-shrink: 0;
                        transition: transform 0.3s ease;
                        transform: rotate(${isExpanded ? '180deg' : '0deg'});
                    ">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                `;
                
                return header;
            };
            
            // ── Helper: Gumawa ng wrapper para sa services ──────────
            const createServicesWrapper = (type, isExpanded) => {
                const wrapper = document.createElement('div');
                wrapper.className = `service-collapsible-wrapper service-wrapper-${type}`;
                wrapper.dataset.category = type;
                wrapper.style.cssText = `
                    grid-column: 1 / -1;
                    display: ${isExpanded ? 'grid' : 'none'};
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    padding: 4px 0;
                    animation: ${isExpanded ? 'fadeInService 0.3s ease' : 'none'};
                `;
                return wrapper;
            };
            
            // ═══════════════════════════════════════════════════════════
            // SECTION 1: STAFF SERVICES
            // ═══════════════════════════════════════════════════════════
            if (staffServices.length > 0) {
                // Default: EXPANDED ang staff services
                const staffHeader = createCollapsibleHeader(
                    'staff',
                    '<i class="fas fa-user-tie"></i> Staff Services',
                    'Grooming, styling, and other non-medical services',
                    'fas fa-scissors',
                    '#7ba05b',
                    staffServices.length,
                    true  // ← Default expanded
                );
                container.appendChild(staffHeader);
                
                const staffWrapper = createServicesWrapper('staff', true);
                staffServices.forEach(service => {
                    staffWrapper.appendChild(renderServiceCheckbox(service));
                });
                container.appendChild(staffWrapper);
                
                // ── Toggle functionality ─────────────────────────────
                staffHeader.onclick = () => {
                    const wrapper = container.querySelector('.service-wrapper-staff');
                    const arrow = staffHeader.querySelector('.service-collapsible-arrow');
                    
                    if (wrapper.style.display === 'none') {
                        wrapper.style.display = 'grid';
                        arrow.style.transform = 'rotate(180deg)';
                    } else {
                        wrapper.style.display = 'none';
                        arrow.style.transform = 'rotate(0deg)';
                    }
                };
            }
            
            // ═══════════════════════════════════════════════════════════
            // SECTION 2: VETERINARIAN SERVICES
            // ═══════════════════════════════════════════════════════════
            if (vetServices.length > 0) {
                // Default: COLLAPSED ang vet services (para hindi masyadong mahaba)
                const vetHeader = createCollapsibleHeader(
                    'vet',
                    '<i class="fas fa-stethoscope"></i> Veterinarian Services',
                    'Medical check-ups, vaccinations, and health services',
                    'fas fa-user-md',
                    '#3b82f6',
                    vetServices.length,
                    false  // ← Default collapsed
                );
                container.appendChild(vetHeader);
                
                const vetWrapper = createServicesWrapper('vet', false);
                vetServices.forEach(service => {
                    vetWrapper.appendChild(renderServiceCheckbox(service));
                });
                container.appendChild(vetWrapper);
                
                // ── Toggle functionality ─────────────────────────────
                vetHeader.onclick = () => {
                    const wrapper = container.querySelector('.service-wrapper-vet');
                    const arrow = vetHeader.querySelector('.service-collapsible-arrow');
                    
                    if (wrapper.style.display === 'none') {
                        wrapper.style.display = 'grid';
                        arrow.style.transform = 'rotate(180deg)';
                    } else {
                        wrapper.style.display = 'none';
                        arrow.style.transform = 'rotate(0deg)';
                    }
                };
            }
            
            // ── Fallback: kung walang services na nahanap ─────────────
            if (staffServices.length === 0 && vetServices.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #94a3b8;">
                        <i class="fas fa-info-circle"></i> No services available.
                    </div>
                `;
            }
            
            // ── Inject animation CSS kung wala pa ─────────────────────
            if (!document.getElementById('service-collapsible-styles')) {
                const style = document.createElement('style');
                style.id = 'service-collapsible-styles';
                style.textContent = `
                    @keyframes fadeInService {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    /* Mobile: 1 column lang */
                    @media (max-width: 640px) {
                        .service-collapsible-wrapper {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
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

// ═══════════════════════════════════════════════════════════════════
// ✅ Disable Vet Services (kapag hindi available ang vet)
// ═══════════════════════════════════════════════════════════════════
export function disableVetServices(vetMessage) {
    // ── Ipakita ang vet unavailable message ──────────────────
    const msg = document.getElementById('availabilityMessage');
    if (msg) {
        msg.className = 'availability-unavailable';
        msg.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <i class="fas fa-user-md" style="font-size: 18px; margin-top: 2px;"></i>
                <div>
                    <strong>Veterinarian Not Available</strong><br>
                    <span style="font-size: 12px;">${vetMessage || 'Veterinarian is not available on this date.'}</span><br>
                    <span style="font-size: 11px; opacity: 0.8; margin-top: 4px; display: block;">
                        <i class="fas fa-info-circle"></i> 
                        Vet services ay awtomatikong tinatanggal. Staff services lang ang pwede i-book sa araw na ito.
                    </span>
                </div>
            </div>
        `;
        msg.style.display = 'block';
    }
    
    // ── Auto-uncheck lahat ng vet services ────────────────
    document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        if (cb.dataset.category === 'vet') {
            cb.checked = false;
            const label = cb.closest('label');
            if (label) {
                label.style.borderColor = '#e2e8f0';
                label.style.background = '#ffffff';
                label.style.boxShadow = 'none';
            }
        }
    });
    
    // Update selected services count
    updateServiceSelection();
    
    // ── Disable vet services (may lock icon) ──────────────
    document.querySelectorAll('#serviceCheckboxes input[data-category="vet"]').forEach(cb => {
        cb.disabled = true;
        const label = cb.closest('label');
        if (label) {
            label.style.opacity = '0.5';
            label.style.cursor = 'not-allowed';
            label.title = 'Veterinarian not available on this date';
            
            // Idagdag ang lock icon
            if (!label.querySelector('.vet-lock-icon')) {
                const lockIcon = document.createElement('i');
                lockIcon.className = 'fas fa-lock vet-lock-icon';
                lockIcon.style.cssText = 'color: #94a387; font-size: 10px; margin-left: 6px;';
                const infoSpan = label.querySelector('span');
                if (infoSpan) infoSpan.appendChild(lockIcon);
            }
        }
    });
    
    showToast('<i class="fas fa-user-md"></i> Vet services removed — veterinarian not available on this date', 'info');
}

// ── Re-enable Vet Services ────────────────────────────────────────
export function reEnableVetServices() {
    document.querySelectorAll('#serviceCheckboxes input[data-category="vet"]').forEach(cb => {
        cb.disabled = false;
        const label = cb.closest('label');
        if (label) {
            label.style.opacity = '1';
            label.style.cursor = 'pointer';
            label.title = '';
            
            // Remove ang lock icon
            const lockIcon = label.querySelector('.vet-lock-icon');
            if (lockIcon) lockIcon.remove();
        }
    });
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
    
    // ✅ I-reset ang lahat ng service checkboxes (kasama ang vet lock icons)
    const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        cb.disabled = false;
        const label = cb.closest('label');
        if (label) {
            label.style.opacity = '1';
            label.style.cursor = 'pointer';
            label.title = '';
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#ffffff';
            label.style.boxShadow = 'none';
            
            // Remove ang lock icon kung meron
            const lockIcon = label.querySelector('.vet-lock-icon');
            if (lockIcon) lockIcon.remove();
        }
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
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ FINAL CHECK: Verify vet availability bago mag-confirm
    // ═══════════════════════════════════════════════════════════════
    const servicesWithCategory = [];
    document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]:checked').forEach(cb => {
        servicesWithCategory.push({
            name: cb.value,
            category: cb.dataset.category || 'staff'
        });
    });
    
    const hasVetServices = servicesWithCategory.some(s => s.category === 'vet');
    
    if (hasVetServices) {
        try {
            const res = await fetch('/api/appointments/check-combined-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_date: appointment_date,
                    services: services
                })
            });
            const data = await res.json();
            
            if (data.success && data.needs_vet && !data.vet_available) {
                showToast(`<i class="fas fa-user-md"></i> Hindi available ang vet sa ${data.day_name}. Please remove vet services or change date.`, 'error');
                return;
            }
        } catch (error) {
            console.error('Error verifying vet availability:', error);
        }
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
            
            // ── NEW: Show custom post-booking modal ──────────────────
            const totalAmount = data.total_price || 0;
            const appointmentId = data.appointment_id;
            
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.id = 'postBookingPaymentModal';
            overlay.style.zIndex = '3000';
            overlay.innerHTML = `
                <div class="modal-popup" style="max-width: 450px; text-align: center; position: relative;">
                    
                    <div style="font-size: 64px; margin-bottom: 15px; color: #10b981;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    
                    <h3 style="color: #5a7a3f; font-size: 24px; margin: 0 0 10px;">Booking Successful!</h3>
                    
                    <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        Your appointment has been booked. Would you like to pay now to confirm it?
                    </p>
                    
                    <!-- Amount Display -->
                    <div style="background: linear-gradient(135deg, #f7fbf3, #eaf3e0); border-radius: 12px; padding: 20px; border: 1px solid #d4e5c4; margin-bottom: 20px;">
                        <div style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 5px;">
                            Total Amount
                        </div>
                        <div style="color: #7ba05b; font-size: 32px; font-weight: 700;">
                            ₱${totalAmount.toFixed(2)}
                        </div>
                    </div>
                    
                    <!-- Info Notice -->
                    <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 10px 14px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 8px; text-align: left;">
                        <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 14px; margin-top: 2px;"></i>
                        <p style="color: #d97706; font-size: 12px; margin: 0; line-height: 1.5;">
                            You can also pay later from <strong>"My Appointments"</strong>. Unpaid appointments can be paid anytime.
                        </p>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="modal-buttons" style="justify-content: center;">
                        <button class="modal-btn modal-btn-cancel" 
                                onclick="window.skipPostBookingPayment()" 
                                style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-clock"></i> Pay Later
                        </button>
                        <button class="modal-btn modal-btn-submit" 
                                onclick="window.payAfterBooking(${appointmentId})"
                                style="flex: 1; background: linear-gradient(135deg, #f59e0b, #d97706); display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas fa-credit-card"></i> Pay Now
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Reload appointments in background
            loadAppointments();
            
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

// ── Skip Post-Booking Payment ─────────────────────────────────────
export function skipPostBookingPayment() {
    const modal = document.getElementById('postBookingPaymentModal');
    if (modal) modal.remove();
    
    showToast('Appointment booked! You can pay later from My Appointments.', 'success');
    switchSection('appointments');
}

// ── Pay After Booking ──────────────────────────────────────────────
export async function payAfterBooking(appointmentId) {
    const modal = document.getElementById('postBookingPaymentModal');
    if (modal) modal.remove();
    
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
            switchSection('appointments');
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        showToast('Something went wrong. Please try again.', 'error');
        switchSection('appointments');
    }
}

// ── Make functions globally available ──────────────────────────────
window.showBookAppointmentModal = showBookAppointmentModal;
window.closeBookAppointmentModal = closeBookAppointmentModal;
window.submitAppointment = submitAppointment;
window.showBookingConfirmation = showBookingConfirmation;
window.closeBookingConfirmation = closeBookingConfirmation;
window.confirmBooking = confirmBooking;
window.skipPostBookingPayment = skipPostBookingPayment;
window.payAfterBooking = payAfterBooking;

// ✅ Vet availability functions
window.disableVetServices = disableVetServices;
window.reEnableVetServices = reEnableVetServices;