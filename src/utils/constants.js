/**
 * VenueCrowd Constants
 * Centralized configuration and magic strings to ensure consistency across the application.
 */

module.exports = {
  DENSITY_STATUS: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High'
  },
  
  QUEUE_STATUS: {
    LOW: 'Low',
    MODERATE: 'Moderate',
    HEAVY: 'Heavy'
  },

  NETWORK: {
    DEFAULT_WEIGHT: 1,
    PENALTY_THRESHOLD: 70,
    MAX_COST: 1000
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    TOO_MANY_REQUESTS: 429
  },

  SYSTEM: {
    VERSION: '2.1.1',
    SERVICE_NAME: 'venue-optimization-engine'
  }
};
