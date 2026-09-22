// // ── SECTION SWITCHING ──────────────────────────────────────────────────
// let currentSection = 'overview';

// function switchSection(section) {
//     // Hide all sections
//     document.querySelectorAll('.section-content').forEach(el => {
//         el.classList.remove('active');
//         el.style.display = 'none';
//     });
    
//     // Show selected section
//     const targetSection = document.getElementById('section-' + section);
//     if (targetSection) {
//         targetSection.style.display = 'block';
//         // Add small delay for animation
//         setTimeout(() => {
//             targetSection.classList.add('active');
//         }, 10);
//     }
    
//     // Update nav buttons
//     document.querySelectorAll('.nav-section-btn').forEach(btn => {
//         btn.classList.remove('active');
//     });
    
//     const navMap = {
//         'overview': 'navOverview',
//         'appointments': 'navAppointments',
//         'pets': 'navPets',
//         'messages': 'navMessages'
//     };
    
//     const navBtn = document.getElementById(navMap[section]);
//     if (navBtn) {
//         navBtn.classList.add('active');
//     }
    
//     currentSection = section;
    
//     // Load data based on section
//     if (section === 'appointments') {
//         loadAppointments();
//     } else if (section === 'pets') {
//         loadMyPets();
//     } else if (section === 'messages') {
//         loadStaffConversations();
        
//         if (currentStaffEmail) {
//             loadCustomerConversation(currentStaffEmail);
//         } else {
//             loadFirstUnreadConversation();
//         }
        
//         loadUnreadCount();
//         updateMessageBadge();
        
//     } else if (section === 'overview') {
//         loadMyPets();
//         loadAppointments();
//         loadStaffConversations();
//     }
    
//     loadUnreadCount();
    
//     if (window.innerWidth <= 768) {
//         const sidebar = document.getElementById('sidebar');
//         if (sidebar) {
//             sidebar.classList.remove('mobile-open');
//         }
//     }
// }

// // ── Toggle Sidebar Collapse ──────────────────────────────────────────
// function toggleSidebar() {
//     const sidebar = document.getElementById('sidebar');
//     const main = document.getElementById('mainContent');
//     const toggleBtn = document.querySelector('.toggle-sidebar');
    
//     if (!sidebar || !main || !toggleBtn) return;
    
//     sidebar.classList.toggle('collapsed');
//     main.classList.toggle('expanded');
    
//     if (sidebar.classList.contains('collapsed')) {
//         toggleBtn.innerHTML = '☰';
//         toggleBtn.setAttribute('aria-label', 'Expand sidebar');
//     } else {
//         toggleBtn.innerHTML = '◀';
//         toggleBtn.setAttribute('aria-label', 'Collapse sidebar');
//     }
    
//     const isCollapsed = sidebar.classList.contains('collapsed');
//     try {
//         localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
//     } catch (e) {}
    
//     window.dispatchEvent(new CustomEvent('sidebarToggle', { 
//         detail: { collapsed: isCollapsed } 
//     }));
// }

// // ── Restore Sidebar State on Load ──────────────────────────────────
// function restoreSidebarState() {
//     const sidebar = document.getElementById('sidebar');
//     const main = document.getElementById('mainContent');
//     const toggleBtn = document.querySelector('.toggle-sidebar');
    
//     if (!sidebar || !main || !toggleBtn) return;
    
//     let isCollapsed = false;
//     try {
//         const saved = localStorage.getItem('sidebarCollapsed');
//         if (saved !== null) {
//             isCollapsed = JSON.parse(saved);
//         }
//     } catch (e) {}
    
//     if (isCollapsed) {
//         sidebar.classList.add('collapsed');
//         main.classList.add('expanded');
//         toggleBtn.innerHTML = '☰';
//         toggleBtn.setAttribute('aria-label', 'Expand sidebar');
//     } else {
//         sidebar.classList.remove('collapsed');
//         main.classList.remove('expanded');
//         toggleBtn.innerHTML = '◀';
//         toggleBtn.setAttribute('aria-label', 'Collapse sidebar');
//     }
// }

// // ── Mobile Sidebar Toggle ────────────────────────────────────────────
// function toggleMobileSidebar() {
//     const sidebar = document.getElementById('sidebar');
//     sidebar.classList.toggle('mobile-open');
// }

// document.addEventListener('click', function(event) {
//     const sidebar = document.getElementById('sidebar');
//     const mobileBtn = document.querySelector('.mobile-menu-btn');
//     if (window.innerWidth <= 768) {
//         if (sidebar && mobileBtn && !sidebar.contains(event.target) && !mobileBtn.contains(event.target)) {
//             sidebar.classList.remove('mobile-open');
//         }
//     }
// });

// // ── Show Logout Modal ─────────────────────────────────────────────────
// function showLogoutModal() {
//     const overlay = document.createElement('div');
//     overlay.className = 'modal-overlay';
//     overlay.id = 'logoutModal';
//     overlay.innerHTML = `
//         <div class="modal-popup" style="max-width: 400px; text-align: center;">
//             <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
//             <h3 style="color: #38bdf8; font-size: 24px; margin-bottom: 10px;">Logout Confirmation</h3>
//             <p style="color: #94a3b8; margin-bottom: 25px; line-height: 1.6;">Are you sure you want to logout? You'll need to sign in again to access your dashboard.</p>
//             <div class="modal-buttons" style="justify-content: center;">
//                 <button class="modal-btn modal-btn-cancel" onclick="closeLogoutModal()">Cancel</button>
//                 <button class="modal-btn modal-btn-logout" onclick="confirmLogout()" style="background: #ef4444; color: white;">Yes, Logout</button>
//             </div>
//         </div>
//     `;
//     document.body.appendChild(overlay);
// }

// function closeLogoutModal() {
//     const modal = document.getElementById('logoutModal');
//     if (modal) modal.remove();
// }

// async function confirmLogout() {
//     closeLogoutModal();
//     try {
//         await fetch('/logout');
//         sessionStorage.clear();
//         localStorage.removeItem('rememberedEmail');
//         localStorage.removeItem('email');
//         localStorage.removeItem('jwt_token');
//         localStorage.removeItem('role');
//         sessionStorage.removeItem('role');
//         window.location.href = '/';
//     } catch (error) {
//         console.error('Logout error:', error);
//         window.location.href = '/';
//     }
// }

// // ── Toast Notification Helper ─────────────────────────────────────────
// function showToast(message, type = 'success') {
//     const existingToast = document.querySelector('.toast');
//     if (existingToast) {
//         existingToast.remove();
//     }
    
//     const toast = document.createElement('div');
//     toast.className = `toast ${type}`;
//     toast.textContent = message;
//     document.body.appendChild(toast);
    
//     setTimeout(() => {
//         toast.classList.add('fade-out');
//         setTimeout(() => {
//             if (toast.parentNode) toast.remove();
//         }, 300);
//     }, 3000);
// }

// // ── SocketIO Connection ──────────────────────────────────────────────
// let socket = null;

// function connectSocket() {
//     if (socket && socket.connected) return;
    
//     socket = io();
    
//     const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
//     if (currentUser) {
//         socket.emit('register_user', { email: currentUser });
//     }
    
//     socket.on('new_message', function(data) {
//         const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
//         if (data.receiver === currentUser || data.sender === currentUser) {
//             loadUnreadCount();
//             updateMessageBadge();
            
//             if (currentSection === 'messages') {
//                 loadStaffConversations();
//                 if (currentStaffEmail) {
//                     loadCustomerConversation(currentStaffEmail);
//                 }
//             }
            
//             console.log(`📩 New message from ${data.sender || 'Staff'} - Unread count updated.`);
//         }
//     });
    
//     socket.on('user_typing', function(data) {
//         if (data.sender === currentStaffEmail) {
//             showTypingIndicator(data.is_typing);
//         }
//     });
    
//     socket.on('message_sent', function(data) {
//         if (data.success) {
//             console.log('Message sent confirmed');
//         }
//     });
    
//     socket.on('connect', function() {
//         console.log('Connected to WebSocket server');
//         const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
//         if (currentUser) {
//             socket.emit('register_user', { email: currentUser });
//         }
//     });
    
//     socket.on('disconnect', function() {
//         console.log('Disconnected from WebSocket server');
//         setTimeout(connectSocket, 2000);
//     });
// }

// // ── Typing Indicator ──────────────────────────────────────────────────
// let typingTimeout = null;

// function showTypingIndicator(isTyping) {
//     const container = document.getElementById('conversationMessagesStaff');
//     if (!container) return;
    
//     let indicator = document.getElementById('typingIndicator');
//     if (isTyping) {
//         if (!indicator) {
//             indicator = document.createElement('div');
//             indicator.id = 'typingIndicator';
//             indicator.style.cssText = `
//                 display: flex;
//                 justify-content: flex-start;
//                 margin-bottom: 15px;
//                 padding: 10px 15px;
//                 background: #1e293b;
//                 border-radius: 12px;
//                 border-bottom-left-radius: 4px;
//                 max-width: 70%;
//                 color: #94a3b8;
//                 font-size: 13px;
//             `;
//             indicator.innerHTML = 'Typing...';
//             container.appendChild(indicator);
//         }
//         clearTimeout(typingTimeout);
//     } else {
//         if (indicator) {
//             typingTimeout = setTimeout(() => {
//                 if (indicator.parentNode) {
//                     indicator.remove();
//                 }
//             }, 1000);
//         }
//     }
// }

// function sendTypingIndicator(isTyping) {
//     if (!socket || !socket.connected) return;
    
//     const staffEmail = document.getElementById('replyStaffEmail').value;
//     if (!staffEmail) return;
    
//     socket.emit('typing', {
//         sender: localStorage.getItem('email') || sessionStorage.getItem('email'),
//         receiver: staffEmail,
//         is_typing: isTyping
//     });
// }

// // ── UPDATE MESSAGE BADGE ────────────────────────────────────────────
// function updateMessageBadge() {
//     loadUnreadCount();
// }

// // ── LOAD UNREAD COUNT FROM SERVER ────────────────────────────────────
// async function loadUnreadCount() {
//     try {
//         const res = await fetch('/api/messages/unread-count');
//         const data = await res.json();
        
//         const badge = document.getElementById('messageBadge');
//         if (badge) {
//             if (data.count > 0) {
//                 badge.textContent = data.count;
//                 badge.style.display = 'inline-block';
//                 badge.style.animation = 'pulse 1.5s ease-in-out infinite';
//             } else {
//                 badge.textContent = '0';
//                 badge.style.display = 'none';
//                 badge.style.animation = 'none';
//             }
//         }
//     } catch (error) {
//         console.error('Error loading unread count:', error);
//     }
// }

