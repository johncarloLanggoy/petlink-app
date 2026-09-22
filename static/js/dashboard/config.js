// ── CONFIGURATION CONSTANTS ──────────────────────────────────────────

export const CONFIG = {
    API_BASE: '/api',
    MAX_APPOINTMENTS_PER_SLOT: 3,
    TIME_SLOTS: [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
        '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ],
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 
             'July', 'August', 'September', 'October', 'November', 'December'],
    DAYS: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    STATUS_LABELS: {
        'all': 'appointments',
        'pending': 'pending appointments',
        'confirmed': 'confirmed appointments',
        'completed': 'completed appointments',
        'cancelled': 'cancelled appointments'
    }
};