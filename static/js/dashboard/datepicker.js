// ── DATE PICKER AND TIME SLOTS ──────────────────────────────────────

import { fetchBookedSlots } from './services.js';
import { showToast, formatTime } from './utils.js';
import { CONFIG } from './config.js';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;
let cachedAvailability = null;

// ── Render Date Picker ─────────────────────────────────────────────
export function renderDatePicker() {
    const grid = document.getElementById('datePickerGrid');
    const label = document.getElementById('monthYearLabel');
    
    if (!grid) return;
    
    // Clear grid but keep headers
    const headers = grid.querySelectorAll('.day-header');
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));
    
    label.textContent = `${CONFIG.MONTHS[currentMonth]} ${currentYear}`;
    
    let firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Previous month days (fillers)
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell empty';
        grid.appendChild(empty);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = day;
        
        const dateObj = new Date(currentYear, currentMonth, day);
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
        
        const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isPast = dateObj < todayLocal;
        
        if (isToday) cell.classList.add('today');
        
        if (isPast) {
            cell.classList.add('disabled');
            cell.title = 'Past dates are not available';
        } else {
            cell.dataset.date = dateStr;
            cell.onclick = () => selectDate(dateStr);
            cell.classList.add('loading');
        }
        
        grid.appendChild(cell);
    }
    
    checkMonthAvailability();
}

// ── Check Month Availability ──────────────────────────────────────
async function checkMonthAvailability() {
    const grid = document.getElementById('datePickerGrid');
    const cells = grid.querySelectorAll('.day-cell:not(.empty):not(.disabled)');
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    for (const cell of cells) {
        const dateStr = cell.dataset.date;
        if (!dateStr) continue;
        
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        
        if (dateObj < todayLocal) {
            cell.classList.add('disabled');
            continue;
        }
        
        try {
            const data = await fetchBookedSlots(dateStr);
            
            if (data.success) {
                cell.classList.remove('loading');
                
                if (!data.day_available) {
                    cell.classList.add('closed-day');
                    cell.title = 'Clinic closed on this day';
                } else if (data.is_daily_full) {
                    cell.classList.add('fully-booked');
                    cell.title = `Fully booked (${data.daily_booked}/${data.daily_max})`;
                } else {
                    let hasAvailable = false;
                    
                    for (const [time, info] of Object.entries(data.slots)) {
                        if (info.available && info.is_active) {
                            hasAvailable = true;
                            break;
                        }
                    }
                    
                    if (hasAvailable) {
                        cell.classList.add('has-availability');
                        cell.title = `${data.daily_booked}/${data.daily_max} booked today`;
                    } else {
                        cell.classList.add('fully-booked');
                        cell.title = 'No available slots';
                    }
                }
            }
        } catch (error) {
            console.error('Error checking date availability:', error);
        }
    }
}

