// ═══════════════════════════════════════════════════════════════════
// VET PANEL - COMPLETE JAVASCRIPT (UPDATED & FIXED)
// ═══════════════════════════════════════════════════════════════════

let vetCurrentCustomer = null;
let vetSocket = null;
let allRecords = [];
let mlRecommendations = [];
let currentMLRecord = null;
let currentPetFilter = null;
let allPetsCache = [];
let currentVetRecommendationId = null;
let currentVetRecommendationPetId = null;

// ═══════════════════════════════════════════════════════════════════
// ✅ DATA LISTS PARA SA DIAGNOSIS (MAY GROUPING NA)
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

const DIAGNOSIS_OPTIONS = {
    Dog: {
        "Severe / Distemper Cases": [
            'Canine Distemper',
            'Canine Parvovirus',
            'Canine Infectious Hepatitis',
            'Canine Leptospirosis',
            'Severe Canine Distemper',
            'Canine Distemper with Respiratory Complications',
            'Canine Distemper with Gastrointestinal Complications',
            'Canine Distemper with Neurological Complications',
            'Canine Distemper with Secondary Pneumonia'
        ],
        "Common Diseases & Conditions": [
            'Canine Kennel Cough', 
            'Canine Influenza', 
            'Canine Coronavirus', 
            'Canine Heartworm Disease',
            'Canine Lyme Disease', 
            'Canine Ehrlichiosis', 
            'Canine Anaplasmosis', 
            'Canine Babesiosis',
            'Canine Brucellosis', 
            'Canine Rabies', 
            'Canine Fungal Infection',
            'Canine Bacterial Infection', 
            'Canine Viral Infection', 
            'Canine Skin Allergy', 
            'Canine Food Allergy',
            'Canine Atopic Dermatitis', 
            'Canine Arthritis', 
            'Canine Hip Dysplasia', 
            'Canine Elbow Dysplasia',
            'Canine Cruciate Ligament Rupture', 
            'Canine Patellar Luxation', 
            'Canine Obesity', 
            'Canine Diabetes Mellitus',
            'Canine Cushing\'s Disease', 
            'Canine Addison\'s Disease', 
            'Canine Hypothyroidism', 
            'Canine Hyperthyroidism',
            'Canine Pancreatitis', 
            'Canine Inflammatory Bowel Disease', 
            'Canine Gastric Dilatation-Volvulus (Bloat)',
            'Canine Kidney Disease', 
            'Canine Liver Disease', 
            'Canine Heart Disease', 
            'Canine Epilepsy',
            'Canine Cognitive Dysfunction', 
            'Canine Dental Disease', 
            'Canine Periodontal Disease',
            'Canine Ear Infection', 
            'Canine Eye Infection', 
            'Canine Conjunctivitis', 
            'Canine Cataracts',
            'Canine Glaucoma', 
            'Canine Corneal Ulcer', 
            'Canine Pneumonia', 
            'Canine Bronchitis',
            'Canine Asthma', 
            'Canine Tracheal Collapse', 
            'Canine Anal Gland Infection', 
            'Canine Hot Spot',
            'Canine Mange', 
            'Canine Ringworm', 
            'Canine Flea Infestation', 
            'Canine Tick Infestation',
            'Canine Worm Infestation', 
            'Canine Coccidiosis', 
            'Canine Giardiasis'
        ]
    },
    Cat: {
        "Severe / Distemper Cases": [
            'Feline Panleukopenia',
            'Severe Feline Panleukopenia',
            'Feline Panleukopenia with Dehydration',
            'Feline Panleukopenia with Secondary Infection',
            'Feline Panleukopenia with Sepsis',
            'Feline Panleukopenia in Neonatal Kittens',
            'Feline Infectious Peritonitis (FIP)',
            'Feline Leukemia Virus (FeLV)',
            'Feline Immunodeficiency Virus (FIV)'
        ],
        "Common Diseases & Conditions": [
            'Feline Herpesvirus', 
            'Feline Calicivirus', 
            'Feline Chlamydiosis',
            'Feline Mycoplasmosis', 
            'Feline Bordetellosis', 
            'Feline Rabies', 
            'Feline Fungal Infection',
            'Feline Bacterial Infection', 
            'Feline Viral Infection', 
            'Feline Skin Allergy', 
            'Feline Food Allergy',
            'Feline Atopic Dermatitis', 
            'Feline Arthritis', 
            'Feline Hip Dysplasia', 
            'Feline Obesity',
            'Feline Diabetes Mellitus', 
            'Feline Hyperthyroidism', 
            'Feline Hypothyroidism', 
            'Feline Pancreatitis',
            'Feline Inflammatory Bowel Disease', 
            'Feline Kidney Disease', 
            'Feline Liver Disease',
            'Feline Heart Disease', 
            'Feline Hypertrophic Cardiomyopathy (HCM)', 
            'Feline Epilepsy',
            'Feline Cognitive Dysfunction', 
            'Feline Dental Disease', 
            'Feline Periodontal Disease',
            'Feline Stomatitis', 
            'Feline Ear Infection', 
            'Feline Eye Infection', 
            'Feline Conjunctivitis',
            'Feline Cataracts', 
            'Feline Glaucoma', 
            'Feline Corneal Ulcer', 
            'Feline Pneumonia',
            'Feline Bronchitis', 
            'Feline Asthma', 
            'Feline Lower Urinary Tract Disease (FLUTD)',
            'Feline Urinary Blockage', 
            'Feline Anal Gland Infection', 
            'Feline Hot Spot', 
            'Feline Mange',
            'Feline Ringworm', 
            'Feline Flea Infestation', 
            'Feline Tick Infestation', 
            'Feline Worm Infestation',
            'Feline Coccidiosis', 
            'Feline Giardiasis', 
            'Feline Toxoplasmosis'
        ]
    }
};
// ── Helper: Get Selected Values from Multi-Select ──────────────────
function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions).map(opt => opt.value);
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: CUSTOM MULTI-SELECT DROPDOWN LOGIC
// ═══════════════════════════════════════════════════════════════════

let selectedDiagnosisValues = [];
let selectedAllergiesValues = [];

function toggleDiagnosisDropdown() {
    const chk = document.getElementById('chkDiagnosis');
    const container = document.getElementById('diagnosisDropdownContainer');
    
    if (!chk || !container) return;
    
    if (chk.checked) {
        container.style.display = 'block';
        
        // ✅ BAGONG CODE: I-load ang options kung walang laman
        const diagContainer = document.getElementById('diagnosisOptionsContainer');
        if (diagContainer && diagContainer.children.length === 0) {
            const selectedPetId = document.getElementById('recordPet').value;
            
            if (selectedPetId) {
                loadDropdownOptionsForPet(selectedPetId);
            } else {
                // Walang napiling pet — i-load ang default (Dog) options
                loadDefaultDiagnosisOptions();
            }
        }
    } else {
        container.style.display = 'none';
        // I-clear ang selections kapag inuncheck
        selectedDiagnosisValues = [];
        updateCustomDropdownLabel('diagnosis');
    }
}

function toggleAllergiesDropdown() {
    const chk = document.getElementById('chkAllergies');
    const container = document.getElementById('allergiesDropdownContainer');
    
    if (!chk || !container) return;
    
    if (chk.checked) {
        container.style.display = 'block';
        
        // ✅ BAGONG CODE: I-load ang options kung walang laman
        const allergyContainer = document.getElementById('allergiesOptionsContainer');
        if (allergyContainer && allergyContainer.children.length === 0) {
            const selectedPetId = document.getElementById('recordPet').value;
            
            if (selectedPetId) {
                loadDropdownOptionsForPet(selectedPetId);
            } else {
                // Walang napiling pet — i-load ang default (Dog) options
                loadDefaultAllergyOptions();
            }
        }
    } else {
        container.style.display = 'none';
        // I-clear ang selections kapag inuncheck
        selectedAllergiesValues = [];
        updateCustomDropdownLabel('allergies');
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ NEW: I-load ang default (Dog) options kung walang napiling pet
// ═══════════════════════════════════════════════════════════════════
function loadDefaultDiagnosisOptions() {
    const container = document.getElementById('diagnosisOptionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // ✅ Notice: Pumili muna ng pet
    const notice = document.createElement('div');
    notice.style.cssText = `
        padding: 12px 14px;
        background: rgba(245, 158, 11, 0.08);
        border-bottom: 1px solid rgba(245, 158, 11, 0.3);
        color: #d97706;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 6px;
        position: sticky;
        top: 0;
        z-index: 10;
    `;
    notice.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Pumili muna ng <strong>Pet</strong> para sa tamang listahan. Ito ay default (Dog) options.</span>
    `;
    container.appendChild(notice);
    
    // ── Others input ─────────────────────────────────────────────
    const othersWrapper = document.createElement('div');
    othersWrapper.style.cssText = `
        padding: 10px 14px;
        background: #ffffff;
        border-bottom: 2px solid #eaf3e0;
        position: sticky;
        top: 45px;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    `;
    
    const othersLabel = document.createElement('div');
    othersLabel.style.cssText = `font-size: 10px; font-weight: 700; color: #5a7a3f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;`;
    othersLabel.innerHTML = `<i class="fas fa-plus-circle" style="color: #7ba05b;"></i> Others (Custom Input)`;
    othersWrapper.appendChild(othersLabel);
    
    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = `display: flex; gap: 6px;`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customDiagnosisInput';
    input.placeholder = 'Type custom diagnosis here...';
    input.style.cssText = `flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4e5c4; background: #f7fbf3; font-size: 12px; outline: none; font-family: 'Poppins', sans-serif;`;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomDiagnosis();
        }
    };
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<i class="fas fa-plus"></i>';
    btn.style.cssText = `padding: 0 14px; background: #7ba05b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s ease;`;
    btn.onclick = (e) => {
        e.stopPropagation();
        addCustomDiagnosis();
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(btn);
    othersWrapper.appendChild(inputGroup);
    container.appendChild(othersWrapper);
    
    // ── Default Dog diagnosis options ────────────────────────────
    const groups = DIAGNOSIS_OPTIONS['Dog'];
    
    Object.keys(groups).forEach(groupName => {
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 8px 14px; 
            font-size: 11px; 
            font-weight: 700; 
            color: #5a7a3f; 
            background: rgba(123, 160, 91, 0.1); 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            border-top: 1px solid #eaf3e0;
            margin-top: 4px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        if (groupName.includes('Severe') || groupName.includes('Distemper')) {
            header.style.background = 'rgba(239, 68, 68, 0.08)';
            header.style.color = '#ef4444';
            header.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${groupName}`;
        } else {
            header.innerHTML = `<i class="fas fa-check-circle"></i> ${groupName}`;
        }
        
        groups[groupName].forEach(opt => {
            const div = document.createElement('div');
            div.className = 'custom-select-option';
            div.dataset.value = opt;
            div.style.paddingLeft = '20px';
            div.innerHTML = `<span style="width: 16px; display: inline-flex; justify-content: center; color: #7ba05b;"><i class="fas fa-check" style="opacity: 0; font-size: 10px;"></i></span> ${opt}`;
            
            if (selectedDiagnosisValues.includes(opt)) {
                div.classList.add('selected');
                div.style.background = 'rgba(123, 160, 91, 0.12)';
                div.querySelector('i').style.opacity = '1';
            }
            
            div.onclick = (e) => handleCustomOptionClick(e, 'diagnosis', opt);
            container.appendChild(div);
        });
    });
}

function loadDefaultAllergyOptions() {
    const container = document.getElementById('allergiesOptionsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // ✅ Notice
    const notice = document.createElement('div');
    notice.style.cssText = `
        padding: 12px 14px;
        background: rgba(245, 158, 11, 0.08);
        border-bottom: 1px solid rgba(245, 158, 11, 0.3);
        color: #d97706;
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 6px;
        position: sticky;
        top: 0;
        z-index: 10;
    `;
    notice.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Pumili muna ng <strong>Pet</strong> para sa tamang listahan. Ito ay default (Dog) options.</span>
    `;
    container.appendChild(notice);
    
    // ── Others input ─────────────────────────────────────────────
    const othersWrapper = document.createElement('div');
    othersWrapper.style.cssText = `
        padding: 10px 14px;
        background: #ffffff;
        border-bottom: 2px solid #eaf3e0;
        position: sticky;
        top: 45px;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    `;
    
    const othersLabel = document.createElement('div');
    othersLabel.style.cssText = `font-size: 10px; font-weight: 700; color: #5a7a3f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;`;
    othersLabel.innerHTML = `<i class="fas fa-plus-circle" style="color: #7ba05b;"></i> Others (Custom Input)`;
    othersWrapper.appendChild(othersLabel);
    
    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = `display: flex; gap: 6px;`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customAllergiesInput';
    input.placeholder = 'Type custom allergy here...';
    input.style.cssText = `flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #d4e5c4; background: #f7fbf3; font-size: 12px; outline: none; font-family: 'Poppins', sans-serif;`;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomAllergy();
        }
    };
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<i class="fas fa-plus"></i>';
    btn.style.cssText = `padding: 0 14px; background: #7ba05b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; transition: all 0.2s ease;`;
    btn.onclick = (e) => {
        e.stopPropagation();
        addCustomAllergy();
    };
    
    inputGroup.appendChild(input);
    inputGroup.appendChild(btn);
    othersWrapper.appendChild(inputGroup);
    container.appendChild(othersWrapper);
    
    // ── Default Dog allergy options ──────────────────────────────
    const options = ALLERGY_OPTIONS['Dog'];
    
    options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'custom-select-option';
        div.dataset.value = opt;
        div.innerHTML = `<span style="width: 16px; display: inline-flex; justify-content: center; color: #7ba05b;"><i class="fas fa-check" style="opacity: 0; font-size: 10px;"></i></span> ${opt}`;
        
        if (selectedAllergiesValues.includes(opt)) {
            div.classList.add('selected');
            div.style.background = 'rgba(123, 160, 91, 0.12)';
            div.querySelector('i').style.opacity = '1';
        }
        
        div.onclick = (e) => handleCustomOptionClick(e, 'allergies', opt);
        container.appendChild(div);
    });
}

// ── Custom Dropdown Toggle ─────────────────────────────────────────
function toggleCustomDropdown(event, type) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById(`${type}CustomSelect`);
    if (!dropdown) return;
    dropdown.classList.toggle('open');
}

// ── Handle Option Click (Multi-select) ─────────────────────────────
function handleCustomOptionClick(event, type, value) {
    event.stopPropagation(); // Para hindi mag-close ang dropdown
    
    let selectedArray = type === 'diagnosis' ? selectedDiagnosisValues : selectedAllergiesValues;
    const index = selectedArray.indexOf(value);
    
    if (index > -1) {
        selectedArray.splice(index, 1);
    } else {
        selectedArray.push(value);
    }
    
    if (type === 'diagnosis') {
        selectedDiagnosisValues = selectedArray;
    } else {
        selectedAllergiesValues = selectedArray;
    }
    
    updateCustomDropdownLabel(type);
    
    // I-update ang UI ng options (checkmark)
    const container = document.getElementById(`${type}OptionsContainer`);
    if (container) {
        const options = container.querySelectorAll('.custom-select-option');
        options.forEach(opt => {
            const optValue = opt.dataset.value;
            const icon = opt.querySelector('i');
            
            if (selectedArray.includes(optValue)) {
                opt.classList.add('selected');
                opt.style.background = 'rgba(123, 160, 91, 0.12)';
                if (icon) icon.style.opacity = '1';
            } else {
                opt.classList.remove('selected');
                opt.style.background = 'transparent';
                if (icon) icon.style.opacity = '0';
            }
        });
    }
}

// ── Update Label (Select Diagnosis... / 3 selected) ────────────────
function updateCustomDropdownLabel(type) {
    const selectedArray = type === 'diagnosis' ? selectedDiagnosisValues : selectedAllergiesValues;
    const labelEl = document.getElementById(`${type}SelectLabel`);
    
    if (!labelEl) return;
    
    if (selectedArray.length === 0) {
        labelEl.textContent = type === 'diagnosis' ? 'Select Diagnosis...' : 'Select Allergies...';
        labelEl.style.color = '#64748b';
    } else if (selectedArray.length === 1) {
        labelEl.textContent = selectedArray[0];
        labelEl.style.color = '#2d3e1f';
    } else {
        labelEl.textContent = `${selectedArray.length} selected`;
        labelEl.style.color = '#2d3e1f';
    }
}

// ── Isara ang dropdown kapag clinick sa labas ──────────────────────
document.addEventListener('click', function(e) {
    const diagSelect = document.getElementById('diagnosisCustomSelect');
    const allergySelect = document.getElementById('allergiesCustomSelect');
    
    if (diagSelect && !diagSelect.contains(e.target)) {
        diagSelect.classList.remove('open');
    }
    if (allergySelect && !allergySelect.contains(e.target)) {
        allergySelect.classList.remove('open');
    }
});

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: LOAD DROPDOWN OPTIONS BASE SA PET TYPE (MAY GROUPING)
// ═══════════════════════════════════════════════════════════════════

