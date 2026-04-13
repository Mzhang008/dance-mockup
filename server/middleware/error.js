const logger = require('../config/logger');

// Wraps async route handlers; forwards errors to error middleware
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  // Never leak internal error details in prod
  const isProd = process.env.NODE_ENV === 'production';
  const message =
    status >= 500 && isProd ? 'Internal server error' : err.message || 'Error';

  res.status(status).json({ error: message });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: 'Not found' });
};

module.exports = { asyncHandler, errorHandler, notFoundHandler };
