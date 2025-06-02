const express = require('express');
const router = express.Router();
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const { authenticateToken, authorize } = require('../../../middleware/auth');
const mongoose = require('mongoose');

/**
 * @route GET /api/prescriptive-analysis
 * @desc Get prescriptive analysis for a student and category
 * @access Private (Teachers only)
 */
router.get('/', authenticateToken, authorize('teacher'), async (req, res) => {
  try {
    const { studentId, category } = req.query;
    
    if (!studentId || !category) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and category are required'
      });
    }
    
    // Convert studentId to ObjectId if needed
    let studentObjectId;
    try {
      studentObjectId = new mongoose.Types.ObjectId(studentId);
    } catch (error) {
      console.error('Invalid student ID format:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid student ID format'
      });
    }
    
    // Format category to match database format (spaces, capitalization)
    const formattedCategory = category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    console.log(`Looking for prescriptive analysis for student ${studentId} and category ${formattedCategory}`);
    
    // Find prescriptive analysis matching student ID and category
    const analysis = await PrescriptiveAnalysis.findOne({
      studentId: studentObjectId,
      categoryId: formattedCategory
    });
    
    if (!analysis) {
      console.log(`No prescriptive analysis found for student ${studentId} and category ${formattedCategory}`);
      return res.status(404).json({
        success: false,
        message: 'No prescriptive analysis found for this student and category'
      });
    }
    
    console.log(`Found prescriptive analysis: ${analysis._id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Prescriptive analysis found',
      data: analysis
    });
  } catch (error) {
    console.error('Error getting prescriptive analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting prescriptive analysis',
      error: error.message
    });
  }
});

module.exports = router; 