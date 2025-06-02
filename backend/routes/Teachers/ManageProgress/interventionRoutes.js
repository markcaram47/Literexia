// routes/Teachers/ManageProgress/interventionRoutes.js
const express = require('express');
const router = express.Router();
const InterventionController = require('../../../controllers/Teachers/ManageProgress/interventionController');
const { auth, authorize } = require('../../../middleware/auth');
const mongoose = require('mongoose');

// Initialize controller
const interventionController = new InterventionController();

// Diagnostic route for troubleshooting (admin only)
router.get('/debug', auth, authorize('admin'), async (req, res) => {
  try {
    const { studentId, category } = req.query;
    const results = {};
    
    // Check MongoDB connection
    results.mongoConnected = mongoose.connection.readyState === 1;
    
    // List collections
    results.collections = await mongoose.connection.db.listCollections().toArray();
    results.collectionNames = results.collections.map(c => c.name);
    
    // If studentId provided, try to find by different methods
    if (studentId) {
      const User = require('../../../models/userModel');
      
      results.studentLookups = {
        byIdNumber: await User.findOne({ idNumber: studentId }).lean(),
        byObjectId: mongoose.Types.ObjectId.isValid(studentId) ? 
          await User.findById(studentId).lean() : null
      };
      
      if (results.studentLookups.byIdNumber) {
        results.studentLookups.studentObjectId = results.studentLookups.byIdNumber._id;
      }
      
      // Check prescriptive analysis
      if (category) {
        const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
        
        // Try different ways to find prescriptive analysis
        results.prescriptiveAnalysis = {
          byIdNumber: await PrescriptiveAnalysis.findOne({ 
            studentIdNumber: studentId,
            categoryId: category
          }).lean(),
          byObjectId: results.studentLookups.studentObjectId ? 
            await PrescriptiveAnalysis.findOne({
              studentId: results.studentLookups.studentObjectId,
              categoryId: category
            }).lean() : null
        };
        
        // Check category results
        const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
        
        try {
          results.categoryResults = {
            byIdNumber: await mongoose.connection.db
              .collection('category_results')
              .findOne({
                studentId: studentId,
                "categories.categoryName": { $regex: new RegExp(normalizedCategory, 'i') }
              }),
            byNumericId: await mongoose.connection.db
              .collection('category_results')
              .findOne({
                studentId: parseInt(studentId),
                "categories.categoryName": { $regex: new RegExp(normalizedCategory, 'i') }
              }),
            byObjectId: results.studentLookups.studentObjectId ? 
              await mongoose.connection.db
                .collection('category_results')
                .findOne({
                  studentId: results.studentLookups.studentObjectId.toString(),
                  "categories.categoryName": { $regex: new RegExp(normalizedCategory, 'i') }
                }) : null
          };
        } catch (err) {
          results.categoryResultsError = err.message;
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running diagnostics',
      error: error.message
    });
  }
});

// API endpoints with specific paths (these must come before parameterized routes)
// Get main assessment questions
router.get('/questions/main', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getMainAssessmentQuestions(req, res);
      // Controller handles the response, so we don't need to return anything here
    } catch (error) {
      console.error('Error in GET /questions/main route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get template questions
router.get('/templates/questions', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getTemplateQuestions(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /templates/questions route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Update a template question
router.put('/templates/questions/:templateId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.updateTemplateQuestion(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in PUT /templates/questions/:templateId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Delete a template question
router.delete('/templates/questions/:templateId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.deleteTemplateQuestion(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in DELETE /templates/questions/:templateId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get template choices
router.get('/templates/choices', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getTemplateChoices(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /templates/choices route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Update a template choice
router.put('/templates/choices/:templateId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.updateTemplateChoice(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in PUT /templates/choices/:templateId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Delete a template choice
router.delete('/templates/choices/:templateId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.deleteTemplateChoice(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in DELETE /templates/choices/:templateId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get sentence templates
router.get('/templates/sentences', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getSentenceTemplates(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /templates/sentences route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a sentence template
router.post('/templates/sentences', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.createSentenceTemplate(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /templates/sentences route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Update a sentence template
router.put('/templates/sentences/:templateId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.updateSentenceTemplate(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in PUT /templates/sentences/:templateId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Delete a sentence template
router.delete('/templates/sentences/:templateId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.deleteSentenceTemplate(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in DELETE /templates/sentences/:templateId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a new template question
router.post('/templates/questions', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.createTemplateQuestion(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /templates/questions route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a new template choice
router.post('/templates/choices', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.createTemplateChoice(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /templates/choices route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Fetch all templates from the database
router.get('/templates/all', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getAllTemplates(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /templates/all route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Check if an intervention exists for a student and category
router.get('/check', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.checkExistingIntervention(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /check route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get all interventions for a student
router.get('/student/:studentId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getStudentInterventions(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /student/:studentId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get a pre-signed URL for S3 uploads
router.post('/upload-url', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getUploadUrl(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /upload-url route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Record a response to an intervention question
router.post('/responses', auth, authorize('teacher', 'admin', 'student'), 
  async (req, res) => {
    try {
      await interventionController.recordResponse(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /responses route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Parameterized routes (these must come after specific routes)
// Get an intervention by ID
router.get('/:interventionId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.getInterventionById(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in GET /:interventionId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a new intervention
router.post('/', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.createIntervention(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST / route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Update an existing intervention
router.put('/:interventionId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.updateIntervention(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in PUT /:interventionId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Delete an intervention
router.delete('/:interventionId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.deleteIntervention(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in DELETE /:interventionId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Push an intervention to mobile
router.post('/:interventionId/push', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.pushToMobile(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /:interventionId/push route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Activate an intervention by setting its status to 'active'
router.put('/:interventionId/activate', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      await interventionController.activateIntervention(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in PUT /:interventionId/activate route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing activation request',
        error: error.message
      });
    }
  }
);

// Update all existing interventions (admin only)
router.post('/update-existing', auth, authorize('admin'), 
  async (req, res) => {
    try {
      const result = await interventionController.updateExistingInterventions(req, res);
      // Controller handles the response
    } catch (error) {
      console.error('Error in POST /update-existing route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing update request',
        error: error.message
      });
    }
  }
);

module.exports = router;