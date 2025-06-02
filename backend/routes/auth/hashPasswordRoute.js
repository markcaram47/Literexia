// routes/auth/hashPasswordRoute.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../../models/userModel');

// Route to hash a password and save it to a user
router.post('/hash-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Find the user by email
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user's password
      user.password = hashedPassword;
      await user.save();
      return res.json({ 
        message: 'Password updated successfully',
        hashedPassword,
        user: { id: user._id, email: user.email, roles: user.roles }
      });
    } else {
      // Create a new user if they don't exist
      user = new User({
        email,
        password: hashedPassword,
        roles: ['user'] // Default role
      });
      
      await user.save();
      return res.json({ 
        message: 'User created successfully',
        hashedPassword,
        user: { id: user._id, email: user.email, roles: user.roles }
      });
    }
  } catch (error) {
    console.error('Error hashing password:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to test a password against a hash
router.post('/test-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find the user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Test the password
    const isMatch = await bcrypt.compare(password, user.password);
    
    return res.json({ 
      isMatch,
      message: isMatch ? 'Password is valid' : 'Password is invalid',
      user: { id: user._id, email: user.email, roles: user.roles }
    });
  } catch (error) {
    console.error('Error testing password:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;