// ── Select Date ────────────────────────────────────────────────────
export function selectDate(dateStr) {
    const grid = document.getElementById('datePickerGrid');
    const cells = grid.querySelectorAll('.day-cell');
    
    cells.forEach(c => c.classList.remove('selected'));
    
    let selectedCell = null;
    cells.forEach(c => {
        if (c.dataset.date === dateStr) {
            c.classList.add('selected');
            selectedCell = c;
        }
    });
    
    if (!selectedCell) return;
    if (selectedCell.classList.contains('disabled') || 
        selectedCell.classList.contains('closed-day') || 
        selectedCell.classList.contains('fully-booked')) {
        showToast('This date is not available. Please select another date.', 'error');
        return;
    }
    
    selectedDate = dateStr;
    document.getElementById('bookingDate').value = dateStr;
    
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    
    document.getElementById('selectedDateDisplay').textContent = localDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
    
    document.getElementById('timeSlotsGroup').style.display = 'block';
    document.getElementById('timeSlotDateLabel').textContent = 
        `Available slots for ${localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    
    loadTimeSlots(dateStr);
}

// ── Load Time Slots ────────────────────────────────────────────────
export async function loadTimeSlots(dateStr) {
    const grid = document.getElementById('timeSlotsGrid');
    const msg = document.getElementById('availabilityMessage');
    
    if (!grid) return;
    
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">⏳ Loading available times...</div>';
    msg.style.display = 'none';
    msg.className = '';
    
    try {
        const data = await fetchBookedSlots(dateStr);
        
        if (!data.success) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Error loading time slots</div>';
            return;
        }
        
        const slots = data.slots;
        const dayAvailable = data.day_available;
        const dayName = data.day_name || 'this day';
        const isDailyFull = data.is_daily_full || false;
        const dailyBooked = data.daily_booked || 0;
        const dailyMax = data.daily_max || 3;
        
        if (!dayAvailable) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Clinic is closed on ${dayName}</div>`;
            msg.className = 'availability-unavailable';
            msg.textContent = `❌ The clinic is closed on ${dayName}. Please choose another day.`;
            msg.style.display = 'block';
            return;
        }
        
        if (isDailyFull) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Fully booked on ${dayName} (${dailyBooked}/${dailyMax} appointments)</div>`;
            msg.className = 'availability-unavailable';
            msg.textContent = `❌ This day is fully booked (${dailyBooked}/${dailyMax} appointments). Please choose another day.`;
            msg.style.display = 'block';
            return;
        }
        
        // ✅ NEW: Get current time for comparison
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        let availableCount = 0;
        grid.innerHTML = '';
        
        const timeOrder = CONFIG.TIME_SLOTS;
        
        for (const time of timeOrder) {
            const slotInfo = slots[time];
            if (!slotInfo) continue;
            
            const isActive = slotInfo.is_active !== false;
            const isAvailable = slotInfo.available && isActive;
            const booked = slotInfo.booked || 0;
            const maxSlots = slotInfo.max_slots || 1;
            const isFull = booked >= maxSlots;
            
            // ✅ NEW: Check if the time slot is in the past for today's date
            let isPastTime = false;
            if (isToday) {
                const [slotHour, slotMinute] = time.split(':').map(Number);
                const slotTimeInMinutes = slotHour * 60 + slotMinute;
                if (slotTimeInMinutes <= currentTimeInMinutes) {
                    isPastTime = true;
                }
            }

            const btn = document.createElement('button');
            btn.className = 'time-slot-btn';
            btn.dataset.time = time;
            
            // ✅ MODIFIED: Consider isPastTime
            if (isAvailable && !isFull && !isPastTime) {
                btn.classList.add('available');
                availableCount++;
            } else {
                btn.classList.add('disabled');
                if (isPastTime) {
                    btn.title = 'This time has already passed';
                } else if (isFull) {
                    btn.title = 'Fully booked';
                } else if (!isActive) {
                    btn.title = 'Not available';
                } else {
                    btn.title = 'No longer available';
                }
            }
            
            if (selectedTime === time && isAvailable && !isFull && !isPastTime) {
                btn.classList.add('selected');
            }
            
            const timeDisplay = formatTime(time);
            
            btn.innerHTML = `
                <span class="time-label">${timeDisplay}</span>
                ${maxSlots > 1 && !isPastTime ? `<span class="slot-count">${booked}/${maxSlots} booked</span>` : ''}
            `;
            
            // ✅ MODIFIED: Only allow click if not past time
            if (isAvailable && !isFull && !isPastTime) {
                btn.onclick = () => selectTime(time);
            }
            
            grid.appendChild(btn);
        }
        
        const remainingSlots = dailyMax - dailyBooked;
        document.getElementById('slotCountLabel').textContent = 
            `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining today (${availableCount} time slots available)`;
        
        if (availableCount === 0) {
            msg.className = 'availability-unavailable';
            msg.textContent = `❌ No available time slots on ${dayName}. Please choose another day.`;
            msg.style.display = 'block';
        } else {
            msg.className = 'availability-available';
            msg.textContent = `✅ ${availableCount} time slot${availableCount !== 1 ? 's' : ''} available on ${dayName} (${dailyBooked}/${dailyMax} booked today)`;
            msg.style.display = 'block';
        }
        
        cachedAvailability = data;
        
    } catch (error) {
        console.error('Error loading time slots:', error);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Error loading time slots</div>';
    }
}

// ── Select Time ────────────────────────────────────────────────────
export function selectTime(time) {
    const grid = document.getElementById('timeSlotsGrid');
    const btns = grid.querySelectorAll('.time-slot-btn');
    
    btns.forEach(b => b.classList.remove('selected'));
    
    let selectedBtn = null;
    btns.forEach(b => {
        if (b.dataset.time === time) {
            b.classList.add('selected');
            selectedBtn = b;
        }
    });
    
    if (!selectedBtn) return;
    if (selectedBtn.classList.contains('full') || selectedBtn.classList.contains('disabled')) return;
    
    selectedTime = time;
    document.getElementById('bookingTime').value = time;
}

// ── Change Month ───────────────────────────────────────────────────
export function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderDatePicker();
}

// ── Select Today ──────────────────────────────────────────────────
export function selectToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
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
    }, 100);
}

// ── Make functions globally available ──────────────────────────────
window.renderDatePicker = renderDatePicker;
window.changeMonth = changeMonth;
window.selectToday = selectToday;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.loadTimeSlots = loadTimeSlots;