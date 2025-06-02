const mongoose = require('mongoose');

const iepObjectiveSchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'],
    trim: true
  },
  lesson: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['mastered', 'in_progress', 'not_started'],
    default: 'in_progress'
  },
  completed: {
    type: Boolean,
    default: false
  },
  supportLevel: {
    type: String,
    enum: ['minimal', 'moderate', 'extensive', null],
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  passingThreshold: {
    type: Number,
    default: 75
  },
  // Intervention fields
  hasIntervention: {
    type: Boolean,
    default: false
  },
  interventionId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  interventionName: {
    type: String,
    trim: true,
    default: ''
  },
  interventionStatus: {
    type: String,
    enum: ['active', 'completed', 'inactive', null],
    default: null
  },
  interventionCreatedAt: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const iepReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentNumber: {
    type: String,
    trim: true,
    index: true
  },
  readingLevel: {
    type: String,
    trim: true
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  objectives: [iepObjectiveSchema],
  // Reference to the latest category results
  basedOnAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResults'
  },
  // Teacher who last modified
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    default: () => new Date().getFullYear().toString()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'iep_reports',
  timestamps: true
});

// Compound index for efficient queries
iepReportSchema.index({ studentId: 1, isActive: 1, academicYear: 1 });

// Update timestamp on save
iepReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update lastUpdated for modified objectives
  if (this.isModified('objectives')) {
    this.objectives.forEach(objective => {
      if (objective.isModified()) {
        objective.lastUpdated = new Date();
      }
    });
  }
  
  next();
});

// Method to generate objectives from category results
iepReportSchema.methods.generateObjectivesFromCategoryResults = function(categoryResults) {
  if (!categoryResults || !categoryResults.categories) return;
  
  this.objectives = categoryResults.categories.map(category => {
    const displayName = category.categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // Determine status based on score and isPassed
    let status = 'in_progress';
    if (category.isPassed) {
      status = 'mastered';
    } else if (category.score === 0) {
      status = 'not_started';
    }
      
    return {
      categoryName: displayName,
      lesson: `Mastering ${displayName}`,
      status: status,
      completed: category.isPassed,
      supportLevel: null, // Start with no support level selected
      score: category.score || 0,
      passingThreshold: category.passingThreshold || 75,
      remarks: '', // Start with empty remarks
      hasIntervention: false,
      interventionId: null,
      interventionName: '',
      interventionStatus: null,
      interventionCreatedAt: null
    };
  });
  
  this.overallScore = categoryResults.overallScore || 0;
  this.basedOnAssessmentId = categoryResults._id;
};

const IEPReport = mongoose.models.IEPReport || mongoose.model('IEPReport', iepReportSchema);

module.exports = IEPReport; 