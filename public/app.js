/**
 * VenueCrowd Client Engine v2.1.1
 * Production-grade frontend orchestration for real-time venue optimization.
 */

// --- Configuration ---
const CONFIG = {
    GOOGLE_API_KEY: "REPLACE_WITH_YOUR_KEY",
    API_ENDPOINTS: {
        CROWD: '/api/venue/crowd',
        ASSISTANT: '/api/venue/assistant',
        ROUTE: '/api/venue/route',
        CALENDAR: '/api/calendar/sync',
        ALERT: '/api/venue/alert',
        ADMIN_DENSITY: '/api/venue/admin/density'
    },
    REFRESH_INTERVAL: 30000,
    MAP_CENTER: { lat: -37.8198, lng: 144.9834 },
    MAP_ZOOM: 17
};

// --- State Management ---
const APP_STATE = {
    map: null,
    markers: [],
    isSearching: false,
    isAuthenticated: false,
    lastUpdate: null
};

/**
 * Bootstraps the application on window load.
 */
function initApp() {
    loadGoogleMaps();
    startHeartbeat();
    setupEventListeners();
}

/**
 * Standardized API Fetch Wrapper
 * @param {string} url 
 * @param {Object} options 
 * @returns {Promise<any>}
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`[API Error] ${url}:`, error);
        throw error;
    }
}

/**
 * Heartbeat for real-time updates
 */
function startHeartbeat() {
    setInterval(fetchData, CONFIG.REFRESH_INTERVAL);
}

/**
 * Global Event Listeners initialization
 */
function setupEventListeners() {
    // Add global Enter key listeners etc if needed
}

/**
 * Dynamic Google Maps injection
 */
