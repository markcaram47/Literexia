const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');
const { authenticateToken: auth, authorize } = require('../../middleware/auth');

// Get admin profile route - protected with auth middleware
router.get('/profile', auth, authorize('admin'), adminController.getAdminProfile);

module.exports = router; 