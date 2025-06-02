const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/adminDashboardController');
const { authenticateToken: auth, authorize } = require('../../middleware/auth');

// Route to get dashboard statistics
router.get('/stats', auth, authorize('admin'), getDashboardStats);

module.exports = router; 