// ── PET MANAGEMENT ──────────────────────────────────────────────────

import { fetchPets, createPet, updatePet, deletePetAPI, updatePetImage } from './services.js';
import { showToast, getLoggedInEmail } from './utils.js';

// ── ALLERGY OPTIONS BY PET TYPE ────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════
// 🆕 MEDICAL HISTORY OPTIONS — SEPARATE FOR DOG AND CAT
// ═══════════════════════════════════════════════════════════════════
const MEDICAL_HISTORY_OPTIONS = {
    Dog: [
        'Spayed/Neutered', 'Past Surgery (Minor)', 'Past Surgery (Major)', 'Dental Extraction',
        'Cruciate Ligament Repair', 'Hip Replacement', 'Arthritis / Joint Pain', 'Hip Dysplasia',
        'Elbow Dysplasia', 'Heart Condition / Murmur', 'Diabetes', 'Epilepsy / Seizures',
        'Kidney Disease', 'Liver Disease', 'Thyroid Problems (Hypothyroidism)',
        'Skin Condition / Dermatitis', 'Ear Infection (Recurring)', 'Eye Condition (Cataracts)',
        'Respiratory Issues', 'Obesity', 'Bloat / GDV', 'Pancreatitis', 'Cushing\'s Disease',
        'Addison\'s Disease', 'Luxating Patella', 'Parvo', 'Distemper', 'Kennel Cough',
        'Canine Influenza', 'Leptospirosis', 'Heartworm (Positive)', 'Lyme Disease',
        'Canine Hepatitis', 'Coronavirus (Canine)', 'Giardia', 'Heartworm Prevention',
        'Flea & Tick Prevention', 'Current Maintenance Medication', 'Allergy Medication',
        'Pain Management', 'Insulin', 'Antibiotics (Recent)', 'Joint Supplements',
        'Recent Injury / Accident', 'Pregnancy / Nursing', 'Under Observation'
    ],
    Cat: [
        'Spayed/Neutered', 'Past Surgery (Minor)', 'Past Surgery (Major)', 'Dental Extraction',
        'Arthritis / Joint Pain', 'Heart Condition / Murmur', 'Hypertrophic Cardiomyopathy (HCM)',
        'Diabetes', 'Epilepsy / Seizures', 'Chronic Kidney Disease', 'Liver Disease',
        'Hyperthyroidism', 'Skin Condition / Dermatitis', 'Ear Infection (Recurring)',
        'Eye Condition (Cataracts)', 'Respiratory Issues (Asthma)', 'Obesity',
        'Inflammatory Bowel Disease (IBD)', 'Pancreatitis',
        'Feline Lower Urinary Tract Disease (FLUTD)', 'Urinary Blockage',
        'Dental Disease / Gingivitis', 'Stomatitis', 'Feline Leukemia (FeLV)',
        'Feline Immunodeficiency (FIV)', 'Panleukopenia', 'Feline Herpesvirus',
        'Calicivirus', 'Feline Infectious Peritonitis (FIP)', 'Giardia', 'Ringworm',
        'Ear Mites', 'Fleas (Infestation)', 'Heartworm Prevention', 'Flea & Tick Prevention',
        'Current Maintenance Medication', 'Allergy Medication', 'Pain Management',
        'Insulin', 'Antibiotics (Recent)', 'Thyroid Medication', 'Kidney Support Supplements',
        'Recent Injury / Accident', 'Pregnancy / Nursing', 'Under Observation'
    ]
};

// ── Track selected allergies ────────────────────────────────────────
let selectedAllergiesAdd = [];
let selectedAllergiesEdit = [];
let customAllergiesAdd = [];
let customAllergiesEdit = [];

// ── Track selected medical history ──────────────────────────────────
let medicalHistoryDetailsAdd = {};
let medicalHistoryDetailsEdit = {};

// ── Track custom medical history ────────────────────────────────────
let customMedicalHistoryAdd = [];
let customMedicalHistoryEdit = [];

// ── Track uploaded medical proof files ──────────────────────────────
let medicalProofFilesAdd = [];
let medicalProofFilesEdit = [];

// ═══════════════════════════════════════════════════════════════════
// ── AGE HELPER FUNCTIONS ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function formatPetAge(ageYears, ageMonths) {
    const years = parseInt(ageYears) || 0;
    const months = parseInt(ageMonths) || 0;
    
    if (years === 0 && months === 0) return 'Unknown';
    if (years === 0 && months > 0) {
        return `${months} month${months !== 1 ? 's' : ''} old`;
    }
    if (months === 0) {
        return `${years} year${years !== 1 ? 's' : ''} old`;
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''} old`;
}

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
    
    if (years > 0) {
        return { value: years, unit: 'years' };
    }
    if (months > 0) {
        return { value: months, unit: 'months' };
    }
    return { value: '', unit: 'years' };
}

// ═══════════════════════════════════════════════════════════════════
// ── RENDER ALLERGY DROPDOWN ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
function renderAllergyDropdown(petType, containerId, selectedList = [], isEdit = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
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
    const customList = isEdit ? customAllergiesEdit : customAllergiesAdd;
    const detectedCustom = selectedList.filter(a => !standardOptions.includes(a));
    
    detectedCustom.forEach(c => {
        if (!customList.includes(c)) customList.push(c);
    });
    
    if (isEdit) customAllergiesEdit = customList;
    else customAllergiesAdd = customList;
    
    const hasOthers = customList.length > 0;
    
    let html = `
        <div style="max-height: 220px; overflow-y: auto; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
    `;
    
    options.forEach(allergy => {
        const isChecked = selectedList.includes(allergy);
        const safeId = `${isEdit ? 'edit' : 'add'}-allergy-${allergy.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        html += `
            <label for="${safeId}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: ${isChecked ? 'rgba(123, 160, 91, 0.08)' : '#ffffff'}; border: 1px solid ${isChecked ? '#7ba05b' : '#e2e8f0'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; font-size: 12px; color: #334155;">
                <input type="checkbox" 
                       id="${safeId}" 
                       value="${allergy}" 
                       ${isChecked ? 'checked' : ''}
                       data-allergy-pet-type="${petType}"
                       data-allergy-mode="${isEdit ? 'edit' : 'add'}"
                       style="width: 14px; height: 14px; accent-color: #7ba05b; cursor: pointer; flex-shrink: 0;"
                       onchange="window.toggleAllergySelection(this)">
                <span style="flex: 1; user-select: none;">${allergy}</span>
            </label>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #334155; user-select: none;" for="${isEdit ? 'edit' : 'add'}-allergy-others">
                <input type="checkbox" 
                       id="${isEdit ? 'edit' : 'add'}-allergy-others"
                       ${hasOthers ? 'checked' : ''}
                       data-allergy-mode="${isEdit ? 'edit' : 'add'}"
                       onchange="window.toggleOthersAllergy(this)"
                       style="width: 16px; height: 16px; accent-color: #7ba05b; cursor: pointer; flex-shrink: 0;">
                <span><i class="fas fa-plus-circle" style="color: #7ba05b;"></i> Others (not in list)</span>
            </label>
            
            <div id="${isEdit ? 'edit' : 'add'}-others-input-container" style="margin-top: 8px; display: ${hasOthers ? 'block' : 'none'};">
                <div style="display: flex; gap: 6px; align-items: center;">
                    <input type="text" 
                           id="${isEdit ? 'edit' : 'add'}-others-input" 
                           placeholder="Type allergy name..."
                           style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4e5c4; background: #f7fbf3; font-size: 12px; color: #2d3e1f; outline: none; font-family: 'Poppins', sans-serif;"
                           onkeydown="if(event.key === 'Enter'){ event.preventDefault(); window.addCustomAllergy('${isEdit ? 'edit' : 'add'}'); }">
                    <button type="button" 
                            onclick="window.addCustomAllergy('${isEdit ? 'edit' : 'add'}')"
                            style="padding: 8px 14px; background: #7ba05b; color: #ffffff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                
                <div id="${isEdit ? 'edit' : 'add'}-custom-allergies-list" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${customList.length > 0 
                        ? customList.map((c, i) => `
                            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 160, 91, 0.12); border: 1px solid #7ba05b; border-radius: 20px; font-size: 11px; color: #5a7a3f; font-weight: 500;">
                                <i class="fas fa-tag" style="font-size: 9px;"></i>
                                ${c}
                                <button type="button" 
                                        onclick="window.removeCustomAllergy('${isEdit ? 'edit' : 'add'}', ${i})"
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
            <span style="font-size: 11px; color: #64748b;" id="${isEdit ? 'edit' : 'add'}-allergy-summary">
                ${renderAllergySummaryText(selectedList, customList)}
            </span>
            <button type="button" 
                    onclick="window.clearAllergies('${isEdit ? 'edit' : 'add'}')"
                    style="font-size: 11px; color: #ef4444; background: transparent; border: 1px solid #ef4444; padding: 3px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 4px;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='#fff';"
                    onmouseout="this.style.background='transparent'; this.style.color='#ef4444';">
                <i class="fas fa-times-circle"></i> Clear All
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderAllergySummaryText(selectedList, customList) {
    const total = selectedList.length;
    if (total > 0) {
        return `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${total} allerg${total === 1 ? 'y' : 'ies'} selected`;
    }
    return '<i class="fas fa-info-circle"></i> No allergies selected (leave blank if none)';
}

function toggleAllergySelection(checkbox) {
    const mode = checkbox.dataset.allergyMode;
    const value = checkbox.value;
    const label = checkbox.closest('label');
    
    if (checkbox.checked) {
        if (mode === 'edit') {
            if (!selectedAllergiesEdit.includes(value)) selectedAllergiesEdit.push(value);
        } else {
            if (!selectedAllergiesAdd.includes(value)) selectedAllergiesAdd.push(value);
        }
        label.style.borderColor = '#7ba05b';
        label.style.background = 'rgba(123, 160, 91, 0.08)';
    } else {
        if (mode === 'edit') {
            selectedAllergiesEdit = selectedAllergiesEdit.filter(a => a !== value);
        } else {
            selectedAllergiesAdd = selectedAllergiesAdd.filter(a => a !== value);
        }
        label.style.borderColor = '#e2e8f0';
        label.style.background = '#ffffff';
    }
    
    updateAllergySummary(mode);
}

function toggleOthersAllergy(checkbox) {
    const mode = checkbox.dataset.allergyMode;
    const container = document.getElementById(`${mode}-others-input-container`);
    
    if (checkbox.checked) {
        container.style.display = 'block';
        const input = document.getElementById(`${mode}-others-input`);
        if (input) input.focus();
    } else {
        container.style.display = 'none';
        if (mode === 'edit') customAllergiesEdit = [];
        else customAllergiesAdd = [];
        renderCustomAllergiesList(mode);
        updateAllergySummary(mode);
    }
}

function addCustomAllergy(mode) {
    const input = document.getElementById(`${mode}-others-input`);
    if (!input) return;
    
    const value = input.value.trim();
    if (!value) {
        showToast('Please type an allergy name.', 'error');
        return;
    }
    
    const customList = mode === 'edit' ? customAllergiesEdit : customAllergiesAdd;
    const isDuplicate = customList.some(c => c.toLowerCase() === value.toLowerCase());
    
    if (isDuplicate) {
        showToast('This allergy is already added.', 'error');
        input.value = '';
        return;
    }
    
    const petTypeSelect = document.getElementById(mode === 'edit' ? 'editPetDetailsType' : 'addPetType');
    const petType = petTypeSelect ? petTypeSelect.value : '';
    const standardOptions = ALLERGY_OPTIONS[petType] || [];
    
    if (standardOptions.some(o => o.toLowerCase() === value.toLowerCase())) {
        showToast('This allergy is already in the list above.', 'error');
        input.value = '';
        return;
    }
    
    if (mode === 'edit') customAllergiesEdit.push(value);
    else customAllergiesAdd.push(value);
    
    input.value = '';
    renderCustomAllergiesList(mode);
    updateAllergySummary(mode);
    showToast(`"${value}" added.`, 'success');
}

function removeCustomAllergy(mode, index) {
    if (mode === 'edit') customAllergiesEdit.splice(index, 1);
    else customAllergiesAdd.splice(index, 1);
    renderCustomAllergiesList(mode);
    updateAllergySummary(mode);
}

