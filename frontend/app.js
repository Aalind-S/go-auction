/* ==========================================================================
   BidSphere Client Core Logic
   Features: Auth, SPA Navigation, Auction Board, Form Submissions, Live Updates
   ========================================================================== */

// Configure base API endpoint (adapts to production vs development)
const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:8000/api' 
    : '/api';

// Global Client State
const state = {
    token: localStorage.getItem('auth_token') || null,
    user: null,
    auctions: [],
    filters: {
        search: '',
        status: '',
        page: 1,
        limit: 12
    }
};

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
// API Client Fetch Wrapper
// ==========================================================================
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    // Set headers
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (state.token) {
        headers['Authorization'] = `Bearer ${state.token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            // Handle expired/invalid token
            if (response.status === 401 && state.token) {
                logout();
                showToast('Session expired. Please sign in again.', 'error');
            }
            throw new Error(data.error || `HTTP error ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ==========================================================================
// Authentication System
// ==========================================================================
async function fetchUserProfile() {
    if (!state.token) return;
    try {
        const res = await apiFetch('/me');
        if (res && res.user) {
            state.user = res.user;
            updateAuthUI();
        }
    } catch (err) {
        logout();
    }
}

function updateAuthUI() {
    const userAnon = document.getElementById('user-anonymous');
    const userAuth = document.getElementById('user-authenticated');
    const navCreateBtn = document.getElementById('nav-create-btn');
    const exploreBtn = document.getElementById('hero-explore-btn');

    if (state.user) {
        // Authenticated layout
        userAnon.classList.add('hidden');
        userAuth.classList.remove('hidden');
        navCreateBtn.classList.remove('hidden');

        document.getElementById('username-display').textContent = `${state.user.first_name} ${state.user.last_name}`;
        document.getElementById('user-email-display').textContent = `@${state.user.username}`;
        document.getElementById('avatar-initials').textContent = state.user.first_name.charAt(0).toUpperCase();

        if (exploreBtn) {
            exploreBtn.textContent = 'View Live Board';
        }
    } else {
        // Anonymous layout
        userAnon.classList.remove('hidden');
        userAuth.classList.add('hidden');
        navCreateBtn.classList.add('hidden');

        if (exploreBtn) {
            exploreBtn.textContent = 'Explore Auctions';
        }
    }
    lucide.createIcons();
}

function login(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('auth_token', token);
    updateAuthUI();
    showToast(`Welcome back, ${user.first_name}!`, 'success');
    
    // Switch to dashboard
    switchView('dashboard');
    fetchAuctions();
}

function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('auth_token');
    updateAuthUI();
    showToast('Signed out successfully.', 'info');
    switchView('hero');
    fetchAuctions();
}

// ==========================================================================
// Router & Page Manager
// ==========================================================================
function switchView(viewName) {
    const heroSection = document.getElementById('hero-banner');
    const authSection = document.getElementById('auth-screen');
    const dashboardSection = document.getElementById('dashboard-screen');
    
    const dashboardNav = document.getElementById('nav-dashboard-btn');
    
    // Reset actives
    dashboardNav.classList.remove('active');

    // Hide all
    heroSection.classList.add('hidden');
    authSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');

    if (viewName === 'hero') {
        heroSection.classList.remove('hidden');
        dashboardSection.classList.remove('hidden'); // Show feed under hero for public explore
    } else if (viewName === 'auth') {
        authSection.classList.remove('hidden');
    } else if (viewName === 'dashboard') {
        dashboardSection.classList.remove('hidden');
        dashboardNav.classList.add('active');
    }
}

