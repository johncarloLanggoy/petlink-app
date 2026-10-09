// ═══════════════════════════════════════════════════════════════════
// VET AVAILABILITY - JAVASCRIPT
// MONDAY TO SATURDAY ONLY (walang Sunday, walang time slots)
// ═══════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════
// ✅ CUSTOM LOGOUT MODAL — Para sa Vet Panel (at kahit saan)
// ═══════════════════════════════════════════════════════════════════
function showLogoutModal() {
    // Tanggalin muna ang existing modal kung meron
    const existing = document.getElementById('logoutModal');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'logoutModal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.2s ease;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 20px;
            padding: 35px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            font-family: 'Poppins', sans-serif;
        ">
            <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
            <h3 style="
                color: #38bdf8;
                font-size: 24px;
                margin: 0 0 10px 0;
                font-weight: 700;
            ">Logout Confirmation</h3>
            <p style="
                color: #94a3b8;
                margin-bottom: 25px;
                line-height: 1.6;
                font-size: 14px;
            ">Are you sure you want to logout? You'll need to sign in again to access your dashboard.</p>
            <div style="
                display: flex;
                gap: 12px;
                justify-content: center;
            ">
                <button 
                    onclick="window.closeLogoutModal()"
                    style="
                        flex: 1;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        background: #e2e8f0;
                        color: #475569;
                        transition: all 0.3s ease;
                        font-family: 'Poppins', sans-serif;
                    "
                    onmouseover="this.style.background='#cbd5e1'; this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.background='#e2e8f0'; this.style.transform='translateY(0)'"
                >
                    Cancel
                </button>
                <button 
                    onclick="window.confirmLogout()"
                    style="
                        flex: 1;
                        padding: 12px 20px;
                        border: none;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        background: #ef4444;
                        color: #ffffff;
                        transition: all 0.3s ease;
                        font-family: 'Poppins', sans-serif;
                    "
                    onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.background='#ef4444'; this.style.transform='translateY(0)'"
                >
                    Yes, Logout
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Close kapag clinick ang overlay background
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeLogoutModal();
        }
    });
    
    // Close kapag pinindot ang Escape key
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeLogoutModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.remove();
}

async function confirmLogout() {
    closeLogoutModal();
    try {
        await fetch('/logout');
        sessionStorage.clear();
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('email');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('role');
        sessionStorage.removeItem('role');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/';
    }
}

// ✅ I-expose sa global scope para magamit sa onclick handlers
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;

// ═══════════════════════════════════════════════════════════════════
// ✅ AUTO-INTERCEPT: Palitan ang native confirm() para sa logout
// ═══════════════════════════════════════════════════════════════════
// Ito ang mag-detect at papalitan ang native confirm() para sa logout links
// Hindi na kailangang baguhin ang vet.html

document.addEventListener('DOMContentLoaded', function() {
    // ── Hanapin ang lahat ng logout links/buttons ─────────────────
    // Common patterns: <a href="/logout">, <button onclick="...confirm...">, etc.
    
    // 1. Intercept ALL <a> tags na may href na "/logout"
    document.querySelectorAll('a[href="/logout"], a[href*="/logout"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showLogoutModal();
        });
    });
    
    // 2. Intercept ALL buttons/links na may "logout" sa text content
    document.querySelectorAll('button, a').forEach(el => {
        const text = (el.textContent || '').toLowerCase().trim();
        const onclick = el.getAttribute('onclick') || '';
        
        // Kung may "logout" sa text at wala pang custom handler
        if (text.includes('logout') && !el.dataset.logoutHandled) {
            // Mark as handled para hindi ma-double
            el.dataset.logoutHandled = 'true';
            
            // Override ang onclick kung may native confirm()
            if (onclick.includes('confirm')) {
                e.preventDefault();
                el.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showLogoutModal();
                    return false;
                };
            }
        }
    });
    
    // 3. Global override ng window.confirm para sa logout-related messages
    const originalConfirm = window.confirm;
    window.confirm = function(message) {
        const msgLower = (message || '').toLowerCase();
        // Kung logout-related ang confirm message, gamitin ang custom modal
        if (msgLower.includes('logout') || msgLower.includes('sign out')) {
            showLogoutModal();
            return false; // Always return false — hindi matutuloy ang native action
        }
        // Kung hindi logout-related, gamitin ang original confirm
        return originalConfirm.call(window, message);
    };
});