// // ── HELPER FUNCTION: Format Duration ──────────────────────────────────
// function formatDuration(totalMinutes) {
//     if (!totalMinutes || totalMinutes === 0) return '0 min';
    
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
    
//     if (hours === 0) {
//         return `${minutes} min`;
//     } else if (minutes === 0) {
//         return `${hours}h`;
//     } else {
//         return `${hours}h ${minutes}min`;
//     }
// }

// // ── FORMAT TIME ──────────────────────────────────────────────────────
// function formatTime(timeStr) {
//     if (!timeStr) return 'N/A';
//     const [hour, minute] = timeStr.split(':').map(Number);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     const hour12 = hour % 12 || 12;
//     return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
// }

// // ── APPOINTMENT FILTERING ───────────────────────────────────────────
// let currentAppointmentFilter = 'all';
// let allAppointments = [];

// function filterAppointments(status) {
//     currentAppointmentFilter = status;
    
//     // Update tabs
//     document.querySelectorAll('.appointment-tab').forEach(tab => {
//         tab.classList.remove('active');
//         tab.style.background = 'transparent';
//         tab.style.color = '#94a3b8';
//         if (tab.dataset.tab === status) {
//             tab.classList.add('active');
//             tab.style.background = '#38bdf8';
//             tab.style.color = '#0f172a';
//         }
//     });
    
//     // Filter appointments
//     const container = document.getElementById('myAppointmentsContainer');
//     if (!container) return;
    
//     let filtered = allAppointments;
//     if (status !== 'all') {
//         filtered = allAppointments.filter(app => app.status === status);
//     }
    
//     renderAppointments(filtered, container);
// }

// function renderAppointments(appointments, container) {
//     if (!container) return;
    
//     if (appointments.length === 0) {
//         const statusLabels = {
//             'all': 'appointments',
//             'pending': 'pending appointments',
//             'confirmed': 'confirmed appointments',
//             'completed': 'completed appointments',
//             'cancelled': 'cancelled appointments'
//         };
//         const label = statusLabels[currentAppointmentFilter] || 'appointments';
//         container.innerHTML = `
//             <div class="no-appointments">
//                 <div class="icon">📅</div>
//                 <h3>No ${label}</h3>
//                 <p>${currentAppointmentFilter === 'all' ? 'You haven\'t booked any appointments yet.' : `You have no ${label} at the moment.`}</p>
//                 ${currentAppointmentFilter === 'all' ? '<button class="btn-book-appointment" onclick="showBookAppointmentModal()" style="background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 15px; font-size: 16px;">📅 Book New Appointment</button>' : ''}
//             </div>
//         `;
//         return;
//     }
    
//     let html = '';
//     appointments.forEach(app => {
//         const statusClass = `status-${app.status}`;
//         const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
//         const canCancel = app.status === 'pending' || app.status === 'confirmed';
        
//         const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
//         const totalPrice = app.total_price || 0;
//         const totalDuration = app.total_duration || 0;
//         const formattedDuration = formatDuration(totalDuration);
        
//         const dateObj = new Date(app.appointment_date);
//         const formattedDate = dateObj.toLocaleDateString('en-US', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric'
//         });
        
//         const timeDisplay = formatTime(app.appointment_time);
        
//         html += `
//             <div class="appointment-card" data-status="${app.status}">
//                 <div class="appointment-header">
//                     <div>
//                         <div class="appointment-pet">🐕 ${app.pet_name}</div>
//                         <div class="appointment-service">✂️ ${serviceNames}</div>
//                         ${totalPrice > 0 ? `<div class="appointment-price">💰 ₱${totalPrice.toFixed(2)} • ⏱️ ${formattedDuration}</div>` : ''}
//                     </div>
//                     <span class="appointment-status ${statusClass}">${statusLabel}</span>
//                 </div>
//                 <div class="appointment-details">
//                     <span class="detail-item">📅 ${formattedDate}</span>
//                     <span class="detail-item">⏰ ${timeDisplay}</span>
//                     ${app.notes ? `<span class="detail-item">📝 ${app.notes}</span>` : ''}
//                 </div>
//                 <div class="appointment-actions">
//                     ${canCancel ? `<button class="btn-cancel-appointment" onclick="cancelAppointment(${app.id})">❌ Cancel</button>` : ''}
//                     <button class="btn-view-details" onclick="showAppointmentDetails(${app.id})">📋 View Details</button>
//                 </div>
//             </div>
//         `;
//     });
    
//     container.innerHTML = html;
// }

// // ── UPDATE APPOINTMENT COUNTS ──────────────────────────────────────
// function updateAppointmentCounts(appointments) {
//     const counts = {
//         all: appointments.length,
//         pending: 0,
//         confirmed: 0,
//         completed: 0,
//         cancelled: 0
//     };
    
//     appointments.forEach(app => {
//         if (counts.hasOwnProperty(app.status)) {
//             counts[app.status]++;
//         }
//     });
    
//     // Update tab counts
//     const allEl = document.getElementById('allCount');
//     const pendingEl = document.getElementById('pendingCount');
//     const confirmedEl = document.getElementById('confirmedCount');
//     const completedEl = document.getElementById('completedCount');
//     const cancelledEl = document.getElementById('cancelledCount');
    
//     if (allEl) allEl.textContent = counts.all;
//     if (pendingEl) pendingEl.textContent = counts.pending;
//     if (confirmedEl) confirmedEl.textContent = counts.confirmed;
//     if (completedEl) completedEl.textContent = counts.completed;
//     if (cancelledEl) cancelledEl.textContent = counts.cancelled;
    
//     // ✅ UPDATE OVERVIEW STATS CARDS
//     updateOverviewStats(counts);
// }

// // ── UPDATE OVERVIEW STATS CARDS ──────────────────────────────
// function updateOverviewStats(counts) {
//     // MY APPOINTMENTS - Total
//     const appointmentCountEl = document.getElementById('appointmentCount');
//     if (appointmentCountEl) appointmentCountEl.textContent = counts.all;
    
//     // PENDING - hiwalay
//     const pendingCountEl = document.getElementById('pendingCountOverview');
//     if (pendingCountEl) pendingCountEl.textContent = counts.pending;
    
//     // CONFIRMED - hiwalay
//     const confirmedCountEl = document.getElementById('confirmedCountOverview');
//     if (confirmedCountEl) confirmedCountEl.textContent = counts.confirmed;
    
//     // COMPLETED
//     const completedCountEl = document.getElementById('completedCountOverview');
//     if (completedCountEl) completedCountEl.textContent = counts.completed;
    
//     // CANCELLED - bago
//     const cancelledCountEl = document.getElementById('cancelledCountOverview');
//     if (cancelledCountEl) cancelledCountEl.textContent = counts.cancelled;
    
//     // UPCOMING = pending + confirmed (para sa sidebar badge)
//     const upcomingCountEl = document.getElementById('upcomingCount');
//     if (upcomingCountEl) {
//         upcomingCountEl.textContent = counts.pending + counts.confirmed;
//     }
    
//     // Update appointment badge in sidebar
//     const badge = document.getElementById('appointmentBadge');
//     if (badge) {
//         const upcoming = counts.pending + counts.confirmed;
//         if (upcoming > 0) {
//             badge.textContent = upcoming;
//             badge.style.display = 'inline-block';
//         } else {
//             badge.style.display = 'none';
//         }
//     }
// }

// // ── Load Services as Checkboxes ──────────────────────────────────────
// let selectedServices = [];

// async function loadServices() {
//     try {
//         const res = await fetch('/api/services');
//         const data = await res.json();
//         if (data.success) {
//             const container = document.getElementById('serviceCheckboxes');
//             container.innerHTML = '';
//             selectedServices = [];
            
//             data.services.forEach(service => {
//                 const label = document.createElement('label');
//                 label.style.cssText = `
//                     display: flex;
//                     align-items: center;
//                     gap: 8px;
//                     padding: 10px 12px;
//                     background: #0f172a;
//                     border: 1px solid #334155;
//                     border-radius: 10px;
//                     cursor: pointer;
//                     transition: all 0.3s ease;
//                     font-size: 13px;
//                     color: #e2e8f0;
//                 `;
                
//                 const checkbox = document.createElement('input');
//                 checkbox.type = 'checkbox';
//                 checkbox.value = service.name;
//                 checkbox.dataset.price = service.price;
//                 checkbox.dataset.duration = service.duration;
//                 checkbox.id = `service-${service.id}`;
//                 checkbox.style.cssText = `
//                     width: 16px;
//                     height: 16px;
//                     accent-color: #38bdf8;
//                     cursor: pointer;
//                     flex-shrink: 0;
//                 `;
                
//                 checkbox.addEventListener('change', function() {
//                     updateServiceSelection();
//                 });
                
//                 const info = document.createElement('span');
//                 info.innerHTML = `
//                     <span style="font-weight: 500;">${service.name}</span>
//                     <span style="color: #64748b; font-size: 11px; display: block;">
//                         ₱${service.price} • ${service.duration} min
//                     </span>
//                 `;
//                 info.style.cssText = `
//                     flex: 1;
//                     line-height: 1.3;
//                 `;
                
//                 label.appendChild(checkbox);
//                 label.appendChild(info);
//                 container.appendChild(label);
//             });
            
//             updateServiceSelection();
//         }
//     } catch (error) {
//         console.error('Error loading services:', error);
//     }
// }

// // ── UPDATE SERVICE SELECTION ─────────────────────────────────────────
// function updateServiceSelection() {
//     const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
//     const selected = [];
//     let totalPrice = 0;
//     let totalDuration = 0;
    
//     checkboxes.forEach(cb => {
//         if (cb.checked) {
//             selected.push(cb.value);
//             totalPrice += parseFloat(cb.dataset.price) || 0;
//             totalDuration += parseInt(cb.dataset.duration) || 0;
//         }
//     });
    
//     selectedServices = selected;
//     document.getElementById('bookingServices').value = selected.join(',');
    
//     const countDisplay = document.getElementById('selectedServicesCount');
//     const priceDisplay = document.getElementById('totalServicePrice');
    
//     if (selected.length === 0) {
//         countDisplay.textContent = 'No services selected';
//         countDisplay.style.color = '#94a3b8';
//         priceDisplay.textContent = 'Total: ₱0.00';
//         priceDisplay.style.color = '#94a3b8';
//     } else {
//         countDisplay.textContent = `${selected.length} service${selected.length > 1 ? 's' : ''} selected`;
//         countDisplay.style.color = '#10b981';
//         priceDisplay.textContent = `Total: ₱${totalPrice.toFixed(2)} (${formatDuration(totalDuration)})`;
//         priceDisplay.style.color = '#38bdf8';
//     }
// }

