/**
 * Centralized Express Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[CENTRALIZED SERVER ERROR]:', err);

  // Set appropriate status code (default to 500)
  const statusCode = err.status || err.statusCode || 500;
  
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
