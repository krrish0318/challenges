const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

// Custom Middleware & Routes
const configureSecurity = require('./src/middleware/security');
const venueRoutes = require('./src/routes/venueRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const googleService = require('./src/services/googleService');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 🔐 Security & Middleware Setup
 */
configureSecurity(app);

// Body Parsers & Sanitization
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 🔗 Google/Firebase Services Initialization
 */
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
        admin.initializeApp({
            credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
            databaseURL: JSON.parse(process.env.FIREBASE_CONFIG || '{}').databaseURL
        });
        googleService.logEvent('INFO', 'Firebase initialized successfully');
    }
} catch (e) {
    googleService.logEvent('WARN', 'Firebase Initialization Failed', { error: e.message });
}

/**
 * 📦 Modular Routing
 */
app.use('/api/venue', venueRoutes);
app.use('/api/calendar', calendarRoutes);

/**
 * 🏁 Health Check
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'UP', 
        timestamp: new Date().toISOString(),
        version: '2.1'
    });
});

/**
 * 🚨 Global Error Handler
 */
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    
    // Log error to simulated cloud logging
    googleService.logEvent('ERROR', err.message || 'Unknown Server Error', { 
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        path: req.path,
        method: req.method
    });

    res.status(statusCode).json({ 
        error: 'VenueCrowd Engine Exception',
        message: process.env.NODE_ENV === 'production' ? 'Internal service error' : err.message,
        trackingId: `ERR-${Date.now()}`
    });
});

/**
 * 🚀 Server Startup
 */
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n========================================`);
        console.log(`🚀 Venue Engine running on port ${PORT}`);
        console.log(`📡 Dashboard: http://localhost:${PORT}`);
        console.log(`🔒 Security: Enabled (Helmet/Rate-Limit)`);
        console.log(`========================================\n`);
    });
}

module.exports = app;
