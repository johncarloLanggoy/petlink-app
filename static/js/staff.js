// ── Toggle Mobile Sidebar ──────────────────────────────────────────
function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 768) {
        if (sidebar && mobileBtn && !sidebar.contains(event.target) && !mobileBtn.contains(event.target)) {
            sidebar.classList.remove('mobile-open');
        }
    }
});

// ═══════════════════════════════════════════════════════════════════
// 👥 STAFF CUSTOMERS — Fetch from API (katulad ng Admin Panel)
// ═══════════════════════════════════════════════════════════════════
let staffAllCustomersList = [];

async function loadStaffCustomers() {
    const tbody = document.getElementById('staffCustomersTableBody');
    const emptyState = document.getElementById('customerEmptyState');
    
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; color: #94a387; padding: 30px;">
                <i class="fas fa-spinner fa-spin"></i> Loading customers...
            </td>
        </tr>
    `;
    if (emptyState) emptyState.style.display = 'none';
    
    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        
        if (data.success && data.users && data.users.length > 0) {
            staffAllCustomersList = data.users.filter(u => u.role === 'user');
            renderStaffCustomers(staffAllCustomersList);
        } else {
            staffAllCustomersList = [];
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #64748b; padding: 30px;">
                        No registered customers yet.
                    </td>
                </tr>
            `;
            const countEl = document.getElementById('customerSearchResultCount');
            if (countEl) countEl.textContent = '0 customers';
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #ef4444; padding: 30px;">
                    <i class="fas fa-times-circle"></i> Error loading customers. Please refresh.
                </td>
            </tr>
        `;
    }
}

function renderStaffCustomers(customers) {
    const tbody = document.getElementById('staffCustomersTableBody');
    const emptyState = document.getElementById('customerEmptyState');
    
    if (!tbody) return;
    
    const countEl = document.getElementById('customerSearchResultCount');
    if (countEl) {
        countEl.textContent = `${customers.length} customer${customers.length !== 1 ? 's' : ''}`;
    }
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #64748b; padding: 30px;">
                    No customers found.
                </td>
            </tr>
        `;
        if (emptyState) emptyState.style.display = 'none';
        return;
    }
    
    tbody.innerHTML = '';
    
    customers.forEach((user, index) => {
        const nameDisplay = user.fullname || '—';
        const roleClass = `role-${user.role}`;
        const roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        const initial = nameDisplay !== '—' ? nameDisplay.trim()[0].toUpperCase() : 'U';
        
        let avatarHTML;
        if (user.profile_image) {
            avatarHTML = `
                <img src="${user.profile_image}" 
                     alt="${nameDisplay}" 
                     class="customer-avatar"
                     onclick="openStaffImageViewer('${user.profile_image}')"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="customer-avatar-circle ${roleClass}" style="display: none;">${initial}</div>
            `;
        } else {
            avatarHTML = `<div class="customer-avatar-circle ${roleClass}">${initial}</div>`;
        }
        
        const row = document.createElement('tr');
        row.className = 'customer-row';
        row.setAttribute('data-name', user.fullname || '');
        row.setAttribute('data-email', user.email || '');
        
        row.innerHTML = `
            <td data-label="ID">${index + 1}</td>
            <td data-label="Name">
                <div class="customer-name-wrap">
                    ${avatarHTML}
                    <strong class="customer-name">${nameDisplay}</strong>
                </div>
            </td>
            <td data-label="Email"><span class="truncate" title="${user.email || ''}">${user.email || '—'}</span></td>
            <td data-label="Phone">${user.phone || '—'}</td>
            <td data-label="Address"><span class="truncate" title="${user.address || ''}">${user.address || '—'}</span></td>
            <td data-label="Role">
                <span class="role-badge ${roleClass}">
                    ${roleDisplay}
                </span>
            </td>
            <td data-label="Created At">${user.created_at || '—'}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    if (emptyState) emptyState.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════════
// ✅ ALLERGY OPTIONS — Eksaktong kopya mula sa pets.js (customer UI)
// ═══════════════════════════════════════════════════════════════════
const ALLERGY_OPTIONS = {
    Dog: [
        'Chicken', 'Beef', 'Pork', 'Lamb', 'Fish', 'Salmon', 'Tuna',
        'Eggs', 'Dairy', 'Cheese', 'Milk',
        'Wheat', 'Corn', 'Soy', 'Grain', 'Rice', 'Barley', 'Oats',
        'Beet Pulp', 'Peanut Butter', 'Liver', 'Turkey', 'Duck',
        'Venison', 'Rabbit', 'Kangaroo', 'Bison',
        'Pollen', 'Dust Mites', 'Fleas', 'Tick Saliva',
        'Grass', 'Weeds', 'Tree Pollen', 'Ragweed',
        'Mold Spores', 'Dander', 'Cockroach',
        'Latex', 'Plastic', 'Nylon', 'Wool', 'Cotton',
        'Leather', 'Rubber', 'Metal (Nickel)', 'Dyes',
        'Certain Medications', 'Antibiotics', 'Vaccines',
        'Shampoo/Conditioner', 'Perfume', 'Flea Treatment',
        'Heartworm Medication', 'Anesthesia',
        'Bee Stings', 'Wasp Stings', 'Ant Bites', 'Spider Bites',
        'Mosquito Bites', 'Flea Bites',
        'Storage Mites', 'Household Cleaners', 'Air Fresheners',
        'Cigarette Smoke', 'Candles', 'Insecticides'
    ],
    Cat: [
        'Chicken', 'Beef', 'Pork', 'Lamb', 'Fish', 'Tuna', 'Salmon',
        'Eggs', 'Dairy', 'Cheese', 'Milk',
        'Wheat', 'Corn', 'Soy', 'Grain', 'Rice', 'Barley', 'Oats',
        'Turkey', 'Duck', 'Venison', 'Rabbit',
        'Pollen', 'Dust Mites', 'Fleas', 'Grass',
        'Tree Pollen', 'Ragweed', 'Weeds',
        'Mold Spores', 'Dander', 'Cockroach',
        'Latex', 'Plastic', 'Wool', 'Cotton',
        'Leather', 'Rubber', 'Metal (Nickel)', 'Dyes',
        'Certain Medications', 'Antibiotics', 'Vaccines',
        'Shampoo/Conditioner', 'Perfume', 'Flea Treatment',
        'Heartworm Medication', 'Anesthesia',
        'Cat Litter (Clay)', 'Cat Litter (Clumping)', 'Cat Litter (Crystal)',
        'Household Cleaners', 'Air Fresheners',
        'Bee Stings', 'Wasp Stings', 'Ant Bites', 'Spider Bites',
        'Mosquito Bites', 'Flea Bites',
        'Cigarette Smoke', 'Candles', 'Insecticides', 'Storage Mites'
    ]
};

// ── Track selected allergies (Staff Edit) ────────────────────────
let selectedAllergiesEditStaff = [];
let customAllergiesEditStaff = [];

// ═══════════════════════════════════════════════════════════════════
// ✅ AGE HELPER FUNCTIONS — Eksaktong kopya mula sa pets.js
// ═══════════════════════════════════════════════════════════════════
function parseAgeInput(value, unit) {
    const num = parseInt(value) || 0;
    if (unit === 'months') {
        if (num >= 12) {
            const years = Math.floor(num / 12);
            const remMonths = num % 12;
            return { age: years, age_months: remMonths };
        }
        return { age: 0, age_months: num };
    }
    return { age: num, age_months: 0 };
}

function ageToFormValue(ageYears, ageMonths) {
    const years = parseInt(ageYears) || 0;
    const months = parseInt(ageMonths) || 0;
    if (years > 0) return { value: years, unit: 'years' };
    if (months > 0) return { value: months, unit: 'months' };
    return { value: '', unit: 'years' };
}

// ═══════════════════════════════════════════════════════════════════
// ✅ RENDER ALLERGY DROPDOWN (Staff Edit) — Eksaktong kopya mula sa pets.js
// ── Gagana ito kahit ano pa ang pet type basta may value
// ═══════════════════════════════════════════════════════════════════
function renderAllergyDropdownStaff(petType, selectedList = []) {
    const container = document.getElementById('editPetAllergiesContainer');
    if (!container) return;
    
    console.log('🎨 renderAllergyDropdownStaff called with:', petType, '| selected:', selectedList);
    
    if (!petType || petType === '') {
        container.innerHTML = `
            <div style="padding: 12px 16px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 10px; text-align: center; color: #94a3b8; font-size: 13px; cursor: not-allowed;">
                <i class="fas fa-lock"></i> Please select a Pet Type first
            </div>
        `;
        return;
    }
    
    const options = ALLERGY_OPTIONS[petType] || [];
    if (options.length === 0) {
        container.innerHTML = `
            <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; color: #94a3b8; font-size: 13px;">
                <i class="fas fa-info-circle"></i> No allergy options available for this pet type.
            </div>
        `;
        return;
    }
    
    const standardOptions = options;
    const detectedCustom = selectedList.filter(a => !standardOptions.includes(a));
    
    detectedCustom.forEach(c => {
        if (!customAllergiesEditStaff.includes(c)) customAllergiesEditStaff.push(c);
    });
    
    const hasOthers = customAllergiesEditStaff.length > 0;
    
    let html = `
        <div style="max-height: 220px; overflow-y: auto; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
    `;
    
    options.forEach(allergy => {
        const isChecked = selectedList.includes(allergy);
        const safeId = `staff-edit-allergy-${allergy.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        html += `
            <label for="${safeId}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: ${isChecked ? 'rgba(123, 160, 91, 0.08)' : '#ffffff'}; border: 1px solid ${isChecked ? '#7ba05b' : '#e2e8f0'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; font-size: 12px; color: #334155;">
                <input type="checkbox" 
                       id="${safeId}" 
                       value="${allergy}" 
                       ${isChecked ? 'checked' : ''}
                       data-allergy-mode="edit-staff"
                       style="width: 14px; height: 14px; accent-color: #7ba05b; cursor: pointer; flex-shrink: 0;"
                       onchange="window.toggleAllergySelectionStaff(this)">
                <span style="flex: 1; user-select: none;">${allergy}</span>
            </label>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #334155; user-select: none;" for="staff-edit-allergy-others">
                <input type="checkbox" 
                       id="staff-edit-allergy-others"
                       ${hasOthers ? 'checked' : ''}
                       onchange="window.toggleOthersAllergyStaff(this)"
                       style="width: 16px; height: 16px; accent-color: #7ba05b; cursor: pointer; flex-shrink: 0;">
                <span><i class="fas fa-plus-circle" style="color: #7ba05b;"></i> Others (not in list)</span>
            </label>
            
            <div id="staff-edit-others-input-container" style="margin-top: 8px; display: ${hasOthers ? 'block' : 'none'};">
                <div style="display: flex; gap: 6px; align-items: center;">
                    <input type="text" 
                           id="staff-edit-others-input" 
                           placeholder="Type allergy name..."
                           style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4e5c4; background: #f7fbf3; font-size: 12px; color: #2d3e1f; outline: none; font-family: 'Poppins', sans-serif;"
                           onkeydown="if(event.key === 'Enter'){ event.preventDefault(); window.addCustomAllergyStaff(); }">
                    <button type="button" 
                            onclick="window.addCustomAllergyStaff()"
                            style="padding: 8px 14px; background: #7ba05b; color: #ffffff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                
                <div id="staff-edit-custom-allergies-list" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${customAllergiesEditStaff.length > 0 
                        ? customAllergiesEditStaff.map((c, i) => `
                            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 160, 91, 0.12); border: 1px solid #7ba05b; border-radius: 20px; font-size: 11px; color: #5a7a3f; font-weight: 500;">
                                <i class="fas fa-tag" style="font-size: 9px;"></i>
                                ${c}
                                <button type="button" 
                                        onclick="window.removeCustomAllergyStaff(${i})"
                                        style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 12px; line-height: 1; margin-left: 2px;"
                                        title="Remove">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            </span>
                        `).join('')
                        : '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No custom allergies added yet.</span>'
                    }
                </div>
            </div>
        </div>
        
        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 11px; color: #64748b;" id="staff-edit-allergy-summary">
                ${selectedList.length + customAllergiesEditStaff.length > 0 
                    ? `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${selectedList.length + customAllergiesEditStaff.length} allergy(ies) selected`
                    : '<i class="fas fa-info-circle"></i> No allergies selected'}
            </span>
            <button type="button" 
                    onclick="window.clearAllergiesStaff()"
                    style="font-size: 11px; color: #ef4444; background: transparent; border: 1px solid #ef4444; padding: 3px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 4px;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='#fff';"
                    onmouseout="this.style.background='transparent'; this.style.color='#ef4444';">
                <i class="fas fa-times-circle"></i> Clear All
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

// ── Toggle Allergy Selection (Staff) ─────────────────────────────
window.toggleAllergySelectionStaff = function(checkbox) {
    const value = checkbox.value;
    const label = checkbox.closest('label');
    
    if (checkbox.checked) {
        if (!selectedAllergiesEditStaff.includes(value)) {
            selectedAllergiesEditStaff.push(value);
        }
        if (label) {
            label.style.borderColor = '#7ba05b';
            label.style.background = 'rgba(123, 160, 91, 0.08)';
        }
    } else {
        selectedAllergiesEditStaff = selectedAllergiesEditStaff.filter(a => a !== value);
        if (label) {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#ffffff';
        }
    }
    
    updateAllergySummaryStaff();
};

// ── Toggle "Others" checkbox (Staff) ─────────────────────────────
window.toggleOthersAllergyStaff = function(checkbox) {
    const container = document.getElementById('staff-edit-others-input-container');
    if (checkbox.checked) {
        container.style.display = 'block';
        const input = document.getElementById('staff-edit-others-input');
        if (input) input.focus();
    } else {
        container.style.display = 'none';
        customAllergiesEditStaff = [];
        renderCustomAllergiesListStaff();
        updateAllergySummaryStaff();
    }
};

// ── Add Custom Allergy (Staff) ───────────────────────────────────
window.addCustomAllergyStaff = function() {
    const input = document.getElementById('staff-edit-others-input');
    if (!input) return;
    
    const value = input.value.trim();
    if (!value) {
        showMessage('Please type an allergy name.', 'error');
        return;
    }
    
    const isDuplicate = customAllergiesEditStaff.some(c => c.toLowerCase() === value.toLowerCase());
    if (isDuplicate) {
        showMessage('This allergy is already added.', 'error');
        input.value = '';
        return;
    }
    
    const petType = document.getElementById('editPetType').value;
    const standardOptions = ALLERGY_OPTIONS[petType] || [];
    
    if (standardOptions.some(o => o.toLowerCase() === value.toLowerCase())) {
        showMessage('This allergy is already in the list above.', 'error');
        input.value = '';
        return;
    }
    
    customAllergiesEditStaff.push(value);
    input.value = '';
    renderCustomAllergiesListStaff();
    updateAllergySummaryStaff();
    showMessage(`"${value}" added.`, 'success');
};

// ── Remove Custom Allergy (Staff) ────────────────────────────────
window.removeCustomAllergyStaff = function(index) {
    customAllergiesEditStaff.splice(index, 1);
    renderCustomAllergiesListStaff();
    updateAllergySummaryStaff();
};

// ── Render Custom Allergies List (Staff) ─────────────────────────
function renderCustomAllergiesListStaff() {
    const container = document.getElementById('staff-edit-custom-allergies-list');
    if (!container) return;
    
    if (customAllergiesEditStaff.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No custom allergies added yet.</span>';
        return;
    }
    
    container.innerHTML = customAllergiesEditStaff.map((c, i) => `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 160, 91, 0.12); border: 1px solid #7ba05b; border-radius: 20px; font-size: 11px; color: #5a7a3f; font-weight: 500;">
            <i class="fas fa-tag" style="font-size: 9px;"></i>
            ${c}
            <button type="button" 
                    onclick="window.removeCustomAllergyStaff(${i})"
                    style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 12px; line-height: 1; margin-left: 2px;"
                    title="Remove">
                <i class="fas fa-times-circle"></i>
            </button>
        </span>
    `).join('');
}

// ── Update Allergy Summary (Staff) ───────────────────────────────
function updateAllergySummaryStaff() {
    const summaryEl = document.getElementById('staff-edit-allergy-summary');
    if (!summaryEl) return;
    
    const totalCount = selectedAllergiesEditStaff.length + customAllergiesEditStaff.length;
    
    if (totalCount > 0) {
        summaryEl.innerHTML = `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${totalCount} allergy(ies) selected`;
    } else {
        summaryEl.innerHTML = '<i class="fas fa-info-circle"></i> No allergies selected';
    }
}

// ── Clear All Allergies (Staff) ──────────────────────────────────
window.clearAllergiesStaff = function() {
    selectedAllergiesEditStaff = [];
    customAllergiesEditStaff = [];
    
    const checkboxes = document.querySelectorAll('#editPetAllergiesContainer input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = false;
        const label = cb.closest('label');
        if (label) {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#ffffff';
        }
    });
    
    const othersContainer = document.getElementById('staff-edit-others-input-container');
    if (othersContainer) othersContainer.style.display = 'none';
    
    const othersCheckbox = document.getElementById('staff-edit-allergy-others');
    if (othersCheckbox) othersCheckbox.checked = false;
    
    const othersInput = document.getElementById('staff-edit-others-input');
    if (othersInput) othersInput.value = '';
    
    renderCustomAllergiesListStaff();
    updateAllergySummaryStaff();
};

// ── Get Selected Allergies as String (Staff) ─────────────────────
function getSelectedAllergiesStringStaff() {
    const combined = [...new Set([...selectedAllergiesEditStaff, ...customAllergiesEditStaff])];
    return combined.join(', ');
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: Search by ID, Name, Email, Phone, Address, Role, Created At
// ═══════════════════════════════════════════════════════════════════
function searchCustomers() {
    const input = document.getElementById('customerSearchInput');
    const clearBtn = document.getElementById('clearCustomerSearchBtn');
    
    if (!input) return;
    
    const term = input.value.trim().toLowerCase();
    
    if (clearBtn) {
        clearBtn.style.display = term !== '' ? 'flex' : 'none';
    }
    
    if (term === '') {
        renderStaffCustomers(staffAllCustomersList);
        return;
    }
    
    const termClean = term.replace(/^#/, '');
    
    const filtered = staffAllCustomersList.filter(u => {
        const id = String(u.id || '').toLowerCase();
        const name = (u.fullname || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const address = (u.address || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        const createdAt = (u.created_at || '').toLowerCase();
        
        return id.includes(termClean) ||
               name.includes(term) ||
               email.includes(term) ||
               phone.includes(term) ||
               address.includes(term) ||
               role.includes(term) ||
               createdAt.includes(term);
    });
    
    renderStaffCustomers(filtered);
}

function clearCustomerSearch() {
    const input = document.getElementById('customerSearchInput');
    const clearBtn = document.getElementById('clearCustomerSearchBtn');
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        renderStaffCustomers(staffAllCustomersList);
        input.focus();
    }
}

// ═══════════════════════════════════════════════════════════════════
// 🖼️ STAFF IMAGE VIEWER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
function openStaffImageViewer(imageSrc) {
    const viewer = document.getElementById('staffImageViewer');
    const viewerImg = document.getElementById('staffViewerImage');
    
    if (!viewer || !viewerImg) return;
    
    viewerImg.src = imageSrc;
    viewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeStaffImageViewer(event) {
    if (event.target.id === 'staffImageViewer' || 
        event.target.classList.contains('close-viewer')) {
        const viewer = document.getElementById('staffImageViewer');
        if (viewer) {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const viewer = document.getElementById('staffImageViewer');
        if (viewer && viewer.style.display === 'flex') {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
});

// ── STAFF APPOINTMENT FILTERING ────────────────────────────────────
let staffCurrentFilter = 'all';
let staffAllAppointments = [];

function filterStaffAppointments(status) {
    staffCurrentFilter = status;
    
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'transparent';
        tab.style.color = '#94a3b8';
        if (tab.dataset.tab === status) {
            tab.classList.add('active');
            tab.style.background = '#7BA05B';
            tab.style.color = '#e2e8f0';
        }
    });
    
    renderStaffAppointments();
}

function renderStaffAppointments() {
    const tbody = document.getElementById('staffAppointmentsTableBody');
    if (!tbody) return;
    
    let filtered = staffAllAppointments;
    if (staffCurrentFilter !== 'all') {
        filtered = staffAllAppointments.filter(app => app.status === staffCurrentFilter);
    }
    
    const searchInput = document.getElementById('appointmentSearchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const searchTermClean = searchTerm.replace(/^#/, '');
        
        filtered = filtered.filter(app => {
            const appointmentId = String(app.id || '').toLowerCase();
            const petName = (app.pet_name || '').toLowerCase();
            const customerEmail = (app.customer_email || '').toLowerCase();
            const appointmentDate = (app.appointment_date || '').toLowerCase();
            const appointmentTime = (app.appointment_time || '').toLowerCase();
            const formattedTime = (typeof formatStaffTime === 'function' 
                ? formatStaffTime(app.appointment_time) 
                : '').toLowerCase();
            
            let servicesText = '';
            if (app.service_details && Array.isArray(app.service_details)) {
                servicesText = app.service_details.map(s => 
                    (s.name || '').toLowerCase()
                ).join(' ');
            } else if (app.services) {
                try {
                    const services = typeof app.services === 'string' 
                        ? JSON.parse(app.services) 
                        : app.services;
                    servicesText = Array.isArray(services) 
                        ? services.join(' ').toLowerCase() 
                        : String(services).toLowerCase();
                } catch (e) {
                    servicesText = String(app.services).toLowerCase();
                }
            }
            
            const paymentStatus = (app.payment_status || 'unpaid').toLowerCase();
            const appointmentStatus = (app.status || '').toLowerCase();
            
            const matchesId = appointmentId === searchTermClean || 
                             appointmentId.includes(searchTermClean);
            
            return matchesId ||
                   petName.includes(searchTerm) ||
                   customerEmail.includes(searchTerm) ||
                   appointmentDate.includes(searchTerm) ||
                   appointmentTime.includes(searchTerm) ||
                   formattedTime.includes(searchTerm) ||
                   servicesText.includes(searchTerm) ||
                   paymentStatus.includes(searchTerm) ||
                   appointmentStatus.includes(searchTerm);
        });
    }
    
    if (filtered.length === 0) {
        const statusLabels = {
            'all': 'appointments',
            'pending': 'pending appointments',
            'confirmed': 'confirmed appointments',
            'completed': 'completed appointments',
            'cancelled': 'cancelled appointments'
        };
        const label = statusLabels[staffCurrentFilter] || 'appointments';
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #64748b; padding: 40px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">📅</div>
                    <h3 style="color: #e2e8f0; margin-bottom: 5px;">No ${label}</h3>
                    <p style="font-size: 13px;">${staffCurrentFilter === 'all' ? 'No appointments from customers yet.' : `No ${label} at the moment.`}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const statusPriority = {
        'pending': 1,
        'confirmed': 2,
        'completed': 3,
        'cancelled': 4
    };
    
    const sortedAppointments = [...filtered].sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
        return dateA - dateB;
    });
    
    tbody.innerHTML = '';
    sortedAppointments.forEach(app => {
        const statusClass = `status-${app.status}`;
        const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        
        let servicesDisplay = '—';
        
        if (app.service_details && Array.isArray(app.service_details) && app.service_details.length > 0) {
            servicesDisplay = app.service_details.map(svc => {
                const category = (svc.category || 'staff').toLowerCase();
                const categoryLabel = category === 'vet' ? 'Veterinarian' : 'Staff';
                const isVet = category === 'vet';
                const bgColor = isVet ? 'rgba(59, 130, 246, 0.12)' : 'rgba(123, 160, 91, 0.12)';
                const textColor = isVet ? '#2563eb' : '#5a7a3f';
                const borderColor = isVet ? 'rgba(59, 130, 246, 0.3)' : 'rgba(123, 160, 91, 0.3)';
                const icon = isVet ? 'fas fa-stethoscope' : 'fas fa-scissors';
                
                return `
                    <span class="service-tag" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        background: ${bgColor};
                        color: ${textColor};
                        border: 1px solid ${borderColor};
                        padding: 3px 10px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 500;
                        margin: 2px 4px 2px 0;
                        white-space: nowrap;
                    " title="${svc.name} — ${categoryLabel}">
                        <i class="${icon}" style="font-size: 9px;"></i>
                        ${svc.name}
                        <span style="
                            background: ${isVet ? '#2563eb' : '#5a7a3f'};
                            color: #fff;
                            padding: 1px 7px;
                            border-radius: 8px;
                            font-size: 9px;
                            font-weight: 700;
                            letter-spacing: 0.3px;
                            margin-left: 2px;
                        ">${categoryLabel}</span>
                    </span>
                `;
            }).join('');
        }
        else if (app.services) {
            try {
                const services = typeof app.services === 'string' ? JSON.parse(app.services) : app.services;
                if (Array.isArray(services) && services.length > 0) {
                    servicesDisplay = services.map(s => `<span class="service-tag">${s}</span>`).join('');
                } else {
                    servicesDisplay = `<span class="service-tag">${services}</span>`;
                }
            } catch (e) {
                servicesDisplay = `<span class="service-tag">${app.services}</span>`;
            }
        }
        
        let paymentBadge = '';
        const paymentStatus = app.payment_status || 'unpaid';
        
        if (paymentStatus === 'paid') {
            paymentBadge = `
                <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap;">
                    <i class="fas fa-check-circle"></i> Paid
                </span>
            `;
        } else if (paymentStatus === 'failed') {
            paymentBadge = `
                <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap;">
                    <i class="fas fa-times-circle"></i> Failed
                </span>
            `;
        } else {
            paymentBadge = `
                <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap;">
                    <i class="fas fa-clock"></i> Unpaid
                </span>
            `;
        }
        
        let actionsHTML = '';
        if (app.status === 'pending') {
            actionsHTML = `
                <button class="btn-confirm" onclick="updateAppointmentStatus(${app.id}, 'confirmed')">✅ Confirm</button>
                <button class="btn-cancel" onclick="updateAppointmentStatus(${app.id}, 'cancelled')">❌ Cancel</button>
                <button class="btn-view" onclick="viewAppointmentDetails(${app.id})">📋 View</button>
            `;
        } else if (app.status === 'confirmed') {
            actionsHTML = `
                <button class="btn-complete" onclick="updateAppointmentStatus(${app.id}, 'completed')">⭐ Complete</button>
                <button class="btn-cancel" onclick="updateAppointmentStatus(${app.id}, 'cancelled')">❌ Cancel</button>
                <button class="btn-view" onclick="viewAppointmentDetails(${app.id})">📋 View</button>
            `;
        } else if (app.status === 'completed') {
            actionsHTML = `
                <span class="no-actions">✓ Done</span>
                <button class="btn-view" onclick="viewAppointmentDetails(${app.id})">📋 View</button>
            `;
        } else if (app.status === 'cancelled') {
            actionsHTML = `
                <span class="no-actions">✕ Cancelled</span>
                <button class="btn-view" onclick="viewAppointmentDetails(${app.id})">📋 View</button>
            `;
        }
        
        const petType = (app.pet_type || 'Dog').toLowerCase();
        const isCat = petType === 'cat';
        const petIcon = isCat 
            ? '<i class="fas fa-cat" style="color: #f59e0b;"></i>' 
            : '<i class="fas fa-dog" style="color: #7ba05b;"></i>';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="white-space: nowrap;">${app.appointment_date}</td>
            <td style="white-space: nowrap; font-weight: 600; color: #7ba05b;">${formatStaffTime(app.appointment_time)}</td>
            <td style="font-weight: 600; color: #94a387;">#${app.id}</td>
            <td>
                <div class="pet-cell">
                    <span class="pet-icon">${petIcon}</span>
                    ${app.pet_name || 'Unknown'}
                </div>
            </td>
            <td>
                <div class="customer-cell">
                    <div class="customer-name">${app.customer_email || 'Unknown'}</div>
                </div>
            </td>
            <td>${servicesDisplay}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td>${paymentBadge}</td>
            <td><div class="action-buttons">${actionsHTML}</div></td>
        `;
        tbody.appendChild(row);
    });
}