// ==========================================================================
// Auctions Feed System
// ==========================================================================
async function fetchAuctions() {
    const grid = document.getElementById('auctions-grid');
    const loader = document.getElementById('auctions-loader');
    const emptyState = document.getElementById('empty-state');
    const pagination = document.getElementById('pagination-controls');

    if (!grid) return;

    loader.classList.remove('hidden');
    grid.innerHTML = '';
    emptyState.classList.add('hidden');
    pagination.classList.add('hidden');

    try {
        // Prepare query parameters
        const queryParams = new URLSearchParams();
        if (state.filters.search) queryParams.append('search', state.filters.search);
        if (state.filters.status) queryParams.append('status', state.filters.status);
        queryParams.append('page', state.filters.page);
        queryParams.append('limit', state.filters.limit);

        // Fetch
        const data = await apiFetch(`/auction/?${queryParams.toString()}`);
        const auctions = data.auctions || [];
        state.auctions = auctions;

        if (auctions.length === 0) {
            emptyState.classList.remove('hidden');
            loader.classList.add('hidden');
            return;
        }

        // Render Cards
        renderAuctionCards(auctions, grid);
        
        // Show pagination controls if we have results (rudimentary)
        pagination.classList.remove('hidden');
        document.getElementById('page-indicator').textContent = `Page ${state.filters.page}`;
        document.getElementById('prev-page-btn').disabled = state.filters.page === 1;
        // Disable next page if we have less than limit items
        document.getElementById('next-page-btn').disabled = auctions.length < state.filters.limit;

    } catch (err) {
        showToast('Failed to fetch auctions. Please check backend connection.', 'error');
        emptyState.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
}

function renderAuctionCards(auctions, container) {
    container.innerHTML = auctions.map(auc => {
        const timeStatus = getRelativeTimeStatus(auc.starts_at, auc.ends_at, auc.status);
        
        let statusBadgeClass = 'upcoming-badge';
        if (auc.status === 'ACTIVE') statusBadgeClass = 'active-badge';
        if (auc.status === 'ENDED') statusBadgeClass = 'ended-badge';
        if (auc.status === 'CANCELLED') statusBadgeClass = 'cancelled-badge';

        // Check if user is the seller
        const isSeller = state.user && state.user.id === auc.seller.id;
        const sellerName = isSeller ? 'You' : `${auc.seller.first_name} ${auc.seller.last_name}`;

        return `
            <div class="glass-card auction-card" data-auction-id="${auc.id}">
                <div class="card-header">
                    <span class="badge ${statusBadgeClass}">${auc.status}</span>
                    <span class="timer"><i data-lucide="clock"></i> ${timeStatus.text}</span>
                </div>
                <h3>${escapeHtml(auc.title)}</h3>
                <p class="desc">${escapeHtml(auc.description)}</p>
                
                <div class="bid-info">
                    <div>
                        <span class="label">Starting Bid</span>
                        <span class="value">$${auc.starting_bid.toFixed(2)}</span>
                    </div>
                    <div>
                        <span class="label">Current Status</span>
                        <span class="valueHighlight current-bid-value">$${auc.starting_bid.toFixed(2)}</span>
                    </div>
                </div>

                <div class="card-seller">
                    <i data-lucide="user"></i>
                    <span>Seller: <strong>${escapeHtml(sellerName)}</strong></span>
                </div>

                <button class="btn btn-primary btn-block bid-action-btn" 
                        data-id="${auc.id}" 
                        ${auc.status !== 'ACTIVE' || isSeller ? 'disabled' : ''}>
                    ${isSeller ? 'Your Listing' : auc.status === 'ACTIVE' ? 'Place Bid' : 'Not Active'}
                </button>
            </div>
        `;
    }).join('');
    
    // Add Click listeners for place bid
    document.querySelectorAll('.bid-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if (!state.user) {
                showToast('You must sign in to place bids.', 'info');
                switchView('auth');
            } else {
                showToast('Bidding is coming soon in a future update!', 'info');
            }
        });
    });

    lucide.createIcons();
}

// Helpers for Escape HTML & date logic
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function getRelativeTimeStatus(startsAtStr, endsAtStr, status) {
    const now = new Date();
    // Parse Dates correctly (removing timezone padding if database returns raw formatted timestamps)
    const start = new Date(startsAtStr);
    const end = new Date(endsAtStr);

    if (status === 'ENDED' || now > end) {
        return { text: 'Ended', active: false };
    }

    if (now < start) {
        const diffMs = start - now;
        return { text: `Starts: ${formatTimeDiff(diffMs)}`, active: false };
    }

    const diffMs = end - now;
    return { text: `Ends: ${formatTimeDiff(diffMs)}`, active: true };
}

function formatTimeDiff(ms) {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
}

