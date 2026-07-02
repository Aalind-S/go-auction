/* ==========================================================================
   BidSphere Standalone Sign Up Logic
   ========================================================================== */

// Configure base API endpoint (handles localhost port variations, file protocol, and relative routing)
const API_BASE = (window.location.origin.includes('localhost') && !window.location.origin.includes(':8000'))
    ? 'http://localhost:8000/api'
    : window.location.origin.startsWith('file://')
        ? 'http://localhost:8000/api'
        : '/api';

// ==========================================================================
// Toast System
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================================================
// API Fetch
// ==========================================================================
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || `HTTP error ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ==========================================================================
// Core Handler
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // If token already exists, redirect to home
    if (localStorage.getItem('auth_token')) {
        window.location.href = '/';
        return;
    }

    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const first_name = document.getElementById('reg-firstname').value;
        const last_name = document.getElementById('reg-lastname').value;
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ first_name, last_name, username, email, password })
            });

            if (data && data.token) {
                // Save credentials
                localStorage.setItem('auth_token', data.token);
                showToast('Registration successful! Welcome to BidSphere.', 'success');
                
                // Delay briefly for visual toast feedback
                setTimeout(() => {
                    window.location.href = '/';
                }, 800);
            }
        } catch (err) {
            showToast(err.message || 'Registration failed. Try a different username/email.', 'error');
        }
    });
});
