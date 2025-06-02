// models/Teachers/ManageProgress/templatesQuestionsModel.js
const mongoose = require('mongoose');

const templateQuestionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  questionType: {
    type: String,
    required: true,
    enum: ['patinig', 'katinig', 'malapantig', 'word', 'sentence']
  },
  templateText: {
    type: String,
    required: true,
    trim: true
  },
  applicableChoiceTypes: [{
    type: String,
    required: true
  }],
  correctChoiceType: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  collection: 'templates_questions'
});

// Update timestamp on save
templateQuestionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TemplateQuestion = mongoose.models.TemplateQuestion || mongoose.model('TemplateQuestion', templateQuestionSchema);

module.exports = TemplateQuestion;