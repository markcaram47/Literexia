// routes/auth/debugRoute.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/userModel');

// Route to list all collections in the database
router.get('/collections', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    return res.json({
      success: true,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    console.error('Error listing collections:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to list all users (ONLY FOR DEVELOPMENT - remove in production)
router.get('/users', async (req, res) => {
  try {
    // Log which collection the User model is pointing to
    console.log('User model collection:', User.collection.name);
    
    // Get all users
    const users = await User.find({}, { password: 0 }); // Exclude passwords
    
    return res.json({
      success: true,
      count: users.length,
      modelCollection: User.collection.name,
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        roles: u.roles,
        hasPassword: !!u.password
      }))
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to check a specific user
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found',
        email
      });
    }
    
    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        roles: user.roles,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0
      }
    });
  } catch (error) {
    console.error('Error checking user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;