// // ── Load Customer's Pets for Booking ─────────────────────────────────
// async function loadPetsForBooking() {
//     const email = localStorage.getItem('email') || sessionStorage.getItem('email');
//     if (!email) return;
    
//     try {
//         const res = await fetch(`/api/pets/${email}`);
//         const data = await res.json();
//         if (data.success) {
//             const select = document.getElementById('bookingPet');
//             select.innerHTML = '<option value="">Choose your pet...</option>';
//             data.pets.forEach(pet => {
//                 const option = document.createElement('option');
//                 option.value = pet.id;
//                 const petType = pet.pet_type || 'Dog';
//                 const petIcon = petType === 'Cat' ? '🐈' : '🐕';
//                 option.textContent = `${petIcon} ${pet.name} (${pet.breed || 'Mixed Breed'})`;
//                 select.appendChild(option);
//             });
//         }
//     } catch (error) {
//         console.error('Error loading pets:', error);
//     }
// }

// // ── Load Appointments ─────────────────────────────────────────────────
// async function loadAppointments() {
//     const container = document.getElementById('myAppointmentsContainer');
    
//     try {
//         const res = await fetch('/api/appointments');
//         const data = await res.json();
        
//         if (data.success && data.appointments && data.appointments.length > 0) {
//             allAppointments = data.appointments;
            
//             // Update counts - including overview stats
//             updateAppointmentCounts(allAppointments);
            
//             // Render with current filter
//             filterAppointments(currentAppointmentFilter);
            
//         } else {
//             allAppointments = [];
//             updateAppointmentCounts([]);
            
//             // Update overview stats with zeros
//             updateOverviewStats({ all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
            
//             const badge = document.getElementById('appointmentBadge');
//             if (badge) badge.style.display = 'none';
            
//             container.innerHTML = `
//                 <div class="no-appointments">
//                     <div class="icon">📅</div>
//                     <h3>No Appointments</h3>
//                     <p>You haven't booked any appointments yet. Click "Book New Appointment" to get started!</p>
//                     <button class="btn-book-appointment" onclick="showBookAppointmentModal()" style="background: #38bdf8; color: #0f172a; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; margin-top: 15px; font-size: 16px;">📅 Book New Appointment</button>
//                 </div>
//             `;
//         }
//     } catch (error) {
//         console.error('Error loading appointments:', error);
//         container.innerHTML = `
//             <div class="no-appointments" style="border-color: #ef4444;">
//                 <div class="icon">⚠️</div>
//                 <h3>Error Loading Appointments</h3>
//                 <p style="color: #ef4444;">There was a problem loading your appointments. Please refresh the page.</p>
//             </div>
//         `;
//     }
// }

// // ── SHOW APPOINTMENT DETAILS ─────────────────────────────────────────
// function showAppointmentDetails(appointmentId) {
//     fetch('/api/appointments')
//         .then(res => res.json())
//         .then(data => {
//             if (data.success) {
//                 const app = data.appointments.find(a => a.id === appointmentId);
//                 if (app) {
//                     const serviceNames = app.service_names || app.services?.join(', ') || 'Multiple Services';
//                     const totalPrice = app.total_price || 0;
//                     const totalDuration = app.total_duration || 0;
//                     const formattedDuration = formatDuration(totalDuration);
                    
//                     const dateObj = new Date(app.appointment_date);
//                     const formattedDate = dateObj.toLocaleDateString('en-US', {
//                         weekday: 'long',
//                         year: 'numeric',
//                         month: 'long',
//                         day: 'numeric'
//                     });
                    
//                     const timeDisplay = formatTime(app.appointment_time);
                    
//                     const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);
                    
//                     alert(
//                         `📋 Appointment Details\n\n` +
//                         `🐕 Pet: ${app.pet_name}\n` +
//                         `✂️ Services: ${serviceNames}\n` +
//                         `💰 Total: ₱${totalPrice.toFixed(2)}\n` +
//                         `⏱️ Duration: ${formattedDuration}\n` +
//                         `📅 Date: ${formattedDate}\n` +
//                         `⏰ Time: ${timeDisplay}\n` +
//                         `📌 Status: ${statusLabel}\n` +
//                         `${app.notes ? `📝 Notes: ${app.notes}` : ''}`
//                     );
//                 } else {
//                     alert('Appointment not found.');
//                 }
//             }
//         })
//         .catch(error => {
//             console.error('Error fetching appointment details:', error);
//             alert('Error loading appointment details. Please try again.');
//         });
// }

// // ── DATE PICKER STATE ──────────────────────────────────────────────────
// let currentMonth = new Date().getMonth();
// let currentYear = new Date().getFullYear();
// let selectedDate = null;
// let selectedTime = null;
// let cachedAvailability = null;

// const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
//                 'July', 'August', 'September', 'October', 'November', 'December'];

// // ✅ SUNDAY-FIRST: Linggo ang unang araw
// const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// // ── RENDER DATE PICKER ─────────────────────────────────────────────────
// function renderDatePicker() {
//     const grid = document.getElementById('datePickerGrid');
//     const label = document.getElementById('monthYearLabel');
    
//     if (!grid) return;
    
//     // Clear grid but keep headers
//     const headers = grid.querySelectorAll('.day-header');
//     grid.innerHTML = '';
//     headers.forEach(h => grid.appendChild(h));
    
//     label.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
    
//     // ✅ SUNDAY-FIRST: 0 = Sunday, 1 = Monday, ... 6 = Saturday
//     let firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sunday
    
//     const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
//     const today = new Date();
//     const todayDate = today.getDate();
//     const todayMonth = today.getMonth();
//     const todayYear = today.getFullYear();
    
//     // Previous month days (fillers)
//     for (let i = 0; i < firstDay; i++) {
//         const empty = document.createElement('div');
//         empty.className = 'day-cell empty';
//         grid.appendChild(empty);
//     }
    
//     // Current month days
//     for (let day = 1; day <= daysInMonth; day++) {
//         const cell = document.createElement('div');
//         cell.className = 'day-cell';
//         cell.textContent = day;
        
//         // ✅ FIX: Gumamit ng manual date string para maiwasan ang timezone issues
//         const dateObj = new Date(currentYear, currentMonth, day);
//         const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//         const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear;
        
//         const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//         const isPast = dateObj < todayLocal;
        
//         if (isToday) cell.classList.add('today');
        
//         if (isPast) {
//             cell.classList.add('disabled');
//             cell.title = 'Past dates are not available';
//         } else {
//             cell.dataset.date = dateStr;
//             cell.onclick = () => selectDate(dateStr);
//             cell.classList.add('loading');
//         }
        
//         grid.appendChild(cell);
//     }
    
//     checkMonthAvailability();
// }

// // ── CHECK MONTH AVAILABILITY ─────────────────────────────────────────
// async function checkMonthAvailability() {
//     const grid = document.getElementById('datePickerGrid');
//     const cells = grid.querySelectorAll('.day-cell:not(.empty):not(.disabled)');
//     const today = new Date();
//     const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
//     for (const cell of cells) {
//         const dateStr = cell.dataset.date;
//         if (!dateStr) continue;
        
//         const [year, month, day] = dateStr.split('-').map(Number);
//         const dateObj = new Date(year, month - 1, day);
        
//         if (dateObj < todayLocal) {
//             cell.classList.add('disabled');
//             continue;
//         }
        
//         try {
//             const res = await fetch(`/api/appointments/booked-slots/${dateStr}`);
//             const data = await res.json();
            
//             if (data.success) {
//                 cell.classList.remove('loading');
                
//                 if (!data.day_available) {
//                     cell.classList.add('closed-day');
//                     cell.title = 'Clinic closed on this day';
//                 } else if (data.is_daily_full) {
//                     cell.classList.add('fully-booked');
//                     cell.title = `Fully booked (${data.daily_booked}/${data.daily_max})`;
//                 } else {
//                     let hasAvailable = false;
                    
//                     for (const [time, info] of Object.entries(data.slots)) {
//                         if (info.available && info.is_active) {
//                             hasAvailable = true;
//                             break;
//                         }
//                     }
                    
//                     if (hasAvailable) {
//                         cell.classList.add('has-availability');
//                         cell.title = `${data.daily_booked}/${data.daily_max} booked today`;
//                     } else {
//                         cell.classList.add('fully-booked');
//                         cell.title = 'No available slots';
//                     }
//                 }
//             }
//         } catch (error) {
//             console.error('Error checking date availability:', error);
//         }
//     }
// }

// // ── SELECT DATE ──────────────────────────────────────────────────────
// function selectDate(dateStr) {
//     const grid = document.getElementById('datePickerGrid');
//     const cells = grid.querySelectorAll('.day-cell');
    
//     cells.forEach(c => c.classList.remove('selected'));
    
//     let selectedCell = null;
//     cells.forEach(c => {
//         if (c.dataset.date === dateStr) {
//             c.classList.add('selected');
//             selectedCell = c;
//         }
//     });
    
//     if (!selectedCell) return;
//     if (selectedCell.classList.contains('disabled') || 
//         selectedCell.classList.contains('closed-day') || 
//         selectedCell.classList.contains('fully-booked')) {
//         showToast('This date is not available. Please select another date.', 'error');
//         return;
//     }
    
//     selectedDate = dateStr;
//     document.getElementById('bookingDate').value = dateStr;
    
//     // ✅ FIX: Gamitin ang split para i-parse ang date bilang LOCAL time
//     const [year, month, day] = dateStr.split('-').map(Number);
//     const localDate = new Date(year, month - 1, day);
    
//     document.getElementById('selectedDateDisplay').textContent = localDate.toLocaleDateString('en-US', {
//         weekday: 'long',
//         month: 'long',
//         day: 'numeric',
//         year: 'numeric'
//     });
    
//     document.getElementById('timeSlotsGroup').style.display = 'block';
//     document.getElementById('timeSlotDateLabel').textContent = 
//         `Available slots for ${localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    
//     loadTimeSlots(dateStr);
// }

// // ── LOAD TIME SLOTS ──────────────────────────────────────────────────
// async function loadTimeSlots(dateStr) {
//     const grid = document.getElementById('timeSlotsGrid');
//     const msg = document.getElementById('availabilityMessage');
    
//     if (!grid) return;
    
//     grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">⏳ Loading available times...</div>';
//     msg.style.display = 'none';
//     msg.className = '';
    
//     try {
//         const res = await fetch(`/api/appointments/booked-slots/${dateStr}`);
//         const data = await res.json();
        
//         if (!data.success) {
//             grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Error loading time slots</div>';
//             return;
//         }
        
