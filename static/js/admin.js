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
                <i class="fas fa-spinner fa-spin"></i> Loading users...
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
                    <i class="fas fa-times-circle"></i> Error loading users. Please refresh the page.
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
        
        const initial = nameDisplay !== '—' ? nameDisplay.trim()[0].toUpperCase() : 'U';
        let avatarHTML;
        
        if (user.profile_image) {
            avatarHTML = `
                <img src="${user.profile_image}" 
                     alt="Profile" 
                     style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid #334155; flex-shrink: 0;">
            `;
        } else {
            let bgColor = '#7ba05b';
            if (user.role === 'admin') bgColor = '#8b5cf6';
            else if (user.role === 'staff') bgColor = '#f59e0b';
            else if (user.role === 'vet') bgColor = '#3b82f6';
            else if (user.role === 'user') bgColor = '#10b981';
            
            avatarHTML = `
                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; border: 2px solid #334155; flex-shrink: 0;">
                    ${initial}
                </div>
            `;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="ID">${user.id}</td>
            <td data-label="Name">
                <div class="user-name-clickable" 
                     onclick="showUserDetailsModal(${user.id})"
                     title="Click to view details">
                    ${avatarHTML}
                    <strong style="color: #e2e8f0;">${nameDisplay}</strong>
                </div>
            </td>
            <td data-label="Email"><span class="truncate" title="${user.email}">${user.email}</span></td>
            <td data-label="Phone">${user.phone || '—'}</td>
            <td data-label="Address"><span class="truncate" title="${user.address || ''}">${user.address || '—'}</span></td>
            <td data-label="Role">
                <span class="role-badge ${roleClass}">
                    ${roleDisplay}
                </span>
            </td>
            <td data-label="Created">${user.created_at || '—'}</td>
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
            <div class="modal-icon"><i class="fas fa-sign-out-alt"></i></div>
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
        // 📱 Reset mobile slide-in state
        const messagesGrid = document.querySelector('#section-messages .messages-grid');
        if (messagesGrid) {
            messagesGrid.classList.remove('has-active-conversation');
        }
        
        loadAdminCustomers();
        
        // 📱 MOBILE: Huwag auto-load ng conversation — customer list muna
        // 🖥️ DESKTOP: Auto-load ang conversation (existing behavior)
        if (window.innerWidth > 768) {
            if (adminCurrentCustomer) {
                loadAdminConversation(adminCurrentCustomer);
            } else {
                loadFirstUnreadAdminConversation();
            }
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

// ═══════════════════════════════════════════════════════════════════
// 🎨 GREEN THEME COLORS — Chart Palette
// ═══════════════════════════════════════════════════════════════════
const CHART_COLORS = {
    primary: '#7ba05b',
    primaryDark: '#5a7a3f',
    primaryLight: '#a8c48c',
    green1: '#7ba05b',
    green2: '#5a7a3f',
    green3: '#a8c48c',
    green4: '#4a6b32',
    green5: '#c5d9b4',
    pending: '#f59e0b',
    confirmed: '#7ba05b',
    completed: '#5a7a3f',
    cancelled: '#ef4444',
    greenTransparent: 'rgba(123, 160, 91, 0.15)',
    greenTransparentDark: 'rgba(90, 122, 63, 0.15)',
    gridColor: 'rgba(123, 160, 91, 0.15)',
    tickColor: '#5a7a3f',
    labelColor: '#5a7a3f',
    pointBorder: '#ffffff'
};

// ═══════════════════════════════════════════════════════════════════
// 📊 BREAKDOWN TABLES — Chart side tables (with % share)
// ═══════════════════════════════════════════════════════════════════
function renderBreakdown(targetPrefix, labels, values, options = {}) {
    const body = document.getElementById(targetPrefix + 'Body');
    const footer = document.getElementById(targetPrefix + 'Footer');
    const totalEl = document.getElementById(targetPrefix + 'Total');
    
    if (!body) {
        console.warn('⚠️ Breakdown body not found:', targetPrefix + 'Body');
        return;
    }
    
    const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
    const maxValue = Math.max(...values, 1);
    const colorFn = options.colorFn || null;
    const highlightLabel = options.highlightLabel || null;
    
    let html = '';
    
    labels.forEach((label, index) => {
        const count = Number(values[index]) || 0;
        const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
        const isHighlighted = (highlightLabel && highlightLabel === label);
        
        let barColor;
        if (colorFn) {
            barColor = colorFn(label, count);
        } else {
            barColor = count > 0 
                ? 'linear-gradient(90deg, #7ba05b, #5a7a3f)' 
                : 'transparent';
        }
        
        const countColor = count > 0 ? '#5a7a3f' : '#cbd5c0';
        
        html += `
            <div style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: ${isHighlighted ? 'rgba(123, 160, 91, 0.08)' : 'transparent'};">
                <div style="width: 60px; min-width: 60px; color: ${isHighlighted ? '#5a7a3f' : '#94a387'}; font-size: 11px; font-weight: ${isHighlighted ? '700' : '600'}; text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${label}
                </div>
                <div style="flex: 1; height: 8px; background: #eaf3e0; border-radius: 4px; overflow: hidden; min-width: 0;">
                    <div style="width: ${percentage}%; height: 100%; background: ${barColor}; border-radius: 4px; transition: width 0.4s ease;"></div>
                </div>
                <div style="display: flex; align-items: center; justify-content: flex-end; min-width: 40px; text-align: right;">
                    <span style="color: ${countColor}; font-size: 13px; font-weight: 700;">${count}</span>
                </div>
            </div>
        `;
    });
    
    body.innerHTML = html;
    
    if (footer && totalEl) {
        totalEl.textContent = total;
        footer.style.display = 'block';
    }
}

function renderWeeklyBreakdown(trendsData) {
    const values = trendsData?.values || [];
    const labels = trendsData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    renderBreakdown('weeklyBreakdown', labels, values, { highlightLabel: todayName });
}

function renderPetTypesBreakdown(petTypesData) {
    const labels = petTypesData?.labels || [];
    const values = petTypesData?.values || [];
    const colorFn = (label, count) => {
        if (count === 0) return 'transparent';
        const lower = label.toLowerCase();
        if (lower.includes('dog')) return 'linear-gradient(90deg, #7ba05b, #5a7a3f)';
        if (lower.includes('cat')) return 'linear-gradient(90deg, #a8c48c, #7ba05b)';
        return 'linear-gradient(90deg, #7ba05b, #5a7a3f)';
    };
    renderBreakdown('petTypesBreakdown', labels, values, { colorFn });
}

function renderStatusBreakdown(statusData) {
    const labels = statusData?.labels || [];
    const values = statusData?.values || [];
    const colorFn = (label, count) => {
        if (count === 0) return 'transparent';
        const lower = label.toLowerCase();
        if (lower === 'pending') return 'linear-gradient(90deg, #f59e0b, #d97706)';
        if (lower === 'confirmed') return 'linear-gradient(90deg, #7ba05b, #5a7a3f)';
        if (lower === 'completed') return 'linear-gradient(90deg, #4a6b32, #3d5429)';
        if (lower === 'cancelled') return 'linear-gradient(90deg, #ef4444, #dc2626)';
        return 'linear-gradient(90deg, #7ba05b, #5a7a3f)';
    };
    renderBreakdown('statusBreakdown', labels, values, { colorFn });
}

// ═══════════════════════════════════════════════════════════════════
// 📅 CUSTOM SORT FOR MONTHS (Para mailipat ang NOV at DEC sa dulo)
// ═══════════════════════════════════════════════════════════════════
function sortMonthsChronologically(labels, values) {
    const monthOrder = {
        'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
        'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12,
        'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4, 'JUNE': 6,
        'JULY': 7, 'AUGUST': 8, 'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
    };

    // Gumawa ng array ng objects para ma-sort
    const combined = labels.map((label, index) => ({
        label: label,
        value: values[index],
        order: monthOrder[label.toUpperCase()] || 99 // Default sa dulo kung hindi mahanap
    }));

    // I-sort base sa order
    combined.sort((a, b) => a.order - b.order);

    // I-return ang sorted labels at values
    return {
        labels: combined.map(item => item.label),
        values: combined.map(item => item.value)
    };
}

function renderGrowthBreakdown(growthData) {
    const rawLabels = growthData?.labels || [];
    const rawValues = growthData?.values || [];
    
    // I-sort ang data bago i-render
    const sorted = sortMonthsChronologically(rawLabels, rawValues);
    
    renderBreakdown('growthBreakdown', sorted.labels, sorted.values);
}

function renderUserGrowthBreakdown(userGrowthData) {
    const rawLabels = userGrowthData?.labels || [];
    const rawValues = userGrowthData?.values || [];
    
    // I-sort ang data bago i-render
    const sorted = sortMonthsChronologically(rawLabels, rawValues);
    
    renderBreakdown('userGrowthBreakdown', sorted.labels, sorted.values);
}

// ── ADMIN CHART WEEK NAVIGATION ──────────────────────────────────
let adminWeekOffset = 0;
let adminChartInstance = null;

async function loadAdminChartData(weekOffset = 0) {
    try {
        adminWeekOffset = weekOffset;
        
        const weekLabel = document.getElementById('adminWeekLabel');
        if (weekLabel) {
            weekLabel.textContent = 'Loading...';
            weekLabel.style.color = '#f59e0b';
        }
        
        const res = await fetch(`/api/admin/chart-data?week_offset=${weekOffset}`);
        const data = await res.json();
        
        if (data.success) {
            const chartData = data.data;
            
            if (weekLabel && chartData.trends.week_label) {
                weekLabel.textContent = chartData.trends.week_label;
                weekLabel.style.color = '#5a7a3f';
            }
            
            // ✅ RENDER WEEKLY BREAKDOWN TABLE
            renderWeeklyBreakdown(chartData.trends);
            
            const canvas = document.getElementById('appointmentTrendChart');
            if (!canvas) {
                console.error('Canvas element not found');
                return;
            }
            
            const ctx = canvas.getContext('2d');
            
            if (adminChartInstance) {
                adminChartInstance.destroy();
                adminChartInstance = null;
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const dataValues = chartData.trends.values || [];
            const maxValue = Math.max(...dataValues, 0);
            
            let suggestedMax;
            if (maxValue === 0) {
                suggestedMax = 4;
            } else if (maxValue <= 2) {
                suggestedMax = 3;
            } else if (maxValue <= 5) {
                suggestedMax = 5;
            } else if (maxValue <= 10) {
                suggestedMax = 10;
            } else {
                suggestedMax = Math.ceil(maxValue / 5) * 5;
            }
            
            adminChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.trends.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: chartData.trends.values,
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: 'rgba(123, 160, 91, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CHART_COLORS.primary,
                        pointBorderColor: CHART_COLORS.pointBorder,
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: CHART_COLORS.primaryDark,
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            labels: { 
                                color: CHART_COLORS.labelColor,
                                font: {
                                    family: 'Poppins',
                                    size: 12,
                                    weight: '500'
                                },
                                usePointStyle: true,
                                pointStyle: 'rectRounded'
                            } 
                        },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#2d3e1f',
                            bodyColor: '#5a7a3f',
                            borderColor: CHART_COLORS.primary,
                            borderWidth: 1,
                            titleFont: {
                                family: 'Poppins',
                                size: 13,
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Poppins',
                                size: 12
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: { 
                            grid: { 
                                color: CHART_COLORS.gridColor,
                                drawBorder: false
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor,
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        },
                        y: { 
                            beginAtZero: true,
                            min: 0,
                            suggestedMax: suggestedMax,
                            grid: { 
                                color: CHART_COLORS.gridColor,
                                drawBorder: false
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor,
                                stepSize: 1,
                                beginAtZero: true,
                                min: 0,
                                precision: 0,
                                callback: function(value) {
                                    if (Number.isInteger(value)) {
                                        return value;
                                    }
                                    return '';
                                },
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        }
                    },
                    animation: {
                        duration: 600,
                        easing: 'easeOutQuart'
                    }
                }
            });
            
            adminChartInstance.update();
            updateAdminButtons(weekOffset);
            
        } else {
            console.error('API returned error:', data);
            const weekLabel = document.getElementById('adminWeekLabel');
            if (weekLabel) {
                weekLabel.textContent = 'Error loading data';
                weekLabel.style.color = '#ef4444';
            }
        }
    } catch (error) {
        console.error('Error loading admin chart data:', error);
        const weekLabel = document.getElementById('adminWeekLabel');
        if (weekLabel) {
            weekLabel.textContent = 'Error loading data';
            weekLabel.style.color = '#ef4444';
        }
    }
}

function updateAdminButtons(weekOffset) {
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
    }
    if (nextBtn) {
        nextBtn.style.opacity = '1';
        nextBtn.style.cursor = 'pointer';
        nextBtn.disabled = false;
    }
    if (todayBtn) {
        if (weekOffset === 0) {
            todayBtn.style.opacity = '0.6';
            todayBtn.style.cursor = 'default';
            todayBtn.disabled = true;
        } else {
            todayBtn.style.opacity = '1';
            todayBtn.style.cursor = 'pointer';
            todayBtn.disabled = false;
        }
    }
}

