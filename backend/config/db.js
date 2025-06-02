const mongoose = require('mongoose');
require('dotenv').config();

// 1. Create separate connections for each database
const mainConnection = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: 'users_web',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testConnection = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: 'test',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const mobileConnection = mongoose.createConnection(process.env.MONGO_URI, {
  dbName: 'mobile_literexia',
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 2. Import your schemas
const ParentProfileSchema       = require('../models/ParentProfile');
const StudentSchema             = require('../models/Student');
const UserResponseSchema        = require('../models/UserResponse');
const AssessmentTemplateSchema  = require('../models/AssessmentTemplate');

// 3. Register models on their respective connections
const ParentProfile      = mainConnection.model('ParentProfile', ParentProfileSchema);
const Student            = testConnection.model('Student', StudentSchema);
const UserResponse       = mobileConnection.model('UserResponse', UserResponseSchema);
const AssessmentTemplate = testConnection.model('AssessmentTemplate', AssessmentTemplateSchema);

// 4. Collect models
const models = {
  ParentProfile,
  Student,
  UserResponse,
  AssessmentTemplate
};

// 5. Utility to verify connections
const checkDatabaseConnections = async () => {
  console.log('Checking database connections...');
  try {
    const parentCount   = await ParentProfile.estimatedDocumentCount();
    console.log(`✅ users_web: ${parentCount} parent profiles`);

    const studentCount  = await Student.estimatedDocumentCount();
    console.log(`✅ test: ${studentCount} students`);

    const responseCount = await UserResponse.estimatedDocumentCount();
    console.log(`✅ mobile_literexia: ${responseCount} assessment responses`);

    console.log('All database connections verified');
  } catch (err) {
    console.error('DB connection check failed', err);
    throw err;
  }
};

// 6. Expose utility functions
const closeConnections = async () => {
  await Promise.all([
    mainConnection.close(),
    testConnection.close(),
    mobileConnection.close()
  ]);
  console.log('✅ All MongoDB connections closed');
};

module.exports = {
  models,
  checkDatabaseConnections,
  closeConnections
};