//         const slots = data.slots;
//         const dayAvailable = data.day_available;
//         const dayName = data.day_name || 'this day';
//         const isDailyFull = data.is_daily_full || false;
//         const dailyBooked = data.daily_booked || 0;
//         const dailyMax = data.daily_max || 3;
        
//         if (!dayAvailable) {
//             grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Clinic is closed on ${dayName}</div>`;
//             msg.className = 'availability-unavailable';
//             msg.textContent = `❌ The clinic is closed on ${dayName}. Please choose another day.`;
//             msg.style.display = 'block';
//             return;
//         }
        
//         if (isDailyFull) {
//             grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Fully booked on ${dayName} (${dailyBooked}/${dailyMax} appointments)</div>`;
//             msg.className = 'availability-unavailable';
//             msg.textContent = `❌ This day is fully booked (${dailyBooked}/${dailyMax} appointments). Please choose another day.`;
//             msg.style.display = 'block';
//             return;
//         }
        
//         let availableCount = 0;
//         grid.innerHTML = '';
        
//         const timeOrder = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
//                           '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
//                           '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
        
//         for (const time of timeOrder) {
//             const slotInfo = slots[time];
//             if (!slotInfo) continue;
            
//             const isActive = slotInfo.is_active !== false;
//             const isAvailable = slotInfo.available && isActive;
//             const booked = slotInfo.booked || 0;
//             const maxSlots = slotInfo.max_slots || 1;
//             const isFull = booked >= maxSlots;
            
//             const btn = document.createElement('button');
//             btn.className = 'time-slot-btn';
//             btn.dataset.time = time;
            
//             if (isAvailable && !isFull) {
//                 btn.classList.add('available');
//                 availableCount++;
//             } else if (isFull) {
//                 btn.classList.add('full');
//             } else if (!isActive) {
//                 btn.classList.add('disabled');
//             } else {
//                 btn.classList.add('disabled');
//             }
            
//             if (selectedTime === time && isAvailable && !isFull) {
//                 btn.classList.add('selected');
//             }
            
//             const timeDisplay = time.startsWith('12') ? '12:00 PM' :
//                                time < '12:00' ? `${time} AM` :
//                                time === '12:00' ? '12:00 PM' :
//                                `${String(parseInt(time) - 12).padStart(2, '0')}:${time.split(':')[1]} PM`;
            
//             btn.innerHTML = `
//                 <span class="time-label">${timeDisplay}</span>
//                 ${maxSlots > 1 ? `<span class="slot-count">${booked}/${maxSlots} booked</span>` : ''}
//             `;
            
//             if (isAvailable && !isFull) {
//                 btn.onclick = () => selectTime(time);
//             } else {
//                 btn.title = isFull ? 'Fully booked' : 
//                            !isActive ? 'Not available' : 
//                            'No longer available';
//             }
            
//             grid.appendChild(btn);
//         }
        
//         const remainingSlots = dailyMax - dailyBooked;
//         document.getElementById('slotCountLabel').textContent = 
//             `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} remaining today (${availableCount} time slots available)`;
        
//         if (availableCount === 0) {
//             msg.className = 'availability-unavailable';
//             msg.textContent = `❌ No available time slots on ${dayName}. Please choose another day.`;
//             msg.style.display = 'block';
//         } else {
//             msg.className = 'availability-available';
//             msg.textContent = `✅ ${availableCount} time slot${availableCount !== 1 ? 's' : ''} available on ${dayName} (${dailyBooked}/${dailyMax} booked today)`;
//             msg.style.display = 'block';
//         }
        
//         cachedAvailability = data;
        
//     } catch (error) {
//         console.error('Error loading time slots:', error);
//         grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 20px;">❌ Error loading time slots</div>';
//     }
// }

// // ── SELECT TIME ──────────────────────────────────────────────────────
// function selectTime(time) {
//     const grid = document.getElementById('timeSlotsGrid');
//     const btns = grid.querySelectorAll('.time-slot-btn');
    
//     btns.forEach(b => b.classList.remove('selected'));
    
//     let selectedBtn = null;
//     btns.forEach(b => {
//         if (b.dataset.time === time) {
//             b.classList.add('selected');
//             selectedBtn = b;
//         }
//     });
    
//     if (!selectedBtn) return;
//     if (selectedBtn.classList.contains('full') || selectedBtn.classList.contains('disabled')) return;
    
//     selectedTime = time;
//     document.getElementById('bookingTime').value = time;
// }

// // ── CHANGE MONTH ─────────────────────────────────────────────────────
// function changeMonth(delta) {
//     currentMonth += delta;
//     if (currentMonth < 0) {
//         currentMonth = 11;
//         currentYear--;
//     } else if (currentMonth > 11) {
//         currentMonth = 0;
//         currentYear++;
//     }
//     renderDatePicker();
// }

// // ── SELECT TODAY ─────────────────────────────────────────────────────
// function selectToday() {
//     const today = new Date();
//     currentMonth = today.getMonth();
//     currentYear = today.getFullYear();
//     renderDatePicker();
    
//     setTimeout(() => {
//         const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
//         const cells = document.querySelectorAll('.day-cell');
//         for (const cell of cells) {
//             if (cell.dataset.date === dateStr && !cell.classList.contains('disabled') && 
//                 !cell.classList.contains('closed-day') && !cell.classList.contains('fully-booked')) {
//                 cell.click();
//                 break;
//             }
//         }
//     }, 100);
// }

// // ── SHOW BOOK APPOINTMENT MODAL ──────────────────────────────────────
// function showBookAppointmentModal() {
//     document.getElementById('bookAppointmentModal').style.display = 'flex';
//     loadServices();
//     loadPetsForBooking();
//     document.getElementById('bookingForm').reset();
    
//     const today = new Date();
//     currentMonth = today.getMonth();
//     currentYear = today.getFullYear();
//     selectedDate = null;
//     selectedTime = null;
//     cachedAvailability = null;
    
//     document.getElementById('timeSlotsGroup').style.display = 'none';
//     document.getElementById('selectedDateDisplay').textContent = 'No date selected';
//     document.getElementById('bookingDate').value = '';
//     document.getElementById('bookingTime').value = '';
//     document.getElementById('availabilityMessage').style.display = 'none';
//     document.getElementById('availabilityMessage').className = '';
//     document.getElementById('availabilityMessage').textContent = '';
    
//     const grid = document.getElementById('timeSlotsGrid');
//     if (grid) {
//         grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">Select a date to see available times</div>';
//     }
    
//     renderDatePicker();
    
//     setTimeout(() => {
//         const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
//         const cells = document.querySelectorAll('.day-cell');
//         for (const cell of cells) {
//             if (cell.dataset.date === dateStr && !cell.classList.contains('disabled') && 
//                 !cell.classList.contains('closed-day') && !cell.classList.contains('fully-booked')) {
//                 cell.click();
//                 break;
//             }
//         }
//     }, 300);
// }

// // ── CLOSE BOOK APPOINTMENT MODAL ──────────────────────────────────
// function closeBookAppointmentModal() {
//     document.getElementById('bookAppointmentModal').style.display = 'none';
    
//     // Reset selection
//     selectedDate = null;
//     selectedTime = null;
    
//     // Reset time slots grid
//     const grid = document.getElementById('timeSlotsGrid');
//     if (grid) {
//         grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">Select a date to see available times</div>';
//     }
    
//     // Hide time slots group
//     document.getElementById('timeSlotsGroup').style.display = 'none';
//     document.getElementById('selectedDateDisplay').textContent = 'No date selected';
//     document.getElementById('bookingDate').value = '';
//     document.getElementById('bookingTime').value = '';
//     document.getElementById('availabilityMessage').style.display = 'none';
//     document.getElementById('availabilityMessage').className = '';
//     document.getElementById('availabilityMessage').textContent = '';
    
//     // Uncheck all services
//     const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
//     checkboxes.forEach(cb => {
//         cb.checked = false;
//     });
//     updateServiceSelection();
// }

// // ── SUBMIT APPOINTMENT (with confirmation modal) ──────────────────────────────
// async function submitAppointment(e) {
//     e.preventDefault();
    
//     const pet_id = document.getElementById('bookingPet').value;
//     const servicesInput = document.getElementById('bookingServices').value;
//     const services = servicesInput ? servicesInput.split(',').map(s => s.trim()) : [];
//     const appointment_date = document.getElementById('bookingDate').value;
//     const appointment_time = document.getElementById('bookingTime').value;
//     const notes = document.getElementById('bookingNotes').value.trim();
    
//     if (!pet_id) {
//         showToast('Please select a pet.', 'error');
//         return;
//     }
    
//     if (services.length === 0) {
//         showToast('Please select at least one service.', 'error');
//         return;
//     }
    
//     if (!appointment_date || !appointment_time) {
//         showToast('Please select a date and time.', 'error');
//         return;
//     }
    
//     showBookingConfirmation(pet_id, services, appointment_date, appointment_time, notes);
// }

// // ── SHOW BOOKING CONFIRMATION MODAL ──────────────────────────────────
// function showBookingConfirmation(pet_id, services, appointment_date, appointment_time, notes) {
//     const petSelect = document.getElementById('bookingPet');
//     const petName = petSelect.options[petSelect.selectedIndex]?.text || 'Your pet';
    
//     const serviceNames = services.join(', ');
    
//     let totalPrice = 0;
//     let totalDuration = 0;
//     const checkboxes = document.querySelectorAll('#serviceCheckboxes input[type="checkbox"]');
//     checkboxes.forEach(cb => {
//         if (services.includes(cb.value)) {
//             totalPrice += parseFloat(cb.dataset.price) || 0;
//             totalDuration += parseInt(cb.dataset.duration) || 0;
//         }
//     });
    
//     // Format duration
//     const formattedDuration = formatDuration(totalDuration);
    
//     // Format date (Fix for Timezone)
//     const [year, month, day] = appointment_date.split('-').map(Number);
//     const dateObj = new Date(year, month - 1, day);
//     const formattedDate = dateObj.toLocaleDateString('en-US', {
//         weekday: 'long',
//         month: 'long',
//         day: 'numeric',
//         year: 'numeric'
//     });
    
//     // Format time (12-hour format)
//     const timeDisplay = formatTime(appointment_time);
    
//     const overlay = document.createElement('div');
//     overlay.className = 'modal-overlay';
//     overlay.id = 'bookingConfirmationModal';
//     overlay.style.zIndex = '3000';
    
