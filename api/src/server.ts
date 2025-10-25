import { createApp } from './app';
import { testConnection } from './db/connection';

// Create Express app
const app = createApp();
const PORT = process.env.PORT || 3000;

// Start server
async function startServer(): Promise<void> {
  try {
    // Test database connection
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to database. Please check your DATABASE_URL');
      process.exit(1);
    }

    // Start listening
    const server = app.listen(PORT, () => {
      console.info(`
========================================
🚀 Trial Issues API Server
========================================
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  API Base URL: http://localhost:${PORT}/api/v1
  Health Check: http://localhost:${PORT}/health
  
  Available Endpoints:
  - GET    /api/v1/issues
  - GET    /api/v1/issues/:id
  - POST   /api/v1/issues
  - PUT    /api/v1/issues/:id
  - DELETE /api/v1/issues/:id
  - PATCH  /api/v1/issues/:id/resolve
  - GET    /api/v1/dashboard
  - POST   /api/v1/import/csv
========================================
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.info('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
void startServer();
