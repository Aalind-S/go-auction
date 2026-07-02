/* ==========================================================================
   BidSphere Standalone Login Logic
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

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (data && data.token) {
                // Save credentials
                localStorage.setItem('auth_token', data.token);
                showToast('Signed in successfully! Redirecting...', 'success');
                
                // Delay briefly for visual toast feedback
                setTimeout(() => {
                    window.location.href = '/';
                }, 800);
            }
        } catch (err) {
            showToast(err.message || 'Invalid email or password', 'error');
        }
    });
});
