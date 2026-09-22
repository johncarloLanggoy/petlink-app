// ── TOAST NOTIFICATION ──────────────────────────────────────────
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 3000);
}

// ── DATA ────────────────────────────────────────────────────────
const days = [
    { value: 0, label: 'Monday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 1, label: 'Tuesday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 2, label: 'Wednesday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 3, label: 'Thursday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 4, label: 'Friday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 5, label: 'Saturday', icon: '<i class="fas fa-star"></i>' },
    { value: 6, label: 'Sunday', icon: '<i class="fas fa-sun"></i>' }
];
const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
    '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

let availabilityData = {};
let timeSlotData = {};
let dateClosures = [];
let currentSlotContext = null;

// Custom Calendar Variables
let currentTargetDay = null;
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calSelectedDateStr = null;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── LOAD AVAILABILITY ──────────────────────────────────────────
async function loadAvailability() {
    try {
        const res = await fetch('/api/staff/availability');
        const data = await res.json();
        if (data.success) {
            data.availability.forEach(item => {
                availabilityData[item.day_of_week] = { is_available: item.is_available, max_slots_per_day: item.max_slots_per_day };
            });
            timeSlotData = {};
            data.time_slots.forEach(item => {
                if (!timeSlotData[item.day_of_week]) timeSlotData[item.day_of_week] = {};
                timeSlotData[item.day_of_week][item.time_slot] = { max_slots: item.max_slots, is_active: item.is_active };
            });
            renderTable();
            await loadDateClosures();
        }
    } catch (error) {
        console.error('Error loading availability:', error);
        showToast('<i class="fas fa-exclamation-circle"></i> Error loading availability settings', 'error');
    }
}

async function loadDateClosures() {
    try {
        const res = await fetch('/api/staff/date-closures');
        const data = await res.json();
        if (data.success) {
            dateClosures = data.closures || [];
            // ✅ DEBUG: I-print ang closures para ma-verify
            dateClosures.forEach(c => {
                const date = new Date(c.closure_date);
                const jsDay = date.getDay();
                const dbDay = jsDay === 0 ? 6 : jsDay - 1;
                console.log(`Closure: ${c.closure_date}, JS Day: ${jsDay}, DB Day: ${dbDay}`);
            });
            renderTable();
        }
    } catch (error) { 
        console.error('Error loading date closures:', error); 
    }
}

function renderTable() {
    const tbody = document.getElementById('availabilityBody');
    tbody.innerHTML = '';
    days.forEach(day => {
        const dayData = availabilityData[day.value] || { is_available: 1, max_slots_per_day: 3 };
        const isOpen = dayData.is_available === 1;
        const maxSlots = dayData.max_slots_per_day || 3;
        
        // ✅ FIX: I-convert ang closure date mula sa database
        // Ang database ay 0=Monday, 1=Tuesday...
        // Ang JavaScript getDay() ay 0=Sunday, 1=Monday, 2=Tuesday...
        // Kailangan i-convert ang database day (0=Monday) sa JavaScript day (0=Sunday)
        const hasClosure = dateClosures.some(c => {
            const closureDate = new Date(c.closure_date);
            // ✅ I-convert ang JavaScript day (0=Sunday) sa database day (0=Monday)
            const jsDay = closureDate.getDay(); // 0=Sunday, 1=Monday...
            // I-convert sa database day: 0=Monday, 1=Tuesday...
            const dbDay = jsDay === 0 ? 6 : jsDay - 1; // Sunday(0) -> 6, Monday(1) -> 0, Tuesday(2) -> 1
            return dbDay === day.value;
        });

        const tr = document.createElement('tr');
        if (!isOpen) tr.classList.add('closed-row');

        const dayTd = document.createElement('td');
        dayTd.innerHTML = `<div class="day-cell"><span class="day-icon">${day.icon}</span> ${day.label} <span class="day-status-badge ${isOpen ? 'open' : 'closed'}">${isOpen ? 'Open' : 'Closed'}</span>${hasClosure ? '<span class="closure-indicator"><i class="fas fa-calendar-times"></i> Has Closure</span>' : ''}</div>`;
        tr.appendChild(dayTd);

        const toggleTd = document.createElement('td');
        toggleTd.style.textAlign = 'center';
        toggleTd.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap;">
                <label class="toggle-switch" title="Toggle recurring availability for all ${day.label}s">
                    <input type="checkbox" ${isOpen ? 'checked' : ''} onchange="toggleDay(${day.value}, this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <button onclick="openSpecificDateModal(${day.value}, ${isOpen})" 
                        style="background:rgba(123,160,91,0.1); border:1px solid #d4e5c4; border-radius:6px; color:#5a7a3f; padding:4px 8px; font-size:11px; cursor:pointer; transition:0.3s;"
                        onmouseover="this.style.background='#7ba05b'; this.style.color='#ffffff'; this.style.borderColor='#7ba05b';"
                        onmouseout="this.style.background='rgba(123,160,91,0.1)'; this.style.color='#5a7a3f'; this.style.borderColor='#d4e5c4';"
                        title="Edit a specific date for ${day.label}">
                    <i class="fas fa-calendar-plus"></i> Edit Specific Date
                </button>
            </div>
        `;
        tr.appendChild(toggleTd);

        const slotsTd = document.createElement('td');
        slotsTd.style.textAlign = 'center';
        slotsTd.innerHTML = `<div class="slots-input"><label>Max:</label><input type="number" id="maxSlots-${day.value}" value="${maxSlots}" min="0" max="20" ${!isOpen ? 'disabled' : ''} onchange="updateMaxSlots(${day.value}, this.value)"></div>`;
        tr.appendChild(slotsTd);

        const timeTd = document.createElement('td');
        const container = document.createElement('div');
        container.className = 'time-slots-container';
        const daySlots = timeSlotData[day.value] || {};
        timeSlots.forEach(time => {
            const slotData = daySlots[time] || { max_slots: 1, is_active: 1 };
            const isActive = slotData.is_active === 1;
            const maxSlotsVal = slotData.max_slots || 1;
            const btn = document.createElement('button');
            btn.className = `time-slot-btn ${isActive ? 'active' : 'inactive'}`;
            btn.innerHTML = `${time} <span class="slot-max">${maxSlotsVal}</span>`;
            btn.onclick = () => openSlotPopup(day.value, time);
            container.appendChild(btn);
        });
        timeTd.appendChild(container);
        tr.appendChild(timeTd);
        tbody.appendChild(tr);
    });
}

// ── STANDARD FUNCTIONS ──────────────────────────────────────────
async function toggleDay(day, isOpen) {
    try {
        const maxSlots = document.getElementById(`maxSlots-${day}`).value;
        const res = await fetch('/api/staff/availability', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_of_week: day, is_available: isOpen ? 1 : 0, max_slots_per_day: maxSlots })
        });
        const data = await res.json();
        if (data.success) {
            if (!availabilityData[day]) availabilityData[day] = {};
            availabilityData[day].is_available = isOpen ? 1 : 0;
            const row = document.querySelector(`#availabilityBody tr:nth-child(${day + 1})`);
            if (row) {
                const statusBadge = row.querySelector('.day-status-badge');
                const slotsInput = row.querySelector(`#maxSlots-${day}`);
                if (isOpen) {
                    statusBadge.className = 'day-status-badge open'; statusBadge.textContent = 'Open';
                    row.classList.remove('closed-row'); slotsInput.disabled = false;
                } else {
                    statusBadge.className = 'day-status-badge closed'; statusBadge.textContent = 'Closed';
                    row.classList.add('closed-row'); slotsInput.disabled = true;
                }
                const timeBtns = row.querySelectorAll('.time-slot-btn');
                timeBtns.forEach(btn => btn.style.opacity = isOpen ? '1' : '0.4');
            }
            showToast('<i class="fas fa-check-circle"></i> Day updated successfully!', 'success');
        }
    } catch (error) { showToast('<i class="fas fa-exclamation-circle"></i> Error updating day', 'error'); }
}

async function updateMaxSlots(day, value) {
    try {
        const isOpen = availabilityData[day]?.is_available === 1;
        await fetch('/api/staff/availability', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_of_week: day, is_available: isOpen ? 1 : 0, max_slots_per_day: parseInt(value) || 0 })
        });
        if (!availabilityData[day]) availabilityData[day] = {};
        availabilityData[day].max_slots_per_day = parseInt(value) || 0;
        showToast('<i class="fas fa-check-circle"></i> Daily max slots updated!', 'success');
    } catch (error) { showToast('<i class="fas fa-exclamation-circle"></i> Error updating max slots', 'error'); }
}

