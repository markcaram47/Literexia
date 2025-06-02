// routes/auth/userRoutes.js
// Create this file if it doesn't exist

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../../middleware/auth');

// Get user by ID
router.get('/user/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Fetching user with ID: ${userId}`);
    
    // Connect to the users_web.users collection
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Try to find the user with the given ID
    let user = null;
    
    // First try with ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    }
    
    // If not found, try with string ID
    if (!user) {
      user = await usersCollection.findOne({ 
        $or: [
          { id: userId },
          { email: userId }
        ]
      });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data without password
    const userData = {
      id: user._id,
      email: user.email,
      roles: user.roles
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;