// routes/Teachers/studentRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');
const studentController = require('../../controllers/Teachers/studentController');

// Create the pre-assessment controller
const preAssessmentController = require('../../controllers/Teachers/preAssessmentController');

// Get all students
router.get('/students', auth, authorize('teacher', 'admin'), studentController.getStudents);

// STATIC ROUTES should come before dynamic routes with path parameters
// NEW ENDPOINTS FOR FILTERS
router.get('/grade-levels', auth, authorize('teacher', 'admin'), studentController.getGradeLevels);
router.get('/sections', auth, authorize('teacher', 'admin'), studentController.getSections);
router.get('/reading-levels', auth, authorize('teacher', 'admin'), studentController.getReadingLevels);

// Helper function to build a query for finding student documents by ID
function buildStudentQuery(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { userId: new mongoose.Types.ObjectId(id) };
  }
  
  // Try numeric ID if not valid ObjectId
  const studentIdNum = parseInt(id);
  if (!isNaN(studentIdNum)) {
    return { userId: studentIdNum };
  }
  
  // Fallback to using the string directly
  return { userId: id };
}

/**
 * GET /api/student/category-progress/:id
 * Returns the category_progress document for a student
 */
router.get('/category-progress/:id', auth, async (req, res) => {
  try {
    const testDb   = mongoose.connection.useDb('test');
    const progress = testDb.collection('category_progress');

    const doc = await progress.findOne(buildStudentQuery(req.params.id));

    if (!doc) return res.status(404).json({ message: 'Category progress not found' });
    res.json(doc);
  } catch (err) {
    console.error('Error fetching category-progress:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DYNAMIC ROUTES with path parameters
// Get student by ID
router.get('/:id', auth, authorize('teacher', 'admin'), studentController.getStudentById);

// Get assessment results
router.get('/:id/assessment', auth, authorize('teacher', 'admin'), studentController.getAssessmentResults);

// Get student progress
router.get('/:id/progress', auth, authorize('teacher', 'admin'), studentController.getProgressData);

// Get recommended lessons
router.get('/:id/recommended-lessons', auth, authorize('teacher', 'admin'), studentController.getRecommendedLessons);

// Get prescriptive recommendations
router.get('/:id/prescriptive-recommendations', auth, authorize('teacher', 'admin'), studentController.getPrescriptiveRecommendations);

// Update student address
router.patch('/:id/address', auth, authorize('teacher', 'admin'), studentController.updateStudentAddress);

// Link parent to student
router.post('/:id/link-parent', auth, authorize('teacher', 'admin'), studentController.linkParentToStudent);

router.get('/:id/parent-info', auth, authorize('teacher', 'admin'), studentController.getParentInfo);

// Get category results for a student (Manage Progress Post Assessment)
router.get('/:id/category-results', auth, authorize('teacher', 'admin'), studentController.getCategoryResults);

// Get reading level progress data for a student
router.get('/:id/reading-level-progress', auth, authorize('teacher', 'admin'), studentController.getReadingLevelProgress);

// NEW PRE-ASSESSMENT ROUTES
router.get('/:id/pre-assessment-results', auth, authorize('teacher', 'admin'), preAssessmentController.getPreAssessmentResults);
router.get('/:id/pre-assessment-status', auth, authorize('teacher', 'admin'), preAssessmentController.getStudentPreAssessmentStatus);

module.exports = router;