//     let servicesHTML = '';
//     checkboxes.forEach(cb => {
//         if (services.includes(cb.value)) {
//             const price = parseFloat(cb.dataset.price) || 0;
//             const duration = parseInt(cb.dataset.duration) || 0;
//             servicesHTML += `
//                 <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1e293b; font-size: 13px;">
//                     <span style="color: #e2e8f0;">${cb.value}</span>
//                     <span style="color: #94a3b8;">₱${price.toFixed(2)} • ${duration} min</span>
//                 </div>
//             `;
//         }
//     });
    
//     overlay.innerHTML = `
//         <div class="modal-popup" style="max-width: 550px; text-align: left;">
//             <div style="text-align: center; margin-bottom: 20px;">
//                 <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
//                 <h3 style="color: #38bdf8; font-size: 24px; margin: 0;">Confirm Appointment</h3>
//                 <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Please review your appointment details before booking</p>
//             </div>
            
//             <div style="background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px;">
//                 <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b;">
//                     <span style="color: #94a3b8;">🐕 Pet</span>
//                     <span style="color: #e2e8f0; font-weight: 500;">${petName}</span>
//                 </div>
//                 <div style="padding: 8px 0; border-bottom: 1px solid #1e293b;">
//                     <div style="color: #94a3b8; margin-bottom: 5px;">✂️ Services</div>
//                     ${servicesHTML}
//                     <div style="display: flex; justify-content: space-between; padding-top: 8px; font-weight: 600; border-top: 1px solid #334155;">
//                         <span style="color: #38bdf8;">Total</span>
//                         <span style="color: #38bdf8;">₱${totalPrice.toFixed(2)} • ${formattedDuration}</span>
//                     </div>
//                 </div>
//                 <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b;">
//                     <span style="color: #94a3b8;">📅 Date</span>
//                     <span style="color: #e2e8f0; font-weight: 500;">${formattedDate}</span>
//                 </div>
//                 <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b;">
//                     <span style="color: #94a3b8;">⏰ Time</span>
//                     <span style="color: #e2e8f0; font-weight: 500;">${timeDisplay}</span>
//                 </div>
//                 ${notes ? `
//                 <div style="display: flex; justify-content: space-between; padding: 8px 0;">
//                     <span style="color: #94a3b8;">📝 Notes</span>
//                     <span style="color: #e2e8f0; font-weight: 500; max-width: 200px; text-align: right; word-wrap: break-word;">${notes}</span>
//                 </div>
//                 ` : ''}
//             </div>
            
//             <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
//                 <p style="color: #f59e0b; font-size: 13px; margin: 0;">
//                     ⚠️ Please double-check all details. You will receive a confirmation email once your booking is processed.
//                 </p>
//             </div>
            
//             <div class="modal-buttons" style="justify-content: center;">
//                 <button class="modal-btn modal-btn-cancel" onclick="closeBookingConfirmation()" style="flex: 1;">
//                     ✏️ Edit
//                 </button>
//                 <button class="modal-btn modal-btn-submit" onclick="confirmBooking()" id="confirmBookingBtn" style="flex: 1; background: #10b981; color: #fff;">
//                     ✅ Confirm Booking
//                 </button>
//             </div>
//         </div>
//     `;
    
//     document.body.appendChild(overlay);
    
//     window._pendingBooking = {
//         pet_id,
//         services,
//         appointment_date,
//         appointment_time,
//         notes
//     };
// }

// // ── CLOSE BOOKING CONFIRMATION ──────────────────────────────────────
// function closeBookingConfirmation() {
//     const modal = document.getElementById('bookingConfirmationModal');
//     if (modal) {
//         modal.remove();
//     }
//     window._pendingBooking = null;
// }

// // ── CONFIRM BOOKING ──────────────────────────────────────────────────
// async function confirmBooking() {
//     const btn = document.getElementById('confirmBookingBtn');
//     const originalText = btn.textContent;
//     btn.textContent = '⏳ Booking...';
//     btn.disabled = true;
    
//     const booking = window._pendingBooking;
//     if (!booking) {
//         showToast('Booking data not found. Please try again.', 'error');
//         closeBookingConfirmation();
//         return;
//     }
    
//     const { pet_id, services, appointment_date, appointment_time, notes } = booking;
    
//     try {
//         const checkRes = await fetch('/api/appointments/check-availability', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ appointment_date, appointment_time })
//         });
//         const checkData = await checkRes.json();
        
//         if (!checkData.success || !checkData.available) {
//             showToast('❌ ' + (checkData.message || 'This time slot is no longer available.'), 'error');
//             btn.textContent = originalText;
//             btn.disabled = false;
//             closeBookingConfirmation();
//             loadTimeSlots(appointment_date);
//             return;
//         }
        
//         const res = await fetch('/api/appointments', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 pet_id, 
//                 services,
//                 appointment_date, 
//                 appointment_time, 
//                 notes 
//             })
//         });
//         const data = await res.json();
        
//         btn.textContent = originalText;
//         btn.disabled = false;
        
//         if (data.success) {
//             // Close both modals
//             closeBookingConfirmation();
//             closeBookAppointmentModal();
            
//             showToast('✅ Appointment booked successfully! Please wait for confirmation.', 'success');
            
//             loadAppointments();
//             switchSection('appointments');
//         } else {
//             showToast('❌ ' + (data.message || 'Error booking appointment.'), 'error');
//             if (data.slot_full || data.daily_full || data.day_closed) {
//                 loadTimeSlots(appointment_date);
//             }
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         btn.textContent = originalText;
//         btn.disabled = false;
//         showToast('Something went wrong. Please try again.', 'error');
//     }
// }

// // ── Cancel Appointment ───────────────────────────────────────────────
// async function cancelAppointment(appointmentId) {
//     if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
//     try {
//         const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
//             method: 'PUT'
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             showToast('✅ Appointment cancelled successfully.', 'success');
//             loadAppointments();
//         } else {
//             showToast('❌ ' + (data.message || 'Error cancelling appointment.'), 'error');
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         showToast('Something went wrong. Please try again.', 'error');
//     }
// }

// // ── Load Customer's Pets ──────────────────────────────────────────────
// async function loadMyPets() {
//     const email = localStorage.getItem('email') || sessionStorage.getItem('email');
//     if (!email) return;
    
//     const container = document.getElementById('myPetsContainer');
    
//     try {
//         const res = await fetch(`/api/pets/${email}`);
//         const data = await res.json();
        
//         if (data.success && data.pets && data.pets.length > 0) {
//             document.getElementById('petCount').textContent = data.pets.length;
            
//             const badge = document.getElementById('petBadge');
//             if (badge) {
//                 badge.textContent = data.pets.length;
//                 badge.style.display = 'inline-block';
//             }
            
//             let petsHTML = '<div class="pets-grid">';
//             data.pets.forEach(pet => {
//                 let statusClass = 'healthy';
//                 let statusText = '✅ Healthy';
                
//                 const hasRealAllergies = pet.allergies && 
//                                         pet.allergies.trim() !== '' && 
//                                         pet.allergies.trim().toLowerCase() !== 'none' &&
//                                         pet.allergies.trim().toLowerCase() !== 'n/a';
                
//                 const hasRealMedicalHistory = pet.medical_history && 
//                                              pet.medical_history.trim() !== '' && 
//                                              pet.medical_history.trim().toLowerCase() !== 'none' &&
//                                              pet.medical_history.trim().toLowerCase() !== 'n/a';
                
//                 if (hasRealAllergies) {
//                     statusClass = 'critical';
//                     statusText = '⚠️ Has Allergies';
//                 } else if (hasRealMedicalHistory) {
//                     statusClass = 'warning';
//                     statusText = '⚠️ Needs Attention';
//                 }
                
//                 const allergiesDisplay = pet.allergies && pet.allergies.trim() !== '' ? pet.allergies : 'None';
//                 const medicalHistoryDisplay = pet.medical_history && pet.medical_history.trim() !== '' ? pet.medical_history : 'None';
                
//                 const petType = pet.pet_type || 'Dog';
//                 const petIcon = petType === 'Cat' ? '🐈' : '🐕';
//                 const petTypeLabel = petType === 'Cat' ? 'Cat' : 'Dog';
                
//                 petsHTML += `
//                     <div class="pet-card">
//                         <div class="pet-avatar">
//                             ${pet.pet_image ? 
//                                 `<img src="${pet.pet_image}" alt="${pet.name}" id="petImg-${pet.id}">` : 
//                                 `<span style="font-size: 60px;">${petIcon}</span>`
//                             }
//                             <button class="edit-image-btn" onclick="showEditPetImageModal(${pet.id}, '${pet.name}')" title="Change pet photo">
//                                 📷
//                             </button>
//                         </div>
//                         <div class="pet-name">${pet.name} ${petIcon}</div>
//                         <div class="pet-breed">${petTypeLabel} • ${pet.breed || 'Mixed Breed'} • ${pet.age || 'Unknown'} years</div>
//                         <div class="pet-info">
//                             <div><span class="label">🐾 Type:</span> ${petTypeLabel}</div>
//                             <div><span class="label">⚥ Gender:</span> ${pet.gender || '—'}</div>
//                             <div><span class="label">🎨 Color:</span> ${pet.color || '—'}</div>
//                             <div><span class="label">⚖️ Weight:</span> ${pet.weight || '—'} kg</div>
//                             <div><span class="label">⚠️ Allergies:</span> ${allergiesDisplay}</div>
//                             <div><span class="label">📋 Medical History:</span> ${medicalHistoryDisplay}</div>
//                             <div style="text-align: center; margin-top: 10px;">
//                                 <span class="pet-status ${statusClass}">${statusText}</span>
//                             </div>
//                             <div style="text-align: center; margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
//                                 <button onclick="showEditPetDetailsModal(${pet.id})" style="background: #38bdf8; color: #0f172a; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">✏️ Edit</button>
//                                 <button onclick="deletePet(${pet.id})" style="background: #ef4444; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600;">🗑️ Delete</button>
//                             </div>
//                         </div>
//                     </div>
//                 `;
//             });
//             petsHTML += '</div>';
//             container.innerHTML = petsHTML;
//         } else {
//             document.getElementById('petCount').textContent = '0';
            
//             const badge = document.getElementById('petBadge');
//             if (badge) badge.style.display = 'none';
            
//             container.innerHTML = `
//                 <div class="no-pets-message">
//                     <div class="icon">🐕</div>
//                     <h3>No Pets Registered</h3>
//                     <p>You don't have any pets registered yet. Click the <strong>"Add New Pet"</strong> button above to register your furry friend!</p>
//                     <div class="info-box">
//                         <p>📌 To register your pet:</p>
//                         <p>1. Click the <span class="highlight">"Add New Pet"</span> button above</p>
//                         <p>2. Fill in your pet's details</p>
//                         <p>3. Click <span class="highlight">"Register Pet"</span> to save</p>
//                     </div>
//                 </div>
//             `;
//         }
//     } catch (error) {
//         console.error('Error loading pets:', error);
//     }
// }

