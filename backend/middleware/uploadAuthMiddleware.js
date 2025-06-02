// A simplified authentication middleware specifically for upload routes
const jwt = require('jsonwebtoken');

// Authentication middleware with more flexible token handling
const uploadAuthMiddleware = (req, res, next) => {
  console.log('[uploadAuthMiddleware] Processing request');
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    console.log('[uploadAuthMiddleware] No Authorization header found');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  if (!token) {
    console.log('[uploadAuthMiddleware] No token extracted from Authorization header');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    console.log('[uploadAuthMiddleware] Verifying token');
    
    // Use original secret key format
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secretKey);
    
    // Very flexible approach to creating user object from token
    req.user = {
      ...decoded,
      // Ensure we have at least these properties
      id: decoded.id || decoded._id || decoded.userId || 'anonymous',
      email: decoded.email || 'anonymous@example.com',
      roles: Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles || 'user']
    };

    console.log('[uploadAuthMiddleware] Successfully authenticated user:', req.user.email);
    console.log('[uploadAuthMiddleware] User roles:', req.user.roles);
    
    next();
  } catch (error) {
    console.error('[uploadAuthMiddleware] Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = uploadAuthMiddleware; 