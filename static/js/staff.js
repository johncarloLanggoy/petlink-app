// ── STAFF APPOINTMENT FILTERING ────────────────────────────────────
let staffCurrentFilter = 'all';
let staffAllAppointments = [];

function filterStaffAppointments(status) {
    staffCurrentFilter = status;
    
    // Update tabs
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'transparent';
        tab.style.color = '#94a3b8';
        if (tab.dataset.tab === status) {
            tab.classList.add('active');
            tab.style.background = '#38bdf8';
            tab.style.color = '#0f172a';
        }
    });
    
    // Filter and render
    renderStaffAppointments();
}

function renderStaffAppointments() {
    const tbody = document.getElementById('staffAppointmentsTableBody');
    if (!tbody) return;
    
    let filtered = staffAllAppointments;
    if (staffCurrentFilter !== 'all') {
        filtered = staffAllAppointments.filter(app => app.status === staffCurrentFilter);
    }
    
    // Apply search filter if search term exists
    const searchInput = document.getElementById('appointmentSearchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(app => {
            const petName = (app.pet_name || '').toLowerCase();
            const customerEmail = (app.customer_email || '').toLowerCase();
            return petName.includes(searchTerm) || customerEmail.includes(searchTerm);
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
                <td colspan="8" style="text-align: center; color: #64748b; padding: 40px;">
                    <div style="font-size: 40px; margin-bottom: 10px;">📅</div>
                    <h3 style="color: #e2e8f0; margin-bottom: 5px;">No ${label}</h3>
                    <p style="font-size: 13px;">${staffCurrentFilter === 'all' ? 'No appointments from customers yet.' : `No ${label} at the moment.`}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    filtered.forEach(app => {
        const statusClass = `status-${app.status}`;
        const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        
        // Get services
        let servicesDisplay = '—';
        if (app.services) {
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
        
        // Determine actions based on status
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
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="white-space: nowrap;">${app.appointment_date}</td>
            <td style="white-space: nowrap; font-weight: 600; color: #38bdf8;">${formatStaffTime(app.appointment_time)}</td>
            <td style="font-weight: 600; color: #64748b;">#${app.id}</td>
            <td>
                <div class="pet-cell">
                    <span class="pet-icon">🐕</span>
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
    
    // Update tab counts
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
    if (app.services) {
        try {
            const services = typeof app.services === 'string' ? JSON.parse(app.services) : app.services;
            servicesDisplay = Array.isArray(services) ? services.join(', ') : services;
        } catch (e) {
            servicesDisplay = app.services;
        }
    }
    
    const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
    const timeDisplay = formatStaffTime(app.appointment_time);
    
    alert(
        `📋 Appointment Details\n\n` +
        `🆔 ID: #${app.id}\n` +
        `🐕 Pet: ${app.pet_name || 'Unknown'}\n` +
        `👤 Customer: ${app.customer_email || 'Unknown'}\n` +
        `✂️ Services: ${servicesDisplay}\n` +
        `📅 Date: ${app.appointment_date}\n` +
        `⏰ Time: ${timeDisplay}\n` +
        `📌 Status: ${statusLabel}\n` +
        `${app.notes ? `📝 Notes: ${app.notes}` : ''}`
    );
}

// ── Tab Navigation ───────────────────────────────────────────────────
function showDashboardTab() {
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('appointmentsSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navDashboard').classList.add('active');
    
    loadStaffStats();
    loadStaffChartData(0);
    loadStaffPetTypeChart();
    loadStaffAppointmentStatusChart();
    loadStaffMonthlyGrowthChart();
}

function showCustomersTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'block';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('appointmentsSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navCustomers').classList.add('active');
    
    loadStaffStats();
}

function showPetsTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'block';
    document.getElementById('appointmentsSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navPets').classList.add('active');
    
    loadPets();
}

function showAppointmentsTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('appointmentsSection').style.display = 'block';
    document.getElementById('messagesSection').style.display = 'none';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navAppointments').classList.add('active');
    
    loadAllAppointments();
}

// ── Messages Tab ──────────────────────────────────────────────────────
let currentCustomerEmail = null;

function showMessagesTab() {
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('petSection').style.display = 'none';
    document.getElementById('appointmentsSection').style.display = 'none';
    document.getElementById('messagesSection').style.display = 'block';
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('navMessages').classList.add('active');
    
    // Load customers and auto-select conversation with unread messages
    loadCustomersWithMessages();
    
    // If there's a currentCustomerEmail, load that conversation immediately
    if (currentCustomerEmail) {
        loadConversation(currentCustomerEmail);
    } else {
        // If no currentCustomerEmail, load the first conversation with unread messages
        loadFirstUnreadStaffConversation();
    }
    
    // Force update badge
    loadUnreadCount();
}

// ── LOAD FIRST CONVERSATION WITH UNREAD MESSAGES (STAFF) ──────────
async function loadFirstUnreadStaffConversation() {
    try {
        const res = await fetch('/api/messages/received-only');
        const data = await res.json();
        
        if (data.success && data.senders && data.senders.length > 0) {
            // Sort by unread first, then by last_message_at
            const sortedSenders = data.senders.sort((a, b) => {
                if (a.unread_count > 0 && b.unread_count === 0) return -1;
                if (a.unread_count === 0 && b.unread_count > 0) return 1;
                const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
                const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
                return dateB - dateA;
            });
            
            // Find the first sender with unread messages
            const unreadSenders = sortedSenders.filter(s => s.unread_count > 0);
            
            if (unreadSenders.length > 0) {
                // Load the first sender with unread messages
                await loadConversation(unreadSenders[0].email);
            } else {
                // If no unread messages, load the first sender (most recent)
                await loadConversation(sortedSenders[0].email);
            }
        }
    } catch (error) {
        console.error('Error loading first conversation:', error);
    }
}

// ── STAFF MESSAGES SEARCH ──────────────────────────────────────────
let staffAllCustomers = [];
let staffFilteredCustomers = [];

// ── Load Customers with Messages (UPDATED with Search) ────────────
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
            // Sort senders: Unread first, then by last_message_at (newest first)
            staffAllCustomers = data.senders.sort((a, b) => {
                // Unread messages first
                if (a.unread_count > 0 && b.unread_count === 0) return -1;
                if (a.unread_count === 0 && b.unread_count > 0) return 1;
                
                // If both have unread or both don't, sort by last_message_at (newest first)
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

// ── Render Staff Customer List with Search ─────────────────────────
function renderStaffCustomerList(customers) {
    const container = document.getElementById('customerList');
    const searchInput = document.getElementById('staffMessageSearch');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    // Filter if search term exists
    let filtered = customers;
    if (searchTerm) {
        filtered = customers.filter(customer => {
            const name = (customer.fullname || customer.email || '').toLowerCase();
            const email = (customer.email || '').toLowerCase();
            const phone = (customer.phone || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm);
        });
    }
    
    // Keep the sort order (unread first, then by last_message_at)
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
        
        // Show last message time for context
        const lastMessageTime = sender.last_message_at ? 
            new Date(sender.last_message_at).toLocaleDateString() : '';
        
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 12px 15px;
            border-bottom: 1px solid #1e293b;
            cursor: pointer;
            transition: 0.3s;
            display: flex;
            align-items: center;
            gap: 10px;
            ${isActive ? 'background: rgba(56, 189, 248, 0.1);' : ''}
        `;
        div.onmouseover = () => { div.style.background = 'rgba(56, 189, 248, 0.05)'; };
        div.onmouseout = () => { div.style.background = isActive ? 'rgba(56, 189, 248, 0.1)' : ''; };
        div.onclick = () => loadConversation(sender.email);
        
        div.innerHTML = `
            <div style="width: 35px; height: 35px; border-radius: 50%; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; font-size: 16px;">👤</div>
            <div style="flex: 1; min-width: 0;">
                <div style="color: #e2e8f0; font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sender.fullname || sender.email}</div>
                <div style="color: #64748b; font-size: 11px;">${sender.email} • ${sender.phone || 'No phone'}</div>
                ${lastMessageTime ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;"> ${lastMessageTime}</div>` : ''}
            </div>
            ${unreadBadge}
        `;
        container.appendChild(div);
    });
}

// ── Search Staff Messages ──────────────────────────────────────────
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

// ── Clear Staff Message Search ─────────────────────────────────────
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

// ── Update Staff Search Result Count ──────────────────────────────
function updateStaffSearchCount(count) {
    const el = document.getElementById('staffSearchResultCount');
    if (el) {
        el.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
    }
}

// ── Init Staff Message Search ──────────────────────────────────────
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

// ── LOAD CONVERSATION (UPDATED - re-renders list after loading) ──
async function loadConversation(customerEmail) {
    currentCustomerEmail = customerEmail;
    
    // ── FETCH CUSTOMER FULL NAME ──────────────────────────────────
    let customerName = customerEmail; // Default: email
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
    
    // ── UPDATE HEADER ──────────────────────────────────────────────
    document.getElementById('conversationHeader').innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">👤</span>
            <div>
                <div style="color: #e2e8f0; font-weight: 500;">${customerName}</div>
                <div style="color: #64748b; font-size: 12px;">${customerEmail}</div>
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
                
                const div = document.createElement('div');
                div.style.cssText = `
                    display: flex;
                    justify-content: ${isStaff ? 'flex-end' : 'flex-start'};
                    margin-bottom: 15px;
                `;
                
                // Extract image from message
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
                
                // Remove "Image" text if only image
                if (!messageText || messageText === 'Image:' || messageText === '📷 Image:' || 
                    messageText === 'Screenshot' || messageText === '📷 Image' || 
                    messageText === 'Image' || messageText === 'image') {
                    messageText = '';
                }
                
                // Get sender name
                let senderName = isStaff ? 'Staff' : customerName;
                
                // Build message HTML
                let messageHTML = `
                    <div style="max-width: 70%;">
                        <div style="background: ${isStaff ? '#38bdf8' : '#1e293b'}; padding: 10px 15px; border-radius: 12px; ${isStaff ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                            <div style="font-size: 11px; color: ${isStaff ? '#0f172a' : '#38bdf8'}; font-weight: 600; margin-bottom: 3px;">${senderName}</div>
                            ${messageText ? `<div style="color: ${isStaff ? '#0f172a' : '#e2e8f0'}; word-wrap: break-word;">${messageText}</div>` : ''}
                `;
                
                // Add image if present
                if (imageData && imageData.startsWith('data:image')) {
                    messageHTML += `
                        <div style="margin-top: 10px;">
                            <img src="${imageData}" 
                                 style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #334155; display: block;" 
                                 onclick="window.openImageFullscreen('${imageData}')"
                                 alt="Image">
                        </div>
                    `;
                }
                
                messageHTML += `
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-top: 3px; ${isStaff ? 'text-align: right;' : ''}">
                            ${new Date(msg.created_at).toLocaleString()}
                        </div>
                    </div>
                `;
                
                div.innerHTML = messageHTML;
                container.appendChild(div);
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
        
        // Re-render customer list with search applied
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

// ── MARK MESSAGES AS READ (STAFF) ────────────────────────────────────
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
            
            // Update badge and list
            await loadCustomersWithMessages();
            loadUnreadCount();
            
            // Remove unread badge from active item
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
            input.style.borderColor = '#334155';
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
            input.style.borderColor = '#10b981';
            setTimeout(() => {
                input.placeholder = 'Type your reply...';
                input.style.borderColor = '#334155';
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

// ── IMAGE FULLSCREEN FUNCTION ──────────────────────────────────────
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

// ── SocketIO Connection for Staff ──────────────────────────────────
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
        
        // Update badge wherever the staff is
        if (data.receiver === currentUser || data.sender === currentUser) {
            // Update badge count
            loadUnreadCount();
            
            // Reload conversations if in messages tab
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

// ── LOAD STAFF STATS FROM DATABASE ──────────────────────────────────
async function loadStaffStats() {
    try {
        const res = await fetch('/api/staff/stats');
        const data = await res.json();
        
        if (data.success) {
            const stats = data.stats;
            
            // Update stat cards
            document.getElementById('totalCustomers').textContent = stats.total_customers;
            document.getElementById('totalPets').textContent = stats.total_pets;
            document.getElementById('totalAppointments').textContent = stats.total_appointments;
            document.getElementById('pendingAppointments').textContent = stats.pending;
            document.getElementById('confirmedAppointments').textContent = stats.confirmed;
            document.getElementById('cancelledAppointments').textContent = stats.cancelled;
            
            // Update quick stats
            document.getElementById('dailyAverage').textContent = stats.avg_appointments_per_day;
            document.getElementById('newPetsThisMonth').textContent = stats.new_pets_this_month;
            document.getElementById('newCustomersThisMonth').textContent = stats.new_customers_this_month;
            document.getElementById('completionRate').textContent = stats.completion_rate + '%';
        }
    } catch (error) {
        console.error('Error loading staff stats:', error);
    }
}

// ── REFRESH STATS ──────────────────────────────────────────────────
async function refreshStats() {
    await loadStaffStats();
    showMessage('✅ Stats refreshed!', 'success');
}

// ── ML FUNCTIONS FOR STAFF ──────────────────────────────────────────
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

// ── Show/Hide Messages ─────────────────────────────────────────────
function showMessage(text, type) {
    const msg = document.getElementById('message');
    msg.textContent = text;
    msg.className = 'message ' + type;
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 4000);
}

// ── Load Customers for Dropdown ────────────────────────────────────
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

// ── Load Registered Pets ONLY ───────────────────────────────────────
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
                
                row.innerHTML = `
                    <td>${pet.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${pet.pet_image ? 
                                `<img src="${pet.pet_image}" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover;">` : 
                                `<span style="font-size: 24px;">${petIcon}</span>`
                            }
                            <strong>${pet.name}</strong>
                        </div>
                    </td>
                    <td><span class="pet-type-badge ${petType === 'Cat' ? 'cat' : 'dog'}">${petTypeLabel}</span></td>
                    <td>${pet.breed || '—'}</td>
                    <td>${pet.age || '—'}</td>
                    <td>${pet.gender || '—'}</td>
                    <td><span class="truncate" title="${pet.owner_email}">${pet.owner_email}</span></td>
                    <td><span class="pet-status ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-edit" onclick="showEditPetModal(${pet.id})">✏️ Edit</button>
                            <button class="btn-delete" onclick="deletePet(${pet.id})">🗑️ Delete</button>
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

// ── Update Appointment Counts ──────────────────────────────────────
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

// ── Load All Appointments (Enhanced) ──────────────────────────────
async function loadAllAppointments() {
    const tbody = document.getElementById('staffAppointmentsTableBody');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; color: #64748b; padding: 40px;">
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
            
            // Apply current filter
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
        document.getElementById('totalAppointments').textContent = '0';
        document.getElementById('pendingAppointments').textContent = '0';
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #ef4444; padding: 40px;">
                    ❌ Error loading appointments. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

// ── Update Appointment Status ──────────────────────────────────────
async function updateAppointmentStatus(appointmentId, status) {
    const statusLabels = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled'
    };
    
    if (!confirm(`Are you sure you want to mark this appointment as ${statusLabels[status] || status}?`)) return;
    
    try {
        const res = await fetch(`/api/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        
        if (data.success) {
            showMessage(`✅ Appointment ${statusLabels[status] || status}!`, 'success');
            loadAllAppointments();
            refreshStats();
        } else {
            showMessage(data.message || 'Error updating appointment.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Something went wrong. Please try again.', 'error');
    }
}

// ── Add Pet Modal ──────────────────────────────────────────────────
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

// ── Edit Pet Modal ──────────────────────────────────────────────────
async function showEditPetModal(petId) {
    document.getElementById('editPetModal').style.display = 'flex';
    
    try {
        const res = await fetch('/api/pets');
        const data = await res.json();
        if (data.success) {
            const pet = data.pets.find(p => p.id === petId);
            if (pet) {
                document.getElementById('editPetId').value = pet.id;
                document.getElementById('editPetType').value = pet.pet_type || 'Dog';
                document.getElementById('editPetName').value = pet.name || '';
                document.getElementById('editPetBreed').value = pet.breed || '';
                document.getElementById('editPetAge').value = pet.age || '';
                document.getElementById('editPetGender').value = pet.gender || '';
                document.getElementById('editPetColor').value = pet.color || '';
                document.getElementById('editPetWeight').value = pet.weight || '';
                document.getElementById('editPetAllergies').value = pet.allergies || '';
                document.getElementById('editPetMedicalHistory').value = pet.medical_history || '';
                
                const preview = document.getElementById('editPetImagePreview');
                if (pet.pet_image) {
                    preview.innerHTML = `<img src="${pet.pet_image}" style="width: 100%; height: 100%; object-fit: cover;">`;
                } else {
                    preview.innerHTML = `<span style="color: #64748b; font-size: 12px; text-align: center;">No<br>Image</span>`;
                }
            }
        }
    } catch (error) {
        console.error('Error loading pet details:', error);
    }
}

function closeEditPetModal() {
    document.getElementById('editPetModal').style.display = 'none';
}

async function updatePet(e) {
    e.preventDefault();
    
    const petId = document.getElementById('editPetId').value;
    const pet_type = document.getElementById('editPetType').value;
    const name = document.getElementById('editPetName').value.trim();
    const breed = document.getElementById('editPetBreed').value.trim();
    const age = document.getElementById('editPetAge').value;
    const gender = document.getElementById('editPetGender').value;
    const color = document.getElementById('editPetColor').value.trim();
    const weight = document.getElementById('editPetWeight').value;
    const allergies = document.getElementById('editPetAllergies').value.trim();
    const medical_history = document.getElementById('editPetMedicalHistory').value.trim();
    
    const imageInput = document.getElementById('editPetImage');
    let pet_image = '';
    if (imageInput && imageInput.files && imageInput.files[0]) {
        pet_image = await getBase64Image(imageInput);
    }
    
    if (!name) {
        showMessage('Please enter pet name.', 'error');
        return;
    }
    
    try {
        const res = await fetch(`/api/pets/${petId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_type, name, breed, age, gender, color, weight, allergies, medical_history, pet_image })
        });
        const data = await res.json();
        
        if (data.success) {
            showMessage('Pet updated successfully! ✅', 'success');
            closeEditPetModal();
            loadPets();
        } else {
            showMessage(data.message || 'Error updating pet.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Something went wrong. Please try again.', 'error');
    }
}

// ── Delete Pet ──────────────────────────────────────────────────────
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

// ── Logout ──────────────────────────────────────────────────────────
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

// ── Close modals on ESC key ──────────────────────────────────────
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAddPetModal();
        closeEditPetModal();
        closeLogoutModal();
    }
});

// ── Click outside modal to close ──────────────────────────────────
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeAddPetModal();
        closeEditPetModal();
        closeLogoutModal();
    }
});

