// routes/Teachers/progressRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const mongoose = require('mongoose');

// Helper function to get category controller
const getCategoryController = () => {
  try {
    return require('../../controllers/Teachers/ManageProgress/CategoryController');
  } catch (error) {
    console.error('Error loading category controller:', error);
    return {
      getAssessmentCategories: async (req, res) => {
        // Fallback implementation if controller not found
        try {
          const preAssessmentDb = mongoose.connection.useDb('Pre_Assessment');
          const categoriesCollection = preAssessmentDb.collection('assessment_categories');
          const categories = await categoriesCollection.find({}).toArray();
          res.json(categories || []);
        } catch (err) {
          res.status(500).json({ message: 'Error fetching categories', error: err.message });
        }
      },
      getReadingLevels: async (req, res) => {
        // Fallback implementation if controller not found
        try {
          const readingLevels = [
            { level: "A", description: "Beginner" },
            { level: "B", description: "Early Beginner" },
            { level: "C", description: "Developing" },
            { level: "D", description: "Early Fluent" },
            { level: "E", description: "Fluent" }
          ];
          res.json(readingLevels);
        } catch (err) {
          res.status(500).json({ message: 'Error fetching reading levels', error: err.message });
        }
      }
    };
  }
};

// Routes for categories and reading levels
router.get('/categories', auth, async (req, res) => {
  try {
    const categoryController = getCategoryController();
    await categoryController.getAssessmentCategories(req, res);
  } catch (error) {
    console.error('Error in categories route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/reading-levels', auth, async (req, res) => {
  try {
    const categoryController = getCategoryController();
    await categoryController.getReadingLevels(req, res);
  } catch (error) {
    console.error('Error in reading levels route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Main assessments route
router.get('/main-assessments', auth, async (req, res) => {
  try {
    const testDb = mongoose.connection.useDb('test');
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Get filters from query parameters
    const { categoryId, readingLevel } = req.query;
    
    // Build filter object
    const filter = {
      status: "active"
    };
    
    if (categoryId) {
      filter.categoryID = parseInt(categoryId);
    }
    
    if (readingLevel) {
      filter.targetReadingLevel = readingLevel;
    }
    
    // Execute query
    const mainAssessments = await mainAssessmentCollection.find(filter).toArray();
    
    res.json(mainAssessments || []);
  } catch (error) {
    console.error('Error fetching main assessments:', error);
    res.status(500).json({
      message: 'Error retrieving main assessments',
      error: error.message
    });
  }
});

// Add published assessments endpoint
router.get('/published-assessments', auth, async (req, res) => {
  try {
    const testDb = mongoose.connection.useDb('test');
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Build filter for published assessments
    const filter = {
      status: "active",
      isPublished: true
    };
    
    // Add query parameters if provided
    if (req.query.categoryId) {
      filter.categoryID = parseInt(req.query.categoryId);
    }
    
    if (req.query.readingLevel) {
      filter.targetReadingLevel = req.query.readingLevel;
    }
    
    // Execute query
    const assessments = await mainAssessmentCollection.find(filter).toArray();
    
    res.json(assessments || []);
  } catch (error) {
    console.error('Error fetching published assessments:', error);
    res.status(500).json({
      message: 'Error retrieving published assessments',
      error: error.message
    });
  }
});

module.exports = router;