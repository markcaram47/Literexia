const mongoose = require('mongoose');

/**
 * Model for the test.users collection
 * Represents student users in the system
 */
const userSchema = new mongoose.Schema({
  idNumber: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  completedLessons: [{
    type: Number
  }],
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: [5, 'Age must be at least 5 years old'],
    max: [20, 'Age must be at most 20 years old']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastAssessmentDate: {
    type: String
  },
  readingLevel: {
    type: String,
    enum: {
      values: [
        'Low Emerging', 
        'High Emerging', 
        'Transitioning', 
        'Developing', 
        'Independent'
      ],
      message: '{VALUE} is not a valid reading level'
    }
  },
  readingPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  preAssessmentCompleted: {
    type: Boolean,
    default: false
  },
  profileImageUrl: {
    type: String
  },
  gender: {
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other'],
      message: '{VALUE} is not a valid gender'
    }
  },
  birthDate: {
    type: Date
  },
  gradeLevel: {
    type: String,
    enum: {
      values: [
        'Grade 1', 
        'Grade 2', 
        'Grade 3', 
        'Grade 4', 
        'Grade 5', 
        'Grade 6'
      ],
      message: '{VALUE} is not a valid grade level'
    }
  },
  address: {
    type: String
  },
  section: {
    type: String
  }
}, {
  collection: 'users'
});

userSchema.statics.findOrCreateStudent = async function(studentData) {
  try {
    // Try to find existing user by ID number if provided
    let student = null;
    
    if (studentData.idNumber) {
      student = await this.findOne({ idNumber: studentData.idNumber });
    }
    
    // If not found and both first name and last name are provided, try to find by name
    if (!student && studentData.firstName && studentData.lastName) {
      student = await this.findOne({ 
        firstName: studentData.firstName,
        lastName: studentData.lastName
      });
    }
    
    // If still not found, create a new student
    if (!student) {
      student = await this.create(studentData);
    }
    
    return student;
  } catch (error) {
    throw new Error(`Error finding or creating student: ${error.message}`);
  }
};

// Create and export the User model using the schema
const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;