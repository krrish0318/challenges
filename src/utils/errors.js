/**
 * Unified Error Handling Utilities
 * Provides a standardized way to manage and report errors across the application.
 */

class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Async Wrapper
 * Removes the need for manual try-catch blocks in route handlers.
 * @param {Function} fn - Async express middleware function
 * @returns {Function}
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  catchAsync
};
