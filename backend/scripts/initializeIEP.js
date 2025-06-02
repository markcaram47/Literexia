const mongoose = require('mongoose');
const IEPReport = require('../models/Teachers/ManageProgress/iepReportModel');
require('dotenv').config();

async function initializeIEPForAllStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017', {
      dbName: 'test'
    });

    console.log('Connected to MongoDB');

    // Get all students
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    const students = await usersCollection.find({}).toArray();

    console.log(`Found ${students.length} students`);

    for (const student of students) {
      try {
        // Check if IEP already exists
        const existingIEP = await IEPReport.findOne({
          studentId: student._id,
          isActive: true
        });

        if (existingIEP) {
          console.log(`IEP already exists for student ${student.idNumber}`);
          continue;
        }

        // Get latest category results
        const categoryResultsCollection = testDb.collection('category_results');
        const latestResults = await categoryResultsCollection.findOne(
          { studentId: student.idNumber },
          { sort: { assessmentDate: -1 } }
        );

        if (!latestResults) {
          console.log(`No category results found for student ${student.idNumber}`);
          continue;
        }

        // Create IEP report
        const iepReport = new IEPReport({
          studentId: student._id,
          studentNumber: student.idNumber,
          readingLevel: latestResults.readingLevel || student.readingLevel
        });

        iepReport.generateObjectivesFromCategoryResults(latestResults);
        await iepReport.save();

        console.log(`Created IEP for student ${student.idNumber}`);

      } catch (error) {
        console.error(`Error creating IEP for student ${student.idNumber}:`, error.message);
      }
    }

    console.log('IEP initialization complete');
    process.exit(0);

  } catch (error) {
    console.error('Error initializing IEP reports:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeIEPForAllStudents();
}

module.exports = initializeIEPForAllStudents; 