// ── Tab Navigation ────────────────────────────────────────────────
let vetCurrentCustomer = null;
let vetSocket = null;

function showTab(tab) {
    // Hide all tabs
    document.getElementById('tabDashboard').style.display = 'none';
    document.getElementById('tabPatients').style.display = 'none';
    document.getElementById('tabMedical').style.display = 'none';
    document.getElementById('tabML').style.display = 'none';
    document.getElementById('tabMessages').style.display = 'none';
    
    // Remove active class from all nav links
    document.querySelectorAll('.vet-sidebar a').forEach(a => a.classList.remove('active'));
    
    // Show selected tab
    if (tab === 'dashboard') {
        document.getElementById('tabDashboard').style.display = 'block';
        document.getElementById('navDashboard').classList.add('active');
        loadStats();
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
    } else if (tab === 'messages') {
        document.getElementById('tabMessages').style.display = 'block';
        document.getElementById('navMessages').classList.add('active');
        loadVetCustomers();
        loadVetUnreadCount();
        connectVetSocket();
    }
}

// ── Load Statistics ──────────────────────────────────────────────
async function loadStats() {
    try {
        const res = await fetch('/api/pets');
        const data = await res.json();
        if (data.success) {
            document.getElementById('totalPets').textContent = data.pets.length;
            document.getElementById('todayPatients').textContent = '3';
            document.getElementById('dueVaccines').textContent = '5';
            document.getElementById('pendingML').textContent = '2';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
    
    // Load unread count for stats
    try {
        const unreadRes = await fetch('/api/messages/unread-count');
        const unreadData = await unreadRes.json();
        if (unreadData.success) {
            document.getElementById('unreadMessages').textContent = unreadData.count;
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

// ── Load All Patients ─────────────────────────────────────────────
async function loadAllPatients() {
    try {
        const res = await fetch('/api/all-pets');
        const data = await res.json();
        const tbody = document.getElementById('allPatientsTable');
        
        if (data.success && data.pets.length > 0) {
            tbody.innerHTML = '';
            data.pets.forEach(pet => {
                const petType = pet.pet_type || 'Dog';
                const petIcon = petType === 'Cat' ? '🐈' : '🐕';
                const typeClass = petType === 'Cat' ? 'cat' : 'dog';
                const statusClass = pet.medical_history ? 'warning' : 'healthy';
                const statusText = pet.medical_history ? '⚠️ Needs Attention' : '✅ Healthy';
                const isGuest = pet.is_guest || false;
                const guestLabel = isGuest ? '🟡 Guest' : '👤 Registered';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${pet.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${pet.pet_image ? 
                                `<img src="${pet.pet_image}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">` : 
                                `<span style="font-size: 20px;">${petIcon}</span>`
                            }
                            <strong>${pet.name}</strong>
                            <span style="font-size: 10px; color: #64748b;">${guestLabel}</span>
                        </div>
                    </td>
                    <td><span class="pet-type-badge ${typeClass}">${petType}</span></td>
                    <td>${pet.breed || '—'}</td>
                    <td>${pet.age || '—'} years</td>
                    <td><span class="truncate" title="${pet.owner_email}">${pet.owner_email}</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-sm primary" onclick="viewPetMedical(${pet.id})">📋 Records</button>
                            <button class="btn-sm success" onclick="showAddRecordModalForPet(${pet.id})">➕ Add</button>
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
    }
}

// ── Load All Records ──────────────────────────────────────────────
async function loadAllRecords() {
    const tbody = document.getElementById('allRecordsTable');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; color: #64748b; padding: 30px;">
                Loading medical records...
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch('/api/medical-records');
        const data = await res.json();
        
        if (data.success && data.records && data.records.length > 0) {
            tbody.innerHTML = '';
            data.records.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.visit_date}</td>
                    <td>🐕 ${record.pet_name}</td>
                    <td>${record.vet_email}</td>
                    <td>${record.diagnosis}</td>
                    <td>${record.treatment || '—'}</td>
                    <td><button class="btn-sm outline" onclick="alert('📋 Record Details:\\nDate: ${record.visit_date}\\nPet: ${record.pet_name}\\nDiagnosis: ${record.diagnosis}\\nTreatment: ${record.treatment}\\nPrescription: ${record.prescription || 'None'}\\nNotes: ${record.notes || 'None'}')">View</button></td>
                `;
                tbody.appendChild(row);
            });
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
                    ❌ Error loading records
                </td>
            </tr>
        `;
    }
}

// ── Load Pets for Dropdown ────────────────────────────────────────
async function loadPetsForDropdown() {
    try {
        const res = await fetch('/api/pets');
        const data = await res.json();
        if (data.success) {
            const select = document.getElementById('recordPet');
            select.innerHTML = '<option value="">Choose a pet...</option>';
            data.pets.forEach(pet => {
                const option = document.createElement('option');
                option.value = pet.id;
                const petType = pet.pet_type || 'Dog';
                const petIcon = petType === 'Cat' ? '🐈' : '🐕';
                option.textContent = `${petIcon} ${pet.name} (${pet.breed || 'Mixed Breed'})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

// ── Add Record Modal ──────────────────────────────────────────────
function showAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'flex';
    loadPetsForDropdown();
    document.getElementById('recordForm').reset();
    document.getElementById('recordDate').valueAsDate = new Date();
}

function showAddRecordModalForPet(petId) {
    showAddRecordModal();
    // Could pre-select the pet if needed
}

function closeAddRecordModal() {
    document.getElementById('addRecordModal').style.display = 'none';
}

async function submitRecord(e) {
    e.preventDefault();
    const pet_id = document.getElementById('recordPet').value;
    const visit_date = document.getElementById('recordDate').value;
    const diagnosis = document.getElementById('recordDiagnosis').value.trim();
    const treatment = document.getElementById('recordTreatment').value.trim();
    const prescription = document.getElementById('recordPrescription').value.trim();
    const notes = document.getElementById('recordNotes').value.trim();
    
    if (!pet_id || !visit_date || !diagnosis) {
        alert('Please fill in all required fields.');
        return;
    }
    
    try {
        const res = await fetch('/api/medical-records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_id, visit_date, diagnosis, treatment, prescription, notes })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('✅ Medical record saved successfully!');
            closeAddRecordModal();
            loadAllRecords();
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
}

// ── ML Modal ──────────────────────────────────────────────────────
function showMLModal() {
    document.getElementById('mlModal').style.display = 'flex';
}

function closeMLModal() {
    document.getElementById('mlModal').style.display = 'none';
}

// ── View Pet Medical Records ──────────────────────────────────────
function viewPetMedical(petId) {
    alert(`📋 Viewing medical records for pet ID: ${petId}\n\nThis feature will display the complete medical history.`);
    showTab('medical');
}

// ── Search Patients ───────────────────────────────────────────────
document.getElementById('searchPatient')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#allPatientsTable tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
});

// ── Logout ────────────────────────────────────────────────────────
async function confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
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
}

// ── Close modals on ESC ──────────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddRecordModal();
        closeMLModal();
    }
});

// ── Click outside modal to close ─────────────────────────────────
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeAddRecordModal();
        closeMLModal();
    }
});

// ── VET MESSAGES WITH SEARCH ────────────────────────────────────────

// ── VET MESSAGES SEARCH VARIABLES ──────────────────────────────────
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
            
            // Update stats badge
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

// ── Load Vet Customers with Search Support ──────────────────────
async function loadVetCustomers() {
    const container = document.getElementById('vetCustomerList');
    
    container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #64748b;">
            ⏳ Loading customers...
        </div>
    `;
    
    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        
        if (data.success && data.senders && data.senders.length > 0) {
            vetAllCustomers = data.senders;
            renderVetCustomerList(vetAllCustomers);
        } else {
            vetAllCustomers = [];
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 10px;">💬</div>
                    <p>No messages from customers yet.</p>
                </div>
            `;
            updateVetSearchCount(0);
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

// ── Render Vet Customer List with Search ──────────────────────────
function renderVetCustomerList(customers) {
    const container = document.getElementById('vetCustomerList');
    const searchInput = document.getElementById('vetMessageSearch');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    // Filter if search term exists
    let filtered = customers;
    if (searchTerm) {
        filtered = customers.filter(customer => {
            const name = (customer.fullname || customer.email || '').toLowerCase();
            const email = (customer.email || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm);
        });
    }
    
    vetFilteredCustomers = filtered;
    updateVetSearchCount(filtered.length);
    
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
        const isActive = vetCurrentCustomer === sender.email;
        const unreadBadge = sender.unread_count > 0 ? 
            `<span class="unread-badge">${sender.unread_count}</span>` : '';
        
        const div = document.createElement('div');
        div.className = `message-item ${isActive ? 'active' : ''}`;
        div.onclick = () => loadVetConversation(sender.email);
        
        div.innerHTML = `
            <div class="avatar">👤</div>
            <div class="info">
                <div class="name">${sender.fullname || sender.email}</div>
                <div class="email">${sender.email}</div>
            </div>
            ${unreadBadge}
        `;
        container.appendChild(div);
    });
}

// ── Search Vet Messages ────────────────────────────────────────────
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

// ── Clear Vet Message Search ──────────────────────────────────────
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

// ── Update Vet Search Result Count ─────────────────────────────────
function updateVetSearchCount(count) {
    const el = document.getElementById('vetSearchResultCount');
    if (el) {
        el.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
    }
}

// ── Init Vet Message Search ────────────────────────────────────────
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

// ── LOAD VET CONVERSATION (UPDATED - re-renders list after loading) ──
async function loadVetConversation(customerEmail) {
    vetCurrentCustomer = customerEmail;
    
    // ── FETCH CUSTOMER FULL NAME ──────────────────────────────────
    let customerName = customerEmail;
    try {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        if (usersData.success) {
            const user = usersData.users.find(u => u.email === customerEmail);
            if (user && user.fullname && user.fullname.trim() !== '') {
                customerName = user.fullname;
            }
        }
    } catch (error) {
        console.error('Error fetching customer name:', error);
        customerName = customerEmail;
    }
    
    document.getElementById('vetConversationHeader').innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">👤</span>
            <div>
                <div style="color: #e2e8f0; font-weight: 500;">${customerName}</div>
                <div style="color: #64748b; font-size: 12px;">${customerEmail}</div>
            </div>
        </div>
    `;
    
    document.getElementById('vetReplyCustomerEmail').value = customerEmail;
    document.getElementById('vetReplyMessage').value = '';
    document.getElementById('vetReplyMessage').placeholder = 'Type your reply...';
    
    try {
        const res = await fetch(`/api/messages/${customerEmail}`);
        const data = await res.json();
        
        const container = document.getElementById('vetConversationMessages');
        
        if (data.success && data.messages && data.messages.length > 0) {
            container.innerHTML = '';
            
            data.messages.forEach(msg => {
                const isVet = msg.sender_email === customerEmail ? false : true;
                
                const div = document.createElement('div');
                div.style.cssText = `
                    display: flex;
                    justify-content: ${isVet ? 'flex-end' : 'flex-start'};
                    margin-bottom: 15px;
                `;
                
                // ── FIX: Extract image from message ──────────────────────────────
                let imageData = null;
                let messageText = msg.message || '';
                
                // Pattern 1: [IMAGE:data:image/png;base64,...]
                if (messageText.includes('[IMAGE:')) {
                    const imageMatch = messageText.match(/\[IMAGE:([^\]]+)\]/);
                    if (imageMatch) {
                        imageData = imageMatch[1];
                        messageText = messageText.replace(/\[IMAGE:[^\]]+\]/, '').trim();
                        messageText = messageText.replace(/^Image:\s*/i, '').trim();
                        messageText = messageText.replace(/^📷\s*Image:\s*/i, '').trim();
                    }
                }
                
                // Pattern 2: Direct data URI (fallback)
                if (!imageData && messageText.includes('data:image')) {
                    const dataMatch = messageText.match(/data:image\/[^;]+;base64,[^\s]+/);
                    if (dataMatch) {
                        imageData = dataMatch[0];
                        messageText = messageText.replace(/data:image\/[^;]+;base64,[^\s]+/, '').trim();
                        messageText = messageText.replace(/^Image:\s*/i, '').trim();
                    }
                }
                
                // ── FIX: Remove "Image" text if only image ──────────────────────────
                if (!messageText || messageText === 'Image:' || messageText === '📷 Image:' || 
                    messageText === 'Screenshot' || messageText === '📷 Image' || 
                    messageText === 'Image' || messageText === 'image') {
                    messageText = '';
                }
                
                // ── Build message HTML ─────────────────────────────────────────────
                let messageHTML = `
                    <div style="max-width: 70%;">
                        <div style="background: ${isVet ? '#38bdf8' : '#1e293b'}; padding: 10px 15px; border-radius: 12px; ${isVet ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                            <div style="font-size: 11px; color: ${isVet ? '#0f172a' : '#38bdf8'}; font-weight: 600; margin-bottom: 3px;">${isVet ? 'Vet' : customerName}</div>
                            ${messageText ? `<div style="color: ${isVet ? '#0f172a' : '#e2e8f0'}; word-wrap: break-word;">${messageText}</div>` : ''}
                `;
                
                // ── Add image if present ──────────────────────────────────────────
                if (imageData && imageData.startsWith('data:image')) {
                    messageHTML += `
                        <div style="margin-top: 10px;">
                            <img src="${imageData}" 
                                 style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #334155; display: block;" 
                                 onclick="window.openImageFullscreenVet('${imageData}')"
                                 alt="Image">
                        </div>
                    `;
                }
                
                messageHTML += `
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-top: 3px; ${isVet ? 'text-align: right;' : ''}">
                            ${new Date(msg.created_at).toLocaleString()}
                        </div>
                    </div>
                `;
                
                div.innerHTML = messageHTML;
                container.appendChild(div);
            });
            container.scrollTop = container.scrollHeight;
            
            await fetch(`/api/messages/${customerEmail}/read`, {
                method: 'PUT'
            });
            
        } else {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    No messages yet.
                </div>
            `;
        }
        
        // ✅ Re-render customer list with search applied
        renderVetCustomerList(vetAllCustomers);
        loadVetUnreadCount();
        loadStats();
        
    } catch (error) {
        console.error('Error loading conversation:', error);
        container.innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 40px;">
                ❌ Error loading messages
            </div>
        `;
    }
}

// ── IMAGE FULLSCREEN FUNCTION FOR VET ─────────────────────────────
function openImageFullscreenVet(imageSrc) {
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

async function sendVetReply(e) {
    e.preventDefault();
    
    const customerEmail = document.getElementById('vetReplyCustomerEmail').value;
    const message = document.getElementById('vetReplyMessage').value.trim();
    
    if (!message) {
        const input = document.getElementById('vetReplyMessage');
        input.style.borderColor = '#ef4444';
        input.placeholder = '⚠️ Please enter a message';
        setTimeout(() => {
            input.style.borderColor = '#334155';
            input.placeholder = 'Type your reply...';
        }, 2000);
        return;
    }
    
    if (!customerEmail) {
        alert('Please select a customer first.');
        return;
    }
    
    const btn = document.querySelector('#vetReplyForm button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Sending...';
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
            loadVetConversation(customerEmail);
            loadVetCustomers();
            loadVetUnreadCount();
            loadStats();
            alert('✅ Reply sent successfully!');
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
    
    btn.textContent = originalText;
    btn.disabled = false;
}

async function loadVetUnreadCount() {
    try {
        const res = await fetch('/api/messages/unread-count');
        const data = await res.json();
        
        const badge = document.getElementById('vetUnreadBadge');
        const display = document.getElementById('vetUnreadDisplay');
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.classList.add('show');
            if (display) display.textContent = `${data.count} unread`;
        } else {
            badge.classList.remove('show');
            if (display) display.textContent = '0 unread';
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

// ── ──────────────────────────────────────────────────────────────────
// ── EMOJI PICKER FOR VET ──────────────────────────────────────────
// ── ──────────────────────────────────────────────────────────────────

let vetEmojiPickerVisible = false;

function toggleVetEmojiPicker() {
    const picker = document.getElementById('vetEmojiPicker');
    if (!picker) return;
    
    vetEmojiPickerVisible = !vetEmojiPickerVisible;
    picker.style.display = vetEmojiPickerVisible ? 'flex' : 'none';
}

function insertVetEmoji(emoji) {
    const input = document.getElementById('vetReplyMessage');
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + emoji.length;
    
    if (vetEmojiPickerVisible) {
        toggleVetEmojiPicker();
    }
}

// ── ──────────────────────────────────────────────────────────────────
// ── IMAGE UPLOAD FOR VET ──────────────────────────────────────────
// ── ──────────────────────────────────────────────────────────────────

let vetPendingImage = null;

function showVetImageUploadModal() {
    let modal = document.getElementById('vetImageUploadModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'vetImageUploadModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-popup" style="max-width: 450px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">🖼️</div>
                    <h3 style="color: #38bdf8; font-size: 24px; margin: 0;">Upload Image</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Share a photo with your message</p>
                </div>
                
                <div style="background: #0f172a; border-radius: 12px; padding: 30px; border: 2px dashed #334155; text-align: center; cursor: pointer; transition: 0.3s;" 
                     id="vetImageUploadDropzone"
                     onclick="document.getElementById('vetImageUploadInput').click()">
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <p style="color: #94a3b8; font-size: 14px;">Click or drag to upload image</p>
                    <p style="color: #64748b; font-size: 12px;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="vetImageUploadInput" accept="image/*" style="display: none;">
                
                <div id="vetImagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="vetImagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="closeVetImageUploadModal()" style="flex: 1;">Cancel</button>
                        <button class="modal-btn modal-btn-submit" onclick="sendVetImageMessage()" id="vetSendImageBtn" style="flex: 1; background: #38bdf8; color: #0f172a;">📤 Send Image</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVetImageUploadModal();
            }
        });
        
        const fileInput = document.getElementById('vetImageUploadInput');
        fileInput.addEventListener('change', function(e) {
            previewVetImage(e);
        });
        
        const dropzone = document.getElementById('vetImageUploadDropzone');
        dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#38bdf8';
            this.style.background = 'rgba(56, 189, 248, 0.05)';
        });
        dropzone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#334155';
            this.style.background = 'transparent';
        });
        dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#334155';
            this.style.background = 'transparent';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('vetImageUploadInput').files = files;
                previewVetImage({ target: { files: files } });
            }
        });
    }
    
    document.getElementById('vetImagePreviewContainer').style.display = 'none';
    document.getElementById('vetImageUploadInput').value = '';
    document.getElementById('vetImageUploadDropzone').style.borderColor = '#334155';
    document.getElementById('vetImageUploadDropzone').style.background = 'transparent';
    document.getElementById('vetSendImageBtn').disabled = false;
    document.getElementById('vetSendImageBtn').textContent = '📤 Send Image';
    vetPendingImage = null;
    
    modal.style.display = 'flex';
}

function closeVetImageUploadModal() {
    const modal = document.getElementById('vetImageUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
    vetPendingImage = null;
}

function previewVetImage(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        document.getElementById('vetImageUploadInput').value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please upload under 5MB.');
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
        alert('Please select an image first.');
        return;
    }
    
    const customerEmail = document.getElementById('vetReplyCustomerEmail').value;
    if (!customerEmail) {
        alert('Please select a customer first.');
        return;
    }
    
    const btn = document.getElementById('vetSendImageBtn');
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
            alert('✅ Image sent successfully!');
            closeVetImageUploadModal();
            await loadVetConversation(customerEmail);
            await loadVetCustomers();
            loadVetUnreadCount();
            
            if (vetSocket && vetSocket.connected) {
                vetSocket.emit('send_message', {
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
            alert('❌ ' + (data.message || 'Error sending image.'));
            btn.textContent = '📤 Send Image';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error sending image:', error);
        alert('Something went wrong. Please try again.');
        btn.textContent = '📤 Send Image';
        btn.disabled = false;
    }
}

// ── ──────────────────────────────────────────────────────────────────
// ── INITIALIZE VET EMOJI PICKER ──────────────────────────────────
// ── ──────────────────────────────────────────────────────────────────

function initVetEmojiPicker() {
    if (document.getElementById('vetEmojiPicker')) return;
    
    const footer = document.querySelector('#vetReplyForm').parentElement;
    if (!footer) return;
    
    footer.style.position = 'relative';
    
    const picker = document.createElement('div');
    picker.id = 'vetEmojiPicker';
    picker.style.cssText = `
        display: none;
        position: absolute;
        bottom: 70px;
        right: 0;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 12px;
        padding: 12px;
        width: 300px;
        max-height: 250px;
        overflow-y: auto;
        flex-wrap: wrap;
        gap: 6px;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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
            border: none;
            background: #0f172a;
            border-radius: 8px;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.2s ease;
            color: #fff;
        `;
        btn.onmouseover = () => { btn.style.background = '#334155'; };
        btn.onmouseout = () => { btn.style.background = '#0f172a'; };
        btn.onclick = () => insertVetEmoji(emoji);
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
    closeBtn.onclick = toggleVetEmojiPicker;
    closeBtn.onmouseover = () => { closeBtn.style.background = '#dc2626'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = '#ef4444'; };
    picker.appendChild(closeBtn);
    
    footer.appendChild(picker);
}

// ── ──────────────────────────────────────────────────────────────────
// ── ADD EMOJI AND IMAGE BUTTONS TO VET REPLY FORM ──────────────
// ── ──────────────────────────────────────────────────────────────────

function addVetMessageButtons() {
    const replyForm = document.getElementById('vetReplyForm');
    if (!replyForm) return;
    
    if (document.getElementById('vetEmojiBtn')) return;
    
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
    emojiBtn.id = 'vetEmojiBtn';
    emojiBtn.type = 'button';
    emojiBtn.innerHTML = '😊';
    emojiBtn.title = 'Insert Emoji';
    emojiBtn.style.cssText = `
        padding: 8px 14px;
        background: #334155;
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 18px;
        cursor: pointer;
        transition: 0.3s;
    `;
    emojiBtn.onmouseover = () => { emojiBtn.style.background = '#475569'; };
    emojiBtn.onmouseout = () => { emojiBtn.style.background = '#334155'; };
    emojiBtn.onclick = toggleVetEmojiPicker;
    
    const imageBtn = document.createElement('button');
    imageBtn.id = 'vetImageBtn';
    imageBtn.type = 'button';
    imageBtn.innerHTML = '🖼️';
    imageBtn.title = 'Upload Image';
    imageBtn.style.cssText = `
        padding: 8px 14px;
        background: #334155;
        border: none;
        border-radius: 10px;
        color: white;
        font-size: 18px;
        cursor: pointer;
        transition: 0.3s;
    `;
    imageBtn.onmouseover = () => { imageBtn.style.background = '#475569'; };
    imageBtn.onmouseout = () => { imageBtn.style.background = '#334155'; };
    imageBtn.onclick = showVetImageUploadModal;
    
    const parent = sendBtn.parentNode;
    parent.insertBefore(btnContainer, sendBtn);
    btnContainer.appendChild(emojiBtn);
    btnContainer.appendChild(imageBtn);
    
    sendBtn.style.marginLeft = 'auto';
}

// ── ──────────────────────────────────────────────────────────────────
// ── INITIALIZE ────────────────────────────────────────────────────
// ── ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    initVetEmojiPicker();
    addVetMessageButtons();
    // ✅ Initialize vet message search
    initVetMessageSearch();
});

// ── Make functions available globally ────────────────────────────────
window.showTab = showTab;
window.loadStats = loadStats;
window.loadAllPatients = loadAllPatients;
window.loadAllRecords = loadAllRecords;
window.showAddRecordModal = showAddRecordModal;
window.closeAddRecordModal = closeAddRecordModal;
window.submitRecord = submitRecord;
window.showMLModal = showMLModal;
window.closeMLModal = closeMLModal;
window.viewPetMedical = viewPetMedical;
window.confirmLogout = confirmLogout;
window.loadVetCustomers = loadVetCustomers;
window.loadVetConversation = loadVetConversation;
window.sendVetReply = sendVetReply;
window.loadVetUnreadCount = loadVetUnreadCount;
window.connectVetSocket = connectVetSocket;
window.openImageFullscreenVet = openImageFullscreenVet;

// ── Emoji and Image Functions ──────────────────────────────────────
window.toggleVetEmojiPicker = toggleVetEmojiPicker;
window.insertVetEmoji = insertVetEmoji;
window.showVetImageUploadModal = showVetImageUploadModal;
window.closeVetImageUploadModal = closeVetImageUploadModal;
window.sendVetImageMessage = sendVetImageMessage;

// ── Vet Message Search Functions ──────────────────────────────────
window.searchVetMessages = searchVetMessages;
window.clearVetMessageSearch = clearVetMessageSearch;
window.initVetMessageSearch = initVetMessageSearch;
window.renderVetCustomerList = renderVetCustomerList;