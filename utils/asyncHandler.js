/**
 * Async handler to wrap API routes, allowing for async/await syntax without
 * try-catch blocks in every controller.
 * Errors are automatically passed to the error handling middleware.
 * 
 * @param {Function} fn - The async route handler function
 * @returns {Function} - A wrapped Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
