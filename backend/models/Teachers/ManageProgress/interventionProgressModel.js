// models/Teachers/ManageProgress/interventionProgressModel.js
const mongoose = require('mongoose');

const interventionProgressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interventionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterventionPlan',
    required: true
  },
  completedActivities: {
    type: Number,
    default: 0
  },
  totalActivities: {
    type: Number,
    default: 0
  },
  percentComplete: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  percentCorrect: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  passedThreshold: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
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
  collection: 'intervention_progress'
});

// Update timestamp on save
interventionProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const InterventionProgress = mongoose.models.InterventionProgress || mongoose.model('InterventionProgress', interventionProgressSchema);

module.exports = InterventionProgress;