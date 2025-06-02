// routes/auth/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { authenticateToken } = require('../../middleware/auth');
const router = express.Router();

/**
 * Checks if a string is a valid bcrypt hash
 * @param {string} str - String to check
 * @returns {boolean} - True if valid bcrypt hash
 */
const isBcryptHash = (str) => {
  return typeof str === 'string' && /^\$2[abxy]\$\d+\$/.test(str);
};

/**
 * Normalizes role strings to handle variations
 * @param {string} role - Role to normalize
 * @returns {string} - Normalized role
 */
const normalizeRole = (role) => {
  if (!role) return '';
  
  const normalized = role.toLowerCase().trim();
  
  // Handle common variations
  switch (normalized) {
    case 'magulang':
    case 'parent':
      return 'parent';
    case 'guro':
    case 'teacher':
      return 'teacher';
    case 'admin':
    case 'administrator':
      return 'admin';
    default:
      return normalized;
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password, expectedRole } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email & password required' });
  }

  try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Login attempt for:', email);
    console.log('Expected role:', expectedRole);
    
    // Get databases and collections
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    const rolesCollection = usersDb.collection('roles');
    
    // Fetch user from users_web.users
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', user.email);
    
    // Verify password
    let isValidPassword = false;
    try {
      // Check for valid bcrypt hash in passwordHash field first
      if (user.passwordHash && typeof user.passwordHash === 'string' && 
          (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$'))) {
        isValidPassword = await bcrypt.compare(password, user.passwordHash);
      } 
      // Fall back to password field if it contains a valid bcrypt hash
      else if (user.password && typeof user.password === 'string' && 
               (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
        isValidPassword = await bcrypt.compare(password, user.password);
      }
    } catch (bcryptError) {
      console.error('Password verification error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error' });
    }

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user's roles by resolving role references
    let userRoles = [];
    if (user.roles) {
      // Convert role references to ObjectIds if they're strings
      const roleIds = Array.isArray(user.roles) ? 
        user.roles.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id) : 
        [typeof user.roles === 'string' ? new mongoose.Types.ObjectId(user.roles) : user.roles];

      console.log('Looking up roles with IDs:', roleIds);

      // Fetch role documents
      const roleDocs = await rolesCollection.find({
        _id: { $in: roleIds }
      }).toArray();

      console.log('Found role documents:', roleDocs);

      // Extract role names
      userRoles = roleDocs.map(role => role.name.toLowerCase());
    }

    console.log('Resolved user roles:', userRoles);

    // Check if user has the expected role
    const normalizedExpectedRole = normalizeRole(expectedRole);
    let isAuthorized = userRoles.includes(normalizedExpectedRole);
    let parentProfile = null;

    // If not authorized but trying to log in as parent, check parent profile
    if (!isAuthorized && normalizedExpectedRole === 'parent') {
      // Try different parent collections
      const parentDatabases = ['Literexia', 'parent'];
      const parentCollections = ['parent', 'parent_profile', 'profile'];

      for (const dbName of parentDatabases) {
        const db = mongoose.connection.useDb(dbName);
        for (const collName of parentCollections) {
          try {
            const collection = db.collection(collName);
            parentProfile = await collection.findOne({ 
              $or: [
                { email: email.toLowerCase() },
                { userId: user._id },
                { userId: user._id.toString() }
              ]
            });
            
            if (parentProfile) {
              console.log(`Found parent profile in ${dbName}.${collName}`);
              isAuthorized = true;
              break;
            }
          } catch (err) {
            console.log(`Error checking ${dbName}.${collName}:`, err.message);
          }
        }
        if (parentProfile) break;
      }

      // If still no profile found, create one in Literexia.parent
      if (!parentProfile) {
        try {
          const literexiaDb = mongoose.connection.useDb('Literexia');
          const parentCollection = literexiaDb.collection('parent');
          
          parentProfile = {
            userId: user._id,
            email: email.toLowerCase(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const result = await parentCollection.insertOne(parentProfile);
          parentProfile._id = result.insertedId;
          console.log('Created new parent profile:', result.insertedId);
          isAuthorized = true;
        } catch (err) {
          console.error('Error creating parent profile:', err);
        }
      }
    }

    if (!isAuthorized) {
      console.log('Role mismatch. Expected:', normalizedExpectedRole, 'Has:', userRoles);
      return res.status(403).json({ message: 'Not authorized for this resource' });
    }

    // Generate JWT token with verified roles and parent profile ID if applicable
    const tokenPayload = { 
      id: user._id.toString(),
      email: user.email,
      roles: userRoles
    };

    if (parentProfile) {
      tokenPayload.roles = ['parent'];
      tokenPayload.profileId = parentProfile._id.toString();
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for:', email);
    console.log('Roles assigned:', tokenPayload.roles);
    console.log('=== END LOGIN ===');

    return res.json({
      token,
      user: { 
        id: user._id.toString(), 
        email: user.email,
        roles: tokenPayload.roles,
        ...(parentProfile && { profileId: parentProfile._id.toString() })
      }
    });

  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

/**
 * @route   POST /api/auth/update-password
 * @desc    Update user password
 * @access  Private
 */
router.post('/update-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password does not meet complexity requirements',
        requirements: [
          'Minimum 8 characters',
          'At least one uppercase letter',
          'At least one lowercase letter',
          'At least one number',
          'At least one special character (!@#$%^&*)'
        ]
      });
    }
    
    // Get User model from users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    
    // Find the user using ID from token
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine which field has the password hash
    let passwordHash = null;
    
    if (user.passwordHash && isBcryptHash(user.passwordHash)) {
      passwordHash = user.passwordHash;
    } else if (user.password && isBcryptHash(user.password)) {
      passwordHash = user.password;
    } else {
      return res.status(500).json({ message: 'Account configuration error' });
    }
    
    // Verify current password
    let passwordIsValid = false;
    
    try {
      passwordIsValid = await bcrypt.compare(currentPassword, passwordHash);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error' });
    }
    
    if (!passwordIsValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12); // Using higher cost factor for better security
    
    // Update the password - always use passwordHash field for consistency
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to update password' });
    }
    
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
});

/**
 * @route   GET /api/auth/check-role
 * @desc    Debugging endpoint to check role resolution
 * @access  Public
 */
router.get('/check-role/:roleId', async (req, res) => {
  try {
    const roleId = req.params.roleId;
    
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID format' });
    }
    
    const usersDb = mongoose.connection.useDb('users_web');
    const rolesCollection = usersDb.collection('roles');
    
    const role = await rolesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(roleId) 
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    return res.json({
      roleId: roleId,
      roleName: role.name,
      description: role.description
    });
  } catch (error) {
    console.error('Error checking role:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Export the router
module.exports = router;