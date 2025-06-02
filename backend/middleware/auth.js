const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // Use the original secret key
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, secretKey);
    
    // Log the raw decoded token
    console.log('Raw decoded token:', decoded);
    
    // Ensure we have a standardized user object with more flexible role extraction
    req.user = {
      id: decoded.id || decoded._id || decoded.userId || 
          (decoded.user && (decoded.user.id || decoded.user._id)),
      email: decoded.email || (decoded.user && decoded.user.email),
      roles: extractRoles(decoded)
    };

    // Validate that we have the minimum required user information
    if (!req.user.id) {
      console.warn('Token missing required user ID');
      // Still allow the request if email is present
      if (!req.user.email) {
        throw new Error('Token missing required user email and ID');
      }
    }

    console.log('Authentication successful for user:', req.user.email || req.user.id);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Resolves a role ID to its name from the database
 * @param {string|Object} roleId - MongoDB ObjectId as string or object
 * @returns {Promise<string|null>} - Role name or null if not found
 */
const resolveRoleFromId = async (roleId) => {
  try {
    if (!roleId) return null;
    
    // Extract the ID string if it's an ObjectId object
    let idString;
    if (typeof roleId === 'object' && roleId.$oid) {
      idString = roleId.$oid;
    } else if (typeof roleId === 'object') {
      idString = String(roleId);
    } else {
      idString = roleId;
    }
    
    // Connect to roles collection
    const usersDb = mongoose.connection.useDb('users_web');
    const rolesCollection = usersDb.collection('roles');
    
    let roleObjId;
    try {
      roleObjId = new mongoose.Types.ObjectId(idString);
    } catch (err) {
      console.warn('Invalid ObjectId format for role:', idString);
      return null;
    }
    
    // Query the role
    const role = await rolesCollection.findOne({ _id: roleObjId });
    
    return role?.name || null;
  } catch (err) {
    console.error('Error resolving role from ID:', err);
    return null;
  }
};

// Helper function to extract roles from various token formats
const extractRoles = (decoded) => {
  let roles = [];
  
  // Try to get roles from various possible locations
  if (decoded.roles) {
    roles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];
  } else if (decoded.user && decoded.user.roles) {
    roles = Array.isArray(decoded.user.roles) ? decoded.user.roles : [decoded.user.roles];
  } else if (decoded.role) {
    roles = [decoded.role];
  } else if (decoded.userType) {
    roles = [decoded.userType];
  }
  
  // Convert to array if somehow we got a non-array
  if (!Array.isArray(roles)) {
    roles = [roles];
  }
  
  // Filter out any null/undefined values and convert to lowercase
  roles = roles
    .filter(role => role)
    .map(role => role.toLowerCase());
  
  // If we still have no roles, check the token for admin role
  if (roles.length === 0 && decoded.isAdmin) {
    roles = ['admin'];
  }
  
  console.log('Extracted roles:', roles);
  return roles;
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('Authorization check:', {
      user: req.user,
      allowedRoles,
      headers: req.headers
    });

    if (!req.user) {
      console.log('No user object in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Convert allowed roles to lowercase
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

    // Role mapping for Tagalog and variations
    const roleMap = {
      'guro': 'teacher',
      'magulang': 'parent',
      'admin': 'admin',
      'parent': 'parent',
      'teacher': 'teacher',
      'administrator': 'admin'
    };

    // Get user roles and normalize them
    const userRoles = (Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles])
      .map(role => role ? role.toLowerCase() : '')
      .filter(role => role); // Remove empty strings

    console.log('Checking roles:', {
      userRoles,
      allowedRoles: normalizedAllowedRoles
    });

    // Check if user has any of the allowed roles
    const hasRole = userRoles.some(role => {
      const normalizedRole = roleMap[role] || role;
      return normalizedAllowedRoles.includes(normalizedRole);
    });

    if (!hasRole) {
      console.log('Authorization failed:', {
        userRoles,
        allowedRoles: normalizedAllowedRoles
      });
      return res.status(403).json({
        message: 'Not authorized for this resource',
        userRoles,
        requiredRoles: normalizedAllowedRoles
      });
    }

    console.log('Authorization successful for user:', {
      userId: req.user.id,
      roles: userRoles
    });

    next();
  };
};

// IEP-specific authorization - Teachers can modify IEP reports
const authorizeIEPAccess = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
    const allowedRoles = ['teacher', 'guro', 'admin'];
    
    const hasPermission = userRoles.some(role => 
      allowedRoles.includes(role?.toLowerCase())
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'Not authorized to access IEP reports',
        userRoles,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

// Export both authenticateToken and auth (as the same function) for backward compatibility
module.exports = { 
  authenticateToken, 
  auth: authenticateToken, 
  authorize, 
  resolveRoleFromId,
  authorizeIEPAccess
};