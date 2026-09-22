// ── API SERVICES ─────────────────────────────────────────────────────

import { getLoggedInEmail, getLoggedInRole } from './utils.js';

// ── Appointments ────────────────────────────────────────────────────
export async function fetchAppointments() {
    try {
        const res = await fetch('/api/appointments');
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return { success: false, appointments: [] };
    }
}

export async function fetchAllAppointments() {
    try {
        const res = await fetch('/api/appointments/all');
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching all appointments:', error);
        return { success: false, appointments: [] };
    }
}

export async function bookAppointment(data) {
    try {
        const res = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('Error booking appointment:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function cancelAppointmentAPI(appointmentId) {
    try {
        const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
            method: 'PUT'
        });
        return await res.json();
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function checkAvailability(data) {
    try {
        const res = await fetch('/api/appointments/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('Error checking availability:', error);
        return { success: false, available: false };
    }
}

export async function fetchBookedSlots(date) {
    try {
        const res = await fetch(`/api/appointments/booked-slots/${date}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching booked slots:', error);
        return { success: false, slots: {} };
    }
}

// ── Pets ────────────────────────────────────────────────────────────
export async function fetchPets(email) {
    try {
        const res = await fetch(`/api/pets/${email}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching pets:', error);
        return { success: false, pets: [] };
    }
}

export async function createPet(data) {
    try {
        const res = await fetch('/api/pets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('Error creating pet:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function updatePet(petId, data) {
    try {
        const res = await fetch(`/api/pets/${petId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('Error updating pet:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function deletePetAPI(petId) {
    try {
        const res = await fetch(`/api/pets/${petId}`, {
            method: 'DELETE'
        });
        return await res.json();
    } catch (error) {
        console.error('Error deleting pet:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function updatePetImage(petId, imageData) {
    try {
        const res = await fetch(`/api/pets/${petId}/image`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_image: imageData })
        });
        return await res.json();
    } catch (error) {
        console.error('Error updating pet image:', error);
        return { success: false, message: 'Network error' };
    }
}

// ── Services ────────────────────────────────────────────────────────
export async function fetchServices() {
    try {
        const res = await fetch('/api/services');
        return await res.json();
    } catch (error) {
        console.error('Error fetching services:', error);
        return { success: false, services: [] };
    }
}

// ── Messages ────────────────────────────────────────────────────────
export async function fetchMessages() {
    try {
        const res = await fetch('/api/messages');
        return await res.json();
    } catch (error) {
        console.error('Error fetching messages:', error);
        return { success: false, messages: [] };
    }
}

export async function fetchReceivedMessages() {
    try {
        const res = await fetch('/api/messages/received-only');
        return await res.json();
    } catch (error) {
        console.error('Error fetching received messages:', error);
        return { success: false, senders: [] };
    }
}

export async function fetchConversation(senderEmail) {
    try {
        const res = await fetch(`/api/messages/${senderEmail}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return { success: false, messages: [] };
    }
}

export async function fetchCustomerConversation(staffEmail) {
    try {
        const res = await fetch(`/api/messages/customer/${staffEmail}`);
        return await res.json();
    } catch (error) {
        console.error('Error fetching customer conversation:', error);
        return { success: false, messages: [] };
    }
}

export async function sendMessageAPI(data) {
    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (error) {
        console.error('Error sending message:', error);
        return { success: false, message: 'Network error' };
    }
}

export async function fetchUnreadCount() {
    try {
        const res = await fetch('/api/messages/unread-count');
        return await res.json();
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return { success: false, count: 0 };
    }
}

export async function markMessagesRead(sender) {
    try {
        const res = await fetch('/api/messages/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender })
        });
        return await res.json();
    } catch (error) {
        console.error('Error marking messages read:', error);
        return { success: false };
    }
}