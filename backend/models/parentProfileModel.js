const mongoose = require('mongoose');

const ParentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  middleName: String,
  lastName: String,
  contact: String,
  address: String,
  civilStatus: String,
  dateOfBirth: String,
  gender: String,
  passwordHash: String,
  profileImageUrl: String,
  children: [String], // or [ObjectId] if referencing students
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = async function getParentProfileModel() {
  // Prevent OverwriteModelError in dev with hot reload
  return mongoose.models.ParentProfile || mongoose.model('ParentProfile', ParentProfileSchema);
}; 