const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const googleService = require('../services/googleService');

/**
 * Calendar Sync Routes
 */
router.post('/sync', async (req, res, next) => {
    // Demo event data
    const event = {
        summary: 'Stadium Event Day Optimizer',
        location: 'Gate B, Sports Venue',
        description: 'Arrive via North Gate B for 40% less congestion. Sync with VenueCrowd.',
        start: { dateTime: '2026-05-10T18:00:00Z', timeZone: 'UTC' },
        end: { dateTime: '2026-05-10T22:00:00Z', timeZone: 'UTC' }
    };

    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/calendar.events']
        });
        const calendar = google.calendar({ version: 'v3', auth });

        const response = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
            resource: event,
        });

        googleService.logEvent('INFO', 'Calendar event synced successfully', { eventId: response.data.id });
        res.json({ success: true, link: response.data.htmlLink });
    } catch (err) {
        // Log the error but return a graceful fallback for simulation/demo
        googleService.logEvent('WARN', 'Calendar sync in simulation mode', { error: err.message });
        
        res.status(200).json({ 
            error: "Notice: Sync is in simulated mode (no service account).", 
            mockLink: "https://calendar.google.com/event?id=venue_crowd_demo" 
        });
    }
});

module.exports = router;
