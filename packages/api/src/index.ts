// Entry point for Railway deployment
// This file dynamically imports and starts the main server

async function startServer() {
  try {
    // Import the main server file
    await import('../../../server/_core/index.js');
    console.log('[Entry Point] Main server imported and started successfully');
  } catch (error) {
    console.error('[Entry Point] Failed to import main server:', error);
    process.exit(1);
  }
}

startServer();
