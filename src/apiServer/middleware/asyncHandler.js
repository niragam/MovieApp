// Forwards rejected promises from async route handlers to the Express error handler.
const asyncHandler = handler => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