// // ── Edit Pet Image Modal ──────────────────────────────────────────────
// let currentEditPetId = null;
// let currentEditPetName = '';

// function showEditPetImageModal(petId, petName) {
//     currentEditPetId = petId;
//     currentEditPetName = petName;
//     document.getElementById('editPetImageId').value = petId;
//     document.getElementById('editPetNameDisplay').textContent = petName;
//     document.getElementById('editPetImageModal').style.display = 'flex';
    
//     document.getElementById('editPetImagePreview2').innerHTML = '<span style="color: #64748b; font-size: 14px; text-align: center;">No<br>Image</span>';
//     document.getElementById('editPetImageInput').value = '';
    
//     const petCards = document.querySelectorAll('.pet-card');
//     for (let card of petCards) {
//         const nameEl = card.querySelector('.pet-name');
//         if (nameEl && nameEl.textContent.trim().startsWith(petName)) {
//             const img = card.querySelector('.pet-avatar img');
//             if (img) {
//                 document.getElementById('editPetImagePreview2').innerHTML = `<img src="${img.src}" style="width: 100%; height: 100%; object-fit: cover;">`;
//             }
//             break;
//         }
//     }
    
//     document.getElementById('updatePhotoBtn').innerHTML = '💾 Update Photo';
//     document.getElementById('updatePhotoBtn').disabled = false;
// }

// function closeEditPetImageModal() {
//     document.getElementById('editPetImageModal').style.display = 'none';
// }

// function previewEditPetImage2(event) {
//     const file = event.target.files[0];
//     if (!file) return;
    
//     if (file.size > 5 * 1024 * 1024) {
//         showToast('File is too large. Please upload an image under 5MB.', 'error');
//         event.target.value = '';
//         return;
//     }
    
//     const reader = new FileReader();
//     reader.onload = function(e) {
//         const preview = document.getElementById('editPetImagePreview2');
//         preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
//     };
//     reader.readAsDataURL(file);
// }

// async function submitPetImageUpdate(e) {
//     e.preventDefault();
    
//     const petId = document.getElementById('editPetImageId').value;
//     const imageInput = document.getElementById('editPetImageInput');
//     const btn = document.getElementById('updatePhotoBtn');
    
//     if (!imageInput.files || !imageInput.files[0]) {
//         showToast('Please select a photo to upload.', 'error');
//         return;
//     }
    
//     if (imageInput.files[0].size > 5 * 1024 * 1024) {
//         showToast('File is too large. Please upload an image under 5MB.', 'error');
//         return;
//     }
    
//     btn.innerHTML = '⏳ Uploading...';
//     btn.disabled = true;
    
//     const reader = new FileReader();
//     reader.onload = async function(event) {
//         const pet_image = event.target.result;
        
//         try {
//             const res = await fetch(`/api/pets/${petId}/image`, {
//                 method: 'PUT',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ pet_image })
//             });
//             const data = await res.json();
            
//             if (data.success) {
//                 showToast('✅ Pet photo updated successfully!', 'success');
//                 closeEditPetImageModal();
//                 loadMyPets();
//             } else {
//                 showToast('❌ ' + (data.message || 'Error updating photo.'), 'error');
//                 btn.innerHTML = '💾 Update Photo';
//                 btn.disabled = false;
//             }
//         } catch (error) {
//             console.error('Error:', error);
//             showToast('Something went wrong. Please try again.', 'error');
//             btn.innerHTML = '💾 Update Photo';
//             btn.disabled = false;
//         }
//     };
//     reader.readAsDataURL(imageInput.files[0]);
// }

// // ── Contact Clinic with Multiple Recipients ───────────────────────────
// function showContactModal() {
//     document.getElementById('contactModal').style.display = 'flex';
//     document.getElementById('contactForm').reset();
//     const existingError = document.querySelector('#contactForm .error-message');
//     if (existingError) existingError.remove();
// }

// function closeContactModal() {
//     document.getElementById('contactModal').style.display = 'none';
// }

// async function sendMessage(e) {
//     e.preventDefault();
    
//     const recipient = document.getElementById('contactRecipient').value;
//     const subject = document.getElementById('contactSubject').value.trim();
//     const message = document.getElementById('contactMessage').value.trim();
    
//     if (!recipient) {
//         const select = document.getElementById('contactRecipient');
//         select.style.borderColor = '#ef4444';
//         setTimeout(() => {
//             select.style.borderColor = '#334155';
//         }, 2000);
//         return;
//     }
    
//     if (!message) {
//         const textarea = document.getElementById('contactMessage');
//         textarea.style.borderColor = '#ef4444';
//         textarea.placeholder = '⚠️ Please enter a message';
//         setTimeout(() => {
//             textarea.style.borderColor = '#334155';
//             textarea.placeholder = 'Type your message here...';
//         }, 2000);
//         return;
//     }
    
//     const btn = document.querySelector('#contactForm .modal-btn-submit');
//     const originalText = btn.textContent;
//     btn.textContent = '⏳ Sending...';
//     btn.disabled = true;
    
//     try {
//         const recipientNames = {
//             'admin@petlink.com': 'Admin',
//             'staff@petlink.com': 'Staff',
//             'vet@petlink.com': 'Veterinarian'
//         };
//         const recipientName = recipientNames[recipient] || recipient;
        
//         const res = await fetch('/api/messages', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 subject: subject || `Message for ${recipientName}`,
//                 message: message,
//                 receiver: recipient
//             })
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             showToast(`✅ Message sent to ${recipientName}!`, 'success');
//             closeContactModal();
            
//             await loadStaffConversations();
//             if (currentStaffEmail) {
//                 await loadCustomerConversation(currentStaffEmail);
//             }
//             updateMessageBadge();
            
//         } else {
//             showToast('❌ ' + data.message, 'error');
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         showToast('Something went wrong. Please try again.', 'error');
//     }
    
//     btn.textContent = originalText;
//     btn.disabled = false;
// }

// // ── Customer Messages (with Reply) ────────────────────────────────────
// let currentStaffEmail = null;

// async function loadStaffConversations() {
//     const container = document.getElementById('staffList');
    
//     container.innerHTML = `
//         <div style="padding: 20px; text-align: center; color: #64748b;">
//             ⏳ Loading conversations...
//         </div>
//     `;
    
//     try {
//         const res = await fetch('/api/messages');
//         const data = await res.json();
        
//         const allRecipients = [
//             { email: 'admin@petlink.com', label: 'Admin', icon: '👑', color: '#a78bfa' },
//             { email: 'staff@petlink.com', label: 'Staff', icon: '👨‍💼', color: '#38bdf8' },
//             { email: 'vet@petlink.com', label: 'Veterinarian', icon: '🏥', color: '#10b981' }
//         ];
        
//         const recipientsWithMessages = new Set();
//         const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
//         if (data.success && data.messages && data.messages.length > 0) {
//             data.messages.forEach(msg => {
//                 if (msg.sender_email === currentUser && msg.receiver_email) {
//                     recipientsWithMessages.add(msg.receiver_email);
//                 }
//                 if (msg.receiver_email === currentUser && msg.sender_email) {
//                     recipientsWithMessages.add(msg.sender_email);
//                 }
//             });
//         }
        
//         container.innerHTML = '';
        
//         allRecipients.forEach(recipient => {
//             const hasMessages = recipientsWithMessages.has(recipient.email);
//             const isActive = currentStaffEmail === recipient.email;
            
//             const div = document.createElement('div');
//             div.className = `staff-item ${isActive ? 'active' : ''}`;
//             div.style.borderLeft = isActive ? `3px solid ${recipient.color}` : '3px solid transparent';
//             div.style.opacity = hasMessages ? '1' : '0.7';
            
//             div.onclick = () => loadCustomerConversation(recipient.email);
            
//             let unreadBadge = '';
//             if (data.success && data.messages) {
//                 const unreadCount = data.messages.filter(m => 
//                     m.sender_email === recipient.email && 
//                     m.receiver_email === currentUser && 
//                     m.is_read === 0
//                 ).length;
//                 if (unreadCount > 0) {
//                     unreadBadge = `<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-left: auto;">${unreadCount}</span>`;
//                 }
//             }
            
//             div.innerHTML = `
//                 <div class="avatar" style="background: rgba(56, 189, 248, 0.15);">
//                     ${recipient.icon}
//                 </div>
//                 <div class="info">
//                     <div class="name" style="color: ${recipient.color};">${recipient.label}</div>
//                     <div class="email" style="font-size: 11px;">${recipient.email}</div>
//                 </div>
//                 ${!hasMessages ? '<span style="font-size: 10px; color: #64748b; margin-left: auto;">No messages</span>' : ''}
//                 ${unreadBadge}
//             `;
//             container.appendChild(div);
//         });
        
//         updateMessageBadge();
//         loadUnreadCount();
        
//         if (!currentStaffEmail && recipientsWithMessages.size > 0) {
//             loadCustomerConversation([...recipientsWithMessages][0]);
//         } else if (!currentStaffEmail) {
//             loadCustomerConversation('admin@petlink.com');
//         }
        
//     } catch (error) {
//         console.error('Error loading staff conversations:', error);
//         container.innerHTML = `
//             <div style="padding: 20px; text-align: center; color: #ef4444;">
//                 ❌ Error loading conversations
//             </div>
//         `;
//     }
// }

// // ── LOAD FIRST CONVERSATION WITH UNREAD MESSAGES ──────────────────
// async function loadFirstUnreadConversation() {
//     try {
//         const res = await fetch('/api/messages');
//         const data = await res.json();
        
//         if (data.success && data.messages && data.messages.length > 0) {
//             const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
            
//             const unreadSenders = new Set();
//             data.messages.forEach(msg => {
//                 if (msg.sender_email !== currentUser && 
//                     msg.receiver_email === currentUser && 
//                     msg.is_read === 0) {
//                     unreadSenders.add(msg.sender_email);
//                 }
//             });
            
//             if (unreadSenders.size > 0) {
//                 const firstUnreadSender = [...unreadSenders][0];
//                 await loadCustomerConversation(firstUnreadSender);
//             } else {
//                 const allRecipients = ['admin@petlink.com', 'staff@petlink.com', 'vet@petlink.com'];
//                 const messagesFrom = new Set();
//                 data.messages.forEach(msg => {
//                     if (msg.sender_email === currentUser && msg.receiver_email) {
//                         messagesFrom.add(msg.receiver_email);
//                     }
//                     if (msg.receiver_email === currentUser && msg.sender_email) {
//                         messagesFrom.add(msg.sender_email);
//                     }
//                 });
                
