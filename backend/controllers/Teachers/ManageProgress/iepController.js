const IEPReport = require('../../../models/Teachers/ManageProgress/iepReportModel');
const mongoose = require('mongoose');

class IEPController {
  
  // Get IEP report for a student
  static async getIEPReport(req, res) {
    try {
      const { studentId } = req.params;
      const { academicYear } = req.query;
      
      console.log(`Getting IEP report for student: ${studentId}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid student ID format' 
        });
      }
      
      // Build query
      const query = {
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      };
      
      if (academicYear) {
        query.academicYear = academicYear;
      }
      
      // Find the most recent IEP report
      let iepReport = await IEPReport.findOne(query)
        .sort({ createdAt: -1 })
        .populate('studentId', 'idNumber firstName lastName readingLevel')
        .populate('lastModifiedBy', 'firstName lastName');
      
      // If no IEP report exists, try to create one from category results
      if (!iepReport) {
        console.log('No IEP report found, attempting to create from category results');
        try {
          iepReport = await IEPController.createFromCategoryResults(studentId, req.user?.id);
          
          // Populate the fields after creation
          if (iepReport) {
            iepReport = await IEPReport.findById(iepReport._id)
              .populate('studentId', 'idNumber firstName lastName readingLevel')
              .populate('lastModifiedBy', 'firstName lastName');
          }
        } catch (createError) {
          console.error('Failed to create IEP from category results:', createError.message);
          return res.status(404).json({
            success: false,
            error: 'No IEP report available and could not create from assessment data',
            details: createError.message
          });
        }
      }
      
      if (!iepReport) {
        return res.status(404).json({
          success: false,
          error: 'No IEP report found and could not create one'
        });
      }
      
      res.json({
        success: true,
        data: iepReport
      });
      
    } catch (error) {
      console.error('Error getting IEP report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve IEP report',
        message: error.message
      });
    }
  }
  
  // Create IEP report from category results
  static async createFromCategoryResults(studentId, teacherId) {
    try {
      console.log(`Creating IEP from category results for student: ${studentId}`);
      
      // Get student info first
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');
      const student = await usersCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(studentId) 
      });
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      console.log(`Found student: ${student.idNumber} (${student.firstName} ${student.lastName})`);
      
      // Get the latest category results using studentObjectId
      const categoryResultsCollection = testDb.collection('category_results');
      
      console.log(`Searching for category results with studentObjectId: ${studentId}`);
      
      // Try to find results using studentObjectId field
      let latestResults = null;
      
      // Method 1: Try with direct ObjectId conversion
      try {
        latestResults = await categoryResultsCollection.findOne(
          { 
            studentObjectId: new mongoose.Types.ObjectId(studentId)
          },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using direct ObjectId conversion');
        }
      } catch (err) {
        console.log('Error searching with direct ObjectId:', err.message);
      }
      
      // Method 2: Try with string format if MongoDB stores it as string
      if (!latestResults) {
        console.log('Trying with string representation of ObjectId...');
        latestResults = await categoryResultsCollection.findOne(
          { 
            'studentObjectId': studentId
          },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using string representation');
        }
      }
      
      // Method 3: Try with $oid format (Extended JSON format)
      if (!latestResults) {
        console.log('Trying with $oid format...');
        latestResults = await categoryResultsCollection.findOne(
          { 
            'studentObjectId.$oid': studentId
          },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using $oid format');
        }
      }
      
      // Method 4: Try with student number as fallback
      if (!latestResults) {
        console.log(`Falling back to student number: ${student.idNumber}`);
        
        // Try with string format
        latestResults = await categoryResultsCollection.findOne(
          { studentId: student.idNumber },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using student number as string');
        } else {
          // Try with number format
          latestResults = await categoryResultsCollection.findOne(
            { studentId: parseInt(student.idNumber) },
            { sort: { assessmentDate: -1 } }
          );
          
          if (latestResults) {
            console.log('✅ Found results using student number as integer');
          }
        }
      }
      
      // Debug: If still not found, examine the actual data structure
      if (!latestResults) {
        console.log('No results found. Examining database contents...');
        
        const sampleResults = await categoryResultsCollection.find({}).limit(3).toArray();
        console.log('Sample category results:');
        sampleResults.forEach((result, index) => {
          console.log(`${index + 1}. studentId: ${result.studentId} (type: ${typeof result.studentId})`);
          console.log(`   studentObjectId: ${JSON.stringify(result.studentObjectId)}`);
          console.log(`   studentObjectId type: ${typeof result.studentObjectId}`);
          console.log(`   Assessment Date: ${result.assessmentDate}`);
        });
        
        throw new Error(`No category results found for student ${student.idNumber} (ObjectId: ${studentId})`);
      }
      
      console.log(`✅ Found category results: ${latestResults._id}`);
      console.log(`Assessment date: ${latestResults.assessmentDate}`);
      console.log(`Categories in results: ${latestResults.categories?.length || 0}`);
      
      if (!latestResults.categories || latestResults.categories.length === 0) {
        throw new Error('Category results found but no categories data available');
      }
      
      // Log category details for debugging
      latestResults.categories.forEach((cat, index) => {
        console.log(`Category ${index + 1}: ${cat.categoryName} - Score: ${cat.score}% - Passed: ${cat.isPassed}`);
      });
      
      // Create new IEP report
      const iepReport = new IEPReport({
        studentId: new mongoose.Types.ObjectId(studentId),
        studentNumber: student.idNumber,
        readingLevel: latestResults.readingLevel || student.readingLevel,
        overallScore: latestResults.overallScore || 0,
        basedOnAssessmentId: latestResults._id,
        lastModifiedBy: teacherId ? new mongoose.Types.ObjectId(teacherId) : null
      });
      
      // Generate objectives from category results
      console.log('Generating objectives from category results...');
      iepReport.generateObjectivesFromCategoryResults(latestResults);
      
      console.log(`Generated ${iepReport.objectives?.length || 0} objectives:`);
      iepReport.objectives?.forEach((obj, index) => {
        console.log(`${index + 1}. ${obj.lesson} - Support: ${obj.supportLevel} - Score: ${obj.score}%`);
      });
      
      await iepReport.save();
      console.log(`✅ Created and saved IEP report for student ${student.idNumber}`);
      
      return iepReport;
      
    } catch (error) {
      console.error('Error creating IEP from category results:', error);
      throw error; // Re-throw to see the actual error
    }
  }
  
  // Legacy method - Update support level (keep for backward compatibility)
  static async updateSupportLevel(req, res) {
    try {
      const { studentId, objectiveId } = req.params;
      const { supportLevel } = req.body;

      console.log(`Legacy: Updating support level for student ${studentId}, objective ${objectiveId}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Allow null supportLevel (to uncheck)
      if (supportLevel !== null && !['minimal', 'moderate', 'extensive'].includes(supportLevel)) {
        return res.status(400).json({ error: 'Invalid support level' });
      }
      
      // Find and update the IEP report
      const iepReport = await IEPReport.findOne({ 
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({ error: 'IEP report not found' });
      }
      
      // Find the objective and update it
      const objective = iepReport.objectives.id(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: 'Objective not found' });
      }
      
      objective.supportLevel = supportLevel;
      objective.lastUpdated = new Date();
      
      await iepReport.save();
      
      res.json({
        success: true,
        message: 'Support level updated successfully',
        data: objective
      });
      
    } catch (error) {
      console.error('Error updating support level:', error);
      res.status(500).json({
        success: false, 
        error: 'Failed to update support level',
        message: error.message
      });
    }
  }
  