function renderCustomAllergiesList(mode) {
    const container = document.getElementById(`${mode}-custom-allergies-list`);
    if (!container) return;
    
    const customList = mode === 'edit' ? customAllergiesEdit : customAllergiesAdd;
    
    if (customList.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No custom allergies added yet.</span>';
        return;
    }
    
    container.innerHTML = customList.map((c, i) => `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 160, 91, 0.12); border: 1px solid #7ba05b; border-radius: 20px; font-size: 11px; color: #5a7a3f; font-weight: 500;">
            <i class="fas fa-tag" style="font-size: 9px;"></i>
            ${c}
            <button type="button" 
                    onclick="window.removeCustomAllergy('${mode}', ${i})"
                    style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 12px; line-height: 1; margin-left: 2px;"
                    title="Remove">
                <i class="fas fa-times-circle"></i>
            </button>
        </span>
    `).join('');
}

function updateAllergySummary(mode) {
    const selectedList = mode === 'edit' ? selectedAllergiesEdit : selectedAllergiesAdd;
    const customList = mode === 'edit' ? customAllergiesEdit : customAllergiesAdd;
    const summaryEl = document.getElementById(`${mode}-allergy-summary`);
    if (!summaryEl) return;
    
    const totalCount = selectedList.length + customList.length;
    
    if (totalCount > 0) {
        summaryEl.innerHTML = `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${totalCount} allerg${totalCount === 1 ? 'y' : 'ies'} selected`;
    } else {
        summaryEl.innerHTML = '<i class="fas fa-info-circle"></i> No allergies selected (leave blank if none)';
    }
}

function clearAllergies(mode) {
    if (mode === 'edit') {
        selectedAllergiesEdit = [];
        customAllergiesEdit = [];
    } else {
        selectedAllergiesAdd = [];
        customAllergiesAdd = [];
    }
    
    const checkboxes = document.querySelectorAll(`input[data-allergy-mode="${mode}"]`);
    checkboxes.forEach(cb => {
        cb.checked = false;
        const label = cb.closest('label');
        if (label) {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#ffffff';
        }
    });
    
    const othersContainer = document.getElementById(`${mode}-others-input-container`);
    if (othersContainer) othersContainer.style.display = 'none';
    
    const othersInput = document.getElementById(`${mode}-others-input`);
    if (othersInput) othersInput.value = '';
    
    renderCustomAllergiesList(mode);
    updateAllergySummary(mode);
}

function handleAddPetTypeChange() {
    const select = document.getElementById('addPetType');
    const petType = select.value;
    
    if (petType) select.style.color = '#2d3e1f';
    else select.style.color = '#94a3b8';
    
    selectedAllergiesAdd = [];
    customAllergiesAdd = [];
    renderAllergyDropdown(petType, 'addPetAllergiesContainer', selectedAllergiesAdd, false);
    
    medicalHistoryDetailsAdd = {};
    customMedicalHistoryAdd = [];
    medicalProofFilesAdd = [];
    renderMedicalHistoryDropdown(petType, 'addMedicalHistoryContainer', [], false);
}

function handleEditPetTypeChange() {
    const petType = document.getElementById('editPetDetailsType').value;
    const currentAllergies = document.getElementById('editPetDetailsAllergies').value;
    
    selectedAllergiesEdit = currentAllergies 
        ? currentAllergies.split(',').map(a => a.trim()).filter(a => a)
        : [];
    
    customAllergiesEdit = [];
    renderAllergyDropdown(petType, 'editPetAllergiesContainer', selectedAllergiesEdit, true);
}

function getSelectedAllergiesString(mode) {
    const selectedList = mode === 'edit' ? selectedAllergiesEdit : selectedAllergiesAdd;
    const customList = mode === 'edit' ? customAllergiesEdit : customAllergiesAdd;
    const combined = [...new Set([...selectedList, ...customList])];
    return combined.join(', ');
}