function openSlotPopup(day, time) {
    const dayLabel = days.find(d => d.value === day)?.label || 'Unknown';
    const slotData = timeSlotData[day]?.[time] || { max_slots: 1, is_active: 1 };
    currentSlotContext = { day, time };
    document.getElementById('popupDayLabel').innerHTML = `<i class="fas fa-clock"></i> ${dayLabel} - ${time}`;
    document.getElementById('popupTimeLabel').textContent = `Adjust settings for ${time} on ${dayLabel}`;
    document.getElementById('popupMaxSlots').value = slotData.max_slots || 1;
    document.getElementById('popupIsActive').checked = slotData.is_active === 1;
    document.getElementById('slotPopup').classList.add('show');
}

function closeSlotPopup() {
    document.getElementById('slotPopup').classList.remove('show');
    currentSlotContext = null;
}

async function saveSlotSettings() {
    if (!currentSlotContext) return;
    const { day, time } = currentSlotContext;
    const maxSlots = parseInt(document.getElementById('popupMaxSlots').value) || 0;
    const isActive = document.getElementById('popupIsActive').checked ? 1 : 0;
    try {
        const res = await fetch('/api/staff/time-slots', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_of_week: day, time_slot: time, max_slots: maxSlots, is_active: isActive })
        });
        const data = await res.json();
        if (data.success) {
            if (!timeSlotData[day]) timeSlotData[day] = {};
            timeSlotData[day][time] = { max_slots: maxSlots, is_active: isActive };
            renderTable(); closeSlotPopup(); showToast('<i class="fas fa-check-circle"></i> Time slot updated successfully!', 'success');
        } else { showToast('<i class="fas fa-exclamation-circle"></i> ' + data.message, 'error'); }
    } catch (error) { showToast('<i class="fas fa-exclamation-circle"></i> Error saving time slot', 'error'); }
}

