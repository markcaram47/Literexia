const mongoose = require('mongoose');

/**
 * Model for the test.student_responses collection
 * Records student responses to assessment questions
 */
const studentResponseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategoryResult'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId
  },
  questionOrder: {
    type: Number
  },
  category: {
    type: String,
    required: true
  },
  sentenceQuestionIndex: {
    type: Number
  },
  selectedOption: {
    type: String
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number
  },
  answeredAt: {
    type: Date,
    default: Date.now
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
  collection: 'student_responses'
});

module.exports = mongoose.models.StudentResponse || mongoose.model('StudentResponse', studentResponseSchema);