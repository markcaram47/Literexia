// authMiddleware.js - Simple authentication middleware
const { authenticateToken } = require('./auth');

// Export authenticateToken directly to maintain compatibility with routes using this module
module.exports = authenticateToken; 