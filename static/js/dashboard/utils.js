// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────

// ── Toast Notification ──────────────────────────────────────────────
export function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }, 3000);
}

// ── Format Duration ──────────────────────────────────────────────────
export function formatDuration(totalMinutes) {
    if (!totalMinutes || totalMinutes === 0) return '0 min';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
        return `${minutes} min`;
    } else if (minutes === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${minutes}min`;
    }
}

// ── Format Time ──────────────────────────────────────────────────────
export function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    const [hour, minute] = timeStr.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

// ── Get Logged In Email ─────────────────────────────────────────────
export function getLoggedInEmail() {
    return localStorage.getItem('email') || sessionStorage.getItem('email') || '';
}

// ── Get Logged In Role ──────────────────────────────────────────────
export function getLoggedInRole() {
    return localStorage.getItem('role') || sessionStorage.getItem('role') || 'user';
}

// ── Check if Logged In ──────────────────────────────────────────────
export function isLoggedIn() {
    const token = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        if (Date.now() >= exp) {
            localStorage.removeItem('jwt_token');
            sessionStorage.removeItem('jwt_token');
            localStorage.removeItem('username');
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// ── Get Redirect URL by Role ────────────────────────────────────────
export function getDashboardUrl() {
    const role = getLoggedInRole();
    switch(role) {
        case 'admin': return '/admin';
        case 'staff': return '/staff';
        case 'vet': return '/vet';
        default: return '/dashboard';
    }
}