function formatStaffTime(timeStr) {
    if (!timeStr) return 'N/A';
    const [hour, minute] = timeStr.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

function updateStaffAppointmentCounts(appointments) {
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
    
    const allEl = document.getElementById('staffAllCount');
    const pendingEl = document.getElementById('staffPendingCount');
    const confirmedEl = document.getElementById('staffConfirmedCount');
    const completedEl = document.getElementById('staffCompletedCount');
    const cancelledEl = document.getElementById('staffCancelledCount');
    
    if (allEl) allEl.textContent = counts.all;
    if (pendingEl) pendingEl.textContent = counts.pending;
    if (confirmedEl) confirmedEl.textContent = counts.confirmed;
    if (completedEl) completedEl.textContent = counts.completed;
    if (cancelledEl) cancelledEl.textContent = counts.cancelled;
}

function refreshAppointments() {
    loadAllAppointments();
    showMessage('🔄 Appointments refreshed!', 'success');
}

function viewAppointmentDetails(appointmentId) {
    const app = staffAllAppointments.find(a => a.id === appointmentId);
    if (!app) {
        alert('Appointment not found.');
        return;
    }
    
    let servicesDisplay = '—';
    let servicesHTML = '';
    
    if (app.service_details && Array.isArray(app.service_details) && app.service_details.length > 0) {
        servicesHTML = app.service_details.map(svc => {
            const category = (svc.category || 'staff').toLowerCase();
            const categoryLabel = category === 'vet' ? 'Veterinarian' : 'Staff';
            const isVet = category === 'vet';
            const bgColor = isVet ? 'rgba(59, 130, 246, 0.12)' : 'rgba(123, 160, 91, 0.12)';
            const textColor = isVet ? '#2563eb' : '#5a7a3f';
            const icon = isVet ? 'fas fa-stethoscope' : 'fas fa-scissors';
            
            return `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    background: ${bgColor};
                    border: 1px solid ${isVet ? 'rgba(59, 130, 246, 0.3)' : 'rgba(123, 160, 91, 0.3)'};
                    border-radius: 10px;
                    margin-bottom: 6px;
                    gap: 10px;
                    flex-wrap: wrap;
                ">
                    <span style="color: ${textColor}; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                        <i class="${icon}" style="font-size: 11px;"></i>
                        ${svc.name}
                    </span>
                    <span style="
                        background: ${isVet ? '#2563eb' : '#5a7a3f'};
                        color: #fff;
                        padding: 2px 10px;
                        border-radius: 8px;
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 0.3px;
                        white-space: nowrap;
                    ">${categoryLabel}</span>
                </div>
            `;
        }).join('');
    }
    else if (app.services) {
        try {
            const services = typeof app.services === 'string' ? JSON.parse(app.services) : app.services;
            if (Array.isArray(services) && services.length > 0) {
                servicesHTML = services.map(s => `
                    <div style="
                        padding: 8px 12px;
                        background: rgba(123, 160, 91, 0.08);
                        border: 1px solid rgba(123, 160, 91, 0.2);
                        border-radius: 10px;
                        margin-bottom: 6px;
                        color: #2d3e1f;
                        font-size: 13px;
                    ">${s}</div>
                `).join('');
            } else {
                servicesHTML = `<div style="color: #2d3e1f; font-size: 13px;">${services}</div>`;
            }
        } catch (e) {
            servicesHTML = `<div style="color: #2d3e1f; font-size: 13px;">${app.services}</div>`;
        }
    } else {
        servicesHTML = `<div style="color: #94a387; font-size: 13px; font-style: italic;">No services</div>`;
    }
    
    const statusColors = {
        'pending': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', icon: 'fas fa-hourglass-half' },
        'confirmed': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', icon: 'fas fa-check-circle' },
        'completed': { bg: 'rgba(123, 160, 91, 0.15)', color: '#5a7a3f', icon: 'fas fa-flag-checkered' },
        'cancelled': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: 'fas fa-times-circle' }
    };
    const statusStyle = statusColors[app.status] || statusColors['pending'];
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
    
    const paymentStatus = app.payment_status || 'unpaid';
    let paymentBadge = '';
    if (paymentStatus === 'paid') {
        paymentBadge = `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                <i class="fas fa-check-circle"></i> Paid
            </span>
        `;
    } else if (paymentStatus === 'failed') {
        paymentBadge = `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                <i class="fas fa-times-circle"></i> Failed
            </span>
        `;
    } else {
        paymentBadge = `
            <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                <i class="fas fa-clock"></i> Unpaid
            </span>
        `;
    }
    
    const petType = (app.pet_type || 'Dog').toLowerCase();
    const isCat = petType === 'cat';
    const petIcon = isCat 
        ? '<i class="fas fa-cat" style="color: #f59e0b;"></i>' 
        : '<i class="fas fa-dog" style="color: #7ba05b;"></i>';
    const petTypeLabel = isCat ? 'Cat' : 'Dog';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'appointmentDetailsModal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(45, 62, 31, 0.5);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 20px;
            max-width: 560px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 50px rgba(123, 160, 91, 0.25);
            border: 1px solid #7ba05b;
            animation: slideUp 0.3s ease;
            position: relative;
        ">
            <button type="button" 
                    onclick="closeAppointmentDetailsModal()" 
                    title="Close"
                    style="
                        position: absolute;
                        top: 14px;
                        right: 16px;
                        background: transparent;
                        border: none;
                        color: #94a387;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 4px 10px;
                        line-height: 1;
                        border-radius: 8px;
                        transition: all 0.2s ease;
                        z-index: 10;
                    "
                    onmouseover="this.style.color='#ef4444'; this.style.background='rgba(239,68,68,0.1)'"
                    onmouseout="this.style.color='#94a387'; this.style.background='transparent'">
                ✕
            </button>
            
            <div style="
                padding: 26px 26px 18px;
                border-bottom: 1px solid #eaf3e0;
                display: flex;
                align-items: center;
                gap: 14px;
            ">
                <div style="
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    flex-shrink: 0;
                    box-shadow: 0 4px 12px rgba(123, 160, 91, 0.3);
                ">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h3 style="
                        color: #5a7a3f;
                        font-size: 19px;
                        font-weight: 700;
                        margin: 0 0 4px 0;
                        line-height: 1.2;
                    ">
                        Appointment Details
                    </h3>
                    <p style="
                        color: #94a387;
                        font-size: 12.5px;
                        margin: 0;
                        line-height: 1.4;
                    ">
                        Full information about this booking
                    </p>
                </div>
            </div>
            
            <div style="padding: 20px 26px;">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: #f7fbf3;
                    border-radius: 10px;
                    border: 1px solid #d4e5c4;
                    margin-bottom: 18px;
                ">
                    <span style="color: #94a387; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                        Appointment ID
                    </span>
                    <span style="color: #5a7a3f; font-size: 13px; font-weight: 700; font-family: monospace;">
                        #${app.id}
                    </span>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-paw"></i> Pet Information
                    </div>
                    <div style="
                        background: #f7fbf3;
                        border: 1px solid #d4e5c4;
                        border-radius: 12px;
                        padding: 12px 14px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    ">
                        <div style="
                            width: 44px;
                            height: 44px;
                            border-radius: 12px;
                            background: rgba(123, 160, 91, 0.15);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 20px;
                            flex-shrink: 0;
                        ">
                            ${petIcon}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="color: #2d3e1f; font-size: 15px; font-weight: 600; margin-bottom: 2px;">
                                ${app.pet_name || 'Unknown'}
                            </div>
                            <div style="color: #94a387; font-size: 12px;">
                                ${petTypeLabel}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-user"></i> Customer
                    </div>
                    <div style="
                        background: #f7fbf3;
                        border: 1px solid #d4e5c4;
                        border-radius: 12px;
                        padding: 12px 14px;
                    ">
                        <div style="color: #2d3e1f; font-size: 13px; font-weight: 500; word-break: break-all;">
                            <i class="fas fa-envelope" style="color: #7ba05b; margin-right: 6px;"></i>
                            ${app.customer_email || 'Unknown'}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-scissors"></i> Services
                    </div>
                    <div>
                        ${servicesHTML}
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-calendar-alt"></i> Schedule
                    </div>
                    <div style="
                        background: #f7fbf3;
                        border: 1px solid #d4e5c4;
                        border-radius: 12px;
                        padding: 12px 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-calendar-day" style="color: #7ba05b; width: 14px;"></i> Date
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${app.appointment_date}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-clock" style="color: #7ba05b; width: 14px;"></i> Time
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${formatStaffTime(app.appointment_time)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <div style="
                            color: #5a7a3f;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.6px;
                            margin-bottom: 8px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <i class="fas fa-info-circle"></i> Status
                        </div>
                        <div style="
                            background: ${statusStyle.bg};
                            border-radius: 10px;
                            padding: 10px 14px;
                            text-align: center;
                            color: ${statusStyle.color};
                            font-size: 13px;
                            font-weight: 700;
                        ">
                            <i class="${statusStyle.icon}" style="margin-right: 4px;"></i>
                            ${statusLabel}
                        </div>
                    </div>
                    <div>
                        <div style="
                            color: #5a7a3f;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.6px;
                            margin-bottom: 8px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <i class="fas fa-credit-card"></i> Payment
                        </div>
                        <div style="text-align: center; padding: 5px 0;">
                            ${paymentBadge}
                        </div>
                    </div>
                </div>
                
                ${app.notes ? `
                <div style="margin-top: 16px;">
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-pencil-alt"></i> Notes
                    </div>
                    <div style="
                        background: #f7fbf3;
                        border: 1px solid #d4e5c4;
                        border-radius: 12px;
                        padding: 12px 14px;
                        color: #2d3e1f;
                        font-size: 13px;
                        line-height: 1.5;
                        word-break: break-word;
                    ">
                        ${app.notes}
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div style="
                padding: 16px 26px 22px;
                border-top: 1px solid #eaf3f0;
                background: #f7fbf3;
                border-radius: 0 0 20px 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            ">
                <button type="button" 
                        onclick="closeAppointmentDetailsModal()" 
                        style="
                            padding: 10px 22px;
                            border-radius: 10px;
                            border: 1.5px solid #d4e5c4;
                            background: #ffffff;
                            color: #5a7a3f;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: 'Poppins', sans-serif;
                            transition: all 0.2s ease;
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                        "
                        onmouseover="this.style.borderColor='#7ba05b'; this.style.background='#f7fbf3';"
                        onmouseout="this.style.borderColor='#d4e5c4'; this.style.background='#ffffff';">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeAppointmentDetailsModal();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeAppointmentDetailsModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeAppointmentDetailsModal() {
    const modal = document.getElementById('appointmentDetailsModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 200);
    }
}

function showDashboardTab() {
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navDashboard').classList.add('active');
    
    sessionStorage.setItem('staffActiveTab', 'dashboard');
    
    loadStaffStats();
    loadAllAppointments();
}

function showCustomersTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'block';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navCustomers').classList.add('active');
    
    sessionStorage.setItem('staffActiveTab', 'customers');
    loadStaffStats();
    loadStaffCustomers();
}

function showPetsTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'block';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navPets').classList.add('active');
    
    sessionStorage.setItem('staffActiveTab', 'pets');
    loadPets();
}

let currentCustomerEmail = null;

function showMessagesTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'block';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navMessages').classList.add('active');
    
    sessionStorage.setItem('staffActiveTab', 'messages');
    
    const messagesGrid = document.getElementById('messagesGrid');
    if (messagesGrid) {
        messagesGrid.classList.remove('has-active-conversation');
    }
    
    loadCustomersWithMessages();
    
    if (window.innerWidth > 768) {
        if (currentCustomerEmail) {
            loadConversation(currentCustomerEmail);
        } else {
            loadFirstUnreadStaffConversation();
        }
    }
    
    loadUnreadCount();
}

async function loadFirstUnreadStaffConversation() {
    try {
        const res = await fetch('/api/messages/received-only');
        const data = await res.json();
        
        if (data.success && data.senders && data.senders.length > 0) {
            const sortedSenders = data.senders.sort((a, b) => {
                if (a.unread_count > 0 && b.unread_count === 0) return -1;
                if (a.unread_count === 0 && b.unread_count > 0) return 1;
                const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
                const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
                return dateB - dateA;
            });
            
            const unreadSenders = sortedSenders.filter(s => s.unread_count > 0);
            
            if (unreadSenders.length > 0) {
                await loadConversation(unreadSenders[0].email);
            } else {
                await loadConversation(sortedSenders[0].email);
            }
        }
    } catch (error) {
        console.error('Error loading first conversation:', error);
    }
}

let staffAllCustomers = [];
let staffFilteredCustomers = [];

async function loadCustomersWithMessages() {
    const container = document.getElementById('customerList');
    
    container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #64748b;">
            ⏳ Loading customers...
        </div>
    `;
    
    try {
        const res = await fetch('/api/messages/received-only');
        const data = await res.json();
        
        if (data.success && data.senders && data.senders.length > 0) {
            staffAllCustomers = data.senders.sort((a, b) => {
                if (a.unread_count > 0 && b.unread_count === 0) return -1;
                if (a.unread_count === 0 && b.unread_count > 0) return 1;
                const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
                const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
                return dateB - dateA;
            });
            
            renderStaffCustomerList(staffAllCustomers);
        } else {
            staffAllCustomers = [];
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 10px;">💬</div>
                    <p>No messages from customers yet.</p>
                    <p style="font-size: 12px; margin-top: 5px;">Messages sent to you will appear here.</p>
                </div>
            `;
            updateStaffSearchCount(0);
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ef4444;">
                ❌ Error loading customers
            </div>
        `;
    }
}

function renderStaffCustomerList(customers) {
    const container = document.getElementById('customerList');
    const searchInput = document.getElementById('staffMessageSearch');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filtered = customers;
    if (searchTerm) {
        filtered = customers.filter(customer => {
            const name = (customer.fullname || customer.email || '').toLowerCase();
            const email = (customer.email || '').toLowerCase();
            const phone = (customer.phone || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
        });
    }
    
    filtered = filtered.sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (a.unread_count === 0 && b.unread_count > 0) return 1;
        const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
        const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
        return dateB - dateA;
    });
    
    staffFilteredCustomers = filtered;
    updateStaffSearchCount(filtered.length);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #64748b;">
                <div style="font-size: 32px; margin-bottom: 10px;">🔍</div>
                <p>No customers found matching your search.</p>
                <p style="font-size: 12px; margin-top: 5px;">Try a different search term.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(sender => {
        const isActive = currentCustomerEmail === sender.email;
        const unreadBadge = sender.unread_count > 0 ? 
            `<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: auto;">${sender.unread_count}</span>` : '';
        
        const lastMessageTime = sender.last_message_at ? 
            new Date(sender.last_message_at).toLocaleDateString() : '';
        
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 12px 15px;
            border-bottom: 1px solid #eaf3e0;
            cursor: pointer;
            transition: 0.3s;
            display: flex;
            align-items: center;
            gap: 10px;
            ${isActive ? 'background: rgba(123, 160, 91, 0.08);' : ''}
        `;
        div.onmouseover = () => { div.style.background = 'rgba(123, 160, 91, 0.05)'; };
        div.onmouseout = () => { div.style.background = isActive ? 'rgba(123, 160, 91, 0.08)' : ''; };
        div.onclick = () => {
            if (window.innerWidth <= 768) {
                const messagesGrid = document.getElementById('messagesGrid');
                if (messagesGrid) {
                    messagesGrid.classList.add('has-active-conversation');
                }
            }
            loadConversation(sender.email);
        };
        
        // ✅ DEFAULT AVATAR — FontAwesome user icon with green color (tugma sa theme)
        const avatarHTML = sender.profile_image
            ? `<img src="${sender.profile_image}" alt="${sender.fullname || sender.email}" 
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                    onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-user\\' style=\\'color: #7ba05b; font-size: 16px;\\'></i>';">`
            : `<i class="fas fa-user" style="color: #7ba05b; font-size: 16px;"></i>`;
        
        div.innerHTML = `
            <div style="width: 35px; height: 35px; min-width: 35px; border-radius: 50%; background: rgba(123, 160, 91, 0.15); color: #5a7a3f; display: flex; align-items: center; justify-content: center; font-size: 16px; overflow: hidden; flex-shrink: 0;">${avatarHTML}</div>
            <div style="flex: 1; min-width: 0;">
                <div style="color: #2d3e1f; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sender.fullname || sender.email}</div>
                <div style="color: #7a8a7c; font-size: 11px;">${sender.email} • ${sender.phone || 'No phone'}</div>
                ${lastMessageTime ? `<div style="color: #94a387; font-size: 10px; margin-top: 2px;"> ${lastMessageTime}</div>` : ''}
            </div>
            ${unreadBadge}
        `;
        container.appendChild(div);
    });
}

function searchStaffMessages() {
    const input = document.getElementById('staffMessageSearch');
    const clearBtn = document.getElementById('staffClearSearchBtn');
    
    if (input) {
        const searchTerm = input.value.trim();
        if (searchTerm !== '') {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
        renderStaffCustomerList(staffAllCustomers);
    }
}

function clearStaffMessageSearch() {
    const input = document.getElementById('staffMessageSearch');
    const clearBtn = document.getElementById('staffClearSearchBtn');
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        renderStaffCustomerList(staffAllCustomers);
        input.focus();
    }
}

function updateStaffSearchCount(count) {
    const el = document.getElementById('staffSearchResultCount');
    if (el) {
        el.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
    }
}

function initStaffMessageSearch() {
    const searchInput = document.getElementById('staffMessageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchStaffMessages);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearStaffMessageSearch();
            }
        });
    }
    
    const searchWrapper = document.getElementById('staffSearchWrapper');
    if (searchWrapper) {
        searchWrapper.addEventListener('click', function() {
            const input = document.getElementById('staffMessageSearch');
            if (input) input.focus();
        });
    }
}

