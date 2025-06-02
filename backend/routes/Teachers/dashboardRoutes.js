// routes/Teachers/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/Teachers/dashboardController');
const studentController = require('../../controllers/Teachers/studentController');
const { auth, authorize } = require('../../middleware/auth');

// Dashboard main data endpoint - authorized for teachers and admins
router.get('/data', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.getDashboardData(req, res);
});

// Get metrics for dashboard
router.get('/metrics', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.getMetrics(req, res);
});

// Get reading level distribution
router.get('/reading-level-distribution', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.getReadingLevelDistribution(req, res);
});

// Get students needing attention
router.get('/students-needing-attention', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.getStudentsNeedingAttention(req, res);
});

// Update activity/intervention status
router.put('/update-activity/:id', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.updateActivity(req, res);
});

// Get students by section
router.get('/by-section/:section', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.getStudentsBySection(req, res);
});

// Get parent profile
router.get('/parent/:parentId', auth, authorize('teacher', 'admin'), (req, res) => {
  dashboardController.getParentProfile(req, res);
});

// NEW ENDPOINTS FOR FILTERS - Using the same controller methods as student routes
// These endpoints mirror the ones in studentRoutes.js to prevent 404 errors
router.get('/grade-levels', auth, authorize('teacher', 'admin'), studentController.getGradeLevels);
router.get('/sections', auth, authorize('teacher', 'admin'), studentController.getSections);
router.get('/reading-levels', auth, authorize('teacher', 'admin'), studentController.getReadingLevels);

module.exports = router;