// ── EMOJI PICKER FOR STAFF ──────────────────────────────────────────
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

// ── IMAGE UPLOAD FOR STAFF ──────────────────────────────────────────
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
                    <h3 style="color: #38bdf8; font-size: 24px; margin: 0;">Upload Image</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Share a photo with your message</p>
                </div>
                
                <div style="background: #0f172a; border-radius: 12px; padding: 30px; border: 2px dashed #334155; text-align: center; cursor: pointer; transition: 0.3s;" 
                     id="staffImageUploadDropzone"
                     onclick="document.getElementById('staffImageUploadInput').click()">
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <p style="color: #94a3b8; font-size: 14px;">Click or drag to upload image</p>
                    <p style="color: #64748b; font-size: 12px;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="staffImageUploadInput" accept="image/*" style="display: none;">
                
                <div id="staffImagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="staffImagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="closeStaffImageUploadModal()" style="flex: 1;">Cancel</button>
                        <button class="modal-btn modal-btn-submit" onclick="sendStaffImageMessage()" id="staffSendImageBtn" style="flex: 1; background: #38bdf8; color: #0f172a;">📤 Send Image</button>
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
                document.getElementById('staffImageUploadInput').files = files;
                previewStaffImage({ target: { files: files } });
            }
        });
    }
    
    document.getElementById('staffImagePreviewContainer').style.display = 'none';
    document.getElementById('staffImageUploadInput').value = '';
    document.getElementById('staffImageUploadDropzone').style.borderColor = '#334155';
    document.getElementById('staffImageUploadDropzone').style.background = 'transparent';
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

// ── INITIALIZE STAFF EMOJI PICKER ──────────────────────────────────
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

// ── ADD EMOJI AND IMAGE BUTTONS TO STAFF REPLY FORM ──────────────
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
    emojiBtn.onclick = toggleStaffEmojiPicker;
    
    const imageBtn = document.createElement('button');
    imageBtn.id = 'staffImageBtn';
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
    imageBtn.onclick = showStaffImageUploadModal;
    
    const parent = sendBtn.parentNode;
    parent.insertBefore(btnContainer, sendBtn);
    btnContainer.appendChild(emojiBtn);
    btnContainer.appendChild(imageBtn);
    
    sendBtn.style.marginLeft = 'auto';
}

// ── CUSTOMER SEARCH ──────────────────────────────────────────────────
function searchCustomers() {
    const input = document.getElementById('customerSearchInput');
    const clearBtn = document.getElementById('clearCustomerSearchBtn');
    const emptyState = document.getElementById('customerEmptyState');
    const rows = document.querySelectorAll('#registeredCustomersTable .customer-row');
    let visibleCount = 0;
    
    if (!input) return;
    
    const searchTerm = input.value.trim().toLowerCase();
    
    if (searchTerm !== '') {
        clearBtn.style.display = 'inline-block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    rows.forEach(row => {
        const name = (row.dataset.name || '').toLowerCase();
        const email = (row.dataset.email || '').toLowerCase();
        const match = name.includes(searchTerm) || email.includes(searchTerm);
        row.style.display = match ? '' : 'none';
        if (match) visibleCount++;
    });
    
    if (emptyState) {
        emptyState.style.display = visibleCount === 0 && rows.length > 0 ? 'block' : 'none';
    }
}

function clearCustomerSearch() {
    const input = document.getElementById('customerSearchInput');
    const clearBtn = document.getElementById('clearCustomerSearchBtn');
    const emptyState = document.getElementById('customerEmptyState');
    
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        const rows = document.querySelectorAll('#registeredCustomersTable .customer-row');
        rows.forEach(row => {
            row.style.display = '';
        });
        input.focus();
    }
}

// ── PET SEARCH ──────────────────────────────────────────────────────
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

// ── APPOINTMENT SEARCH ──────────────────────────────────────────────
function searchAppointments() {
    const input = document.getElementById('appointmentSearchInput');
    const clearBtn = document.getElementById('clearAppointmentSearchBtn');
    const emptyState = document.getElementById('appointmentEmptyState');
    
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
    const emptyState = document.getElementById('appointmentEmptyState');
    
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        
        if (staffCurrentFilter !== 'all') {
            filterStaffAppointments(staffCurrentFilter);
        } else {
            renderStaffAppointments();
        }
        input.focus();
    }
}

// ── SWITCH CHART ──────────────────────────────────────────────────
function switchChart(chartName) {
    document.querySelectorAll('.chart-container').forEach(el => {
        el.style.display = 'none';
    });
    
    const targetChart = document.getElementById('chart-' + chartName);
    if (targetChart) {
        targetChart.style.display = 'block';
    }
    
    document.querySelectorAll('.dash-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.chart === chartName) {
            btn.classList.add('active');
        }
    });
    
    // Load chart data when tab is clicked
    if (chartName === 'pettypes') {
        loadStaffPetTypeChart();
    } else if (chartName === 'status') {
        loadStaffAppointmentStatusChart();
    } else if (chartName === 'growth') {
        loadStaffMonthlyGrowthChart();
    } else if (chartName === 'trends') {
        loadStaffChartData(staffWeekOffset);
    }
    
    const labels = {
        'trends': '📈 Appointment Trends',
        'pettypes': '🐾 Pet Types',
        'status': '📊 Appointment Status',
        'growth': '📈 Monthly Growth'
    };
    document.getElementById('currentChartLabel').textContent = labels[chartName] || chartName;
}

// ── STAFF CHART WEEK NAVIGATION ──────────────────────────────────
let staffWeekOffset = 0;
let staffChartInstance = null;

async function loadStaffChartData(weekOffset = 0) {
    try {
        // Store the new offset
        staffWeekOffset = weekOffset;
        
        // Show loading state
        const weekLabel = document.getElementById('staffWeekLabel');
        if (weekLabel) {
            weekLabel.textContent = '⏳ Loading...';
            weekLabel.style.color = '#f59e0b';
        }
        
        console.log(`📊 Fetching staff chart data for week offset: ${weekOffset}`);
        
        const res = await fetch(`/api/staff/chart-data?week_offset=${weekOffset}`);
        const data = await res.json();
        
        console.log(`📊 Staff API Response:`, data);
        
        if (data.success) {
            const chartData = data.data;
            
            // Update week label
            if (weekLabel && chartData.trends.week_label) {
                weekLabel.textContent = chartData.trends.week_label;
                weekLabel.style.color = '#94a3b8';
            }
            
            // Get the canvas
            const canvas = document.getElementById('appointmentTrendChart');
            if (!canvas) {
                console.error('Canvas element not found');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart if it exists
            if (staffChartInstance) {
                staffChartInstance.destroy();
                staffChartInstance = null;
            }
            
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create new chart
            staffChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.trends.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: chartData.trends.values,
                        borderColor: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#38bdf8',
                        pointBorderColor: '#0f172a',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            labels: { 
                                color: '#94a3b8' 
                            } 
                        } 
                    },
                    scales: {
                        x: { 
                            grid: { color: 'rgba(51, 65, 85, 0.3)' }, 
                            ticks: { color: '#94a3b8' } 
                        },
                        y: { 
                            grid: { color: 'rgba(51, 65, 85, 0.3)' }, 
                            ticks: { color: '#94a3b8', stepSize: 1 }, 
                            beginAtZero: true 
                        }
                    },
                    animation: {
                        duration: 500
                    }
                }
            });
            
            // Force render
            staffChartInstance.update();
            
            // Update button states
            updateStaffButtons(weekOffset);
            
            console.log(`✅ Staff chart loaded for week offset: ${weekOffset}`);
            console.log(`📊 Data:`, chartData.trends.values);
        } else {
            console.error('API returned error:', data);
            const weekLabel = document.getElementById('staffWeekLabel');
            if (weekLabel) {
                weekLabel.textContent = '❌ Error loading data';
                weekLabel.style.color = '#ef4444';
            }
        }
    } catch (error) {
        console.error('Error loading staff chart data:', error);
        const weekLabel = document.getElementById('staffWeekLabel');
        if (weekLabel) {
            weekLabel.textContent = '❌ Error loading data';
            weekLabel.style.color = '#ef4444';
        }
    }
}

function updateStaffButtons(weekOffset) {
    // Find buttons by their onclick attributes
    const allButtons = document.querySelectorAll('#chart-trends button');
    let prevBtn = null;
    let nextBtn = null;
    let todayBtn = null;
    
    allButtons.forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick.includes('changeStaffWeek(-1)')) {
            prevBtn = btn;
        } else if (onclick.includes('changeStaffWeek(1)')) {
            nextBtn = btn;
        } else if (onclick.includes('changeStaffWeek(0)')) {
            todayBtn = btn;
        }
    });
    
    if (prevBtn) {
        prevBtn.style.opacity = '1';
        prevBtn.style.cursor = 'pointer';
        prevBtn.disabled = false;
        prevBtn.style.background = '#334155';
        prevBtn.style.color = '#fff';
    }
    if (nextBtn) {
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
        nextBtn.disabled = false;
        nextBtn.style.background = '#334155';
        nextBtn.style.color = '#fff';
    }
    if (todayBtn) {
        if (weekOffset === 0) {
            todayBtn.style.background = '#38bdf8';
            todayBtn.style.color = '#0f172a';
            todayBtn.style.opacity = '0.6';
            todayBtn.style.cursor = 'default';
            todayBtn.disabled = true;
        } else {
            todayBtn.style.background = '#38bdf8';
            todayBtn.style.color = '#0f172a';
            todayBtn.style.opacity = '1';
            todayBtn.style.cursor = 'pointer';
            todayBtn.disabled = false;
        }
    }
}

function changeStaffWeek(delta) {
    const newOffset = staffWeekOffset + delta;
    console.log(`🔄 Changing staff week from ${staffWeekOffset} to ${newOffset}`);
    loadStaffChartData(newOffset);
}

// ── LOAD PET TYPES CHART ──────────────────────────────────────────
let petTypeChartInstance = null;

async function loadStaffPetTypeChart() {
    try {
        const res = await fetch('/api/staff/chart-data');
        const data = await res.json();
        
        if (data.success) {
            const canvas = document.getElementById('petTypeChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (petTypeChartInstance) {
                petTypeChartInstance.destroy();
                petTypeChartInstance = null;
            }
            
            petTypeChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.data.pet_types.labels,
                    datasets: [{
                        data: data.data.pet_types.values,
                        backgroundColor: ['#38bdf8', '#f59e0b'],
                        borderColor: ['#0f172a', '#0f172a'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#94a3b8', padding: 15, usePointStyle: true }
                        }
                    }
                }
            });
            
            console.log('✅ Pet Type chart loaded');
        }
    } catch (error) {
        console.error('Error loading pet type chart:', error);
    }
}

// ── LOAD APPOINTMENT STATUS CHART ─────────────────────────────────
let appointmentStatusChartInstance = null;

async function loadStaffAppointmentStatusChart() {
    try {
        const res = await fetch('/api/staff/chart-data');
        const data = await res.json();
        
        if (data.success) {
            const canvas = document.getElementById('appointmentStatusChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (appointmentStatusChartInstance) {
                appointmentStatusChartInstance.destroy();
                appointmentStatusChartInstance = null;
            }
            
            appointmentStatusChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.data.status.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: data.data.status.values,
                        backgroundColor: ['#f59e0b', '#10b981', '#38bdf8', '#ef4444'],
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', stepSize: 1 }, beginAtZero: true }
                    }
                }
            });
            
            console.log('✅ Appointment Status chart loaded');
        }
    } catch (error) {
        console.error('Error loading appointment status chart:', error);
    }
}

// ── LOAD MONTHLY GROWTH CHART ─────────────────────────────────────
let monthlyGrowthChartInstance = null;

async function loadStaffMonthlyGrowthChart() {
    try {
        const res = await fetch('/api/staff/chart-data');
        const data = await res.json();
        
        if (data.success) {
            const canvas = document.getElementById('monthlyGrowthChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (monthlyGrowthChartInstance) {
                monthlyGrowthChartInstance.destroy();
                monthlyGrowthChartInstance = null;
            }
            
            monthlyGrowthChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.data.monthly_growth.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: data.data.monthly_growth.values,
                        backgroundColor: 'rgba(56, 189, 248, 0.6)',
                        borderColor: '#38bdf8',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#94a3b8', maxTicksLimit: 6 } },
                        y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', stepSize: 5 }, beginAtZero: true }
                    }
                }
            });
            
            console.log('✅ Monthly Growth chart loaded');
        }
    } catch (error) {
        console.error('Error loading monthly growth chart:', error);
    }
}

// ── LOAD DATA ON PAGE LOAD ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    loadPets();
    loadAllAppointments();
    
    // ── CHECK URL PARAMETER FOR TAB ──────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'customers') {
        showCustomersTab();
    } else {
        showDashboardTab(); // Default to Dashboard tab
    }
    
    loadUnreadCount();
    loadStaffStats();
    // ⭐ START WITH CURRENT WEEK (offset = 0)
    loadStaffChartData(0);
    
    // Connect to WebSocket
    connectStaffSocket();
    
    // Initialize emoji picker and buttons
    initStaffEmojiPicker();
    addStaffMessageButtons();
    
    // Initialize staff message search
    initStaffMessageSearch();
    
    // Add appointment tab click handlers
    document.querySelectorAll('.appointment-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            filterStaffAppointments(this.dataset.tab);
        });
    });
    
    // ── SEARCH INPUT LISTENERS ──────────────────────────────────────────
    const customerSearchInput = document.getElementById('customerSearchInput');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', searchCustomers);
        customerSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearCustomerSearch();
            }
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
            if (e.key === 'Escape') {
                clearPetSearch();
            }
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
            if (e.key === 'Escape') {
                clearAppointmentSearch();
            }
        });
    }
    const appointmentSearchWrapper = document.getElementById('appointmentSearchWrapper');
    if (appointmentSearchWrapper) {
        appointmentSearchWrapper.addEventListener('click', function() {
            const input = document.getElementById('appointmentSearchInput');
            if (input) input.focus();
        });
    }
});

// ── Also reload when coming back to page ──────────────────────────
window.addEventListener('pageshow', function() {
    loadPets();
    loadAllAppointments();
    loadUnreadCount();
    loadStaffStats();
});

// ── Update unread count periodically ──────────────────────────────
setInterval(loadUnreadCount, 30000);

// ── Make functions available globally ────────────────────────────────
window.showDashboardTab = showDashboardTab;
window.showCustomersTab = showCustomersTab;
window.showPetsTab = showPetsTab;
window.showAppointmentsTab = showAppointmentsTab;
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
window.switchChart = switchChart;
window.loadFirstUnreadStaffConversation = loadFirstUnreadStaffConversation;
window.filterStaffAppointments = filterStaffAppointments;
window.renderStaffAppointments = renderStaffAppointments;
window.refreshAppointments = refreshAppointments;
window.viewAppointmentDetails = viewAppointmentDetails;
window.formatStaffTime = formatStaffTime;
window.openImageFullscreen = openImageFullscreen;

// ── Emoji and Image Functions ──────────────────────────────────────
window.toggleStaffEmojiPicker = toggleStaffEmojiPicker;
window.insertStaffEmoji = insertStaffEmoji;
window.showStaffImageUploadModal = showStaffImageUploadModal;
window.closeStaffImageUploadModal = closeStaffImageUploadModal;
window.sendStaffImageMessage = sendStaffImageMessage;


// ── Search Functions ──────────────────────────────────────────────
window.searchCustomers = searchCustomers;
window.clearCustomerSearch = clearCustomerSearch;
window.searchPets = searchPets;
window.clearPetSearch = clearPetSearch;
window.searchAppointments = searchAppointments;
window.clearAppointmentSearch = clearAppointmentSearch;

// ── Staff Message Search Functions ──────────────────────────────────
window.searchStaffMessages = searchStaffMessages;
window.clearStaffMessageSearch = clearStaffMessageSearch;
window.initStaffMessageSearch = initStaffMessageSearch;
window.renderStaffCustomerList = renderStaffCustomerList;

// ── Load Staff Stats ──────────────────────────────────────────────
window.loadStaffStats = loadStaffStats;

// ── ML Functions ──────────────────────────────────────────────────
window.checkMLStatus = checkMLStatus;
window.refreshStats = refreshStats;

// ── Staff Chart Functions ────────────────────────────────────────
window.loadStaffChartData = loadStaffChartData;
window.changeStaffWeek = changeStaffWeek;
window.loadStaffPetTypeChart = loadStaffPetTypeChart;
window.loadStaffAppointmentStatusChart = loadStaffAppointmentStatusChart;
window.loadStaffMonthlyGrowthChart = loadStaffMonthlyGrowthChart;