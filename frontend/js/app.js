/* ==========================================================================
   BidSphere Client Core Logic
   Features: Auth, SPA Navigation, Auction Board, Form Submissions, Live Updates
   ========================================================================== */

// Configure base API endpoint (handles localhost port variations, file protocol, and relative routing)
const API_BASE = (window.location.origin.includes('localhost') && !window.location.origin.includes(':8000'))
    ? 'http://localhost:8000/api'
    : window.location.origin.startsWith('file://')
        ? 'http://localhost:8000/api'
        : '/api';

// Global Client State
const state = {
    token: localStorage.getItem('auth_token') || null,
    user: null,
    auctions: [],
    activeAuction: null,
    joinedAuctions: JSON.parse(localStorage.getItem('joined_auctions') || '[]'),
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
    const dashboardSection = document.getElementById('dashboard-screen');
    
    const dashboardNav = document.getElementById('nav-dashboard-btn');
    
    // Reset actives
    dashboardNav.classList.remove('active');

    // Hide all
    heroSection.classList.add('hidden');
    dashboardSection.classList.add('hidden');

    if (viewName === 'hero') {
        heroSection.classList.remove('hidden');
        dashboardSection.classList.remove('hidden'); // Show feed under hero for public explore
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
        const data = await apiFetch(`/auction/search?${queryParams.toString()}`);
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
                        data-id="${auc.id}">
                    ${isSeller ? 'Your Listing' : auc.status === 'ACTIVE' ? 'Place Bid' : 'View Details'}
                </button>
            </div>
        `;
    }).join('');
    
    // Add Click listeners for opening details/bid modal
    document.querySelectorAll('.bid-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openBidModal(id);
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
// Bidding Modal & Actions Logic
// ==========================================================================
async function openBidModal(auctionId) {
    const modal = document.getElementById('bid-modal');
    if (!modal) return;

    // Show modal and start loading UI
    modal.classList.remove('hidden');
    
    // Clear list, hide warn, show loading
    document.getElementById('bid-history-list').innerHTML = '';
    document.getElementById('bid-history-loader').classList.remove('hidden');
    document.getElementById('place-bid-container').classList.add('hidden');
    document.getElementById('join-auction-container').classList.add('hidden');
    document.getElementById('bid-validation-warning').classList.add('hidden');

    try {
        // Fetch fresh details of this auction
        const auc = await apiFetch(`/auction/${auctionId}`);
        state.activeAuction = auc;

        // Populate elements
        document.getElementById('bid-modal-title').textContent = auc.title;
        document.getElementById('bid-modal-desc').textContent = auc.description;
        document.getElementById('bid-modal-starting-price').textContent = `$${auc.starting_bid.toFixed(2)}`;
        
        const currentPriceEl = document.getElementById('bid-modal-current-price');
        currentPriceEl.textContent = `$${auc.starting_bid.toFixed(2)}`; // default is starting bid
        
        // Update status badge style
        const statusEl = document.getElementById('bid-modal-status');
        statusEl.textContent = auc.status;
        statusEl.className = 'badge';
        if (auc.status === 'ACTIVE') statusEl.classList.add('active-badge');
        else if (auc.status === 'ENDED') statusEl.classList.add('ended-badge');
        else if (auc.status === 'NOT STARTED') statusEl.classList.add('upcoming-badge');
        else if (auc.status === 'CANCELLED') statusEl.classList.add('cancelled-badge');

        const isSeller = state.user && state.user.id === auc.seller.id;
        const sellerName = isSeller ? 'You' : `${auc.seller.first_name} ${auc.seller.last_name}`;
        document.getElementById('bid-modal-seller').textContent = sellerName;

        // Timer setup
        if (window.activeTimerInterval) clearInterval(window.activeTimerInterval);
        const timerEl = document.getElementById('bid-modal-timer');
        const updateTimer = () => {
            const relative = getRelativeTimeStatus(auc.starts_at, auc.ends_at, auc.status);
            timerEl.innerHTML = `<i data-lucide="clock"></i> ${relative.text}`;
            lucide.createIcons();
        };
        updateTimer();
        window.activeTimerInterval = setInterval(updateTimer, 1000);

        // Manage action section based on status & auth
        const actionsSection = document.getElementById('bidding-actions-section');
        actionsSection.classList.remove('hidden');

        if (!state.user) {
            // Not logged in
            document.getElementById('join-auction-container').classList.remove('hidden');
            document.getElementById('join-auction-btn').innerHTML = '<i data-lucide="log-in"></i> Sign In to Bid';
            document.querySelector('#join-auction-container .cta-message').textContent = 'Please sign in to participate and place bids.';
        } else if (isSeller) {
            // User is the seller
            actionsSection.classList.add('hidden'); // hide bidding forms for the seller
        } else if (auc.status !== 'ACTIVE') {
            // Auction not active
            actionsSection.classList.add('hidden');
        } else {
            // User is logged in, not the seller, and auction is active. Check participation
            const hasJoined = state.joinedAuctions.includes(auctionId);
            if (hasJoined) {
                showPlaceBidForm(auc);
            } else {
                showJoinForm();
            }
        }

        // Fetch Bids History
        await fetchBidHistory(auctionId);

    } catch (err) {
        showToast('Failed to load auction details.', 'error');
        modal.classList.add('hidden');
    } finally {
        lucide.createIcons();
    }
}

function showPlaceBidForm(auc) {
    document.getElementById('join-auction-container').classList.add('hidden');
    document.getElementById('place-bid-container').classList.remove('hidden');
    
    // Suggest a bid that is 10 above starting/current bid
    const currentPrice = state.activeAuction.current_bid || parseFloat(auc.starting_bid);
    const input = document.getElementById('bid-amount-input');
    input.value = (currentPrice + 10.00).toFixed(2);
    input.min = (currentPrice + 0.01).toFixed(2);
}

function showJoinForm() {
    document.getElementById('join-auction-container').classList.remove('hidden');
    document.getElementById('place-bid-container').classList.add('hidden');
    document.getElementById('join-auction-btn').innerHTML = '<i data-lucide="user-plus"></i> Join Auction';
    document.querySelector('#join-auction-container .cta-message').textContent = 'You need to register as a participant to bid on this auction.';
}

async function fetchBidHistory(auctionId) {
    const listContainer = document.getElementById('bid-history-list');
    const loader = document.getElementById('bid-history-loader');
    
    loader.classList.remove('hidden');
    listContainer.innerHTML = '';

    try {
        // Fetch bids
        const bids = await apiFetch(`/auction/${auctionId}/bids`);
        
        if (bids && bids.length > 0) {
            // Update current bid price in state and UI
            const highestBid = bids[0].amount;
            state.activeAuction.current_bid = highestBid;
            
            const curPriceEl = document.getElementById('bid-modal-current-price');
            const oldPrice = parseFloat(curPriceEl.textContent.replace('$', ''));
            
            curPriceEl.textContent = `$${highestBid.toFixed(2)}`;
            
            // Add pulse effect if updated
            if (highestBid > oldPrice) {
                curPriceEl.classList.remove('price-pulse');
                void curPriceEl.offsetWidth; // trigger reflow
                curPriceEl.classList.add('price-pulse');
            }

            // Update bid input default/min values
            const input = document.getElementById('bid-amount-input');
            if (input) {
                input.value = (highestBid + 10.00).toFixed(2);
                input.min = (highestBid + 0.01).toFixed(2);
            }

            // Render history items
            listContainer.innerHTML = bids.map(bid => {
                const formattedTime = new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
                                     ' ' + new Date(bid.created_at).toLocaleDateString();
                return `
                    <div class="bid-history-item">
                        <div class="bidder-details">
                            <span class="bidder-name">@${escapeHtml(bid.bidder_username)}</span>
                            <span class="bid-time">${formattedTime}</span>
                        </div>
                        <span class="bid-amt">$${bid.amount.toFixed(2)}</span>
                    </div>
                `;
            }).join('');
        } else {
            listContainer.innerHTML = `<p class="cta-message" style="margin-top: 20px;">No bids placed yet. Be the first to bid!</p>`;
        }
    } catch (err) {
        // Fail-safe: if history endpoint does not exist yet, mock or empty
        console.warn("Bids history fetch failed, using fallback empty state", err);
        listContainer.innerHTML = `<p class="cta-message" style="margin-top: 20px;">No bids placed yet. Be the first to bid!</p>`;
    } finally {
        loader.classList.add('hidden');
    }
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

    // 7. Bidding Modal Event Listeners
    const bidModal = document.getElementById('bid-modal');
    const closeBidModalBtn = document.getElementById('close-bid-modal-btn');
    const joinBtn = document.getElementById('join-auction-btn');
    const placeBidForm = document.getElementById('place-bid-form');
    const bidInput = document.getElementById('bid-amount-input');
    const submitBidBtn = document.getElementById('submit-bid-btn');
    const validationWarning = document.getElementById('bid-validation-warning');

    const closeBidModal = () => {
        bidModal.classList.add('hidden');
        if (window.activeTimerInterval) clearInterval(window.activeTimerInterval);
        state.activeAuction = null;
    };

    closeBidModalBtn.addEventListener('click', closeBidModal);
    
    // Close modal when clicking outside the card
    bidModal.addEventListener('click', (e) => {
        if (e.target === bidModal) {
            closeBidModal();
        }
    });

    // Join Auction Action
    joinBtn.addEventListener('click', async () => {
        if (!state.user) {
            // Redirect to login if anonymous
            showToast('Redirecting to sign in page...', 'info');
            setTimeout(() => {
                window.location.href = '/login';
            }, 800);
            return;
        }

        const auctionId = state.activeAuction.id;
        try {
            joinBtn.disabled = true;
            joinBtn.textContent = 'Joining...';
            
            await apiFetch(`/auction/${auctionId}/join`, {
                method: 'POST'
            });

            showToast('Successfully registered as a participant!', 'success');
            
            // Add to joined list
            if (!state.joinedAuctions.includes(auctionId)) {
                state.joinedAuctions.push(auctionId);
                localStorage.setItem('joined_auctions', JSON.stringify(state.joinedAuctions));
            }

            // Show place bid form
            showPlaceBidForm(state.activeAuction);
        } catch (err) {
            // Check if already joined (fallback/success)
            if (err.message && err.message.includes('already joined')) {
                if (!state.joinedAuctions.includes(auctionId)) {
                    state.joinedAuctions.push(auctionId);
                    localStorage.setItem('joined_auctions', JSON.stringify(state.joinedAuctions));
                }
                showPlaceBidForm(state.activeAuction);
            } else {
                showToast(err.message || 'Failed to join auction', 'error');
            }
        } finally {
            joinBtn.disabled = false;
            joinBtn.innerHTML = '<i data-lucide="user-plus"></i> Join Auction';
            lucide.createIcons();
        }
    });

    // Quick Bid Buttons click handlers
    document.querySelectorAll('.quick-bid-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const increment = parseFloat(e.currentTarget.getAttribute('data-increment'));
            const currentPrice = state.activeAuction.current_bid || parseFloat(state.activeAuction.starting_bid);
            bidInput.value = (currentPrice + increment).toFixed(2);
            validateBidInput();
        });
    });

    // Bid Input validation
    const validateBidInput = () => {
        if (!state.activeAuction) return;
        const currentPrice = state.activeAuction.current_bid || parseFloat(state.activeAuction.starting_bid);
        const enteredVal = parseFloat(bidInput.value);

        if (isNaN(enteredVal) || enteredVal <= currentPrice) {
            validationWarning.textContent = `Bid must be greater than current price of $${currentPrice.toFixed(2)}`;
            validationWarning.classList.remove('hidden');
            submitBidBtn.disabled = true;
        } else {
            validationWarning.classList.add('hidden');
            submitBidBtn.disabled = false;
        }
    };

    bidInput.addEventListener('input', validateBidInput);

    // Place Bid form submit handler
    placeBidForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!state.user || !state.activeAuction) return;
        
        const amount = parseFloat(bidInput.value);
        const auctionId = state.activeAuction.id;
        
        const currentPrice = state.activeAuction.current_bid || parseFloat(state.activeAuction.starting_bid);
        if (amount <= currentPrice) {
            showToast('Your bid must be greater than the current bid.', 'error');
            return;
        }

        try {
            submitBidBtn.disabled = true;
            submitBidBtn.textContent = 'Submitting...';

            // Post the bid to backend matching PlaceBidRequest
            await apiFetch(`/auction/${auctionId}/bid`, {
                method: 'POST',
                body: JSON.stringify({
                    auction_id: auctionId,
                    amount: amount,
                    bidder_id: state.user.id
                })
            });

            showToast('Bid placed successfully!', 'success');
            
            // Refresh view and history
            await fetchBidHistory(auctionId);
            fetchAuctions(); // update dashboard feed
        } catch (err) {
            showToast(err.message || 'Failed to place bid', 'error');
        } finally {
            submitBidBtn.disabled = false;
            submitBidBtn.innerHTML = 'Place Bid <i data-lucide="gavel"></i>';
            lucide.createIcons();
        }
    });
});
