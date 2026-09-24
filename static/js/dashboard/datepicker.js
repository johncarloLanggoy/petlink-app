// ── DATE PICKER AND TIME SLOTS ──────────────────────────────────────

import { fetchBookedSlots } from './services.js';
import { showToast, formatTime } from './utils.js';
import { CONFIG } from './config.js';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;
let cachedAvailability = null;
let isJumping = false;  // ✅ Prevents multiple auto-jumps

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
export function selectDate(dateStr, autoJump = true) {
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
    
    // ✅ I-set ang selectedDateDisplay at loadTimeSlots with autoJump
    loadTimeSlots(dateStr, autoJump);
}

// ── Load Time Slots ────────────────────────────────────────────────
export async function loadTimeSlots(dateStr, autoJump = true) {
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
        const isDateClosed = data.is_date_closed || false;
        
        // ✅ CASE 1: Clinic closed on this day
        if (!dayAvailable || isDateClosed) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Clinic is closed on ${dayName}</div>`;
            msg.className = 'availability-unavailable';
            msg.textContent = `❌ The clinic is closed on ${dayName}. Please choose another day.`;
            msg.style.display = 'block';
            
            // ✅ AUTO-JUMP: Hanapin ang susunod na available date
            if (autoJump && !isJumping) {
                msg.innerHTML = `❌ The clinic is closed on ${dayName}. <span style="color: #38bdf8;">Finding next available date...</span>`;
                await jumpToNextAvailableDate(dateStr);
            }
            return;
        }
        
        // ✅ CASE 2: Daily capacity full
        if (isDailyFull) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Fully booked on ${dayName} (${dailyBooked}/${dailyMax} appointments)</div>`;
            msg.className = 'availability-unavailable';
            msg.textContent = `❌ This day is fully booked (${dailyBooked}/${dailyMax} appointments). Please choose another day.`;
            msg.style.display = 'block';
            
            // ✅ AUTO-JUMP: Hanapin ang susunod na available date
            if (autoJump && !isJumping) {
                msg.innerHTML = `❌ This day is fully booked. <span style="color: #38bdf8;">Finding next available date...</span>`;
                await jumpToNextAvailableDate(dateStr);
            }
            return;
        }
        
        // ✅ Get current time for comparison
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
            
            // ✅ Check if the time slot is in the past for today's date
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
            
            // ✅ Only allow click if not past time
            if (isAvailable && !isFull && !isPastTime) {
                btn.onclick = () => selectTime(time);
            }
            
            grid.appendChild(btn);
        }
        
        const remainingSlots = dailyMax - dailyBooked;
        document.getElementById('slotCountLabel').textContent = 
            `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining today (${availableCount} time slots available)`;
        
        // ✅ CASE 3: Walang available time slots
        if (availableCount === 0) {
            msg.className = 'availability-unavailable';
            msg.textContent = `❌ No available time slots on ${dayName}. Please choose another day.`;
            msg.style.display = 'block';
            
            // ✅ AUTO-JUMP: Hanapin ang susunod na available date
            if (autoJump && !isJumping) {
                msg.innerHTML = `❌ No available time slots. <span style="color: #38bdf8;">Finding next available date...</span>`;
                await jumpToNextAvailableDate(dateStr);
            }
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

// ✅ NEW: Auto-jump sa susunod na available date
async function jumpToNextAvailableDate(currentDateStr) {
    if (isJumping) return;
    isJumping = true;
    
    try {
        // Start sa susunod na araw
        const [year, month, day] = currentDateStr.split('-').map(Number);
        let searchDate = new Date(year, month - 1, day + 1);
        
        // Maghanap ng available date sa loob ng 30 araw
        const maxDaysToSearch = 30;
        
        for (let i = 0; i < maxDaysToSearch; i++) {
            const dateStr = `${searchDate.getFullYear()}-${String(searchDate.getMonth() + 1).padStart(2, '0')}-${String(searchDate.getDate()).padStart(2, '0')}`;
            
            try {
                const data = await fetchBookedSlots(dateStr);
                
                if (data.success && data.day_available && !data.is_daily_full && !data.is_date_closed) {
                    // Check kung may available time slot
                    let hasAvailableSlot = false;
                    
                    // Check kung today ba — kailangan i-check ang past time
                    const now = new Date();
                    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
                    
                    for (const [time, info] of Object.entries(data.slots)) {
                        if (info.available && info.is_active) {
                            // Kung today, i-check kung hindi pa past time
                            if (isToday) {
                                const [slotHour, slotMinute] = time.split(':').map(Number);
                                const slotTimeInMinutes = slotHour * 60 + slotMinute;
                                if (slotTimeInMinutes > currentTimeInMinutes) {
                                    hasAvailableSlot = true;
                                    break;
                                }
                            } else {
                                hasAvailableSlot = true;
                                break;
                            }
                        }
                    }
                    
                    if (hasAvailableSlot) {
                        // ✅ Nahanap! I-set ang current month/year at i-select ang date
                        currentMonth = searchDate.getMonth();
                        currentYear = searchDate.getFullYear();
                        
                        // Re-render ang date picker
                        renderDatePicker();
                        
                        // I-select ang date (with auto-jump disabled para hindi mag-loop)
                        setTimeout(() => {
                            selectDate(dateStr, false);
                            
                            // ✅ Ipakita ang notification
                            const msg = document.getElementById('availabilityMessage');
                            if (msg) {
                                msg.className = 'availability-available';
                                msg.innerHTML = `✅ Auto-selected <strong>${searchDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong> — may available time slots.`;
                                msg.style.display = 'block';
                            }
                            
                            showToast(`Auto-selected ${searchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, 'success');
                        }, 300);
                        
                        isJumping = false;
                        return;
                    }
                }
            } catch (e) {
                console.error('Error checking date:', e);
            }
            
            // Next day
            searchDate.setDate(searchDate.getDate() + 1);
        }
        
        // Walang nahanap sa loob ng 30 araw
        const msg = document.getElementById('availabilityMessage');
        if (msg) {
            msg.className = 'availability-unavailable';
            msg.textContent = '❌ No available dates found in the next 30 days. Please contact us directly.';
            msg.style.display = 'block';
        }
        
        showToast('No available dates found in the next 30 days.', 'error');
        
    } catch (error) {
        console.error('Error jumping to next available date:', error);
    } finally {
        isJumping = false;
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