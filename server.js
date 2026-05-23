const app = require('./app');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log('=============================================');
  console.log(`CareSync Backend Server Started Successfully`);
  console.log(`Port:        ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Time:        ${new Date().toISOString()}`);
  console.log('=============================================');
  console.log('API routes mounted:');
  console.log(`- Health Check: http://localhost:${PORT}/api/health`);
  console.log(`- DB Status:    http://localhost:${PORT}/api/dummy/status`);
  console.log(`- Dummy Items:  http://localhost:${PORT}/api/dummy/items`);
  console.log(`- Auth Demo:    http://localhost:${PORT}/api/dummy/auth-demo`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
