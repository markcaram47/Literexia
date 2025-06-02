// models/Teachers/ManageProgress/prescriptiveAnalysisModel.js
const mongoose = require('mongoose');

const prescriptiveAnalysisSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResult',
    required: false  // Optional field that can be null
  },
  categoryId: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level', 'Independent']
  },
  strengths: {
    type: [String],
    default: [],
    required: false
  },
  weaknesses: {
    type: [String],
    default: [],
    required: false
  },
  recommendations: {
    type: [String],
    default: [],
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  collection: 'prescriptive_analysis'
});

// Update the 'updatedAt' field on save
prescriptiveAnalysisSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create compound index for student + category to ensure uniqueness
prescriptiveAnalysisSchema.index({ studentId: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('PrescriptiveAnalysis', prescriptiveAnalysisSchema);