// routes/auth/rolesRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * @route   GET /api/roles
 * @desc    Get all available roles for client use 
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Connect to the users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    
    // Get the roles collection
    const rolesCollection = usersDb.collection('roles');
    
    // Fetch all roles
    const roles = await rolesCollection.find({}).toArray();
    
    console.log('Found roles:', roles.length);
    
    // Map roles to a safe format without sensitive info
    const safeRoles = roles.map(role => ({
      id: role._id.toString(),
      name: role.name,
      description: role.description,
      // Add display names for UI in Tagalog
      displayName: 
        role.name === 'teacher' ? 'Guro' :
        role.name === 'parent' ? 'Magulang' :
        role.name === 'admin' ? 'Admin' :
        role.name // Default to the role name if no mapping exists
    }));
    
    console.log('Returning roles:', safeRoles);
    
    // Return the roles array
    return res.json(safeRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const roleId = req.params.id;
    
    console.log('Looking up role by ID:', roleId);
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res.status(400).json({ message: 'Invalid role ID format' });
    }
    
    // Connect to the users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    
    // Get the roles collection
    const rolesCollection = usersDb.collection('roles');
    
    // Find the role by ID
    const role = await rolesCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(roleId) 
    });
    
    // If role not found
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    console.log('Found role:', role);
    
    // Return the role without sensitive data
    return res.json({
      id: role._id.toString(),
      name: role.name,
      description: role.description,
      // Add display name for UI
      displayName: 
        role.name === 'teacher' ? 'Guro' :
        role.name === 'parent' ? 'Magulang' :
        role.name === 'admin' ? 'Admin' :
        role.name
    });
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;