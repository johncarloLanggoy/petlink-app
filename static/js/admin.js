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

// ── USER MANAGEMENT FILTERING & SEARCH ──────────────────────────────
let allUsersData = [];
let currentUserFilter = 'all';
let currentUserSearch = '';

// ── Load Registered Users ──────────────────────────────────────────
async function loadRegisteredUsers() {
    const tbody = document.getElementById('registeredUsersTable');
    const emptyState = document.getElementById('userEmptyState');
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; color: #64748b; padding: 30px;">
                ⏳ Loading users...
            </td>
        </tr>
    `;
    if (emptyState) emptyState.style.display = 'none';
    
    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        
        if (data.success && data.users && data.users.length > 0) {
            allUsersData = data.users;
            applyUserFilters();
        } else {
            allUsersData = [];
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #64748b; padding: 30px;">
                        No registered users yet.
                    </td>
                </tr>
            `;
            if (emptyState) emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #ef4444; padding: 30px;">
                    ❌ Error loading users. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

// ── Apply Filters and Search ────────────────────────────────────────
function applyUserFilters() {
    const tbody = document.getElementById('registeredUsersTable');
    const emptyState = document.getElementById('userEmptyState');
    const resultCount = document.getElementById('userResultCount');
    
    let filtered = allUsersData;
    if (currentUserFilter !== 'all') {
        filtered = filtered.filter(user => user.role === currentUserFilter);
    }
    
    if (currentUserSearch.trim() !== '') {
        const search = currentUserSearch.trim().toLowerCase();
        filtered = filtered.filter(user => {
            const fullname = (user.fullname || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            return fullname.includes(search) || email.includes(search);
        });
    }
    
    if (resultCount) {
        resultCount.textContent = `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`;
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #64748b; padding: 30px;">
                    No users found matching your criteria.
                </td>
            </tr>
        `;
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    tbody.innerHTML = '';
    filtered.forEach(user => {
        const roleClass = `role-${user.role}`;
        const roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        const nameDisplay = user.fullname || '—';
        
        // ── Generate profile avatar HTML ──────────────────────────
        const initial = nameDisplay !== '—' ? nameDisplay.trim()[0].toUpperCase() : 'U';
        let avatarHTML;
        
        if (user.profile_image) {
            avatarHTML = `
                <img src="${user.profile_image}" 
                     alt="Profile" 
                     style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #334155; flex-shrink: 0;">
            `;
        } else {
            // Color-code by role
            let bgColor = '#7ba05b';  // default green
            if (user.role === 'admin') bgColor = '#8b5cf6';       // purple
            else if (user.role === 'staff') bgColor = '#f59e0b';  // amber
            else if (user.role === 'vet') bgColor = '#3b82f6';    // blue
            else if (user.role === 'user') bgColor = '#10b981';   // green
            
            avatarHTML = `
                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; border: 2px solid #334155; flex-shrink: 0;">
                    ${initial}
                </div>
            `;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <div class="user-name-clickable" 
                     onclick="showUserDetailsModal(${user.id})"
                     title="Click to view details">
                    ${avatarHTML}
                    <strong style="color: #e2e8f0;">${nameDisplay}</strong>
                </div>
            </td>
            <td><span class="truncate" title="${user.email}">${user.email}</span></td>
            <td>${user.phone || '—'}</td>
            <td><span class="truncate" title="${user.address || ''}">${user.address || '—'}</span></td>
            <td>
                <span class="role-badge ${roleClass}">
                    ${roleDisplay}
                </span>
            </td>
            <td>${user.created_at || '—'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ── Filter Users by Role ────────────────────────────────────────────
function filterUsers(role) {
    currentUserFilter = role;
    
    document.querySelectorAll('.user-filter-btn').forEach(btn => {
        const filter = btn.dataset.filter;
        if (filter === role) {
            btn.classList.add('active');
            btn.style.background = '#38bdf8';
            btn.style.color = '#0f172a';
            btn.style.border = 'none';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = '#94a3b8';
            btn.style.border = '1px solid #334155';
        }
    });
    
    applyUserFilters();
}

// ── Search Users ─────────────────────────────────────────────────────
function searchUsers() {
    const input = document.getElementById('userSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (input) {
        currentUserSearch = input.value;
        if (currentUserSearch.trim() !== '') {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
        applyUserFilters();
    }
}

// ── Clear Search ─────────────────────────────────────────────────────
function clearSearch() {
    const input = document.getElementById('userSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    if (input) {
        input.value = '';
        currentUserSearch = '';
        if (clearBtn) clearBtn.style.display = 'none';
        applyUserFilters();
        input.focus();
    }
}

// ── Logout Modal ──────────────────────────────────────────────────
function showLogoutModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    overlay.innerHTML = `
        <div class="modal-popup">
            <div class="modal-icon">🚪</div>
            <h3>Logout Confirmation</h3>
            <p>Are you sure you want to logout? You'll need to sign in again to access your admin panel.</p>
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-cancel" onclick="closeModal()">Cancel</button>
                <button class="modal-btn modal-btn-logout" onclick="confirmLogout()">Yes, Logout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

async function confirmLogout() {
    closeModal();
    
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
        sessionStorage.clear();
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('email');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('role');
        sessionStorage.removeItem('role');
        window.location.href = '/';
    }
}

// ── Switch between sections ──────────────────────────────────────────
function switchSection(section) {
    document.querySelectorAll('.section-content').forEach(el => {
        el.style.display = 'none';
    });
    
    const targetSection = document.getElementById('section-' + section);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const sidebarNav = document.getElementById('nav' + section.charAt(0).toUpperCase() + section.slice(1));
    if (sidebarNav) sidebarNav.classList.add('active');
    
    if (section === 'users') {
        currentUserFilter = 'all';
        currentUserSearch = '';
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) clearBtn.style.display = 'none';
        
        document.querySelectorAll('.user-filter-btn').forEach(btn => {
            if (btn.dataset.filter === 'all') {
                btn.classList.add('active');
                btn.style.background = '#38bdf8';
                btn.style.color = '#0f172a';
                btn.style.border = 'none';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = '#94a3b8';
                btn.style.border = '1px solid #334155';
            }
        });
        
        loadRegisteredUsers();
    } else if (section === 'dashboard') {
        loadAdminStats();
    } else if (section === 'messages') {
        loadAdminCustomers();
        if (adminCurrentCustomer) {
            loadAdminConversation(adminCurrentCustomer);
        } else {
            loadFirstUnreadAdminConversation();
        }
        loadUnreadCount();
        connectAdminSocket();
    }
}

// ── LOAD FIRST CONVERSATION WITH UNREAD MESSAGES (ADMIN) ──────────
async function loadFirstUnreadAdminConversation() {
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
                await loadAdminConversation(unreadSenders[0].email);
            } else {
                await loadAdminConversation(sortedSenders[0].email);
            }
        }
    } catch (error) {
        console.error('Error loading first conversation:', error);
    }
}