//                 if (messagesFrom.size > 0) {
//                     const lastRecipient = [...messagesFrom][0];
//                     await loadCustomerConversation(lastRecipient);
//                 } else {
//                     await loadCustomerConversation('admin@petlink.com');
//                 }
//             }
//         } else {
//             await loadCustomerConversation('admin@petlink.com');
//         }
//     } catch (error) {
//         console.error('Error loading first conversation:', error);
//         await loadCustomerConversation('admin@petlink.com');
//     }
// }

// async function loadCustomerConversation(staffEmail) {
//     currentStaffEmail = staffEmail;
    
//     let roleLabel = 'Staff';
//     let roleColor = '#38bdf8';
//     let icon = '👨‍💼';
    
//     if (staffEmail === 'admin@petlink.com') {
//         roleLabel = 'Admin';
//         roleColor = '#a78bfa';
//         icon = '👑';
//     } else if (staffEmail === 'vet@petlink.com') {
//         roleLabel = 'Veterinarian';
//         roleColor = '#10b981';
//         icon = '🏥';
//     } else if (staffEmail.includes('staff')) {
//         roleLabel = 'Staff';
//         roleColor = '#38bdf8';
//         icon = '👨‍💼';
//     }
    
//     document.getElementById('conversationHeaderStaff').innerHTML = `
//         <div style="display: flex; align-items: center; gap: 10px;">
//             <span style="font-size: 20px;">${icon}</span>
//             <div>
//                 <div style="color: ${roleColor}; font-weight: 500;">${roleLabel}</div>
//                 <div style="color: #64748b; font-size: 12px;">${staffEmail}</div>
//             </div>
//         </div>
//     `;
    
//     document.getElementById('replyStaffEmail').value = staffEmail;
//     document.getElementById('replyMessageStaff').value = '';
//     document.getElementById('replyMessageStaff').style.borderColor = '#334155';
//     document.getElementById('replyMessageStaff').placeholder = `Type your reply to ${roleLabel}...`;
    
//     document.querySelectorAll('.staff-item').forEach(item => {
//         item.classList.remove('active');
//         item.style.borderLeft = '3px solid transparent';
//     });
//     document.querySelectorAll('.staff-item').forEach(item => {
//         const emailEl = item.querySelector('.email');
//         if (emailEl && emailEl.textContent === staffEmail) {
//             item.classList.add('active');
//             let color = '#38bdf8';
//             if (staffEmail === 'admin@petlink.com') color = '#a78bfa';
//             else if (staffEmail === 'vet@petlink.com') color = '#10b981';
//             item.style.borderLeft = `3px solid ${color}`;
//         }
//     });
    
//     try {
//         const res = await fetch(`/api/messages/customer/${staffEmail}`);
//         const data = await res.json();
        
//         const container = document.getElementById('conversationMessagesStaff');
        
//         if (data.success && data.messages && data.messages.length > 0) {
//             container.innerHTML = '';
//             const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
            
//             data.messages.forEach(msg => {
//                 const isCustomer = msg.sender_email === currentUser;
//                 const bgColor = isCustomer ? '#38bdf8' : '#1e293b';
//                 const textColor = isCustomer ? '#0f172a' : '#e2e8f0';
//                 const align = isCustomer ? 'flex-end' : 'flex-start';
//                 const label = isCustomer ? 'You' : roleLabel;
//                 const labelColor = isCustomer ? '#0f172a' : roleColor;
                
//                 const div = document.createElement('div');
//                 div.style.cssText = `
//                     display: flex;
//                     justify-content: ${align};
//                     margin-bottom: 15px;
//                 `;
                
//                 div.innerHTML = `
//                     <div style="max-width: 70%;">
//                         <div style="background: ${bgColor}; padding: 10px 15px; border-radius: 12px; ${isCustomer ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
//                             <div style="font-size: 11px; color: ${labelColor}; font-weight: 600; margin-bottom: 3px;">${label}</div>
//                             ${msg.subject ? `<div style="font-size: 12px; color: ${isCustomer ? '#0f172a' : '#94a3b8'}; margin-bottom: 5px; font-weight: 500;">📌 ${msg.subject}</div>` : ''}
//                             <div style="color: ${textColor}; word-wrap: break-word;">${msg.message}</div>
//                         </div>
//                         <div style="font-size: 10px; color: #64748b; margin-top: 3px; ${isCustomer ? 'text-align: right;' : ''}">
//                             ${new Date(msg.created_at).toLocaleString()}
//                         </div>
//                     </div>
//                 `;
//                 container.appendChild(div);
//             });
//             container.scrollTop = container.scrollHeight;
            
//             await markCustomerMessagesAsRead(staffEmail);
            
//             loadUnreadCount();
//             updateMessageBadge();
            
//         } else {
//             container.innerHTML = `
//                 <div style="text-align: center; color: #64748b; padding: 40px;">
//                     No messages yet with ${roleLabel}. 
//                     <br><br>
//                     <span style="font-size: 13px;">Click "Contact Clinic" to send a message.</span>
//                 </div>
//             `;
//         }
//     } catch (error) {
//         console.error('Error loading conversation:', error);
//         container.innerHTML = `
//             <div style="text-align: center; color: #ef4444; padding: 40px;">
//                 ❌ Error loading messages
//             </div>
//         `;
//     }
// }

// // ── REFRESH MESSAGE BADGE ONLY ──────────────────────────────────────
// async function refreshMessageBadgeOnly(staffEmail) {
//     try {
//         await loadStaffConversations();
//         updateMessageBadge();
//         loadUnreadCount();
        
//         const activeItem = document.querySelector('.staff-item.active');
//         if (activeItem) {
//             const badge = activeItem.querySelector('span[style*="background: #ef4444"]');
//             if (badge) {
//                 badge.remove();
//             }
//         }
//     } catch (error) {
//         console.error('Error refreshing badge:', error);
//     }
// }

// // ── MARK MESSAGES AS READ ────────────────────────────────────────────
// async function markCustomerMessagesAsRead(staffEmail) {
//     try {
//         const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
        
//         const res = await fetch('/api/messages/mark-read', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 sender: staffEmail,
//                 receiver: currentUser
//             })
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             console.log(`✅ Messages from ${staffEmail} marked as read`);
            
//             await loadStaffConversations();
//             updateMessageBadge();
//             loadUnreadCount();
            
//             const activeItem = document.querySelector('.staff-item.active');
//             if (activeItem) {
//                 const badge = activeItem.querySelector('span[style*="background: #ef4444"]');
//                 if (badge) {
//                     badge.remove();
//                 }
//             }
//         }
//     } catch (error) {
//         console.error('Error marking messages as read:', error);
//     }
// }

// async function sendCustomerReply(e) {
//     e.preventDefault();
    
//     const staffEmail = document.getElementById('replyStaffEmail').value;
//     const message = document.getElementById('replyMessageStaff').value.trim();
    
//     if (!message) {
//         const input = document.getElementById('replyMessageStaff');
//         input.style.borderColor = '#ef4444';
//         input.placeholder = '⚠️ Please enter a message';
//         setTimeout(() => {
//             input.style.borderColor = '#334155';
//             input.placeholder = 'Type your reply...';
//         }, 2000);
//         return;
//     }
    
//     if (!staffEmail) {
//         showToast('Please select a recipient first.', 'error');
//         return;
//     }
    
//     const btn = document.querySelector('#replyFormStaff button[type="submit"]');
//     const originalText = btn.textContent;
//     btn.textContent = '⏳ Sending...';
//     btn.disabled = true;
    
//     try {
//         const currentUser = localStorage.getItem('email') || sessionStorage.getItem('email');
//         if (socket && socket.connected) {
//             socket.emit('send_message', {
//                 sender: currentUser,
//                 receiver: staffEmail,
//                 message: message,
//                 subject: 'Customer Reply',
//                 timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
//             });
//         }
        
//         const res = await fetch('/api/messages', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 subject: 'Customer Reply',
//                 message: message,
//                 receiver: staffEmail
//             })
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             document.getElementById('replyMessageStaff').value = '';
            
//             const input = document.getElementById('replyMessageStaff');
//             input.placeholder = '✅ Message sent!';
//             input.style.borderColor = '#10b981';
//             setTimeout(() => {
//                 input.placeholder = 'Type your reply...';
//                 input.style.borderColor = '#334155';
//             }, 2000);
            
//             await loadCustomerConversation(staffEmail);
//             await loadStaffConversations();
//             updateMessageBadge();
            
//         } else {
//             const input = document.getElementById('replyMessageStaff');
//             input.placeholder = '❌ ' + data.message;
//             input.style.borderColor = '#ef4444';
//             setTimeout(() => {
//                 input.placeholder = 'Type your reply...';
//                 input.style.borderColor = '#334155';
//             }, 3000);
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         const input = document.getElementById('replyMessageStaff');
//         input.placeholder = '❌ Error sending message';
//         input.style.borderColor = '#ef4444';
//         setTimeout(() => {
//             input.placeholder = 'Type your reply...';
//             input.style.borderColor = '#334155';
//         }, 3000);
//     }
    
//     btn.textContent = originalText;
//     btn.disabled = false;
// }

// // ── Add Pet Modal Functions ──────────────────────────────────────────
// function showAddPetModal() {
//     document.getElementById('addPetModal').style.display = 'flex';
//     document.getElementById('addPetForm').reset();
//     const preview = document.getElementById('addPetImagePreview');
//     preview.innerHTML = `
//         <span style="font-size: 36px; color: #64748b;">📷</span>
//         <span style="font-size: 11px; color: #64748b; margin-top: 4px;">Tap to add photo</span>
//     `;
//     preview.style.border = '2px dashed #334155';
//     document.getElementById('addPetSubmitBtn').disabled = false;
//     document.getElementById('addPetSubmitBtn').textContent = '💾 Register Pet';
// }

// function closeAddPetModal() {
//     document.getElementById('addPetModal').style.display = 'none';
// }

// function previewAddPetImage(event) {
//     const file = event.target.files[0];
//     if (!file) return;
    
//     if (file.size > 5 * 1024 * 1024) {
//         showToast('File is too large. Please upload an image under 5MB.', 'error');
//         event.target.value = '';
//         return;
//     }
    
//     const reader = new FileReader();
//     reader.onload = function(e) {
//         const preview = document.getElementById('addPetImagePreview');
//         preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
//         preview.style.border = '2px solid #10b981';
//     };
//     reader.readAsDataURL(file);
// }

// async function submitNewPet(e) {
//     e.preventDefault();
    