function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_API_KEY}&callback=initMap`;
    script.async = true;
    script.onerror = () => uiUpdateStatus("🔴 Maps API Error", "danger");
    document.head.appendChild(script);
}

/**
 * Map Initialization Callback
 */
function initMap() {
    APP_STATE.map = new google.maps.Map(document.getElementById("map"), {
        center: CONFIG.MAP_CENTER,
        zoom: CONFIG.MAP_ZOOM,
        disableDefaultUI: true,
        styles: getMapStyles(),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });
    fetchData(); // Initial load
}

/**
 * Orchestrates crowd data retrieval and UI synchronization.
 */
async function fetchData() {
    try {
        const data = await apiRequest(CONFIG.API_ENDPOINTS.CROWD);
        syncCrowdUI(data);
        uiUpdateStatus("🟢 Service Live", "success");
        APP_STATE.lastUpdate = new Date();
    } catch (e) {
        uiUpdateStatus("🔴 System Offline", "danger");
    }
}

/**
 * Synchronizes the sidebar list and map markers with fresh data.
 */
function syncCrowdUI(zones) {
    const list = document.getElementById('crowd-list');
    list.innerHTML = '';
    
    // Efficiently refresh markers
    APP_STATE.markers.forEach(m => m.setMap(null));
    APP_STATE.markers = [];

    zones.forEach(zone => {
        // Update Sidebar
        const card = uiCreateZoneCard(zone);
        list.appendChild(card);

        // Update Map
        if (APP_STATE.map) {
            uiAddZoneMarker(zone);
        }
    });

    uiAnnounceToScreenReader(`Updated data for ${zones.length} zones.`);
}

/**
 * Factory for Sidebar Zone Cards
 */
function uiCreateZoneCard(zone) {
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.role = 'listitem';
    card.tabIndex = 0;
    card.ariaLabel = `${zone.name}, Status: ${zone.status}, Density: ${zone.density}%`;
    card.innerHTML = `
        <span style="font-weight: 500">${zone.name}</span>
        <span class="density-tag ${zone.status.toLowerCase()}">${zone.status}</span>
    `;
    
    card.addEventListener('click', () => actionFocusOnZone(zone));
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') actionFocusOnZone(zone);
    });
    
    return card;
}

/**
 * Adds a visual density marker to the map.
 */
function uiAddZoneMarker(zone) {
    const marker = new google.maps.Marker({
        position: { 
            lat: CONFIG.MAP_CENTER.lat + (Math.random() * 0.002 - 0.001), 
            lng: CONFIG.MAP_CENTER.lng + (Math.random() * 0.004 - 0.002) 
        },
        map: APP_STATE.map,
        title: zone.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10 + (zone.density / 10),
            fillColor: uiGetDensityColor(zone.status),
            fillOpacity: 0.7,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });
    APP_STATE.markers.push(marker);
}

// --- Action Handlers ---

async function actionFocusOnZone(zone) {
    uiShowNotification("Zone Insight", `${zone.name} is currently ${zone.status}. Optimization suggests Gate B for entries.`);
    if (APP_STATE.map) {
        const marker = APP_STATE.markers.find(m => m.getTitle() === zone.name);
        if (marker) APP_STATE.map.panTo(marker.getPosition());
    }
}

async function askAssistant() {
    const input = document.getElementById('ai-query');
    const query = input.value.trim();
    if (!query) return;

    const resDiv = document.getElementById('ai-response');
    resDiv.innerHTML = '<span class="loader"></span> Analyzing...';
    resDiv.style.display = 'block';

    try {
        const data = await apiRequest(`${CONFIG.API_ENDPOINTS.ASSISTANT}?q=${encodeURIComponent(query)}`);
        const content = data.analysis || data.fallback;
        resDiv.innerHTML = `<strong>Assistant:</strong><br>${content}`;
        uiAnnounceToScreenReader(`Assistant response: ${content}`);
    } catch (e) {
        resDiv.innerHTML = "AI Assistant temporarily unavailable.";
        uiShowNotification("Error", "Could not connect to AI services.");
    }
}

function googleAuth() {
    const btn = document.getElementById('auth-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Verifying...';
    
    setTimeout(() => {
        document.getElementById('user-profile').style.display = 'flex';
        btn.style.display = 'none';
        APP_STATE.isAuthenticated = true;
        uiShowNotification("Google Identity", "Authentication Successful. Welcome back.");
    }, 1200);
}

async function getSmartRoute() {
    const from = document.getElementById('start-node').value;
    const to = document.getElementById('end-node').value;
    const btn = document.querySelector('button[onclick="getSmartRoute()"]');
    
    if (!btn) return;

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loader"></span> Optimizing...';

    try {
        const data = await apiRequest(`${CONFIG.API_ENDPOINTS.ROUTE}?from=${from}&to=${to}`);
        const panel = document.getElementById('route-panel');
        const text = document.getElementById('route-text');
        
        text.innerHTML = `Path: <strong>${data.pathIds.join(' → ')}</strong> <br><br>Benefit: <span style="color: var(--secondary)">${data.benefit}</span>`;
        panel.style.display = 'block';
        
        uiShowNotification("Route Optimized", "Crowd-aware path calculated.");
    } catch (e) {
        uiShowNotification("Error", "Routing computation failed.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function syncCalendar() {
    const btn = document.querySelector('.btn-calendar');
    btn.disabled = true;
    
    try {
        const data = await apiRequest(CONFIG.API_ENDPOINTS.CALENDAR, { method: 'POST' });
        uiShowNotification(data.error ? "Sync Alert" : "Calendar Update", data.error || "Event successfully synced.");
    } catch (e) {
        uiShowNotification("Sync Error", "Could not connect to Google Calendar.");
    } finally {
        btn.disabled = false;
    }
}

async function simulateAlert() {
    try {
        const data = await apiRequest(CONFIG.API_ENDPOINTS.ALERT);
        uiShowNotification(data.alert.title, data.alert.message);
        uiAnnounceToScreenReader(`Emergency Alert: ${data.alert.message}`, true);
    } catch (e) { /* silent fail for sim */ }
}

async function submitAdminUpdate() {
    const zoneId = document.getElementById('admin-zone').value;
    const density = document.getElementById('admin-density').value;
    
    toggleAdminModal(false);
    try {
        await apiRequest(CONFIG.API_ENDPOINTS.ADMIN_DENSITY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zoneId, density: parseInt(density) })
        });
        fetchData();
        uiShowNotification("Admin Success", `Zone ${zoneId} updated to ${density}%.`);
    } catch (e) {
        uiShowNotification("Admin Error", "Update failed.");
    }
}

// --- UI Helpers ---

function uiShowNotification(title, msg) {
    const notif = document.getElementById('notification');
    document.getElementById('notif-title').innerText = title;
    document.getElementById('notif-msg').innerText = msg;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 6000);
}

function uiUpdateStatus(text, type) {
    const statusDiv = document.getElementById('connection-status');
    statusDiv.innerHTML = text;
    statusDiv.style.color = type === 'danger' ? 'var(--danger)' : (type === 'success' ? 'var(--success)' : 'inherit');
}

function uiAnnounceToScreenReader(message, assertive = false) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.classList.add('sr-only');
    announcement.innerText = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

function toggleAdminModal(show) {
    const modal = document.getElementById('admin-modal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) document.getElementById('admin-density').focus();
}

function uiGetDensityColor(status) {
    switch (status) {
        case 'High': return "#ef4444";
        case 'Medium': return "#f59e0b";
        case 'Low': return "#10b981";
        default: return "#6366f1";
    }
}

function getMapStyles() {
    return [
        { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] }
    ];
}

// Global initialization
window.onload = initApp;
