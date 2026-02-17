// Root entry point for Railway deployment
console.log('[ROOT INDEX] Starting import of main server...');

// Dynamic import to ensure the module is loaded and executed
import('./server/_core/index.js')
  .then(() => {
    console.log('[ROOT INDEX] Main server imported successfully');
  })
  .catch((error) => {
    console.error('[ROOT INDEX] Failed to import main server:', error);
    process.exit(1);
  });