//     const name = document.getElementById('addPetName').value.trim();
//     const pet_type = document.getElementById('addPetType').value;
//     const breed = document.getElementById('addPetBreed').value.trim();
//     const age = document.getElementById('addPetAge').value;
//     const gender = document.getElementById('addPetGender').value;
//     const weight = document.getElementById('addPetWeight').value;
//     const color = document.getElementById('addPetColor').value.trim();
//     const allergies = document.getElementById('addPetAllergies').value.trim();
//     const medical_history = document.getElementById('addPetMedicalHistory').value.trim();
//     const imageInput = document.getElementById('addPetImageInput');
    
//     if (!name) {
//         showToast('Please enter your pet\'s name.', 'error');
//         return;
//     }
    
//     const btn = document.getElementById('addPetSubmitBtn');
//     btn.textContent = '⏳ Registering...';
//     btn.disabled = true;
    
//     try {
//         let pet_image = '';
//         if (imageInput.files && imageInput.files[0]) {
//             const reader = new FileReader();
//             pet_image = await new Promise((resolve) => {
//                 reader.onload = function(e) {
//                     resolve(e.target.result);
//                 };
//                 reader.readAsDataURL(imageInput.files[0]);
//             });
//         }
        
//         const res = await fetch('/api/pets', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ 
//                 name, 
//                 pet_type, 
//                 breed, 
//                 age, 
//                 gender, 
//                 weight, 
//                 color, 
//                 allergies, 
//                 medical_history, 
//                 pet_image 
//             })
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             showToast('✅ Pet registered successfully!', 'success');
//             closeAddPetModal();
//             loadMyPets();
//             const petCount = document.getElementById('petCount');
//             if (petCount) {
//                 const current = parseInt(petCount.textContent) || 0;
//                 petCount.textContent = current + 1;
//             }
//         } else {
//             showToast('❌ ' + (data.message || 'Error registering pet.'), 'error');
//             btn.textContent = '💾 Register Pet';
//             btn.disabled = false;
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         showToast('Something went wrong. Please try again.', 'error');
//         btn.textContent = '💾 Register Pet';
//         btn.disabled = false;
//     }
// }

// // ── Edit Pet Details Functions ──────────────────────────────────────
// async function showEditPetDetailsModal(petId) {
//     const email = localStorage.getItem('email') || sessionStorage.getItem('email');
//     if (!email) return;
    
//     try {
//         const res = await fetch(`/api/pets/${email}`);
//         const data = await res.json();
        
//         if (data.success) {
//             const pet = data.pets.find(p => p.id === petId);
//             if (pet) {
//                 document.getElementById('editPetDetailsId').value = pet.id;
//                 document.getElementById('editPetDetailsName').value = pet.name || '';
//                 document.getElementById('editPetDetailsType').value = pet.pet_type || 'Dog';
//                 document.getElementById('editPetDetailsBreed').value = pet.breed || '';
//                 document.getElementById('editPetDetailsAge').value = pet.age || '';
//                 document.getElementById('editPetDetailsGender').value = pet.gender || '';
//                 document.getElementById('editPetDetailsWeight').value = pet.weight || '';
//                 document.getElementById('editPetDetailsColor').value = pet.color || '';
//                 document.getElementById('editPetDetailsAllergies').value = pet.allergies || '';
//                 document.getElementById('editPetDetailsMedicalHistory').value = pet.medical_history || '';
                
//                 document.getElementById('editPetDetailsModal').style.display = 'flex';
//             }
//         }
//     } catch (error) {
//         console.error('Error loading pet details:', error);
//         showToast('Error loading pet details.', 'error');
//     }
// }

// function closeEditPetDetailsModal() {
//     document.getElementById('editPetDetailsModal').style.display = 'none';
// }

// async function updatePetDetails(e) {
//     e.preventDefault();
    
//     const petId = document.getElementById('editPetDetailsId').value;
//     const name = document.getElementById('editPetDetailsName').value.trim();
//     const pet_type = document.getElementById('editPetDetailsType').value;
//     const breed = document.getElementById('editPetDetailsBreed').value.trim();
//     const age = document.getElementById('editPetDetailsAge').value;
//     const gender = document.getElementById('editPetDetailsGender').value;
//     const weight = document.getElementById('editPetDetailsWeight').value;
//     const color = document.getElementById('editPetDetailsColor').value.trim();
//     const allergies = document.getElementById('editPetDetailsAllergies').value.trim();
//     const medical_history = document.getElementById('editPetDetailsMedicalHistory').value.trim();
    
//     if (!name) {
//         showToast('Please enter your pet\'s name.', 'error');
//         return;
//     }
    
//     const btn = document.getElementById('editPetDetailsSubmitBtn');
//     btn.textContent = '⏳ Updating...';
//     btn.disabled = true;
    
//     try {
//         const res = await fetch(`/api/pets/${petId}`, {
//             method: 'PUT',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ name, pet_type, breed, age, gender, weight, color, allergies, medical_history })
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             showToast('✅ Pet updated successfully!', 'success');
//             closeEditPetDetailsModal();
//             loadMyPets();
//         } else {
//             showToast('❌ ' + (data.message || 'Error updating pet.'), 'error');
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         showToast('Something went wrong. Please try again.', 'error');
//     }
    
//     btn.textContent = '💾 Update Pet';
//     btn.disabled = false;
// }

// // ── Delete Pet ──────────────────────────────────────────────────────
// async function deletePet(petId) {
//     if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
//         return;
//     }
    
//     try {
//         const res = await fetch(`/api/pets/${petId}`, {
//             method: 'DELETE'
//         });
//         const data = await res.json();
        
//         if (data.success) {
//             showToast('🗑️ Pet deleted successfully!', 'success');
//             loadMyPets();
//             const petCount = document.getElementById('petCount');
//             if (petCount) {
//                 const current = parseInt(petCount.textContent) || 0;
//                 petCount.textContent = current > 0 ? current - 1 : 0;
//             }
//         } else {
//             showToast('❌ ' + (data.message || 'Error deleting pet.'), 'error');
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         showToast('Something went wrong. Please try again.', 'error');
//     }
// }

// // ── Close modals on ESC ──────────────────────────────────────────────
// document.addEventListener('keydown', function(e) {
//     if (e.key === 'Escape') {
//         closeBookAppointmentModal();
//         closeEditPetImageModal();
//         closeLogoutModal();
//         closeContactModal();
//         closeAddPetModal();
//         closeEditPetDetailsModal();
//         closeBookingConfirmation();
//     }
// });

// // ── Click outside modal to close ─────────────────────────────────────
// document.addEventListener('click', function(e) {
//     if (e.target && e.target.id === 'bookingConfirmationModal') {
//         closeBookingConfirmation();
//     }
//     if (e.target.classList.contains('modal-overlay')) {
//         closeBookAppointmentModal();
//         closeEditPetImageModal();
//         closeLogoutModal();
//         closeContactModal();
//         closeAddPetModal();
//         closeEditPetDetailsModal();
//     }
// });

// // ── DOMContentLoaded ──────────────────────────────────────────────────
// document.addEventListener('DOMContentLoaded', function() {
//     switchSection('overview');
//     restoreSidebarState();
//     connectSocket();
//     loadUnreadCount();
    
//     // Add appointment tab click handlers
//     document.querySelectorAll('.appointment-tab').forEach(tab => {
//         tab.addEventListener('click', function() {
//             filterAppointments(this.dataset.tab);
//         });
//     });
    
//     const replyInput = document.getElementById('replyMessageStaff');
//     if (replyInput) {
//         let typingTimer;
//         replyInput.addEventListener('input', function() {
//             clearTimeout(typingTimer);
//             sendTypingIndicator(true);
            
//             typingTimer = setTimeout(() => {
//                 sendTypingIndicator(false);
//             }, 1000);
//         });
        
//         replyInput.addEventListener('blur', function() {
//             sendTypingIndicator(false);
//         });
//     }
// });

// // ── Also reload when coming back to page ─────────────────────────────
// window.addEventListener('pageshow', function() {
//     if (currentSection === 'overview') {
//         loadMyPets();
//         loadAppointments();
//         loadStaffConversations();
//     } else if (currentSection === 'appointments') {
//         loadAppointments();
//     } else if (currentSection === 'pets') {
//         loadMyPets();
//     } else if (currentSection === 'messages') {
//         loadStaffConversations();
//         loadUnreadCount();
//     }
    
//     loadUnreadCount();
// });

// // ── Make functions available globally ────────────────────────────────
// window.toggleSidebar = toggleSidebar;
// window.toggleMobileSidebar = toggleMobileSidebar;
// window.switchSection = switchSection;
// window.showLogoutModal = showLogoutModal;
// window.closeLogoutModal = closeLogoutModal;
// window.confirmLogout = confirmLogout;
// window.showBookAppointmentModal = showBookAppointmentModal;
// window.closeBookAppointmentModal = closeBookAppointmentModal;
// window.submitAppointment = submitAppointment;
// window.cancelAppointment = cancelAppointment;
// window.showEditPetImageModal = showEditPetImageModal;
// window.closeEditPetImageModal = closeEditPetImageModal;
// window.submitPetImageUpdate = submitPetImageUpdate;
// window.showContactModal = showContactModal;
// window.closeContactModal = closeContactModal;
// window.sendMessage = sendMessage;
// window.loadStaffConversations = loadStaffConversations;
// window.loadCustomerConversation = loadCustomerConversation;
// window.loadFirstUnreadConversation = loadFirstUnreadConversation;
// window.sendCustomerReply = sendCustomerReply;
// window.loadUnreadCount = loadUnreadCount;
// window.showToast = showToast;
// window.showAddPetModal = showAddPetModal;
// window.closeAddPetModal = closeAddPetModal;
// window.submitNewPet = submitNewPet;
// window.previewAddPetImage = previewAddPetImage;
// window.showEditPetDetailsModal = showEditPetDetailsModal;
// window.closeEditPetDetailsModal = closeEditPetDetailsModal;
// window.updatePetDetails = updatePetDetails;
// window.deletePet = deletePet;
// window.renderDatePicker = renderDatePicker;
// window.changeMonth = changeMonth;
// window.selectToday = selectToday;
// window.selectDate = selectDate;
// window.selectTime = selectTime;

// // ── CONFIRMATION MODAL FUNCTIONS ──────────────────────────────────────
// window.closeBookingConfirmation = closeBookingConfirmation;
// window.confirmBooking = confirmBooking;
// window.showBookingConfirmation = showBookingConfirmation;

// // ── UTILITY FUNCTIONS ─────────────────────────────────────────────────
// window.formatDuration = formatDuration;
// window.showAppointmentDetails = showAppointmentDetails;
// window.filterAppointments = filterAppointments;
// window.formatTime = formatTime;