async function loadConversation(customerEmail) {
    currentCustomerEmail = customerEmail;
    
    const messagesGrid = document.getElementById('messagesGrid');
    if (messagesGrid && window.innerWidth <= 768) {
        messagesGrid.classList.add('has-active-conversation');
    }
    
    let customerName = customerEmail;
    let customerProfileImage = null;
    
    try {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        
        if (usersData.success) {
            const user = usersData.users.find(u => u.email === customerEmail);
            if (user) {
                if (user.fullname && user.fullname.trim() !== '') {
                    customerName = user.fullname;
                }
                if (user.profile_image) {
                    customerProfileImage = user.profile_image;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching customer name:', error);
        customerName = customerEmail;
    }
    
       // ✅ DEFAULT AVATAR — FontAwesome user icon with green color (tugma sa theme)
    // ✅ FIXED: Perfect circle avatar + clickable fullscreen viewer
    const safeCustomerName = (customerName || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    let headerAvatarHTML;
    let headerAvatarClickAttr;
    let headerAvatarCursor;
    
    if (customerProfileImage) {
        headerAvatarHTML = `<img src="${customerProfileImage}" alt="${customerName}" 
                style="width: 100% !important; height: 100% !important; max-width: 100% !important; max-height: 100% !important; object-fit: cover; border-radius: 50%; display: block;">`;
        headerAvatarClickAttr = `onclick="event.stopPropagation(); window.openStaffImageViewer('${customerProfileImage.replace(/'/g, "\\'")}');"`;
        headerAvatarCursor = 'pointer';
    } else {
        headerAvatarHTML = `<i class="fas fa-user" style="color: #7ba05b; font-size: 18px;"></i>`;
        headerAvatarClickAttr = '';
        headerAvatarCursor = 'default';
    }
    
    document.getElementById('conversationHeader').innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="header-avatar"
                 ${headerAvatarClickAttr}
                 title="${customerProfileImage ? 'Click to view profile picture' : customerName}"
                 style="width: 40px !important; height: 40px !important; min-width: 40px !important; max-width: 40px !important; flex: 0 0 40px !important; flex-shrink: 0 !important; flex-grow: 0 !important; border-radius: 50% !important; background: rgba(123, 160, 91, 0.15); display: flex; align-items: center; justify-content: center; overflow: hidden; aspect-ratio: 1 / 1; box-sizing: border-box; cursor: ${headerAvatarCursor}; transition: transform 0.2s ease, box-shadow 0.2s ease;"
                 onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 0 0 2px #7ba05b';"
                 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                ${headerAvatarHTML}
            </div>
            <div>
                <div style="color: #2d3e1f; font-weight: 600;">${customerName}</div>
                <div style="color: #7a8a7c; font-size: 12px;">${customerEmail}</div>
            </div>
        </div>
    `;
    document.getElementById('replyCustomerEmail').value = customerEmail;
    document.getElementById('replyMessage').value = '';
    document.getElementById('replyMessage').placeholder = 'Type your reply...';
    
    try {
        const res = await fetch(`/api/messages/${customerEmail}`);
        const data = await res.json();
        
        const container = document.getElementById('conversationMessages');
        
        if (data.success && data.messages && data.messages.length > 0) {
            container.innerHTML = '';
            data.messages.forEach(msg => {
                const isStaff = msg.sender_email === customerEmail ? false : true;
                
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    margin-bottom: 10px;
                    padding: 0;
                    box-sizing: border-box;
                    align-items: ${isStaff ? 'flex-end' : 'flex-start'};
                `;
                
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
                
                let senderName = isStaff ? 'Staff' : customerName;
                
                const bubbleContainer = document.createElement('div');
                bubbleContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    max-width: 78%;
                    box-sizing: border-box;
                    align-items: ${isStaff ? 'flex-end' : 'flex-start'};
                    text-align: ${isStaff ? 'right' : 'left'};
                `;
                
                const nameEl = document.createElement('div');
                nameEl.style.cssText = `
                    font-size: 11px;
                    font-weight: 600;
                    color: #5a7a3f;
                    margin-bottom: 3px;
                    padding: 0 4px;
                    line-height: 1.2;
                    text-align: ${isStaff ? 'right' : 'left'};
                    width: 100%;
                `;
                nameEl.textContent = senderName;
                
                const bubble = document.createElement('div');
                bubble.style.cssText = `
                    display: inline-block;
                    padding: 8px 12px;
                    border-radius: 14px;
                    background: ${isStaff ? '#7ba05b' : '#ffffff'};
                    color: ${isStaff ? '#ffffff' : '#2d3e1f'};
                    border: ${isStaff ? 'none' : '1px solid #eaf3e0'};
                    ${isStaff ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}
                    font-size: 13px;
                    line-height: 1.4;
                    word-wrap: break-word;
                    overflow-wrap: anywhere;
                    box-sizing: border-box;
                    text-align: left;
                    max-width: 100%;
                `;
                
                let bubbleContent = '';
                
                if (messageText) {
                    bubbleContent += `<div style="font-size: 13px; line-height: 1.4; word-wrap: break-word; overflow-wrap: anywhere;">${messageText}</div>`;
                }
                
                if (imageData && imageData.startsWith('data:image')) {
                    bubbleContent += `
                        <div style="margin-top: 6px;">
                            <img src="${imageData}" 
                                style="max-width: 200px; max-height: 200px; border-radius: 8px; cursor: pointer; display: block;" 
                                onclick="window.openImageFullscreen('${imageData}')"
                                alt="Image">
                        </div>
                    `;
                }
                
                bubble.innerHTML = bubbleContent;
                
                const timeEl = document.createElement('div');
                timeEl.style.cssText = `
                    font-size: 10px;
                    color: #94a387;
                    margin-top: 3px;
                    padding: 0 4px;
                    line-height: 1.2;
                    text-align: ${isStaff ? 'right' : 'left'};
                    width: 100%;
                `;
                timeEl.textContent = new Date(msg.created_at).toLocaleString();
                
                bubbleContainer.appendChild(nameEl);
                bubbleContainer.appendChild(bubble);
                bubbleContainer.appendChild(timeEl);
                
                wrapper.appendChild(bubbleContainer);
                container.appendChild(wrapper);
            });
            container.scrollTop = container.scrollHeight;
            
            await markStaffMessagesAsRead(customerEmail);
            
        } else {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    No messages yet.
                </div>
            `;
        }
        
        renderStaffCustomerList(staffAllCustomers);
        loadUnreadCount();
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        document.getElementById('conversationMessages').innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 40px;">
                ❌ Error loading messages
            </div>
        `;
    }
}

function closeMobileConversation() {
    const messagesGrid = document.getElementById('messagesGrid');
    if (messagesGrid) {
        messagesGrid.classList.remove('has-active-conversation');
    }
}

async function markStaffMessagesAsRead(customerEmail) {
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        const res = await fetch('/api/messages/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sender: customerEmail,
                receiver: currentUser
            })
        });
        const data = await res.json();
        
        if (data.success) {
            console.log(`✅ Messages from ${customerEmail} marked as read`);
            await loadCustomersWithMessages();
            loadUnreadCount();
            
            const activeItem = document.querySelector('#customerList div[style*="background: rgba(56, 189, 248, 0.1)"]');
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

async function sendReply(e) {
    e.preventDefault();
    
    const customerEmail = document.getElementById('replyCustomerEmail').value;
    const message = document.getElementById('replyMessage').value.trim();
    
    if (!message) {
        const input = document.getElementById('replyMessage');
        input.style.borderColor = '#ef4444';
        input.placeholder = '⚠️ Please enter a message';
        setTimeout(() => {
            input.style.borderColor = '#d4e5c4';
            input.placeholder = 'Type your reply...';
        }, 2000);
        return;
    }
    
    if (!customerEmail) {
        showMessage('Please select a customer first.', 'error');
        return;
    }
    
    const btn = document.querySelector('#replyForm button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Sending...';
    btn.disabled = true;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        if (socket && socket.connected) {
            socket.emit('send_message', {
                sender: currentUser,
                receiver: customerEmail,
                message: message,
                subject: 'Staff Reply',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
        }
        
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                subject: 'Staff Reply',
                message: message,
                receiver: customerEmail
            })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('replyMessage').value = '';
            const input = document.getElementById('replyMessage');
            input.placeholder = '✅ Message sent!';
            input.style.borderColor = '#7ba05b';
            setTimeout(() => {
                input.placeholder = 'Type your reply...';
                input.style.borderColor = '#d4e5c4';
            }, 2000);
            
            loadConversation(customerEmail);
            showMessage('✅ Reply sent successfully!', 'success');
            
        } else {
            showMessage('❌ ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Something went wrong. Please try again.', 'error');
    }
    
    btn.textContent = originalText;
    btn.disabled = false;
}

function openImageFullscreen(imageSrc) {
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
    overlay.onclick = function() { overlay.remove(); };
    
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
    
    document.body.appendChild(overlay);
}

async function loadUnreadCount() {
    try {
        const res = await fetch('/api/messages/unread-count');
        const data = await res.json();
        
        const badge = document.getElementById('unreadBadge');
        const display = document.getElementById('unreadCountDisplay');
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline-block';
            badge.style.animation = 'pulse 1.5s ease-in-out infinite';
            if (display) display.textContent = `${data.count} unread`;
        } else {
            badge.textContent = '0';
            badge.style.display = 'none';
            badge.style.animation = 'none';
            if (display) display.textContent = '0 unread';
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

let socket = null;

function connectStaffSocket() {
    if (socket && socket.connected) return;
    
    socket = io();
    
    const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
    if (currentUser) {
        socket.emit('register_user', { email: currentUser });
    }
    
    socket.on('new_message', function(data) {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        if (data.receiver === currentUser || data.sender === currentUser) {
            loadUnreadCount();
            
            if (document.getElementById('messagesSection').style.display !== 'none') {
                loadCustomersWithMessages();
                if (currentCustomerEmail && data.sender === currentCustomerEmail) {
                    loadConversation(currentCustomerEmail);
                }
            }
            
            console.log(`📩 New message from ${data.sender || 'Customer'} - Unread count updated.`);
        }
    });
    
    socket.on('connect', function() {
        console.log('Staff connected to WebSocket');
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        if (currentUser) {
            socket.emit('register_user', { email: currentUser });
        }
    });
    
    socket.on('disconnect', function() {
        console.log('Staff disconnected from WebSocket');
        setTimeout(connectStaffSocket, 2000);
    });
}

function updateUnreadBadge() {
    loadUnreadCount();
}

async function loadStaffStats() {
    try {
        const res = await fetch('/api/staff/stats');
        const data = await res.json();
        
        if (data.success) {
            const stats = data.stats;
            
            document.getElementById('totalCustomers').textContent = stats.total_customers;
            document.getElementById('totalPets').textContent = stats.total_pets;
            document.getElementById('totalAppointments').textContent = stats.total_appointments;
            document.getElementById('pendingAppointments').textContent = stats.pending;
            document.getElementById('confirmedAppointments').textContent = stats.confirmed;
            document.getElementById('cancelledAppointments').textContent = stats.cancelled;
            
            const dailyAvgEl = document.getElementById('dailyAverage');
            if (dailyAvgEl) dailyAvgEl.textContent = stats.avg_appointments_per_day;
            
            const newPetsEl = document.getElementById('newPetsThisMonth');
            if (newPetsEl) newPetsEl.textContent = stats.new_pets_this_month;
            
            const newCustomersEl = document.getElementById('newCustomersThisMonth');
            if (newCustomersEl) newCustomersEl.textContent = stats.new_customers_this_month;
            
            const completionRateEl = document.getElementById('completionRate');
            if (completionRateEl) completionRateEl.textContent = stats.completion_rate + '%';
        }
    } catch (error) {
        console.error('Error loading staff stats:', error);
    }
}

async function refreshStats() {
    await loadStaffStats();
    showMessage('✅ Stats refreshed!', 'success');
}

async function checkMLStatus() {
    try {
        const res = await fetch('/api/ml/status');
        const data = await res.json();
        
        if (data.success) {
            let statusMsg = '';
            if (data.model_exists) {
                statusMsg = `✅ AI Model is ready!\nFeatures: ${data.features?.join(', ') || 'N/A'}`;
                if (data.classes) {
                    statusMsg += `\nCare Levels: ${data.classes.join(', ')}`;
                }
                statusMsg += `\n\n💡 Customers can now get AI recommendations for their pets.`;
            } else {
                statusMsg = `ℹ️ AI Model not trained yet.\n${data.pet_count || 0} pets available for training.\n\nContact Admin to train the model.`;
            }
            alert(`🤖 AI Model Status\n\n${statusMsg}`);
        } else {
            showMessage('Error checking model status.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error checking model status.', 'error');
    }
}

function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = 'message ' + type;
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 4000);
}

async function loadCustomers() {
    try {
        const res = await fetch('/api/customers');
        const data = await res.json();
        if (data.success) {
            const select = document.getElementById('petOwner');
            select.innerHTML = '<option value="">Select customer...</option>';
            data.customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.email;
                option.textContent = customer.fullname || customer.email;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: loadPets() — View button lang ang natira
//              (Tinanggal na ang Edit at Delete buttons)
// ═══════════════════════════════════════════════════════════════════
async function loadPets() {
    const tbody = document.getElementById('registeredPetsTable');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; color: #64748b; padding: 30px;">
                ⏳ Loading registered pets...
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch('/api/pets');
        const data = await res.json();
        
        if (data.success && data.pets && data.pets.length > 0) {
            tbody.innerHTML = '';
            data.pets.forEach(pet => {
                let statusClass = 'pet-status-healthy';
                let statusText = '✅ Healthy';
                
                const hasRealAllergies = pet.allergies && 
                                        pet.allergies.trim() !== '' && 
                                        pet.allergies.trim().toLowerCase() !== 'none' &&
                                        pet.allergies.trim().toLowerCase() !== 'n/a';
                
                const hasRealMedicalHistory = pet.medical_history && 
                                             pet.medical_history.trim() !== '' && 
                                             pet.medical_history.trim().toLowerCase() !== 'none' &&
                                             pet.medical_history.trim().toLowerCase() !== 'n/a';
                
                if (hasRealAllergies) {
                    statusClass = 'pet-status-critical';
                    statusText = '⚠️ Has Allergies';
                } else if (hasRealMedicalHistory) {
                    statusClass = 'pet-status-warning';
                    statusText = '⚠️ Needs Attention';
                }
                
                const petType = pet.pet_type || 'Dog';
                const petIcon = petType === 'Cat' ? '🐈' : '🐕';
                const petTypeLabel = petType === 'Cat' ? 'Cat' : 'Dog';
                
                const row = document.createElement('tr');
                row.className = 'pet-row';
                row.dataset.name = pet.name || '';
                row.dataset.owner = pet.owner_email || '';
                row.dataset.breed = pet.breed || '';
                
                const petImageHTML = pet.pet_image 
                    ? `<img src="${pet.pet_image}" 
                            style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; cursor: pointer; border: 2px solid #d4e5c4; transition: all 0.2s ease;"
                            onclick="window.showPetFullscreen('${pet.pet_image.replace(/'/g, "\\'")}', '${(pet.name || '').replace(/'/g, "\\'")}')"
                            onmouseover="this.style.transform='scale(1.15)'; this.style.borderColor='#7ba05b';"
                            onmouseout="this.style.transform='scale(1)'; this.style.borderColor='#d4e5c4';"
                            title="Click to view full size">` 
                    : `<span style="font-size: 24px;">${petIcon}</span>`;
                
                row.innerHTML = `
                    <td data-label="ID">${pet.id}</td>
                    <td data-label="Pet">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${petImageHTML}
                            <strong>${pet.name}</strong>
                        </div>
                    </td>
                    <td data-label="Type"><span class="pet-type-badge ${petType === 'Cat' ? 'cat' : 'dog'}">${petTypeLabel}</span></td>
                    <td data-label="Breed">${pet.breed || '—'}</td>
                    <td data-label="Age">${pet.age || '—'}</td>
                    <td data-label="Gender">${pet.gender || '—'}</td>
                    <td data-label="Owner"><span class="truncate" title="${pet.owner_email}">${pet.owner_email}</span></td>
                    <td data-label="Status"><span class="pet-status ${statusClass}">${statusText}</span></td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="btn-view" onclick="showPetDetailsModal(${pet.id})">📋 View</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: #64748b; padding: 30px;">
                        No registered pets yet.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading registered pets:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #ef4444; padding: 30px;">
                    ❌ Error loading registered pets. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

function showPetFullscreen(imageSrc, petName = 'Pet') {
    const overlay = document.createElement('div');
    overlay.id = 'petFullscreenViewer';
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
        padding: 20px;
        box-sizing: border-box;
    `;
    
    overlay.innerHTML = `
        <span style="
            position: absolute;
            top: 20px;
            right: 30px;
            color: #fff;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
            transition: all 0.2s ease;
            z-index: 10;
        " onmouseover="this.style.color='#ef4444'; this.style.transform='scale(1.2)';" 
           onmouseout="this.style.color='#fff'; this.style.transform='scale(1)';">&times;</span>
        
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            max-width: 90%;
            max-height: 90%;
            animation: slideUp 0.3s ease;
        ">
            <img src="${imageSrc}" 
                 alt="${petName}"
                 style="
                    max-width: 100%;
                    max-height: 80vh;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    border: 3px solid #7ba05b;
                    object-fit: contain;
                    background: #fff;
                 ">
            <div style="
                color: #ffffff;
                font-size: 18px;
                font-weight: 600;
                font-family: 'Poppins', sans-serif;
                text-align: center;
                background: rgba(123, 160, 91, 0.9);
                padding: 8px 24px;
                border-radius: 20px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            ">
                🐾 ${petName}
            </div>
        </div>
    `;
    
    overlay.onclick = function() { 
        overlay.remove(); 
        document.body.style.overflow = '';
    };
    
    document.body.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: showPetDetailsModal() — Tinanggal ang Edit Pet button
//              Close button na lang ang natira
// ═══════════════════════════════════════════════════════════════════
async function showPetDetailsModal(petId) {
    console.log('🔍 Opening pet details for ID:', petId);
    
    try {
        const res = await fetch('/api/pets');
        const data = await res.json();
        
        if (!data.success || !data.pets) {
            showMessage('❌ Failed to load pet details.', 'error');
            return;
        }
        
        const pet = data.pets.find(p => p.id === petId);
        if (!pet) {
            showMessage('❌ Pet not found.', 'error');
            return;
        }
        
        const petType = pet.pet_type || 'Dog';
        const isCat = petType === 'Cat';
        const petIcon = isCat ? '🐈' : '🐕';
        const petTypeLabel = isCat ? 'Cat' : 'Dog';
        
        const ageYears = parseInt(pet.age) || 0;
        const ageMonths = parseInt(pet.age_months) || 0;
        let ageDisplay = '—';
        if (ageYears > 0 && ageMonths > 0) {
            ageDisplay = `${ageYears} year${ageYears !== 1 ? 's' : ''}, ${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
        } else if (ageYears > 0) {
            ageDisplay = `${ageYears} year${ageYears !== 1 ? 's' : ''}`;
        } else if (ageMonths > 0) {
            ageDisplay = `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
        }
        
        const hasRealAllergies = pet.allergies && 
                                pet.allergies.trim() !== '' && 
                                pet.allergies.trim().toLowerCase() !== 'none' &&
                                pet.allergies.trim().toLowerCase() !== 'n/a';
        
        const hasRealMedicalHistory = pet.medical_history && 
                                     pet.medical_history.trim() !== '' && 
                                     pet.medical_history.trim().toLowerCase() !== 'none' &&
                                     pet.medical_history.trim().toLowerCase() !== 'n/a';
        
        let statusClass = 'pet-status-healthy';
        let statusText = '✅ Healthy';
        let statusColor = '#10b981';
        let statusBg = 'rgba(16, 185, 129, 0.15)';
        
        if (hasRealAllergies) {
            statusClass = 'pet-status-critical';
            statusText = '⚠️ Has Allergies';
            statusColor = '#ef4444';
            statusBg = 'rgba(239, 68, 68, 0.15)';
        } else if (hasRealMedicalHistory) {
            statusClass = 'pet-status-warning';
            statusText = '⚠️ Needs Attention';
            statusColor = '#f59e0b';
            statusBg = 'rgba(245, 158, 11, 0.15)';
        }
        
        const allergiesDisplay = hasRealAllergies ? pet.allergies : 'None';
        const medicalHistoryDisplay = hasRealMedicalHistory ? pet.medical_history : 'None';
        
        const petImageHTML = pet.pet_image 
            ? `<img src="${pet.pet_image}" 
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; cursor: pointer;"
                    onclick="window.showPetFullscreen('${pet.pet_image.replace(/'/g, "\\'")}', '${(pet.name || '').replace(/'/g, "\\'")}')"
                    title="Click to view full size">`
            : `<span style="font-size: 64px;">${petIcon}</span>`;
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'petDetailsModal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(45, 62, 31, 0.5);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
            animation: fadeIn 0.25s ease;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: #ffffff;
                border-radius: 20px;
                max-width: 560px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 50px rgba(123, 160, 91, 0.25);
                border: 1px solid #d4e5c4;
                animation: slideUp 0.3s ease;
                position: relative;
            ">
                <button type="button" 
                        onclick="closePetDetailsModal()" 
                        title="Close"
                        style="
                            position: absolute;
                            top: 14px;
                            right: 16px;
                            background: transparent;
                            border: none;
                            color: #94a387;
                            font-size: 22px;
                            cursor: pointer;
                            padding: 4px 10px;
                            line-height: 1;
                            border-radius: 8px;
                            transition: all 0.2s ease;
                            z-index: 10;
                            font-family: 'Poppins', sans-serif;
                        "
                        onmouseover="this.style.color='#ef4444'; this.style.background='rgba(239,68,68,0.1)'"
                        onmouseout="this.style.color='#94a387'; this.style.background='transparent'">
                    ✕
                </button>
                
                <div style="
                    padding: 30px 26px 20px;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(123, 160, 91, 0.06), rgba(90, 122, 63, 0.06));
                    border-radius: 20px 20px 0 0;
                    border-bottom: 1px solid #eaf3e0;
                ">
                    <div style="
                        width: 110px;
                        height: 110px;
                        border-radius: 50%;
                        background: #ffffff;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 14px;
                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
                        border: 4px solid #7ba05b;
                        overflow: hidden;
                        cursor: ${pet.pet_image ? 'pointer' : 'default'};
                        transition: all 0.2s ease;
                    "
                    onmouseover="${pet.pet_image ? "this.style.transform='scale(1.05)'; this.style.boxShadow='0 8px 25px rgba(123, 160, 91, 0.4)';" : ''}"
                    onmouseout="${pet.pet_image ? "this.style.transform='scale(1)'; this.style.boxShadow='0 6px 20px rgba(0, 0, 0, 0.1)';" : ''}">
                        ${petImageHTML}
                    </div>
                    <h3 style="
                        color: #2d3e1f;
                        font-size: 24px;
                        font-weight: 700;
                        margin: 0 0 4px 0;
                        line-height: 1.3;
                    ">
                        ${pet.name || 'Unknown'}
                    </h3>
                    <p style="
                        color: #64748b;
                        font-size: 13px;
                        margin: 0;
                    ">
                        ${petIcon} ${petTypeLabel} • ${pet.breed || 'Mixed Breed'}
                    </p>
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        background: ${statusBg};
                        color: ${statusColor};
                        padding: 5px 14px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 700;
                        margin-top: 12px;
                    ">
                        ${statusText}
                    </div>
                </div>
                
                <div style="padding: 20px 26px;">
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-paw"></i> Basic Information
                    </div>
                    <div style="
                        background: #f7fbf3;
                        border: 1px solid #d4e5c4;
                        border-radius: 12px;
                        padding: 14px 16px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-bottom: 16px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-paw" style="color: #7ba05b; width: 14px;"></i> Type
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 600; text-align: right;">
                                ${petIcon} ${petTypeLabel}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-dna" style="color: #7ba05b; width: 14px;"></i> Breed
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${pet.breed || 'Mixed Breed'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-calendar-alt" style="color: #7ba05b; width: 14px;"></i> Age
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${ageDisplay}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-venus-mars" style="color: #7ba05b; width: 14px;"></i> Gender
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${pet.gender || '—'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-palette" style="color: #7ba05b; width: 14px;"></i> Color
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${pet.color || '—'}
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                            <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-weight" style="color: #7ba05b; width: 14px;"></i> Weight
                            </span>
                            <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                                ${pet.weight ? pet.weight + ' kg' : '—'}
                            </span>
                        </div>
                    </div>
                    
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-user"></i> Owner Information
                    </div>
                    <div style="
                        background: #f7fbf3;
                        border: 1px solid #d4e5c4;
                        border-radius: 12px;
                        padding: 14px 16px;
                        margin-bottom: 16px;
                    ">
                        <div style="color: #2d3e1f; font-size: 13px; font-weight: 500; word-break: break-all;">
                            <i class="fas fa-envelope" style="color: #7ba05b; margin-right: 6px;"></i>
                            ${pet.owner_email || 'Unknown'}
                        </div>
                    </div>
                    
                    <div style="
                        color: #5a7a3f;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.6px;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fas fa-heartbeat"></i> Health Information
                    </div>
                    
                    <div style="
                        background: ${hasRealAllergies ? 'rgba(239, 68, 68, 0.06)' : '#f7fbf3'};
                        border: 1px solid ${hasRealAllergies ? 'rgba(239, 68, 68, 0.3)' : '#d4e5c4'};
                        border-radius: 12px;
                        padding: 14px 16px;
                        margin-bottom: 10px;
                    ">
                        <div style="
                            color: ${hasRealAllergies ? '#ef4444' : '#94a387'};
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            margin-bottom: 6px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <i class="fas fa-exclamation-triangle"></i> Allergies
                        </div>
                        <div style="
                            color: ${hasRealAllergies ? '#b91c1c' : '#2d3e1f'};
                            font-size: 13px;
                            font-weight: 500;
                            line-height: 1.5;
                            word-break: break-word;
                        ">
                            ${allergiesDisplay}
                        </div>
                    </div>
                    
                    <div style="
                        background: ${hasRealMedicalHistory ? 'rgba(245, 158, 11, 0.06)' : '#f7fbf3'};
                        border: 1px solid ${hasRealMedicalHistory ? 'rgba(245, 158, 11, 0.3)' : '#d4e5c4'};
                        border-radius: 12px;
                        padding: 14px 16px;
                    ">
                        <div style="
                            color: ${hasRealMedicalHistory ? '#f59e0b' : '#94a387'};
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            margin-bottom: 6px;
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        ">
                            <i class="fas fa-notes-medical"></i> Medical History
                        </div>
                        <div style="
                            color: ${hasRealMedicalHistory ? '#b45309' : '#2d3e1f'};
                            font-size: 13px;
                            font-weight: 500;
                            line-height: 1.5;
                            word-break: break-word;
                        ">
                            ${medicalHistoryDisplay}
                        </div>
                    </div>
                </div>
                
                <div style="
                    padding: 16px 26px 22px;
                    border-top: 1px solid #eaf3f0;
                    background: #f7fbf3;
                    border-radius: 0 0 20px 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                ">
                    <button type="button" 
                            onclick="closePetDetailsModal()" 
                            style="
                                padding: 10px 22px;
                                border-radius: 10px;
                                border: 1.5px solid #d4e5c4;
                                background: #ffffff;
                                color: #5a7a3f;
                                font-size: 13px;
                                font-weight: 600;
                                cursor: pointer;
                                font-family: 'Poppins', sans-serif;
                                transition: all 0.2s ease;
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                            "
                            onmouseover="this.style.borderColor='#7ba05b'; this.style.background='#f7fbf3';"
                            onmouseout="this.style.borderColor='#d4e5c4'; this.style.background='#ffffff';">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closePetDetailsModal();
            }
        });
        
        const escHandler = function(e) {
            if (e.key === 'Escape') {
                closePetDetailsModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
    } catch (error) {
        console.error('❌ Error loading pet details:', error);
        showMessage('❌ Error loading pet details. Please try again.', 'error');
    }
}

function closePetDetailsModal() {
    const modal = document.getElementById('petDetailsModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 200);
    }
}

async function updateAppointmentCounts() {
    try {
        const totalRes = await fetch('/api/appointments/count');
        const totalData = await totalRes.json();
        if (totalData.success) {
            document.getElementById('totalAppointments').textContent = totalData.count;
        }
        
        const pendingRes = await fetch('/api/appointments/pending-count');
        const pendingData = await pendingRes.json();
        if (pendingData.success) {
            document.getElementById('pendingAppointments').textContent = pendingData.count;
            document.getElementById('pendingBadge').textContent = pendingData.count;
        }
        
        const confirmedRes = await fetch('/api/appointments/confirmed-count');
        const confirmedData = await confirmedRes.json();
        if (confirmedData.success) {
            document.getElementById('confirmedAppointments').textContent = confirmedData.count;
            document.getElementById('confirmedBadge').textContent = confirmedData.count;
        }
        
        const cancelledRes = await fetch('/api/appointments/cancelled-count');
        const cancelledData = await cancelledRes.json();
        if (cancelledData.success) {
            document.getElementById('cancelledAppointments').textContent = cancelledData.count;
        }
    } catch (error) {
        console.error('Error updating appointment counts:', error);
    }
}

async function loadAllAppointments() {
    const tbody = document.getElementById('staffAppointmentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; color: #64748b; padding: 40px;">
                ⏳ Loading appointments...
            </td>
        </tr>
    `;
    
    try {
        await updateAppointmentCounts();
        
        const res = await fetch('/api/appointments/all');
        const data = await res.json();
        
        if (data.success && data.appointments && data.appointments.length > 0) {
            staffAllAppointments = data.appointments;
            updateStaffAppointmentCounts(staffAllAppointments);
            
            if (staffCurrentFilter !== 'all') {
                filterStaffAppointments(staffCurrentFilter);
            } else {
                renderStaffAppointments();
            }
        } else {
            staffAllAppointments = [];
            updateStaffAppointmentCounts([]);
            renderStaffAppointments();
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        const totalApptEl = document.getElementById('totalAppointments');
        if (totalApptEl) totalApptEl.textContent = '0';
        const pendingApptEl = document.getElementById('pendingAppointments');
        if (pendingApptEl) pendingApptEl.textContent = '0';
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: #ef4444; padding: 40px;">
                    ❌ Error loading appointments. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

async function updateAppointmentStatus(appointmentId, status) {
    const app = staffAllAppointments.find(a => a.id === appointmentId);
    if (!app) {
        showMessage('❌ Appointment not found.', 'error');
        return;
    }
    
    const statusConfig = {
        'confirmed': {
            title: 'Confirm Appointment?',
            message: 'Are you sure you want to confirm this appointment? The customer will receive a confirmation email.',
            icon: 'fas fa-check-circle',
            iconColor: '#10b981',
            btnText: 'Yes, Confirm',
            btnColor: 'linear-gradient(135deg, #10b981, #059669)',
            btnHoverShadow: '0 8px 25px rgba(16, 185, 129, 0.45)'
        },
        'completed': {
            title: 'Complete Appointment?',
            message: 'Are you sure you want to mark this appointment as completed? This action cannot be undone.',
            icon: 'fas fa-flag-checkered',
            iconColor: '#7ba05b',
            btnText: 'Yes, Complete',
            btnColor: 'linear-gradient(135deg, #7ba05b, #5a7a3f)',
            btnHoverShadow: '0 8px 25px rgba(123, 160, 91, 0.45)'
        },
        'cancelled': {
            title: 'Cancel Appointment?',
            message: 'Are you sure you want to cancel this appointment? The customer will be notified via email.',
            icon: 'fas fa-times-circle',
            iconColor: '#ef4444',
            btnText: 'Yes, Cancel',
            btnColor: 'linear-gradient(135deg, #ef4444, #dc2626)',
            btnHoverShadow: '0 8px 25px rgba(239, 68, 68, 0.45)'
        },
        'pending': {
            title: 'Set to Pending?',
            message: 'Are you sure you want to set this appointment back to pending status?',
            icon: 'fas fa-hourglass-half',
            iconColor: '#f59e0b',
            btnText: 'Yes, Set Pending',
            btnColor: 'linear-gradient(135deg, #f59e0b, #d97706)',
            btnHoverShadow: '0 8px 25px rgba(245, 158, 11, 0.45)'
        }
    };
    
    const config = statusConfig[status] || statusConfig['confirmed'];
    
    const dateDisplay = app.appointment_date || 'N/A';
    const timeDisplay = formatStaffTime(app.appointment_time);
    
    const petType = (app.pet_type || 'Dog').toLowerCase();
    const isCat = petType === 'cat';
    const petIcon = isCat 
        ? '<i class="fas fa-cat" style="color: #f59e0b;"></i>' 
        : '<i class="fas fa-dog" style="color: #7ba05b;"></i>';
    const petTypeLabel = isCat ? 'Cat' : 'Dog';
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'appointmentStatusModal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(45, 62, 31, 0.5);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        animation: fadeIn 0.25s ease;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 20px;
            max-width: 460px;
            width: 100%;
            box-shadow: 0 20px 50px rgba(123, 160, 91, 0.25);
            border: 1px solid #d4e5c4;
            animation: slideUp 0.3s ease;
            position: relative;
            overflow: hidden;
        ">
            <button type="button" 
                    onclick="closeAppointmentStatusModal()" 
                    title="Close"
                    style="
                        position: absolute;
                        top: 14px;
                        right: 16px;
                        background: transparent;
                        border: none;
                        color: #94a387;
                        font-size: 22px;
                        cursor: pointer;
                        padding: 4px 10px;
                        line-height: 1;
                        border-radius: 8px;
                        transition: all 0.2s ease;
                        z-index: 10;
                        font-family: 'Poppins', sans-serif;
                    "
                    onmouseover="this.style.color='#ef4444'; this.style.background='rgba(239,68,68,0.1)'"
                    onmouseout="this.style.color='#94a387'; this.style.background='transparent'">
                ✕
            </button>
            
            <div style="
                padding: 32px 26px 20px;
                text-align: center;
                background: linear-gradient(135deg, rgba(123, 160, 91, 0.06), rgba(90, 122, 63, 0.06));
            ">
                <div style="
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    background: #ffffff;
                    color: ${config.iconColor};
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    margin-bottom: 14px;
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
                    border: 3px solid ${config.iconColor}20;
                ">
                    <i class="${config.icon}"></i>
                </div>
                <h3 style="
                    color: #2d3e1f;
                    font-size: 20px;
                    font-weight: 700;
                    margin: 0 0 6px 0;
                    line-height: 1.3;
                ">
                    ${config.title}
                </h3>
                <p style="
                    color: #64748b;
                    font-size: 13px;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0 8px;
                ">
                    ${config.message}
                </p>
            </div>
            
            <div style="padding: 0 26px 20px;">
                <div style="
                    background: #f7fbf3;
                    border: 1px solid #d4e5c4;
                    border-radius: 12px;
                    padding: 14px 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-paw" style="color: #7ba05b; width: 14px;"></i> Pet
                        </span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 600; text-align: right; display: flex; align-items: center; gap: 6px;">
                            ${petIcon} ${app.pet_name || 'Unknown'}
                            <span style="color: #94a387; font-weight: 400; font-size: 11px;">(${petTypeLabel})</span>
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-user" style="color: #7ba05b; width: 14px;"></i> Customer
                        </span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 500; text-align: right; word-break: break-all; max-width: 60%;">
                            ${app.customer_email || 'Unknown'}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-calendar-alt" style="color: #7ba05b; width: 14px;"></i> Date
                        </span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                            ${dateDisplay}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-clock" style="color: #7ba05b; width: 14px;"></i> Time
                        </span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 500; text-align: right;">
                            ${timeDisplay}
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 8px; border-top: 1px solid #eaf3e0;">
                        <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-hashtag" style="color: #7ba05b; width: 14px;"></i> ID
                        </span>
                        <span style="color: #5a7a3f; font-size: 12px; font-weight: 700; font-family: monospace; text-align: right;">
                            #${app.id}
                        </span>
                    </div>
                </div>
            </div>
            
            <div style="
                padding: 0 26px 24px;
                display: flex;
                gap: 10px;
            ">
                <button type="button" 
                        onclick="closeAppointmentStatusModal()" 
                        style="
                            flex: 1;
                            padding: 12px 20px;
                            border-radius: 12px;
                            border: 1.5px solid #d4e5c4;
                            background: #ffffff;
                            color: #5a7a3f;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: 'Poppins', sans-serif;
                            transition: all 0.2s ease;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                        "
                        onmouseover="this.style.borderColor='#7ba05b'; this.style.background='#f7fbf3'; this.style.transform='translateY(-2px)';"
                        onmouseout="this.style.borderColor='#d4e5c4'; this.style.background='#ffffff'; this.style.transform='translateY(0)';">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" 
                        onclick="executeAppointmentStatusChange(${appointmentId}, '${status}')"
                        id="confirmStatusBtn"
                        style="
                            flex: 1;
                            padding: 12px 20px;
                            border-radius: 12px;
                            border: none;
                            background: ${config.btnColor};
                            color: #ffffff;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: 'Poppins', sans-serif;
                            transition: all 0.2s ease;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
                        "
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='${config.btnHoverShadow}';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.12)';">
                    <i class="fas fa-check"></i> ${config.btnText}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeAppointmentStatusModal();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeAppointmentStatusModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeAppointmentStatusModal() {
    const modal = document.getElementById('appointmentStatusModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            if (modal.parentNode) modal.remove();
        }, 200);
    }
}

function showTableLoadingOverlay(message = 'Processing...') {
    const wrapper = document.querySelector('#appointmentManagementCard .appointments-table-wrapper');
    if (!wrapper) return;
    
    const existing = document.getElementById('tableLoadingOverlay');
    if (existing) existing.remove();
    
    wrapper.style.position = 'relative';
    
    const overlay = document.createElement('div');
    overlay.id = 'tableLoadingOverlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(247, 251, 243, 0.85);
        backdrop-filter: blur(3px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 50;
        border-radius: 10px;
        animation: fadeIn 0.2s ease;
        min-height: 200px;
    `;
    
    overlay.innerHTML = `
        <div style="
            display: inline-block;
            width: 48px;
            height: 48px;
            border: 4px solid #d4e5c4;
            border-top-color: #7ba05b;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
        "></div>
        <p style="
            color: #5a7a3f;
            font-size: 14px;
            font-weight: 600;
            margin: 0;
            font-family: 'Poppins', sans-serif;
            text-align: center;
            padding: 0 20px;
        ">
            <i class="fas fa-spinner fa-spin"></i> ${message}
        </p>
    `;
    
    wrapper.appendChild(overlay);
}

function hideTableLoadingOverlay() {
    const overlay = document.getElementById('tableLoadingOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
        }, 200);
    }
}

async function executeAppointmentStatusChange(appointmentId, status) {
    const statusLabels = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled'
    };
    
    closeAppointmentStatusModal();
    showTableLoadingOverlay(`Updating appointment to ${statusLabels[status] || status}...`);
    
    try {
        const res = await fetch(`/api/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        
        hideTableLoadingOverlay();
        
        if (data.success) {
            showMessage(`✅ Appointment ${statusLabels[status] || status}!`, 'success');
            await loadAllAppointments();
            await refreshStats();
        } else {
            showMessage(data.message || 'Error updating appointment.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        hideTableLoadingOverlay();
        showMessage('Something went wrong. Please try again.', 'error');
    }
}

function showAddPetModal() {
    document.getElementById('addPetModal').style.display = 'flex';
    loadCustomers();
    document.getElementById('petForm').reset();
    document.getElementById('petImagePreview').innerHTML = '<span style="color: #64748b; font-size: 12px; text-align: center;">No<br>Image</span>';
}

function closeAddPetModal() {
    document.getElementById('addPetModal').style.display = 'none';
}

async function submitPet(e) {
    e.preventDefault();
    
    const customer_email = document.getElementById('petOwner').value;
    const pet_type = document.getElementById('petType').value;
    const name = document.getElementById('petName').value.trim();
    const breed = document.getElementById('petBreed').value.trim();
    const age = document.getElementById('petAge').value;
    const gender = document.getElementById('petGender').value;
    const color = document.getElementById('petColor').value.trim();
    const weight = document.getElementById('petWeight').value;
    const allergies = document.getElementById('petAllergies').value.trim();
    const medical_history = document.getElementById('petMedicalHistory').value.trim();
    
    const imageInput = document.getElementById('petImage');
    let pet_image = '';
    if (imageInput && imageInput.files && imageInput.files[0]) {
        pet_image = await getBase64Image(imageInput);
    }
    
    if (!customer_email) {
        showMessage('Please select a customer.', 'error');
        return;
    }
    if (!name) {
        showMessage('Please enter pet name.', 'error');
        return;
    }
    
    try {
        const res = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                customer_email, pet_type, name, breed, age, gender, color, weight, allergies, medical_history, pet_image
            })
        });
        const data = await res.json();
        
        if (data.success) {
            showMessage('Pet registered successfully! 🎉', 'success');
            closeAddPetModal();
            loadPets();
            refreshStats();
            const totalPetsEl = document.getElementById('totalPets');
            if (totalPetsEl) {
                const current = parseInt(totalPetsEl.textContent) || 0;
                totalPetsEl.textContent = current + 1;
            }
        } else {
            showMessage(data.message || 'Error registering pet.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Something went wrong. Please try again.', 'error');
    }
}

async function showEditPetModal(petId) {
    console.log('🔍 Opening edit modal for pet ID:', petId);
    
    const modal = document.getElementById('editPetModal');
    if (!modal) {
        console.error('❌ editPetModal not found in HTML');
        showMessage('❌ Edit modal not found. Please refresh the page.', 'error');
        return;
    }
    
    modal.style.display = 'flex';
    
    selectedAllergiesEditStaff = [];
    customAllergiesEditStaff = [];
    
    try {
        const res = await fetch('/api/pets');
        const data = await res.json();
        
        if (data.success && data.pets) {
            const pet = data.pets.find(p => p.id === petId);
            
            if (pet) {
                console.log('✅ Pet found:', pet);
                
                const petType = pet.pet_type || 'Dog';
                
                document.getElementById('editPetId').value = pet.id || '';
                document.getElementById('editPetName').value = pet.name || '';
                document.getElementById('editPetBreed').value = pet.breed || '';
                document.getElementById('editPetGender').value = pet.gender || '';
                document.getElementById('editPetColor').value = pet.color || '';
                document.getElementById('editPetWeight').value = pet.weight || '';
                document.getElementById('editPetMedicalHistory').value = pet.medical_history || '';
                
                const editPetTypeEl = document.getElementById('editPetType');
                if (editPetTypeEl) {
                    editPetTypeEl.value = petType;
                }
                
                const ageForm = ageToFormValue(pet.age, pet.age_months);
                document.getElementById('editPetAge').value = ageForm.value;
                const ageUnitEl = document.getElementById('editPetAgeUnit');
                if (ageUnitEl) ageUnitEl.value = ageForm.unit;
                
                const existingAllergies = pet.allergies 
                    ? pet.allergies.split(',').map(a => a.trim()).filter(a => a && a !== 'None' && a !== 'none')
                    : [];
                selectedAllergiesEditStaff = [...existingAllergies];
                
                renderAllergyDropdownStaff(petType, selectedAllergiesEditStaff);
                
                const preview = document.getElementById('editPetImagePreview');
                if (preview) {
                    if (pet.pet_image) {
                        preview.innerHTML = `<img src="${pet.pet_image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        preview.style.border = '2px solid #7ba05b';
                    } else {
                        preview.innerHTML = `
                            <span style="font-size: 36px; color: #94a3b8;"><i class="fas fa-camera"></i></span>
                            <span style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Tap to add photo</span>
                        `;
                        preview.style.border = '2px dashed #d4e5c4';
                    }
                }
                
                const submitBtn = document.getElementById('editPetSubmitBtn');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Pet';
                    submitBtn.disabled = false;
                }
                
                console.log('✅ Edit modal loaded successfully');
            } else {
                showMessage('❌ Pet not found.', 'error');
                closeEditPetModal();
            }
        } else {
            showMessage('❌ Failed to load pet details.', 'error');
            closeEditPetModal();
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Error loading pet details. Please try again.', 'error');
        closeEditPetModal();
    }
}

function closeEditPetModal() {
    const modal = document.getElementById('editPetModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function updatePet(e) {
    e.preventDefault();
    
    const petId = document.getElementById('editPetId').value;
    const pet_type = document.getElementById('editPetType').value;
    const name = document.getElementById('editPetName').value.trim();
    const breed = document.getElementById('editPetBreed').value.trim();
    const ageValue = document.getElementById('editPetAge').value;
    const ageUnit = document.getElementById('editPetAgeUnit').value;
    const gender = document.getElementById('editPetGender').value;
    const color = document.getElementById('editPetColor').value.trim();
    const weight = document.getElementById('editPetWeight').value;
    const allergies = getSelectedAllergiesStringStaff();
    const medical_history = document.getElementById('editPetMedicalHistory').value.trim();
    
    if (!name) {
        showMessage('Please enter pet name.', 'error');
        return;
    }
    
    const { age, age_months } = parseAgeInput(ageValue, ageUnit);
    
    const imageInput = document.getElementById('editPetImage');
    let pet_image = '';
    if (imageInput && imageInput.files && imageInput.files[0]) {
        pet_image = await getBase64Image(imageInput);
    }
    
    const submitBtn = document.getElementById('editPetSubmitBtn');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;
    
    try {
        const res = await fetch(`/api/pets/${petId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                pet_type, name, breed, age, age_months, gender, color, weight, 
                allergies, medical_history, pet_image 
            })
        });
        const data = await res.json();
        
        if (data.success) {
            showMessage('✅ Pet updated successfully!', 'success');
            closeEditPetModal();
            loadPets();
        } else {
            showMessage('❌ ' + (data.message || 'Error updating pet.'), 'error');
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('❌ Something went wrong. Please try again.', 'error');
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

function getBase64Image(input) {
    return new Promise((resolve, reject) => {
        const file = input.files[0];
        if (!file) {
            resolve('');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showMessage('❌ File is too large. Max 5MB.', 'error');
            resolve('');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(err) {
            reject(err);
        };
        reader.readAsDataURL(file);
    });
}

async function deletePet(petId) {
    if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/pets/${petId}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        
        if (data.success) {
            showMessage('Pet deleted successfully! 🗑️', 'success');
            loadPets();
            refreshStats();
            const totalPetsEl = document.getElementById('totalPets');
            if (totalPetsEl) {
                const current = parseInt(totalPetsEl.textContent) || 0;
                totalPetsEl.textContent = current > 0 ? current - 1 : 0;
            }
        } else {
            showMessage(data.message || 'Error deleting pet.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Something went wrong. Please try again.', 'error');
    }
}

function showLogoutModal() {
    document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

async function confirmLogout() {
    closeLogoutModal();
    try {
        await fetch('/logout');
        sessionStorage.removeItem('staffActiveTab');
        sessionStorage.clear();
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('email');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('role');
        sessionStorage.removeItem('role');
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        sessionStorage.removeItem('staffActiveTab');
        window.location.href = '/';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddPetModal();
        closeEditPetModal();
        closeLogoutModal();
    }
});

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeAddPetModal();
        closeEditPetModal();
        closeLogoutModal();
    }
});

let staffEmojiPickerVisible = false;

function toggleStaffEmojiPicker() {
    const picker = document.getElementById('staffEmojiPicker');
    if (!picker) return;
    
    staffEmojiPickerVisible = !staffEmojiPickerVisible;
    picker.style.display = staffEmojiPickerVisible ? 'flex' : 'none';
}

function insertStaffEmoji(emoji) {
    const input = document.getElementById('replyMessage');
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + emoji.length;
    
    if (staffEmojiPickerVisible) {
        toggleStaffEmojiPicker();
    }
}

let staffPendingImage = null;

function showStaffImageUploadModal() {
    let modal = document.getElementById('staffImageUploadModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'staffImageUploadModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-popup" style="max-width: 450px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🖼️</div>
                    <h3 style="color: #5a7a3f; font-size: 24px; margin: 0;">Upload Image</h3>
                    <p style="color: #7a8a7c; font-size: 14px; margin-top: 5px;">Share a photo with your message</p>
                </div>
                
                <div style="background: #f7fbf3; border-radius: 12px; padding: 30px; border: 2px dashed #d4e5c4; text-align: center; cursor: pointer; transition: 0.3s;" 
                    id="staffImageUploadDropzone"
                    onclick="document.getElementById('staffImageUploadInput').click()">
                    <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;">📷</div>
                    <p style="color: #4a5a3f; font-size: 14px;">Click or drag to upload image</p>
                    <p style="color: #94a387; font-size: 12px;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="staffImageUploadInput" accept="image/*" style="display: none;">
                
                <div id="staffImagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="staffImagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="closeStaffImageUploadModal()" style="flex: 1;">Cancel</button>
                        <button class="modal-btn modal-btn-submit" onclick="sendStaffImageMessage()" id="staffSendImageBtn" style="flex: 1; background: #7ba05b; color: #ffffff;">📤 Send Image</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeStaffImageUploadModal();
            }
        });
        
        const fileInput = document.getElementById('staffImageUploadInput');
        fileInput.addEventListener('change', function(e) {
            previewStaffImage(e);
        });
        
        const dropzone = document.getElementById('staffImageUploadDropzone');
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
                document.getElementById('staffImageUploadInput').files = files;
                previewStaffImage({ target: { files: files } });
            }
        });
    }
    
    document.getElementById('staffImagePreviewContainer').style.display = 'none';
    document.getElementById('staffImageUploadInput').value = '';
    document.getElementById('staffImageUploadDropzone').style.borderColor = '#d4e5c4';
    document.getElementById('staffImageUploadDropzone').style.background = '#f7fbf3';
    document.getElementById('staffSendImageBtn').disabled = false;
    document.getElementById('staffSendImageBtn').textContent = '📤 Send Image';
    staffPendingImage = null;
    
    modal.style.display = 'flex';
}

function closeStaffImageUploadModal() {
    const modal = document.getElementById('staffImageUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
    staffPendingImage = null;
}

function previewStaffImage(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
        showMessage('Please select an image file.', 'error');
        document.getElementById('staffImageUploadInput').value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showMessage('Image is too large. Please upload under 5MB.', 'error');
        document.getElementById('staffImageUploadInput').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('staffImagePreview');
        preview.src = e.target.result;
        document.getElementById('staffImagePreviewContainer').style.display = 'block';
        staffPendingImage = {
            data: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
        };
    };
    reader.readAsDataURL(file);
}

async function sendStaffImageMessage() {
    const imageData = staffPendingImage;
    if (!imageData) {
        showMessage('Please select an image first.', 'error');
        return;
    }
    
    const customerEmail = document.getElementById('replyCustomerEmail').value;
    if (!customerEmail) {
        showMessage('Please select a customer first.', 'error');
        return;
    }
    
    const btn = document.getElementById('staffSendImageBtn');
    btn.textContent = '⏳ Uploading...';
    btn.disabled = true;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: '📷 Image',
                message: '📷 Image',
                receiver: customerEmail,
                image_data: imageData.data,
                image_name: imageData.name,
                image_type: imageData.type
            })
        });
        const data = await res.json();
        
        if (data.success) {
            showMessage('✅ Image sent successfully!', 'success');
            closeStaffImageUploadModal();
            await loadConversation(customerEmail);
            await loadCustomersWithMessages();
            loadUnreadCount();
            
            if (socket && socket.connected) {
                socket.emit('send_message', {
                    sender: currentUser,
                    receiver: customerEmail,
                    message: '📷 Image',
                    subject: '📷 Image',
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    image_data: imageData.data,
                    image_name: imageData.name,
                    image_type: imageData.type
                });
            }
        } else {
            showMessage('❌ ' + (data.message || 'Error sending image.'), 'error');
            btn.textContent = '📤 Send Image';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error sending image:', error);
        showMessage('Something went wrong. Please try again.', 'error');
        btn.textContent = '📤 Send Image';
        btn.disabled = false;
    }
}

function initStaffEmojiPicker() {
    if (document.getElementById('staffEmojiPicker')) return;
    
    const footer = document.querySelector('#replyForm').parentElement;
    if (!footer) return;
    
    footer.style.position = 'relative';
    
    const picker = document.createElement('div');
    picker.id = 'staffEmojiPicker';
    picker.style.cssText = `
        display: none;
        position: absolute;
        bottom: 70px;
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
        `;
        btn.onmouseover = () => { btn.style.background = '#f7fbf3'; btn.style.borderColor = '#7ba05b'; btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.background = '#ffffff'; btn.style.borderColor = '#d4e5c4'; btn.style.transform = 'scale(1)'; };
        btn.onclick = () => insertStaffEmoji(emoji);
        picker.appendChild(btn);
    });
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
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
    `;
    closeBtn.onclick = toggleStaffEmojiPicker;
    closeBtn.onmouseover = () => { closeBtn.style.background = '#dc2626'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = '#ef4444'; };
    picker.appendChild(closeBtn);
    
    footer.appendChild(picker);
}

function addStaffMessageButtons() {
    const replyForm = document.getElementById('replyForm');
    if (!replyForm) return;
    
    if (document.getElementById('staffEmojiBtn')) return;
    
    const input = replyForm.querySelector('input[type="text"]');
    const sendBtn = replyForm.querySelector('button[type="submit"]');
    
    if (!input || !sendBtn) return;
    
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
    `;
    
    const emojiBtn = document.createElement('button');
    emojiBtn.id = 'staffEmojiBtn';
    emojiBtn.type = 'button';
    emojiBtn.innerHTML = '😊';
    emojiBtn.title = 'Insert Emoji';
    emojiBtn.style.cssText = `
        padding: 8px 14px;
        background: #eaf3e0;
        border: 1px solid #d4e5c4;
        border-radius: 10px;
        color: #4a5a3f;
        font-size: 18px;
        cursor: pointer;
        transition: 0.3s;
    `;
    emojiBtn.onmouseover = () => { emojiBtn.style.background = '#d4e5c4'; emojiBtn.style.color = '#5a7a3f'; };
    emojiBtn.onmouseout = () => { emojiBtn.style.background = '#eaf3e0'; emojiBtn.style.color = '#4a5a3f'; };
    emojiBtn.onclick = toggleStaffEmojiPicker;
    
    const imageBtn = document.createElement('button');
    imageBtn.id = 'staffImageBtn';
    imageBtn.type = 'button';
    imageBtn.innerHTML = '🖼️';
    imageBtn.title = 'Upload Image';
    imageBtn.style.cssText = `
        padding: 8px 14px;
        background: #eaf3e0;
        border: 1px solid #d4e5c4;
        border-radius: 10px;
        color: #4a5a3f;
        font-size: 18px;
        cursor: pointer;
        transition: 0.3s;
    `;
    imageBtn.onmouseover = () => { imageBtn.style.background = '#d4e5c4'; imageBtn.style.color = '#5a7a3f'; };
    imageBtn.onmouseout = () => { imageBtn.style.background = '#eaf3e0'; imageBtn.style.color = '#4a5a3f'; };
    imageBtn.onclick = showStaffImageUploadModal;
    
    const parent = sendBtn.parentNode;
    parent.insertBefore(btnContainer, sendBtn);
    btnContainer.appendChild(emojiBtn);
    btnContainer.appendChild(imageBtn);
    
    sendBtn.style.marginLeft = 'auto';
}

function searchPets() {
    const input = document.getElementById('petSearchInput');
    const clearBtn = document.getElementById('clearPetSearchBtn');
    const emptyState = document.getElementById('petEmptyState');
    const rows = document.querySelectorAll('#registeredPetsTable .pet-row');
    let visibleCount = 0;
    
    if (!input) return;
    
    const searchTerm = input.value.trim().toLowerCase();
    
    if (searchTerm !== '') {
        clearBtn.style.display = 'inline-block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const match = text.includes(searchTerm);
        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });
    
    if (emptyState) {
        const hasData = rows.length > 0;
        emptyState.style.display = visibleCount === 0 && hasData ? 'block' : 'none';
    }
}

function clearPetSearch() {
    const input = document.getElementById('petSearchInput');
    const clearBtn = document.getElementById('clearPetSearchBtn');
    const emptyState = document.getElementById('petEmptyState');
    
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        const rows = document.querySelectorAll('#registeredPetsTable .pet-row');
        rows.forEach(row => {
            row.style.display = '';
        });
        input.focus();
    }
}

function searchAppointments() {
    const input = document.getElementById('appointmentSearchInput');
    const clearBtn = document.getElementById('clearAppointmentSearchBtn');
    
    if (input) {
        const searchTerm = input.value.trim();
        if (searchTerm !== '') {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
        
        if (staffCurrentFilter !== 'all') {
            filterStaffAppointments(staffCurrentFilter);
        } else {
            renderStaffAppointments();
        }
    }
}

function clearAppointmentSearch() {
    const input = document.getElementById('appointmentSearchInput');
    const clearBtn = document.getElementById('clearAppointmentSearchBtn');
    
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        
        if (staffCurrentFilter !== 'all') {
            filterStaffAppointments(staffCurrentFilter);
        } else {
            renderStaffAppointments();
        }
        input.focus();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadPets();
    loadAllAppointments();
    
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    const referrer = document.referrer || '';
    const cameFromAvailability = referrer.includes('/staff-availability');
    const savedTab = cameFromAvailability ? sessionStorage.getItem('staffActiveTab') : null;
    
    if (cameFromAvailability) {
        sessionStorage.removeItem('staffActiveTab');
    }
    
    if (tab === 'customers') {
        showCustomersTab();
    } else if (savedTab === 'customers') {
        showCustomersTab();
    } else if (savedTab === 'pets') {
        showPetsTab();
    } else if (savedTab === 'messages') {
        showMessagesTab();
    } else {
        showDashboardTab();
    }
    
    loadUnreadCount();
    loadStaffStats();
    
    connectStaffSocket();
    
    initStaffEmojiPicker();
    addStaffMessageButtons();
    initStaffMessageSearch();
    
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            filterStaffAppointments(this.dataset.tab);
        });
    });
    
    const customerSearchInput = document.getElementById('customerSearchInput');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', searchCustomers);
        customerSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') clearCustomerSearch();
        });
    }
    const customerSearchWrapper = document.getElementById('customerSearchWrapper');
    if (customerSearchWrapper) {
        customerSearchWrapper.addEventListener('click', function() {
            const input = document.getElementById('customerSearchInput');
            if (input) input.focus();
        });
    }

    const petSearchInput = document.getElementById('petSearchInput');
    if (petSearchInput) {
        petSearchInput.addEventListener('input', searchPets);
        petSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') clearPetSearch();
        });
    }
    const petSearchWrapper = document.getElementById('petSearchWrapper');
    if (petSearchWrapper) {
        petSearchWrapper.addEventListener('click', function() {
            const input = document.getElementById('petSearchInput');
            if (input) input.focus();
        });
    }

    const appointmentSearchInput = document.getElementById('appointmentSearchInput');
    if (appointmentSearchInput) {
        appointmentSearchInput.addEventListener('input', searchAppointments);
        appointmentSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') clearAppointmentSearch();
        });
    }
    const appointmentSearchWrapper = document.getElementById('appointmentSearchWrapper');
    if (appointmentSearchWrapper) {
        appointmentSearchWrapper.addEventListener('click', function() {
            const input = document.getElementById('appointmentSearchInput');
            if (input) input.focus();
        });
    }

    const conversationHeader = document.getElementById('conversationHeader');
    if (conversationHeader) {
        conversationHeader.addEventListener('click', function(e) {
            if (window.innerWidth > 768) return;
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            if (clickX <= 60) {
                e.stopPropagation();
                closeMobileConversation();
            }
        });
    }
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        loadPets();
        loadAllAppointments();
        loadUnreadCount();
        loadStaffStats();
    }
});

setInterval(loadUnreadCount, 30000);

window.showDashboardTab = showDashboardTab;
window.showCustomersTab = showCustomersTab;
window.showPetsTab = showPetsTab;
window.showMessagesTab = showMessagesTab;
window.toggleMobileSidebar = toggleMobileSidebar;
window.showMessage = showMessage;
window.showAddPetModal = showAddPetModal;
window.closeAddPetModal = closeAddPetModal;
window.submitPet = submitPet;
window.showEditPetModal = showEditPetModal;
window.closeEditPetModal = closeEditPetModal;
window.updatePet = updatePet;
window.deletePet = deletePet;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.loadConversation = loadConversation;
window.sendReply = sendReply;
window.loadUnreadCount = loadUnreadCount;
window.updateAppointmentStatus = updateAppointmentStatus;
window.closeAppointmentStatusModal = closeAppointmentStatusModal;
window.executeAppointmentStatusChange = executeAppointmentStatusChange;
window.showTableLoadingOverlay = showTableLoadingOverlay;
window.hideTableLoadingOverlay = hideTableLoadingOverlay;
window.loadFirstUnreadStaffConversation = loadFirstUnreadStaffConversation;
window.filterStaffAppointments = filterStaffAppointments;
window.renderStaffAppointments = renderStaffAppointments;
window.refreshAppointments = refreshAppointments;
window.viewAppointmentDetails = viewAppointmentDetails;
window.formatStaffTime = formatStaffTime;
window.openImageFullscreen = openImageFullscreen;
window.closeMobileConversation = closeMobileConversation;

window.toggleStaffEmojiPicker = toggleStaffEmojiPicker;
window.insertStaffEmoji = insertStaffEmoji;
window.showStaffImageUploadModal = showStaffImageUploadModal;
window.closeStaffImageUploadModal = closeStaffImageUploadModal;
window.sendStaffImageMessage = sendStaffImageMessage;

window.loadStaffCustomers = loadStaffCustomers;
window.renderStaffCustomers = renderStaffCustomers;
window.searchCustomers = searchCustomers;
window.clearCustomerSearch = clearCustomerSearch;
window.openStaffImageViewer = openStaffImageViewer;
window.closeStaffImageViewer = closeStaffImageViewer;

window.searchPets = searchPets;
window.clearPetSearch = clearPetSearch;
window.searchAppointments = searchAppointments;
window.clearAppointmentSearch = clearAppointmentSearch;

window.searchStaffMessages = searchStaffMessages;
window.clearStaffMessageSearch = clearStaffMessageSearch;
window.initStaffMessageSearch = initStaffMessageSearch;
window.renderStaffCustomerList = renderStaffCustomerList;

window.loadStaffStats = loadStaffStats;
window.checkMLStatus = checkMLStatus;
window.refreshStats = refreshStats;

window.viewAppointmentDetails = viewAppointmentDetails;
window.closeAppointmentDetailsModal = closeAppointmentDetailsModal;

window.showPetFullscreen = showPetFullscreen;
window.showPetDetailsModal = showPetDetailsModal;
window.closePetDetailsModal = closePetDetailsModal;