// ═══════════════════════════════════════════════════════════════════
// VET AVAILABILITY LOGIC
// ═══════════════════════════════════════════════════════════════════

// ── DATA ────────────────────────────────────────────────────────
const days = [
    { value: 0, label: 'Monday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 1, label: 'Tuesday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 2, label: 'Wednesday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 3, label: 'Thursday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 4, label: 'Friday', icon: '<i class="fas fa-calendar-day"></i>' },
    { value: 5, label: 'Saturday', icon: '<i class="fas fa-star"></i>' }
];

let availabilityData = {};
let dateClosures = [];

// Custom Calendar Variables
let currentTargetDay = null;
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calSelectedDateStr = null;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ── LOAD AVAILABILITY ──────────────────────────────────────────
async function loadAvailability() {
    try {
        const res = await fetch('/api/vet/availability');
        const data = await res.json();
        if (data.success) {
            data.availability.forEach(item => {
                availabilityData[item.day_of_week] = {
                    is_available: item.is_available,
                    max_slots_per_day: item.max_slots_per_day
                };
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
        const res = await fetch('/api/vet/date-closures');
        const data = await res.json();
        if (data.success) {
            dateClosures = data.closures || [];
            dateClosures.forEach(c => {
                const date = new Date(c.closure_date);
                const jsDay = date.getDay();
                const dbDay = jsDay === 0 ? 6 : jsDay - 1;
                console.log(`Vet Closure: ${c.closure_date}, JS Day: ${jsDay}, DB Day: ${dbDay}`);
            });
            renderTable();
        }
    } catch (error) {
        console.error('Error loading date closures:', error);
    }
}

function renderTable() {
    const tbody = document.getElementById('availabilityBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    days.forEach(day => {
        const dayData = availabilityData[day.value] || { is_available: 1, max_slots_per_day: 3 };
        const isOpen = dayData.is_available === 1;
        const maxSlots = dayData.max_slots_per_day || 3;

        const hasClosure = dateClosures.some(c => {
            const closureDate = new Date(c.closure_date);
            const jsDay = closureDate.getDay();
            const dbDay = jsDay === 0 ? 6 : jsDay - 1;
            return dbDay === day.value;
        });

        const tr = document.createElement('tr');
        if (!isOpen) tr.classList.add('closed-row');

        const dayTd = document.createElement('td');
        dayTd.innerHTML = `<div class="day-cell"><span class="day-icon">${day.icon}</span> ${day.label} <span class="day-status-badge ${isOpen ? 'open' : 'closed'}">${isOpen ? 'Available' : 'Unavailable'}</span>${hasClosure ? '<span class="closure-indicator"><i class="fas fa-calendar-times"></i> Has Closure</span>' : ''}</div>`;
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
        slotsTd.innerHTML = `<div class="slots-input"><label>Max:</label><input type="number" id="vetMaxSlots-${day.value}" value="${maxSlots}" min="0" max="20" ${!isOpen ? 'disabled' : ''} onchange="updateMaxSlots(${day.value}, this.value)"></div>`;
        tr.appendChild(slotsTd);

        tbody.appendChild(tr);
    });
}

// ── STANDARD FUNCTIONS ──────────────────────────────────────────
async function toggleDay(day, isOpen) {
    try {
        const maxSlots = document.getElementById(`vetMaxSlots-${day}`).value;
        const res = await fetch('/api/vet/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_of_week: day, is_available: isOpen ? 1 : 0, max_slots_per_day: maxSlots })
        });
        const data = await res.json();
        if (data.success) {
            if (!availabilityData[day]) availabilityData[day] = {};
            availabilityData[day].is_available = isOpen ? 1 : 0;
            const row = document.querySelector(`#availabilityBody tr:nth-child(${day + 1})`);
            if (row) {
                const statusBadge = row.querySelector('.day-status-badge');
                const slotsInput = row.querySelector(`#vetMaxSlots-${day}`);
                if (isOpen) {
                    statusBadge.className = 'day-status-badge open';
                    statusBadge.textContent = 'Available';
                    row.classList.remove('closed-row');
                    slotsInput.disabled = false;
                } else {
                    statusBadge.className = 'day-status-badge closed';
                    statusBadge.textContent = 'Unavailable';
                    row.classList.add('closed-row');
                    slotsInput.disabled = true;
                }
            }
            showToast('<i class="fas fa-check-circle"></i> Day updated successfully!', 'success');
        }
    } catch (error) {
        showToast('<i class="fas fa-exclamation-circle"></i> Error updating day', 'error');
    }
}

async function updateMaxSlots(day, value) {
    try {
        const isOpen = availabilityData[day]?.is_available === 1;
        await fetch('/api/vet/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_of_week: day, is_available: isOpen ? 1 : 0, max_slots_per_day: parseInt(value) || 0 })
        });
        if (!availabilityData[day]) availabilityData[day] = {};
        availabilityData[day].max_slots_per_day = parseInt(value) || 0;
        showToast('<i class="fas fa-check-circle"></i> Daily max slots updated!', 'success');
    } catch (error) {
        showToast('<i class="fas fa-exclamation-circle"></i> Error updating max slots', 'error');
    }
}

