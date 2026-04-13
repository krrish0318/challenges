const express = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const venueController = require('../controllers/venueController');
const { AppError } = require('../utils/errors');
const { HTTP_STATUS } = require('../utils/constants');

const router = express.Router();

// Security: Rate Limit for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});

// Middleware for validation error handling
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ errors: errors.array() });
  }
  next();
};

/**
 * 1. Crowd Status API
 */
router.get('/crowd', apiLimiter, venueController.getCrowdStatus);

/**
 * 2. Queue Prediction API
 */
router.get('/queue', apiLimiter, venueController.getQueuePrediction);

/**
 * 3. Smart Route Suggestion API
 */
router.get('/route', 
  apiLimiter,
  query('from').isString().notEmpty().escape(),
  query('to').isString().notEmpty().escape(),
  validate,
  venueController.getSmartRoute
);

/**
 * 4. Google Assistant AI
 */
router.get('/assistant',
  apiLimiter,
  query('q').isString().notEmpty().escape(),
  validate,
  venueController.askAssistant
);

/**
 * 5. Alert Simulation API
 */
router.get('/alert', apiLimiter, venueController.triggerAlert);

/**
 * 6. Admin Functionality: Density Update
 */
router.post('/admin/density',
  apiLimiter,
  body('zoneId').isString().notEmpty().escape(),
  body('density').isNumeric().isInt({ min: 0, max: 100 }),
  validate,
  venueController.updateDensity
);

module.exports = router;