  // Update remarks for an objective
  static async updateRemarks(req, res) {
    try {
      const { studentId, objectiveId } = req.params;
      const { remarks } = req.body;
      
      console.log(`Updating remarks for student ${studentId}, objective ${objectiveId}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Find and update the IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({ error: 'IEP report not found' });
      }
      
      // Find the objective and update it
      const objective = iepReport.objectives.id(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: 'Objective not found' });
      }
      
      objective.remarks = remarks || '';
      objective.lastUpdated = new Date();
      iepReport.lastModifiedBy = req.user?.id;
      
      await iepReport.save();
      
      res.json({
        success: true,
        message: 'Remarks updated successfully',
        data: objective
      });
      
    } catch (error) {
      console.error('Error updating remarks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update remarks',
        message: error.message
      });
    }
  }
  
  // Bulk update multiple objectives
  static async bulkUpdateObjectives(req, res) {
    try {
      const { studentId } = req.params;
      const { updates } = req.body; // Array of {objectiveId, supportLevel?, remarks?}
      
      console.log(`Bulk updating objectives for student ${studentId}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'Updates must be an array' });
      }
      
      // Find the IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({ error: 'IEP report not found' });
      }
      
      // Apply updates
      const updatedObjectives = [];
      for (const update of updates) {
        const objective = iepReport.objectives.id(update.objectiveId);
        if (objective) {
          if (update.supportLevel && ['minimal', 'moderate', 'extensive'].includes(update.supportLevel)) {
            objective.supportLevel = update.supportLevel;
          }
          if (update.hasOwnProperty('remarks')) {
            objective.remarks = update.remarks;
          }
          objective.lastUpdated = new Date();
          updatedObjectives.push(objective);
        }
      }
      
      iepReport.lastModifiedBy = req.user?.id;
      await iepReport.save();
      
      res.json({
        success: true,
        message: `Updated ${updatedObjectives.length} objectives successfully`,
        data: updatedObjectives
      });
      
    } catch (error) {
      console.error('Error bulk updating objectives:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bulk update objectives',
        message: error.message
      });
    }
  }
  
  // Refresh intervention data
  static async refreshInterventionData(req, res) {
    try {
      const { studentId } = req.params;
      
      console.log(`Refreshing intervention data for student: ${studentId}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }
      
      // Find the active IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({
          success: false,
          error: 'No active IEP report found'
        });
      }
      
      // Get current interventions
      const testDb = mongoose.connection.useDb('test');
      const interventionsCollection = testDb.collection('intervention_assessment');
      const studentInterventions = await interventionsCollection.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        status: { $in: ['active', 'completed'] }
      }).toArray();
      
      console.log(`Found ${studentInterventions.length} interventions for student`);
      
      // Create intervention lookup by category
      const interventionByCategory = {};
      studentInterventions.forEach(intervention => {
        interventionByCategory[intervention.category] = intervention;
      });
      
      // Update each objective with intervention data
      iepReport.objectives.forEach(objective => {
        const intervention = interventionByCategory[objective.categoryName];
        
        if (intervention) {
          objective.hasIntervention = true;
          objective.interventionId = intervention._id;
          objective.interventionName = intervention.description; // Use description
          objective.interventionStatus = intervention.status;
          objective.interventionCreatedAt = intervention.createdAt;
          
          console.log(`Updated ${objective.categoryName} with intervention: ${intervention.description}`);
        } else {
          objective.hasIntervention = false;
          objective.interventionId = null;
          objective.interventionName = '';
          objective.interventionStatus = null;
          objective.interventionCreatedAt = null;
        }
        
        objective.lastUpdated = new Date();
      });
      
      iepReport.lastModifiedBy = req.user?.id;
      await iepReport.save();
      
      console.log('✅ Intervention data refreshed successfully');
      
      res.json({
        success: true,
        message: 'Intervention data refreshed successfully',
        data: iepReport
      });
      
    } catch (error) {
      console.error('Error refreshing intervention data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh intervention data',
        message: error.message
      });
    }
  }
  
  // Get all IEP reports for a class or multiple students
  static async getClassIEPReports(req, res) {
    try {
      const { studentIds, academicYear } = req.query;
      
      // Build query
      const query = { isActive: true };
      
      if (studentIds) {
        const ids = studentIds.split(',').map(id => new mongoose.Types.ObjectId(id));
        query.studentId = { $in: ids };
      }
      
      if (academicYear) {
        query.academicYear = academicYear;
      }
      
      const iepReports = await IEPReport.find(query)
        .populate('studentId', 'idNumber firstName lastName readingLevel')
        .populate('lastModifiedBy', 'firstName lastName')
        .sort({ updatedAt: -1 });
      
      res.json({
        success: true,
        data: iepReports,
        count: iepReports.length
      });
      
    } catch (error) {
      console.error('Error getting class IEP reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve class IEP reports',
        message: error.message
      });
    }
  }
  
  // New method - Update support level directly by objective ID
  static async updateObjectiveSupportLevel(req, res) {
    try {
      const { objectiveId } = req.params;
      const { supportLevel, studentId } = req.body;

      console.log(`Updating support level for objective ${objectiveId} to ${supportLevel}`);
      
      // Validate support level - null is allowed to uncheck
      if (supportLevel !== null && !['minimal', 'moderate', 'extensive'].includes(supportLevel)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid support level. Must be minimal, moderate, extensive, or null.'
        });
      }
      
      // Find the IEP report containing this objective
      const iepReport = await IEPReport.findOne({ 
        "objectives._id": objectiveId,
        studentId: studentId
      });
      
      if (!iepReport) {
        return res.status(404).json({ 
          success: false, 
          message: 'IEP report or objective not found' 
        });
      }
      
      // Find the objective in the array
      const objectiveIndex = iepReport.objectives.findIndex(
        obj => obj._id.toString() === objectiveId
      );
      
      if (objectiveIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'Objective not found in IEP report' 
        });
      }
      
      // Update the support level
      iepReport.objectives[objectiveIndex].supportLevel = supportLevel;
      iepReport.objectives[objectiveIndex].lastUpdated = new Date();
      
      // Save the updated report
      await iepReport.save();
      
      return res.status(200).json({
        success: true,
        message: 'Support level updated successfully',
        data: iepReport.objectives[objectiveIndex]
      });
      
    } catch (error) {
      console.error('Error updating objective support level:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error updating support level', 
        error: error.message 
      });
    }
  }

  // Send progress report to parent and save PDF
  static async sendReportToParent(req, res) {
    try {
      const { studentId } = req.params;
      const { parentId, subject, content, pdfS3Path, includeProgressReport } = req.body;
      
      console.log(`Sending progress report to parent for student: ${studentId}`);
      console.log(`PDF S3 path: ${pdfS3Path || 'None'}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid student ID format' 
        });
      }
      
      // Validate parentId
      if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid parent ID is required'
        });
      }
      
      // Validate basic required fields
      if (!subject || !content) {
        return res.status(400).json({
          success: false,
          error: 'Subject and content are required'
        });
      }
      
      // Get access to the 'parent' database
      const parentDb = mongoose.connection.useDb('parent');
      const childPdfCollection = parentDb.collection('child_pdf');
      
      // Get teacher profile ID from users collection
      let teacherId = null;
      if (req.user && req.user.id) {
        try {
          const teacherDb = mongoose.connection.useDb('teachers');
          const teacherProfileCollection = teacherDb.collection('profile');
          
          // Find teacher profile using userId from users_web
          const teacherProfile = await teacherProfileCollection.findOne({
            userId: new mongoose.Types.ObjectId(req.user.id)
          });
          
          if (teacherProfile) {
            teacherId = teacherProfile._id;
            console.log(`Found teacher profile with ID: ${teacherId}`);
          } else {
            // Try to find by the known ID
            const knownId = '6818bae0e9bed4ff08ab7e8c';
            if (mongoose.Types.ObjectId.isValid(knownId)) {
              const objId = new mongoose.Types.ObjectId(knownId);
              const knownProfile = await teacherProfileCollection.findOne({ _id: objId });
              
              if (knownProfile) {
                teacherId = knownProfile._id;
                console.log(`Using known teacher profile with ID: ${teacherId}`);
              } else {
                console.warn(`No teacher profile found for user ID: ${req.user.id}`);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching teacher profile:', error);
        }
      }
      
      // Create PDF record
      const pdfRecord = {
        studentId: new mongoose.Types.ObjectId(studentId),
        parentId: new mongoose.Types.ObjectId(parentId),
        teacherId: teacherId ? new mongoose.Types.ObjectId(teacherId) : null,
        subject: subject,
        content: content,
        pdfS3Path: pdfS3Path, // Store S3 path instead of raw PDF data
        includeProgressReport: !!includeProgressReport,
        sentAt: new Date(),
        status: 'sent'
      };
      
      // Insert record into the child_pdf collection
      try {
        const result = await childPdfCollection.insertOne(pdfRecord);
        
        if (!result.acknowledged) {
          throw new Error('Failed to save progress report record');
        }
        
        // Get student and parent info for logging
        const testDb = mongoose.connection.useDb('test');
        const usersCollection = testDb.collection('users');
        
        const student = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(studentId)
        });
        
        const parent = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(parentId) 
        });
        
        console.log(`✅ Sent progress report for ${student?.firstName || 'student'} ${student?.lastName || ''} to parent ${parent?.firstName || 'parent'} ${parent?.lastName || ''}`);
        
        res.json({
          success: true,
          data: {
            id: result.insertedId,
            studentId,
            parentId,
            sentAt: pdfRecord.sentAt,
            pdfS3Path: pdfRecord.pdfS3Path
          },
          message: 'Progress report sent successfully'
        });
      } catch (dbError) {
        console.error('Database error when saving progress report:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save progress report to database',
          message: dbError.message
        });
      }
      
    } catch (error) {
      console.error('Error sending progress report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send progress report',
        message: error.message
      });
    }
  }

  // Get previous PDF reports for a student
  static async getPreviousPdfReports(req, res) {
    try {
      const { studentId } = req.params;
      
      console.log(`Getting previous PDF reports for student: ${studentId}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }
      
      // Get the parent database
      const parentDb = mongoose.connection.useDb('parent');
      const childPdfCollection = parentDb.collection('child_pdf');
      
      // Find all reports for this student
      const reports = await childPdfCollection.find({
        studentId: new mongoose.Types.ObjectId(studentId)
      })
      .sort({ sentAt: -1 }) // Most recent first
      .project({
        _id: 1,
        subject: 1,
        content: 1,
        pdfS3Path: 1,
        sentAt: 1,
        parentId: 1
      }) // Don't include the full PDF data
      .toArray();
      
      console.log(`Found ${reports.length} reports for student ${studentId}`);
      
      res.json({
        success: true,
        data: reports,
        count: reports.length
      });
      
    } catch (error) {
      console.error('Error getting previous PDF reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve previous reports',
        message: error.message
      });
    }
  }
}

module.exports = IEPController; 