async function saveAllSettings() {
    const btn = document.querySelector('.btn-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
        for (const day of days) {
            const maxSlots = document.getElementById(`vetMaxSlots-${day.value}`).value;
            const isOpen = availabilityData[day.value]?.is_available === 1;
            await fetch('/api/vet/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day_of_week: day.value, is_available: isOpen ? 1 : 0, max_slots_per_day: parseInt(maxSlots) || 0 })
            });
        }
        showToast('<i class="fas fa-check-circle"></i> All settings saved successfully!', 'success');
        await loadAvailability();
    } catch (error) {
        showToast('<i class="fas fa-exclamation-circle"></i> Error saving settings', 'error');
    }
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save All Settings';
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

    loadDateClosuresForCalendar();
}

async function loadDateClosuresForCalendar() {
    try {
        const res = await fetch('/api/vet/date-closures');
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

    const closureDates = dateClosures.map(c => c.closure_date);

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

        const hasClosure = closureDates.includes(dateStr);
        const targetJS_Day = (currentTargetDay + 1) % 7;

        if (dateStr < todayStr) {
            cell.classList.add('disabled');
        } else if (dayOfWeek !== targetJS_Day) {
            cell.classList.add('disabled');
        } else {
            cell.classList.add('selectable');
            cell.onclick = () => selectCalDate(dateStr);

            const dot = document.createElement('div');
            if (hasClosure) {
                dot.className = 'dot closure-dot';
                cell.title = 'Vet unavailable on this date';
            } else {
                dot.className = 'dot';
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

    if (!date) {
        showToast('Please select a valid date from the calendar.', 'error');
        return;
    }

    console.log(`Vet applying action "${action}" to date: ${date}`);

    if (action === 'close') {
        const res = await fetch('/api/vet/date-closures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closure_date: date, reason: 'Custom override from vet toggle' })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`<i class="fas fa-check-circle"></i> ${date} marked as unavailable!`, 'success');
            closeSpecificDateModal();
            loadAvailability();
        } else {
            showToast(data.message, 'error');
        }
    } else if (action === 'open') {
        const res = await fetch('/api/vet/date-closures');
        const closures = await res.json();
        const closureToDelete = closures.closures.find(c => c.closure_date === date);
        if (closureToDelete) {
            const delRes = await fetch(`/api/vet/date-closures/${closureToDelete.id}`, { method: 'DELETE' });
            const delData = await delRes.json();
            if (delData.success) {
                showToast(`<i class="fas fa-check-circle"></i> ${date} marked as available!`, 'success');
                closeSpecificDateModal();
                loadAvailability();
            } else {
                showToast(delData.message, 'error');
            }
        } else {
            showToast('This date is not closed.', 'info');
            closeSpecificDateModal();
        }
    } else if (action === 'edit_slots') {
        const res = await fetch('/api/vet/date-overrides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ override_date: date, max_slots_per_day: parseInt(maxSlots) || 3 })
        });
        const data = await res.json();
        if (data.success) {
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
    if (e.key === 'Escape') { closeSpecificDateModal(); }
});

document.getElementById('specificDateModal').addEventListener('click', function(e) {
    if (e.target === this) closeSpecificDateModal();
});

// ── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadAvailability);

// ── CSS ANIMATIONS (idinagdag para gumana ang modal) ──────────
if (!document.getElementById('logout-modal-animations')) {
    const style = document.createElement('style');
    style.id = 'logout-modal-animations';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}