// ── Switch between charts ────────────────────────────────────────────
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
    
    const labels = {
        'trends': '📈 Appointment Trends',
        'pettypes': '🐾 Pet Types',
        'status': '📊 Appointment Status',
        'growth': '📈 Monthly Growth',
        'users': '👥 User Growth'
    };
    document.getElementById('currentChartLabel').textContent = labels[chartName] || chartName;
}

// ── Load Admin Stats ──────────────────────────────────────────────────
async function loadAdminStats() {
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        
        if (data.success) {
            const stats = data.stats;
            
            document.getElementById('totalUsers').textContent = stats.total_users;
            document.getElementById('totalPets').textContent = stats.total_pets;
            document.getElementById('totalAppointments').textContent = stats.total_appointments;
            document.getElementById('totalStaff').textContent = stats.total_staff;
            document.getElementById('totalVets').textContent = stats.total_vets;
            
            document.getElementById('dailyAverage').textContent = stats.avg_appointments_per_day;
            document.getElementById('newPetsThisMonth').textContent = stats.new_pets_this_month;
            document.getElementById('newUsersThisMonth').textContent = stats.new_users_this_month;
            document.getElementById('completionRate').textContent = stats.completion_rate + '%';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ── ADMIN CHART WEEK NAVIGATION ──────────────────────────────────
let adminWeekOffset = 0;
let adminChartInstance = null;

// ⭐ UPDATED: loadAdminChartData with forced refresh
async function loadAdminChartData(weekOffset = 0) {
    try {
        // Store the new offset
        adminWeekOffset = weekOffset;
        
        // Show loading state
        const weekLabel = document.getElementById('adminWeekLabel');
        if (weekLabel) {
            weekLabel.textContent = '⏳ Loading...';
            weekLabel.style.color = '#f59e0b';
        }
        
        console.log(`📊 Fetching admin chart data for week offset: ${weekOffset}`);
        
        const res = await fetch(`/api/admin/chart-data?week_offset=${weekOffset}`);
        const data = await res.json();
        
        console.log(`📊 Admin API Response:`, data);
        
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
            if (adminChartInstance) {
                adminChartInstance.destroy();
                adminChartInstance = null;
            }
            
            // Clear the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Create new chart
            adminChartInstance = new Chart(ctx, {
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
            adminChartInstance.update();
            
            // Update button states
            updateAdminButtons(weekOffset);
            
            console.log(`✅ Admin chart loaded for week offset: ${weekOffset}`);
            console.log(`📊 Data:`, chartData.trends.values);
        } else {
            console.error('API returned error:', data);
            const weekLabel = document.getElementById('adminWeekLabel');
            if (weekLabel) {
                weekLabel.textContent = '❌ Error loading data';
                weekLabel.style.color = '#ef4444';
            }
        }
    } catch (error) {
        console.error('Error loading admin chart data:', error);
        const weekLabel = document.getElementById('adminWeekLabel');
        if (weekLabel) {
            weekLabel.textContent = '❌ Error loading data';
            weekLabel.style.color = '#ef4444';
        }
    }
}

function updateAdminButtons(weekOffset) {
    // Find buttons by their onclick attributes
    const allButtons = document.querySelectorAll('#chart-trends button');
    let prevBtn = null;
    let nextBtn = null;
    let todayBtn = null;
    
    allButtons.forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick.includes('changeAdminWeek(-1)')) {
            prevBtn = btn;
        } else if (onclick.includes('changeAdminWeek(1)')) {
            nextBtn = btn;
        } else if (onclick.includes('changeAdminWeek(0)')) {
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

function changeAdminWeek(delta) {
    const newOffset = adminWeekOffset + delta;
    console.log(`🔄 Changing admin week from ${adminWeekOffset} to ${newOffset}`);
    loadAdminChartData(newOffset);
}

// ── LOAD REAL CHART DATA FROM DATABASE ──────────────────────────────
async function loadChartData() {
    // Load appointment trends with current week offset
    await loadAdminChartData(0);
    
    // Load other charts (pet types, status, etc.) - same as before
    try {
        const res = await fetch('/api/admin/chart-data');
        const data = await res.json();
        
        if (data.success) {
            const chartData = data.data;
            
            // Pet Type Chart
            const ctx2 = document.getElementById('petTypeChart').getContext('2d');
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: chartData.pet_types.labels,
                    datasets: [{
                        data: chartData.pet_types.values,
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
            
            // Appointment Status Chart
            const ctx3 = document.getElementById('appointmentStatusChart').getContext('2d');
            new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: chartData.status.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: chartData.status.values,
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
            
            // Monthly Growth Chart
            const ctx4 = document.getElementById('monthlyGrowthChart').getContext('2d');
            new Chart(ctx4, {
                type: 'bar',
                data: {
                    labels: chartData.monthly_growth.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: chartData.monthly_growth.values,
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
            
            // User Growth Chart
            const ctx5 = document.getElementById('userGrowthChart').getContext('2d');
            new Chart(ctx5, {
                type: 'line',
                data: {
                    labels: chartData.user_growth.labels,
                    datasets: [{
                        label: 'Users',
                        data: chartData.user_growth.values,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#0f172a',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8' } } },
                    scales: {
                        x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', maxTicksLimit: 6 } },
                        y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', stepSize: 5 }, beginAtZero: true }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}

// ── SocketIO Connection for Admin ──────────────────────────────────
let adminSocket = null;

function connectAdminSocket() {
    if (adminSocket && adminSocket.connected) return;
    
    adminSocket = io();
    const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
    if (currentUser) {
        adminSocket.emit('register_user', { email: currentUser });
    }
    
    adminSocket.on('new_message', function(data) {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        if (data.receiver === currentUser || data.sender === currentUser) {
            loadUnreadCount();
            setTimeout(function() { loadUnreadCount(); }, 500);
            const messagesSection = document.getElementById('section-messages');
            if (messagesSection && messagesSection.style.display !== 'none') {
                loadAdminCustomers();
                if (adminCurrentCustomer && data.sender === adminCurrentCustomer) {
                    loadAdminConversation(adminCurrentCustomer);
                }
            }
            console.log(`📩 New message from ${data.sender || 'Customer'} - Unread count updated.`);
        }
    });
    
    adminSocket.on('connect', function() {
        console.log('Admin connected to WebSocket');
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        if (currentUser) {
            adminSocket.emit('register_user', { email: currentUser });
        }
    });
    
    adminSocket.on('disconnect', function() {
        console.log('Admin disconnected from WebSocket');
        setTimeout(connectAdminSocket, 2000);
    });
}

// ── Load Unread Count ─────────────────────────────────────────────────
async function loadUnreadCount() {
    try {
        const res = await fetch('/api/messages/unread-count');
        const data = await res.json();
        
        const badge = document.getElementById('unreadBadge');
        const display = document.getElementById('unreadCountDisplay');
        
        console.log(`📊 Unread count: ${data.count}`);
        
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'inline-block';
                badge.style.animation = 'pulse 1.5s ease-in-out infinite';
                if (display) display.textContent = `${data.count} unread`;
                console.log(`✅ Badge updated: ${data.count} unread messages`);
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                badge.style.animation = 'none';
                if (display) display.textContent = '0 unread';
            }
        } else {
            console.warn('⚠️ Badge element not found!');
        }
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

// ── MARK MESSAGES AS READ (ADMIN) ────────────────────────────────────
async function markAdminMessagesAsRead(customerEmail) {
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
            await loadAdminCustomers();
            loadUnreadCount();
            const activeItem = document.querySelector('.customer-item.active');
            if (activeItem) {
                const badge = activeItem.querySelector('.unread-badge');
                if (badge) {
                    badge.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// ── ADMIN MESSAGES WITH SEARCH ──────────────────────────────────────
let adminCurrentCustomer = null;
let adminAllCustomers = [];
let adminFilteredCustomers = [];

// ── Load Admin Customers with Search Support ──────────────────────
async function loadAdminCustomers() {
    const container = document.getElementById('adminCustomerList');
    
    container.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #64748b;">
            ⏳ Loading customers...
        </div>
    `;
    
    try {
        const res = await fetch('/api/messages/received-only');
        const data = await res.json();
        
        if (data.success && data.senders && data.senders.length > 0) {
            adminAllCustomers = data.senders.sort((a, b) => {
                if (a.unread_count > 0 && b.unread_count === 0) return -1;
                if (a.unread_count === 0 && b.unread_count > 0) return 1;
                const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
                const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
                return dateB - dateA;
            });
            
            renderAdminCustomerList(adminAllCustomers);
        } else {
            adminAllCustomers = [];
            container.innerHTML = `
                <div style="padding: 30px; text-align: center; color: #64748b;">
                    <div style="font-size: 40px; margin-bottom: 10px;">💬</div>
                    <p>No messages from customers yet.</p>
                    <p style="font-size: 12px; margin-top: 5px;">Messages sent to you will appear here.</p>
                </div>
            `;
            updateAdminSearchCount(0);
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

// ── Render Admin Customer List with Search ─────────────────────────
function renderAdminCustomerList(customers) {
    const container = document.getElementById('adminCustomerList');
    const searchInput = document.getElementById('adminMessageSearch');
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
    
    adminFilteredCustomers = filtered;
    updateAdminSearchCount(filtered.length);
    
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
        const isActive = adminCurrentCustomer === sender.email;
        const unreadBadge = sender.unread_count > 0 ? 
            `<span class="unread-badge">${sender.unread_count}</span>` : '';
        
        const lastMessageTime = sender.last_message_at ? 
            new Date(sender.last_message_at).toLocaleDateString() : '';
        
        const div = document.createElement('div');
        div.className = 'customer-item';
        if (isActive) div.classList.add('active');
        
        // ✅ Avatar HTML — may profile image o default icon
        const avatarHTML = sender.profile_image
            ? `<img src="${sender.profile_image}" alt="${sender.fullname || sender.email}" 
                    onclick="event.stopPropagation(); window.openAdminImageViewer('${sender.profile_image}')">`
            : `<span style="font-size: 16px;">👤</span>`;
        
        div.innerHTML = `
            <div class="avatar">${avatarHTML}</div>
            <div class="info">
                <div class="name">${sender.fullname || sender.email}</div>
                <div class="email">${sender.email} • ${sender.phone || 'No phone'}</div>
                ${lastMessageTime ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;"> ${lastMessageTime}</div>` : ''}
            </div>
            ${unreadBadge}
        `;
        div.onclick = () => loadAdminConversation(sender.email);
        container.appendChild(div);
    });
}

// ── Search Admin Messages ──────────────────────────────────────────
function searchAdminMessages() {
    const input = document.getElementById('adminMessageSearch');
    const clearBtn = document.getElementById('adminClearSearchBtn');
    
    if (input) {
        const searchTerm = input.value.trim();
        if (searchTerm !== '') {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
        renderAdminCustomerList(adminAllCustomers);
    }
}

// ── Clear Admin Message Search ─────────────────────────────────────
function clearAdminMessageSearch() {
    const input = document.getElementById('adminMessageSearch');
    const clearBtn = document.getElementById('adminClearSearchBtn');
    if (input) {
        input.value = '';
        if (clearBtn) clearBtn.style.display = 'none';
        renderAdminCustomerList(adminAllCustomers);
        input.focus();
    }
}

// ── Update Admin Search Result Count ──────────────────────────────
function updateAdminSearchCount(count) {
    const el = document.getElementById('adminSearchResultCount');
    if (el) {
        el.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
    }
}

// ── Init Admin Message Search ──────────────────────────────────────
function initAdminMessageSearch() {
    const searchInput = document.getElementById('adminMessageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchAdminMessages);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearAdminMessageSearch();
            }
        });
    }
    
    const searchWrapper = document.getElementById('adminSearchWrapper');
    if (searchWrapper) {
        searchWrapper.addEventListener('click', function() {
            const input = document.getElementById('adminMessageSearch');
            if (input) input.focus();
        });
    }
}

// ── LOAD ADMIN CONVERSATION ──────────────────────────────
async function loadAdminConversation(customerEmail) {
    adminCurrentCustomer = customerEmail;
    
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
    
    // ✅ Header avatar HTML (may profile image o default icon)
    const headerAvatarHTML = customerProfileImage
        ? `<img src="${customerProfileImage}" alt="${customerName}" 
                onclick="event.stopPropagation(); window.openAdminImageViewer('${customerProfileImage}')">`
        : `<span style="font-size: 20px;">👤</span>`;
    
    document.getElementById('adminConversationHeader').innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="header-avatar" 
                 onclick="event.stopPropagation(); ${customerProfileImage ? `window.openAdminImageViewer('${customerProfileImage}')` : ''}"
                 style="${customerProfileImage ? 'cursor: pointer;' : 'cursor: default;'}">
                ${headerAvatarHTML}
            </div>
            <div>
                <div style="color: #e2e8f0; font-weight: 500;">${customerName}</div>
                <div style="color: #64748b; font-size: 12px;">${customerEmail}</div>
            </div>
        </div>
    `;
    
    document.getElementById('adminReplyCustomerEmail').value = customerEmail;
    document.getElementById('adminReplyMessage').value = '';
    document.getElementById('adminReplyMessage').placeholder = 'Type your reply...';
    
    try {
        const res = await fetch(`/api/messages/${customerEmail}`);
        const data = await res.json();
        
        const container = document.getElementById('adminConversationMessages');
        
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
                
                let senderName = isStaff ? 'Admin' : customerName;
                let senderColor = isStaff ? '#0f172a' : '#38bdf8';
                
                const msgDate = new Date(msg.created_at);
                const formattedDate = msgDate.toLocaleString();
                
                let messageHTML = `
                    <div style="max-width: 70%;">
                        <div style="background: ${isStaff ? '#38bdf8' : '#1e293b'}; padding: 10px 15px; border-radius: 12px; ${isStaff ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                            <div style="font-size: 11px; color: ${senderColor}; font-weight: 600; margin-bottom: 3px;">${senderName}</div>
                            ${messageText ? `<div style="color: ${isStaff ? '#0f172a' : '#e2e8f0'}; word-wrap: break-word;">${messageText}</div>` : ''}
                `;
                
                if (imageData && imageData.startsWith('data:image')) {
                    messageHTML += `
                        <div style="margin-top: 10px;">
                            <img src="${imageData}" 
                                 style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #334155; display: block;" 
                                 onclick="window.openImageFullscreenAdmin('${imageData}')"
                                 alt="Image">
                        </div>
                    `;
                }
                
                messageHTML += `
                        </div>
                        <div style="font-size: 10px; color: #64748b; margin-top: 3px; ${isStaff ? 'text-align: right;' : 'text-align: left;'}">
                            ${formattedDate}
                        </div>
                    </div>
                `;
                
                div.innerHTML = messageHTML;
                container.appendChild(div);
            });
            container.scrollTop = container.scrollHeight;
            
            await markAdminMessagesAsRead(customerEmail);
        } else {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 40px;">
                    No messages yet.
                </div>
            `;
        }
        
        renderAdminCustomerList(adminAllCustomers);
        loadUnreadCount();
    } catch (error) {
        console.error('Error loading conversation:', error);
        document.getElementById('adminConversationMessages').innerHTML = `
            <div style="text-align: center; color: #ef4444; padding: 40px;">
                ❌ Error loading messages
            </div>
        `;
    }
}

// ── ADMIN IMAGE FULLSCREEN FUNCTION (MESSAGES) ────────────────────
function openImageFullscreenAdmin(imageSrc) {
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

// ── ADMIN PROFILE IMAGE VIEWER (FULLSCREEN) ───────────────────────
function openAdminImageViewer(imageSrc) {
    const viewer = document.getElementById('adminImageViewer');
    const viewerImg = document.getElementById('adminViewerImage');
    
    if (!viewer || !viewerImg) return;
    
    viewerImg.src = imageSrc;
    viewer.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAdminImageViewer(event) {
    if (event.target.id === 'adminImageViewer' || 
        event.target.classList.contains('close-viewer')) {
        const viewer = document.getElementById('adminImageViewer');
        if (viewer) {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
}

// Close viewer on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const viewer = document.getElementById('adminImageViewer');
        if (viewer && viewer.style.display === 'flex') {
            viewer.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
});

// ── SEND ADMIN REPLY ────────────────────────────────────────────
async function sendAdminReply(e) {
    e.preventDefault();
    
    const customerEmail = document.getElementById('adminReplyCustomerEmail').value;
    const message = document.getElementById('adminReplyMessage').value.trim();
    
    if (!message) {
        const input = document.getElementById('adminReplyMessage');
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
    
    const btn = document.querySelector('#adminReplyForm button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Sending...';
    btn.disabled = true;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        if (adminSocket && adminSocket.connected) {
            adminSocket.emit('send_message', {
                sender: currentUser,
                receiver: customerEmail,
                message: message,
                subject: 'Admin Reply',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
        }
        
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                subject: 'Admin Reply',
                message: message,
                receiver: customerEmail
            })
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('adminReplyMessage').value = '';
            const input = document.getElementById('adminReplyMessage');
            input.placeholder = '✅ Message sent!';
            input.style.borderColor = '#10b981';
            setTimeout(() => {
                input.placeholder = 'Type your reply...';
                input.style.borderColor = '#334155';
            }, 2000);
            loadAdminConversation(customerEmail);
            console.log('✅ Reply sent successfully!');
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

// ── EMOJI PICKER FOR ADMIN ──────────────────────────────────────────
let adminEmojiPickerVisible = false;

function toggleAdminEmojiPicker() {
    const picker = document.getElementById('adminEmojiPicker');
    if (!picker) return;
    
    adminEmojiPickerVisible = !adminEmojiPickerVisible;
    picker.style.display = adminEmojiPickerVisible ? 'flex' : 'none';
}

function insertAdminEmoji(emoji) {
    const input = document.getElementById('adminReplyMessage');
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + emoji.length;
    
    if (adminEmojiPickerVisible) {
        toggleAdminEmojiPicker();
    }
}

// ── IMAGE UPLOAD FOR ADMIN ──────────────────────────────────────────
let adminPendingImage = null;

function showAdminImageUploadModal() {
    let modal = document.getElementById('adminImageUploadModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminImageUploadModal';
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
                     id="adminImageUploadDropzone"
                     onclick="document.getElementById('adminImageUploadInput').click()">
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <p style="color: #94a3b8; font-size: 14px;">Click or drag to upload image</p>
                    <p style="color: #64748b; font-size: 12px;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="adminImageUploadInput" accept="image/*" style="display: none;">
                
                <div id="adminImagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="adminImagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="closeAdminImageUploadModal()" style="flex: 1;">Cancel</button>
                        <button class="modal-btn modal-btn-submit" onclick="sendAdminImageMessage()" id="adminSendImageBtn" style="flex: 1; background: #38bdf8; color: #0f172a;">📤 Send Image</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAdminImageUploadModal();
            }
        });
        
        const fileInput = document.getElementById('adminImageUploadInput');
        fileInput.addEventListener('change', function(e) {
            previewAdminImage(e);
        });
        
        const dropzone = document.getElementById('adminImageUploadDropzone');
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
                document.getElementById('adminImageUploadInput').files = files;
                previewAdminImage({ target: { files: files } });
            }
        });
    }
    
    document.getElementById('adminImagePreviewContainer').style.display = 'none';
    document.getElementById('adminImageUploadInput').value = '';
    document.getElementById('adminImageUploadDropzone').style.borderColor = '#334155';
    document.getElementById('adminImageUploadDropzone').style.background = 'transparent';
    document.getElementById('adminSendImageBtn').disabled = false;
    document.getElementById('adminSendImageBtn').textContent = '📤 Send Image';
    adminPendingImage = null;
    
    modal.style.display = 'flex';
}

function closeAdminImageUploadModal() {
    const modal = document.getElementById('adminImageUploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
    adminPendingImage = null;
}

function previewAdminImage(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        document.getElementById('adminImageUploadInput').value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Please upload under 5MB.');
        document.getElementById('adminImageUploadInput').value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('adminImagePreview');
        preview.src = e.target.result;
        document.getElementById('adminImagePreviewContainer').style.display = 'block';
        adminPendingImage = {
            data: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
        };
    };
    reader.readAsDataURL(file);
}

async function sendAdminImageMessage() {
    const imageData = adminPendingImage;
    if (!imageData) {
        alert('Please select an image first.');
        return;
    }
    
    const customerEmail = document.getElementById('adminReplyCustomerEmail').value;
    if (!customerEmail) {
        alert('Please select a customer first.');
        return;
    }
    
    const btn = document.getElementById('adminSendImageBtn');
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
            closeAdminImageUploadModal();
            await loadAdminConversation(customerEmail);
            await loadAdminCustomers();
            loadUnreadCount();
            
            if (adminSocket && adminSocket.connected) {
                adminSocket.emit('send_message', {
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

// ── INITIALIZE ADMIN EMOJI PICKER ──────────────────────────────────
function initAdminEmojiPicker() {
    if (document.getElementById('adminEmojiPicker')) return;
    
    const footer = document.querySelector('#adminReplyForm').parentElement;
    if (!footer) return;
    
    footer.style.position = 'relative';
    
    const picker = document.createElement('div');
    picker.id = 'adminEmojiPicker';
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
        btn.onclick = () => insertAdminEmoji(emoji);
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
    closeBtn.onclick = toggleAdminEmojiPicker;
    closeBtn.onmouseover = () => { closeBtn.style.background = '#dc2626'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = '#ef4444'; };
    picker.appendChild(closeBtn);
    
    footer.appendChild(picker);
}

// ── ADD EMOJI AND IMAGE BUTTONS TO ADMIN REPLY FORM ──────────────
function addAdminMessageButtons() {
    const replyForm = document.getElementById('adminReplyForm');
    if (!replyForm) return;
    
    if (document.getElementById('adminEmojiBtn')) return;
    
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
    emojiBtn.id = 'adminEmojiBtn';
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
    emojiBtn.onclick = toggleAdminEmojiPicker;
    
    const imageBtn = document.createElement('button');
    imageBtn.id = 'adminImageBtn';
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
    imageBtn.onclick = showAdminImageUploadModal;
    
    const parent = sendBtn.parentNode;
    parent.insertBefore(btnContainer, sendBtn);
    btnContainer.appendChild(emojiBtn);
    btnContainer.appendChild(imageBtn);
    
    sendBtn.style.marginLeft = 'auto';
}

// ── Chart Initialization ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('section-dashboard').style.display = 'block';
    loadAdminStats();
    loadChartData();
    loadUnreadCount();
    connectAdminSocket();
    initAdminEmojiPicker();
    addAdminMessageButtons();
    initAdminMessageSearch();
});

window.addEventListener('pageshow', function() {
    if (document.getElementById('section-dashboard').style.display !== 'none') {
        loadAdminStats();
    }
    loadUnreadCount();
});

window.toggleMobileSidebar = toggleMobileSidebar;
window.switchSection = switchSection;
window.switchChart = switchChart;
window.showLogoutModal = showLogoutModal;
window.closeModal = closeModal;
window.confirmLogout = confirmLogout;
window.loadAdminCustomers = loadAdminCustomers;
window.loadAdminConversation = loadAdminConversation;
window.sendAdminReply = sendAdminReply;
window.loadUnreadCount = loadUnreadCount;
window.connectAdminSocket = connectAdminSocket;
window.loadFirstUnreadAdminConversation = loadFirstUnreadAdminConversation;
window.openImageFullscreenAdmin = openImageFullscreenAdmin;
window.openAdminImageViewer = openAdminImageViewer;
window.closeAdminImageViewer = closeAdminImageViewer;
window.toggleAdminEmojiPicker = toggleAdminEmojiPicker;
window.insertAdminEmoji = insertAdminEmoji;
window.showAdminImageUploadModal = showAdminImageUploadModal;
window.closeAdminImageUploadModal = closeAdminImageUploadModal;
window.sendAdminImageMessage = sendAdminImageMessage;
window.filterUsers = filterUsers;
window.searchUsers = searchUsers;
window.clearSearch = clearSearch;
window.searchAdminMessages = searchAdminMessages;
window.clearAdminMessageSearch = clearAdminMessageSearch;
window.initAdminMessageSearch = initAdminMessageSearch;
window.renderAdminCustomerList = renderAdminCustomerList;
window.loadChartData = loadChartData;
window.loadAdminChartData = loadAdminChartData;
window.changeAdminWeek = changeAdminWeek;
window.showUserDetailsModal = showUserDetailsModal;
window.closeUserDetailsModal = closeUserDetailsModal;

(function initAdminSocket() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            connectAdminSocket();
            loadUnreadCount();
        });
    } else {
        connectAdminSocket();
        loadUnreadCount();
    }
})();

// ── SHOW USER DETAILS MODAL (ADMIN) ────────────────────────────────
async function showUserDetailsModal(userId) {
    console.log(`👤 Opening user details modal for user ID: ${userId}`);
    
    // Create loading modal
    let modal = document.getElementById('userDetailsModal');
    if (modal) modal.remove();
    
    modal = document.createElement('div');
    modal.id = 'userDetailsModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="
            background: #1e293b;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            border: 1px solid #334155;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            text-align: center;
        ">
            <div style="font-size: 40px; margin-bottom: 15px;">⏳</div>
            <p style="color: #94a3b8;">Loading user details...</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeUserDetailsModal();
        }
    });
    
    try {
        const res = await fetch(`/api/admin/user/${userId}`);
        const data = await res.json();
        
        if (!data.success) {
            closeUserDetailsModal();
            alert('❌ ' + (data.message || 'Error loading user details.'));
            return;
        }
        
        const user = data.user;
        const pets = data.pets || [];
        const appointmentCount = data.appointment_count || 0;
        
        // ── Avatar HTML ─────────────────────────────────────────
        const initial = (user.fullname || 'U').trim()[0].toUpperCase();
        let avatarHTML;
        const hasProfileImage = !!user.profile_image;

        if (user.profile_image) {
            avatarHTML = `<img src="${user.profile_image}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            let bgColor = '#7ba05b';
            if (user.role === 'admin') bgColor = '#8b5cf6';
            else if (user.role === 'staff') bgColor = '#f59e0b';
            else if (user.role === 'vet') bgColor = '#3b82f6';
            else if (user.role === 'user') bgColor = '#10b981';
            
            avatarHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 32px;">${initial}</div>`;
        }
        
        // ── Role badge color ────────────────────────────────────
        const roleColors = {
            admin: '#8b5cf6',
            staff: '#f59e0b',
            vet: '#3b82f6',
            user: '#10b981'
        };
        const roleColor = roleColors[user.role] || '#7ba05b';
        
        // ── Pets HTML ────────────────────────────────────────────
        let petsHTML = '';
        if (pets.length === 0) {
            petsHTML = `
                <div style="text-align: center; padding: 30px; color: #64748b; background: #0f172a; border-radius: 12px; border: 1px dashed #334155;">
                    <div style="font-size: 36px; margin-bottom: 8px;">🐾</div>
                    <p style="margin: 0; font-size: 13px;">No pets registered yet.</p>
                </div>
            `;
        } else {
            petsHTML = pets.map(pet => {
                const petIcon = pet.pet_type === 'Cat' ? '🐈' : '🐕';
                
                let petAvatarHTML;
                if (pet.pet_image) {
                    petAvatarHTML = `<img src="${pet.pet_image}" alt="${pet.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
                } else {
                    petAvatarHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 22px;">${petIcon}</div>`;
                }
                
                const hasPetImage = !!pet.pet_image;

                return `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: #0f172a;
                        border: 1px solid #334155;
                        border-radius: 12px;
                        margin-bottom: 8px;
                    ">
                        <div class="modal-pet-avatar ${hasPetImage ? '' : 'no-image'}"
                            ${hasPetImage ? `onclick="event.stopPropagation(); window.openAdminImageViewer('${pet.pet_image}')"` : ''}
                            style="width: 44px; height: 44px; border-radius: 10px; background: rgba(56, 189, 248, 0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
                            ${petAvatarHTML}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="color: #e2e8f0; font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${pet.name} <span style="color: #64748b; font-size: 11px; font-weight: 400;">${petIcon}</span>
                            </div>
                            <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">
                                ${pet.pet_type || 'Dog'} • ${pet.breed || 'Mixed Breed'} • ${pet.age || '?'} yrs
                            </div>
                            ${pet.allergies && pet.allergies !== 'None' ? `
                                <div style="color: #ef4444; font-size: 11px; margin-top: 4px;">
                                    ⚠️ Allergies: ${pet.allergies}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // ── Full Modal HTML ──────────────────────────────────────
        modal.innerHTML = `
            <div style="
                background: #1e293b;
                border-radius: 20px;
                max-width: 550px;
                width: 100%;
                border: 1px solid #334155;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                animation: slideUp 0.3s ease;
            ">
                <!-- Close X Button -->
                <button onclick="closeUserDetailsModal()" style="
                    position: absolute;
                    top: 12px;
                    right: 14px;
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 4px 10px;
                    line-height: 1;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    z-index: 10;
                " onmouseover="this.style.color='#ef4444'; this.style.background='rgba(239,68,68,0.1)'" 
                   onmouseout="this.style.color='#94a3b8'; this.style.background='transparent'">✕</button>
                
                <!-- Header Section -->
                <div style="
                    padding: 30px 30px 20px;
                    border-bottom: 1px solid #334155;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                ">
                    <div class="modal-profile-avatar ${hasProfileImage ? '' : 'no-image'}"
                        ${hasProfileImage ? `onclick="window.openAdminImageViewer('${user.profile_image}')"` : ''}
                        style="
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            overflow: hidden;
                            flex-shrink: 0;
                            border: 3px solid #334155;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        ">
                        ${avatarHTML}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h2 style="
                            color: #e2e8f0;
                            font-size: 20px;
                            font-weight: 700;
                            margin: 0 0 4px;
                            word-break: break-word;
                        ">
                            ${user.fullname || 'Unknown User'}
                        </h2>
                        <div style="
                            color: #94a3b8;
                            font-size: 13px;
                            margin-bottom: 8px;
                            word-break: break-all;
                        ">
                            ${user.email}
                        </div>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <span style="
                                background: ${roleColor};
                                color: #fff;
                                padding: 3px 12px;
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 700;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">
                                ${user.role}
                            </span>
                            <span style="
                                background: ${user.is_verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
                                color: ${user.is_verified ? '#10b981' : '#ef4444'};
                                padding: 3px 12px;
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 700;
                            ">
                                ${user.is_verified ? '✓ Verified' : '✕ Unverified'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- User Info Section -->
                <div style="padding: 20px 30px; border-bottom: 1px solid #334155;">
                    <h3 style="
                        color: #38bdf8;
                        font-size: 13px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        margin: 0 0 14px;
                    ">
                        👤 Personal Information
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">Phone</div>
                            <div style="color: #e2e8f0; font-size: 13px;">${user.phone || '—'}</div>
                        </div>
                        <div>
                            <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">User ID</div>
                            <div style="color: #e2e8f0; font-size: 13px;">#${user.id}</div>
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">Address</div>
                            <div style="color: #e2e8f0; font-size: 13px;">${user.address || '—'}</div>
                        </div>
                        <div>
                            <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">Registered</div>
                            <div style="color: #e2e8f0; font-size: 13px;">${user.created_at || '—'}</div>
                        </div>
                        <div>
                            <div style="color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; font-weight: 600;">Appointments</div>
                            <div style="color: #38bdf8; font-size: 13px; font-weight: 700;">${appointmentCount} total</div>
                        </div>
                    </div>
                </div>
                
                <!-- Pets Section -->
                <div style="padding: 20px 30px 30px;">
                    <h3 style="
                        color: #38bdf8;
                        font-size: 13px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        margin: 0 0 14px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        <span>🐾 Pets (${pets.length})</span>
                    </h3>
                    <div>
                        ${petsHTML}
                    </div>
                </div>
            </div>
        `;
        
        // Re-attach close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeUserDetailsModal();
            }
        });
        
    } catch (error) {
        console.error('Error loading user details:', error);
        closeUserDetailsModal();
        alert('❌ Error loading user details. Please try again.');
    }
}

function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => modal.remove(), 200);
    }
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeUserDetailsModal();
    }
});