// ── AUTHENTICATION FUNCTIONS ────────────────────────────────────────

// ── Show Logout Modal ──────────────────────────────────────────────
export function showLogoutModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'logoutModal';
    overlay.innerHTML = `
        <div class="modal-popup" style="max-width: 400px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
            <h3 style="color: #38bdf8; font-size: 24px; margin-bottom: 10px;">Logout Confirmation</h3>
            <p style="color: #94a3b8; margin-bottom: 25px; line-height: 1.6;">Are you sure you want to logout? You'll need to sign in again to access your dashboard.</p>
            <div class="modal-buttons" style="justify-content: center;">
                <button class="modal-btn modal-btn-cancel" onclick="window.closeLogoutModal()">Cancel</button>
                <button class="modal-btn modal-btn-logout" onclick="window.confirmLogout()" style="background: #ef4444; color: white;">Yes, Logout</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

// ── Close Logout Modal ─────────────────────────────────────────────
export function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.remove();
}

// ── Confirm Logout ──────────────────────────────────────────────────
export async function confirmLogout() {
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

// ── Make functions globally available ──────────────────────────────
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;