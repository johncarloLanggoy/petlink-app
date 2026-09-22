// ── SIDEBAR MANAGEMENT ──────────────────────────────────────────────

import { getLoggedInRole } from './utils.js';

let currentSection = 'overview';

// ── Toggle Sidebar Collapse ─────────────────────────────────────────
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('mainContent');
    const toggleBtn = document.querySelector('.toggle-sidebar');
    
    if (!sidebar || !main || !toggleBtn) return;
    
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('expanded');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Expand sidebar');
    } else {
        toggleBtn.innerHTML = '◀';
        toggleBtn.setAttribute('aria-label', 'Collapse sidebar');
    }
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    try {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    } catch (e) {}
    
    window.dispatchEvent(new CustomEvent('sidebarToggle', { 
        detail: { collapsed: isCollapsed } 
    }));
}

// ── Restore Sidebar State ──────────────────────────────────────────
export function restoreSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('mainContent');
    const toggleBtn = document.querySelector('.toggle-sidebar');
    
    if (!sidebar || !main || !toggleBtn) return;
    
    let isCollapsed = false;
    try {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved !== null) {
            isCollapsed = JSON.parse(saved);
        }
    } catch (e) {}
    
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        main.classList.add('expanded');
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Expand sidebar');
    } else {
        sidebar.classList.remove('collapsed');
        main.classList.remove('expanded');
        toggleBtn.innerHTML = '◀';
        toggleBtn.setAttribute('aria-label', 'Collapse sidebar');
    }
}

// ── Mobile Sidebar Toggle ───────────────────────────────────────────
export function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// ── Close mobile sidebar when clicking outside ─────────────────────
document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 768) {
        if (sidebar && mobileBtn && !sidebar.contains(event.target) && !mobileBtn.contains(event.target)) {
            sidebar.classList.remove('mobile-open');
        }
    }
});

// ── Switch Section ──────────────────────────────────────────────────
export function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById('section-' + section);
    if (targetSection) {
        targetSection.style.display = 'block';
        setTimeout(() => {
            targetSection.classList.add('active');
        }, 10);
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-section-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const navMap = {
        'overview': 'navOverview',
        'appointments': 'navAppointments',
        'pets': 'navPets',
        'messages': 'navMessages'
    };
    
    const navBtn = document.getElementById(navMap[section]);
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    currentSection = section;
    
    // Load data based on section
    if (section === 'appointments') {
        import('./appointments.js').then(module => {
            module.loadAppointments();
        });
    } else if (section === 'pets') {
        import('./pets.js').then(module => {
            module.loadMyPets();
        });
    } else if (section === 'messages') {
        import('./messages.js').then(module => {
            module.loadStaffConversations();
            
            if (module.currentStaffEmail) {
                module.loadCustomerConversation(module.currentStaffEmail);
            } else {
                module.loadFirstUnreadConversation();
            }
            
            module.loadUnreadCount();
            module.updateMessageBadge();
            
            // ✅ FIX: Initialize emoji picker after messages load
            setTimeout(() => {
                module.initEmojiPicker();
                console.log('✅ Emoji picker re-initialized on messages section load');
            }, 400);
        });
    } else if (section === 'overview') {
        import('./pets.js').then(module => {
            module.loadMyPets();
        });
        import('./appointments.js').then(module => {
            module.loadAppointments();
        });
        import('./messages.js').then(module => {
            module.loadStaffConversations();
        });
    }
    
    import('./messages.js').then(module => {
        module.loadUnreadCount();
    });
    
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    }
}

// ── Export current section for other modules ──────────────────────
export function getCurrentSection() {
    return currentSection;
}