async function saveAllSettings() {
    const btn = document.querySelector('.btn-save');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
        for (const day of days) {
            const maxSlots = document.getElementById(`maxSlots-${day.value}`).value;
            const isOpen = availabilityData[day.value]?.is_available === 1;
            await fetch('/api/staff/availability', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day_of_week: day.value, is_available: isOpen ? 1 : 0, max_slots_per_day: parseInt(maxSlots) || 0 })
            });
        }
        for (const day of days) {
            for (const time of timeSlots) {
                const slotData = timeSlotData[day.value]?.[time] || { is_active: 1, max_slots: 1 };
                await fetch('/api/staff/time-slots', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ day_of_week: day.value, time_slot: time, max_slots: slotData.max_slots || 1, is_active: slotData.is_active })
                });
            }
        }
        showToast('<i class="fas fa-check-circle"></i> All settings saved successfully!', 'success');
        await loadAvailability();
    } catch (error) { showToast('<i class="fas fa-exclamation-circle"></i> Error saving settings', 'error'); }
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save All Settings';
}

// ── CUSTOM DATE PICKER LOGIC ──────────────────────────────────

function openSpecificDateModal(dayIndex, isCurrentlyOpen) {
    currentTargetDay = dayIndex;
    document.getElementById('specificDayName').textContent = days[dayIndex].label;
    document.getElementById('specificDateModal').classList.add('show');
    
    const today = new Date();
    calMonth = today.getMonth();
    calYear = today.getFullYear();
    calSelectedDateStr = null;
    document.getElementById('calSelectedLabel').textContent = 'No date selected';
    document.getElementById('specificDateAction').value = isCurrentlyOpen ? 'close' : 'open';
    document.getElementById('specificDateSlotsGroup').style.display = 'none';
    
    // ✅ Load date closures before rendering
    loadDateClosuresForCalendar();
}

// ✅ New function to load closures for the calendar
async function loadDateClosuresForCalendar() {
    try {
        const res = await fetch('/api/staff/date-closures');
        const data = await res.json();
        if (data.success) {
            dateClosures = data.closures || [];
            renderCalendar();
        }
    } catch (error) {
        console.error('Error loading date closures:', error);
        renderCalendar();
    }
}

function closeSpecificDateModal() {
    document.getElementById('specificDateModal').classList.remove('show');
    currentTargetDay = null;
}

