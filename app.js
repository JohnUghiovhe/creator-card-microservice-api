const { connectToCluster } = require('@app-core/mongoose/index.js');
const { appLogger } = require('@app-core/logger/index.js');

const ENDPOINT_CONFIGS = [
  { path: './endpoints/creator-cards' }
];

async function bootServer() {
  try {
    const dbInstance = await connectToCluster();
    global.db = dbInstance;

    appLogger.info({}, 'application-server-boot-completed');
  } catch (err) {
    appLogger.errorX(err, 'system-shutdown-trigger');
    process.exit(1);
  }
}

bootServer();

module.exports = {
  ENDPOINT_CONFIGS
};
