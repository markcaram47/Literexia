// routes/Teachers/assessmentRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');

// Import controllers - make sure these paths match your actual file structure
const assignmentController = require('../../controllers/Teachers/ManageProgress/assessmentAssignmentController');
const responseController = require('../../controllers/Teachers/ManageProgress/assessmentResponseController');
const mainController = require('../../controllers/Teachers/ManageProgress/mainAssessmentController');
const categoryController = require('../../controllers/Teachers/ManageProgress/categoryProgressController');
// const readingLevelController = require('../../controllers/Teachers/ManageProgress/readingLevelProgressionController');

// Assessment assignment routes
router.post('/assign-categories', auth, authorize('teacher', 'guro'), assignmentController.assignCategories);
router.get('/assessment-assignments/:id', auth, assignmentController.getAssignments);
router.get('/student-analytics/:id', auth, authorize('teacher', 'guro'), assignmentController.getStudentAnalytics);
router.put('/assignment/:id/status', auth, authorize('teacher', 'guro'), assignmentController.updateAssignmentStatus);

// Assessment response routes
router.get('/assessment-responses/:id', auth, authorize('teacher', 'guro'), responseController.getResponses);
router.post('/assessment-responses/submit', auth, responseController.submitResponse);
router.post('/assessment-responses/start', auth, responseController.startAssessment);
router.post('/assessment-responses/:id/feedback', auth, authorize('teacher', 'guro'), responseController.provideFeedback);

// Main assessment routes
router.get('/main-assessments', auth, authorize('teacher', 'guro'), mainController.getAllAssessments);
router.get('/main-assessment/:id', auth, authorize('teacher', 'guro'), mainController.getAssessmentById);
router.get('/main-assessments/filter', auth, authorize('teacher', 'guro'), mainController.getFilteredAssessments);
router.post('/main-assessments', auth, authorize('teacher', 'guro'), mainController.createAssessment);
router.put('/main-assessment/:id', auth, authorize('teacher', 'guro'), mainController.updateAssessment);
router.delete('/main-assessment/:id', auth, authorize('teacher', 'guro'), mainController.deleteAssessment);

// Category progress routes
router.get('/category-progress/:id', auth, categoryController.getCategoryProgress);

// Reading level routes
// router.get('/reading-level/:id', auth, authorize('teacher', 'guro'), readingLevelController.getProgression);
// router.put('/reading-level/:id', auth, authorize('teacher', 'guro'), readingLevelController.updateReadingLevel);

module.exports = router;