// models/Teachers/ManageProgress/templatesChoicesModel.js
const mongoose = require('mongoose');

const templateChoiceSchema = new mongoose.Schema({
  choiceType: {
    type: String,
    required: true
  },
  choiceValue: {
    type: String,
    default: null
  },
  soundText: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
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
  collection: 'templates_choices'
});

// Update timestamp on save
templateChoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TemplateChoice = mongoose.models.TemplateChoice || mongoose.model('TemplateChoice', templateChoiceSchema);

module.exports = TemplateChoice;