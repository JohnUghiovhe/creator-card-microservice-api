const { MongoClient } = require('mongodb');
const { appLogger } = require('@app-core/logger');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/creator_db';
let dbInstance = null;

async function connectToCluster() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    appLogger.info({}, 'initializing-mongodb-connection-pool');
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    dbInstance = client.db();
    appLogger.info({}, 'mongodb-cluster-connection-established');
    return dbInstance;
  } catch (error) {
    appLogger.errorX({ message: error.message }, 'mongodb-pool-connection-failed');
    throw error;
  }
}

function getDatabaseConnection() {
  if (!dbInstance) {
    throw new Error('Database connection has not been initialized yet.');
  }
  return dbInstance;
}

module.exports = {
  connectToCluster,
  getDatabaseConnection
};