// ═══════════════════════════════════════════════════════════════════
// 🆕 MEDICAL HISTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function renderMedicalHistoryDropdown(petType, containerId, selectedConditions = [], isEdit = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!petType || petType === '') {
        container.innerHTML = `
            <div style="padding: 12px 16px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 10px; text-align: center; color: #94a3b8; font-size: 13px; cursor: not-allowed;">
                <i class="fas fa-lock"></i> Please select a Pet Type first
            </div>
        `;
        return;
    }
    
    const standardOptions = MEDICAL_HISTORY_OPTIONS[petType] || [];
    if (standardOptions.length === 0) {
        container.innerHTML = `
            <div style="padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; color: #94a3b8; font-size: 13px;">
                <i class="fas fa-info-circle"></i> No medical history options available.
            </div>
        `;
        return;
    }
    
    const mode = isEdit ? 'edit' : 'add';
    const detailsMap = isEdit ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    const customList = isEdit ? customMedicalHistoryEdit : customMedicalHistoryAdd;
    const proofFiles = isEdit ? medicalProofFilesEdit : medicalProofFilesAdd;
    
    const selectedList = Object.keys(detailsMap);
    
    const detectedCustom = selectedList.filter(c => !standardOptions.includes(c));
    detectedCustom.forEach(c => {
        if (!customList.includes(c)) customList.push(c);
    });
    
    if (isEdit) customMedicalHistoryEdit = customList;
    else customMedicalHistoryAdd = customList;
    
    const hasOthers = customList.length > 0;
    
    const petTypeIcon = petType === 'Cat' ? 'fa-cat' : 'fa-dog';
    const petTypeColor = petType === 'Cat' ? '#f59e0b' : '#7ba05b';
    
    let html = `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: ${petType === 'Cat' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(123, 160, 91, 0.08)'}; border: 1px solid ${petTypeColor}40; border-radius: 8px; margin-bottom: 10px;">
            <i class="fas ${petTypeIcon}" style="color: ${petTypeColor}; font-size: 14px;"></i>
            <span style="color: #2d3e1f; font-size: 12px; font-weight: 600;">
                ${petType}-Specific Conditions
            </span>
            <span style="margin-left: auto; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                ${standardOptions.length} options
            </span>
        </div>
        
        <div style="max-height: 240px; overflow-y: auto; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
    `;
    
    standardOptions.forEach(condition => {
        const isChecked = selectedList.includes(condition);
        const safeId = `${mode}-med-${condition.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        html += `
            <label for="${safeId}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: ${isChecked ? 'rgba(123, 160, 91, 0.08)' : '#ffffff'}; border: 1px solid ${isChecked ? '#7ba05b' : '#e2e8f0'}; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; font-size: 12px; color: #334155;">
                <input type="checkbox" 
                       id="${safeId}" 
                       value="${condition}" 
                       ${isChecked ? 'checked' : ''}
                       data-med-mode="${mode}"
                       style="width: 14px; height: 14px; accent-color: #7ba05b; cursor: pointer; flex-shrink: 0;"
                       onchange="window.toggleMedicalHistorySelection(this)">
                <span style="flex: 1; user-select: none;">${condition}</span>
            </label>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #334155; user-select: none;" for="${mode}-med-others">
                <input type="checkbox" 
                       id="${mode}-med-others"
                       ${hasOthers ? 'checked' : ''}
                       data-med-mode="${mode}"
                       onchange="window.toggleOthersMedicalHistory(this)"
                       style="width: 16px; height: 16px; accent-color: #7ba05b; cursor: pointer; flex-shrink: 0;">
                <span><i class="fas fa-plus-circle" style="color: #7ba05b;"></i> Others (not in list)</span>
            </label>
            
            <div id="${mode}-med-others-input-container" style="margin-top: 8px; display: ${hasOthers ? 'block' : 'none'};">
                <div style="display: flex; gap: 6px; align-items: center;">
                    <input type="text" 
                           id="${mode}-med-others-input" 
                           placeholder="Type medical condition..."
                           style="flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4e5c4; background: #f7fbf3; font-size: 12px; color: #2d3e1f; outline: none; font-family: 'Poppins', sans-serif;"
                           onkeydown="if(event.key === 'Enter'){ event.preventDefault(); window.addCustomMedicalHistory('${mode}'); }">
                    <button type="button" 
                            onclick="window.addCustomMedicalHistory('${mode}')"
                            style="padding: 8px 14px; background: #7ba05b; color: #ffffff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                
                <div id="${mode}-custom-med-list" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${customList.length > 0 
                        ? customList.map((c, i) => `
                            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 160, 91, 0.12); border: 1px solid #7ba05b; border-radius: 20px; font-size: 11px; color: #5a7a3f; font-weight: 500;">
                                <i class="fas fa-notes-medical" style="font-size: 9px;"></i>
                                ${c}
                                <button type="button" 
                                        onclick="window.removeCustomMedicalHistory('${mode}', ${i})"
                                        style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 12px; line-height: 1; margin-left: 2px;"
                                        title="Remove">
                                    <i class="fas fa-times-circle"></i>
                                </button>
                            </span>
                        `).join('')
                        : '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No custom medical history added yet.</span>'
                    }
                </div>
            </div>
        </div>
        
        <div id="${mode}-med-details-table-container" style="margin-top: 12px;">
            ${renderMedicalHistoryDetailsTable(mode)}
        </div>
        
        <div style="margin-top: 12px; padding: 14px; background: linear-gradient(135deg, #f7fbf3, #eaf3e0); border: 2px dashed #7ba05b; border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                <i class="fas fa-file-medical" style="color: #7ba05b; font-size: 18px;"></i>
                <div style="flex: 1;">
                    <div style="color: #2d3e1f; font-size: 13px; font-weight: 700;">
                        Medical Proof / Records
                        <span style="font-size: 10px; color: #64748b; font-weight: 400; margin-left: 4px;">(Optional)</span>
                    </div>
                    <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
                        Upload vaccination card, prescription, lab results, etc.
                    </div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <input type="file" 
                       id="${mode}-med-proof-input" 
                       accept="image/*,.pdf" 
                       multiple 
                       style="display: none;"
                       onchange="window.handleMedicalProofUpload(event, '${mode}')">
                <button type="button" 
                        onclick="document.getElementById('${mode}-med-proof-input').click()"
                        style="padding: 10px 18px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; border: none; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(123, 160, 91, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(123, 160, 91, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(123, 160, 91, 0.3)';">
                    <i class="fas fa-cloud-upload-alt"></i> Choose Files
                </button>
                <span style="color: #64748b; font-size: 11px; align-self: center;">
                    JPG, PNG, PDF • Max 5MB each
                </span>
            </div>
            
            <div id="${mode}-med-proof-list" style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                ${proofFiles.length > 0 
                    ? proofFiles.map((file, i) => renderProofFileItem(file, i, mode)).join('')
                    : '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No files uploaded yet.</span>'
                }
            </div>
        </div>
        
        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span style="font-size: 11px; color: #64748b;" id="${mode}-med-summary">
                ${renderMedicalHistorySummaryText(selectedList, customList, proofFiles)}
            </span>
            <button type="button" 
                    onclick="window.clearMedicalHistory('${mode}')"
                    style="font-size: 11px; color: #ef4444; background: transparent; border: 1px solid #ef4444; padding: 3px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 4px;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='#fff';"
                    onmouseout="this.style.background='transparent'; this.style.color='#ef4444';">
                <i class="fas fa-times-circle"></i> Clear All
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════
// 🆕 RENDER MEDICAL HISTORY DETAILS TABLE
// ═══════════════════════════════════════════════════════════════════
function renderMedicalHistoryDetailsTable(mode) {
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    const conditions = Object.keys(detailsMap);
    
    if (conditions.length === 0) {
        return `
            <div style="padding: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; text-align: center; color: #94a3b8; font-size: 12px;">
                <i class="fas fa-info-circle"></i> Pumili ng medical condition sa itaas para makita ang details table.
            </div>
        `;
    }
    
    let rowsHTML = '';
    conditions.forEach((condition, idx) => {
        const detail = detailsMap[condition] || '';
        const safeKey = condition.replace(/[^a-zA-Z0-9]/g, '-');
        
        rowsHTML += `
            <tr style="border-bottom: 1px solid #eaf3e0;">
                <td style="padding: 10px 12px; color: #2d3e1f; font-size: 12px; font-weight: 600; width: 40%;">
                    <i class="fas fa-notes-medical" style="color: #7ba05b; margin-right: 6px;"></i>
                    ${condition}
                </td>
                <td style="padding: 10px 12px; width: 60%;">
                    <input type="text" 
                           id="${mode}-med-detail-${safeKey}"
                           value="${detail.replace(/"/g, '&quot;')}"
                           placeholder="Halimbawa: 2023-05-15 o 'Ongoing since 2022'"
                           data-med-condition="${condition}"
                           data-med-mode="${mode}"
                           style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4e5c4; background: #f7fbf3; font-size: 12px; color: #2d3e1f; outline: none; font-family: 'Poppins', sans-serif;"
                           onchange="window.updateMedicalHistoryDetail(this)"
                           oninput="window.updateMedicalHistoryDetail(this)"
                           onkeydown="if(event.key === 'Enter'){ event.preventDefault(); this.blur(); }">
                </td>
                <td style="padding: 10px 12px; width: 40px; text-align: center;">
                    <button type="button" 
                            onclick="window.removeMedicalHistoryRow('${mode}', '${condition.replace(/'/g, "\\'")}')"
                            style="background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease;"
                            onmouseover="this.style.background='#ef4444'; this.style.color='#ffffff';"
                            onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444';"
                            title="Remove condition">
                        <i class="fas fa-times" style="font-size: 11px;"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    return `
        <div style="background: #ffffff; border: 2px solid #7ba05b; border-radius: 12px; overflow: hidden;">
            <div style="padding: 10px 14px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-table"></i>
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Medical History Details
                </span>
                <span style="margin-left: auto; font-size: 10px; background: rgba(255, 255, 255, 0.25); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                    ${conditions.length}
                </span>
            </div>
            <div style="padding: 8px 14px; background: #f7fbf3; border-bottom: 1px solid #eaf3e0;">
                <span style="font-size: 11px; color: #64748b;">
                    <i class="fas fa-info-circle" style="color: #7ba05b;"></i>
                    Isulat kung kelan nangyari o kailan na-diagnose ang bawat condition.
                </span>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f7fbf3;">
                            <th style="padding: 10px 12px; text-align: left; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Condition</th>
                            <th style="padding: 10px 12px; text-align: left; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Date / Details</th>
                            <th style="padding: 10px 12px; text-align: center; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; width: 40px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.updateMedicalHistoryDetail = function(input) {
    const mode = input.dataset.medMode;
    const condition = input.dataset.medCondition;
    const value = input.value.trim();
    
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    
    if (detailsMap.hasOwnProperty(condition)) {
        detailsMap[condition] = value;
    }
    
    if (mode === 'edit') medicalHistoryDetailsEdit = detailsMap;
    else medicalHistoryDetailsAdd = detailsMap;
    
    updateMedicalHistorySummary(mode);
};

window.removeMedicalHistoryRow = function(mode, condition) {
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    
    if (detailsMap.hasOwnProperty(condition)) {
        delete detailsMap[condition];
    }
    
    if (mode === 'edit') medicalHistoryDetailsEdit = detailsMap;
    else medicalHistoryDetailsAdd = detailsMap;
    
    const petTypeSelect = document.getElementById(mode === 'edit' ? 'editPetDetailsType' : 'addPetType');
    const petType = petTypeSelect ? petTypeSelect.value : '';
    const standardOptions = MEDICAL_HISTORY_OPTIONS[petType] || [];
    
    if (standardOptions.includes(condition)) {
        const safeId = `${mode}-med-${condition.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const checkbox = document.getElementById(safeId);
        if (checkbox) {
            checkbox.checked = false;
            const label = checkbox.closest('label');
            if (label) {
                label.style.borderColor = '#e2e8f0';
                label.style.background = '#ffffff';
            }
        }
    } else {
        if (mode === 'edit') {
            customMedicalHistoryEdit = customMedicalHistoryEdit.filter(c => c !== condition);
        } else {
            customMedicalHistoryAdd = customMedicalHistoryAdd.filter(c => c !== condition);
        }
        renderCustomMedicalHistoryList(mode);
    }
    
    renderMedicalHistoryTableContainer(mode);
    updateMedicalHistorySummary(mode);
    
    showToast(`"${condition}" removed.`, 'info');
};

function renderMedicalHistoryTableContainer(mode) {
    const container = document.getElementById(`${mode}-med-details-table-container`);
    if (container) {
        container.innerHTML = renderMedicalHistoryDetailsTable(mode);
    }
}

function renderProofFileItem(file, index, mode) {
    const isImage = file.type && file.type.startsWith('image/');
    const isPDF = file.type && file.type === 'application/pdf';
    const icon = isImage ? 'fa-image' : (isPDF ? 'fa-file-pdf' : 'fa-file');
    const iconColor = isPDF ? '#ef4444' : '#7ba05b';
    
    const sizeKB = (file.size / 1024).toFixed(1);
    const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB} KB`;
    
    let thumbnailHTML = `
        <div style="width: 40px; height: 40px; border-radius: 8px; background: ${iconColor}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <i class="fas ${icon}" style="color: ${iconColor}; font-size: 18px;"></i>
        </div>
    `;
    
    if (isImage && file.data) {
        thumbnailHTML = `
            <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #d4e5c4; background: #f7fbf3;">
                <img src="${file.data}" alt="${file.name}" 
                     style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    }
    
    return `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #ffffff; border: 1px solid #d4e5c4; border-radius: 8px; transition: all 0.2s ease;">
            ${thumbnailHTML}
            <div style="flex: 1; min-width: 0;">
                <div style="color: #2d3e1f; font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${file.name}
                </div>
                <div style="color: #94a387; font-size: 10px; margin-top: 2px;">
                    ${sizeDisplay} • ${isImage ? 'Image' : (isPDF ? 'PDF' : 'File')}
                </div>
            </div>
            <button type="button" 
                    onclick="window.removeMedicalProof(${index}, '${mode}')"
                    style="background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; flex-shrink: 0;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='#ffffff';"
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444';"
                    title="Remove file">
                <i class="fas fa-times" style="font-size: 12px;"></i>
            </button>
        </div>
    `;
}

function renderMedicalHistorySummaryText(selectedList, customList, proofFiles = []) {
    const total = selectedList.length + customList.length;
    const files = proofFiles ? proofFiles.length : 0;
    
    const parts = [];
    if (total > 0) parts.push(`${total} condition${total === 1 ? '' : 's'}`);
    if (files > 0) parts.push(`${files} file${files === 1 ? '' : 's'}`);
    
    if (parts.length > 0) {
        return `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${parts.join(' • ')} selected`;
    }
    return '<i class="fas fa-info-circle"></i> No conditions or files selected (leave blank if none)';
}

function toggleMedicalHistorySelection(checkbox) {
    const mode = checkbox.dataset.medMode;
    const value = checkbox.value;
    const label = checkbox.closest('label');
    
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    
    if (checkbox.checked) {
        detailsMap[value] = '';
        label.style.borderColor = '#7ba05b';
        label.style.background = 'rgba(123, 160, 91, 0.08)';
    } else {
        if (detailsMap.hasOwnProperty(value)) {
            delete detailsMap[value];
        }
        label.style.borderColor = '#e2e8f0';
        label.style.background = '#ffffff';
    }
    
    if (mode === 'edit') medicalHistoryDetailsEdit = detailsMap;
    else medicalHistoryDetailsAdd = detailsMap;
    
    renderMedicalHistoryTableContainer(mode);
    updateMedicalHistorySummary(mode);
}

function toggleOthersMedicalHistory(checkbox) {
    const mode = checkbox.dataset.medMode;
    const container = document.getElementById(`${mode}-med-others-input-container`);
    
    if (checkbox.checked) {
        container.style.display = 'block';
        const input = document.getElementById(`${mode}-med-others-input`);
        if (input) input.focus();
    } else {
        container.style.display = 'none';
        
        const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
        const customList = mode === 'edit' ? customMedicalHistoryEdit : customMedicalHistoryAdd;
        
        customList.forEach(c => {
            if (detailsMap.hasOwnProperty(c)) {
                delete detailsMap[c];
            }
        });
        
        if (mode === 'edit') {
            customMedicalHistoryEdit = [];
            medicalHistoryDetailsEdit = detailsMap;
        } else {
            customMedicalHistoryAdd = [];
            medicalHistoryDetailsAdd = detailsMap;
        }
        
        renderCustomMedicalHistoryList(mode);
        renderMedicalHistoryTableContainer(mode);
        updateMedicalHistorySummary(mode);
    }
}

function addCustomMedicalHistory(mode) {
    const input = document.getElementById(`${mode}-med-others-input`);
    if (!input) return;
    
    const value = input.value.trim();
    if (!value) {
        showToast('Please type a medical condition.', 'error');
        return;
    }
    
    const customList = mode === 'edit' ? customMedicalHistoryEdit : customMedicalHistoryAdd;
    const isDuplicate = customList.some(c => c.toLowerCase() === value.toLowerCase());
    
    if (isDuplicate) {
        showToast('This condition is already added.', 'error');
        input.value = '';
        return;
    }
    
    const petTypeSelect = document.getElementById(mode === 'edit' ? 'editPetDetailsType' : 'addPetType');
    const petType = petTypeSelect ? petTypeSelect.value : '';
    const standardOptions = MEDICAL_HISTORY_OPTIONS[petType] || [];
    
    if (standardOptions.some(o => o.toLowerCase() === value.toLowerCase())) {
        showToast('This condition is already in the list above.', 'error');
        input.value = '';
        return;
    }
    
    if (mode === 'edit') customMedicalHistoryEdit.push(value);
    else customMedicalHistoryAdd.push(value);
    
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    detailsMap[value] = '';
    
    if (mode === 'edit') medicalHistoryDetailsEdit = detailsMap;
    else medicalHistoryDetailsAdd = detailsMap;
    
    input.value = '';
    renderCustomMedicalHistoryList(mode);
    renderMedicalHistoryTableContainer(mode);
    updateMedicalHistorySummary(mode);
    showToast(`"${value}" added.`, 'success');
}

function removeCustomMedicalHistory(mode, index) {
    const customList = mode === 'edit' ? customMedicalHistoryEdit : customMedicalHistoryAdd;
    const condition = customList[index];
    
    if (condition) {
        if (mode === 'edit') customMedicalHistoryEdit.splice(index, 1);
        else customMedicalHistoryAdd.splice(index, 1);
        
        const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
        if (detailsMap.hasOwnProperty(condition)) {
            delete detailsMap[condition];
        }
        
        if (mode === 'edit') medicalHistoryDetailsEdit = detailsMap;
        else medicalHistoryDetailsAdd = detailsMap;
    }
    
    renderCustomMedicalHistoryList(mode);
    renderMedicalHistoryTableContainer(mode);
    updateMedicalHistorySummary(mode);
}

function renderCustomMedicalHistoryList(mode) {
    const container = document.getElementById(`${mode}-custom-med-list`);
    if (!container) return;
    
    const customList = mode === 'edit' ? customMedicalHistoryEdit : customMedicalHistoryAdd;
    
    if (customList.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No custom medical history added yet.</span>';
        return;
    }
    
    container.innerHTML = customList.map((c, i) => `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 160, 91, 0.12); border: 1px solid #7ba05b; border-radius: 20px; font-size: 11px; color: #5a7a3f; font-weight: 500;">
            <i class="fas fa-notes-medical" style="font-size: 9px;"></i>
            ${c}
            <button type="button" 
                    onclick="window.removeCustomMedicalHistory('${mode}', ${i})"
                    style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0; font-size: 12px; line-height: 1; margin-left: 2px;"
                    title="Remove">
                <i class="fas fa-times-circle"></i>
            </button>
        </span>
    `).join('');
}

function updateMedicalHistorySummary(mode) {
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    const proofFiles = mode === 'edit' ? medicalProofFilesEdit : medicalProofFilesAdd;
    const summaryEl = document.getElementById(`${mode}-med-summary`);
    if (!summaryEl) return;
    
    const totalCount = Object.keys(detailsMap).length;
    const fileCount = proofFiles.length;
    
    const parts = [];
    if (totalCount > 0) parts.push(`${totalCount} condition${totalCount === 1 ? '' : 's'}`);
    if (fileCount > 0) parts.push(`${fileCount} file${fileCount === 1 ? '' : 's'}`);
    
    if (parts.length > 0) {
        summaryEl.innerHTML = `<i class="fas fa-check-circle" style="color: #7ba05b;"></i> ${parts.join(' • ')} selected`;
    } else {
        summaryEl.innerHTML = '<i class="fas fa-info-circle"></i> No conditions or files selected (leave blank if none)';
    }
}

function clearMedicalHistory(mode) {
    if (mode === 'edit') {
        medicalHistoryDetailsEdit = {};
        customMedicalHistoryEdit = [];
        medicalProofFilesEdit = [];
    } else {
        medicalHistoryDetailsAdd = {};
        customMedicalHistoryAdd = [];
        medicalProofFilesAdd = [];
    }
    
    const checkboxes = document.querySelectorAll(`input[data-med-mode="${mode}"]`);
    checkboxes.forEach(cb => {
        cb.checked = false;
        const label = cb.closest('label');
        if (label) {
            label.style.borderColor = '#e2e8f0';
            label.style.background = '#ffffff';
        }
    });
    
    const othersContainer = document.getElementById(`${mode}-med-others-input-container`);
    if (othersContainer) othersContainer.style.display = 'none';
    
    const othersInput = document.getElementById(`${mode}-med-others-input`);
    if (othersInput) othersInput.value = '';
    
    const fileInput = document.getElementById(`${mode}-med-proof-input`);
    if (fileInput) fileInput.value = '';
    
    renderCustomMedicalHistoryList(mode);
    renderMedicalHistoryTableContainer(mode);
    renderMedicalProofList(mode);
    updateMedicalHistorySummary(mode);
}

// ═══════════════════════════════════════════════════════════════════
// 🆕 MEDICAL PROOF FILE HANDLERS
// ═══════════════════════════════════════════════════════════════════

function handleMedicalProofUpload(event, mode) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const proofList = mode === 'edit' ? medicalProofFilesEdit : medicalProofFilesAdd;
    const MAX_SIZE = 5 * 1024 * 1024;
    const MAX_FILES = 5;
    
    const validFiles = [];
    let errorCount = 0;
    
    Array.from(files).forEach(file => {
        if (proofList.length + validFiles.length >= MAX_FILES) {
            if (errorCount === 0) {
                showToast(`Maximum ${MAX_FILES} files allowed.`, 'error');
                errorCount++;
            }
            return;
        }
        
        if (file.size > MAX_SIZE) {
            showToast(`"${file.name}" is too large. Max 5MB per file.`, 'error');
            errorCount++;
            return;
        }
        
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        
        if (!isImage && !isPDF) {
            showToast(`"${file.name}" is not supported. Use JPG, PNG, or PDF.`, 'error');
            errorCount++;
            return;
        }
        
        validFiles.push(file);
    });
    
    if (validFiles.length === 0) {
        event.target.value = '';
        return;
    }
    
    const readPromises = validFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve({
                    data: e.target.result,
                    name: file.name,
                    type: file.type,
                    size: file.size
                });
            };
            reader.onerror = function() {
                resolve(null);
            };
            reader.readAsDataURL(file);
        });
    });
    
    Promise.all(readPromises).then(results => {
        const validResults = results.filter(r => r !== null);
        
        validResults.forEach(fileData => {
            proofList.push(fileData);
        });
        
        if (mode === 'edit') medicalProofFilesEdit = proofList;
        else medicalProofFilesAdd = proofList;
        
        renderMedicalProofList(mode);
        updateMedicalHistorySummary(mode);
        
        if (validResults.length > 0) {
            showToast(`${validResults.length} file${validResults.length === 1 ? '' : 's'} added.`, 'success');
        }
    });
    
    event.target.value = '';
}

function renderMedicalProofList(mode) {
    const container = document.getElementById(`${mode}-med-proof-list`);
    if (!container) {
        console.warn(`⚠️ Medical proof list container not found: ${mode}-med-proof-list`);
        return;
    }
    
    const proofFiles = mode === 'edit' ? medicalProofFilesEdit : medicalProofFilesAdd;
    
    if (proofFiles.length === 0) {
        container.innerHTML = '<span style="font-size: 11px; color: #94a3b8; font-style: italic;">No files uploaded yet.</span>';
        return;
    }
    
    container.innerHTML = proofFiles.map((file, i) => renderProofFileItem(file, i, mode)).join('');
}

function removeMedicalProof(index, mode) {
    const proofList = mode === 'edit' ? medicalProofFilesEdit : medicalProofFilesAdd;
    
    if (index >= 0 && index < proofList.length) {
        const removed = proofList.splice(index, 1)[0];
        
        if (mode === 'edit') medicalProofFilesEdit = proofList;
        else medicalProofFilesAdd = proofList;
        
        renderMedicalProofList(mode);
        updateMedicalHistorySummary(mode);
        showToast(`"${removed.name}" removed.`, 'info');
    }
}

// ── Get Medical History Details as JSON String ──────────────────────
function getMedicalHistoryString(mode) {
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    const conditions = Object.keys(detailsMap);
    return conditions.join(', ');
}

// ── Get Medical History Details with Dates as JSON String ───────────
function getMedicalHistoryDetailsString(mode) {
    const detailsMap = mode === 'edit' ? medicalHistoryDetailsEdit : medicalHistoryDetailsAdd;
    
    if (Object.keys(detailsMap).length === 0) return '';
    
    try {
        return JSON.stringify(detailsMap);
    } catch (e) {
        console.error('Error serializing medical history details:', e);
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ FIXED: Parse Medical History Details from JSON String
// ═══════════════════════════════════════════════════════════════════
function parseMedicalHistoryDetails(detailsString, fallbackMedicalHistory = '') {
    if (detailsString && detailsString.trim() !== '') {
        try {
            const parsed = JSON.parse(detailsString);
            if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                return parsed;
            }
        } catch (e) {
            console.warn('Could not parse medical_history_details JSON:', e.message);
        }
    }
    
    if (fallbackMedicalHistory && fallbackMedicalHistory.trim() !== '') {
        const conditions = fallbackMedicalHistory.split(',').map(c => c.trim()).filter(c => c);
        const result = {};
        conditions.forEach(c => {
            result[c] = '';
        });
        return result;
    }
    
    return {};
}

// ── Get Medical Proof Files as JSON String ──────────────────────────
function getMedicalProofFilesString(mode) {
    const proofFiles = mode === 'edit' ? medicalProofFilesEdit : medicalProofFilesAdd;
    if (!proofFiles || proofFiles.length === 0) return '';
    
    try {
        const filesData = proofFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            data: f.data
        }));
        return JSON.stringify(filesData);
    } catch (e) {
        console.error('Error serializing proof files:', e);
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ FIXED: Parse Medical Proof Files — mas resilient sa malformed JSON
// ═══════════════════════════════════════════════════════════════════
function parseMedicalProofFiles(proofString) {
    if (!proofString || proofString.trim() === '') return [];
    
    try {
        const parsed = JSON.parse(proofString);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        console.warn('medical_proof is not an array:', typeof parsed);
        return [];
    } catch (e) {
        console.error('Error parsing proof files JSON:', e.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── LOAD MY PETS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export async function loadMyPets() {
    const email = getLoggedInEmail();
    if (!email) return;
    
    const container = document.getElementById('myPetsContainer');
    
    try {
        const data = await fetchPets(email);
        
        if (data.success && data.pets && data.pets.length > 0) {
            document.getElementById('petCount').textContent = data.pets.length;
            
            const badge = document.getElementById('petBadge');
            if (badge) {
                badge.textContent = data.pets.length;
                badge.style.display = 'inline-block';
            }
            
            let petsHTML = '<div class="pets-grid">';
            data.pets.forEach(pet => {
                let statusClass = 'healthy';
                let statusIcon = '<i class="fas fa-check-circle"></i>';
                let statusText = 'Healthy';
                
                const hasRealAllergies = pet.allergies && 
                                        pet.allergies.trim() !== '' && 
                                        pet.allergies.trim().toLowerCase() !== 'none' &&
                                        pet.allergies.trim().toLowerCase() !== 'n/a';
                
                const hasRealMedicalHistory = pet.medical_history && 
                                             pet.medical_history.trim() !== '' && 
                                             pet.medical_history.trim().toLowerCase() !== 'none' &&
                                             pet.medical_history.trim().toLowerCase() !== 'n/a';
                
                if (hasRealAllergies) {
                    statusClass = 'critical';
                    statusIcon = '<i class="fas fa-exclamation-triangle"></i>';
                    statusText = 'Has Allergies';
                } else if (hasRealMedicalHistory) {
                    statusClass = 'warning';
                    statusIcon = '<i class="fas fa-clock"></i>';
                    statusText = 'Needs Attention';
                }
                
                const allergiesDisplay = pet.allergies && pet.allergies.trim() !== '' ? pet.allergies : 'None';
                
                let medicalHistoryDisplay = 'None';
                if (pet.medical_history_details) {
                    const details = parseMedicalHistoryDetails(pet.medical_history_details, pet.medical_history);
                    const entries = Object.entries(details);
                    if (entries.length > 0) {
                        medicalHistoryDisplay = entries.map(([cond, date]) => {
                            if (date && date.trim() !== '') {
                                return `${cond} (${date})`;
                            }
                            return cond;
                        }).join(', ');
                    } else if (pet.medical_history && pet.medical_history.trim() !== '') {
                        medicalHistoryDisplay = pet.medical_history;
                    }
                } else if (pet.medical_history && pet.medical_history.trim() !== '') {
                    medicalHistoryDisplay = pet.medical_history;
                }
                
                const ageDisplay = formatPetAge(pet.age, pet.age_months);
                
                const petType = pet.pet_type || 'Dog';
                const petIconHTML = petType === 'Cat' 
                    ? '<i class="fas fa-cat"></i>' 
                    : '<i class="fas fa-dog"></i>';
                const petTypeLabel = petType === 'Cat' ? 'Cat' : 'Dog';
                
                let proofBadgeHTML = '';
                if (pet.medical_proof) {
                    const proofFiles = parseMedicalProofFiles(pet.medical_proof);
                    if (proofFiles.length > 0) {
                        proofBadgeHTML = `
                            <div style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: rgba(59, 130, 246, 0.12); color: #3b82f6; border-radius: 10px; font-size: 10px; font-weight: 700; margin-top: 6px;">
                                <i class="fas fa-file-medical"></i> ${proofFiles.length} file${proofFiles.length === 1 ? '' : 's'}
                            </div>
                        `;
                    }
                }
                
                petsHTML += `
                    <div class="pet-card">
                        <div class="pet-avatar">
                            ${pet.pet_image ? 
                                `<img src="${pet.pet_image}" alt="${pet.name}" id="petImg-${pet.id}" 
                                    style="cursor: pointer;" 
                                    onclick="event.stopPropagation(); window.openPetViewer('${pet.pet_image}', '${pet.name.replace(/'/g, "\\'")}')">` : 
                                `<span style="font-size: 60px; color: #7ba05b;">${petIconHTML}</span>`
                            }
                            <button class="edit-image-btn" onclick="event.stopPropagation(); window.showEditPetImageModal(${pet.id}, '${pet.name.replace(/'/g, "\\'")}')" title="Change pet photo">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div class="pet-name">${pet.name} <span style="color: #7ba05b;">${petIconHTML}</span></div>
                        <div class="pet-breed">${petTypeLabel} • ${pet.breed || 'Mixed Breed'} • ${ageDisplay}</div>
                        <div class="pet-info">
                            <div><span class="label"><i class="fas fa-paw"></i> Type:</span> ${petTypeLabel}</div>
                            <div><span class="label"><i class="fas fa-venus-mars"></i> Gender:</span> ${pet.gender || '—'}</div>
                            <div><span class="label"><i class="fas fa-palette"></i> Color:</span> ${pet.color || '—'}</div>
                            <div><span class="label"><i class="fas fa-weight"></i> Weight:</span> ${pet.weight || '—'} kg</div>
                            <div><span class="label"><i class="fas fa-exclamation-triangle"></i> Allergies:</span> ${allergiesDisplay}</div>
                            <div><span class="label"><i class="fas fa-notes-medical"></i> Medical History:</span> ${medicalHistoryDisplay}</div>
                            <div style="text-align: center; margin-top: 10px;">
                                <span class="pet-status ${statusClass}">${statusIcon} ${statusText}</span>
                                ${proofBadgeHTML}
                            </div>
                            <div style="text-align: center; margin-top: 10px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                                <button onclick="window.showMyPetMedicalRecords(${pet.id})" 
                                        style="background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-notes-medical"></i> Records
                                </button>
                                <button onclick="window.showEditPetDetailsModal(${pet.id})" 
                                        style="background: #38bdf8; color: #0f172a; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-pen-to-square"></i> Edit
                                </button>
                                <button onclick="window.deletePet(${pet.id})" 
                                        style="background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
            petsHTML += '</div>';
            container.innerHTML = petsHTML;
        } else {
            document.getElementById('petCount').textContent = '0';
            
            const badge = document.getElementById('petBadge');
            if (badge) badge.style.display = 'none';
            
            container.innerHTML = `
                <div class="no-pets-message">
                    <div class="icon"><i class="fas fa-dog"></i></div>
                    <h3>No Pets Registered</h3>
                    <p>You don't have any pets registered yet. Click the <strong>"Add New Pet"</strong> button above to register your furry friend!</p>
                    <div class="info-box">
                        <p><i class="fas fa-info-circle" style="color: #7ba05b;"></i> To register your pet:</p>
                        <p>1. Click the <span class="highlight">"Add New Pet"</span> button above</p>
                        <p>2. Fill in your pet's details</p>
                        <p>3. Click <span class="highlight">"Register Pet"</span> to save</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// ── Submit New Pet ─────────────────────────────────────────────────
export async function submitNewPet(e) {
    e.preventDefault();
    
    const name = document.getElementById('addPetName').value.trim();
    const pet_type = document.getElementById('addPetType').value;
    const breed = document.getElementById('addPetBreed').value.trim();
    const ageValue = document.getElementById('addPetAge').value;
    const ageUnit = document.getElementById('addPetAgeUnit').value;
    const gender = document.getElementById('addPetGender').value;
    const weight = document.getElementById('addPetWeight').value;
    const color = document.getElementById('addPetColor').value.trim();
    const allergies = getSelectedAllergiesString('add');
    const medical_history = getMedicalHistoryString('add');
    const medical_history_details = getMedicalHistoryDetailsString('add');
    const medical_proof = getMedicalProofFilesString('add');
    const imageInput = document.getElementById('addPetImageInput');
    
    if (!name) {
        showToast('Please enter your pet\'s name.', 'error');
        return;
    }
    
    if (!pet_type) {
        showToast('Please choose a pet type (Dog or Cat).', 'error');
        return;
    }
    
    const { age, age_months } = parseAgeInput(ageValue, ageUnit);
    
    const btn = document.getElementById('addPetSubmitBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    btn.disabled = true;
    
    try {
        let pet_image = '';
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            pet_image = await new Promise((resolve) => {
                reader.onload = function(e) {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(imageInput.files[0]);
            });
        }
        
        const data = await createPet({ 
            name, pet_type, breed, age, age_months, gender, weight, color, 
            allergies, medical_history, medical_history_details, medical_proof, pet_image 
        });
        
        if (data.success) {
            showToast('Pet registered successfully!', 'success');
            closeAddPetModal();
            loadMyPets();
            const petCount = document.getElementById('petCount');
            if (petCount) {
                const current = parseInt(petCount.textContent) || 0;
                petCount.textContent = current + 1;
            }
        } else {
            showToast(data.message || 'Error registering pet.', 'error');
            btn.innerHTML = '<i class="fas fa-save"></i> Register Pet';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
        btn.innerHTML = '<i class="fas fa-save"></i> Register Pet';
        btn.disabled = false;
    }
}

// ── Update Pet Details ─────────────────────────────────────────────
export async function updatePetDetails(e) {
    e.preventDefault();
    
    const petId = document.getElementById('editPetDetailsId').value;
    const name = document.getElementById('editPetDetailsName').value.trim();
    const pet_type = document.getElementById('editPetDetailsType').value;
    const breed = document.getElementById('editPetDetailsBreed').value.trim();
    const ageValue = document.getElementById('editPetDetailsAge').value;
    const ageUnit = document.getElementById('editPetDetailsAgeUnit').value;
    const gender = document.getElementById('editPetDetailsGender').value;
    const weight = document.getElementById('editPetDetailsWeight').value;
    const color = document.getElementById('editPetDetailsColor').value.trim();
    const allergies = getSelectedAllergiesString('edit');
    const medical_history = getMedicalHistoryString('edit');
    const medical_history_details = getMedicalHistoryDetailsString('edit');
    const medical_proof = getMedicalProofFilesString('edit');
    
    if (!name) {
        showToast('Please enter your pet\'s name.', 'error');
        return;
    }
    
    const { age, age_months } = parseAgeInput(ageValue, ageUnit);
    
    const btn = document.getElementById('editPetDetailsSubmitBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    btn.disabled = true;
    
    try {
        const data = await updatePet(petId, { 
            name, pet_type, breed, age, age_months, gender, weight, color, 
            allergies, medical_history, medical_history_details, medical_proof 
        });
        
        if (data.success) {
            showToast('Pet updated successfully!', 'success');
            closeEditPetDetailsModal();
            loadMyPets();
        } else {
            showToast(data.message || 'Error updating pet.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
    
    btn.innerHTML = '<i class="fas fa-save"></i> Update Pet';
    btn.disabled = false;
}

// ── Delete Pet ─────────────────────────────────────────────────────
export async function deletePet(petId) {
    if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
        return;
    }
    
    try {
        const data = await deletePetAPI(petId);
        if (data.success) {
            showToast('Pet deleted successfully!', 'success');
            loadMyPets();
            const petCount = document.getElementById('petCount');
            if (petCount) {
                const current = parseInt(petCount.textContent) || 0;
                petCount.textContent = current > 0 ? current - 1 : 0;
            }
        } else {
            showToast(data.message || 'Error deleting pet.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ── Show Add Pet Modal ─────────────────────────────────────────────
export function showAddPetModal() {
    document.getElementById('addPetModal').style.display = 'flex';
    document.getElementById('addPetForm').reset();
    const preview = document.getElementById('addPetImagePreview');
    preview.innerHTML = `
        <span style="font-size: 36px; color: #94a3b8;"><i class="fas fa-camera"></i></span>
        <span style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Tap to add photo</span>
    `;
    preview.style.border = '2px dashed #334155';
    document.getElementById('addPetSubmitBtn').disabled = false;
    document.getElementById('addPetSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Register Pet';
    
    const petTypeSelect = document.getElementById('addPetType');
    petTypeSelect.value = '';
    petTypeSelect.style.color = '#94a3b8';
    
    const ageUnitSelect = document.getElementById('addPetAgeUnit');
    if (ageUnitSelect) ageUnitSelect.value = 'years';
    
    selectedAllergiesAdd = [];
    customAllergiesAdd = [];
    renderAllergyDropdown('', 'addPetAllergiesContainer', [], false);
    
    medicalHistoryDetailsAdd = {};
    customMedicalHistoryAdd = [];
    medicalProofFilesAdd = [];
    renderMedicalHistoryDropdown('', 'addMedicalHistoryContainer', [], false);
}

export function closeAddPetModal() {
    document.getElementById('addPetModal').style.display = 'none';
}

export function previewAddPetImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large. Please upload an image under 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('addPetImagePreview');
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        preview.style.border = '2px solid #10b981';
    };
    reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════════════════════════
// ✅ SHOW EDIT PET DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════
export async function showEditPetDetailsModal(petId) {
    const email = getLoggedInEmail();
    if (!email) return;
    
    try {
        const data = await fetchPets(email);
        if (data.success) {
            const pet = data.pets.find(p => p.id === petId);
            if (pet) {
                const petType = pet.pet_type || 'Dog';
                
                document.getElementById('editPetDetailsId').value = pet.id;
                document.getElementById('editPetDetailsName').value = pet.name || '';
                
                document.getElementById('editPetDetailsTypeDisplay').value = petType;
                document.getElementById('editPetDetailsType').value = petType;
                
                document.getElementById('editPetDetailsBreed').value = pet.breed || '';
                
                const ageForm = ageToFormValue(pet.age, pet.age_months);
                document.getElementById('editPetDetailsAge').value = ageForm.value;
                const editAgeUnitSelect = document.getElementById('editPetDetailsAgeUnit');
                if (editAgeUnitSelect) editAgeUnitSelect.value = ageForm.unit;
                
                document.getElementById('editPetDetailsGender').value = pet.gender || '';
                document.getElementById('editPetDetailsWeight').value = pet.weight || '';
                document.getElementById('editPetDetailsColor').value = pet.color || '';
                document.getElementById('editPetDetailsAllergies').value = pet.allergies || '';
                
                selectedAllergiesEdit = pet.allergies 
                    ? pet.allergies.split(',').map(a => a.trim()).filter(a => a)
                    : [];
                
                customAllergiesEdit = [];
                renderAllergyDropdown(petType, 'editPetAllergiesContainer', selectedAllergiesEdit, true);
                
                medicalHistoryDetailsEdit = parseMedicalHistoryDetails(pet.medical_history_details, pet.medical_history);
                customMedicalHistoryEdit = [];
                
                medicalProofFilesEdit = pet.medical_proof 
                    ? parseMedicalProofFiles(pet.medical_proof) 
                    : [];
                
                renderMedicalHistoryDropdown(petType, 'editMedicalHistoryContainer', [], true);
                
                document.getElementById('editPetDetailsModal').style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error loading pet details:', error);
        showToast('Error loading pet details.', 'error');
    }
}

export function closeEditPetDetailsModal() {
    document.getElementById('editPetDetailsModal').style.display = 'none';
}

// ── Edit Pet Image Modal ──────────────────────────────────────────
let currentEditPetId = null;
let currentEditPetName = '';

export function showEditPetImageModal(petId, petName) {
    currentEditPetId = petId;
    currentEditPetName = petName;
    document.getElementById('editPetImageId').value = petId;
    document.getElementById('editPetNameDisplay').textContent = petName;
    document.getElementById('editPetImageModal').style.display = 'flex';
    
    document.getElementById('editPetImagePreview2').innerHTML = '<span style="color: #94a3b8; font-size: 14px; text-align: center;"><i class="fas fa-camera"></i><br>No Image</span>';
    document.getElementById('editPetImageInput').value = '';
    
    const petCards = document.querySelectorAll('.pet-card');
    for (let card of petCards) {
        const nameEl = card.querySelector('.pet-name');
        if (nameEl && nameEl.textContent.trim().startsWith(petName)) {
            const img = card.querySelector('.pet-avatar img');
            if (img) {
                document.getElementById('editPetImagePreview2').innerHTML = `<img src="${img.src}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
            break;
        }
    }
    
    document.getElementById('updatePhotoBtn').innerHTML = '<i class="fas fa-save"></i> Update Photo';
    document.getElementById('updatePhotoBtn').disabled = false;
}

export function closeEditPetImageModal() {
    document.getElementById('editPetImageModal').style.display = 'none';
}

export function previewEditPetImage2(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File is too large. Please upload an image under 5MB.', 'error');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('editPetImagePreview2');
        preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);
}

export async function submitPetImageUpdate(e) {
    e.preventDefault();
    
    const petId = document.getElementById('editPetImageId').value;
    const imageInput = document.getElementById('editPetImageInput');
    const btn = document.getElementById('updatePhotoBtn');
    
    if (!imageInput.files || !imageInput.files[0]) {
        showToast('Please select a photo to upload.', 'error');
        return;
    }
    
    if (imageInput.files[0].size > 5 * 1024 * 1024) {
        showToast('File is too large. Please upload an image under 5MB.', 'error');
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
    
    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = await updatePetImage(petId, event.target.result);
            if (data.success) {
                showToast('Pet photo updated successfully!', 'success');
                closeEditPetImageModal();
                loadMyPets();
            } else {
                showToast(data.message || 'Error updating photo.', 'error');
                btn.innerHTML = '<i class="fas fa-save"></i> Update Photo';
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Something went wrong. Please try again.', 'error');
            btn.innerHTML = '<i class="fas fa-save"></i> Update Photo';
            btn.disabled = false;
        }
    };
    reader.readAsDataURL(imageInput.files[0]);
}

export async function showPetRecommendation(petId) {
    try {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.id = 'recommendationLoadingModal';
        overlay.innerHTML = `
            <div class="modal-popup" style="max-width: 500px; text-align: center;">
                <div style="padding: 20px;">
                    <div style="font-size: 60px; margin-bottom: 20px; color: #7ba05b;"><i class="fas fa-robot"></i></div>
                    <h3 style="color: #5a7a3f; font-size: 24px; margin-bottom: 15px;">Loading AI Recommendations...</h3>
                    <p style="color: #4a5a3f; font-size: 14px; margin-bottom: 20px;">Fetching your pet's health data</p>
                    <div style="display: flex; justify-content: center; padding: 10px;">
                        <div style="width: 50px; height: 50px; border: 4px solid #d4e5c4; border-top-color: #7ba05b; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    </div>
                    <p style="color: #94a387; font-size: 12px; margin-top: 15px;">This may take a moment...</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        const cacheBuster = Date.now();
        const res = await fetch(`/api/ml/pet/${petId}/recommendation?_=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const data = await res.json();
        
        const loadingModal = document.getElementById('recommendationLoadingModal');
        if (loadingModal) loadingModal.remove();
        
        if (!data.success) {
            showToast(data.message || 'Could not load recommendations.', 'error');
            return;
        }
        
        if (!data.recommendation) {
            const noRecOverlay = document.createElement('div');
            noRecOverlay.className = 'modal-overlay';
            noRecOverlay.id = 'recommendationStatusModal';
            noRecOverlay.style.zIndex = '3000';
            noRecOverlay.innerHTML = `
                <div class="modal-popup" style="max-width: 480px; text-align: center; position: relative;">
                    <button onclick="window.closeRecommendationModal()" 
                            class="modal-close-x"
                            title="Close">✕</button>
                    
                    <div style="font-size: 64px; margin-bottom: 15px;">📋</div>
                    
                    <h3 style="color: #94a3b8; font-size: 22px; margin: 0 0 10px; font-weight: 700;">
                        No Recommendation Yet
                    </h3>
                    
                    <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        No AI recommendations have been generated for this pet yet. 
                        Please go to <strong>Smart Pet Care</strong> to request recommendations.
                    </p>
                    
                    <button onclick="window.closeRecommendationModal()" 
                            style="
                                background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                                color: white;
                                border: none;
                                padding: 12px 30px;
                                border-radius: 12px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: 0.3s;
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                font-family: 'Poppins', sans-serif;
                            ">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            `;
            document.body.appendChild(noRecOverlay);
            return;
        }
        
        const thisPetRec = data.recommendation;
        const validationStatus = thisPetRec.validation_status || 'pending';
        const vetNotes = thisPetRec.vet_notes;
        const validatedAt = thisPetRec.validated_at;
        const recommendations = thisPetRec.recommendations || [];
        
        if (validationStatus !== 'validated') {
            let statusIcon = '⏳';
            let statusColor = '#f59e0b';
            let statusBg = 'rgba(245, 158, 11, 0.08)';
            let statusBorder = 'rgba(245, 158, 11, 0.3)';
            let statusTitle = 'Waiting for Veterinarian Approval';
            let statusMessage = 'Your pet\'s AI recommendations are still being reviewed by our veterinarian. Please check back later.';
            let statusBadge = 'PENDING REVIEW';
            
            if (validationStatus === 'rejected') {
                statusIcon = '❌';
                statusColor = '#ef4444';
                statusBg = 'rgba(239, 68, 68, 0.08)';
                statusBorder = 'rgba(239, 68, 68, 0.3)';
                statusTitle = 'Recommendation Not Approved';
                statusMessage = 'Our veterinarian has reviewed the AI recommendations for this pet and did not approve them. Please consult with the clinic directly for care advice.';
                statusBadge = 'NOT APPROVED';
            }
            
            const statusOverlay = document.createElement('div');
            statusOverlay.className = 'modal-overlay';
            statusOverlay.id = 'recommendationStatusModal';
            statusOverlay.style.zIndex = '3000';
            statusOverlay.innerHTML = `
                <div class="modal-popup" style="max-width: 500px; text-align: center; position: relative;">
                    <button onclick="window.closeRecommendationModal()" 
                            class="modal-close-x"
                            title="Close">✕</button>
                    
                    <div style="font-size: 64px; margin-bottom: 15px;">${statusIcon}</div>
                    
                    <h3 style="color: ${statusColor}; font-size: 22px; margin: 0 0 10px; font-weight: 700;">
                        ${statusTitle}
                    </h3>
                    
                    <div style="
                        display: inline-block;
                        background: ${statusBg};
                        border: 1px solid ${statusBorder};
                        color: ${statusColor};
                        font-size: 10px;
                        font-weight: 700;
                        padding: 4px 12px;
                        border-radius: 12px;
                        margin-bottom: 16px;
                        letter-spacing: 0.5px;
                    ">
                        ${statusBadge}
                    </div>
                    
                    <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                        ${statusMessage}
                    </p>
                    
                    <button onclick="window.closeRecommendationModal()" 
                            style="
                                background: linear-gradient(135deg, #7ba05b, #5a7a3f);
                                color: white;
                                border: none;
                                padding: 12px 30px;
                                border-radius: 12px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: 0.3s;
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                font-family: 'Poppins', sans-serif;
                                box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3);
                            ">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            `;
            document.body.appendChild(statusOverlay);
            return;
        }
        
        let validationBadgeHTML = '';
        if (validationStatus === 'validated') {
            validationBadgeHTML = `
                <div style="
                    background: rgba(16, 185, 129, 0.08);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-left: 4px solid #10b981;
                    border-radius: 10px;
                    padding: 10px 14px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-align: left;
                ">
                    <i class="fas fa-check-circle" style="color: #10b981; font-size: 18px; flex-shrink: 0;"></i>
                    <div style="flex: 1;">
                        <div style="color: #10b981; font-weight: 700; font-size: 12px;">✓ Approved by Veterinarian</div>
                        ${validatedAt ? `<div style="color: #4a5a3f; font-size: 11px; margin-top: 2px;">Reviewed: ${validatedAt}</div>` : ''}
                    </div>
                </div>
            `;
        } else if (validationStatus === 'rejected') {
            validationBadgeHTML = `
                <div style="
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-left: 4px solid #ef4444;
                    border-radius: 10px;
                    padding: 10px 14px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-align: left;
                ">
                    <i class="fas fa-times-circle" style="color: #ef4444; font-size: 18px; flex-shrink: 0;"></i>
                    <div style="flex: 1;">
                        <div style="color: #ef4444; font-weight: 700; font-size: 12px;">Not Approved by Vet</div>
                        <div style="color: #4a5a3f; font-size: 11px; margin-top: 2px;">Please consult with the clinic directly for care advice.</div>
                    </div>
                </div>
            `;
        } else {
            validationBadgeHTML = `
                <div style="
                    background: rgba(245, 158, 11, 0.08);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-left: 4px solid #f59e0b;
                    border-radius: 10px;
                    padding: 10px 14px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-align: left;
                ">
                    <i class="fas fa-clock" style="color: #f59e0b; font-size: 18px; flex-shrink: 0;"></i>
                    <div style="flex: 1;">
                        <div style="color: #f59e0b; font-weight: 700; font-size: 12px;">Pending Vet Review</div>
                        <div style="color: #4a5a3f; font-size: 11px; margin-top: 2px;">Waiting for veterinarian approval.</div>
                    </div>
                </div>
            `;
        }
        
        let recHTML = '';
        
        if (recommendations.length === 0) {
            recHTML = `
                <div style="text-align: center; padding: 30px; background: #f7fbf3; border-radius: 12px; border: 1px solid #d4e5c4;">
                    <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-paw"></i></div>
                    <p style="color: #4a5a3f; font-size: 16px;">No specific recommendations at this time.</p>
                </div>
            `;
        } else {
            recommendations.forEach((recText, idx) => {
                let iconClass = 'fas fa-info-circle';
                let badgeLabel = 'INFO';
                let priorityColor = '#7ba05b';
                let priorityBorder = 'rgba(123, 160, 91, 0.3)';
                
                const textLower = (recText || '').toLowerCase();
                
                if (textLower.includes('allerg')) {
                    iconClass = 'fas fa-exclamation-triangle';
                    badgeLabel = 'ALLERGY';
                    priorityColor = '#ef4444';
                    priorityBorder = 'rgba(239, 68, 68, 0.3)';
                } else if (textLower.includes('vaccin')) {
                    iconClass = 'fas fa-syringe';
                    badgeLabel = 'VACCINATION';
                    priorityColor = '#f59e0b';
                    priorityBorder = 'rgba(245, 158, 11, 0.3)';
                } else if (textLower.includes('groom')) {
                    iconClass = 'fas fa-scissors';
                    badgeLabel = 'GROOMING';
                    priorityColor = '#7ba05b';
                    priorityBorder = 'rgba(123, 160, 91, 0.3)';
                } else if (textLower.includes('health') || textLower.includes('risk')) {
                    iconClass = 'fas fa-heartbeat';
                    badgeLabel = 'HEALTH';
                    priorityColor = '#10b981';
                    priorityBorder = 'rgba(16, 185, 129, 0.3)';
                } else if (textLower.includes('senior') || textLower.includes('young')) {
                    iconClass = 'fas fa-paw';
                    badgeLabel = 'AGE';
                    priorityColor = '#7ba05b';
                    priorityBorder = 'rgba(123, 160, 91, 0.3)';
                } else if (textLower.includes('daily') || textLower.includes('brush') || textLower.includes('coat')) {
                    iconClass = 'fas fa-brush';
                    badgeLabel = 'CARE';
                    priorityColor = '#7ba05b';
                    priorityBorder = 'rgba(123, 160, 91, 0.3)';
                }
                
                recHTML += `
                    <div style="background: #f7fbf3; border-radius: 12px; padding: 14px 18px; margin-bottom: 12px; border: 1px solid #d4e5c4; border-left: 4px solid ${priorityColor};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                            <span style="font-weight: 700; color: #5a7a3f; text-transform: uppercase; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                                <i class="${iconClass}" style="color: ${priorityColor};"></i>
                                ${badgeLabel}
                            </span>
                            <span style="font-size: 10px; color: ${priorityColor}; font-weight: 700; background: #ffffff; padding: 2px 10px; border-radius: 10px; border: 1px solid ${priorityBorder};">
                                #${idx + 1}
                            </span>
                        </div>
                        <p style="color: #2d3e1f; font-size: 14px; margin: 0; line-height: 1.5;">
                            ${recText}
                        </p>
                    </div>
                `;
            });
        }
        
        const healthRisk = thisPetRec.health_risk || 'Low';
        let riskIcon = '<i class="fas fa-circle" style="color: #10b981;"></i>';
        let riskLevel = healthRisk;
        let riskColor = '#10b981';
        if (healthRisk === 'High') {
            riskIcon = '<i class="fas fa-circle" style="color: #ef4444;"></i>';
            riskColor = '#ef4444';
        } else if (healthRisk === 'Medium') {
            riskIcon = '<i class="fas fa-circle" style="color: #f59e0b;"></i>';
            riskColor = '#f59e0b';
        }
        
        let vetNotesHTML = '';
        if (vetNotes && vetNotes.trim() !== '') {
            vetNotesHTML = `
                <div style="
                    background: rgba(123, 160, 91, 0.08);
                    border-left: 3px solid #7ba05b;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                    text-align: left;
                ">
                    <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-user-md"></i> Vet's Notes
                    </div>
                    <div style="color: #2d3e1f; font-size: 13px; line-height: 1.6;">
                        ${vetNotes}
                    </div>
                </div>
            `;
        }
        
        const resultOverlay = document.createElement('div');
        resultOverlay.className = 'modal-overlay';
        resultOverlay.id = 'recommendationResultModal';
        resultOverlay.style.zIndex = '3000';
        resultOverlay.innerHTML = `
            <div class="modal-popup" style="max-width: 650px; max-height: 90vh; overflow-y: auto; position: relative;">
                <button onclick="window.closeRecommendationModal()" 
                        class="modal-close-x"
                        title="Close">✕</button>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #5a7a3f; font-size: 24px; margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-robot" style="color: #7ba05b;"></i> AI Care Recommendations
                    </h3>
                    <p style="color: #4a5a3f; font-size: 13px; margin: 5px 0 0;">Personalized recommendations for ${thisPetRec.pet_name || 'your pet'}</p>
                </div>
                
                ${validationBadgeHTML}
                ${vetNotesHTML}
                
                <div style="background: #f7fbf3; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid #d4e5c4;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
                        <div>
                            <div style="color: #94a387; font-size: 11px; text-transform: uppercase;">Breed</div>
                            <div style="color: #2d3e1f; font-size: 15px; font-weight: 500;">${thisPetRec.breed || 'Unknown'}</div>
                        </div>
                        <div>
                            <div style="color: #94a387; font-size: 11px; text-transform: uppercase;">Age</div>
                            <div style="color: #2d3e1f; font-size: 15px; font-weight: 500;">${thisPetRec.age || '?'}</div>
                        </div>
                        <div>
                            <div style="color: #94a387; font-size: 11px; text-transform: uppercase;">Health Risk</div>
                            <div style="color: ${riskColor}; font-size: 15px; font-weight: 600;">${riskIcon} ${riskLevel}</div>
                        </div>
                        <div>
                            <div style="color: #94a387; font-size: 11px; text-transform: uppercase;">Vaccine Priority</div>
                            <div style="color: #5a7a3f; font-size: 15px; font-weight: 600;">${thisPetRec.vaccine_priority || 'Medium'}</div>
                        </div>
                    </div>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    ${recHTML}
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; border-top: 1px solid #eaf3e0; padding-top: 20px;">
                    <button onclick="window.closeRecommendationModal()" 
                            style="background: #e2e8f0; color: #475569; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif;"
                            onmouseover="this.style.background='#cbd5e1'"
                            onmouseout="this.style.background='#e2e8f0'">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <button onclick="window.bookFromRecommendation()" 
                            style="background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3); font-family: 'Poppins', sans-serif;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-calendar-plus"></i> Book Appointment
                    </button>
                    <button onclick="window.showMyPetMedicalRecords(${petId})" 
                            style="background: #7ba05b; color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3); font-family: 'Poppins', sans-serif;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-notes-medical"></i> View Records
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(resultOverlay);
        
    } catch (error) {
        console.error('Error getting recommendation:', error);
        const loadingModal = document.getElementById('recommendationLoadingModal');
        if (loadingModal) loadingModal.remove();
        showToast('Something went wrong. Please try again.', 'error');
    }
}

function closeRecommendationModal() {
    const modals = [
        'recommendationResultModal',
        'recommendationStatusModal',
        'recommendationLoadingModal',
        'recommendationApprovedModal'
    ];
    
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.remove();
    });
}

function bookFromRecommendation() {
    closeRecommendationModal();
    if (typeof window.showBookAppointmentModal === 'function') {
        window.showBookAppointmentModal();
    } else if (typeof showBookAppointmentModal === 'function') {
        showBookAppointmentModal();
    } else {
        showToast('Please go to Appointments tab to book.', 'info');
        if (typeof window.switchSection === 'function') {
            window.switchSection('appointments');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── CUSTOMER-FACING MEDICAL RECORDS VIEW ───────────────────────────
// ═══════════════════════════════════════════════════════════════════

async function showMyPetMedicalRecords(petId) {
    closeRecommendationModal();
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'modal-overlay';
    loadingOverlay.id = 'medicalRecordsLoadingModal';
    loadingOverlay.innerHTML = `
        <div class="modal-popup" style="max-width: 500px; text-align: center;">
            <div style="padding: 20px;">
                <div style="font-size: 60px; margin-bottom: 20px; color: #7ba05b;"><i class="fas fa-notes-medical"></i></div>
                <h3 style="color: #5a7a3f; font-size: 24px; margin-bottom: 15px;">Loading Medical Records...</h3>
                <p style="color: #4a5a3f; font-size: 14px;">Fetching your pet's health history</p>
            </div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
    
    try {
        const res = await fetch(`/api/my-pet/${petId}/medical-records`);
        const data = await res.json();
        
        const loading = document.getElementById('medicalRecordsLoadingModal');
        if (loading) loading.remove();
        
        if (!data.success) {
            showToast(data.message || 'Could not load medical records.', 'error');
            return;
        }
        
        const pet = data.pet || {};
        const records = data.records || [];
        
        // ═══════════════════════════════════════════════════════════════
        // ✅ VACCINATION COUNT — bilangin ang lahat ng vaccination-related
        // ═══════════════════════════════════════════════════════════════
        let vaccinationCount = data.vaccination_count || 0;
        
        if (vaccinationCount === 0 && records.length > 0) {
            records.forEach(rec => {
                const diag = (rec.diagnosis || '').toLowerCase();
                const treat = (rec.treatment || '').toLowerCase();
                const notes = (rec.notes || '').toLowerCase();
                
                if (diag.includes('vaccin') || treat.includes('vaccin') || notes.includes('vaccin') ||
                    diag.includes('rabies') || treat.includes('rabies') ||
                    diag.includes('distemper') || treat.includes('distemper') ||
                    diag.includes('parvo') || treat.includes('parvo') ||
                    diag.includes('5-in-1') || treat.includes('5-in-1') ||
                    diag.includes('4-in-1') || treat.includes('4-in-1') ||
                    diag.includes('felv') || treat.includes('felv')) {
                    vaccinationCount++;
                }
            });
        }
        
        // ✅ Parse medical proof files
        const proofFiles = pet.medical_proof ? parseMedicalProofFiles(pet.medical_proof) : [];
        const proofCount = proofFiles.length;
        
        // ✅ Parse medical history details
        const medDetails = parseMedicalHistoryDetails(pet.medical_history_details, pet.medical_history);
        const medEntries = Object.entries(medDetails);
        
        // ✅ Bilangin din ang vaccination-related sa medical history
        let historyVaccinationCount = 0;
        medEntries.forEach(([condition]) => {
            const condLower = (condition || '').toLowerCase().trim();
            if (condLower.includes('vaccin') || condLower.includes('vacination') || 
                condLower.includes('vacine') || condLower.includes('vacc') ||
                condLower.includes('rabies') || condLower.includes('distemper') || 
                condLower.includes('parvo') || condLower.includes('felv') || 
                condLower.includes('5-in-1') || condLower.includes('4-in-1') || 
                condLower.includes('kennel cough') || condLower.includes('deworming') ||
                condLower.includes('anti-rabies') || condLower.includes('antirabies')) {
                historyVaccinationCount++;
            }
        });
        
        const displayVaccinationCount = Math.max(vaccinationCount, historyVaccinationCount);
        
        // ✅ Bilangin ang medical records (from vet visits)
        const medicalRecordsCount = records.length;
        
        // ✅ Build Medical Proof Files HTML
        let proofFilesHTML = '';
        if (proofFiles.length > 0) {
            proofFilesHTML = `
                <div style="background: linear-gradient(135deg, #f7fbf3, #eaf3e0); border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; border: 1px solid #d4e5c4;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fas fa-file-medical" style="color: #7ba05b; font-size: 16px;"></i>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            Uploaded Medical Proof (${proofFiles.length})
                        </span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${proofFiles.map((file, i) => {
                            const isImage = file.type && file.type.startsWith('image/');
                            const isPDF = file.type && file.type === 'application/pdf';
                            const icon = isImage ? 'fa-image' : (isPDF ? 'fa-file-pdf' : 'fa-file');
                            const iconColor = isPDF ? '#ef4444' : '#7ba05b';
                            
                            let thumbnailHTML = `
                                <div style="width: 40px; height: 40px; border-radius: 8px; background: ${iconColor}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas ${icon}" style="color: ${iconColor}; font-size: 18px;"></i>
                                </div>
                            `;
                            
                            if (isImage && file.data) {
                                thumbnailHTML = `
                                    <div style="width: 48px; height: 48px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #d4e5c4; background: #ffffff;">
                                        <img src="${file.data}" alt="${file.name}" 
                                             style="width: 100%; height: 100%; object-fit: cover;"
                                             onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;width:100%;height:100%;display:flex;align-items:center;justify-content:center;&quot;><i class=&quot;fas fa-image&quot; style=&quot;color:#7ba05b;font-size:18px;&quot;></i></div>';">
                                    </div>
                                `;
                            }
                            
                            return `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #ffffff; border: 1px solid #d4e5c4; border-radius: 10px; cursor: pointer; transition: all 0.2s ease;"
                                     onclick="window.viewMedicalProofFile(${i}, ${petId})"
                                     onmouseover="this.style.borderColor='#7ba05b'; this.style.transform='translateX(4px)';"
                                     onmouseout="this.style.borderColor='#d4e5c4'; this.style.transform='translateX(0)';">
                                    ${thumbnailHTML}
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="color: #2d3e1f; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            ${file.name}
                                        </div>
                                        <div style="color: #94a387; font-size: 10px; margin-top: 2px;">
                                            ${isImage ? 'Image' : (isPDF ? 'PDF Document' : 'File')} • Click to view
                                        </div>
                                    </div>
                                    <i class="fas fa-external-link-alt" style="color: #7ba05b; font-size: 12px; flex-shrink: 0;"></i>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // ✅ Build Medical History Details Table
        let medHistoryTableHTML = '';
        if (medEntries.length > 0) {
            let rowsHTML = '';
            medEntries.forEach(([condition, date]) => {
                const hasDate = date && String(date).trim() !== '';
                rowsHTML += `
                    <tr style="border-bottom: 1px solid #eaf3e0;">
                        <td style="padding: 10px 12px; color: #2d3e1f; font-size: 13px; font-weight: 600;">
                            <i class="fas fa-notes-medical" style="color: #7ba05b; margin-right: 6px;"></i>
                            ${condition}
                        </td>
                        <td style="padding: 10px 12px; color: ${hasDate ? '#4a5a3f' : '#94a387'}; font-size: 12px; text-align: right;">
                            ${hasDate ? `<i class="fas fa-calendar-check" style="color: #7ba05b; margin-right: 4px;"></i>${date}` : '<span style="font-style: italic;">No date provided</span>'}
                        </td>
                    </tr>
                `;
            });
            
            medHistoryTableHTML = `
                <div style="background: #ffffff; border: 2px solid #7ba05b; border-radius: 12px; overflow: hidden; margin-bottom: 16px;">
                    <div style="padding: 10px 14px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-table"></i>
                        <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            Medical History Details
                        </span>
                        <span style="margin-left: auto; font-size: 10px; background: rgba(255, 255, 255, 0.25); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                            ${medEntries.length}
                        </span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f7fbf3;">
                                <th style="padding: 10px 12px; text-align: left; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Condition</th>
                                <th style="padding: 10px 12px; text-align: right; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Date / Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        let recordsHTML = '';
        
        if (records.length === 0) {
            recordsHTML = `
                <div style="text-align: center; padding: 40px 20px; background: #f7fbf3; border-radius: 12px; border: 1px dashed #d4e5c4;">
                    <div style="font-size: 48px; margin-bottom: 12px; color: #7ba05b;"><i class="fas fa-notes-medical"></i></div>
                    <h4 style="color: #2d3e1f; font-size: 16px; margin-bottom: 8px;">No Medical Records Yet</h4>
                    <p style="color: #4a5a3f; font-size: 13px; line-height: 1.6;">
                        Your pet hasn't had any medical records added by our clinic staff yet.<br>
                        Records will appear here after a vet visit.
                    </p>
                </div>
            `;
        } else {
            records.forEach(record => {
                const visitDate = record.visit_date || 'Unknown date';
                const diagnosis = record.diagnosis || 'No diagnosis';
                const treatment = record.treatment || '';
                const prescription = record.prescription || '';
                
                // ═══════════════════════════════════════════════════════════════
                // ✅ AYUSIN: I-parse ang notes para ihiwalay ang Service at Additional Notes
                // ── Kahit walang service, lalabas pa rin ang Additional Notes
                // ═══════════════════════════════════════════════════════════════
                let rawNotes = (record.notes || '').trim();
                let serviceName = '';
                let additionalNotes = '';

                // ── I-extract ang [Service: ...] tag ─────────────────────────
                const serviceMatch = rawNotes.match(/\[Service:\s*([^\]]+)\]/);
                if (serviceMatch) {
                    serviceName = serviceMatch[1].trim();
                    // Alisin ang service tag sa notes
                    additionalNotes = rawNotes.replace(/\[Service:\s*[^\]]+\]/g, '').trim();
                } else {
                    // Walang service tag — buong notes ay additional notes
                    additionalNotes = rawNotes;
                }

                // ── Linisin ang leading/trailing whitespace at stray separators
                additionalNotes = additionalNotes.replace(/^[\s|,;-]+|[\s|,;-]+$/g, '').trim();

                // ── Skip kung ang "notes" ay placeholder lang o duplicate ng ibang fields
                const notesLower = additionalNotes.toLowerCase();
                if (notesLower === '' || 
                    notesLower === 'none' || 
                    notesLower === 'n/a' || 
                    notesLower === 'null' || 
                    notesLower === 'undefined' ||
                    notesLower === '-') {
                    additionalNotes = '';
                }

                const statusColors = {
                    'active': { bg: 'rgba(123, 160, 91, 0.15)', color: '#5a7a3f', label: 'Active' },
                    'resolved': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Resolved' },
                    'ongoing': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Ongoing' },
                    'follow_up': { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', label: 'Follow-up' }
                };
                const status = statusColors[record.status] || statusColors['active'];
                
                recordsHTML += `
                    <div style="background: #f7fbf3; border-radius: 12px; padding: 16px 18px; margin-bottom: 12px; border: 1px solid #d4e5c4; border-left: 4px solid #7ba05b;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fas fa-calendar-alt" style="color: #7ba05b;"></i>
                                <span style="color: #2d3e1f; font-weight: 600; font-size: 14px;">${visitDate}</span>
                            </div>
                            <span style="background: ${status.bg}; color: ${status.color}; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 10px; text-transform: uppercase;">
                                ${status.label}
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <div style="color: #94a387; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">Diagnosis</div>
                            <div style="color: #2d3e1f; font-size: 14px; font-weight: 500;">${diagnosis}</div>
                        </div>
                        
                        ${treatment ? `
                            <div style="margin-bottom: 10px;">
                                <div style="color: #94a387; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">Treatment</div>
                                <div style="color: #4a5a3f; font-size: 13px;">${treatment}</div>
                            </div>
                        ` : ''}
                        
                        ${prescription ? `
                            <div style="background: #ffffff; border-radius: 8px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-top: 8px;">
                                <div style="color: #94a387; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">
                                    <i class="fas fa-prescription-bottle-medical" style="color: #7ba05b;"></i> Prescription
                                </div>
                                <div style="color: #2d3e1f; font-size: 13px;">${prescription}</div>
                            </div>
                        ` : ''}
                        
                        ${serviceName ? `
                            <div style="background: #ffffff; border-radius: 8px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-top: 8px;">
                                <div style="color: #94a387; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">
                                    <i class="fas fa-scissors" style="color: #7ba05b;"></i> Service
                                </div>
                                <div style="color: #2d3e1f; font-size: 13px;">${serviceName}</div>
                            </div>
                        ` : ''}
                        
                        <!-- ✅ ADDITIONAL NOTES SECTION — Laging may section (optional fallback) -->
                        ${additionalNotes ? `
                            <div style="background: #ffffff; border-radius: 8px; padding: 10px 12px; border: 1px solid #d4e5c4; margin-top: 8px;">
                                <div style="color: #94a387; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                                    <i class="fas fa-pencil-alt" style="color: #7ba05b;"></i> Additional Notes
                                </div>
                                <div style="color: #2d3e1f; font-size: 13px; line-height: 1.5; word-break: break-word; white-space: pre-wrap;">${additionalNotes}</div>
                            </div>
                        ` : ''}
                        
                        ${record.vet_email ? `
                            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eaf3e0; font-size: 11px; color: #94a387;">
                                <i class="fas fa-user-md" style="color: #7ba05b;"></i> Attending vet: ${record.vet_email}
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        
        const resultOverlay = document.createElement('div');
        resultOverlay.className = 'modal-overlay';
        resultOverlay.id = 'medicalRecordsResultModal';
        resultOverlay.style.zIndex = '3000';
        resultOverlay.innerHTML = `
            <div class="modal-popup" style="max-width: 780px; max-height: 90vh; overflow-y: auto; position: relative;">
                <button onclick="window.closeMedicalRecordsModal()" 
                        class="modal-close-x"
                        title="Close">✕</button>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #5a7a3f; font-size: 24px; margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-notes-medical" style="color: #7ba05b;"></i> Medical Records
                    </h3>
                    <p style="color: #4a5a3f; font-size: 13px; margin: 5px 0 0;">
                        <strong style="color: #2d3e1f;">${pet.name || 'Your Pet'}</strong> • ${pet.pet_type || 'Dog'} • ${pet.breed || 'Mixed Breed'}
                    </p>
                </div>
                
                <!-- ✅ 4 COLUMNS na — kasama na ang Medical Records card -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
                    <div style="background: #f7fbf3; border-radius: 12px; padding: 14px 12px; border: 1px solid #d4e5c4; text-align: center;">
                        <div style="color: #7ba05b; font-size: 24px; font-weight: 700;">${medEntries.length}</div>
                        <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px;">Medical History</div>
                    </div>
                    <div style="background: #f7fbf3; border-radius: 12px; padding: 14px 12px; border: 1px solid #d4e5c4; text-align: center;">
                        <div style="color: #7ba05b; font-size: 24px; font-weight: 700;">${displayVaccinationCount}</div>
                        <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px;">Vaccinations</div>
                    </div>
                    <div style="background: #f7fbf3; border-radius: 12px; padding: 14px 12px; border: 1px solid #d4e5c4; text-align: center;">
                        <div style="color: #7ba05b; font-size: 24px; font-weight: 700;">${proofCount}</div>
                        <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px;">Medical Proof</div>
                    </div>
                    <!-- ✅ BAGONG CARD: Medical Records -->
                    <div style="background: #f7fbf3; border-radius: 12px; padding: 14px 12px; border: 1px solid #d4e5c4; text-align: center;">
                        <div style="color: #7ba05b; font-size: 24px; font-weight: 700;">${medicalRecordsCount}</div>
                        <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.3px;">Medical Records</div>
                    </div>
                </div>
                
                <div style="background: rgba(123, 160, 91, 0.08); border: 1px solid #d4e5c4; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start;">
                    <i class="fas fa-info-circle" style="color: #7ba05b; font-size: 16px; margin-top: 2px;"></i>
                    <div style="color: #4a5a3f; font-size: 12px; line-height: 1.5;">
                        <strong style="color: #2d3e1f;">Note:</strong> These records are added by our clinic veterinarians. For questions about your pet's health, please contact the clinic directly.
                    </div>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto; padding-right: 5px;">
                    ${medHistoryTableHTML}
                    ${proofFilesHTML}
                    ${recordsHTML}
                </div>
                
                <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; border-top: 1px solid #eaf3e0; padding-top: 20px;">
                    <button onclick="window.closeMedicalRecordsModal()" 
                            style="background: #e2e8f0; color: #475569; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px;"
                            onmouseover="this.style.background='#cbd5e1'"
                            onmouseout="this.style.background='#e2e8f0'">
                        <i class="fas fa-times"></i> Close
                    </button>
                    <button onclick="window.goToMessageClinic()" 
                            style="background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: white; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(123, 160, 91, 0.3);"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        <i class="fas fa-comments"></i> Message Clinic
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(resultOverlay);
        
    } catch (error) {
        console.error('Error loading medical records:', error);
        const loading = document.getElementById('medicalRecordsLoadingModal');
        if (loading) loading.remove();
        showToast('Something went wrong. Please try again.', 'error');
    }
}

function closeMedicalRecordsModal() {
    const modal = document.getElementById('medicalRecordsResultModal');
    if (modal) modal.remove();
}

// ═══════════════════════════════════════════════════════════════════
// 🆕 VIEW MEDICAL PROOF FILE (Fullscreen)
// ═══════════════════════════════════════════════════════════════════
window.viewMedicalProofFile = async function(fileIndex, petId) {
    const email = getLoggedInEmail();
    if (!email) return;
    
    try {
        const data = await fetchPets(email);
        if (!data.success) return;
        
        const pet = data.pets.find(p => p.id === petId);
        if (!pet || !pet.medical_proof) return;
        
        const proofFiles = parseMedicalProofFiles(pet.medical_proof);
        const file = proofFiles[fileIndex];
        if (!file) return;
        
        const isImage = file.type && file.type.startsWith('image/');
        const isPDF = file.type && file.type === 'application/pdf';
        
        const viewer = document.createElement('div');
        viewer.id = 'medicalProofViewer';
        viewer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.92);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            animation: fadeIn 0.3s ease;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        let contentHTML = '';
        
        if (isImage) {
            contentHTML = `
                <img src="${file.data}" alt="${file.name}" 
                     style="max-width: 90%; max-height: 90%; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.6); object-fit: contain;">
            `;
        } else if (isPDF) {
            contentHTML = `
                <iframe src="${file.data}" 
                        style="width: 90%; height: 90%; border: none; border-radius: 12px; background: #ffffff; box-shadow: 0 20px 60px rgba(0,0,0,0.6);"
                        title="${file.name}"></iframe>
            `;
        } else {
            contentHTML = `
                <div style="background: #ffffff; padding: 40px; border-radius: 16px; text-align: center;">
                    <i class="fas fa-file" style="font-size: 64px; color: #7ba05b; margin-bottom: 16px;"></i>
                    <h3 style="color: #2d3e1f; margin-bottom: 8px;">${file.name}</h3>
                    <p style="color: #64748b;">This file type cannot be previewed.</p>
                </div>
            `;
        }
        
        viewer.innerHTML = `
            <div style="position: absolute; top: 20px; right: 30px; color: #ffffff; font-size: 40px; font-weight: 300; cursor: pointer; opacity: 0.8; z-index: 10; transition: all 0.3s ease;"
                 onmouseover="this.style.opacity='1'; this.style.transform='scale(1.2) rotate(90deg)'; this.style.color='#ef4444';"
                 onmouseout="this.style.opacity='0.8'; this.style.transform='scale(1) rotate(0deg)'; this.style.color='#ffffff';"
                 onclick="this.parentElement.remove();">×</div>
            <div style="position: absolute; top: 20px; left: 30px; color: #ffffff; font-size: 14px; font-weight: 600; opacity: 0.9; z-index: 10; background: rgba(0,0,0,0.5); padding: 8px 16px; border-radius: 20px;">
                <i class="fas fa-file-medical"></i> ${file.name}
            </div>
            ${contentHTML}
        `;
        
        viewer.addEventListener('click', function(e) {
            if (e.target === viewer) {
                viewer.remove();
            }
        });
        
        const escHandler = function(e) {
            if (e.key === 'Escape') {
                viewer.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        document.body.appendChild(viewer);
        
    } catch (error) {
        console.error('Error viewing medical proof:', error);
        showToast('Error opening file.', 'error');
    }
};

// ── Go to Messages Tab + Auto-Select Staff ────────────────────────
function goToMessageClinic() {
    closeMedicalRecordsModal();
    
    if (typeof window.switchSection === 'function') {
        window.switchSection('messages');
    }
    
    setTimeout(function() {
        if (typeof window.loadCustomerConversation === 'function') {
            window.loadCustomerConversation('staff@petlink.com');
        }
        
        setTimeout(function() {
            const staffItems = document.querySelectorAll('.staff-item');
            staffItems.forEach(item => {
                const emailEl = item.querySelector('.email');
                if (emailEl && emailEl.textContent.trim() === 'staff@petlink.com') {
                    item.click();
                }
            });
        }, 300);
    }, 500);
}

// ── Make functions globally available ──────────────────────────────
window.loadMyPets = loadMyPets;
window.showAddPetModal = showAddPetModal;
window.closeAddPetModal = closeAddPetModal;
window.submitNewPet = submitNewPet;
window.previewAddPetImage = previewAddPetImage;
window.showEditPetDetailsModal = showEditPetDetailsModal;
window.closeEditPetDetailsModal = closeEditPetDetailsModal;
window.updatePetDetails = updatePetDetails;
window.deletePet = deletePet;
window.showEditPetImageModal = showEditPetImageModal;
window.closeEditPetImageModal = closeEditPetImageModal;
window.submitPetImageUpdate = submitPetImageUpdate;
window.previewEditPetImage2 = previewEditPetImage2;

window.showPetRecommendation = showPetRecommendation;
window.closeRecommendationModal = closeRecommendationModal;
window.bookFromRecommendation = bookFromRecommendation;

window.showMyPetMedicalRecords = showMyPetMedicalRecords;
window.closeMedicalRecordsModal = closeMedicalRecordsModal;

window.toggleAllergySelection = toggleAllergySelection;
window.toggleOthersAllergy = toggleOthersAllergy;
window.addCustomAllergy = addCustomAllergy;
window.removeCustomAllergy = removeCustomAllergy;
window.clearAllergies = clearAllergies;
window.handleAddPetTypeChange = handleAddPetTypeChange;
window.handleEditPetTypeChange = handleEditPetTypeChange;

window.toggleMedicalHistorySelection = toggleMedicalHistorySelection;
window.toggleOthersMedicalHistory = toggleOthersMedicalHistory;
window.addCustomMedicalHistory = addCustomMedicalHistory;
window.removeCustomMedicalHistory = removeCustomMedicalHistory;
window.clearMedicalHistory = clearMedicalHistory;
window.updateMedicalHistoryDetail = updateMedicalHistoryDetail;
window.removeMedicalHistoryRow = removeMedicalHistoryRow;

window.handleMedicalProofUpload = handleMedicalProofUpload;
window.removeMedicalProof = removeMedicalProof;
window.renderMedicalProofList = renderMedicalProofList;
window.parseMedicalProofFiles = parseMedicalProofFiles;

window.formatPetAge = formatPetAge;
window.parseAgeInput = parseAgeInput;
window.ageToFormValue = ageToFormValue;
window.parseMedicalHistoryDetails = parseMedicalHistoryDetails;

window.goToMessageClinic = goToMessageClinic;