// Format Javascript Date to layout: 2006-01-02T15:04:05Z (No milliseconds for Gin datetime binding)
function formatRFC3339(dateValue) {
    const d = new Date(dateValue);
    const pad = (n) => String(n).padStart(2, '0');
    
    const year = d.getUTCFullYear();
    const month = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    const hours = pad(d.getUTCHours());
    const minutes = pad(d.getUTCMinutes());
    const seconds = pad(d.getUTCSeconds());
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

// ==========================================================================
// Event Listeners & Core Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Initial UI Icons Setup
    lucide.createIcons();

    // 1. Initial State Check
    if (state.token) {
        fetchUserProfile();
        switchView('dashboard');
    } else {
        switchView('hero');
    }
    fetchAuctions();

    // 2. Navigation Actions
    document.getElementById('nav-dashboard-btn').addEventListener('click', () => {
        switchView(state.user ? 'dashboard' : 'hero');
    });

    document.getElementById('hero-explore-btn').addEventListener('click', () => {
        switchView(state.user ? 'dashboard' : 'hero');
        document.getElementById('dashboard-screen').scrollIntoView({ behavior: 'smooth' });
    });

    // 3. Auth Switcher
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const triggerAuthView = (tab) => {
        switchView('auth');
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginTab.classList.remove('active');
            registerTab.classList.add('active');
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    };

    document.getElementById('header-login-btn').addEventListener('click', () => triggerAuthView('login'));
    document.getElementById('header-register-btn').addEventListener('click', () => triggerAuthView('register'));
    loginTab.addEventListener('click', () => triggerAuthView('login'));
    registerTab.addEventListener('click', () => triggerAuthView('register'));

    // 4. Auth Submissions
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
                login(data.token, data.user);
                loginForm.reset();
            }
        } catch (err) {
            showToast(err.message || 'Login failed', 'error');
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const first_name = document.getElementById('reg-firstname').value;
        const last_name = document.getElementById('reg-lastname').value;
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ first_name, last_name, username, email, password })
            });

            if (data && data.token) {
                login(data.token, data.user);
                registerForm.reset();
            }
        } catch (err) {
            showToast(err.message || 'Registration failed', 'error');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', logout);

    // 5. Dashboard Filters
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const resetBtn = document.getElementById('reset-filters-btn');
    const emptyResetBtn = document.getElementById('empty-reset-btn');

    let debounceTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            state.filters.search = searchInput.value;
            state.filters.page = 1;
            fetchAuctions();
        }, 400);
    });

    statusFilter.addEventListener('change', () => {
        state.filters.status = statusFilter.value;
        state.filters.page = 1;
        fetchAuctions();
    });

    const resetFilters = () => {
        searchInput.value = '';
        statusFilter.value = '';
        state.filters.search = '';
        state.filters.status = '';
        state.filters.page = 1;
        fetchAuctions();
    };

    resetBtn.addEventListener('click', resetFilters);
    emptyResetBtn.addEventListener('click', resetFilters);

    // Pagination Click Listeners
    document.getElementById('prev-page-btn').addEventListener('click', () => {
        if (state.filters.page > 1) {
            state.filters.page--;
            fetchAuctions();
        }
    });

    document.getElementById('next-page-btn').addEventListener('click', () => {
        state.filters.page++;
        fetchAuctions();
    });

    // 6. Create Auction Modal Actions
    const createModal = document.getElementById('create-modal');
    const openModalBtn = document.getElementById('nav-create-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-create-btn');
    const createForm = document.getElementById('create-auction-form');

    const toggleModal = (show) => {
        if (show) {
            createModal.classList.remove('hidden');
            // Preset dates to reasonable defaults (starts now, ends in 7 days)
            const now = new Date();
            const future = new Date();
            future.setDate(now.getDate() + 7);
            
            // Format for datetime-local input fields (local timezone)
            const formatLocalDatetime = (date) => {
                const pad = (n) => String(n).padStart(2, '0');
                const yyyy = date.getFullYear();
                const MM = pad(date.getMonth() + 1);
                const dd = pad(date.getDate());
                const hh = pad(date.getHours());
                const mm = pad(date.getMinutes());
                return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
            };

            document.getElementById('auc-starts-at').value = formatLocalDatetime(now);
            document.getElementById('auc-ends-at').value = formatLocalDatetime(future);
        } else {
            createModal.classList.add('hidden');
            createForm.reset();
        }
    };

    openModalBtn.addEventListener('click', () => toggleModal(true));
    closeModalBtn.addEventListener('click', () => toggleModal(false));
    cancelModalBtn.addEventListener('click', () => toggleModal(false));

    // Submit Create Auction Form
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('auc-title').value;
        const description = document.getElementById('auc-description').value;
        const starting_bid = parseFloat(document.getElementById('auc-bid').value);
        const starts_at_raw = document.getElementById('auc-starts-at').value;
        const ends_at_raw = document.getElementById('auc-ends-at').value;

        // Validation logic
        const startsAt = new Date(starts_at_raw);
        const endsAt = new Date(ends_at_raw);

        if (startsAt >= endsAt) {
            showToast('Start time must be before end time', 'error');
            return;
        }

        if (endsAt <= new Date()) {
            showToast('End time must be in the future', 'error');
            return;
        }

        // Format dates strictly as RFC3339 matching backend format layout
        const starts_at = formatRFC3339(startsAt);
        const ends_at = formatRFC3339(endsAt);

        try {
            await apiFetch('/auction/create', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    starting_bid,
                    starts_at,
                    ends_at
                })
            });

            showToast('Auction published successfully!', 'success');
            toggleModal(false);
            fetchAuctions();
        } catch (err) {
            showToast(err.message || 'Failed to publish auction', 'error');
        }
    });
});
