function errorHandler(err, req, res, next) {
  console.error('[CampusSync Server Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please contact system administrator.' 
      : message
  });
}

module.exports = errorHandler;