function loadDropdownOptionsForPet(petId) {
    const pet = (window._allPets || allPetsCache || []).find(p => p.id === petId);
    if (!pet) return;
    
    const petType = pet.pet_type || 'Dog'; 
    
    // ═══════════════════════════════════════════════════════════════
    // ── HELPER: Gumawa ng "Others" input field ───────────────────
    // ═══════════════════════════════════════════════════════════════
    const createOthersInput = (type) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            padding: 10px 14px;
            background: #ffffff;
            border-bottom: 2px solid #eaf3e0;
            position: sticky;
            top: 0;
            z-index: 10;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        `;
        
        const label = document.createElement('div');
        label.style.cssText = `
            font-size: 10px;
            font-weight: 700;
            color: #5a7a3f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        label.innerHTML = `<i class="fas fa-plus-circle" style="color: #7ba05b;"></i> Others (Custom Input)`;
        wrapper.appendChild(label);
        
        const inputGroup = document.createElement('div');
        inputGroup.style.cssText = `display: flex; gap: 6px;`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `custom${type.charAt(0).toUpperCase() + type.slice(1)}Input`;
        input.placeholder = `Type custom ${type} here...`;
        input.style.cssText = `
            flex: 1;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #d4e5c4;
            background: #f7fbf3;
            font-size: 12px;
            outline: none;
            font-family: 'Poppins', sans-serif;
        `;
        
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = '<i class="fas fa-plus"></i>';
        btn.style.cssText = `
            padding: 0 14px;
            background: #7ba05b;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        `;
        btn.onmouseover = () => btn.style.background = '#5a7a3f';
        btn.onmouseout = () => btn.style.background = '#7ba05b';
        
        // ── Event Handler: Enter key ─────────────────────────────
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (type === 'diagnosis') addCustomDiagnosis();
                else addCustomAllergy();
            }
        };
        
        // ── Event Handler: Button Click ──────────────────────────
        btn.onclick = (e) => {
            e.stopPropagation();
            if (type === 'diagnosis') addCustomDiagnosis();
            else addCustomAllergy();
        };
        
        inputGroup.appendChild(input);
        inputGroup.appendChild(btn);
        wrapper.appendChild(inputGroup);
        
        return wrapper;
    };
    
    // ═══════════════════════════════════════════════════════════════
    // ── Load Diagnosis Options (With Groups + Others) ────────────
    // ═══════════════════════════════════════════════════════════════
    const diagnosisContainer = document.getElementById('diagnosisOptionsContainer');
    if (diagnosisContainer) {
        diagnosisContainer.innerHTML = '';
        
        // ✅ 1. ILAGAY ANG "OTHERS" INPUT SA PINAKATAAS
        diagnosisContainer.appendChild(createOthersInput('diagnosis'));
        
        const groups = DIAGNOSIS_OPTIONS[petType] || DIAGNOSIS_OPTIONS['Dog'];
        
        // 2. I-loop ang bawat category (Severe Cases, Common Diseases)
        Object.keys(groups).forEach(groupName => {
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 8px 14px; 
                font-size: 11px; 
                font-weight: 700; 
                color: #5a7a3f; 
                background: rgba(123, 160, 91, 0.1); 
                text-transform: uppercase; 
                letter-spacing: 0.5px;
                border-top: 1px solid #eaf3e0;
                margin-top: 4px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            if (groupName.includes('Severe') || groupName.includes('Distemper')) {
                header.style.background = 'rgba(239, 68, 68, 0.08)';
                header.style.color = '#ef4444';
                header.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${groupName}`;
            } else {
                header.innerHTML = `<i class="fas fa-check-circle"></i> ${groupName}`;
            }
            
            // 3. I-loop ang mga options sa loob ng category
            const options = groups[groupName];
            options.forEach(opt => {
                const div = document.createElement('div');
                div.className = 'custom-select-option';
                div.dataset.value = opt;
                div.style.paddingLeft = '20px';
                div.innerHTML = `<span style="width: 16px; display: inline-flex; justify-content: center; color: #7ba05b;"><i class="fas fa-check" style="opacity: 0; font-size: 10px;"></i></span> ${opt}`;
                
                if (selectedDiagnosisValues.includes(opt)) {
                    div.classList.add('selected');
                    div.style.background = 'rgba(123, 160, 91, 0.12)';
                    div.querySelector('i').style.opacity = '1';
                }
                
                div.onclick = (e) => handleCustomOptionClick(e, 'diagnosis', opt);
                diagnosisContainer.appendChild(div);
            });
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ── Load Allergy Options (Flat list + Others) ────────────────
    // ═══════════════════════════════════════════════════════════════
    const allergiesContainer = document.getElementById('allergiesOptionsContainer');
    if (allergiesContainer) {
        allergiesContainer.innerHTML = '';
        
        // ✅ 1. ILAGAY ANG "OTHERS" INPUT SA PINAKATAAS
        allergiesContainer.appendChild(createOthersInput('allergies'));
        
        const options = ALLERGY_OPTIONS[petType] || ALLERGY_OPTIONS['Dog'];
        
        // 2. I-loop ang mga options
        options.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'custom-select-option';
            div.dataset.value = opt;
            div.innerHTML = `<span style="width: 16px; display: inline-flex; justify-content: center; color: #7ba05b;"><i class="fas fa-check" style="opacity: 0; font-size: 10px;"></i></span> ${opt}`;
            
            if (selectedAllergiesValues.includes(opt)) {
                div.classList.add('selected');
                div.style.background = 'rgba(123, 160, 91, 0.12)';
                div.querySelector('i').style.opacity = '1';
            }
            
            div.onclick = (e) => handleCustomOptionClick(e, 'allergies', opt);
            allergiesContainer.appendChild(div);
        });
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ DAGDAG: FUNCTIONS PARA SA "OTHERS" INPUT
// ═══════════════════════════════════════════════════════════════════

function addCustomDiagnosis() {
    const input = document.getElementById('customDiagnosisInput');
    if (!input) return;
    
    const value = input.value.trim();
    if (!value) return;
    
    // Check kung duplicate
    if (selectedDiagnosisValues.includes(value)) {
        showToast('Nasa listahan na ito.', 'error');
        input.value = '';
        return;
    }
    
    // I-add sa selected values array
    selectedDiagnosisValues.push(value);
    
    // I-update ang label
    updateCustomDropdownLabel('diagnosis');
    
    // ✅ Gumawa ng bagong option element at i-insert sa baba ng input
    const container = document.getElementById('diagnosisOptionsContainer');
    if (container) {
        const div = document.createElement('div');
        div.className = 'custom-select-option selected';
        div.dataset.value = value;
        div.style.background = 'rgba(123, 160, 91, 0.12)';
        div.style.paddingLeft = '20px';
        div.innerHTML = `<span style="width: 16px; display: inline-flex; justify-content: center; color: #7ba05b;"><i class="fas fa-check" style="opacity: 1; font-size: 10px;"></i></span> ${value}`;
        
        // Click handler para ma-toggle
        div.onclick = (e) => handleCustomOptionClick(e, 'diagnosis', value);
        
        // I-append sa dulo ng container
        container.appendChild(div);
    }
    
    input.value = '';
    input.focus();
}

function addCustomAllergy() {
    const input = document.getElementById('customAllergiesInput');
    if (!input) return;
    
    const value = input.value.trim();
    if (!value) return;
    
    // Check kung duplicate
    if (selectedAllergiesValues.includes(value)) {
        showToast('Nasa listahan na ito.', 'error');
        input.value = '';
        return;
    }
    
    // I-add sa selected values array
    selectedAllergiesValues.push(value);
    
    // I-update ang label
    updateCustomDropdownLabel('allergies');
    
    // ✅ Gumawa ng bagong option element at i-insert sa baba ng input
    const container = document.getElementById('allergiesOptionsContainer');
    if (container) {
        const div = document.createElement('div');
        div.className = 'custom-select-option selected';
        div.dataset.value = value;
        div.style.background = 'rgba(123, 160, 91, 0.12)';
        div.style.paddingLeft = '20px';
        div.innerHTML = `<span style="width: 16px; display: inline-flex; justify-content: center; color: #7ba05b;"><i class="fas fa-check" style="opacity: 1; font-size: 10px;"></i></span> ${value}`;
        
        // Click handler para ma-toggle
        div.onclick = (e) => handleCustomOptionClick(e, 'allergies', value);
        
        // I-append sa dulo ng container
        container.appendChild(div);
    }
    
    input.value = '';
    input.focus();
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: RESET DROPDOWNS
// ═══════════════════════════════════════════════════════════════════

function resetDiagnosisAndAllergiesDropdowns() {
    const chkDiagnosis = document.getElementById('chkDiagnosis');
    const chkAllergies = document.getElementById('chkAllergies');
    const diagContainer = document.getElementById('diagnosisDropdownContainer');
    const allergyContainer = document.getElementById('allergiesDropdownContainer');
    
    if (chkDiagnosis) chkDiagnosis.checked = false;
    if (chkAllergies) chkAllergies.checked = false;
    if (diagContainer) diagContainer.style.display = 'none';
    if (allergyContainer) allergyContainer.style.display = 'none';
    
    selectedDiagnosisValues = [];
    selectedAllergiesValues = [];
    
    updateCustomDropdownLabel('diagnosis');
    updateCustomDropdownLabel('allergies');
}

// ═══════════════════════════════════════════════════════════════════
// ✅ NEW: showToast() FUNCTION
// ═══════════════════════════════════════════════════════════════════
function showToast(message, type = 'info') {
    const existing = document.getElementById('vetToastNotification');
    if (existing) existing.remove();
    
    const colorSchemes = {
        success: { bg: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', icon: 'fa-check-circle' },
        error:   { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ffffff', icon: 'fa-times-circle' },
        warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', icon: 'fa-exclamation-triangle' },
        info:    { bg: 'linear-gradient(135deg, #7ba05b, #5a7a3f)', color: '#ffffff', icon: 'fa-info-circle' }
    };
    
    const scheme = colorSchemes[type] || colorSchemes.info;
    
    const toast = document.createElement('div');
    toast.id = 'vetToastNotification';
    toast.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: ${scheme.bg};
        color: ${scheme.color};
        padding: 14px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        z-index: 99999;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        max-width: 90vw;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
    `;
    
    toast.innerHTML = `
        <i class="fas ${scheme.icon}" style="font-size: 16px;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100px)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 400);
    }, 3000);
}

// ── Helper: Get Today's Date String (YYYY-MM-DD) ─────────────────
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ── Helper: Get Today's Display String ────────────────────────────
function getTodayDisplayString() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return today.toLocaleDateString('en-US', options);
}

// ── Helper: Get Current Time String ───────────────────────────────
function getCurrentTimeString() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// ── Helper: Format Pet Age ────────────────────────────────────────
function formatPetAge(age, ageMonths) {
    const years = parseInt(age) || 0;
    const months = parseInt(ageMonths) || 0;
    if (years === 0 && months === 0) return 'Unknown';
    if (years === 0 && months > 0) return `${months} month${months !== 1 ? 's' : ''}`;
    if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Helper: Render Pet Avatar
// ═══════════════════════════════════════════════════════════════════
function renderPetAvatar(pet, size = 30) {
    const petType = pet && pet.pet_type ? pet.pet_type : 'Dog';
    const petImage = pet && pet.pet_image ? pet.pet_image : '';
    
    const petIcon = petType === 'Cat' ? '<i class="fas fa-cat"></i>' : '<i class="fas fa-dog"></i>';
    const iconColor = petType === 'Cat' ? '#f59e0b' : '#7ba05b';
    
    if (petImage && petImage.trim() !== '') {
        return `
            <img src="${petImage}" 
                 alt="${pet.name || 'Pet'}" 
                 style="
                     width: ${size}px; 
                     height: ${size}px; 
                     border-radius: 50%; 
                     object-fit: cover; 
                     border: 2px solid #d4e5c4; 
                     cursor: pointer;
                     flex-shrink: 0;
                 " 
                 onclick="event.stopPropagation(); openVetImageViewer('${petImage}')">
        `;
    } else {
        return `
            <span style="
                display: inline-flex; 
                align-items: center; 
                justify-content: center; 
                width: ${size}px; 
                height: ${size}px; 
                font-size: ${Math.round(size * 0.55)}px; 
                flex-shrink: 0;
                color: ${iconColor};
                background: ${petType === 'Cat' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(123, 160, 91, 0.12)'};
                border-radius: 50%;
            ">${petIcon}</span>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Helper: Render Customer Avatar
// ═══════════════════════════════════════════════════════════════════
function renderCustomerAvatar(customer, size = 35) {
    const fullname = customer && customer.fullname ? customer.fullname : '';
    const profileImage = customer && customer.profile_image ? customer.profile_image : '';
    const email = customer && customer.email ? customer.email : '';
    
    if (profileImage && profileImage.trim() !== '') {
        return `
            <img src="${profileImage}" 
                 alt="${fullname || email}" 
                 style="
                     width: ${size}px; 
                     height: ${size}px; 
                     border-radius: 50%; 
                     object-fit: cover; 
                     border: 2px solid #d4e5c4; 
                     cursor: pointer;
                     flex-shrink: 0;
                 " 
                 onclick="event.stopPropagation(); openVetImageViewer('${profileImage}')"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        `;
    }
    
    return `
        <div style="
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50%; 
            background: linear-gradient(135deg, #eaf3e0, #d4e5c4); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #5a7a3f; 
            font-size: ${Math.round(size * 0.45)}px;
            flex-shrink: 0;
            border: 2px solid #d4e5c4;
        ">
            <i class="fas fa-user"></i>
        </div>
    `;
}

// ── Tab Navigation ────────────────────────────────────────────────
function showTab(tab) {
    document.getElementById('tabDashboard').style.display = 'none';
    document.getElementById('tabPatients').style.display = 'none';
    document.getElementById('tabMedical').style.display = 'none';
    document.getElementById('tabML').style.display = 'none';
    document.getElementById('tabMessages').style.display = 'none';
    
    document.querySelectorAll('.vet-sidebar a').forEach(a => a.classList.remove('active'));
    
    if (tab === 'dashboard') {
        document.getElementById('tabDashboard').style.display = 'block';
        document.getElementById('navDashboard').classList.add('active');
        loadStats();
        loadTodayPatients();
        loadUpcomingPatients();
        loadRecentRecords();
    } else if (tab === 'patients') {
        document.getElementById('tabPatients').style.display = 'block';
        document.getElementById('navPatients').classList.add('active');
        loadAllPatients();
    } else if (tab === 'medical') {
        document.getElementById('tabMedical').style.display = 'block';
        document.getElementById('navMedical').classList.add('active');
        loadAllRecords();
    } else if (tab === 'ml') {
        document.getElementById('tabML').style.display = 'block';
        document.getElementById('navML').classList.add('active');
        loadMLRecommendations();
    } else if (tab === 'messages') {
        document.getElementById('tabMessages').style.display = 'block';
        document.getElementById('navMessages').classList.add('active');
        loadVetCustomers();
        loadVetUnreadCount();
        connectVetSocket();
        addVetMessageButtons();
    }
}

async function loadStats() {
    try {
        const petsRes = await fetch('/api/all-pets');
        const petsData = await petsRes.json();
        if (petsData.success) {
            document.getElementById('totalPets').textContent = petsData.pets.length;
        }
    } catch (error) {
        console.error('Error loading pets count:', error);
    }
    
    try {
        const recRes = await fetch('/api/medical-records');
        const recData = await recRes.json();
        if (recData.success) {
            document.getElementById('totalRecords').textContent = recData.records.length;
        }
    } catch (error) {
        console.error('Error loading records count:', error);
    }
    
    // ✅ TODAY'S PATIENTS COUNT — Gagamitin natin ang bagong endpoint
    try {
        const todayRes = await fetch('/api/vet/today-patients');
        const todayData = await todayRes.json();
        
        const todayCountEl = document.getElementById('todayPatients');
        if (todayCountEl) {
            if (todayData.success) {
                todayCountEl.textContent = todayData.appointments.length;
            } else {
                todayCountEl.textContent = '0';
            }
        }
    } catch (error) {
        console.error('Error loading today patients count:', error);
        const todayCountEl = document.getElementById('todayPatients');
        if (todayCountEl) todayCountEl.textContent = '0';
    }
    
    try {
        const mlRes = await fetch('/api/ml-recommendations');
        const mlData = await mlRes.json();
        if (mlData.success) {
            document.getElementById('pendingML').textContent = mlData.recommendations.length;
            const badge = document.getElementById('mlBadge');
            if (mlData.recommendations.length > 0) {
                badge.textContent = mlData.recommendations.length;
                badge.classList.add('show');
            } else {
                badge.classList.remove('show');
            }
        }
    } catch (error) {
        console.error('Error loading ML count:', error);
    }
    
    try {
        const unreadRes = await fetch('/api/messages/unread-count');
        const unreadData = await unreadRes.json();
        if (unreadData.success) {
            const unreadEl = document.getElementById('unreadMessages');
            if (unreadEl) unreadEl.textContent = unreadData.count;
            
            const sidebarBadge = document.getElementById('vetUnreadBadge');
            if (sidebarBadge) {
                if (unreadData.count > 0) {
                    sidebarBadge.textContent = unreadData.count;
                    sidebarBadge.classList.add('show');
                    sidebarBadge.style.display = 'inline-block';
                } else {
                    sidebarBadge.textContent = '0';
                    sidebarBadge.classList.remove('show');
                    sidebarBadge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: Load Today's Patients (Nagre-render lang ng VET Services)
// ═══════════════════════════════════════════════════════════════════
async function loadTodayPatients() {
    const tbody = document.getElementById('todayPatientsTable');
    if (!tbody) return;
    
    const dateBadge = document.getElementById('todayDateBadge');
    if (dateBadge) {
        dateBadge.textContent = getTodayDisplayString();
    }
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; color: #94a387; padding: 30px;">
                <i class="fas fa-spinner fa-spin"></i> Loading today's patients...
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch('/api/vet/today-patients');
        const data = await res.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch today\'s patients.');
        }

        const todayAppointments = data.appointments || [];
        
        // ✅ I-SAVE SA GLOBAL VARIABLE para magamit ng View details
        window._todayAppointments = todayAppointments;
        
        // Cache all pets for avatar rendering
        const petsRes = await fetch('/api/all-pets');
        const petsData = await petsRes.json();
        const allPets = (petsData.success && petsData.pets) ? petsData.pets : [];
        window._allPets = allPets;
        allPetsCache = allPets;

        if (todayAppointments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #94a387; padding: 40px;">
                        <div style="font-size: 40px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-stethoscope"></i></div>
                        <h3 style="color: #2d3e1f; margin-bottom: 6px;">No Pending Vet Appointments</h3>
                        <p style="font-size: 13px;">Walang confirmed vet appointments ngayong araw o tapos na silang lahat.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        todayAppointments.forEach(app => {
            const pet = allPets.find(p => p.id === app.pet_id);
            const petType = pet ? (pet.pet_type || 'Dog') : 'Dog';
            const typeClass = petType === 'Cat' ? 'cat' : 'dog';
            const ownerEmail = app.customer_email || (pet ? pet.owner_email : '—') || '—';
            
            // ✅ I-FILTER ANG SERVICES: VET LANG ANG IPAKITA
            let vetServicesHTML = '—';
            if (app.service_details && app.service_details.length > 0) {
                const vetOnly = app.service_details.filter(s => 
                    (s.category || '').toLowerCase().includes('vet')
                );
                
                if (vetOnly.length > 0) {
                    vetServicesHTML = vetOnly.map(svc => `
                        <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin: 2px 4px 2px 0; white-space: nowrap;">
                            <i class="fas fa-stethoscope" style="font-size: 9px;"></i> ${svc.name}
                        </span>
                    `).join('');
                }
            }
            
            const timeDisplay = formatStaffTime(app.appointment_time);
            const statusBadgeHTML = `
                <span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.3px;">
                    <i class="fas fa-check-circle"></i> Confirmed
                </span>
            `;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Time"><span class="time-badge"><i class="fas fa-clock"></i> ${timeDisplay}</span></td>
                <td data-label="Pet"><div style="display: flex; align-items: center; gap: 8px;">${renderPetAvatar(pet, 30)}<strong>${app.pet_name || 'Unknown'}</strong></div></td>
                <td data-label="Type"><span class="pet-type-badge ${typeClass}">${petType}</span></td>
                <td data-label="Owner"><span style="font-size: 12px; color: #64748b;">${ownerEmail}</span></td>
                <td data-label="Services">${vetServicesHTML}</td>
                <td data-label="Status">${statusBadgeHTML}</td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button class="btn-sm outline" onclick="showTodayPatientDetails(${app.id})"><i class="fas fa-eye"></i> View</button>
                        <button class="btn-sm success" onclick="addRecordFromToday(${app.id})"><i class="fas fa-plus"></i> Add Medical Record</button>
                        <button class="btn-sm info" onclick="showPetRecommendationFromToday(${app.pet_id})"><i class="fas fa-robot"></i> Smart Pet Care</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading today patients:', error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 30px;"><i class="fas fa-times-circle"></i> Error loading today's patients</td></tr>`;
    }
}

// ── Helper: Format Time (24hr to 12hr) ────────────────────────────
function formatStaffTime(timeStr) {
    if (!timeStr) return 'N/A';
    const [hour, minute] = timeStr.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: Load Upcoming Patients (BULLETPROOF FILTERING)
// ═══════════════════════════════════════════════════════════════════
async function loadUpcomingPatients() {
    const tbody = document.getElementById('upcomingPatientsTable');
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a387; padding: 30px;"><i class="fas fa-spinner fa-spin"></i> Loading upcoming patients...</td></tr>`;
    
    try {
        const [appointmentsRes, petsRes] = await Promise.all([
            fetch('/api/appointments/all'),
            fetch('/api/all-pets')
        ]);
        
        const appointmentsData = await appointmentsRes.json();
        const petsData = await petsRes.json();
        
        const allAppointments = (appointmentsData.success && appointmentsData.appointments) ? appointmentsData.appointments : [];
        const allPets = (petsData.success && petsData.pets) ? petsData.pets : [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const tomorrowStr = getLocalDateString(tomorrow);
        const nextWeekStr = getLocalDateString(nextWeek);
        
        const upcomingAppointments = allAppointments.filter(app => {
            if (app.status !== 'pending' && app.status !== 'confirmed') return false;
            if (app.appointment_date < tomorrowStr || app.appointment_date > nextWeekStr) return false;
            
            let isVetService = false;
            if (app.service_details && Array.isArray(app.service_details)) {
                isVetService = app.service_details.some(svc => {
                    const cat = String(svc.category || '').toLowerCase();
                    const name = String(svc.name || '').toLowerCase();
                    return cat === 'vet' || cat === 'vet_disease' || cat === 'veterinarian' ||
                           name.includes('consultation') || name.includes('checkup') || 
                           name.includes('vaccination') || name.includes('sick');
                });
            }
            if (!isVetService && app.services) {
                try {
                    const s = typeof app.services === 'string' ? JSON.parse(app.services) : app.services;
                    if (Array.isArray(s)) {
                        isVetService = s.some(name => {
                            const n = String(name).toLowerCase();
                            return n.includes('consultation') || n.includes('checkup') || 
                                   n.includes('vaccination') || n.includes('sick');
                        });
                    }
                } catch(e) {}
            }
            return isVetService;
        });
        
        upcomingAppointments.sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.appointment_time.localeCompare(b.appointment_time));
        
        if (upcomingAppointments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #94a387; padding: 40px;"><div style="font-size: 40px; margin-bottom: 10px;">📅</div><h3 style="color: #2d3e1f; margin-bottom: 6px;">No Upcoming Patients</h3><p style="font-size: 13px;">Walang naka-schedule na vet appointments sa susunod na 7 araw.</p></td></tr>`;
            return;
        }
        
        tbody.innerHTML = '';
        upcomingAppointments.forEach(app => {
            const pet = allPets.find(p => p.id === app.pet_id);
            const petType = pet ? (pet.pet_type || 'Dog') : 'Dog';
            const typeClass = petType === 'Cat' ? 'cat' : 'dog';
            const ownerEmail = app.customer_email || (pet ? pet.owner_email : '—') || '—';
            
            const dateObj = new Date(app.appointment_date + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            let vetServicesHTML = '—';
            if (app.service_details && Array.isArray(app.service_details) && app.service_details.length > 0) {
                const vetServices = app.service_details.filter(svc => String(svc.category).toLowerCase() === 'vet' || String(svc.name).toLowerCase().includes('consultation'));
                if (vetServices.length > 0) {
                    vetServicesHTML = vetServices.map(svc => `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(59, 130, 246, 0.12); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin: 2px 4px 2px 0;">${svc.name}</span>`).join('');
                }
            }
            
            const timeDisplay = formatStaffTime(app.appointment_time);
            let statusBadgeHTML = app.status === 'confirmed' ? `<span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.3px;"><i class="fas fa-check-circle"></i> Confirmed</span>` : `<span style="display: inline-flex; align-items: center; gap: 5px; padding: 5px 14px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.3px;"><i class="fas fa-clock"></i> Pending</span>`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Date"><span style="font-weight: 600; color: #2d3e1f; font-size: 12px;">${formattedDate}</span></td>
                <td data-label="Time"><span class="time-badge" style="background: rgba(245, 158, 11, 0.12); color: #d97706;"><i class="fas fa-clock"></i> ${timeDisplay}</span></td>
                <td data-label="Pet"><div style="display: flex; align-items: center; gap: 8px;">${renderPetAvatar(pet, 30)}<strong>${app.pet_name || 'Unknown'}</strong></div></td>
                <td data-label="Type"><span class="pet-type-badge ${typeClass}">${petType}</span></td>
                <td data-label="Owner"><span style="font-size: 12px; color: #64748b;">${ownerEmail}</span></td>
                <td data-label="Services">${vetServicesHTML}</td>
                <td data-label="Status">${statusBadgeHTML}</td>
                <td data-label="Actions"><div class="action-buttons"><button class="btn-sm outline" onclick="showUpcomingPatientDetails(${app.id})"><i class="fas fa-eye"></i> View</button></div></td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading upcoming patients:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 30px;"><i class="fas fa-times-circle"></i> Error loading upcoming patients</td></tr>`;
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ NEW: Show Upcoming Patient Details
// ═══════════════════════════════════════════════════════════════════
async function showUpcomingPatientDetails(appointmentId) {
    try {
        window._todayAppointments = window._upcomingAppointments || [];
        window._allPets = window._allPets || [];
        
        if (!window._allRecordsData) {
            const recordsRes = await fetch('/api/medical-records');
            const recordsData = await recordsRes.json();
            if (recordsData.success) {
                window._allRecordsData = recordsData.records || [];
            }
        }
        
        showTodayPatientDetails(appointmentId);
    } catch (error) {
        console.error('Error showing upcoming patient details:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Smart Pet Care Recommendation
// ═══════════════════════════════════════════════════════════════════
async function showPetRecommendationFromToday(petId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'vetRecommendationLoadingModal';
    overlay.style.zIndex = '3000';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 500px; text-align: center;">
            <div style="padding: 20px;">
                <div style="font-size: 60px; margin-bottom: 20px; color: #7ba05b;"><i class="fas fa-robot"></i></div>
                <h3 style="color: #5a7a3f; font-size: 24px; margin-bottom: 15px;">Loading AI Recommendations...</h3>
                <p style="color: #4a5a3f; font-size: 14px; margin-bottom: 20px;">Fetching pet's health data</p>
                <div style="display: flex; justify-content: center; padding: 10px;">
                    <div style="width: 50px; height: 50px; border: 4px solid #d4e5c4; border-top-color: #7ba05b; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    try {
        const cacheBuster = Date.now();
        
        const petsRes = await fetch('/api/all-pets');
        const petsData = await petsRes.json();
        const pet = petsData.success ? petsData.pets.find(p => p.id === petId) : null;
        
        const recRes = await fetch(`/api/ml/pet/${petId}/recommendation-vet?_=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        const recData = await recRes.json();
        
        const loadingModal = document.getElementById('vetRecommendationLoadingModal');
        if (loadingModal) loadingModal.remove();
        
        let validationBadgeHTML = '';
        let validationStatus = 'none';
        if (recData.success && recData.recommendation) {
            validationStatus = recData.recommendation.validation_status || 'pending';
        }
        
        if (validationStatus === 'validated') {
            validationBadgeHTML = `
                <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(16, 185, 129, 0.12);
                    color: #10b981;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 5px 14px;
                    border-radius: 20px;
                    border: 1px solid rgba(16, 185, 129, 0.35);
                    white-space: nowrap;
                ">
                    <i class="fas fa-check-circle"></i> Approved
                </span>
            `;
        } else if (validationStatus === 'rejected') {
            validationBadgeHTML = `
                <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(239, 68, 68, 0.12);
                    color: #ef4444;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 5px 14px;
                    border-radius: 20px;
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    white-space: nowrap;
                ">
                    <i class="fas fa-times-circle"></i> Not Approved
                </span>
            `;
        } else if (validationStatus === 'pending') {
            validationBadgeHTML = `
                <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(245, 158, 11, 0.12);
                    color: #f59e0b;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 5px 14px;
                    border-radius: 20px;
                    border: 1px solid rgba(245, 158, 11, 0.35);
                    white-space: nowrap;
                ">
                    <i class="fas fa-clock"></i> Pending
                </span>
            `;
        } else {
            validationBadgeHTML = `
                <span style="
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: rgba(148, 163, 184, 0.12);
                    color: #94a3b8;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 5px 14px;
                    border-radius: 20px;
                    border: 1px solid rgba(148, 163, 184, 0.35);
                    white-space: nowrap;
                ">
                    <i class="fas fa-info-circle"></i> No Data
                </span>
            `;
        }
        
        const resultOverlay = document.createElement('div');
        resultOverlay.className = 'modal-overlay';
        resultOverlay.id = 'vetRecommendationResultModal';
        resultOverlay.style.zIndex = '3000';
        
        if (recData.success && recData.recommendation) {
            const rec = recData.recommendation;
            const recommendationsList = rec.recommendations || [];
            const vetNotes = rec.vet_notes;
            
            currentVetRecommendationId = rec.recommendation_id;
            currentVetRecommendationPetId = petId;
            
            const validatedAt = rec.validated_at;
            const petType = rec.pet_type || 'Dog';
            const petIcon = petType === 'Cat' ? '🐈' : '🐕';
            const petImage = rec.pet_image || '';
            const petName = rec.pet_name || 'Unknown';
            const breed = rec.breed || 'Mixed Breed';
            const age = rec.age || '?';
            
            const healthRisk = rec.health_risk || 'Low';
            let riskColor = '#10b981';
            if (healthRisk === 'High') riskColor = '#ef4444';
            else if (healthRisk === 'Medium') riskColor = '#f59e0b';
            
            const vaccinePriority = rec.vaccine_priority || 'Medium';
            let vaccineColor = '#5a7a3f';
            if (vaccinePriority === 'High') vaccineColor = '#ef4444';
            else if (vaccinePriority === 'Medium') vaccineColor = '#f59e0b';
            
            let avatarHTML = '';
            if (petImage && petImage.trim() !== '') {
                avatarHTML = `
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: #f7fbf3; border: 2px solid #7ba05b; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer;" 
                         onclick="window.openVetImageViewer('${petImage}')" 
                         title="Click to view ${petName}'s photo">
                        <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                    </div>
                `;
            } else {
                avatarHTML = `
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, rgba(123, 160, 91, 0.15), rgba(90, 122, 63, 0.15)); border: 2px solid #d4e5c4; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 26px; color: #5a7a3f;">
                        ${petIcon}
                    </div>
                `;
            }
            
            let recListHTML = '';
            
            if (recommendationsList.length === 0) {
                recListHTML = `
                    <div style="text-align: center; padding: 30px; background: #f7fbf3; border-radius: 12px; border: 1px solid #d4e5c4;">
                        <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-paw"></i></div>
                        <p style="color: #4a5a3f; font-size: 16px;">No specific recommendations at this time.</p>
                    </div>
                `;
            } else {
                recommendationsList.forEach((recText) => {
                    let iconClass = 'fas fa-info-circle';
                    let iconColor = '#7ba05b';
                    
                    const textLower = (recText || '').toLowerCase();
                    
                    if (textLower.includes('allerg')) {
                        iconClass = 'fas fa-exclamation-triangle';
                        iconColor = '#ef4444';
                    } else if (textLower.includes('vaccin')) {
                        iconClass = 'fas fa-syringe';
                        iconColor = '#f59e0b';
                    } else if (textLower.includes('groom') || textLower.includes('brush') || textLower.includes('coat')) {
                        iconClass = 'fas fa-scissors';
                        iconColor = '#7ba05b';
                    } else if (textLower.includes('health') || textLower.includes('risk')) {
                        iconClass = 'fas fa-heartbeat';
                        iconColor = '#10b981';
                    } else if (textLower.includes('senior') || textLower.includes('young')) {
                        iconClass = 'fas fa-paw';
                        iconColor = '#7ba05b';
                    } else if (textLower.includes('daily') || textLower.includes('eye clean')) {
                        iconClass = 'fas fa-eye';
                        iconColor = '#7ba05b';
                    } else if (textLower.includes('check-up') || textLower.includes('checkup')) {
                        iconClass = 'fas fa-stethoscope';
                        iconColor = '#10b981';
                    } else if (textLower.includes('care') || textLower.includes('routine')) {
                        iconClass = 'fas fa-heart';
                        iconColor = '#7ba05b';
                    } else if (textLower.includes('avoid') || textLower.includes('trigger')) {
                        iconClass = 'fas fa-ban';
                        iconColor = '#ef4444';
                    }
                    
                    recListHTML += `
                        <div style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eaf3e0;">
                            <span style="
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${iconColor}15;
                                color: ${iconColor};
                                font-size: 11px;
                                flex-shrink: 0;
                                margin-top: 2px;
                            ">
                                <i class="${iconClass}"></i>
                            </span>
                            <span style="flex: 1; font-size: 13px; line-height: 1.5; color: #2d3e1f;">${recText}</span>
                        </div>
                    `;
                });
            }
            
            let vetNotesHTML = '';
            if (vetNotes && vetNotes.trim() !== '') {
                vetNotesHTML = `
                    <div style="background: rgba(123, 160, 91, 0.08); border-left: 3px solid #7ba05b; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
                        <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-user-md"></i> Vet's Notes
                        </div>
                        <div style="color: #2d3e1f; font-size: 13px; line-height: 1.6;">
                            ${vetNotes}
                        </div>
                    </div>
                `;
            }
            
            let validatedAtHTML = '';
            if (validationStatus === 'validated' && validatedAt) {
                validatedAtHTML = `
                    <div style="color: #94a387; font-size: 11px; margin-top: 12px; text-align: center;">
                        <i class="fas fa-check-circle" style="color: #10b981;"></i> Reviewed: ${validatedAt}
                    </div>
                `;
            }
            
            let predictionDateHTML = '';
            if (rec.prediction_date) {
                predictionDateHTML = `
                    <div style="color: #94a387; font-size: 10px; margin-top: 10px;">
                        <i class="fas fa-clock"></i> Generated: ${rec.prediction_date}
                    </div>
                `;
            }
            
            let validationActionsHTML = '';
            if (validationStatus === 'pending') {
                validationActionsHTML = `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px dashed #d4e5c4;">
                        <div style="margin-bottom: 14px;">
                            <label style="display: block; color: #5a7a3f; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                                <i class="fas fa-pen-fancy"></i> Veterinarian Notes
                            </label>
                            <textarea id="vetRecommendationNotes" 
                                      placeholder="Add your professional assessment and validation notes..." 
                                      rows="3"
                                      style="
                                          width: 100%;
                                          padding: 12px 16px;
                                          background: #f7fbf3;
                                          border: 1px solid #d4e5c4;
                                          border-radius: 12px;
                                          color: #2d3e1f;
                                          font-size: 13px;
                                          font-family: 'Poppins', sans-serif;
                                          resize: vertical;
                                          outline: none;
                                          transition: all 0.3s ease;
                                          box-sizing: border-box;
                                      "
                                      onfocus="this.style.borderColor='#7ba05b'; this.style.boxShadow='0 0 0 3px rgba(123, 160, 91, 0.15)'"
                                      onblur="this.style.borderColor='#d4e5c4'; this.style.boxShadow='none'"></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="window.closeVetRecommendationModal()" 
                                    style="background: #e2e8f0; color: #475569; border: none; padding: 11px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 13px;"
                                    onmouseover="this.style.background='#cbd5e1'"
                                    onmouseout="this.style.background='#e2e8f0'">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button onclick="window.rejectVetRecommendation()" 
                                    style="background: #ef4444; color: #ffffff; border: none; padding: 11px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 13px;"
                                    onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-2px)'"
                                    onmouseout="this.style.background='#ef4444'; this.style.transform='translateY(0)'">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button onclick="window.validateVetRecommendation()" 
                                    style="background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; border: none; padding: 11px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 13px; box-shadow: 0 4px 12px rgba(123, 160, 91, 0.3);"
                                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 18px rgba(123, 160, 91, 0.4)'"
                                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(123, 160, 91, 0.3)'">
                                <i class="fas fa-check"></i> Validate &amp; Finalize
                            </button>
                        </div>
                    </div>
                `;
            } else {
                validationActionsHTML = `
                    <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.closeVetRecommendationModal()" 
                                style="background: #e2e8f0; color: #475569; border: none; padding: 11px 28px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 13px;"
                                onmouseover="this.style.background='#cbd5e1'"
                                onmouseout="this.style.background='#e2e8f0'">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                `;
            }
            
            resultOverlay.innerHTML = `
                <div class="modal-popup" style="max-width: 720px; max-height: 90vh; overflow-y: auto; position: relative;">
                    <button onclick="window.closeVetRecommendationModal()" 
                            class="modal-close-x"
                            title="Close">✕</button>
                    
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #5a7a3f; font-size: 22px; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-robot" style="color: #7ba05b;"></i> Smart Pet Care
                        </h3>
                        <p style="color: #4a5a3f; font-size: 13px; margin: 5px 0 0;">AI-powered care recommendation</p>
                    </div>
                    
                    <div style="background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #d4e5c4; border-left: 4px solid ${validationStatus === 'validated' ? '#10b981' : validationStatus === 'rejected' ? '#ef4444' : '#f59e0b'};">
                        
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                            ${avatarHTML}
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 6px; color: #2d3e1f; font-size: 18px; font-weight: 700; margin-bottom: 3px;">
                                    ${petName}
                                    <span style="font-size: 13px; color: #94a387; font-weight: 400;">
                                        ${petIcon}
                                    </span>
                                </div>
                                <div style="color: #94a387; font-size: 12px;">
                                    ${petType} • ${breed}
                                </div>
                            </div>
                            ${validationBadgeHTML}
                        </div>
                        
                        <div style="background: #f7fbf3; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; border: 1px solid #eaf3e0;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                                <div style="text-align: center;">
                                    <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 3px;">Age</div>
                                    <div style="color: #2d3e1f; font-size: 15px; font-weight: 700;">${age}</div>
                                </div>
                                <div style="text-align: center; border-left: 1px solid #d4e5c4; border-right: 1px solid #d4e5c4;">
                                    <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 3px;">Risk</div>
                                    <div style="color: ${riskColor}; font-size: 15px; font-weight: 700;">${healthRisk}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="color: #94a387; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 3px;">Vaccine</div>
                                    <div style="color: ${vaccineColor}; font-size: 15px; font-weight: 700;">${vaccinePriority}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
                            ${recListHTML}
                        </div>
                        
                        ${vetNotesHTML}
                        ${validatedAtHTML}
                        ${predictionDateHTML}
                        
                    </div>
                    
                    ${validationActionsHTML}
                </div>
            `;
            
        } else {
            const petType = pet ? (pet.pet_type || 'Dog') : 'Dog';
            const petIcon = petType === 'Cat' ? '🐈' : '🐕';
            const petImage = pet ? (pet.pet_image || '') : '';
            const petName = pet ? (pet.name || 'Unknown') : 'Unknown';
            const breed = pet ? (pet.breed || 'Mixed Breed') : 'Mixed Breed';
            
            currentVetRecommendationId = null;
            currentVetRecommendationPetId = petId;
            
            let avatarHTML = '';
            if (petImage && petImage.trim() !== '') {
                avatarHTML = `
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: #f7fbf3; border: 2px solid #7ba05b; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; cursor: pointer;" 
                         onclick="window.openVetImageViewer('${petImage}')" 
                         title="Click to view ${petName}'s photo">
                        <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                    </div>
                `;
            } else {
                avatarHTML = `
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, rgba(123, 160, 91, 0.15), rgba(90, 122, 63, 0.15)); border: 2px solid #d4e5c4; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 26px; color: #5a7a3f;">
                        ${petIcon}
                    </div>
                `;
            }
            
            resultOverlay.innerHTML = `
                <div class="modal-popup" style="max-width: 720px; max-height: 90vh; overflow-y: auto; position: relative;">
                    <button onclick="window.closeVetRecommendationModal()" 
                            class="modal-close-x"
                            title="Close">✕</button>
                    
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #5a7a3f; font-size: 22px; margin: 0; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-robot" style="color: #7ba05b;"></i> Smart Pet Care
                        </h3>
                        <p style="color: #4a5a3f; font-size: 13px; margin: 5px 0 0;">AI-powered care recommendation</p>
                    </div>
                    
                    <div style="background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #d4e5c4; border-left: 4px solid #94a3b8;">
                        
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
                            ${avatarHTML}
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 6px; color: #2d3e1f; font-size: 18px; font-weight: 700; margin-bottom: 3px;">
                                    ${petName}
                                    <span style="font-size: 13px; color: #94a387; font-weight: 400;">
                                        ${petIcon}
                                    </span>
                                </div>
                                <div style="color: #94a387; font-size: 12px;">
                                    ${petType} • ${breed}
                                </div>
                            </div>
                            ${validationBadgeHTML}
                        </div>
                        
                        <div style="text-align: center; padding: 30px 20px; background: #f7fbf3; border-radius: 12px; border: 1px dashed #d4e5c4;">
                            <div style="font-size: 48px; margin-bottom: 12px; color: #94a3b8;"><i class="fas fa-clipboard-list"></i></div>
                            <h4 style="color: #2d3e1f; font-size: 16px; margin-bottom: 8px;">No Recommendation Yet</h4>
                            <p style="color: #4a5a3f; font-size: 13px; line-height: 1.6; max-width: 400px; margin: 0 auto;">
                                No AI recommendations have been generated for this pet yet. 
                                The customer needs to request recommendations first in their Smart Pet Care section.
                            </p>
                        </div>
                        
                    </div>
                    
                    <div style="margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.closeVetRecommendationModal()" 
                                style="background: #e2e8f0; color: #475569; border: none; padding: 11px 28px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 6px; font-family: 'Poppins', sans-serif; font-size: 13px;"
                                onmouseover="this.style.background='#cbd5e1'"
                                onmouseout="this.style.background='#e2e8f0'">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(resultOverlay);
        
    } catch (error) {
        console.error('Error getting recommendation:', error);
        const loadingModal = document.getElementById('vetRecommendationLoadingModal');
        if (loadingModal) loadingModal.remove();
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Close Smart Pet Care Modal
// ═══════════════════════════════════════════════════════════════════
function closeVetRecommendationModal() {
    const modals = [
        'vetRecommendationResultModal',
        'vetRecommendationStatusModal',
        'vetRecommendationLoadingModal'
    ];
    
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.remove();
    });
    
    currentVetRecommendationId = null;
    currentVetRecommendationPetId = null;
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Validate from Smart Pet Care Modal
// ═══════════════════════════════════════════════════════════════════
function validateVetRecommendation() {
    const recId = currentVetRecommendationId;
    const notesInput = document.getElementById('vetRecommendationNotes');
    const vetNotes = notesInput ? notesInput.value.trim() : '';
    
    if (!recId) {
        showToast('No recommendation to validate.', 'error');
        return;
    }
    
    showVetSmartCareConfirmModal(recId, 'validated', vetNotes);
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Reject from Smart Pet Care Modal
// ═══════════════════════════════════════════════════════════════════
function rejectVetRecommendation() {
    const recId = currentVetRecommendationId;
    const notesInput = document.getElementById('vetRecommendationNotes');
    const vetNotes = notesInput ? notesInput.value.trim() : '';
    
    if (!recId) {
        showToast('No recommendation to reject.', 'error');
        return;
    }
    
    showVetSmartCareConfirmModal(recId, 'rejected', vetNotes);
}

// ═══════════════════════════════════════════════════════════════════
// ✅ Custom Confirmation Modal for Smart Pet Care actions
// ═══════════════════════════════════════════════════════════════════
function showVetSmartCareConfirmModal(recId, status, vetNotes) {
    const isValidate = status === 'validated';
    const actionColor = isValidate ? '#10b981' : '#ef4444';
    const actionIcon = isValidate ? 'fa-check-circle' : 'fa-times-circle';
    const actionTitle = isValidate ? 'Validate Recommendation?' : 'Reject Recommendation?';
    const actionMessage = isValidate 
        ? 'Sigurado ka bang gusto mong i-validate ang AI recommendation na ito? Ang customer ay makikita na ito bilang <strong>Approved</strong>.' 
        : 'Sigurado ka bang gusto mong i-reject ang AI recommendation na ito? Ang customer ay makikita ito bilang <strong>Not Approved</strong>.';
    const actionButtonText = isValidate ? 'Yes, Validate' : 'Yes, Reject';
    const actionButtonBg = isValidate 
        ? 'linear-gradient(135deg, #10b981, #059669)' 
        : 'linear-gradient(135deg, #ef4444, #dc2626)';
    const actionButtonShadow = isValidate 
        ? '0 4px 15px rgba(16, 185, 129, 0.35)' 
        : '0 4px 15px rgba(239, 68, 68, 0.35)';
    
    let petName = 'this pet';
    let petType = 'Dog';
    let petImage = '';
    
    if (currentVetRecommendationPetId) {
        const pet = (window._allPets || allPetsCache || []).find(p => p.id === currentVetRecommendationPetId);
        if (pet) {
            petName = pet.name || 'this pet';
            petType = pet.pet_type || 'Dog';
            petImage = pet.pet_image || '';
        }
    }
    
    const petIcon = petType.toLowerCase() === 'cat' ? 'fa-cat' : 'fa-dog';
    
    let avatarHTML = '';
    if (petImage) {
        avatarHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #f7fbf3; border: 3px solid ${actionColor}; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    } else {
        avatarHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: ${isValidate ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 3px solid ${actionColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 26px; color: ${actionColor};">
                <i class="fas ${petIcon}"></i>
            </div>
        `;
    }
    
    const existingModal = document.getElementById('vetSmartCareConfirmModal');
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'vetSmartCareConfirmModal';
    overlay.style.zIndex = '4500';
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 460px; text-align: center; position: relative;">
            
            <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 24px;
                background: ${isValidate ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
                color: ${actionColor};
                font-size: 36px;
                margin-bottom: 16px;
            ">
                <i class="fas ${actionIcon}"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 22px; margin: 0 0 10px 0; font-weight: 700;">
                ${actionTitle}
            </h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                ${actionMessage}
            </p>
            
            <div style="
                background: linear-gradient(135deg, #f7fbf3, #eaf3e0);
                border-radius: 14px;
                padding: 16px 18px;
                border: 1px solid #d4e5c4;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
            ">
                ${avatarHTML}
                <div style="flex: 1; min-width: 0;">
                    <div style="color: #2d3e1f; font-size: 15px; font-weight: 700; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${petName}
                    </div>
                    <div style="color: ${actionColor}; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        <i class="fas ${petIcon}"></i> ${petType}
                    </div>
                </div>
            </div>
            
            ${vetNotes ? `
                <div style="
                    background: rgba(123, 160, 91, 0.08);
                    border-left: 3px solid #7ba05b;
                    border-radius: 10px;
                    padding: 10px 14px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <div style="color: #5a7a3f; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        <i class="fas fa-user-md"></i> Your Notes
                    </div>
                    <div style="color: #2d3e1f; font-size: 12px; line-height: 1.5; word-break: break-word;">
                        ${vetNotes}
                    </div>
                </div>
            ` : ''}
            
            <div class="modal-buttons" style="justify-content: center; gap: 10px;">
                <button type="button" 
                        onclick="window.closeVetSmartCareConfirmModal()"
                        class="modal-btn modal-btn-cancel"
                        style="
                            flex: 1;
                            background: #e2e8f0;
                            color: #475569;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            transition: all 0.25s ease;
                        "
                        onmouseover="this.style.background='#cbd5e1'; this.style.transform='translateY(-1px)'"
                        onmouseout="this.style.background='#e2e8f0'; this.style.transform='translateY(0)'">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" 
                        onclick="window.executeVetSmartCareAction(${recId}, '${status}')"
                        class="modal-btn modal-btn-submit"
                        style="
                            flex: 1;
                            background: ${actionButtonBg};
                            color: #ffffff;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: ${actionButtonShadow};
                            transition: all 0.25s ease;
                        "
                        onmouseover="this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.transform='translateY(0)'">
                    <i class="fas ${actionIcon}"></i> ${actionButtonText}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeVetSmartCareConfirmModal();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeVetSmartCareConfirmModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeVetSmartCareConfirmModal() {
    const modal = document.getElementById('vetSmartCareConfirmModal');
    if (modal) modal.remove();
}

async function executeVetSmartCareAction(recId, status) {
    console.log('✅ executeVetSmartCareAction called');
    console.log('   recId:', recId);
    console.log('   status:', status);
    
    closeVetSmartCareConfirmModal();
    
    const notesInput = document.getElementById('vetRecommendationNotes');
    const vetNotes = notesInput ? notesInput.value.trim() : '';
    
    showToast('<i class="fas fa-spinner fa-spin"></i> Processing...', 'info');
    
    try {
        const res = await fetch(`/api/ml-recommendations/${recId}/validate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: status, 
                vet_notes: vetNotes 
            })
        });
        const data = await res.json();
        
        console.log('📡 Response:', data);
        
        if (data.success) {
            const actionWord = status === 'validated' ? 'validated' : 'rejected';
            const toastIcon = status === 'validated' ? 'fa-check-circle' : 'fa-times-circle';
            const toastType = status === 'validated' ? 'success' : 'error';
            
            showToast(`<i class="fas ${toastIcon}"></i> Recommendation ${actionWord}!`, toastType);
            
            closeVetRecommendationModal();
            
            loadTodayPatients();
            loadUpcomingPatients();
            loadStats();
        } else {
            showToast(data.message || 'Error processing recommendation.', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ UPDATED: TODAY'S PATIENT DETAILS MODAL
//    ✅ May profile picture ng pet (kung meron) o dog/cat icon
//    ✅ May allergies, breed, weight, gender, color
//    ✅ May medical history
// ═══════════════════════════════════════════════════════════════════
function showTodayPatientDetails(appointmentId) {
    // ✅ Gamitin ang naka-save na data sa window._todayAppointments
    const allAppointments = window._todayAppointments || [];
    const allPets = window._allPets || [];
    const allRecordsData = window._allRecordsData || [];
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        // Fallback kung sakaling hindi nahanap (halimbawa, galing sa Upcoming Patients)
        // Mag-fetch ng data mula sa server
        fetch('/api/vet/today-patients')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.appointments) {
                    window._todayAppointments = data.appointments;
                    showTodayPatientDetails(appointmentId); // I-retry
                } else {
                    showToast('Appointment not found.', 'error');
                }
            })
            .catch(() => showToast('Error loading appointment details.', 'error'));
        return;
    }
    
    const pet = allPets.find(p => p.id === app.pet_id);
    const petType = pet ? (pet.pet_type || 'Dog') : 'Dog';
    const isCat = petType.toLowerCase() === 'cat';
    const petIcon = isCat ? '🐈' : '🐕';
    const ownerEmail = app.customer_email || (pet ? pet.owner_email : '—') || '—';
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ PET PROFILE PICTURE (kung meron) o dog/cat icon
    // ═══════════════════════════════════════════════════════════════
    const petImage = pet ? (pet.pet_image || '') : '';
    const petName = app.pet_name || (pet ? pet.name : 'Unknown');
    const safePetName = petName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    let petAvatarHTML = '';
    if (petImage && petImage.trim() !== '') {
        // ✅ May profile picture → clickable para sa fullscreen
        petAvatarHTML = `
            <div style="
                width: 72px;
                height: 72px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
                border: 3px solid #7ba05b;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(123, 160, 91, 0.25);
            "
            onclick="window.openVetImageViewer('${petImage.replace(/'/g, "\\'")}')"
            onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 18px rgba(123, 160, 91, 0.4)';"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(123, 160, 91, 0.25)';"
            title="Click to view ${safePetName}'s photo">
                <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
            </div>
        `;
    } else {
        // ✅ Walang profile picture → dog/cat icon
        petAvatarHTML = `
            <div style="
                width: 72px;
                height: 72px;
                border-radius: 50%;
                flex-shrink: 0;
                background: ${isCat ? 'rgba(245, 158, 11, 0.15)' : 'rgba(123, 160, 91, 0.15)'};
                border: 3px solid ${isCat ? '#f59e0b' : '#7ba05b'};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                line-height: 1;
            ">
                ${petIcon}
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ PET BASIC INFO (Breed, Age, Gender, Weight, Color)
    // ═══════════════════════════════════════════════════════════════
    const breed = pet ? (pet.breed || 'Mixed Breed') : 'Mixed Breed';
    const ageYears = pet ? (parseInt(pet.age) || 0) : 0;
    const ageMonths = pet ? (parseInt(pet.age_months) || 0) : 0;
    const gender = pet ? (pet.gender || '—') : '—';
    const weight = pet ? (pet.weight ? pet.weight + ' kg' : '—') : '—';
    const color = pet ? (pet.color || '—') : '—';
    
    let ageDisplay = '';
    if (ageYears > 0 && ageMonths > 0) {
        ageDisplay = `${ageYears} year${ageYears !== 1 ? 's' : ''}, ${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    } else if (ageYears > 0) {
        ageDisplay = `${ageYears} year${ageYears !== 1 ? 's' : ''}`;
    } else if (ageMonths > 0) {
        ageDisplay = `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    } else {
        ageDisplay = 'Unknown';
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ ALLERGIES (with warning styling kung meron)
    // ═══════════════════════════════════════════════════════════════
    const allergies = pet ? (pet.allergies || '') : '';
    const hasRealAllergies = allergies && 
                             allergies.trim() !== '' && 
                             allergies.trim().toLowerCase() !== 'none' &&
                             allergies.trim().toLowerCase() !== 'n/a';
    
    let allergiesHTML = '';
    if (hasRealAllergies) {
        allergiesHTML = `
            <div style="
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px 14px;
                background: rgba(239, 68, 68, 0.06);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-left: 4px solid #ef4444;
                border-radius: 10px;
            ">
                <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
                <div style="flex: 1;">
                    <div style="color: #991b1b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        ⚠️ Allergies
                    </div>
                    <div style="color: #7f1d1d; font-size: 13px; line-height: 1.5; font-weight: 500; word-break: break-word;">
                        ${allergies}
                    </div>
                </div>
            </div>
        `;
    } else {
        allergiesHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                background: rgba(123, 160, 91, 0.06);
                border: 1px solid rgba(123, 160, 91, 0.25);
                border-radius: 10px;
            ">
                <i class="fas fa-check-circle" style="color: #7ba05b; font-size: 14px;"></i>
                <span style="color: #5a7a3f; font-size: 12px; font-weight: 500;">
                    No known allergies
                </span>
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ MEDICAL HISTORY (with warning styling kung meron)
    // ═══════════════════════════════════════════════════════════════
    const medicalHistory = pet ? (pet.medical_history || '') : '';
    const hasRealMedicalHistory = medicalHistory && 
                                 medicalHistory.trim() !== '' && 
                                 medicalHistory.trim().toLowerCase() !== 'none' &&
                                 medicalHistory.trim().toLowerCase() !== 'n/a';
    
    let medicalHistoryHTML = '';
    if (hasRealMedicalHistory) {
        medicalHistoryHTML = `
            <div style="
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 12px 14px;
                background: rgba(245, 158, 11, 0.06);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-left: 4px solid #f59e0b;
                border-radius: 10px;
            ">
                <i class="fas fa-notes-medical" style="color: #f59e0b; font-size: 16px; margin-top: 2px; flex-shrink: 0;"></i>
                <div style="flex: 1;">
                    <div style="color: #92400e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        Medical History
                    </div>
                    <div style="color: #78350f; font-size: 13px; line-height: 1.5; font-weight: 500; word-break: break-word;">
                        ${medicalHistory}
                    </div>
                </div>
            </div>
        `;
    } else {
        medicalHistoryHTML = `
            <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                background: rgba(123, 160, 91, 0.06);
                border: 1px solid rgba(123, 160, 91, 0.25);
                border-radius: 10px;
            ">
                <i class="fas fa-check-circle" style="color: #7ba05b; font-size: 14px;"></i>
                <span style="color: #5a7a3f; font-size: 12px; font-weight: 500;">
                    No medical history
                </span>
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ SERVICES (VET services only)
    // ═══════════════════════════════════════════════════════════════
    let servicesList = [];
    if (app.service_details && Array.isArray(app.service_details) && app.service_details.length > 0) {
        servicesList = app.service_details
            .filter(svc => (svc.category || '').toLowerCase() === 'vet')
            .map(svc => svc.name);
    } else if (app.services) {
        try {
            const services = typeof app.services === 'string' ? JSON.parse(app.services) : app.services;
            if (Array.isArray(services)) servicesList = services;
        } catch (e) {
            servicesList = [String(app.services)];
        }
    }
    
    let servicesHTML = '';
    if (servicesList.length > 0) {
        servicesHTML = servicesList.map(svc => `
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; font-size: 12px; color: #2563eb; font-weight: 600; margin: 3px 3px 3px 0;">
                <i class="fas fa-stethoscope" style="font-size: 10px;"></i>
                ${svc}
            </div>
        `).join('');
    } else {
        servicesHTML = '<span style="color: #94a387; font-style: italic; font-size: 13px;">No services listed</span>';
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ MEDICAL RECORD (kung may record na)
    // ═══════════════════════════════════════════════════════════════
    const record = allRecordsData.find(r => 
        r.pet_id === app.pet_id && r.visit_date === getTodayDateString()
    );
    
    let recordHTML = '';
    if (record) {
        let diagnosisTreatment = '';
        let serviceTreatment = '';
        
        if (record.treatment) {
            const diagnosisMatch = record.treatment.match(/\[Diagnosis Treatment\]\s*([^|]+)/);
            const serviceMatch = record.treatment.match(/\[Service Treatment\]\s*(.+)/);
            if (diagnosisMatch) diagnosisTreatment = diagnosisMatch[1].trim();
            if (serviceMatch) serviceTreatment = serviceMatch[1].trim();
            if (!diagnosisTreatment && !serviceTreatment) diagnosisTreatment = record.treatment;
        }
        
        recordHTML = `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-stethoscope" style="color: #7ba05b;"></i> Diagnosis
                </span>
                <span style="color: #2d3e1f; font-size: 12px; font-weight: 500; text-align: right; max-width: 60%;">${record.diagnosis || '—'}</span>
            </div>
            ${diagnosisTreatment ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-prescription-bottle-medical" style="color: #ef4444;"></i> Treatment for Diagnosis
                </span>
                <span style="font-size: 12px; text-align: right; max-width: 60%;">
                    <span style="color: #ef4444; font-weight: 700;">Diagnosis Treatment</span>
                    <span style="color: #2d3e1f;">${diagnosisTreatment}</span>
                </span>
            </div>
            ` : ''}
            ${serviceTreatment ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-scissors" style="color: #3b82f6;"></i> Treatment for Service
                </span>
                <span style="font-size: 12px; text-align: right; max-width: 60%;">
                    <span style="color: #3b82f6; font-weight: 700;">Service Treatment</span>
                    <span style="color: #2d3e1f;">${serviceTreatment}</span>
                </span>
            </div>
            ` : ''}
            ${record.prescription ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-prescription" style="color: #7ba05b;"></i> Prescription
                </span>
                <span style="color: #2d3e1f; font-size: 12px; text-align: right; max-width: 60%;">${record.prescription}</span>
            </div>
            ` : ''}
            ${record.notes ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #94a387; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-pencil-alt" style="color: #7ba05b;"></i> Notes
                </span>
                <span style="color: #2d3e1f; font-size: 12px; text-align: right; max-width: 60%;">${record.notes}</span>
            </div>
            ` : ''}
        `;
    } else {
        recordHTML = `
            <div style="text-align: center; padding: 20px; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.4); border-radius: 10px;">
                <i class="fas fa-exclamation-circle" style="color: #f59e0b; font-size: 24px; margin-bottom: 6px;"></i>
                <p style="color: #d97706; font-size: 12px; margin: 0; font-weight: 500;">No medical record yet</p>
                <p style="color: #94a387; font-size: 11px; margin: 4px 0 0;">Click "Add Medical Record" to create one</p>
            </div>
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ✅ MODAL CONTENT
    // ═══════════════════════════════════════════════════════════════
    const modalContent = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- ═══ HEADER: Pet Avatar + Name + Status ═══ -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: linear-gradient(135deg, #f7fbf3, #eaf3e0); border-radius: 14px; border: 1px solid #d4e5c4;">
                ${petAvatarHTML}
                <div style="flex: 1; min-width: 0;">
                    <div style="color: #2d3e1f; font-weight: 700; font-size: 22px; margin-bottom: 4px;">
                        ${petName}
                    </div>
                    <div style="color: #5a7a3f; font-size: 13px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <span>${petIcon} ${petType}</span>
                        <span style="color: #c5dcb4;">•</span>
                        <span>${breed}</span>
                        <span style="color: #c5dcb4;">•</span>
                        <span>${ageDisplay}</span>
                    </div>
                </div>
                <span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 6px 14px; border-radius: 15px; font-size: 11px; font-weight: 700; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.3px;">
                    <i class="fas fa-check-circle"></i> Confirmed
                </span>
            </div>
            
            <!-- ═══ BASIC INFO GRID ═══ -->
            <div>
                <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-info-circle"></i> Pet Information
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 14px; background: #f7fbf3; border-radius: 10px; border: 1px solid #d4e5c4;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-venus-mars" style="color: #7ba05b; margin-right: 4px;"></i>Gender</span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 600;">${gender}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-weight" style="color: #7ba05b; margin-right: 4px;"></i>Weight</span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 600;">${weight}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-palette" style="color: #7ba05b; margin-right: 4px;"></i>Color</span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 600;">${color}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-calendar-alt" style="color: #7ba05b; margin-right: 4px;"></i>Age</span>
                        <span style="color: #2d3e1f; font-size: 12px; font-weight: 600;">${ageDisplay}</span>
                    </div>
                </div>
            </div>
            
            <!-- ═══ ALLERGIES ═══ -->
            <div>
                <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-exclamation-triangle"></i> Health Information
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${allergiesHTML}
                    ${medicalHistoryHTML}
                </div>
            </div>
            
            <!-- ═══ APPOINTMENT INFO ═══ -->
            <div>
                <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-calendar-check"></i> Appointment Info
                </div>
                <div style="background: #f7fbf3; border-radius: 10px; padding: 12px 14px; border: 1px solid #d4e5c4;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eaf3e0;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-clock" style="color: #7ba05b; margin-right: 4px;"></i>Time</span>
                        <span style="color: #2d3e1f; font-size: 13px; font-weight: 600;">${formatStaffTime(app.appointment_time)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eaf3e0;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-hashtag" style="color: #7ba05b; margin-right: 4px;"></i>Appointment ID</span>
                        <span style="color: #5a7a3f; font-size: 12px; font-weight: 700; font-family: monospace;">#${app.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span style="color: #94a387; font-size: 12px;"><i class="fas fa-user" style="color: #7ba05b; margin-right: 4px;"></i>Owner</span>
                        <span style="color: #2d3e1f; font-size: 12px; word-break: break-all; text-align: right; max-width: 60%;">${ownerEmail}</span>
                    </div>
                </div>
            </div>
            
            <!-- ═══ SERVICES NEEDED ═══ -->
            <div>
                <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-stethoscope"></i> Services Needed
                </div>
                <div style="background: #f7fbf3; border-radius: 10px; padding: 12px 14px; border: 1px solid #d4e5c4;">
                    ${servicesHTML}
                </div>
            </div>
            
            <!-- ═══ MEDICAL RECORD ═══ -->
            <div>
                <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-notes-medical"></i> Medical Record
                </div>
                <div style="background: #f7fbf3; border-radius: 10px; padding: 12px 14px; border: 1px solid #d4e5c4;">
                    ${recordHTML}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('todayPatientDetailsContent').innerHTML = modalContent;
    
    // ═══ Buttons: Add / Edit Medical Record ═══
    const addBtn = document.getElementById('todayAddRecordBtn');
    const editBtn = document.getElementById('todayEditRecordBtn');
    
    if (record) {
        // May record na — ipakita ang "Add Another" at "Edit"
        addBtn.style.display = 'inline-flex';
        editBtn.style.display = 'inline-flex';
        addBtn.onclick = () => {
            closeTodayPatientDetails();
            addRecordFromToday(appointmentId);
        };
        editBtn.onclick = () => {
            closeTodayPatientDetails();
            editRecordFromToday(appointmentId);
        };
    } else {
        // Wala pang record — "Add" lang
        addBtn.style.display = 'inline-flex';
        editBtn.style.display = 'none';
        addBtn.onclick = () => {
            closeTodayPatientDetails();
            addRecordFromToday(appointmentId);
        };
    }
    
    document.getElementById('todayPatientDetailsModal').style.display = 'flex';
}

function closeTodayPatientDetails() {
    document.getElementById('todayPatientDetailsModal').style.display = 'none';
}

function addRecordFromToday(appointmentId) {
    const allAppointments = window._todayAppointments || [];
    const allPets = window._allPets || [];
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        alert('Appointment not found.');
        return;
    }
    
    const pet = allPets.find(p => p.id === app.pet_id);
    
    showAddRecordModal();
    
    setTimeout(() => {
        const petLabel = pet 
            ? `${pet.name} (${pet.breed || 'Mixed Breed'})` 
            : app.pet_name || 'Unknown';
        selectPetOption(app.pet_id, petLabel);
        
        // ✅ I-set ang appointment_id sa modal (naka-store para sa submitRecord)
        const appointmentIdInput = document.getElementById('recordAppointmentId');
        if (appointmentIdInput) {
            appointmentIdInput.value = appointmentId;
        } else {
            // Kung wala pang hidden input, gumawa ng bago
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'recordAppointmentId';
            hiddenInput.value = appointmentId;
            const form = document.getElementById('recordForm');
            if (form) form.appendChild(hiddenInput);
        }
        
        // ✅ Kung may service sa appointment, i-auto-fill ang "Service" field
        if (app.service_details && Array.isArray(app.service_details)) {
            const vetServices = app.service_details
                .filter(svc => (svc.category || '').toLowerCase() === 'vet')
                .map(svc => svc.name)
                .join(', ');
            
            const serviceInput = document.getElementById('recordService');
            if (serviceInput && vetServices && !serviceInput.value) {
                serviceInput.value = vetServices;
            }
        }
        
    }, 400);
}

function editRecordFromToday(appointmentId) {
    const allAppointments = window._todayAppointments || [];
    const allRecordsData = window._allRecordsData || [];
    
    const app = allAppointments.find(a => a.id === appointmentId);
    if (!app) {
        alert('Appointment not found.');
        return;
    }
    
    const today = getTodayDateString();
    const record = allRecordsData.find(r => 
        r.pet_id === app.pet_id && r.visit_date === today
    );
    
    if (record) {
        editRecord(record.id);
    } else {
        addRecordFromToday(appointmentId);
    }
}

// ═══════════════════════════════════════════════════════════════════
// PET DETAILS MODAL (for All Patients)
// ═══════════════════════════════════════════════════════════════════
function showPetDetailsModal(petId) {
    const pets = window._allPets || allPetsCache || [];
    const pet = pets.find(p => p.id === petId);
    
    if (!pet) {
        fetch('/api/all-pets')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.pets) {
                    const fetchedPet = data.pets.find(p => p.id === petId);
                    if (fetchedPet) {
                        renderPetDetailsModal(fetchedPet);
                    } else {
                        alert('Pet not found.');
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching pet:', err);
                alert('Error loading pet details.');
            });
    } else {
        renderPetDetailsModal(pet);
    }
}

function renderPetDetailsModal(pet) {
    const petType = pet.pet_type || 'Dog';
    const petIcon = petType === 'Cat' ? '🐈' : '🐕';
    const ownerEmail = pet.owner_email || pet.customer_email || '—';
    const ageDisplay = formatPetAge(pet.age, pet.age_months);
    
    const hasAllergies = pet.allergies && 
                        pet.allergies.trim() !== '' && 
                        pet.allergies.trim().toLowerCase() !== 'none' &&
                        pet.allergies.trim().toLowerCase() !== 'n/a';
    
    const hasMedicalHistory = pet.medical_history && 
                             pet.medical_history.trim() !== '' && 
                             pet.medical_history.trim().toLowerCase() !== 'none' &&
                             pet.medical_history.trim().toLowerCase() !== 'n/a';
    
    let statusText = '✅ Healthy';
    let statusColor = '#5a7a3f';
    let statusBg = 'rgba(123, 160, 91, 0.15)';
    
    if (hasAllergies) {
        statusText = '⚠️ Has Allergies';
        statusColor = '#ef4444';
        statusBg = 'rgba(239, 68, 68, 0.15)';
    } else if (hasMedicalHistory) {
        statusText = '⚠️ Needs Attention';
        statusColor = '#f59e0b';
        statusBg = 'rgba(245, 158, 11, 0.15)';
    }
    
    let medicalHistoryDetails = {};
    
    if (pet.medical_history_details) {
        try {
            const parsed = JSON.parse(pet.medical_history_details);
            if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
                medicalHistoryDetails = parsed;
            }
        } catch (e) {
            console.warn('Could not parse medical_history_details:', e);
        }
    }
    
    if (Object.keys(medicalHistoryDetails).length === 0 && hasMedicalHistory) {
        const conditions = pet.medical_history.split(',').map(c => c.trim()).filter(c => c);
        conditions.forEach(c => {
            medicalHistoryDetails[c] = '';
        });
    }
    
    const medEntries = Object.entries(medicalHistoryDetails);
    
    window._currentEditingPet = {
        ...pet,
        medicalHistoryDetails: { ...medicalHistoryDetails },
        medicalHistory: pet.medical_history || ''
    };
    
    let medHistoryTableHTML = '';
    
    const renderEditableRows = () => {
        const details = window._currentEditingPet.medicalHistoryDetails;
        const entries = Object.entries(details);
        
        if (entries.length === 0) {
            return `
                <tr>
                    <td colspan="3" style="padding: 16px; text-align: center; color: #94a387; font-size: 12px; font-style: italic;">
                        <i class="fas fa-info-circle"></i> No conditions yet. Click "Add Condition" to add one.
                    </td>
                </tr>
            `;
        }
        
        return entries.map(([condition, date], idx) => {
            const escapedCondition = String(condition).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            const escapedDate = String(date || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            return `
                <tr style="border-bottom: 1px solid #eaf3e0;" data-condition-row="${escapedCondition}">
                    <td style="padding: 8px 10px; width: 45%;">
                        <input type="text" 
                               value="${escapedCondition}"
                               data-edit-condition-input="${escapedCondition}"
                               data-original-condition="${escapedCondition}"
                               placeholder="Condition name"
                               style="width: 100%; padding: 8px 10px; border: 1px solid #d4e5c4; border-radius: 6px; background: #ffffff; color: #2d3e1f; font-size: 12px; font-family: 'Poppins', sans-serif; outline: none; transition: all 0.2s ease;"
                               onfocus="this.style.borderColor='#7ba05b'; this.style.boxShadow='0 0 0 2px rgba(123, 160, 91, 0.15)'"
                               onblur="this.style.borderColor='#d4e5c4'; this.style.boxShadow='none'">
                    </td>
                    <td style="padding: 8px 10px; width: 45%;">
                        <input type="text" 
                               value="${escapedDate}"
                               data-edit-date-input="${escapedCondition}"
                               data-original-condition="${escapedCondition}"
                               placeholder="e.g., dec 15 2023"
                               style="width: 100%; padding: 8px 10px; border: 1px solid #d4e5c4; border-radius: 6px; background: #ffffff; color: #4a5a3f; font-size: 12px; font-family: 'Poppins', sans-serif; outline: none; transition: all 0.2s ease;"
                               onfocus="this.style.borderColor='#7ba05b'; this.style.boxShadow='0 0 0 2px rgba(123, 160, 91, 0.15)'"
                               onblur="this.style.borderColor='#d4e5c4'; this.style.boxShadow='none'">
                    </td>
                    <td style="padding: 8px 10px; width: 10%; text-align: center;">
                        <button type="button"
                                onclick="removeMedicalHistoryRow('${escapedCondition}')"
                                title="Remove this condition"
                                style="background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease;"
                                onmouseover="this.style.background='#ef4444'; this.style.color='#ffffff';"
                                onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444';">
                            <i class="fas fa-times" style="font-size: 11px;"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };
    
    medHistoryTableHTML = `
        <div id="medHistoryEditableSection" style="background: #ffffff; border: 2px solid #7ba05b; border-radius: 12px; overflow: hidden; margin-top: 10px;">
            <div style="padding: 10px 14px; background: linear-gradient(135deg, #7ba05b, #5a7a3f); color: #ffffff; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-table"></i>
                <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                    Medical History Details
                </span>
                <span id="medHistoryCountBadge" style="margin-left: auto; font-size: 10px; background: rgba(255, 255, 255, 0.25); padding: 2px 8px; border-radius: 10px; font-weight: 700;">
                    ${medEntries.length}
                </span>
            </div>
            
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f7fbf3;">
                            <th style="padding: 10px 12px; text-align: left; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Condition</th>
                            <th style="padding: 10px 12px; text-align: left; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Date / Details</th>
                            <th style="padding: 10px 12px; text-align: center; color: #5a7a3f; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; width: 60px;">Action</th>
                        </tr>
                    </thead>
                    <tbody id="medHistoryTableBody">
                        ${renderEditableRows()}
                    </tbody>
                </table>
            </div>
            
            <div style="padding: 10px 14px; background: #f7fbf3; border-top: 1px solid #eaf3e0; display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <button type="button" 
                        onclick="addNewMedicalHistoryRow()"
                        style="padding: 7px 14px; background: #ffffff; color: #5a7a3f; border: 1px solid #7ba05b; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 6px;"
                        onmouseover="this.style.background='#7ba05b'; this.style.color='#ffffff';"
                        onmouseout="this.style.background='#ffffff'; this.style.color='#5a7a3f';">
                    <i class="fas fa-plus"></i> Add Condition
                </button>
                <span style="color: #94a387; font-size: 11px; font-style: italic;">
                    <i class="fas fa-info-circle"></i> I-edit ang condition o date, tapos i-click ang Save.
                </span>
            </div>
        </div>
    `;
    
    let medicalProofHTML = '';
    
    if (pet.medical_proof) {
        try {
            const proofFiles = JSON.parse(pet.medical_proof);
            if (Array.isArray(proofFiles) && proofFiles.length > 0) {
                let proofListHTML = '';
                proofFiles.forEach((file, i) => {
                    const isImage = file.type && file.type.startsWith('image/');
                    const isPDF = file.type && file.type === 'application/pdf';
                    const icon = isImage ? 'fa-image' : (isPDF ? 'fa-file-pdf' : 'fa-file');
                    const iconColor = isPDF ? '#ef4444' : '#7ba05b';
                    
                    const sizeKB = (file.size / 1024).toFixed(1);
                    const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB} KB`;
                    
                    let thumbnailHTML = `
                        <div style="width: 44px; height: 44px; border-radius: 8px; background: ${iconColor}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i class="fas ${icon}" style="color: ${iconColor}; font-size: 18px;"></i>
                        </div>
                    `;
                    
                    if (isImage && file.data) {
                        thumbnailHTML = `
                            <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #d4e5c4; background: #f7fbf3;">
                                <img src="${file.data}" alt="${file.name}" 
                                     style="width: 100%; height: 100%; object-fit: cover; pointer-events: none;">
                            </div>
                        `;
                    }
                    
                    proofListHTML += `
                        <div onclick="openVetImageViewer('${file.data.replace(/'/g, "\\'")}')" 
                             style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #ffffff; border: 1px solid #d4e5c4; border-radius: 8px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s ease;"
                             onmouseover="this.style.borderColor='#7ba05b'; this.style.transform='translateX(4px)'; this.style.boxShadow='0 3px 10px rgba(123, 160, 91, 0.15)';"
                             onmouseout="this.style.borderColor='#d4e5c4'; this.style.transform='translateX(0)'; this.style.boxShadow='none';">
                            ${thumbnailHTML}
                            <div style="flex: 1; min-width: 0;">
                                <div style="color: #2d3e1f; font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${file.name}
                                </div>
                                <div style="color: #94a387; font-size: 10px; margin-top: 2px;">
                                    ${sizeDisplay} • ${isImage ? 'Image' : (isPDF ? 'PDF' : 'File')} • <span style="color: #7ba05b; font-weight: 600;">Click to view</span>
                                </div>
                            </div>
                            <i class="fas fa-external-link-alt" style="color: #7ba05b; font-size: 12px; flex-shrink: 0;"></i>
                        </div>
                    `;
                });
                
                medicalProofHTML = `
                    <div style="background: linear-gradient(135deg, #f7fbf3, #eaf3e0); border-radius: 12px; padding: 14px; border: 1px solid #d4e5c4; margin-top: 10px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                            <i class="fas fa-file-medical" style="color: #7ba05b; font-size: 14px;"></i>
                            <span style="color: #2d3e1f; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                Medical Proof / Records (${proofFiles.length})
                            </span>
                        </div>
                        ${proofListHTML}
                    </div>
                `;
            }
        } catch (e) {
            console.warn('Could not parse medical_proof:', e);
        }
    }
    
    const modalContent = `
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 14px; padding: 16px; background: linear-gradient(135deg, #f7fbf3, #eaf3e0); border-radius: 12px; border: 1px solid #d4e5c4;">
                <div style="width: 70px; height: 70px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 40px; border: 3px solid #7ba05b; overflow: hidden; flex-shrink: 0;">
                    ${pet.pet_image 
                        ? `<img src="${pet.pet_image}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="openVetImageViewer('${pet.pet_image}')">` 
                        : petIcon
                    }
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="color: #2d3e1f; font-weight: 700; font-size: 20px; margin-bottom: 4px;">${pet.name || 'Unknown'}</div>
                    <div style="color: #5a7a3f; font-size: 13px;">${petType} • ${pet.breed || 'Mixed Breed'}</div>
                    <div style="color: #94a387; font-size: 12px; margin-top: 2px;">${ageDisplay}</div>
                </div>
                <span style="background: ${statusBg}; color: ${statusColor}; padding: 6px 14px; border-radius: 15px; font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0;">
                    ${statusText}
                </span>
            </div>
            
            <div class="pet-detail-section">
                <div class="section-label"><i class="fas fa-info-circle"></i> Basic Information</div>
                <div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-paw"></i> Type</span>
                        <span class="value">${petIcon} ${petType}</span>
                    </div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-dna"></i> Breed</span>
                        <span class="value">${pet.breed || 'Mixed Breed'}</span>
                    </div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-calendar-alt"></i> Age</span>
                        <span class="value">${ageDisplay}</span>
                    </div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-venus-mars"></i> Gender</span>
                        <span class="value">${pet.gender || '—'}</span>
                    </div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-palette"></i> Color</span>
                        <span class="value">${pet.color || '—'}</span>
                    </div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-weight"></i> Weight</span>
                        <span class="value">${pet.weight ? pet.weight + ' kg' : '—'}</span>
                    </div>
                </div>
            </div>
            
            <div class="pet-detail-section">
                <div class="section-label"><i class="fas fa-user"></i> Owner Information</div>
                <div>
                    <div class="pet-detail-row">
                        <span class="label"><i class="fas fa-envelope"></i> Email</span>
                        <span class="value">${ownerEmail}</span>
                    </div>
                </div>
            </div>
            
            <div class="pet-detail-section">
                <div class="section-label"><i class="fas fa-heartbeat"></i> Health Information</div>
                
                <div style="background: ${hasAllergies ? 'rgba(239, 68, 68, 0.06)' : '#f7fbf3'}; border: 1px solid ${hasAllergies ? 'rgba(239, 68, 68, 0.3)' : '#d4e5c4'}; border-radius: 10px; padding: 12px 14px; margin-bottom: 10px;">
                    <div style="color: ${hasAllergies ? '#ef4444' : '#5a7a3f'}; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-exclamation-triangle"></i> Allergies
                    </div>
                    <div style="color: ${hasAllergies ? '#b91c1c' : '#2d3e1f'}; font-size: 13px; line-height: 1.5; word-break: break-word;">
                        ${hasAllergies ? pet.allergies : '<span style="color: #94a387; font-style: italic;">None reported</span>'}
                    </div>
                </div>
                
                <div style="background: #f7fbf3; border: 1px solid #d4e5c4; border-radius: 10px; padding: 12px 14px;">
                    <div style="color: #5a7a3f; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-notes-medical"></i> Medical History
                    </div>
                    <div style="color: #2d3e1f; font-size: 13px; line-height: 1.5; word-break: break-word;">
                        ${hasMedicalHistory ? pet.medical_history : '<span style="color: #94a387; font-style: italic;">None reported</span>'}
                    </div>
                </div>
                
                ${medHistoryTableHTML}
                
                ${medicalProofHTML}
            </div>
        </div>
    `;
    
    document.getElementById('petDetailsContent').innerHTML = modalContent;
    
    const modalButtonsContainer = document.querySelector('#petDetailsModal .modal-buttons');
    
    if (modalButtonsContainer) {
        modalButtonsContainer.innerHTML = `
            <button type="button" class="modal-btn modal-btn-cancel" onclick="closePetDetailsModal()">
                <i class="fas fa-times"></i> Close
            </button>
            <button type="button" class="modal-btn" 
                    onclick="saveMedicalHistoryChanges()"
                    id="saveMedHistoryBtn"
                    style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; display: inline-flex; align-items: center; gap: 6px;">
                <i class="fas fa-save"></i> Save Changes
            </button>
            <button type="button" class="modal-btn modal-btn-submit" id="petDetailsAddRecordBtn" 
                    onclick="closePetDetailsModal(); showAddRecordModalForPet(${pet.id});">
                <i class="fas fa-plus"></i> Add Medical Record
            </button>
        `;
    }
    
    document.getElementById('petDetailsModal').style.display = 'flex';
}

function addNewMedicalHistoryRow() {
    const tbody = document.getElementById('medHistoryTableBody');
    if (!tbody) return;
    
    const tempId = `__new_${Date.now()}`;
    
    const newRow = document.createElement('tr');
    newRow.style.borderBottom = '1px solid #eaf3e0';
    newRow.setAttribute('data-condition-row', tempId);
    
    newRow.innerHTML = `
        <td style="padding: 8px 10px; width: 45%;">
            <input type="text" 
                   value=""
                   data-edit-condition-input="${tempId}"
                   data-original-condition="${tempId}"
                   placeholder="Condition name (e.g., arthritis)"
                   style="width: 100%; padding: 8px 10px; border: 1px solid #7ba05b; border-radius: 6px; background: #ffffff; color: #2d3e1f; font-size: 12px; font-family: 'Poppins', sans-serif; outline: none; box-shadow: 0 0 0 2px rgba(123, 160, 91, 0.15);"
                   onfocus="this.style.borderColor='#7ba05b'; this.style.boxShadow='0 0 0 2px rgba(123, 160, 91, 0.15)'"
                   onblur="this.style.borderColor='#d4e5c4'; this.style.boxShadow='none'">
        </td>
        <td style="padding: 8px 10px; width: 45%;">
            <input type="text" 
                   value=""
                   data-edit-date-input="${tempId}"
                   data-original-condition="${tempId}"
                   placeholder="e.g., dec 15 2023"
                   style="width: 100%; padding: 8px 10px; border: 1px solid #d4e5c4; border-radius: 6px; background: #ffffff; color: #4a5a3f; font-size: 12px; font-family: 'Poppins', sans-serif; outline: none;"
                   onfocus="this.style.borderColor='#7ba05b'; this.style.boxShadow='0 0 0 2px rgba(123, 160, 91, 0.15)'"
                   onblur="this.style.borderColor='#d4e5c4'; this.style.boxShadow='none'">
        </td>
        <td style="padding: 8px 10px; width: 10%; text-align: center;">
            <button type="button"
                    onclick="removeMedicalHistoryRow('${tempId}')"
                    title="Remove this condition"
                    style="background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease;"
                    onmouseover="this.style.background='#ef4444'; this.style.color='#ffffff';"
                    onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444';">
                <i class="fas fa-times" style="font-size: 11px;"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    const newInput = newRow.querySelector('input[data-edit-condition-input]');
    if (newInput) newInput.focus();
    
    updateMedHistoryCountBadge();
}

function removeMedicalHistoryRow(conditionKey) {
    const tbody = document.getElementById('medHistoryTableBody');
    if (!tbody) return;
    
    const row = tbody.querySelector(`tr[data-condition-row="${CSS.escape(conditionKey)}"]`);
    if (!row) return;
    
    showRemoveConditionConfirmModal(conditionKey, row);
}

function showRemoveConditionConfirmModal(conditionKey, row) {
    const existingModal = document.getElementById('removeConditionConfirmModal');
    if (existingModal) existingModal.remove();
    
    const escapedCondition = String(conditionKey)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'removeConditionConfirmModal';
    overlay.style.zIndex = '5000';
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 420px; text-align: center; position: relative;">
            
            <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 72px;
                height: 72px;
                border-radius: 20px;
                background: rgba(239, 68, 68, 0.12);
                color: #ef4444;
                font-size: 32px;
                margin-bottom: 16px;
            ">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 20px; margin: 0 0 10px 0; font-weight: 700;">
                Remove Condition?
            </h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                Sigurado ka bang gusto mong i-remove ang condition na ito mula sa medical history?
            </p>
            
            <div style="
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(220, 38, 38, 0.06));
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-left: 4px solid #ef4444;
                border-radius: 12px;
                padding: 14px 18px;
                margin-bottom: 20px;
                text-align: left;
            ">
                <div style="color: #991b1b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-notes-medical"></i> Condition to Remove
                </div>
                <div style="color: #2d3e1f; font-size: 15px; font-weight: 700; word-break: break-word;">
                    ${escapedCondition}
                </div>
            </div>
            
            <div style="
                background: rgba(245, 158, 11, 0.08);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 10px;
                padding: 10px 14px;
                margin-bottom: 20px;
                display: flex;
                align-items: flex-start;
                gap: 8px;
                text-align: left;
            ">
                <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 13px; margin-top: 2px; flex-shrink: 0;"></i>
                <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">
                    Hindi pa ito naka-save. Kailangan mong i-click ang <strong>"Save Changes"</strong> para tuluyang ma-remove sa database.
                </p>
            </div>
            
            <div class="modal-buttons" style="justify-content: center; gap: 10px;">
                <button type="button" 
                        id="removeConditionCancelBtn"
                        class="modal-btn modal-btn-cancel"
                        style="
                            flex: 1;
                            background: #e2e8f0;
                            color: #475569;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            transition: all 0.25s ease;
                        ">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" 
                        id="removeConditionConfirmBtn"
                        class="modal-btn"
                        style="
                            flex: 1;
                            background: linear-gradient(135deg, #ef4444, #dc2626);
                            color: #ffffff;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                            transition: all 0.25s ease;
                        ">
                    <i class="fas fa-trash"></i> Yes, Remove
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const cancelBtn = document.getElementById('removeConditionCancelBtn');
    const confirmBtn = document.getElementById('removeConditionConfirmBtn');
    
    cancelBtn.addEventListener('click', function() {
        closeRemoveConditionConfirmModal();
    });
    cancelBtn.addEventListener('mouseover', function() {
        this.style.background = '#cbd5e1';
        this.style.transform = 'translateY(-1px)';
    });
    cancelBtn.addEventListener('mouseout', function() {
        this.style.background = '#e2e8f0';
        this.style.transform = 'translateY(0)';
    });
    
    confirmBtn.addEventListener('click', function() {
        if (row && row.parentNode) {
            row.remove();
        }
        
        updateMedHistoryCountBadge();
        closeRemoveConditionConfirmModal();
        
        showToast(`<i class="fas fa-check-circle"></i> "${escapedCondition}" removed from list. Click Save Changes to apply.`, 'info');
    });
    confirmBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 18px rgba(239, 68, 68, 0.4)';
    });
    confirmBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
    });
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeRemoveConditionConfirmModal();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeRemoveConditionConfirmModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeRemoveConditionConfirmModal() {
    const modal = document.getElementById('removeConditionConfirmModal');
    if (modal) modal.remove();
}

function updateMedHistoryCountBadge() {
    const tbody = document.getElementById('medHistoryTableBody');
    const badge = document.getElementById('medHistoryCountBadge');
    if (!tbody || !badge) return;
    
    const rowCount = tbody.querySelectorAll('tr[data-condition-row]').length;
    badge.textContent = rowCount;
}

async function saveMedicalHistoryChanges() {
    const pet = window._currentEditingPet;
    if (!pet || !pet.id) {
        showToast('No pet selected.', 'error');
        return;
    }
    
    const tbody = document.getElementById('medHistoryTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr[data-condition-row]');
    const newMedicalHistoryDetails = {};
    const errors = [];
    
    rows.forEach(row => {
        const conditionInput = row.querySelector('input[data-edit-condition-input]');
        const dateInput = row.querySelector('input[data-edit-date-input]');
        
        if (!conditionInput) return;
        
        const condition = conditionInput.value.trim();
        const date = dateInput ? dateInput.value.trim() : '';
        
        if (!condition) {
            return;
        }
        
        if (newMedicalHistoryDetails.hasOwnProperty(condition)) {
            errors.push(`Duplicate condition: "${condition}"`);
            return;
        }
        
        newMedicalHistoryDetails[condition] = date;
    });
    
    if (errors.length > 0) {
        showToast('⚠️ ' + errors.join('<br>'), 'error');
        return;
    }
    
    const conditionsList = Object.keys(newMedicalHistoryDetails);
    const newMedicalHistoryString = conditionsList.length > 0 
        ? conditionsList.join(', ') 
        : '';
    
    const saveBtn = document.getElementById('saveMedHistoryBtn');
    const originalHTML = saveBtn ? saveBtn.innerHTML : '';
    
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
    }
    
    try {
        const updatedPetData = {
            name: pet.name || '',
            pet_type: pet.pet_type || 'Dog',
            breed: pet.breed || '',
            age: pet.age || 0,
            age_months: pet.age_months || 0,
            gender: pet.gender || '',
            color: pet.color || '',
            weight: pet.weight || '',
            allergies: pet.allergies || '',
            medical_history: newMedicalHistoryString,
            medical_history_details: JSON.stringify(newMedicalHistoryDetails),
            medical_proof: pet.medical_proof || '',
            pet_image: pet.pet_image || ''
        };
        
        const updateRes = await fetch(`/api/pets/${pet.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPetData)
        });
        
        const updateData = await updateRes.json();
        
        if (updateData.success) {
            showToast('✅ Medical history updated successfully!', 'success');
            
            window._currentEditingPet.medicalHistoryDetails = newMedicalHistoryDetails;
            window._currentEditingPet.medicalHistory = newMedicalHistoryString;
            
            if (window._allPets) {
                const petIndex = window._allPets.findIndex(p => p.id === pet.id);
                if (petIndex !== -1) {
                    window._allPets[petIndex].medical_history = newMedicalHistoryString;
                    window._allPets[petIndex].medical_history_details = JSON.stringify(newMedicalHistoryDetails);
                }
            }
            
            setTimeout(() => {
                closePetDetailsModal();
                loadAllPatients();
            }, 1000);
        } else {
            showToast('❌ ' + (updateData.message || 'Error saving changes.'), 'error');
        }
    } catch (error) {
        console.error('Error saving medical history:', error);
        showToast('Something went wrong. Please try again.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.innerHTML = originalHTML;
            saveBtn.disabled = false;
        }
    }
}

if (typeof CSS === 'undefined' || !CSS.escape) {
    window.CSS = window.CSS || {};
    window.CSS.escape = function(str) {
        return String(str).replace(/([^\w-])/g, '\\$1');
    };
}

function closePetDetailsModal() {
    document.getElementById('petDetailsModal').style.display = 'none';
    window._currentEditingPet = null;
}

// ═══════════════════════════════════════════════════════════════════
// ✅ BULLETPROOF: Load Recent Records (Direct Fetch & Safe Rendering)
// ═══════════════════════════════════════════════════════════════════
async function loadRecentRecords() {
    const tbody = document.getElementById('recentRecordsTable');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; color: #94a387; padding: 30px;">
                <i class="fas fa-spinner fa-spin"></i> Loading recent records...
            </td>
        </tr>
    `;
    
    try {
        // ✅ Direktang kumuha ng sariwang data (walang cache issues)
        const [recRes, petsRes] = await Promise.all([
            fetch('/api/medical-records'),
            fetch('/api/all-pets')
        ]);
        
        const data = await recRes.json();
        const petsData = await petsRes.json();
        
        const allPetsForLookup = (petsData.success && petsData.pets) ? petsData.pets : [];
        
        // Update global cache para may magamit sa ibang functions
        window._allPets = allPetsForLookup;
        allPetsCache = allPetsForLookup;
        
        if (data.success && data.records && data.records.length > 0) {
            // Kunin lang ang top 5 pinakabagong records
            const recent = data.records.slice(0, 5);
            tbody.innerHTML = '';
            
            recent.forEach(record => {
                // Safe fallback kung wala sa cache ang pet
                const petForRecord = allPetsForLookup.find(p => p.id === record.pet_id);
                const ownerEmail = petForRecord ? (petForRecord.owner_email || petForRecord.customer_email || '—') : '—';
                
                // Parse treatment safely
                let treatmentHTML = '—';
                if (record.treatment) {
                    const diagnosisMatch = record.treatment.match(/\[Diagnosis Treatment\]\s*([^|]+)/);
                    const serviceMatch = record.treatment.match(/\[Service Treatment\]\s*(.+)/);
                    
                    let parts = [];
                    if (diagnosisMatch) {
                        parts.push(`<span style="color: #ef4444; font-weight: 700;">Diagnosis Treatment</span> <span style="color: #2d3e1f;">${diagnosisMatch[1].trim()}</span>`);
                    }
                    if (serviceMatch) {
                        parts.push(`<span style="color: #3b82f6; font-weight: 700;">Service Treatment</span> <span style="color: #2d3e1f;">${serviceMatch[1].trim()}</span>`);
                    }
                    
                    if (parts.length > 0) {
                        treatmentHTML = parts.join(' | ');
                    } else {
                        treatmentHTML = `<span style="color: #2d3e1f;">${record.treatment}</span>`;
                    }
                }
                
                const completedBadgeHTML = `
                    <span style="
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        padding: 4px 12px;
                        background: rgba(16, 185, 129, 0.15);
                        color: #10b981;
                        border: 1px solid rgba(16, 185, 129, 0.35);
                        border-radius: 20px;
                        font-size: 10px;
                        font-weight: 700;
                        white-space: nowrap;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                    ">
                        <i class="fas fa-check-circle"></i> Completed
                    </span>
                `;
                
                // ✅ SAFE RENDER: Kahit walang pet data, gagana pa rin
                const safePet = petForRecord || { name: record.pet_name, pet_type: 'Dog' };
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td data-label="Date">${record.visit_date || 'N/A'}</td>
                    <td data-label="Pet">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${renderPetAvatar(safePet, 26)}
                            <span>${record.pet_name || 'Unknown Pet'}</span>
                        </div>
                    </td>
                    <td data-label="Owner"><span style="font-size: 12px; color: #64748b; word-break: break-all;">${ownerEmail}</span></td>
                    <td data-label="Diagnosis">${record.diagnosis || '—'}</td>
                    <td data-label="Treatment">${treatmentHTML}</td>
                    <td data-label="Status">${completedBadgeHTML}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #94a387; padding: 30px;">
                        No medical records yet.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading recent records:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #ef4444; padding: 30px;">
                    <i class="fas fa-times-circle"></i> Error loading records
                </td>
            </tr>
        `;
    }
}

async function loadAllPatients() {
    try {
        const res = await fetch('/api/all-pets');
        const data = await res.json();
        const tbody = document.getElementById('allPatientsTable');
        
        if (data.success && data.pets.length > 0) {
            allPetsCache = data.pets;
            window._allPets = data.pets;
            
            tbody.innerHTML = '';
            data.pets.forEach(pet => {
                const petType = pet.pet_type || 'Dog';
                const typeClass = petType === 'Cat' ? 'cat' : 'dog';
                
                const hasRealMedicalHistory = pet.medical_history && 
                                             pet.medical_history.trim() !== '' && 
                                             pet.medical_history.trim().toLowerCase() !== 'none' &&
                                             pet.medical_history.trim().toLowerCase() !== 'n/a';
                
                const hasRealAllergies = pet.allergies && 
                                        pet.allergies.trim() !== '' && 
                                        pet.allergies.trim().toLowerCase() !== 'none' &&
                                        pet.allergies.trim().toLowerCase() !== 'n/a';
                
                let statusClass = 'healthy';
                let statusText = '<i class="fas fa-check-circle"></i> Healthy';
                if (hasRealAllergies) {
                    statusClass = 'warning';
                    statusText = '<i class="fas fa-exclamation-triangle"></i> Has Allergies';
                } else if (hasRealMedicalHistory) {
                    statusClass = 'warning';
                    statusText = '<i class="fas fa-clock"></i> Needs Attention';
                }
                
                const row = document.createElement('tr');
                row.className = 'patient-row';
                row.dataset.search = `${pet.name || ''} ${pet.owner_email || ''} ${pet.breed || ''} ${petType}`.toLowerCase();
                row.innerHTML = `
                    <td data-label="ID">#${pet.id}</td>
                    <td data-label="Pet">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${renderPetAvatar(pet, 30)}
                            <strong>${pet.name}</strong>
                        </div>
                    </td>
                    <td data-label="Type"><span class="pet-type-badge ${typeClass}">${petType}</span></td>
                    <td data-label="Breed">${pet.breed || '—'}</td>
                    <td data-label="Age">${pet.age || '—'} ${pet.age ? 'years' : ''}</td>
                    <td data-label="Owner"><span class="truncate" title="${pet.owner_email}">${pet.owner_email}</span></td>
                    <td data-label="Status"><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td data-label="Actions">
                        <div class="action-buttons">
                            <button class="btn-sm info" onclick="showPetDetailsModal(${pet.id})"><i class="fas fa-eye"></i> View Details</button>
                            <button class="btn-sm primary" onclick="viewPetRecords(${pet.id})"><i class="fas fa-clipboard-list"></i> Records</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #64748b; padding: 30px;">
                        No patients registered yet.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        document.getElementById('allPatientsTable').innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #ef4444; padding: 30px;">
                    <i class="fas fa-times-circle"></i> Error loading patients
                </td>
            </tr>
        `;
    }
}

function searchPatients(query) {
    const rows = document.querySelectorAll('#allPatientsTable .patient-row');
    const q = query.toLowerCase().trim();
    rows.forEach(row => {
        const match = row.dataset.search.includes(q);
        row.style.display = match ? '' : 'none';
    });
}

async function viewPetRecords(petId) {
    showTab('medical');
    
    const tbody = document.getElementById('allRecordsTable');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #64748b; padding: 30px;">
                    <i class="fas fa-spinner fa-spin"></i> Loading medical records...
                </td>
            </tr>
        `;
    }
    
    try {
        const res = await fetch('/api/medical-records');
        const data = await res.json();
        
        if (data.success) {
            allRecords = data.records || [];
            currentPetFilter = petId;
            renderRecordsTable();
            showPetFilterNotice(petId);
        }
    } catch (error) {
        console.error('Error loading records:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #ef4444; padding: 30px;">
                        <i class="fas fa-times-circle"></i> Error loading records. Please try again.
                    </td>
                </tr>
            `;
        }
    }
}

function showPetFilterNotice(petId) {
    const existing = document.getElementById('petFilterNotice');
    if (existing) existing.remove();
    
    const petsList = window._allPets || allPetsCache || [];
    const pet = petsList.find(p => p.id === petId);
    
    const petName = pet ? pet.name : 'this Pet';
    
    const notice = document.createElement('div');
    notice.id = 'petFilterNotice';
    notice.style.cssText = `
        background: rgba(123, 160, 91, 0.08);
        border: 1px solid #7ba05b;
        border-radius: 10px;
        padding: 10px 16px;
        margin-bottom: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #5a7a3f;
        flex-wrap: wrap;
    `;
    notice.innerHTML = `
        <span><i class="fas fa-filter"></i> Showing records for <strong>${petName}</strong></span>
        <button onclick="clearPetFilter()" style="background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 12px; font-weight: 600; font-family: 'Poppins', sans-serif;">
            <i class="fas fa-times"></i> Clear Filter
        </button>
    `;
    
    const tableContainer = document.querySelector('#tabMedical .card > div[style*="overflow-x: auto"]');
    if (tableContainer) {
        tableContainer.parentNode.insertBefore(notice, tableContainer);
    }
}
function clearPetFilter() {
    currentPetFilter = null;
    const notice = document.getElementById('petFilterNotice');
    if (notice) notice.remove();
    renderRecordsTable();
}

async function loadAllRecords() {
    const tbody = document.getElementById('allRecordsTable');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; color: #64748b; padding: 30px;">
                <i class="fas fa-spinner fa-spin"></i> Loading medical records...
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch('/api/medical-records');
        const data = await res.json();
        
        if (data.success) {
            allRecords = data.records || [];
            renderRecordsTable();
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #64748b; padding: 30px;">
                        No medical records found.
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading records:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #ef4444; padding: 30px;">
                    <i class="fas fa-times-circle"></i> Error loading records
                </td>
            </tr>
        `;
    }
}

function renderRecordsTable() {
    const tbody = document.getElementById('allRecordsTable');
    if (!tbody) return;
    
    let filtered = allRecords;
    
    if (currentPetFilter) {
        filtered = filtered.filter(r => r.pet_id === currentPetFilter);
    }
    
    const searchInput = document.getElementById('recordSearchInput');
    if (searchInput && searchInput.value.trim()) {
        const q = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(r => 
            (r.pet_name || '').toLowerCase().includes(q) ||
            (r.diagnosis || '').toLowerCase().includes(q) ||
            (r.treatment || '').toLowerCase().includes(q) ||
            (r.vet_email || '').toLowerCase().includes(q)
        );
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #64748b; padding: 30px;">
                    No medical records found.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(record => {
        const petForRecord = (window._allPets || allPetsCache || []).find(p => p.id === record.pet_id);
        const ownerEmail = petForRecord ? (petForRecord.owner_email || petForRecord.customer_email || '—') : '—';
        
        let treatmentHTML = '—';
        if (record.treatment) {
            const diagnosisMatch = record.treatment.match(/\[Diagnosis Treatment\]\s*([^|]+)/);
            const serviceMatch = record.treatment.match(/\[Service Treatment\]\s*(.+)/);
            
            let parts = [];
            if (diagnosisMatch) {
                parts.push(`<span style="color: #ef4444; font-weight: 700;">Diagnosis Treatment</span> <span style="color: #2d3e1f;">${diagnosisMatch[1].trim()}</span>`);
            }
            if (serviceMatch) {
                parts.push(`<span style="color: #3b82f6; font-weight: 700;">Service Treatment</span> <span style="color: #2d3e1f;">${serviceMatch[1].trim()}</span>`);
            }
            
            if (parts.length > 0) {
                treatmentHTML = parts.join(' | ');
            } else {
                treatmentHTML = `<span style="color: #2d3e1f;">${record.treatment}</span>`;
            }
        }
        
        const completedBadgeHTML = `
            <span style="
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 4px 12px;
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.35);
                border-radius: 20px;
                font-size: 10px;
                font-weight: 700;
                white-space: nowrap;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            ">
                <i class="fas fa-check-circle"></i> Completed
            </span>
        `;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Date">${record.visit_date}</td>
            <td data-label="Pet">
                <div style="display: flex; align-items: center; gap: 8px;">
                    ${renderPetAvatar(petForRecord, 26)}
                    <span>${record.pet_name || 'Unknown'}</span>
                </div>
            </td>
            <td data-label="Owner"><span style="font-size: 12px; color: #64748b; word-break: break-all;">${ownerEmail}</span></td>
            <td data-label="Veterinarian"><span style="font-size: 12px;">${record.vet_email || '—'}</span></td>
            <td data-label="Diagnosis">${record.diagnosis}</td>
            <td data-label="Treatment">${treatmentHTML}</td>
            <td data-label="Status">${completedBadgeHTML}</td>
            <td data-label="Actions">
                <div class="action-buttons">
                    <button class="btn-sm outline" onclick="viewRecordDetails(${record.id})"><i class="fas fa-eye"></i> View</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function searchRecords(query) {
    renderRecordsTable();
}

async function loadPetsForDropdown() {
    const optionsContainer = document.getElementById('petSelectOptions');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = `<div class="custom-select-option-placeholder">Loading pets...</div>`;
    
    try {
        const res = await fetch('/api/all-pets');
        const data = await res.json();
        
        if (data.success && data.pets && data.pets.length > 0) {
            allPetsCache = data.pets;
            window._allPets = data.pets;
            
            optionsContainer.innerHTML = '';
            data.pets.forEach(pet => {
                const petType = pet.pet_type || 'Dog';
                const petIcon = petType === 'Cat' ? '🐈' : '🐕';
                const petImage = pet.pet_image || '';
                
                let avatarHTML = '';
                if (petImage && petImage.trim() !== '') {
                    avatarHTML = `
                        <img src="${petImage}" alt="${pet.name}" style="
                            width: 28px; 
                            height: 28px; 
                            border-radius: 50%; 
                            object-fit: cover; 
                            border: 2px solid #d4e5c4; 
                            flex-shrink: 0;
                        ">
                    `;
                } else {
                    avatarHTML = `<span class="pet-emoji">${petIcon}</span>`;
                }
                
                const option = document.createElement('div');
                option.className = 'custom-select-option';
                option.dataset.value = pet.id;
                option.dataset.label = `${pet.name} (${pet.breed || 'Mixed Breed'})`;
                option.innerHTML = `
                    ${avatarHTML}
                    <div class="pet-details">
                        <div class="pet-label">${pet.name} (${pet.breed || 'Mixed Breed'})</div>
                        <div class="pet-owner">${pet.owner_email || ''}</div>
                    </div>
                `;
                option.onclick = () => selectPetOption(pet.id, `${pet.name} (${pet.breed || 'Mixed Breed'})`);
                optionsContainer.appendChild(option);
            });
        } else {
            optionsContainer.innerHTML = `<div class="custom-select-option-placeholder">No pets available</div>`;
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        optionsContainer.innerHTML = `<div class="custom-select-option-placeholder">Error loading pets</div>`;
    }
}

function togglePetDropdown(event) {
    if (event) event.stopPropagation();
    const customSelect = document.getElementById('petCustomSelect');
    if (!customSelect) return;
    customSelect.classList.toggle('open');
}

function selectPetOption(petId, label) {
    document.getElementById('recordPet').value = petId;
    document.getElementById('petSelectLabel').textContent = label;
    
    const options = document.querySelectorAll('#petSelectOptions .custom-select-option');
    options.forEach(opt => {
        if (String(opt.dataset.value) === String(petId)) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    const customSelect = document.getElementById('petCustomSelect');
    if (customSelect) customSelect.classList.remove('open');
    
    selectedDiagnosisValues = [];
    selectedAllergiesValues = [];
    updateCustomDropdownLabel('diagnosis');
    updateCustomDropdownLabel('allergies');
    
    loadDropdownOptionsForPet(petId);
    
    if (typeof window.loadPetFullDetailsForRecord === 'function') {
        window.loadPetFullDetailsForRecord(petId);
    }
}

document.addEventListener('click', function(e) {
    const customSelect = document.getElementById('petCustomSelect');
    if (customSelect && !customSelect.contains(e.target)) {
        customSelect.classList.remove('open');
    }
});

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'flex';
    document.getElementById('recordModalTitle').textContent = 'Add Medical Record';
    document.getElementById('recordId').value = '';
    
    const appointmentIdInput = document.getElementById('recordAppointmentId');
    if (appointmentIdInput) appointmentIdInput.value = '';
    
    document.getElementById('recordForm').reset();
    document.getElementById('recordDate').value = getLocalDateString();
    
    document.getElementById('recordSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Record';
    
    document.getElementById('recordPet').value = '';
    document.getElementById('petSelectLabel').textContent = 'Choose a pet...';
    
    resetDiagnosisAndAllergiesDropdowns();
    
    const diagContainer = document.getElementById('diagnosisOptionsContainer');
    if (diagContainer) diagContainer.innerHTML = '';
    
    const allergyContainer = document.getElementById('allergiesOptionsContainer');
    if (allergyContainer) allergyContainer.innerHTML = '';
    
    if (typeof window.resetAutoFilledSections === 'function') {
        window.resetAutoFilledSections();
    }
    
    loadPetsForDropdown();
}

function showAddRecordModalForPet(petId) {
    showAddRecordModal();
    setTimeout(() => {
        const pet = allPetsCache.find(p => p.id === petId) || (window._allPets || []).find(p => p.id === petId);
        if (pet) {
            const petLabel = `${pet.name} (${pet.breed || 'Mixed Breed'})`;
            selectPetOption(petId, petLabel);
        } else {
            const select = document.getElementById('recordPet');
            if (select) select.value = petId;
        }
    }, 400);
}

function closeAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'none';
}

function editRecord(recordId) {
    const record = allRecords.find(r => r.id === recordId);
    if (!record) {
        alert('Record not found.');
        return;
    }
    
    document.getElementById('addRecordModal').style.display = 'flex';
    document.getElementById('recordModalTitle').textContent = 'Edit Medical Record';
    document.getElementById('recordId').value = record.id;
    document.getElementById('recordDate').value = record.visit_date;
    document.getElementById('recordDiagnosis').value = record.diagnosis || '';
    document.getElementById('recordTreatment').value = record.treatment || '';
    document.getElementById('recordPrescription').value = record.prescription || '';
    document.getElementById('recordNotes').value = record.notes || '';
    document.getElementById('recordSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Record';
    
    loadPetsForDropdown().then(() => {
        const petLabel = record.pet_name 
            ? `${record.pet_name} (${record.breed || 'Mixed Breed'})` 
            : 'Choose a pet...';
        selectPetOption(record.pet_id, petLabel);
    });
}

async function loadPetFullDetailsForRecord(petId) {
    if (!petId) return;
    
    try {
        const res = await fetch(`/api/vet/pet/${petId}/full-details`);
        const data = await res.json();
        
        if (!data.success) {
            console.warn('Could not load pet details:', data.message);
            return;
        }
        
        const pet = data.pet || {};
        const owner = data.owner || {};
        const vaccinations = data.vaccinations || [];
        
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value || '—';
        };
        
        setText('displayPetName', pet.name);
        setText('displaySpecies', pet.species);
        setText('displayBreed', pet.breed);
        setText('displayColor', pet.color);
        setText('displaySex', pet.gender);
        setText('displayNeutered', pet.neutered_status);
        setText('displayDOB', pet.date_of_birth);
        setText('displayAge', pet.age_display);
        setText('displayOwnerName', owner.name);
        setText('displayOwnerPhone', owner.phone);
        
        const medDetails = pet.medical_history_details || {};
        
        const illnessKeywords = ['parvo', 'distemper', 'kennel cough', 'influenza', 'leptospirosis', 
                                 'heartworm', 'lyme', 'hepatitis', 'coronavirus', 'giardia',
                                 'felv', 'fiv', 'panleukopenia', 'herpesvirus', 'calicivirus', 'fip',
                                 'diabetes', 'epilepsy', 'kidney', 'liver', 'thyroid', 'arthritis',
                                 'dermatitis', 'infection', 'cancer'];
        const illnesses = Object.keys(medDetails).filter(k => 
            illnessKeywords.some(kw => k.toLowerCase().includes(kw))
        );
        setText('displayPreviousIllnesses', illnesses.length > 0 ? illnesses.join(', ') : 'None');
        
        const surgeryKeywords = ['spayed', 'neutered', 'surgery', 'operation', 'extraction', 'replacement', 'repair'];
        const surgeries = Object.keys(medDetails).filter(k => 
            surgeryKeywords.some(kw => k.toLowerCase().includes(kw))
        );
        setText('displayPreviousSurgeries', surgeries.length > 0 ? surgeries.map(s => {
            const date = medDetails[s];
            return date && date.trim() ? `${s} (${date})` : s;
        }).join(', ') : 'None');
        
        const medKeywords = ['medication', 'insulin', 'antibiotic', 'pain management', 'allergy medication', 
                             'joint supplement', 'thyroid medication', 'kidney support'];
        const medications = Object.keys(medDetails).filter(k => 
            medKeywords.some(kw => k.toLowerCase().includes(kw))
        );
        setText('displayCurrentMeds', medications.length > 0 ? medications.join(', ') : 'None');
        
        setText('displayAllergies', pet.allergies || 'None');
        
        const vaccContainer = document.getElementById('displayVaccinationHistory');
        if (vaccContainer) {
            if (vaccinations.length === 0) {
                vaccContainer.innerHTML = `
                    <div style="text-align: center; padding: 12px; color: #94a387; font-size: 12px; background: #f7fbf3; border-radius: 8px; font-style: italic;">
                        <i class="fas fa-info-circle"></i> No vaccination records yet.
                    </div>
                `;
            } else {
                let rowsHTML = '';
                vaccinations.forEach(v => {
                    rowsHTML += `
                        <tr style="border-bottom: 1px solid #eaf3e0;">
                            <td style="padding: 8px 10px; color: #2d3e1f; font-size: 12px; font-weight: 600;">${v.vaccine_name || '—'}</td>
                            <td style="padding: 8px 10px; color: #4a5a3f; font-size: 12px;">${v.date_given || '—'}</td>
                            <td style="padding: 8px 10px; color: #94a387; font-size: 12px;">${v.next_due_date || '—'}</td>
                        </tr>
                    `;
                });
                
                vaccContainer.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #d4e5c4;">
                        <thead>
                            <tr style="background: #f7fbf3;">
                                <th style="padding: 8px 10px; text-align: left; color: #5a7a3f; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px;">Vaccine</th>
                                <th style="padding: 8px 10px; text-align: left; color: #5a7a3f; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px;">Date Given</th>
                                <th style="padding: 8px 10px; text-align: left; color: #5a7a3f; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px;">Next Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHTML}
                        </tbody>
                    </table>
                `;
            }
        }
        
    } catch (error) {
        console.error('Error auto-filling pet details:', error);
    }
}

function resetAutoFilledSections() {
    const setDefault = (id, defaultVal = '—') => {
        const el = document.getElementById(id);
        if (el) el.textContent = defaultVal;
    };
    
    setDefault('displayPetName', '—');
    setDefault('displaySpecies', '—');
    setDefault('displayBreed', '—');
    setDefault('displayColor', '—');
    setDefault('displaySex', '—');
    setDefault('displayNeutered', '—');
    setDefault('displayDOB', '—');
    setDefault('displayAge', '—');
    setDefault('displayOwnerName', '—');
    setDefault('displayOwnerPhone', '—');
    setDefault('displayPreviousIllnesses', 'None');
    setDefault('displayPreviousSurgeries', 'None');
    setDefault('displayCurrentMeds', 'None');
    setDefault('displayAllergies', 'None');
    
    const vaccContainer = document.getElementById('displayVaccinationHistory');
    if (vaccContainer) {
        vaccContainer.innerHTML = `
            <div style="text-align: center; padding: 12px; color: #94a387; font-size: 12px; background: #f7fbf3; border-radius: 8px; font-style: italic;">
                <i class="fas fa-info-circle"></i> Select a pet to view vaccinations.
            </div>
        `;
    }
}

async function submitRecord(e) {
    e.preventDefault();
    
    const recordId = document.getElementById('recordId').value;
    const pet_id = document.getElementById('recordPet').value;
    const appointment_id_input = document.getElementById('recordAppointmentId');
    const appointment_id = appointment_id_input ? appointment_id_input.value : null;
    const visit_date = document.getElementById('recordDate').value;
    
    const selectedDiagnosis = (typeof selectedDiagnosisValues !== 'undefined') ? selectedDiagnosisValues : [];
    const selectedAllergies = (typeof selectedAllergiesValues !== 'undefined') ? selectedAllergiesValues : [];
    
    let finalDiagnosis = '';
    
    if (selectedDiagnosis.length > 0) {
        finalDiagnosis += selectedDiagnosis.join(', ');
    }
    
    if (selectedAllergies.length > 0) {
        if (finalDiagnosis) {
            finalDiagnosis += ' | Allergies: ' + selectedAllergies.join(', ');
        } else {
            finalDiagnosis = 'Allergies: ' + selectedAllergies.join(', ');
        }
    }
    
    const manualDiagnosis = document.getElementById('recordDiagnosis').value.trim();
    if (!finalDiagnosis && manualDiagnosis) {
        finalDiagnosis = manualDiagnosis;
    }

    const treatmentDiagnosisEl = document.getElementById('recordTreatmentDiagnosis');
    const serviceEl = document.getElementById('recordService');
    const treatmentServiceEl = document.getElementById('recordTreatmentService');
    
    const treatmentDiagnosis = treatmentDiagnosisEl ? treatmentDiagnosisEl.value.trim() : '';
    const service = serviceEl ? serviceEl.value.trim() : '';
    const treatmentService = treatmentServiceEl ? treatmentServiceEl.value.trim() : '';
    
    const prescription = document.getElementById('recordPrescription').value.trim();
    const notes = document.getElementById('recordNotes').value.trim();
    
    if (!pet_id || !visit_date || !finalDiagnosis) {
        showToast('❌ Please fill in all required fields (Pet, Visit Date, Diagnosis/Allergies).', 'error');
        return;
    }
    
    let combinedTreatment = '';
    if (treatmentDiagnosis) {
        combinedTreatment += `[Diagnosis Treatment] ${treatmentDiagnosis}`;
    }
    if (treatmentService) {
        if (combinedTreatment) combinedTreatment += ' | ';
        combinedTreatment += `[Service Treatment] ${treatmentService}`;
    }
    
    let combinedNotes = notes;
    if (service) {
        combinedNotes = `[Service: ${service}] ${combinedNotes}`.trim();
    }
    
    const submitBtn = document.getElementById('recordSubmitBtn');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        const isEdit = recordId !== '';
        const url = isEdit ? `/api/medical-records/${recordId}` : '/api/medical-records';
        const method = isEdit ? 'PUT' : 'POST';
        
        const body = isEdit 
            ? { 
                diagnosis: finalDiagnosis, 
                treatment: combinedTreatment, 
                prescription, 
                notes: combinedNotes, 
                status: 'active' 
            }
            : { 
                pet_id, 
                appointment_id: appointment_id || null,
                visit_date, 
                diagnosis: finalDiagnosis, 
                treatment: combinedTreatment, 
                prescription, 
                notes: combinedNotes 
            };
        
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        
        if (data.success) {
            showToast('✅ Medical record saved successfully!', 'success');
            closeAddRecordModal();
            
            // ═══════════════════════════════════════════════════════════
            // ✅ SYSTEMATIC REFRESH PARA WALANG RACE CONDITION
            // ═══════════════════════════════════════════════════════════
            
            // STEP 1: I-refresh ang Stats Cards agad para mag-update ang count
            // (Kukunin nito yung bagong total records at today's count)
            await loadStats();
            
            // STEP 2: I-refresh ang lahat ng tables nang sunod-sunod
            // (Tinitiyak nito na updated na ang array data bago mag-render)
            await loadAllRecords();
            await loadRecentRecords();
            await loadTodayPatients();
            await loadUpcomingPatients();
            
            // STEP 3: (Optional) Kung may reference sa ibang parts, i-refresh din
            if (typeof window.refreshVetUnreadBadge === 'function') {
                window.refreshVetUnreadBadge();
            }
            
        } else {
            showToast('❌ ' + (data.message || 'Error saving record.'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
    
    submitBtn.innerHTML = originalHTML;
    submitBtn.disabled = false;
}

function viewRecordDetails(recordId) {
    const record = allRecords.find(r => r.id === recordId);
    if (!record) {
        alert('Record not found.');
        return;
    }
    
    const statusColors = {
        'active': { bg: 'rgba(123, 160, 91, 0.15)', color: '#5a7a3f', label: 'Active' },
        'resolved': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Resolved' },
        'ongoing': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Ongoing' },
        'follow_up': { bg: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', label: 'Follow-up' }
    };
    const status = statusColors[record.status] || statusColors['active'];
    
    let treatmentDiagnosis = '';
    let treatmentService = '';
    
    if (record.treatment) {
        const diagnosisMatch = record.treatment.match(/\[Diagnosis Treatment\]\s*([^|]+)/);
        const serviceMatch = record.treatment.match(/\[Service Treatment\]\s*(.+)/);
        
        if (diagnosisMatch) {
            treatmentDiagnosis = diagnosisMatch[1].trim();
        }
        if (serviceMatch) {
            treatmentService = serviceMatch[1].trim();
        }
        
        if (!treatmentDiagnosis && !treatmentService) {
            treatmentDiagnosis = record.treatment;
        }
    }
    
    let serviceName = '';
    let cleanNotes = record.notes || '';
    
    if (cleanNotes) {
        const serviceMatch = cleanNotes.match(/\[Service:\s*([^\]]+)\]/);
        if (serviceMatch) {
            serviceName = serviceMatch[1].trim();
            cleanNotes = cleanNotes.replace(/\[Service:\s*[^\]]+\]\s*/, '').trim();
        }
    }
    
    document.getElementById('recordDetailsContent').innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 14px; background: #f7fbf3; border-radius: 10px; border: 1px solid #d4e5c4;">
                <span style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase;">Record ID</span>
                <span style="color: #5a7a3f; font-weight: 700; font-family: monospace;">#${record.id}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-calendar-alt" style="color: #7ba05b;"></i> Visit Date
                </span>
                <span style="color: #2d3e1f; font-weight: 500;">${record.visit_date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-paw" style="color: #7ba05b;"></i> Pet
                </span>
                <span style="color: #2d3e1f; font-weight: 500;">${record.pet_name || 'Unknown'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <span style="color: #94a387; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-user-md" style="color: #7ba05b;"></i> Veterinarian
                </span>
                <span style="color: #2d3e1f; font-weight: 500; font-size: 12px;">${record.vet_email || '—'}</span>
            </div>
            <div style="padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <div style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                    <i class="fas fa-stethoscope" style="color: #7ba05b;"></i> Diagnosis
                </div>
                <div style="color: #2d3e1f; font-weight: 500; line-height: 1.5;">${record.diagnosis}</div>
            </div>
            ${treatmentDiagnosis ? `
            <div style="padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <div style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                    <i class="fas fa-prescription-bottle-medical" style="color: #ef4444;"></i> Treatment Plan for Diagnosis
                </div>
                <div style="line-height: 1.5;">
                    <span style="color: #ef4444; font-weight: 700;">Diagnosis Treatment</span>
                    <span style="color: #2d3e1f;"> ${treatmentDiagnosis}</span>
                </div>
            </div>
            ` : ''}
            ${serviceName ? `
            <div style="padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <div style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                    <i class="fas fa-scissors" style="color: #7ba05b;"></i> Service
                </div>
                <div style="color: #5a7a3f; font-weight: 600; line-height: 1.5;">${serviceName}</div>
            </div>
            ` : ''}
            ${treatmentService ? `
            <div style="padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <div style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                    <i class="fas fa-prescription-bottle-medical" style="color: #3b82f6;"></i> Treatment Plan for Service
                </div>
                <div style="line-height: 1.5;">
                    <span style="color: #3b82f6; font-weight: 700;">Service Treatment</span>
                    <span style="color: #2d3e1f;"> ${treatmentService}</span>
                </div>
            </div>
            ` : ''}
            ${record.prescription ? `
            <div style="padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <div style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                    <i class="fas fa-prescription" style="color: #7ba05b;"></i> Prescription
                </div>
                <div style="color: #2d3e1f; line-height: 1.5;">${record.prescription}</div>
            </div>
            ` : ''}
            ${cleanNotes ? `
            <div style="padding: 8px 0; border-bottom: 1px solid #eaf3e0;">
                <div style="color: #94a387; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">
                    <i class="fas fa-pencil-alt" style="color: #7ba05b;"></i> Notes
                </div>
                <div style="color: #2d3e1f; line-height: 1.5; word-break: break-word;">${cleanNotes}</div>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: ${status.bg}; border-radius: 10px; margin-top: 8px;">
                <span style="color: ${status.color}; font-size: 13px; font-weight: 700;">Status</span>
                <span style="color: ${status.color}; font-weight: 700; font-size: 13px;">${status.label}</span>
            </div>
        </div>
    `;
    
    document.getElementById('viewRecordModal').style.display = 'flex';
    document.getElementById('editFromViewBtn').onclick = () => {
        closeViewRecordModal();
        editRecord(recordId);
    };
}

function closeViewRecordModal() {
    document.getElementById('viewRecordModal').style.display = 'none';
}

async function loadMLRecommendations() {
    const container = document.getElementById('mlRecommendationsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; color: #94a387; padding: 40px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; margin-bottom: 12px;"></i>
            <p>Loading AI recommendations...</p>
        </div>
    `;
    
    try {
        const [recRes, petsRes] = await Promise.all([
            fetch('/api/ml-recommendations'),
            fetch('/api/all-pets')
        ]);
        const data = await recRes.json();
        const petsData = await petsRes.json();
        
        window._allPetsForML = (petsData.success && petsData.pets) ? petsData.pets : [];
        allPetsCache = window._allPetsForML;
        
        if (data.success && data.recommendations && data.recommendations.length > 0) {
            mlRecommendations = data.recommendations;
            renderMLRecommendations();
        } else {
            container.innerHTML = `
                <div style="text-align: center; color: #94a387; padding: 40px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🤖</div>
                    <h3 style="color: #2d3e1f; margin-bottom: 8px;">No Pending Recommendations</h3>
                    <p style="font-size: 13px;">AI recommendations from customer analyses will appear here for your review.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading ML recommendations:', error);
        container.innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 40px;">
                <i class="fas fa-times-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>Error loading recommendations. Please try again.</p>
            </div>
        `;
    }
}

function parseMLData(rec) {
    const result = {
        petName: rec.pet_name || 'Unknown Pet',
        petType: rec.pet_type || 'Dog',
        breed: rec.breed || 'Mixed Breed',
        age: rec.age || '?',
        type: rec.recommendation_type || 'AI Analysis',
        confidence: Math.round((rec.confidence_score || 0) * 100),
        data: null
    };
    
    if (rec.recommendation_text) {
        try {
            let parsed = JSON.parse(rec.recommendation_text);
            
            if (typeof parsed === 'string') {
                try {
                    parsed = JSON.parse(parsed);
                } catch (e) {}
            }
            
            result.data = parsed;
            
            if (parsed && typeof parsed === 'object') {
                if (parsed.pet_name) result.petName = parsed.pet_name;
                if (parsed.health_risk) result.healthRisk = parsed.health_risk;
                if (parsed.vaccine_priority) result.vaccinePriority = parsed.vaccine_priority;
                if (parsed.grooming_frequency) result.groomingFrequency = parsed.grooming_frequency;
                if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
                    result.recommendations = parsed.recommendations;
                }
                if (parsed.prediction_date) result.predictionDate = parsed.prediction_date;
            }
        } catch (e) {
            result.data = rec.recommendation_text;
        }
    }
    
    return result;
}

function searchMLRecommendations() {
    const container = document.getElementById('mlRecommendationsContainer');
    if (!container) return;
    
    const searchInput = document.getElementById('mlSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filteredRecommendations = mlRecommendations;
    
    if (searchTerm) {
        filteredRecommendations = mlRecommendations.filter(rec => {
            const info = parseMLData(rec);
            const petName = (info.petName || '').toLowerCase();
            const petType = (info.petType || '').toLowerCase();
            const breed = (info.breed || '').toLowerCase();
            
            const petForRec = (window._allPetsForML || allPetsCache || []).find(p => p.id === rec.pet_id);
            const ownerEmail = petForRec ? ((petForRec.owner_email || petForRec.customer_email || '').toLowerCase()) : '';
            
            return petName.includes(searchTerm) ||
                   petType.includes(searchTerm) ||
                   breed.includes(searchTerm) ||
                   ownerEmail.includes(searchTerm);
        });
    }
    
    renderMLRecommendations(filteredRecommendations, searchTerm);
}

function renderMLRecommendations(recommendationsToRender, searchTerm = '') {
    const container = document.getElementById('mlRecommendationsContainer');
    if (!container) return;
    
    const listToRender = recommendationsToRender || mlRecommendations;
    
    if (mlRecommendations.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #94a387; padding: 50px 20px; grid-column: 1 / -1; background: #f9fcf6; border-radius: 16px; border: 1px dashed #d4e5c4;">
                <div style="font-size: 56px; margin-bottom: 14px; opacity: 0.7;">🤖</div>
                <h3 style="color: #2d3e1f; margin-bottom: 8px; font-size: 18px;">No Pending Recommendations</h3>
                <p style="font-size: 13px; color: #94a387;">All AI recommendations have been reviewed. Great job! ✨</p>
            </div>
        `;
        return;
    }
    
    if (listToRender.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #94a387; padding: 50px 20px; grid-column: 1 / -1; background: #f9fcf6; border-radius: 16px; border: 1px dashed #d4e5c4;">
                <div style="font-size: 56px; margin-bottom: 14px; opacity: 0.7;"><i class="fas fa-search"></i></div>
                <h3 style="color: #2d3e1f; margin-bottom: 8px; font-size: 18px;">No Matching Recommendations</h3>
                <p style="font-size: 13px; color: #94a387;">Walang nahanap na recommendation para sa "<strong>${searchTerm}</strong>".</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    listToRender.forEach(rec => {
        const info = parseMLData(rec);
        const petIcon = info.petType === 'Cat' ? '<i class="fas fa-cat"></i>' : '<i class="fas fa-dog"></i>';
        const iconColor = info.petType === 'Cat' ? '#f59e0b' : '#7ba05b';
        
        const petForRec = (window._allPetsForML || allPetsCache || []).find(p => p.id === rec.pet_id);
        const petImage = petForRec ? (petForRec.pet_image || '') : '';
        const ownerEmail = petForRec ? (petForRec.owner_email || petForRec.customer_email || '—') : '—';
        
        const validationStatus = rec.status || 'pending';
        let statusBadgeHTML = '';
        
        if (validationStatus === 'pending') {
            statusBadgeHTML = `
                <span class="ml-status-badge pending">
                    <i class="fas fa-clock"></i> Pending
                </span>
            `;
        } else if (validationStatus === 'validated') {
            statusBadgeHTML = `
                <span class="ml-status-badge validated">
                    <i class="fas fa-check-circle"></i> Validated
                </span>
            `;
        } else if (validationStatus === 'rejected') {
            statusBadgeHTML = `
                <span class="ml-status-badge rejected">
                    <i class="fas fa-times-circle"></i> Rejected
                </span>
            `;
        }
        
        let recsHTML = '';
        if (info.recommendations && info.recommendations.length > 0) {
            recsHTML = `
                <ul>
                    ${info.recommendations.map(r => {
                        const textLower = (r || '').toLowerCase();
                        let iconClass = 'fas fa-info-circle';
                        let iconColor = '#7ba05b';
                        let iconBg = 'rgba(123, 160, 91, 0.12)';
                        
                        if (textLower.includes('allerg')) {
                            iconClass = 'fas fa-exclamation-triangle';
                            iconColor = '#ef4444';
                            iconBg = 'rgba(239, 68, 68, 0.12)';
                        } else if (textLower.includes('vaccin')) {
                            iconClass = 'fas fa-syringe';
                            iconColor = '#f59e0b';
                            iconBg = 'rgba(245, 158, 11, 0.12)';
                        } else if (textLower.includes('groom') || textLower.includes('brush') || textLower.includes('coat')) {
                            iconClass = 'fas fa-scissors';
                            iconColor = '#7ba05b';
                            iconBg = 'rgba(123, 160, 91, 0.12)';
                        } else if (textLower.includes('health') || textLower.includes('risk')) {
                            iconClass = 'fas fa-heartbeat';
                            iconColor = '#10b981';
                            iconBg = 'rgba(16, 185, 129, 0.12)';
                        } else if (textLower.includes('senior') || textLower.includes('young')) {
                            iconClass = 'fas fa-paw';
                            iconColor = '#7ba05b';
                            iconBg = 'rgba(123, 160, 91, 0.12)';
                        } else if (textLower.includes('eye clean') || textLower.includes('daily')) {
                            iconClass = 'fas fa-eye';
                            iconColor = '#7ba05b';
                            iconBg = 'rgba(123, 160, 91, 0.12)';
                        } else if (textLower.includes('check-up') || textLower.includes('checkup')) {
                            iconClass = 'fas fa-stethoscope';
                            iconColor = '#10b981';
                            iconBg = 'rgba(16, 185, 129, 0.12)';
                        } else if (textLower.includes('care') || textLower.includes('routine')) {
                            iconClass = 'fas fa-heart';
                            iconColor = '#7ba05b';
                            iconBg = 'rgba(123, 160, 91, 0.12)';
                        } else if (textLower.includes('avoid') || textLower.includes('trigger')) {
                            iconClass = 'fas fa-ban';
                            iconColor = '#ef4444';
                            iconBg = 'rgba(239, 68, 68, 0.12)';
                        }
                        
                        return `
                            <li>
                                <span class="rec-icon" style="background: ${iconBg}; color: ${iconColor};">
                                    <i class="${iconClass}"></i>
                                </span>
                                <span class="rec-text">${r}</span>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        } else if (typeof info.data === 'string') {
            recsHTML = `<div class="summary-line">${info.data}</div>`;
        } else {
            recsHTML = `<div class="summary-line" style="color: #94a387; font-style: italic;">No specific recommendations.</div>`;
        }
        
        let badgesHTML = '';
        if (info.vaccinePriority) {
            const cls = info.vaccinePriority.toLowerCase();
            badgesHTML += `<span class="ml-badge ${cls}"><i class="fas fa-syringe"></i> Vaccine: ${info.vaccinePriority}</span>`;
        }
        if (info.healthRisk) {
            const cls = info.healthRisk.toLowerCase();
            badgesHTML += `<span class="ml-badge ${cls}"><i class="fas fa-heartbeat"></i> Health Risk: ${info.healthRisk}</span>`;
        }
        if (info.groomingFrequency) {
            badgesHTML += `<span class="ml-badge info"><i class="fas fa-scissors"></i> Grooming: ${info.groomingFrequency}</span>`;
        }
        
        let avatarHTML = '';
        if (petImage && petImage.trim() !== '') {
            avatarHTML = `
                <img src="${petImage}" 
                    alt="${info.petName}" 
                    onclick="event.stopPropagation(); openVetImageViewer('${petImage}')">
            `;
        } else {
            avatarHTML = `<div class="pet-emoji-fallback" style="color: ${iconColor};">${petIcon}</div>`;
        }
        
        const div = document.createElement('div');
        div.className = 'ml-rec-card';
        
        div.innerHTML = `
            <div class="ml-rec-header">
                <div class="ml-rec-pet">
                    <div class="pet-avatar-wrapper">
                        ${avatarHTML}
                    </div>
                    <div class="pet-info">
                        <div class="pet-name">${info.petName}</div>
                        <div class="pet-meta">
                            <span>${info.petType}</span>
                            <span class="meta-dot">●</span>
                            <span>${info.breed}</span>
                            <span class="meta-dot">●</span>
                            <span>${info.age} years</span>
                        </div>
                        <div class="pet-owner-email" title="${ownerEmail}">
                            <i class="fas fa-user"></i> ${ownerEmail}
                        </div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; align-items: flex-end; flex-shrink: 0;">
                    ${statusBadgeHTML}
                    <span class="ml-rec-type-badge">
                        <i class="fas fa-robot"></i> ${info.type.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>
            
            <div class="ml-rec-body">
                <div class="label">AI Recommendation</div>
                ${recsHTML}
                ${badgesHTML ? `<div class="ml-rec-badges">${badgesHTML}</div>` : ''}
            </div>
            
            <div class="ml-rec-footer">
                <div class="ml-confidence">
                    <span class="conf-label">Confidence</span>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${info.confidence}%;"></div>
                    </div>
                    <span class="conf-value">${info.confidence}%</span>
                </div>
                <button onclick="showMLReviewModal(${rec.id})" class="btn-sm primary">
                    <i class="fas fa-clipboard-list"></i> Review
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function showMLReviewModal(recId) {
    const rec = mlRecommendations.find(r => r.id === recId);
    if (!rec) return;
    
    currentMLRecord = rec;
    const info = parseMLData(rec);
    const petIcon = info.petType === 'Cat' ? '🐈' : '🐕';
    
    let recsHTML = '';
    if (info.recommendations && info.recommendations.length > 0) {
        recsHTML = `
            <ul>
                ${info.recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
        `;
    } else if (typeof info.data === 'string') {
        recsHTML = `<div class="section-value">${info.data}</div>`;
    } else {
        recsHTML = `<div class="section-value" style="color: #94a387; font-style: italic;">No specific recommendations.</div>`;
    }
    
    let badgesHTML = '';
    if (info.vaccinePriority) {
        const cls = info.vaccinePriority.toLowerCase();
        badgesHTML += `<span class="ml-badge ${cls}"><i class="fas fa-syringe"></i> Vaccine: ${info.vaccinePriority}</span>`;
    }
    if (info.healthRisk) {
        const cls = info.healthRisk.toLowerCase();
        badgesHTML += `<span class="ml-badge ${cls}"><i class="fas fa-heartbeat"></i> Health Risk: ${info.healthRisk}</span>`;
    }
    if (info.groomingFrequency) {
        badgesHTML += `<span class="ml-badge info"><i class="fas fa-scissors"></i> Grooming: ${info.groomingFrequency}</span>`;
    }
    
    document.getElementById('mlModalContent').innerHTML = `
        <div class="ml-modal-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="color: #5a7a3f; font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px;">${petIcon}</span> ${info.petName}
                </span>
                <span style="color: #f59e0b; font-size: 11px; display: flex; align-items: center; gap: 4px;">
                    <i class="fas fa-exclamation-triangle"></i> Requires Validation
                </span>
            </div>
        </div>
        <div class="ml-modal-section">
            <div class="section-label">Patient Info</div>
            <div class="section-value">${info.petType} • ${info.breed} • ${info.age} years</div>
        </div>
        <div class="ml-modal-section">
            <div class="section-label">Type</div>
            <div class="section-value" style="text-transform: capitalize;">${info.type.replace(/_/g, ' ')}</div>
        </div>
        <div class="ml-modal-section">
            <div class="section-label">Recommendation</div>
            ${recsHTML}
        </div>
        ${badgesHTML ? `
        <div class="ml-modal-section">
            <div class="section-label">Health Flags</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">${badgesHTML}</div>
        </div>
        ` : ''}
        <div class="ml-modal-section">
            <div class="section-label">Confidence Score</div>
            <div class="section-value" style="color: #7ba05b; font-weight: 700; font-size: 14px;">${info.confidence}%</div>
        </div>
    `;
    
    document.getElementById('mlVetNotes').value = '';
    document.getElementById('mlModal').style.display = 'flex';
    
    document.getElementById('mlValidateBtn').onclick = () => validateMLRecommendation(recId, 'validated');
    document.getElementById('mlRejectBtn').onclick = () => validateMLRecommendation(recId, 'rejected');
}

async function validateMLRecommendation(recId, status) {
    const vetNotesInput = document.getElementById('mlVetNotes');
    const vetNotes = vetNotesInput ? vetNotesInput.value.trim() : '';
    
    const rec = mlRecommendations.find(r => r.id === recId);
    const petName = rec ? (rec.pet_name || 'this pet') : 'this pet';
    const petType = rec ? (rec.pet_type || 'Dog') : 'Dog';
    const petImage = rec ? (rec.pet_image || '') : '';
    
    const petIcon = petType.toLowerCase() === 'cat' ? 'fa-cat' : 'fa-dog';
    
    const isValidate = status === 'validated';
    const actionColor = isValidate ? '#10b981' : '#ef4444';
    const actionIcon = isValidate ? 'fa-check-circle' : 'fa-times-circle';
    const actionTitle = isValidate ? 'Validate Recommendation?' : 'Reject Recommendation?';
    const actionMessage = isValidate 
        ? 'Sigurado ka bang gusto mong i-validate ang AI recommendation na ito? Ang customer ay makikita na ito bilang <strong>Approved</strong>.' 
        : 'Sigurado ka bang gusto mong i-reject ang AI recommendation na ito? Ang customer ay makikita ito bilang <strong>Not Approved</strong>.';
    const actionButtonText = isValidate ? 'Yes, Validate' : 'Yes, Reject';
    const actionButtonBg = isValidate 
        ? 'linear-gradient(135deg, #10b981, #059669)' 
        : 'linear-gradient(135deg, #ef4444, #dc2626)';
    const actionButtonShadow = isValidate 
        ? '0 4px 15px rgba(16, 185, 129, 0.35)' 
        : '0 4px 15px rgba(239, 68, 68, 0.35)';
    
    let avatarHTML = '';
    if (petImage) {
        avatarHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #f7fbf3; border: 3px solid ${actionColor}; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <img src="${petImage}" alt="${petName}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    } else {
        avatarHTML = `
            <div style="width: 56px; height: 56px; border-radius: 50%; background: ${isValidate ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 3px solid ${actionColor}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 26px; color: ${actionColor};">
                <i class="fas ${petIcon}"></i>
            </div>
        `;
    }
    
    const existingModal = document.getElementById('vetActionConfirmModal');
    if (existingModal) existingModal.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'vetActionConfirmModal';
    overlay.style.zIndex = '4000';
    
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 460px; text-align: center; position: relative;">
            
            <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 24px;
                background: ${isValidate ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
                color: ${actionColor};
                font-size: 36px;
                margin-bottom: 16px;
            ">
                <i class="fas ${actionIcon}"></i>
            </div>
            
            <h3 style="color: #5a7a3f; font-size: 22px; margin: 0 0 10px 0; font-weight: 700;">
                ${actionTitle}
            </h3>
            
            <p style="color: #4a5a3f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                ${actionMessage}
            </p>
            
            <div style="
                background: linear-gradient(135deg, #f7fbf3, #eaf3e0);
                border-radius: 14px;
                padding: 16px 18px;
                border: 1px solid #d4e5c4;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
            ">
                ${avatarHTML}
                <div style="flex: 1; min-width: 0;">
                    <div style="color: #2d3e1f; font-size: 15px; font-weight: 700; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${petName}
                    </div>
                    <div style="color: ${actionColor}; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
                        <i class="fas ${petIcon}"></i> ${petType}
                    </div>
                </div>
            </div>
            
            ${vetNotes ? `
                <div style="
                    background: rgba(123, 160, 91, 0.08);
                    border-left: 3px solid #7ba05b;
                    border-radius: 10px;
                    padding: 10px 14px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <div style="color: #5a7a3f; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                        <i class="fas fa-user-md"></i> Your Notes
                    </div>
                    <div style="color: #2d3e1f; font-size: 12px; line-height: 1.5; word-break: break-word;">
                        ${vetNotes}
                    </div>
                </div>
            ` : ''}
            
            <div class="modal-buttons" style="justify-content: center; gap: 10px;">
                <button type="button" 
                        onclick="window.closeVetActionConfirmModal()"
                        class="modal-btn modal-btn-cancel"
                        style="
                            flex: 1;
                            background: #e2e8f0;
                            color: #475569;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            transition: all 0.25s ease;
                        ">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" 
                        onclick="window.executeValidateMLRecommendation(${recId}, '${status}')"
                        class="modal-btn modal-btn-submit"
                        style="
                            flex: 1;
                            background: ${actionButtonBg};
                            color: #ffffff;
                            padding: 12px 20px;
                            border-radius: 12px;
                            font-weight: 600;
                            cursor: pointer;
                            border: none;
                            font-family: 'Poppins', sans-serif;
                            font-size: 14px;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 6px;
                            box-shadow: ${actionButtonShadow};
                            transition: all 0.25s ease;
                        ">
                    <i class="fas ${actionIcon}"></i> ${actionButtonText}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeVetActionConfirmModal();
        }
    });
    
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeVetActionConfirmModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeVetActionConfirmModal() {
    const modal = document.getElementById('vetActionConfirmModal');
    if (modal) modal.remove();
}

async function executeValidateMLRecommendation(recId, status) {
    console.log('✅ executeValidateMLRecommendation called');
    console.log('   recId:', recId);
    console.log('   status:', status);
    
    closeVetActionConfirmModal();
    
    const vetNotesInput = document.getElementById('mlVetNotes');
    const vetNotes = vetNotesInput ? vetNotesInput.value.trim() : '';
    
    showToast('<i class="fas fa-spinner fa-spin"></i> Processing...', 'info');
    
    try {
        const res = await fetch(`/api/ml-recommendations/${recId}/validate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, vet_notes: vetNotes })
        });
        const data = await res.json();
        
        console.log('📡 Response:', data);
        
        if (data.success) {
            const actionWord = status === 'validated' ? 'validated' : 'rejected';
            const toastIcon = status === 'validated' ? 'fa-check-circle' : 'fa-times-circle';
            const toastType = status === 'validated' ? 'success' : 'error';
            
            showToast(`<i class="fas ${toastIcon}"></i> Recommendation ${actionWord}!`, toastType);
            
            closeMLModal();
            
            loadMLRecommendations();
            loadTodayPatients();
            loadUpcomingPatients();
            loadStats();
        } else {
            showToast(data.message || 'Error validating recommendation.', 'error');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Something went wrong. Please try again.', 'error');
    }
}

function closeMLModal() {
    document.getElementById('mlModal').style.display = 'none';
    currentMLRecord = null;
}

// ═══════════════════════════════════════════════════════════════════
// ✅ VET LOGOUT CONFIRMATION MODAL (Gaya ng admin)
// ═══════════════════════════════════════════════════════════════════

function showVetLogoutModal() {
    // Iwasan ang duplicate
    const existing = document.getElementById('vetLogoutConfirmModal');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'vetLogoutConfirmModal';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(45, 62, 31, 0.55);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        padding: 20px;
        animation: fadeIn 0.25s ease;
        box-sizing: border-box;
    `;
    
    overlay.innerHTML = `
        <div class="modal-popup" style="
            background: #ffffff;
            border-radius: 22px;
            padding: 36px 30px 30px;
            max-width: 440px;
            width: 100%;
            text-align: center;
            border: 1px solid #d4e5c4;
            box-shadow: 0 25px 60px rgba(45, 62, 31, 0.3);
            position: relative;
            animation: slideUp 0.3s ease;
            box-sizing: border-box;
        ">
            <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 76px;
                height: 76px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(123, 160, 91, 0.15), rgba(90, 122, 63, 0.15));
                color: #7ba05b;
                font-size: 34px;
                margin-bottom: 18px;
            ">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            
            <h3 style="
                color: #5a7a3f;
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 12px 0;
                font-family: 'Poppins', sans-serif;
            ">
                Logout Confirmation
            </h3>
            
            <p style="
                color: #64748b;
                font-size: 14.5px;
                line-height: 1.6;
                margin: 0 0 26px 0;
                font-family: 'Poppins', sans-serif;
            ">
                Are you sure you want to logout? You'll need to sign in again to access your veterinarian panel.
            </p>
            
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button type="button" 
                        onclick="closeVetLogoutModal()" 
                        style="
                            flex: 1;
                            padding: 13px 22px;
                            border-radius: 12px;
                            border: none;
                            background: #e2e8f0;
                            color: #475569;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: 'Poppins', sans-serif;
                            transition: all 0.25s ease;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button type="button" 
                        onclick="executeVetLogout()" 
                        style="
                            flex: 1;
                            padding: 13px 22px;
                            border-radius: 12px;
                            border: none;
                            background: linear-gradient(135deg, #ef4444, #dc2626);
                            color: #ffffff;
                            font-size: 14px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: 'Poppins', sans-serif;
                            transition: all 0.25s ease;
                            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.35);
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                    <i class="fas fa-sign-out-alt"></i> Yes, Logout
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Click sa labas para mag-close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeVetLogoutModal();
        }
    });
    
    // ESC key para mag-close
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeVetLogoutModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeVetLogoutModal() {
    const modal = document.getElementById('vetLogoutConfirmModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => modal.remove(), 200);
    }
}

async function executeVetLogout() {
    closeVetLogoutModal();
    
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
        // Kahit mag-fail ang fetch, i-redirect pa rin
        window.location.href = '/';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddRecordModal();
        closeViewRecordModal();
        closeMLModal();
        closeTodayPatientDetails();
        closePetDetailsModal();
        closeVetLogoutModal();
        closeVetImageViewer(e);
        closeVetRecommendationModal();
        closeRemoveConditionConfirmModal();
    }
});

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'addRecordModal') closeAddRecordModal();
        if (e.target.id === 'viewRecordModal') closeViewRecordModal();
        if (e.target.id === 'mlModal') closeMLModal();
        if (e.target.id === 'todayPatientDetailsModal') closeTodayPatientDetails();
        if (e.target.id === 'petDetailsModal') closePetDetailsModal();
        if (e.target.id === 'logoutConfirmModal') closeLogoutModal();
        if (e.target.id === 'vetRecommendationResultModal') closeVetRecommendationModal();
        if (e.target.id === 'vetRecommendationStatusModal') closeVetRecommendationModal();
        if (e.target.id === 'removeConditionConfirmModal') closeRemoveConditionConfirmModal();
    }
});

let vetAllCustomers = [];
let vetFilteredCustomers = [];

function connectVetSocket() {
    if (vetSocket && vetSocket.connected) return;
    
    vetSocket = io();
    
    const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
    if (currentUser) {
        vetSocket.emit('register_user', { email: currentUser });
    }
    
    vetSocket.on('new_message', function(data) {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        if (data.receiver === currentUser) {
            loadVetCustomers();
            loadVetUnreadCount();
            
            if (vetCurrentCustomer && data.sender === vetCurrentCustomer) {
                loadVetConversation(vetCurrentCustomer);
            }
            
            loadStats();
        }
    });
    
    vetSocket.on('connect', function() {
        console.log('Vet connected to WebSocket');
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        if (currentUser) {
            vetSocket.emit('register_user', { email: currentUser });
        }
    });
    
    vetSocket.on('disconnect', function() {
        console.log('Vet disconnected from WebSocket');
        setTimeout(connectVetSocket, 2000);
    });
}

async function loadVetCustomers() {
    const container = document.getElementById('vetCustomerList');
    
    container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #64748b;">
            <i class="fas fa-spinner fa-spin"></i> Loading customers...
        </div>
    `;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        if (!currentUser) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i> Not logged in
                </div>
            `;
            return;
        }
        
        const res = await fetch('/api/messages');
        const data = await res.json();
        
        if (!data.success || !data.messages || data.messages.length === 0) {
            vetAllCustomers = [];
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 10px;"><i class="fas fa-comment"></i></div>
                    <p>No messages from customers yet.</p>
                </div>
            `;
            updateVetSearchCount(0);
            return;
        }
        
        const customerMap = new Map();
        
        data.messages.forEach(msg => {
            const sender = msg.sender_email;
            const receiver = msg.receiver_email;
            
            let customerEmail = null;
            
            if (receiver === currentUser && sender !== currentUser) {
                customerEmail = sender;
            } else if (sender === currentUser && receiver !== currentUser) {
                customerEmail = receiver;
            }
            
            if (!customerEmail) return;
            
            if (!customerMap.has(customerEmail)) {
                customerMap.set(customerEmail, {
                    email: customerEmail,
                    fullname: null,
                    unread_count: 0,
                    last_message_at: null
                });
            }
            
            const entry = customerMap.get(customerEmail);
            
            if (receiver === currentUser && msg.is_read === 0) {
                entry.unread_count++;
            }
            
            const msgDate = msg.created_at ? new Date(msg.created_at) : new Date(0);
            if (!entry.last_message_at || msgDate > new Date(entry.last_message_at)) {
                entry.last_message_at = msg.created_at;
            }
        });
        
        let customers = Array.from(customerMap.values());
        
        if (customers.length === 0) {
            vetAllCustomers = [];
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 10px;"><i class="fas fa-comment"></i></div>
                    <p>No messages from customers yet.</p>
                </div>
            `;
            updateVetSearchCount(0);
            return;
        }
        
        try {
            const usersRes = await fetch('/api/users');
            const usersData = await usersRes.json();
            if (usersData.success && usersData.users) {
                customers.forEach(customer => {
                    const user = usersData.users.find(u => u.email === customer.email);
                    if (user) {
                        customer.fullname = user.fullname || user.email;
                        customer.profile_image = user.profile_image || '';
                    } else {
                        customer.fullname = customer.email;
                        customer.profile_image = '';
                    }
                });
            } else {
                customers.forEach(c => {
                    c.fullname = c.email;
                    c.profile_image = '';
                });
            }
        } catch (err) {
            console.error('Error fetching user names:', err);
            customers.forEach(c => {
                c.fullname = c.email;
                c.profile_image = '';
            });
        }
        
        customers.sort((a, b) => {
            if (a.unread_count > 0 && b.unread_count === 0) return -1;
            if (a.unread_count === 0 && b.unread_count > 0) return 1;
            const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
            const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
            return dateB - dateA;
        });
        
        vetAllCustomers = customers;
        renderVetCustomerList(vetAllCustomers);
        
    } catch (error) {
        console.error('Error loading customers:', error);
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ef4444;">
                <i class="fas fa-times-circle"></i> Error loading customers
            </div>
        `;
    }
}

function renderVetCustomerList(customers) {
    const container = document.getElementById('vetCustomerList');
    const searchInput = document.getElementById('vetMessageSearch');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filtered = customers;
    if (searchTerm) {
        filtered = customers.filter(customer => {
            const name = (customer.fullname || customer.email || '').toLowerCase();
            const email = (customer.email || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm);
        });
    }
    
    filtered = filtered.sort((a, b) => {
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (a.unread_count === 0 && b.unread_count > 0) return 1;
        const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
        const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
        return dateB - dateA;
    });
    
    vetFilteredCustomers = filtered;
    updateVetSearchCount(filtered.length);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="padding: 30px; text-align: center; color: #64748b;">
                <div style="font-size: 32px; margin-bottom: 10px;"><i class="fas fa-search"></i></div>
                <p>No customers found matching your search.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    filtered.forEach(sender => {
        const isActive = vetCurrentCustomer === sender.email;
        const unreadBadge = sender.unread_count > 0 ? 
            `<span class="unread-badge">${sender.unread_count}</span>` : '';
        
        const lastMessageTime = sender.last_message_at ? 
            new Date(sender.last_message_at).toLocaleDateString() : '';
        
        const div = document.createElement('div');
        div.className = `message-item ${isActive ? 'active' : ''}`;
        div.onclick = () => loadVetConversation(sender.email);
        
        div.innerHTML = `
            <div class="avatar" style="background: transparent; padding: 0; width: auto; height: auto;">
                ${renderCustomerAvatar(sender, 35)}
            </div>
            <div class="info">
                <div class="name">${sender.fullname || sender.email}</div>
                <div class="email">${sender.email}</div>
                ${lastMessageTime ? `<div style="color: #94a387; font-size: 10px; margin-top: 2px;">${lastMessageTime}</div>` : ''}
            </div>
            ${unreadBadge}
        `;
        container.appendChild(div);
    });
}

function searchVetMessages() {
    const input = document.getElementById('vetMessageSearch');
    const clearBtn = document.getElementById('vetClearSearchBtn');
    
    if (input) {
        const searchTerm = input.value.trim();
        if (searchTerm !== '') {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
        renderVetCustomerList(vetAllCustomers);
    }
}

function clearVetMessageSearch() {
    const input = document.getElementById('vetMessageSearch');
    const clearBtn = document.getElementById('vetClearSearchBtn');
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        renderVetCustomerList(vetAllCustomers);
        input.focus();
    }
}

function updateVetSearchCount(count) {
    const el = document.getElementById('vetSearchResultCount');
    if (el) {
        el.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
    }
}

function initVetMessageSearch() {
    const searchInput = document.getElementById('vetMessageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchVetMessages);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearVetMessageSearch();
            }
        });
    }
    
    const searchWrapper = document.getElementById('vetSearchWrapper');
    if (searchWrapper) {
        searchWrapper.addEventListener('click', function() {
            const input = document.getElementById('vetMessageSearch');
            if (input) input.focus();
        });
    }
}

async function loadVetConversation(customerEmail) {
    vetCurrentCustomer = customerEmail;
    
    // ✅ MOBILE: I-activate ang slide-in conversation view
    activateVetMobileConversation();
    
    let customerName = customerEmail;
    let customerProfileImage = '';

    try {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
            const user = usersData.users.find(u => u.email === customerEmail);
            if (user) {
                if (user.fullname && user.fullname.trim() !== '') {
                    customerName = user.fullname;
                }
                customerProfileImage = user.profile_image || '';
            }
        }
    } catch (error) {
        console.error('Error fetching customer name:', error);
        customerName = customerEmail;
    }

    document.getElementById('vetConversationHeader').innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 42px; height: 42px; flex-shrink: 0;">
                ${renderCustomerAvatar({ fullname: customerName, email: customerEmail, profile_image: customerProfileImage }, 42)}
            </div>
            <div>
                <div style="color: #2d3e1f; font-weight: 600; font-size: 14px;">${customerName}</div>
                <div style="color: #94a387; font-size: 12px;">${customerEmail}</div>
            </div>
        </div>
    `;
    
    document.getElementById('vetReplyCustomerEmail').value = customerEmail;
    document.getElementById('vetReplyMessage').value = '';
    
    // ✅ Siguraduhing nandiyan ang emoji at image buttons
    addVetMessageButtons();
    
    const container = document.getElementById('vetConversationMessages');
    container.innerHTML = `
        <div style="text-align: center; color: #94a387; padding: 40px;">
            <i class="fas fa-spinner fa-spin"></i> Loading messages...
        </div>
    `;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        const res = await fetch('/api/messages');
        const data = await res.json();
        
        if (!data.success || !data.messages) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    No messages yet.
                </div>
            `;
            return;
        }
        
        const conversation = data.messages.filter(msg => {
            const sender = msg.sender_email;
            const receiver = msg.receiver_email;
            
            return (
                (sender === currentUser && receiver === customerEmail) ||
                (sender === customerEmail && receiver === currentUser)
            );
        });
        
        conversation.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            return dateA - dateB;
        });
        
        if (conversation.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    No messages yet.
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        conversation.forEach(msg => {
            const isVet = msg.sender_email === currentUser;
            const senderName = isVet ? 'Vet' : customerName;
            
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
            
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `
                display: flex;
                flex-direction: column;
                width: 100%;
                margin-bottom: 15px;
                padding: 0;
                box-sizing: border-box;
                align-items: ${isVet ? 'flex-end' : 'flex-start'};
            `;
            
            const bubbleContainer = document.createElement('div');
            bubbleContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                max-width: 78%;
                box-sizing: border-box;
                align-items: ${isVet ? 'flex-end' : 'flex-start'};
                text-align: ${isVet ? 'right' : 'left'};
            `;
            
            const nameEl = document.createElement('div');
            nameEl.style.cssText = `
                font-size: 11px;
                font-weight: 600;
                color: ${isVet ? '#7ba05b' : '#5a7a3f'};
                margin-bottom: 4px;
                padding: 0 4px;
                line-height: 1.2;
                text-align: ${isVet ? 'right' : 'left'};
                width: 100%;
            `;
            nameEl.textContent = senderName;
            
            const bubble = document.createElement('div');
            bubble.style.cssText = `
                display: inline-block;
                padding: 10px 14px;
                border-radius: 14px;
                background: ${isVet ? '#7ba05b' : '#ffffff'};
                color: ${isVet ? '#ffffff' : '#2d3e1f'};
                ${isVet 
                    ? 'border-bottom-right-radius: 4px;' 
                    : 'border-bottom-left-radius: 4px; border: 1px solid #d4e5c4;'}
                font-size: 13.5px;
                line-height: 1.45;
                word-wrap: break-word;
                overflow-wrap: anywhere;
                box-sizing: border-box;
                text-align: left;
                max-width: 100%;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
            `;
            
            let bubbleContent = '';
            
            if (messageText) {
                bubbleContent += `<div style="font-size: 13.5px; line-height: 1.45; word-wrap: break-word; overflow-wrap: anywhere; color: ${isVet ? '#ffffff' : '#2d3e1f'};">${messageText}</div>`;
            }
            
            if (imageData && imageData.startsWith('data:image')) {
                bubbleContent += `
                    <div style="margin-top: 6px;">
                        <img src="${imageData}" 
                             style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #d4e5c4; display: block;" 
                             onclick="openVetImageViewer('${imageData}')"
                             alt="Image">
                    </div>
                `;
            }
            
            bubble.innerHTML = bubbleContent;
            
            const timeEl = document.createElement('div');
            timeEl.style.cssText = `
                font-size: 10px;
                color: #94a387;
                margin-top: 4px;
                padding: 0 4px;
                line-height: 1.2;
                text-align: ${isVet ? 'right' : 'left'};
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
        
        try {
            await fetch('/api/messages/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: customerEmail })
            });
        } catch (readErr) {
            console.warn('Could not mark messages as read:', readErr);
        }
        
        const customerEntry = vetAllCustomers.find(c => c.email === customerEmail);
        if (customerEntry) {
            customerEntry.unread_count = 0;
        }
        
        renderVetCustomerList(vetAllCustomers);
        await loadVetUnreadCount();
        await loadStats();
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        container.innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 40px;">
                <i class="fas fa-times-circle"></i> Error loading messages
            </div>
        `;
    }
}

function openVetImageViewer(imageSrc) {
    const viewer = document.getElementById('vetImageViewer');
    const img = document.getElementById('vetViewerImage');
    if (!viewer || !img) return;
    
    img.src = imageSrc;
    viewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVetImageViewer(event) {
    if (!event || event.target.id === 'vetImageViewer' || event.target.classList.contains('close-viewer')) {
        const viewer = document.getElementById('vetImageViewer');
        if (viewer && viewer.style.display === 'flex') {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ DAGDAG: Emoji at Photo Buttons sa Vet Reply Form
// ═══════════════════════════════════════════════════════════════════
function addVetMessageButtons() {
    const replyForm = document.getElementById('vetReplyForm');
    if (!replyForm) return;
    
    // ⚠️ Guard: Kung naidagdag na, huwag na ulitin
    if (document.getElementById('vetEmojiBtn')) return;
    
    const input = document.getElementById('vetReplyMessage');
    const sendBtn = replyForm.querySelector('button[type="submit"]');
    
    if (!input || !sendBtn) return;
    
    // ── Create wrapper para sa 2 buttons ──────────────────────────
    const btnContainer = document.createElement('div');
    btnContainer.id = 'vetReplyBtnContainer';
    btnContainer.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
        flex-shrink: 0;
    `;
    
    // ── EMOJI BUTTON ───────────────────────────────────────────────
    const emojiBtn = document.createElement('button');
    emojiBtn.id = 'vetEmojiBtn';
    emojiBtn.type = 'button';
    emojiBtn.className = 'reply-action-btn';
    emojiBtn.innerHTML = '<i class="fas fa-smile"></i>';
    emojiBtn.title = 'Insert Emoji';
    emojiBtn.setAttribute('aria-label', 'Insert Emoji');
    emojiBtn.onclick = function(e) {
        e.preventDefault();
        toggleVetEmojiPicker();
    };
    
    // ── IMAGE BUTTON ───────────────────────────────────────────────
    const imageBtn = document.createElement('button');
    imageBtn.id = 'vetImageBtn';
    imageBtn.type = 'button';
    imageBtn.className = 'reply-action-btn';
    imageBtn.innerHTML = '<i class="fas fa-image"></i>';
    imageBtn.title = 'Upload Image';
    imageBtn.setAttribute('aria-label', 'Upload Image');
    imageBtn.onclick = function(e) {
        e.preventDefault();
        showVetImageUploadModal();
    };
    
    // ── I-insert ang buttons BAGO ang send button ─────────────────
    const parent = sendBtn.parentNode;
    parent.insertBefore(btnContainer, sendBtn);
    btnContainer.appendChild(emojiBtn);
    btnContainer.appendChild(imageBtn);
}

// ═══════════════════════════════════════════════════════════════════
// ✅ DAGDAG: Emoji Picker Toggle para sa Vet
// ═══════════════════════════════════════════════════════════════════
let vetEmojiPickerVisible = false;

function toggleVetEmojiPicker() {
    let picker = document.getElementById('vetEmojiPicker');
    
    // ── Kung wala pa, gumawa ──────────────────────────────────────
    if (!picker) {
        createVetEmojiPicker();
        picker = document.getElementById('vetEmojiPicker');
        if (!picker) return;
    }
    
    vetEmojiPickerVisible = !vetEmojiPickerVisible;
    
    if (vetEmojiPickerVisible) {
        picker.style.display = 'flex';
    } else {
        picker.style.display = 'none';
    }
}

function createVetEmojiPicker() {
    // Iwasan ang duplicate
    if (document.getElementById('vetEmojiPicker')) return;
    
    const replyForm = document.getElementById('vetReplyForm');
    if (!replyForm) return;
    
    const footer = replyForm.parentElement;
    if (!footer) return;
    
    footer.style.position = 'relative';
    
    const picker = document.createElement('div');
    picker.id = 'vetEmojiPicker';
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
        max-width: calc(100vw - 40px);
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
        btn.type = 'button';
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
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;
        btn.onmouseover = () => { 
            btn.style.background = '#f7fbf3';
            btn.style.borderColor = '#7ba05b';
            btn.style.transform = 'scale(1.1)';
        };
        btn.onmouseout = () => { 
            btn.style.background = '#ffffff';
            btn.style.borderColor = '#d4e5c4';
            btn.style.transform = 'scale(1)';
        };
        btn.onclick = () => insertVetEmoji(emoji);
        picker.appendChild(btn);
    });
    
    footer.appendChild(picker);
}

function insertVetEmoji(emoji) {
    const input = document.getElementById('vetReplyMessage');
    if (!input) return;
    
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + emoji.length;
    
    // Auto-hide picker pagkatapos pumili
    if (vetEmojiPickerVisible) {
        toggleVetEmojiPicker();
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ DAGDAG: Image Upload Modal para sa Vet
// ═══════════════════════════════════════════════════════════════════
let vetPendingImage = null;

function showVetImageUploadModal() {
    let modal = document.getElementById('vetImageUploadModal');
    
    // ── Kung wala pa, gumawa ──────────────────────────────────────
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'vetImageUploadModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(45, 62, 31, 0.5);
            backdrop-filter: blur(6px);
            align-items: center;
            justify-content: center;
            z-index: 3000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div class="modal-popup" style="max-width: 450px; position: relative;">
                <button type="button" class="modal-close-x" onclick="closeVetImageUploadModal()" title="Close">✕</button>
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-image"></i></div>
                    <h3 style="color: #5a7a3f; font-size: 22px; margin: 0;">Upload Image</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Share a photo with your message</p>
                </div>
                
                <div style="background: #f7fbf3; border-radius: 12px; padding: 30px; border: 2px dashed #d4e5c4; text-align: center; cursor: pointer; transition: 0.3s;" 
                     id="vetImageUploadDropzone"
                     onclick="document.getElementById('vetImageUploadInput').click()">
                    <div style="font-size: 48px; margin-bottom: 10px; color: #7ba05b;"><i class="fas fa-cloud-upload-alt"></i></div>
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Click to upload image</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="vetImageUploadInput" accept="image/*" style="display: none;">
                
                <div id="vetImagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="vetImagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="closeVetImageUploadModal()" style="flex: 1;">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="modal-btn modal-btn-submit" onclick="sendVetImageMessage()" id="vetSendImageBtn" style="flex: 1;">
                            <i class="fas fa-paper-plane"></i> Send Image
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ── Event listeners ─────────────────────────────────────────
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeVetImageUploadModal();
        });
        
        const fileInput = document.getElementById('vetImageUploadInput');
        fileInput.addEventListener('change', function(e) {
            previewVetImage(e);
        });
        
        const dropzone = document.getElementById('vetImageUploadDropzone');
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
                document.getElementById('vetImageUploadInput').files = files;
                previewVetImage({ target: { files: files } });
            }
        });
    }
    
    // ── Reset state ───────────────────────────────────────────────
    document.getElementById('vetImagePreviewContainer').style.display = 'none';
    document.getElementById('vetImageUploadInput').value = '';
    document.getElementById('vetSendImageBtn').disabled = false;
    document.getElementById('vetSendImageBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
    vetPendingImage = null;
    
    modal.style.display = 'flex';
}

function closeVetImageUploadModal() {
    const modal = document.getElementById('vetImageUploadModal');
    if (modal) modal.style.display = 'none';
    vetPendingImage = null;
}

function previewVetImage(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        document.getElementById('vetImageUploadInput').value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image is too large. Please upload under 5MB.', 'error');
        document.getElementById('vetImageUploadInput').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('vetImagePreview');
        preview.src = e.target.result;
        document.getElementById('vetImagePreviewContainer').style.display = 'block';
        vetPendingImage = {
            data: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
        };
    };
    reader.readAsDataURL(file);
}

async function sendVetImageMessage() {
    const imageData = vetPendingImage;
    if (!imageData) {
        showToast('Please select an image first.', 'error');
        return;
    }
    
    const customerEmail = document.getElementById('vetReplyCustomerEmail').value;
    if (!customerEmail) {
        showToast('Please select a customer first.', 'error');
        return;
    }
    
    const btn = document.getElementById('vetSendImageBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
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
            showToast('✅ Image sent successfully!', 'success');
            closeVetImageUploadModal();
            
            // Reload conversation
            await loadVetConversation(customerEmail);
            await loadVetCustomers();
            await loadVetUnreadCount();
            
            // Notify via socket
            if (vetSocket && vetSocket.connected) {
                vetSocket.emit('send_message', {
                    sender: currentUser,
                    receiver: customerEmail,
                    message: '📷 Image',
                    subject: '📷 Image',
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    image_data: imageData.data
                });
            }
        } else {
            showToast('❌ ' + (data.message || 'Error sending image.'), 'error');
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error sending image:', error);
        showToast('Something went wrong. Please try again.', 'error');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
        btn.disabled = false;
    }
}

async function sendVetReply(e) {
    e.preventDefault();
    
    const customerEmail = document.getElementById('vetReplyCustomerEmail').value;
    const message = document.getElementById('vetReplyMessage').value.trim();
    
    if (!message) {
        const input = document.getElementById('vetReplyMessage');
        input.style.borderColor = '#ef4444';
        input.placeholder = 'Please enter a message';
        setTimeout(() => {
            input.style.borderColor = '#d4e5c4';
            input.placeholder = 'Type your reply...';
        }, 2000);
        return;
    }
    
    if (!customerEmail) {
        alert('Please select a customer first.');
        return;
    }
    
    const btn = document.querySelector('#vetReplyForm button[type="submit"]');
    
    // ✅ Save ang original innerHTML para ma-restore
    const originalBtnHTML = '<i class="fas fa-paper-plane"></i>';
    
    // ✅ Show loading spinner
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        if (vetSocket && vetSocket.connected) {
            vetSocket.emit('send_message', {
                sender: currentUser,
                receiver: customerEmail,
                message: message,
                subject: 'Vet Reply',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
        }
        
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                subject: 'Vet Reply',
                message: message,
                receiver: customerEmail
            })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('vetReplyMessage').value = '';
            await loadVetConversation(customerEmail);
            await loadVetCustomers();
            await loadVetUnreadCount();
            await loadStats();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    } finally {
        // ✅ LAGING i-restore ang send button kahit anong mangyari
        btn.innerHTML = originalBtnHTML;
        btn.disabled = false;
    }
}

async function loadVetUnreadCount() {
    try {
        const res = await fetch('/api/messages/unread-count');
        const data = await res.json();
        
        const badge = document.getElementById('vetUnreadBadge');
        const display = document.getElementById('vetUnreadDisplay');
        
        if (data.count > 0) {
            if (badge) {
                badge.textContent = data.count;
                badge.classList.add('show');
            }
            if (display) display.textContent = `${data.count} unread`;
        } else {
            if (badge) {
                badge.textContent = '0';
                badge.classList.remove('show');
            }
            if (display) display.textContent = '0 unread';
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

async function refreshVetUnreadBadge() {
    try {
        const res = await fetch('/api/messages/unread-count');
        const data = await res.json();
        
        const badge = document.getElementById('vetUnreadBadge');
        if (!badge) return;
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.classList.add('show');
            badge.style.display = 'inline-block';
        } else {
            badge.textContent = '0';
            badge.classList.remove('show');
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error refreshing unread badge:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadTodayPatients();
    loadUpcomingPatients();
    loadRecentRecords();
    initVetMessageSearch();
    refreshVetUnreadBadge();
    
    setInterval(refreshVetUnreadBadge, 30000);
    
    const searchPatientInput = document.getElementById('searchPatient');
    if (searchPatientInput) {
        searchPatientInput.addEventListener('input', function(e) {
            searchPatients(e.target.value);
        });
    }
    
    const recordSearchInput = document.getElementById('recordSearchInput');
    if (recordSearchInput) {
        recordSearchInput.addEventListener('input', function(e) {
            searchRecords(e.target.value);
        });
    }
    
    // ✅ ML Recommendations Search Bar Event Listener
    const mlSearchInput = document.getElementById('mlSearchInput');
    if (mlSearchInput) {
        mlSearchInput.addEventListener('input', function(e) {
            searchMLRecommendations();
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// ✅ MOBILE SIDEBAR TOGGLE
// ═══════════════════════════════════════════════════════════════════
function toggleVetMobileSidebar() {
    const sidebar = document.querySelector('.vet-sidebar');
    const overlay = document.getElementById('vetSidebarOverlay');
    
    if (!sidebar) return;
    
    sidebar.classList.toggle('mobile-open');
    if (overlay) overlay.classList.toggle('active');
    
    // Prevent body scroll kapag bukas ang sidebar
    if (sidebar.classList.contains('mobile-open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeVetMobileSidebar() {
    const sidebar = document.querySelector('.vet-sidebar');
    const overlay = document.getElementById('vetSidebarOverlay');
    
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ✅ Auto-close sidebar kapag clinick ang nav link sa mobile
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.vet-sidebar');
    if (!sidebar) return;
    
    // I-close ang sidebar kapag clinick ang nav link
    sidebar.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeVetMobileSidebar();
            }
        });
    });
    
    // I-close kapag nag-resize pabalik sa desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeVetMobileSidebar();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// ✅ MOBILE MESSAGES — Slide-in / Slide-out Logic (ROBUST VERSION)
// ═══════════════════════════════════════════════════════════════════

// ── Helper: Kunin ang messages grid wrapper ───────────────────────
function getVetMessagesGrid() {
    return document.querySelector('#tabMessages .card > div[style*="grid-template-columns: 300px 1fr"]');
}

// ── Activate conversation view (slide-in) ─────────────────────────
function activateVetMobileConversation() {
    const grid = getVetMessagesGrid();
    if (grid && window.innerWidth <= 768) {
        grid.classList.add('has-active-conversation');
        console.log('✅ Conversation view activated');
    }
}

// ── Deactivate conversation view (slide-out / back to list) ───────
function deactivateVetMobileConversation() {
    const grid = getVetMessagesGrid();
    if (grid) {
        grid.classList.remove('has-active-conversation');
        console.log('✅ Conversation view deactivated');
    }
}

// ═══════════════════════════════════════════════════════════════════
// ✅ GLOBAL CLICK HANDLER — Delegation Pattern
//    Gumagana ito kahit dynamic ang rendering ng customer list
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('click', function(e) {
    // ═══════════════════════════════════════════════════════════════
    // 1. CUSTOMER CLICK — I-activate ang conversation view
    // ═══════════════════════════════════════════════════════════════
    const messageItem = e.target.closest('#vetCustomerList .message-item');
    
    if (messageItem && window.innerWidth <= 768) {
        console.log('🖱️ Customer clicked — activating conversation view');
        
        // Small delay para matapos muna ang loadVetConversation()
        setTimeout(() => {
            activateVetMobileConversation();
        }, 100);
        
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 2. BACK BUTTON CLICK — I-deactivate ang conversation view
    // ═══════════════════════════════════════════════════════════════
    const header = document.getElementById('vetConversationHeader');
    
    if (header && header.contains(e.target) && window.innerWidth <= 768) {
        const rect = header.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Kapag clinick ang leftmost 60px (back button area)
        if (clickX <= 60) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Back button clicked — deactivating');
            deactivateVetMobileConversation();
            return;
        }
    }
});

// ═══════════════════════════════════════════════════════════════════
// ✅ RESIZE HANDLER — I-deactivate kapag pabalik sa desktop
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        deactivateVetMobileConversation();
    }
});

// ═══════════════════════════════════════════════════════════════════
// ✅ TAB CHANGE HANDLER — I-deactivate kapag lumipat ng tab
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    // Observe ang sidebar nav clicks
    const sidebar = document.querySelector('.vet-sidebar');
    if (sidebar) {
        sidebar.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link) {
                deactivateVetMobileConversation();
            }
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
// ✅ KEYBOARD ESC — I-deactivate kapag pinindot ang ESC key
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && window.innerWidth <= 768) {
        deactivateVetMobileConversation();
    }
});

// ✅ Auto-resize textareas sa Add Medical Record Modal
document.addEventListener('DOMContentLoaded', function() {
    const textareas = ['recordTreatmentDiagnosis', 'recordService', 'recordTreatmentService', 'recordPrescription', 'recordNotes'];
    
    textareas.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// ✅ EXPOSE VET LOGOUT FUNCTIONS SA WINDOW
// ═══════════════════════════════════════════════════════════════════
window.showVetLogoutModal = showVetLogoutModal;
window.closeVetLogoutModal = closeVetLogoutModal;
window.executeVetLogout = executeVetLogout;

// ✅ Expose sa window
window.toggleVetMobileSidebar = toggleVetMobileSidebar;
window.closeVetMobileSidebar = closeVetMobileSidebar;
window.activateVetMobileConversation = activateVetMobileConversation;
window.deactivateVetMobileConversation = deactivateVetMobileConversation;

// ✅ Expose emoji at image functions
window.addVetMessageButtons = addVetMessageButtons;
window.toggleVetEmojiPicker = toggleVetEmojiPicker;
window.insertVetEmoji = insertVetEmoji;
window.showVetImageUploadModal = showVetImageUploadModal;
window.closeVetImageUploadModal = closeVetImageUploadModal;
window.previewVetImage = previewVetImage;
window.sendVetImageMessage = sendVetImageMessage;

window.showToast = showToast;
window.showTab = showTab;
window.loadStats = loadStats;
window.loadTodayPatients = loadTodayPatients;
window.loadRecentRecords = loadRecentRecords;
window.loadAllPatients = loadAllPatients;
window.loadAllRecords = loadAllRecords;
window.renderRecordsTable = renderRecordsTable;
window.searchRecords = searchRecords;
window.searchPatients = searchPatients;
window.viewPetRecords = viewPetRecords;
window.clearPetFilter = clearPetFilter;
window.showAddRecordModal = showAddRecordModal;
window.showAddRecordModalForPet = showAddRecordModalForPet;
window.closeAddRecordModal = closeAddRecordModal;
window.submitRecord = submitRecord;
window.editRecord = editRecord;
window.viewRecordDetails = viewRecordDetails;
window.closeViewRecordModal = closeViewRecordModal;

window.confirmLogout = confirmLogout;
window.closeLogoutModal = closeLogoutModal;
window.executeLogout = executeLogout;

window.loadVetCustomers = loadVetCustomers;
window.loadVetConversation = loadVetConversation;
window.sendVetReply = sendVetReply;
window.loadVetUnreadCount = loadVetUnreadCount;
window.connectVetSocket = connectVetSocket;
window.openVetImageViewer = openVetImageViewer;
window.closeVetImageViewer = closeVetImageViewer;
window.searchVetMessages = searchVetMessages;
window.clearVetMessageSearch = clearVetMessageSearch;
window.initVetMessageSearch = initVetMessageSearch;
window.renderVetCustomerList = renderVetCustomerList;

window.loadMLRecommendations = loadMLRecommendations;
window.showMLReviewModal = showMLReviewModal;
window.validateMLRecommendation = validateMLRecommendation;
window.closeMLModal = closeMLModal;
window.searchMLRecommendations = searchMLRecommendations;

window.showTodayPatientDetails = showTodayPatientDetails;
window.closeTodayPatientDetails = closeTodayPatientDetails;
window.addRecordFromToday = addRecordFromToday;
window.editRecordFromToday = editRecordFromToday;

window.showPetDetailsModal = showPetDetailsModal;
window.closePetDetailsModal = closePetDetailsModal;

window.showPetRecommendationFromToday = showPetRecommendationFromToday;
window.closeVetRecommendationModal = closeVetRecommendationModal;
window.validateVetRecommendation = validateVetRecommendation;
window.rejectVetRecommendation = rejectVetRecommendation;

window.renderPetAvatar = renderPetAvatar;
window.renderCustomerAvatar = renderCustomerAvatar;

window.refreshVetUnreadBadge = refreshVetUnreadBadge;

window.showVetSmartCareConfirmModal = showVetSmartCareConfirmModal;
window.closeVetSmartCareConfirmModal = closeVetSmartCareConfirmModal;
window.executeVetSmartCareAction = executeVetSmartCareAction;

window.closeVetActionConfirmModal = closeVetActionConfirmModal;
window.executeValidateMLRecommendation = executeValidateMLRecommendation;

window.loadPetFullDetailsForRecord = loadPetFullDetailsForRecord;
window.resetAutoFilledSections = resetAutoFilledSections;

window.removeMedicalHistoryRow = removeMedicalHistoryRow;
window.addNewMedicalHistoryRow = addNewMedicalHistoryRow;
window.saveMedicalHistoryChanges = saveMedicalHistoryChanges;
window.closeRemoveConditionConfirmModal = closeRemoveConditionConfirmModal;

window.loadUpcomingPatients = loadUpcomingPatients;
window.showUpcomingPatientDetails = showUpcomingPatientDetails;