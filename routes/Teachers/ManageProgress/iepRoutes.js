const express = require('express');
const router = express.Router();
const IEPController = require('../../../controllers/Teachers/ManageProgress/iepController');
const { authenticateToken } = require('../../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log(`[iepRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// Add route for refreshing intervention data
router.put('/student/:studentId/refresh-interventions', IEPController.refreshInterventionData);

// Get IEP report for a specific student
router.get('/student/:studentId', IEPController.getIEPReport);

// Get multiple IEP reports (for class view)
router.get('/class', IEPController.getClassIEPReports);

// Update support level for a specific objective using old method (backward compatibility)
router.put('/student/:studentId/objective/:objectiveId/support-level', IEPController.updateSupportLevel);

// Update remarks for a specific objective
router.put('/student/:studentId/objective/:objectiveId/remarks', IEPController.updateRemarks);

// Bulk update multiple objectives for a student
router.put('/student/:studentId/bulk-update', IEPController.bulkUpdateObjectives);

// New route for updating objective support level - changed to PUT to match frontend
router.put('/objective/:objectiveId/support-level', IEPController.updateObjectiveSupportLevel);

// Send progress report to parent
router.post('/student/:studentId/send-report', (req, res, next) => {
  console.log(`[iepRoutes] Processing send-report request for student ${req.params.studentId}`);
  console.log(`[iepRoutes] Request body keys: ${Object.keys(req.body).join(', ')}`);
  next();
}, IEPController.sendReportToParent);

// Get previous PDF reports for a student
router.get('/student/:studentId/reports', IEPController.getPreviousPdfReports);

module.exports = router; 