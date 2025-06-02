const express = require('express');
const router = express.Router();
const progressController = require('../../../controllers/Teachers/ManageProgress/progressController');
const { auth, authorize } = require('../../../middleware/auth');

router.use(auth);

// Progress summary for all students
// GET /api/progress/summary
router.get('/summary', authorize('teacher', 'admin'), progressController.getProgressSummary);

// Get detailed assessment results for a specific student
// GET /api/progress/student/:studentId/assessments
router.get('/student/:studentId/assessments', authorize('teacher', 'admin', 'parent'), progressController.getStudentAssessmentDetails);

// Get detailed response data for a specific assessment
// GET /api/progress/assessment/:assessmentId/responses
router.get('/assessment/:assessmentId/responses', authorize('teacher', 'admin', 'parent'), progressController.getAssessmentResponses);

// Create a new prescriptive analysis
// POST /api/progress/prescriptive-analysis
router.post('/prescriptive-analysis', authorize('teacher', 'admin'), progressController.createPrescriptiveAnalysis);

// Update an existing prescriptive analysis
// PUT /api/progress/prescriptive-analysis/:analysisId
router.put('/prescriptive-analysis/:analysisId', authorize('teacher', 'admin'), progressController.updatePrescriptiveAnalysis);

// Create a new intervention plan
// POST /api/progress/interventions
router.post('/interventions', authorize('teacher', 'admin'), progressController.createInterventionPlan);

// Get all intervention plans for a student
// GET /api/progress/student/:studentId/interventions
router.get('/student/:studentId/interventions', authorize('teacher', 'admin', 'parent'), progressController.getStudentInterventions);

// Get details of a specific intervention plan
// GET /api/progress/interventions/:interventionId
router.get('/interventions/:interventionId', authorize('teacher', 'admin', 'parent'), progressController.getInterventionDetails);

// Update intervention progress
// PUT /api/progress/interventions/:interventionId/progress
router.put('/interventions/:interventionId/progress', authorize('teacher', 'admin'), progressController.updateInterventionProgress);

module.exports = router;