/**
 * Environment Configuration Validator
 * Ensures all required environment variables are present before the application starts.
 */

const requiredVars = [
  'PORT'
];

// Optional but recommended for full functionality
const recommendedVars = [
  'GEMINI_API_KEY',
  'GOOGLE_CALENDAR_ID'
];

const validateConfig = () => {
    const missing = requiredVars.filter(v => !process.env[v]);
    
    if (missing.length > 0) {
        console.error(`\n❌ ERROR: Missing required environment variables: ${missing.join(', ')}`);
        console.error(`Check your .env file or deployment environment.\n`);
        process.exit(1);
    }

    const unconfigured = recommendedVars.filter(v => !process.env[v]);
    if (unconfigured.length > 0) {
        console.warn(`\n⚠️  WARNING: Some non-critical variables are missing: ${unconfigured.join(', ')}`);
        console.warn(`Features relying on these (e.g. Gemini, Calendar) will run in simulation mode.\n`);
    }
};

module.exports = validateConfig;