function changeAdminWeek(delta) {
    const newOffset = adminWeekOffset + delta;
    loadAdminChartData(newOffset);
}

// ── LOAD REAL CHART DATA FROM DATABASE ──────────────────────────────
async function loadChartData() {
    await loadAdminChartData(0);
    
    try {
        const res = await fetch('/api/admin/chart-data');
        const data = await res.json();
        
        if (data.success) {
            const chartData = data.data;
            
            // ✅ RENDER ALL BREAKDOWN TABLES
            renderWeeklyBreakdown(chartData.trends);
            renderPetTypesBreakdown(chartData.pet_types);
            renderStatusBreakdown(chartData.status);
            renderGrowthBreakdown(chartData.monthly_growth);
            renderUserGrowthBreakdown(chartData.user_growth);
            
            const ctx2 = document.getElementById('petTypeChart').getContext('2d');
            new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: chartData.pet_types.labels,
                    datasets: [{
                        data: chartData.pet_types.values,
                        backgroundColor: [
                            CHART_COLORS.primary,
                            CHART_COLORS.primaryLight
                        ],
                        borderColor: [
                            '#ffffff',
                            '#ffffff'
                        ],
                        borderWidth: 3,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { 
                                color: CHART_COLORS.labelColor, 
                                padding: 15, 
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    family: 'Poppins',
                                    size: 12,
                                    weight: '500'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#2d3e1f',
                            bodyColor: '#5a7a3f',
                            borderColor: CHART_COLORS.primary,
                            borderWidth: 1,
                            titleFont: {
                                family: 'Poppins',
                                size: 13,
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Poppins',
                                size: 12
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    }
                }
            });
            
            const ctx3 = document.getElementById('appointmentStatusChart').getContext('2d');
            new Chart(ctx3, {
                type: 'bar',
                data: {
                    labels: chartData.status.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: chartData.status.values,
                        backgroundColor: [
                            CHART_COLORS.pending,
                            CHART_COLORS.confirmed,
                            CHART_COLORS.completed,
                            CHART_COLORS.cancelled
                        ],
                        borderRadius: 8,
                        borderSkipped: false,
                        hoverBackgroundColor: [
                            '#d97706',
                            '#5a7a3f',
                            '#4a6b32',
                            '#dc2626'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#2d3e1f',
                            bodyColor: '#5a7a3f',
                            borderColor: CHART_COLORS.primary,
                            borderWidth: 1,
                            titleFont: {
                                family: 'Poppins',
                                size: 13,
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Poppins',
                                size: 12
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: { 
                            grid: { 
                                display: false 
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor,
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        },
                        y: { 
                            grid: { 
                                color: CHART_COLORS.gridColor,
                                drawBorder: false
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor, 
                                stepSize: 1, 
                                beginAtZero: true,
                                min: 0,
                                precision: 0,
                                callback: function(value) {
                                    if (Number.isInteger(value)) {
                                        return value;
                                    }
                                    return '';
                                },
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        }
                    }
                }
            });
            
            const ctx4 = document.getElementById('monthlyGrowthChart').getContext('2d');
            new Chart(ctx4, {
                type: 'bar',
                data: {
                    labels: chartData.monthly_growth.labels,
                    datasets: [{
                        label: 'Appointments',
                        data: chartData.monthly_growth.values,
                        backgroundColor: 'rgba(123, 160, 91, 0.7)',
                        borderColor: CHART_COLORS.primary,
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
                        hoverBackgroundColor: CHART_COLORS.primary,
                        hoverBorderColor: CHART_COLORS.primaryDark
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#2d3e1f',
                            bodyColor: '#5a7a3f',
                            borderColor: CHART_COLORS.primary,
                            borderWidth: 1,
                            titleFont: {
                                family: 'Poppins',
                                size: 13,
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Poppins',
                                size: 12
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: { 
                            grid: { 
                                display: false 
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor, 
                                maxTicksLimit: 6,
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        },
                        y: { 
                            grid: { 
                                color: CHART_COLORS.gridColor,
                                drawBorder: false
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor, 
                                stepSize: 5, 
                                beginAtZero: true,
                                min: 0,
                                precision: 0,
                                callback: function(value) {
                                    if (Number.isInteger(value)) {
                                        return value;
                                    }
                                    return '';
                                },
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        }
                    }
                }
            });
            
            const ctx5 = document.getElementById('userGrowthChart').getContext('2d');
            new Chart(ctx5, {
                type: 'line',
                data: {
                    labels: chartData.user_growth.labels,
                    datasets: [{
                        label: 'Users',
                        data: chartData.user_growth.values,
                        borderColor: CHART_COLORS.primary,
                        backgroundColor: 'rgba(123, 160, 91, 0.15)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: CHART_COLORS.primary,
                        pointBorderColor: CHART_COLORS.pointBorder,
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: CHART_COLORS.primaryDark,
                        borderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { 
                            labels: { 
                                color: CHART_COLORS.labelColor,
                                font: {
                                    family: 'Poppins',
                                    size: 12,
                                    weight: '500'
                                },
                                usePointStyle: true,
                                pointStyle: 'rectRounded'
                            } 
                        },
                        tooltip: {
                            backgroundColor: '#ffffff',
                            titleColor: '#2d3e1f',
                            bodyColor: '#5a7a3f',
                            borderColor: CHART_COLORS.primary,
                            borderWidth: 1,
                            titleFont: {
                                family: 'Poppins',
                                size: 13,
                                weight: '600'
                            },
                            bodyFont: {
                                family: 'Poppins',
                                size: 12
                            },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: { 
                            grid: { 
                                color: CHART_COLORS.gridColor,
                                drawBorder: false
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor, 
                                maxTicksLimit: 6,
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        },
                        y: { 
                            grid: { 
                                color: CHART_COLORS.gridColor,
                                drawBorder: false
                            }, 
                            ticks: { 
                                color: CHART_COLORS.tickColor, 
                                stepSize: 5, 
                                beginAtZero: true,
                                min: 0,
                                precision: 0,
                                callback: function(value) {
                                    if (Number.isInteger(value)) {
                                        return value;
                                    }
                                    return '';
                                },
                                font: {
                                    family: 'Poppins',
                                    size: 11,
                                    weight: '500'
                                }
                            } 
                        }
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
        
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count;
                badge.style.display = 'inline-block';
                badge.style.animation = 'pulse 1.5s ease-in-out infinite';
                if (display) display.textContent = data.count + ' unread';
            } else {
                badge.textContent = '0';
                badge.style.display = 'none';
                badge.style.animation = 'none';
                if (display) display.textContent = '0 unread';
            }
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
            <i class="fas fa-spinner fa-spin"></i> Loading customers...
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
                    <div style="font-size: 40px; margin-bottom: 10px;"><i class="fas fa-comment"></i></div>
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
                <i class="fas fa-times-circle"></i> Error loading customers
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
                <div style="font-size: 32px; margin-bottom: 10px;"><i class="fas fa-search"></i></div>
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
        
        const avatarHTML = sender.profile_image
            ? `<img src="${sender.profile_image}" alt="${sender.fullname || sender.email}" 
                    onclick="event.stopPropagation(); window.openAdminImageViewer('${sender.profile_image}')">`
            : `<span style="font-size: 16px;"><i class="fas fa-user"></i></span>`;
        
        div.innerHTML = `
            <div class="avatar">${avatarHTML}</div>
            <div class="info">
                <div class="name">${sender.fullname || sender.email}</div>
                <div class="email">${sender.email} • ${sender.phone || 'No phone'}</div>
                ${lastMessageTime ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;"> ${lastMessageTime}</div>` : ''}
            </div>
            ${unreadBadge}
        `;
        div.onclick = () => {
            // 📱 MOBILE: I-activate ang slide-in conversation
            if (window.innerWidth <= 768) {
                const messagesGrid = document.querySelector('#section-messages .messages-grid');
                if (messagesGrid) {
                    messagesGrid.classList.add('has-active-conversation');
                }
            }
            loadAdminConversation(sender.email);
        };
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

// ═══════════════════════════════════════════════════════════════════
// ⭐ LOAD ADMIN CONVERSATION — Same layout as Staff Panel
// ═══════════════════════════════════════════════════════════════════
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
    
    const headerAvatarHTML = customerProfileImage
        ? `<img src="${customerProfileImage}" alt="${customerName}" 
                onclick="event.stopPropagation(); window.openAdminImageViewer('${customerProfileImage}')">`
        : `<span style="font-size: 20px;"><i class="fas fa-user"></i></span>`;
    
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
                const isAdmin = msg.sender_email === customerEmail ? false : true;
                
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
                
                const senderName = isAdmin ? 'Admin' : customerName;
                
                const wrapper = document.createElement('div');
                wrapper.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    margin-bottom: 15px;
                    padding: 0;
                    box-sizing: border-box;
                    align-items: ${isAdmin ? 'flex-end' : 'flex-start'};
                `;
                
                const bubbleContainer = document.createElement('div');
                bubbleContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    max-width: 78%;
                    box-sizing: border-box;
                    align-items: ${isAdmin ? 'flex-end' : 'flex-start'};
                    text-align: ${isAdmin ? 'right' : 'left'};
                `;
                
                const nameEl = document.createElement('div');
                nameEl.style.cssText = `
                    font-size: 11px;
                    font-weight: 600;
                    color: #38bdf8;
                    margin-bottom: 4px;
                    padding: 0 4px;
                    line-height: 1.2;
                    text-align: ${isAdmin ? 'right' : 'left'};
                    width: 100%;
                `;
                nameEl.textContent = senderName;
                
                const bubble = document.createElement('div');
                bubble.style.cssText = `
                    display: inline-block;
                    padding: 10px 14px;
                    border-radius: 14px;
                    background: ${isAdmin ? '#38bdf8' : '#1e293b'};
                    color: ${isAdmin ? '#0f172a' : '#e2e8f0'};
                    ${isAdmin ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px; border: 1px solid #334155;'}
                    font-size: 13.5px;
                    line-height: 1.4;
                    word-wrap: break-word;
                    overflow-wrap: anywhere;
                    box-sizing: border-box;
                    text-align: left;
                    max-width: 100%;
                `;
                
                let bubbleContent = '';
                
                if (messageText) {
                    bubbleContent += `<div style="font-size: 13.5px; line-height: 1.4; word-wrap: break-word; overflow-wrap: anywhere;">${messageText}</div>`;
                }
                
                if (imageData && imageData.startsWith('data:image')) {
                    bubbleContent += `
                        <div style="margin-top: 6px;">
                            <img src="${imageData}" 
                                 style="max-width: 250px; max-height: 250px; border-radius: 8px; cursor: pointer; border: 1px solid #334155; display: block;" 
                                 onclick="window.openImageFullscreenAdmin('${imageData}')"
                                 alt="Image">
                        </div>
                    `;
                }
                
                bubble.innerHTML = bubbleContent;
                
                const timeEl = document.createElement('div');
                timeEl.style.cssText = `
                    font-size: 10px;
                    color: #64748b;
                    margin-top: 4px;
                    padding: 0 4px;
                    line-height: 1.2;
                    text-align: ${isAdmin ? 'right' : 'left'};
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
                <i class="fas fa-times-circle"></i> Error loading messages
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
        input.placeholder = 'Please enter a message';
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
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
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
            input.placeholder = 'Message sent!';
            input.style.borderColor = '#10b981';
            setTimeout(() => {
                input.placeholder = 'Type your reply...';
                input.style.borderColor = '#334155';
            }, 2000);
            loadAdminConversation(customerEmail);
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
    
    btn.innerHTML = originalText;
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
                    <div style="font-size: 48px; margin-bottom: 10px;"><i class="fas fa-image"></i></div>
                    <h3 style="color: #38bdf8; font-size: 24px; margin: 0;">Upload Image</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Share a photo with your message</p>
                </div>
                
                <div style="background: #0f172a; border-radius: 12px; padding: 30px; border: 2px dashed #334155; text-align: center; cursor: pointer; transition: 0.3s;" 
                     id="adminImageUploadDropzone"
                     onclick="document.getElementById('adminImageUploadInput').click()">
                    <div style="font-size: 48px; margin-bottom: 10px;"><i class="fas fa-camera"></i></div>
                    <p style="color: #94a3b8; font-size: 14px;">Click or drag to upload image</p>
                    <p style="color: #64748b; font-size: 12px;">JPG, PNG, GIF • Max 5MB</p>
                </div>
                
                <input type="file" id="adminImageUploadInput" accept="image/*" style="display: none;">
                
                <div id="adminImagePreviewContainer" style="display: none; margin-top: 15px;">
                    <img id="adminImagePreview" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="modal-btn modal-btn-cancel" onclick="closeAdminImageUploadModal()" style="flex: 1;">Cancel</button>
                        <button class="modal-btn modal-btn-submit" onclick="sendAdminImageMessage()" id="adminSendImageBtn" style="flex: 1; background: #38bdf8; color: #0f172a;"><i class="fas fa-paper-plane"></i> Send Image</button>
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
    document.getElementById('adminSendImageBtn').innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
    
    try {
        const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject: 'Image',
                message: 'Image',
                receiver: customerEmail,
                image_data: imageData.data,
                image_name: imageData.name,
                image_type: imageData.type
            })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Image sent successfully!');
            closeAdminImageUploadModal();
            await loadAdminConversation(customerEmail);
            await loadAdminCustomers();
            loadUnreadCount();
            
            if (adminSocket && adminSocket.connected) {
                adminSocket.emit('send_message', {
                    sender: currentUser,
                    receiver: customerEmail,
                    message: 'Image',
                    subject: 'Image',
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                    image_data: imageData.data,
                    image_name: imageData.name,
                    image_type: imageData.type
                });
            }
        } else {
            alert('❌ ' + (data.message || 'Error sending image.'));
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error sending image:', error);
        alert('Something went wrong. Please try again.');
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Image';
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
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
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
    emojiBtn.innerHTML = '<i class="fas fa-smile"></i>';
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
    imageBtn.innerHTML = '<i class="fas fa-image"></i>';
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

// ✅ Breakdown functions exposure
window.renderBreakdown = renderBreakdown;
window.renderWeeklyBreakdown = renderWeeklyBreakdown;
window.renderPetTypesBreakdown = renderPetTypesBreakdown;
window.renderStatusBreakdown = renderStatusBreakdown;
window.renderGrowthBreakdown = renderGrowthBreakdown;
window.renderUserGrowthBreakdown = renderUserGrowthBreakdown;

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

// ═══════════════════════════════════════════════════════════════════
// 📱 MOBILE BACK BUTTON — Admin Messages Slide-in
// ═══════════════════════════════════════════════════════════════════
function adminBackToCustomerList() {
    const messagesGrid = document.querySelector('#section-messages .messages-grid');
    if (messagesGrid) {
        messagesGrid.classList.remove('has-active-conversation');
    }
}

// Back button click handler — mobile only
document.addEventListener('click', function(e) {
    if (window.innerWidth > 768) return;
    
    const header = document.getElementById('adminConversationHeader');
    if (!header) return;
    
    // Check kung clinick ang back button area (unang 50px ng header)
    const rect = header.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (clickX <= 50 && clickX >= 0) {
        adminBackToCustomerList();
    }
});

// Expose globally
window.adminBackToCustomerList = adminBackToCustomerList;

// ── SHOW USER DETAILS MODAL (ADMIN) ────────────────────────────────
async function showUserDetailsModal(userId) {
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
            <div style="font-size: 40px; margin-bottom: 15px;"><i class="fas fa-spinner fa-spin"></i></div>
            <p style="color: #94a3b8;">Loading user details...</p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
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
        
        const roleColors = {
            admin: '#8b5cf6',
            staff: '#f59e0b',
            vet: '#3b82f6',
            user: '#10b981'
        };
        const roleColor = roleColors[user.role] || '#7ba05b';
        
        let petsHTML = '';
        if (pets.length === 0) {
            petsHTML = `
                <div style="text-align: center; padding: 30px; color: #64748b; background: #0f172a; border-radius: 12px; border: 1px dashed #334155;">
                    <div style="font-size: 36px; margin-bottom: 8px;"><i class="fas fa-paw"></i></div>
                    <p style="margin: 0; font-size: 13px;">No pets registered yet.</p>
                </div>
            `;
        } else {
            petsHTML = pets.map(pet => {
                const petIcon = pet.pet_type === 'Cat' ? '<i class="fas fa-cat"></i>' : '<i class="fas fa-dog"></i>';
                
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
                                    <i class="fas fa-exclamation-triangle"></i> Allergies: ${pet.allergies}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
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
                                ${user.is_verified ? '<i class="fas fa-check"></i> Verified' : '<i class="fas fa-times"></i> Unverified'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div style="padding: 20px 30px; border-bottom: 1px solid #334155;">
                    <h3 style="
                        color: #38bdf8;
                        font-size: 13px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.8px;
                        margin: 0 0 14px;
                    ">
                        <i class="fas fa-user"></i> Personal Information
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
                        <span><i class="fas fa-paw"></i> Pets (${pets.length})</span>
                    </h3>
                    <div>
                        ${petsHTML}
                    </div>
                </div>
            </div>
        `;
        
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

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeUserDetailsModal();
    }
});