function renderCalendar() {
    const grid = document.getElementById('calGrid');
    const label = document.getElementById('calMonthYear');
    label.textContent = `${MONTHS[calMonth]} ${calYear}`;

    grid.innerHTML = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(d => {
        const div = document.createElement('div');
        div.className = 'cal-day-name';
        div.textContent = d;
        grid.appendChild(div);
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // ✅ Get all date closures from the server
    const closureDates = dateClosures.map(c => c.closure_date);

    // Get previous month's days for filling
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month disabled';
        div.textContent = daysInPrevMonth - i;
        grid.appendChild(div);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = day;
        
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(calYear, calMonth, day).getDay();

        // ✅ Check if this date has a closure
        const hasClosure = closureDates.includes(dateStr);

        const targetJS_Day = (currentTargetDay + 1) % 7;

        // Disable past dates
        if (dateStr < todayStr) {
            cell.classList.add('disabled');
        } 
        // Disable if not the target day of the week
        else if (dayOfWeek !== targetJS_Day) {
            cell.classList.add('disabled');
        } 
        // Enable if it matches!
        else {
            cell.classList.add('selectable');
            cell.onclick = () => selectCalDate(dateStr);
            
            // ✅ Red dot for closure, green dot for available
            const dot = document.createElement('div');
            if (hasClosure) {
                dot.className = 'dot closure-dot';
                dot.style.cssText = `
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #ef4444;
                    box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
                    animation: pulseRed 1.5s ease-in-out infinite;
                `;
                cell.title = 'Clinic closed on this date';
            } else {
                dot.className = 'dot';
                dot.style.cssText = `
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #7ba05b;
                `;
            }
            cell.appendChild(dot);
        }

        if (dateStr === todayStr) {
            cell.classList.add('today');
        }
        if (dateStr === calSelectedDateStr) {
            cell.classList.add('selected');
        }
        grid.appendChild(cell);
    }

    // Fill remaining cells with next month
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - totalCells % 7) % 7;
    for (let i = 1; i <= remaining; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day other-month disabled';
        div.textContent = i;
        grid.appendChild(div);
    }
}

function changeCalMonth(delta) {
    calMonth += delta;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    else if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
}

function selectCalDate(dateStr) {
    calSelectedDateStr = dateStr;
    // ✅ FIX: I-parse ang date gamit ang manual method
    const [year, month, day] = dateStr.split('-').map(Number);
    const displayDate = new Date(year, month - 1, day);
    document.getElementById('calSelectedLabel').textContent = `Selected: ${displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
    renderCalendar();
}

document.getElementById('specificDateAction').addEventListener('change', function() {
    document.getElementById('specificDateSlotsGroup').style.display = this.value === 'edit_slots' ? 'block' : 'none';
});

async function applySpecificDateOverride() {
    const date = calSelectedDateStr;
    const action = document.getElementById('specificDateAction').value;
    const maxSlots = document.getElementById('specificDateMaxSlots').value;
    
    if(!date) {
        showToast('Please select a valid date from the calendar.', 'error');
        return;
    }
    
    // ✅ DEBUG: I-print ang date para ma-verify
    console.log(`Applying action "${action}" to date: ${date}`);
    
    if(action === 'close') {
        const res = await fetch('/api/staff/date-closures', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closure_date: date, reason: 'Custom override from toggle' })
        });
        const data = await res.json();
        if(data.success) { 
            showToast(`<i class="fas fa-check-circle"></i> ${date} marked as closed!`, 'success'); 
            closeSpecificDateModal(); 
            loadAvailability(); 
        } else { 
            showToast(data.message, 'error'); 
        }
    } else if(action === 'open') {
        const res = await fetch('/api/staff/date-closures');
        const closures = await res.json();
        const closureToDelete = closures.closures.find(c => c.closure_date === date);
        if(closureToDelete) {
            const delRes = await fetch(`/api/staff/date-closures/${closureToDelete.id}`, { method: 'DELETE' });
            const delData = await delRes.json();
            if(delData.success) { 
                showToast(`<i class="fas fa-check-circle"></i> ${date} reopened!`, 'success'); 
                closeSpecificDateModal(); 
                loadAvailability(); 
            } else { 
                showToast(delData.message, 'error'); 
            }
        } else { 
            showToast('This date is not closed.', 'info'); 
            closeSpecificDateModal(); 
        }
    } else if(action === 'edit_slots') {
        const res = await fetch('/api/staff/date-overrides', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ override_date: date, max_slots_per_day: parseInt(maxSlots) || 3 })
        });
        const data = await res.json();
        if(data.success) { 
            showToast(`<i class="fas fa-check-circle"></i> Slots for ${date} set to ${maxSlots}!`, 'success'); 
            closeSpecificDateModal(); 
            loadAvailability(); 
        } else { 
            showToast(data.message, 'error'); 
        }
    }
}

// ── CLOSE POPUPS ──────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeSlotPopup(); closeSpecificDateModal(); }
});
document.getElementById('slotPopup').addEventListener('click', function(e) {
    if (e.target === this) closeSlotPopup();
});
document.getElementById('specificDateModal').addEventListener('click', function(e) {
    if (e.target === this) closeSpecificDateModal();
});

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadAvailability);