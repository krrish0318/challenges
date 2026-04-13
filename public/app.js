/**
 * VenueCrowd Client Engine v2.1
 * Handles real-time updates, Google Maps integration, and AI Assistant interactions.
 */

const GOOGLE_API_KEY = "REPLACE_WITH_YOUR_KEY";
let map, markers = [];

/**
 * Initialize the application
 */
function initApp() {
    loadGoogleMaps();
    setInterval(fetchData, 30000);
}

/**
 * Load Google Maps API
 */
function loadGoogleMaps() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap`;
    script.async = true;
    script.onerror = () => {
        updateStatus("🔴 Maps API Error", "danger");
    };
    document.head.appendChild(script);
}

/**
 * Initialize Google Map
 */
function initMap() {
    const venueCenter = { lat: -37.8198, lng: 144.9834 };
    map = new google.maps.Map(document.getElementById("map"), {
        center: venueCenter,
        zoom: 17,
        disableDefaultUI: true,
        styles: getMapStyles(),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
    });
    fetchData();
}

/**
 * Fetch crowd density data from the server
 */
async function fetchData() {
    try {
        const response = await fetch('/api/venue/crowd');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        updateUI(data);
        updateStatus("🟢 Service Live", "success");
    } catch (e) {
        console.error("Fetch Error:", e);
        updateStatus("🔴 System Offline", "danger");
    }
}

/**
 * Update the UI with fresh crowd data
 */
function updateUI(zones) {
    const list = document.getElementById('crowd-list');
    list.innerHTML = '';
    
    // Clear existing markers
    markers.forEach(m => m.setMap(null));
    markers = [];

    zones.forEach(zone => {
        const card = createZoneCard(zone);
        list.appendChild(card);

        if (map) {
            addZoneMarker(zone);
        }
    });

    // Screen reader announcement for live updates
    announceToScreenReader(`Updated data for ${zones.length} zones.`);
}

/**
 * Create a zone card element
 */
function createZoneCard(zone) {
    const card = document.createElement('div');
    card.className = 'zone-card';
    card.role = 'listitem';
    card.tabIndex = 0;
    card.ariaLabel = `${zone.name}, Status: ${zone.status}, Density: ${zone.density}%`;
    card.innerHTML = `
        <span style="font-weight: 500">${zone.name}</span>
        <span class="density-tag ${zone.status.toLowerCase()}">${zone.status}</span>
    `;
    
    card.addEventListener('click', () => focusOnZone(zone));
    card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') focusOnZone(zone);
    });
    
    return card;
}

/**
 * Add a density marker to the map
 */
function addZoneMarker(zone) {
    const marker = new google.maps.Marker({
        position: { 
            lat: -37.8198 + (Math.random() * 0.002 - 0.001), 
            lng: 144.9834 + (Math.random() * 0.004 - 0.002) 
        },
        map: map,
        title: zone.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10 + (zone.density / 10),
            fillColor: getDensityColor(zone.status),
            fillOpacity: 0.7,
            strokeWeight: 2,
            strokeColor: "#ffffff"
        }
    });
    markers.push(marker);
}

/**
 * Handle zone focus/selection
 */
function focusOnZone(zone) {
    showNotification("Zone Insight", `${zone.name} is currently ${zone.status}. Optimization suggests Gate B for entries.`);
    if (map) {
        // Find the marker for this zone and center on it (simplified for demo)
        map.panTo(markers.find(m => m.getTitle() === zone.name).getPosition());
    }
}

/**
 * AI Assistant Interaction
 */
async function askAssistant() {
    const queryInput = document.getElementById('ai-query');
    const query = queryInput.value.trim();
    if (!query) return;

    const resDiv = document.getElementById('ai-response');
    resDiv.innerHTML = '<span class="loader"></span> Analyzing...';
    resDiv.style.display = 'block';

    try {
        const res = await fetch(`/api/venue/assistant?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        resDiv.innerHTML = `<strong>Assistant:</strong><br>${data.analysis || data.fallback}`;
        announceToScreenReader(`Assistant response: ${data.analysis || data.fallback}`);
    } catch (e) {
        resDiv.innerHTML = "AI Assistant temporarily unavailable.";
        showNotification("Error", "Could not connect to AI services.");
    }
}

/**
 * Google Authentication Flow (Simulated)
 */
function googleAuth() {
    const btn = document.getElementById('auth-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> Verifying...';
    
    setTimeout(() => {
        document.getElementById('user-profile').style.display = 'flex';
        btn.style.display = 'none';
        showNotification("Google Identity", "Authentication Successful. Welcome to VenueCrowd.");
    }, 1200);
}

/**
 * Smart Route Calculation
 */
async function getSmartRoute() {
    const from = document.getElementById('start-node').value;
    const to = document.getElementById('end-node').value;
    const btn = document.querySelector('button[onclick="getSmartRoute()"]');
    
    if (!btn) return;

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loader"></span> Optimizing...';

    try {
        const res = await fetch(`/api/venue/route?from=${from}&to=${to}`);
        if (!res.ok) throw new Error('Routing failed');
        const data = await res.json();
        
        const panel = document.getElementById('route-panel');
        const text = document.getElementById('route-text');
        
        text.innerHTML = `Path: <strong>${data.pathIds.join(' → ')}</strong> <br><br>Benefit: <span style="color: var(--secondary)">${data.benefit}</span>`;
        panel.style.display = 'block';
        
        showNotification("Route Optimized", "Crowd-aware path calculated successfully.");
    } catch (e) {
        showNotification("Error", "Routing computation failed.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Calendar Sync Interaction
 */
async function syncCalendar() {
    const btn = document.querySelector('.btn-calendar');
    btn.disabled = true;
    
    try {
        const res = await fetch('/api/calendar/sync', { method: 'POST' });
        const data = await res.json();
        showNotification(data.error ? "Sync Alert" : "Calendar Update", data.error || "Event successfully synced.");
    } catch (e) {
        showNotification("Sync Error", "Could not connect to Google Calendar.");
    } finally {
        btn.disabled = false;
    }
}

/**
 * Emergency Alert Simulation
 */
async function simulateAlert() {
    try {
        const res = await fetch('/api/venue/alert');
        const data = await res.json();
        showNotification(data.alert.title, data.alert.message);
        announceToScreenReader(`Emergency Alert: ${data.alert.message}`, true);
    } catch (e) { 
        console.error("Alert simulation failed");
    }
}

/**
 * Notification System
 */
function showNotification(title, msg) {
    const notif = document.getElementById('notification');
    document.getElementById('notif-title').innerText = title;
    document.getElementById('notif-msg').innerText = msg;
    notif.classList.add('show');
    
    // Auto-hide after 6 seconds
    setTimeout(() => notif.classList.remove('show'), 6000);
}

/**
 * Admin Modal Controls
 */
function toggleAdminModal(show) {
    const modal = document.getElementById('admin-modal');
    modal.style.display = show ? 'flex' : 'none';
    if (show) {
        document.getElementById('admin-density').focus();
    }
}

/**
 * Admin Density Update Submission
 */
async function submitAdminUpdate() {
    const zoneId = document.getElementById('admin-zone').value;
    const density = document.getElementById('admin-density').value;
    
    toggleAdminModal(false);
    try {
        const res = await fetch('/api/venue/admin/density', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zoneId, density: parseInt(density) })
        });
        
        if (!res.ok) throw new Error('Update failed');
        
        fetchData();
        showNotification("Admin Success", `Zone ${zoneId} density updated to ${density}%.`);
    } catch (e) {
        showNotification("Admin Error", "Update failed. Please check inputs.");
    }
}

/**
 * Helper: Get marker color based on status
 */
function getDensityColor(status) {
    switch (status) {
        case 'High': return "#ef4444";
        case 'Medium': return "#f59e0b";
        case 'Low': return "#10b981";
        default: return "#6366f1";
    }
}

/**
 * Helper: Update connection status text
 */
function updateStatus(text, type) {
    const statusDiv = document.getElementById('connection-status');
    statusDiv.innerHTML = text;
    statusDiv.style.color = type === 'danger' ? 'var(--danger)' : (type === 'success' ? 'var(--success)' : 'inherit');
}

/**
 * Accessibility Helper: Announce text to screen readers
 */
function announceToScreenReader(message, assertive = false) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.classList.add('sr-only');
    announcement.innerText = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

/**
 * Helper: Google Map Dark Mode Styles
 */
function getMapStyles() {
    return [
        { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] }
    ];
}

// Global initialization
window.onload = initApp;
