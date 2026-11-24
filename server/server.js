const app = require('./app');
const { initClaimExpirationJob } = require('./jobs/claimExpirationJob');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  CampusSync Backend Server is RUNNING`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);

  // Initialize automated background task for claim expirations (checks every 30s)
  initClaimExpirationJob(30000);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
