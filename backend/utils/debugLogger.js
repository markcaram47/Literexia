// utils/debugLogger.js
const debugLogger = {
    // Different log levels
    levels: {
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
      DEBUG: 'DEBUG'
    },
    
    // Log a message with timestamp and level
    log: (level, message, data = null) => {
      const timestamp = new Date().toISOString();
      const formattedMessage = `[${timestamp}] [${level}] ${message}`;
      
      switch (level) {
        case debugLogger.levels.ERROR:
          console.error(formattedMessage);
          if (data) console.error(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
          break;
        case debugLogger.levels.WARN:
          console.warn(formattedMessage);
          if (data) console.warn(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
          break;
        case debugLogger.levels.DEBUG:
          if (process.env.DEBUG_LEVEL === 'DEBUG') {
            console.log(`\x1b[36m${formattedMessage}\x1b[0m`); // Cyan color for debug
            if (data) console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
          }
          break;
        case debugLogger.levels.INFO:
        default:
          console.log(formattedMessage);
          if (data) console.log(typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
          break;
      }
    },
    
    // Shorthand methods for different log levels
    info: (message, data = null) => debugLogger.log(debugLogger.levels.INFO, message, data),
    warn: (message, data = null) => debugLogger.log(debugLogger.levels.WARN, message, data),
    error: (message, data = null) => debugLogger.log(debugLogger.levels.ERROR, message, data),
    debug: (message, data = null) => debugLogger.log(debugLogger.levels.DEBUG, message, data),
    
    // Log a route access
    routeAccess: (req) => {
      const method = req.method;
      const url = req.originalUrl || req.url;
      const userIP = req.ip || req.connection.remoteAddress;
      const userId = req.user ? req.user.id : 'unauthenticated';
      
      debugLogger.info(`Route access: ${method} ${url} | User: ${userId} | IP: ${userIP}`);
    },
    
    // Log database operations
    dbOperation: (operation, collection, filter = null, result = null) => {
      debugLogger.debug(`DB Operation: ${operation} on ${collection}`, { filter, result });
    }
  };
  
  module.exports = debugLogger;