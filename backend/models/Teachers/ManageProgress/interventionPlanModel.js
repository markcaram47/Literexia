// models/Teachers/ManageProgress/interventionPlanModel.js
const mongoose = require('mongoose');

const interventionPlanSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentNumber: {
    type: String,
    trim: true,
    default: null
  },
  prescriptiveAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PrescriptiveAnalysis',
    default: null
  },
  categoryResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResult',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  readingLevel: {
    type: String,
    required: true
  },
  passThreshold: {
    type: Number,
    default: 75,
    min: 0,
    max: 100
  },
  questions: [{
    questionId: {
      type: String,
      required: true
    },
    source: {
      type: String,
      enum: ['main_assessment', 'template_question', 'custom', 'sentence_template'],
      required: true
    },
    sourceQuestionId: {
      type: String,
      default: null
    },
    questionIndex: {
      type: Number,
      required: true
    },
    questionType: {
      type: String,
      required: true,
      enum: ['patinig', 'katinig', 'malapantig', 'word', 'sentence']
    },
    questionText: {
      type: String,
      required: true
    },
    questionImage: {
      type: String,
      default: null
    },
    questionValue: {
      type: String,
      default: null
    },
    choiceIds: [{
      type: String
    }],
    correctChoiceId: {
      type: String,
      default: null
    },
    choices: [{
      optionText: {
        type: String,
        required: true
      },
      isCorrect: {
        type: Boolean,
        required: true
      },
      description: {
        type: String,
        default: '',
        trim: true
      }
    }]
  }],
  sentenceTemplate: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
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
  collection: 'intervention_assessment'
});

// Update timestamp on save
interventionPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Initialize progress record after creating a new intervention plan
interventionPlanSchema.post('save', async function(doc) {
  try {
    // Check if this is a new document being created
    if (this.isNew) {
      const InterventionProgress = mongoose.model('InterventionProgress');
      
      // Create a default progress record
      await InterventionProgress.create({
        studentId: doc.studentId,
        interventionPlanId: doc._id,
        completedActivities: 0,
        totalActivities: doc.questions.length,
        percentComplete: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        percentCorrect: 0,
        passedThreshold: false,
        notes: "Default progress record"
      });
      
      console.log(`Created default progress record for intervention ${doc._id}`);
    }
  } catch (error) {
    console.error('Error creating intervention progress record:', error);
  }
});

const InterventionPlan = mongoose.models.InterventionPlan || mongoose.model('InterventionPlan', interventionPlanSchema);

module.exports = InterventionPlan;