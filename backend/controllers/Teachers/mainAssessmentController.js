const mongoose = require('mongoose');
const MainAssessment = require('../../models/Teachers/mainAssessmentModel');

// Helper to get the main_assessment collection
const getMainAssessmentCollection = () => {
  const testDb = mongoose.connection.useDb('test');
  return testDb.collection('main_assessment');
};

/**
 * Get all assessments with pagination and filtering
 */
exports.getAllAssessments = async (req, res) => {
  try {
    const { page = 1, limit = 10, readingLevel, category, status } = req.query;
    
    // Build filter object
    const filter = {};
    if (readingLevel) filter.readingLevel = readingLevel;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Execute query with pagination
    const assessments = await mainAssessmentCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();
    
    // Get total count for pagination
    const total = await mainAssessmentCollection.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      data: assessments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving assessments',
      error: error.message
    });
  }
};

/**
 * Get assessment by ID
 */
exports.getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find assessment by ID
    const assessment = await mainAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error getting assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving assessment',
      error: error.message
    });
  }
};

/**
 * Get filtered assessments by reading level and category
 */
exports.getFilteredAssessments = async (req, res) => {
  try {
    const { readingLevel, category, active } = req.query;
    
    if (!readingLevel && !category) {
      return res.status(400).json({
        success: false,
        message: 'At least one filter parameter is required'
      });
    }
    
    // Build filter object
    const filter = {};
    if (readingLevel) filter.readingLevel = readingLevel;
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';
    filter.status = 'active'; // Only return active assessments
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Execute query
    const assessments = await mainAssessmentCollection
      .find(filter)
      .toArray();
    
    return res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    console.error('Error getting filtered assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving filtered assessments',
      error: error.message
    });
  }
};

/**
 * Create a new assessment
 */
exports.createAssessment = async (req, res) => {
  try {
    console.log('[CREATE ASSESSMENT] Request received:', JSON.stringify(req.body, null, 2));
    console.log('[CREATE ASSESSMENT] User:', req.user);
    
    const assessmentData = req.body;
    
    // Validate using Mongoose model
    try {
      console.log('[CREATE ASSESSMENT] Validating assessment data with Mongoose');
      const mainAssessment = new MainAssessment(assessmentData);
      await mainAssessment.validate();
    } catch (validationError) {
      console.error('[CREATE ASSESSMENT] Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validationError.message
      });
    }
    
    // Get main_assessment collection
    console.log('[CREATE ASSESSMENT] Getting collection');
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Check if assessment for this reading level and category already exists
    console.log('[CREATE ASSESSMENT] Checking for existing assessment');
    const existing = await mainAssessmentCollection.findOne({
      readingLevel: assessmentData.readingLevel,
      category: assessmentData.category
    });
    
    if (existing) {
      console.log('[CREATE ASSESSMENT] Found existing assessment:', existing._id);
      return res.status(400).json({
        success: false,
        message: 'An assessment for this reading level and category already exists'
      });
    }
    
    // Ensure each question has a proper questionId based on category
    console.log('[CREATE ASSESSMENT] Processing questions');
    const categoryPrefix = getCategoryPrefix(assessmentData.category);
    assessmentData.questions.forEach((question, index) => {
      // Format: AK_001, PA_002, etc.
      const questionNumber = String(index + 1).padStart(3, '0');
      question.questionId = `${categoryPrefix}_${questionNumber}`;
      
      // Ensure order is set
      question.order = index + 1;
    });
    
    // Set timestamps
    assessmentData.createdAt = new Date();
    assessmentData.updatedAt = new Date();
    
    // Insert into collection
    console.log('[CREATE ASSESSMENT] Inserting into database');
    const result = await mainAssessmentCollection.insertOne(assessmentData);
    
    console.log('[CREATE ASSESSMENT] Success. Inserted ID:', result.insertedId);
    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: {
        _id: result.insertedId,
        ...assessmentData
      }
    });
  } catch (error) {
    console.error('[CREATE ASSESSMENT] Error:', error);
    console.error('[CREATE ASSESSMENT] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error creating assessment',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Update an existing assessment
 */
exports.updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Cannot update readingLevel and category
    if (updateData.readingLevel || updateData.category) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update reading level or category of an existing assessment'
      });
    }
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find the existing assessment
    const existing = await mainAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // If questions are being updated, ensure proper questionIds
    if (updateData.questions) {
      const categoryPrefix = getCategoryPrefix(existing.category);
      updateData.questions.forEach((question, index) => {
        // Format: AK_001, PA_002, etc.
        const questionNumber = String(index + 1).padStart(3, '0');
        question.questionId = `${categoryPrefix}_${questionNumber}`;
        
        // Ensure order is set
        question.order = index + 1;
      });
    }
    
    // Update timestamps
    updateData.updatedAt = new Date();
    
    // Update in collection
    const result = await mainAssessmentCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Get updated assessment
    const updated = await mainAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating assessment',
      error: error.message
    });
  }
};

/**
 * Delete an assessment
 */
exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find and delete assessment
    const result = await mainAssessmentCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting assessment',
      error: error.message
    });
  }
};

/**
 * Toggle assessment status (active/inactive)
 */
exports.toggleAssessmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'draft', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, draft, or inactive'
      });
    }
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Update status
    const result = await mainAssessmentCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          status,
          isActive: status === 'active',
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Assessment status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating assessment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating assessment status',
      error: error.message
    });
  }
};

/**
 * Helper function to get category prefix
 */
function getCategoryPrefix(category) {
  const prefixMap = {
    'Alphabet Knowledge': 'AK',
    'Phonological Awareness': 'PA',
    'Decoding': 'DC',
    'Word Recognition': 'WR',
    'Reading Comprehension': 'RC'
  };
  
  return prefixMap[category];
} 