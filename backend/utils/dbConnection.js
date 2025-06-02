// utils/dbConnections.js
const mongoose = require('mongoose');

// Database connection helpers
const connections = {
  // Main auth database (users_web)
  getUsersWebDb: () => mongoose.connection,
  
  // Test database (for student data and assessments)
  getTestDb: () => mongoose.connection.useDb('test'),
  
  // Pre_Assessment database (for educational content)
  getPreAssessmentDb: () => mongoose.connection.useDb('Pre_Assessment'),
  
  // Teachers database (for teacher profiles)
  getTeachersDb: () => mongoose.connection.useDb('teachers'),
  
  // Parents database (for parent profiles)
  getParentDb: () => mongoose.connection.useDb('parent')
};

module.exports = connections;