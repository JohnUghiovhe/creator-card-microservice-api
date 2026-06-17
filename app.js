const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { connectToCluster } = require('@app-core/mongoose');
const { appLogger } = require('@app-core/logger');

// Step 1: Define your endpoint folders for the framework to auto-load
const ENDPOINT_CONFIGS = [
  { path: './endpoints/creator-cards' }
];

const app = express();
const port = process.env.PORT || 3000;

// Apply basic framework middlewares
app.use(cors());
app.use(express.json());

// Step 2: Main application startup execution function
async function bootServer() {
  try {
    // Connect to the cluster via your core module
    const dbInstance = await connectToCluster();
    global.db = dbInstance;

    // Step 3: Core auto-loader engine loop
    // This loops over your config and registers all internal JS routing handlers
    for (const config of ENDPOINT_CONFIGS) {
      const fullPath = path.join(__dirname, config.path);
      
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        
        for (const file of files) {
          if (file.endsWith('.js')) {
            const endpointHandler = require(path.join(fullPath, file));
            
            // Build the runtime context helper objects for handlers
            const helpers = {
              http_statuses: require('@app-core/server').http_statuses
            };

            // Register the route directly onto the underlying express instance
            app[endpointHandler.method](endpointHandler.path, async (req, res) => {
              try {
                // Mock out request context parameter mapping profile
                const rc = {
                  body: req.body,
                  query: req.query,
                  params: req.params,
                  headers: req.headers,
                  meta: { db: global.db }
                };

                const result = await endpointHandler.handler(rc, helpers);
                return res.status(result.status || 200).json({
                  status: 'success',
                  message: result.message || undefined,
                  data: result.data
                });
              } catch (error) {
                // Centralized framework error catcher formatting rules
                appLogger.error({ error: error.message }, 'request-error');
                return res.status(error.code && error.code.startsWith('HTTP') ? 400 : 400).json({
                  status: 'error',
                  message: error.message || 'An unexpected failure occurred',
                  code: error.code || 'VALIDATIONERR'
                });
              }
            });
          }
        }
      }
    }

    // Step 4: Open standard server socket listener
    app.listen(port, () => {
      appLogger.info({ port }, 'application-server-boot-completed');
    });

  } catch (err) {
    appLogger.errorX(err, 'system-shutdown-trigger');
    process.exit(1);
  }
}

bootServer();

module.exports = {
  ENDPOINT_CONFIGS
};
