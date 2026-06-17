const appLogger = {
    info(data, key) {
      console.log(JSON.stringify({ level: 'INFO', timestamp: Date.now(), key, data }));
    },
    warn(data, key) {
      console.log(JSON.stringify({ level: 'WARN', timestamp: Date.now(), key, data }));
    },
    error(data, key) {
      console.log(JSON.stringify({ level: 'ERROR', timestamp: Date.now(), key, data }));
    },
    errorX(error, key) {
      console.log(JSON.stringify({ 
        level: 'CRITICAL', 
        timestamp: Date.now(), 
        key, 
        error: error.message || error,
        stack: error.stack 
      }));
    }
  };
  
  module.exports = {
    appLogger
  };
  