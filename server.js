const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

// Custom Utils, Middleware & Routes
const validateConfig = require('./src/utils/config');
const configureSecurity = require('./src/middleware/security');
const venueRoutes = require('./src/routes/venueRoutes');
const calendarRoutes = require('./src/routes/calendarRoutes');
const googleService = require('./src/services/googleService');
const { SYSTEM, HTTP_STATUS } = require('./src/utils/constants');

// Boot validation
validateConfig();

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * 🔐 Security & Core Middleware
 */
configureSecurity(app);

app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 🔗 External Services Initialization
 */
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT && require('fs').existsSync(process.env.FIREBASE_SERVICE_ACCOUNT)) {
        admin.initializeApp({
            credential: admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT),
            databaseURL: JSON.parse(process.env.FIREBASE_CONFIG || '{}').databaseURL
        });
        googleService.logEvent('INFO', 'Firebase connection established');
    }
} catch (e) {
    googleService.logEvent('WARN', 'Firebase initialization skipped', { message: e.message });
}

/**
 * 📦 API Routing
 */
app.use('/api/venue', venueRoutes);
app.use('/api/calendar', calendarRoutes);

/**
 * 🏁 System Health Check
 */
app.get('/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({ 
        status: 'UP', 
        timestamp: new Date().toISOString(),
        version: SYSTEM.VERSION
    });
});

/**
 * 🚨 Global Error Handler
 */
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    
    // Log exception details
    googleService.logEvent('ERROR', err.message || 'Server Exception', { 
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        path: req.path,
        method: req.method,
        operational: err.isOperational
    });

    res.status(statusCode).json({ 
        error: 'VenueCrowd Engine Exception',
        message: process.env.NODE_ENV === 'production' && !err.isOperational 
            ? 'An internal error occurred.' 
            : err.message,
        trackingId: `ERR-${Date.now()}`
    });
});

/**
 * 🚀 Engine Startup
 */
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n========================================`);
        console.log(`🚀 ${SYSTEM.SERVICE_NAME} v${SYSTEM.VERSION}`);
        console.log(`📡 Dashboard: http://localhost:${PORT}`);
        console.log(`🔒 Security: Active (Helmet/Rate-Limit)`);
        console.log(`========================================\n`);
    });
}

module.exports = app;
