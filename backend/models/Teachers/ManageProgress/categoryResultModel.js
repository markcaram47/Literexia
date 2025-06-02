const mongoose = require('mongoose');
const User = require('../../userModel');

/**
 * Model for the test.category_results collection
 * Stores assessment results by category for students
 */
const categoryResultSchema = new mongoose.Schema({
  // Keep studentId as original string/number value
  studentId: {
    type: String,
    required: true
  },
  // Add studentObjectId for MongoDB ObjectId reference
  studentObjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assessmentType: {
    type: String,
    enum: ['pre-assessment', 'post-assessment', 'intervention'],
    required: true
  },
  readingLevel: {
    type: String,
    required: true
  },
  assessmentDate: {
    type: Date,
    default: Date.now
  },
  categories: [{
    categoryName: {
      type: String,
      required: true,
      enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctAnswers: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    isPassed: {
      type: Boolean,
      required: true
    },
    passingThreshold: {
      type: Number,
      default: 75
    }
  }],
  overallScore: {
    type: Number,
    required: true
  },
  allCategoriesPassed: {
    type: Boolean,
    required: true
  },
  readingLevelUpdated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isPreAssessment: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'category_results'
});

// Before saving, automatically populate studentObjectId from studentId
categoryResultSchema.pre('save', async function(next) {
  try {
    // Skip if studentObjectId is already set and valid
    if (this.studentObjectId && mongoose.Types.ObjectId.isValid(this.studentObjectId)) {
      return next();
    }
    
    // If studentId is a valid ObjectId, use it directly
    if (mongoose.Types.ObjectId.isValid(this.studentId)) {
      this.studentObjectId = this.studentId;
      return next();
    }
    
    // Find the user by idNumber
    const user = await User.findOne({ idNumber: this.studentId.toString() });
    
    if (user) {
      console.log(`Mapped studentId ${this.studentId} to user ObjectId: ${user._id}`);
      this.studentObjectId = user._id;
    } else {
      console.error(`Could not find user with idNumber: ${this.studentId}`);
    }
    
    return next();
  } catch (error) {
    console.error('Error in CategoryResult pre-save hook:', error);
    return next(error);
  }
});

// Add a middleware to automatically populate studentObjectId when finding documents
categoryResultSchema.pre('find', function() {
  // If studentObjectId doesn't exist in the query but studentId does, try to map it
  if (this._conditions.studentId && !this._conditions.studentObjectId) {
    const studentId = this._conditions.studentId;
    
    // If studentId is a string that looks like an ObjectId, add it to studentObjectId conditions
    if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
      this._conditions.studentObjectId = new mongoose.Types.ObjectId(studentId);
    }
  }
});

// Add a middleware to automatically populate studentObjectId when finding a single document
categoryResultSchema.pre('findOne', function() {
  // If studentObjectId doesn't exist in the query but studentId does, try to map it
  if (this._conditions.studentId && !this._conditions.studentObjectId) {
    const studentId = this._conditions.studentId;
    
    // If studentId is a string that looks like an ObjectId, add it to studentObjectId conditions
    if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
      this._conditions.studentObjectId = new mongoose.Types.ObjectId(studentId);
    }
  }
});

const PrescriptiveAnalysisService = require('../../../services/Teachers/PrescriptiveAnalysisService');

// After a new category result is saved, generate prescriptive analyses
categoryResultSchema.post('save', async function(doc) {
  try {
    // Import service
    const PrescriptiveAnalysisService = require('../../../services/Teachers/PrescriptiveAnalysisService');
    
    console.log(`CategoryResult post-save hook triggered for student ${doc.studentId}`);
    
    // Use studentObjectId if available, otherwise use studentId
    const studentIdForAnalysis = doc.studentObjectId || doc.studentId;
    
    // Step 1: Ensure the student has analysis records for all categories
    await PrescriptiveAnalysisService.ensureStudentHasAllAnalyses(
      studentIdForAnalysis, 
      doc.readingLevel || 'Low Emerging'
    );
    
    // Step 2: Generate analyses based on the category result
    await PrescriptiveAnalysisService.generateAnalysesFromCategoryResults(
      studentIdForAnalysis,
      doc
    );
    
    // Step 3: Make sure all analyses have content (even empty ones)
    await PrescriptiveAnalysisService.regenerateEmptyAnalyses(studentIdForAnalysis);
    
    console.log(`Successfully generated prescriptive analyses for student ${doc.studentId}`);
  } catch (error) {
    console.error('Error in CategoryResult post-save hook:', error);
  }
});

module.exports = mongoose.models.CategoryResult || mongoose.model('CategoryResult', categoryResultSchema);