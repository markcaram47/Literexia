const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, authorize } = require('../../middleware/auth');
const preAssessmentController = require('../../controllers/Teachers/preAssessmentController');

// Configure multer for memory storage (for S3 uploads)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (increased from 10MB)
  }
});

// Pre-assessment routes
router.get('/assessments', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.getAllPreAssessments);
router.get('/assessments/:id', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.getPreAssessmentById);
router.post('/assessments', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.createPreAssessment);
router.put('/assessments/:id', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.updatePreAssessment);
router.delete('/assessments/:id', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.deletePreAssessment);
router.put('/assessments/:id/toggle-active', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.toggleActiveStatus);

// Question type routes
router.get('/question-types', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.getAllQuestionTypes);
router.post('/question-types', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.createQuestionType);
router.put('/question-types/:id', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.updateQuestionType);
router.delete('/question-types/:id', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.deleteQuestionType);

// Media upload routes
router.post('/upload-media', authenticateToken, authorize('teacher', 'guro'), upload.single('file'), preAssessmentController.uploadMedia);
router.delete('/delete-media/:fileKey', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.deleteMedia);

// Convert base64 images to S3 paths
router.post('/assessments/:id/convert-images', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.convertImagesToS3);

// Test route without authentication (for development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test/convert-images/:id', preAssessmentController.convertImagesToS3);
}

// Student results routes
router.get('/student-results/:id', authenticateToken, authorize('teacher', 'guro'), preAssessmentController.getPreAssessmentResults);

module.exports = router;