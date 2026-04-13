const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Security Middleware Configuration
 */
const configureSecurity = (app) => {
    // 1. Global Rate Limiting
    const globalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, 
        max: 500,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
    });
    app.use(globalLimiter);

    // 2. Helmet for secure HTTP headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"],
                "script-src": [
                    "'self'", 
                    "'unsafe-inline'", // Required for some inline scripts, though minimized
                    "https://maps.googleapis.com"
                ],
                "img-src": [
                    "'self'", 
                    "data:", 
                    "https://maps.gstatic.com", 
                    "https://maps.googleapis.com",
                    "https://lh3.googleusercontent.com", // Google User Profile images
                    "https://www.gstatic.com"
                ],
                "style-src": [
                    "'self'", 
                    "'unsafe-inline'", 
                    "https://fonts.googleapis.com"
                ],
                "font-src": [
                    "'self'", 
                    "https://fonts.gstatic.com"
                ],
                "connect-src": [
                    "'self'", 
                    "https://maps.googleapis.com"
                ]
            }
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // 3. CORS Configuration
    const corsOptions = {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
        methods: ['GET', 'POST'],
        credentials: true
    };
    app.use(cors(corsOptions));
};

module.exports = configureSecurity;
