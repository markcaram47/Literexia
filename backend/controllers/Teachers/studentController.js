// controllers/Teachers/studentController.js
const mongoose = require('mongoose');

// Get the right databases
const getUsersDb = () => mongoose.connection.useDb('test');
const getTeachersDb = () => mongoose.connection.useDb('teachers');

// Controller methods for CRUD operations
exports.getStudents = async (req, res) => {
  try {
    const { limit = 100, skip = 0, search = '' } = req.query;

    // Get users collection from test database
    const usersCollection = getUsersDb().collection('users');

    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get total count
    const total = await usersCollection.countDocuments(query);

    // Get students with pagination
    const students = await usersCollection
      .find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    // Map to correct format
    const formattedStudents = students.map(student => ({
      id: student._id,
      idNumber: student.idNumber,
      name: student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      age: student.age,
      gender: student.gender,
      gradeLevel: student.gradeLevel || 'Grade 1',
      section: student.section,
      readingLevel: student.readingLevel || 'Not Assessed',
      profileImageUrl: student.profileImageUrl,
      parentId: student.parentId,
      address: student.address,
      preAssessmentCompleted: student.preAssessmentCompleted || false,
      lastAssessmentDate: student.lastAssessmentDate
    }));

    res.json({
      students: formattedStudents,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

exports.getParentInfo = async (req, res) => {
  try {
    const studentId = req.params.id;

    // Get users collection from test database
    const usersCollection = getUsersDb().collection('users');

    // Find student to get parentId
    const student = await usersCollection.findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(studentId) },
        { idNumber: parseInt(studentId) || studentId }
      ]
    });

    if (!student || !student.parentId) {
      return res.status(404).json({ message: 'Student or parent not found' });
    }

    // Get parent info from parent.parent_profile collection
    const parentDb = mongoose.connection.useDb('parent');
    const parentCollection = parentDb.collection('parent_profile');

    let parentObjId;
    try {
      if (typeof student.parentId === 'object' && student.parentId.$oid) {
        parentObjId = new mongoose.Types.ObjectId(student.parentId.$oid);
      } else {
        parentObjId = new mongoose.Types.ObjectId(student.parentId);
      }
    } catch (err) {
      return res.status(400).json({ message: 'Invalid parent ID format' });
    }

    const parentProfile = await parentCollection.findOne({ _id: parentObjId });

    if (!parentProfile) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Format parent info
    const firstName = parentProfile.firstName || '';
    const middleName = parentProfile.middleName || '';
    const lastName = parentProfile.lastName || '';

    let name = firstName;
    if (middleName) name += ` ${middleName}`;
    if (lastName) name += ` ${lastName}`;

    // Get email from users_web.users if possible
    let email = parentProfile.email || '';
    if (parentProfile.userId) {
      try {
        const usersWebDb = mongoose.connection.useDb('users_web');
        const usersCollection = usersWebDb.collection('users');

        let userId;
        if (typeof parentProfile.userId === 'object' && parentProfile.userId.$oid) {
          userId = new mongoose.Types.ObjectId(parentProfile.userId.$oid);
        } else {
          userId = new mongoose.Types.ObjectId(parentProfile.userId);
        }

        const user = await usersCollection.findOne({ _id: userId });
        if (user) {
          email = user.email || '';
        }
      } catch (e) {
        console.warn("Error fetching parent email:", e);
      }
    }

    const parentInfo = {
      id: parentProfile._id,
      name: name.trim(),
      email: email,
      contact: parentProfile.contact || '',
      address: parentProfile.address || '',
      civilStatus: parentProfile.civilStatus || '',
      gender: parentProfile.gender || '',
      profileImageUrl: parentProfile.profileImageUrl || ''
    };

    res.json(parentInfo);
  } catch (error) {
    console.error('Error fetching parent info:', error);
    res.status(500).json({ message: 'Error fetching parent info', error: error.message });
  }
};

// In controllers/Teachers/studentController.js, let's update the getStudentById method:

// Update the studentController.js getStudentById method to properly include parent info:

exports.getStudentById = async (req, res) => {
  try {
    const id = req.params.id;

    // Validate ID
    let studentId;
    try {
      studentId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      studentId = id; // Try as idNumber if not valid ObjectId
    }

    // Get users collection
    const usersCollection = getUsersDb().collection('users');

    // Find student by ID or idNumber
    const student = await usersCollection.findOne({
      $or: [
        { _id: studentId },
        { idNumber: parseInt(id) || id }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get parent information directly if parentId exists
    let parentInfo = null;
    if (student.parentId) {
      try {
        // Try to find the parent in parent.parent_profile collection first
        const parentDb = mongoose.connection.useDb('parent');
        const parentCollection = parentDb.collection('parent_profile');

        let parentId;
        if (typeof student.parentId === 'object' && student.parentId.$oid) {
          parentId = new mongoose.Types.ObjectId(student.parentId.$oid);
        } else {
          parentId = new mongoose.Types.ObjectId(student.parentId);
        }

        // Try to find parent by ID
        const parent = await parentCollection.findOne({ _id: parentId });

        if (parent) {
          // Format parent details
          const firstName = parent.firstName || '';
          const middleName = parent.middleName || '';
          const lastName = parent.lastName || '';

          let name = firstName;
          if (middleName) name += ` ${middleName}`;
          if (lastName) name += ` ${lastName}`;

          // Get email from users_web.users if possible
          let email = parent.email || '';
          if (parent.userId && !email) {
            try {
              const usersWebDb = mongoose.connection.useDb('users_web');
              const usersCollection = usersWebDb.collection('users');

              let userId;
              if (typeof parent.userId === 'object' && parent.userId.$oid) {
                userId = new mongoose.Types.ObjectId(parent.userId.$oid);
              } else {
                userId = new mongoose.Types.ObjectId(parent.userId);
              }

              const user = await usersCollection.findOne({ _id: userId });
              if (user) {
                email = user.email || '';
              }
            } catch (e) {
              console.warn("Error fetching parent email:", e);
            }
          }

          console.log("Found parent info:", {
            id: parent._id,
            name: name.trim(),
            email: email,
            contact: parent.contact || '',
            address: parent.address || '',
            civilStatus: parent.civilStatus || '',
            gender: parent.gender || '',
            profileImageUrl: parent.profileImageUrl || ''
          });

          parentInfo = {
            id: parent._id,
            name: name.trim(),
            email: email,
            contact: parent.contact || '',
            address: parent.address || '',
            civilStatus: parent.civilStatus || '',
            gender: parent.gender || '',
            profileImageUrl: parent.profileImageUrl || ''
          };
        }
      } catch (err) {
        console.warn(`Error fetching parent info for student ${id}:`, err);
      }
    }

    // Format student data
    const formattedStudent = {
      id: student._id,
      idNumber: student.idNumber,
      name: student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      age: student.age,
      gender: student.gender,
      gradeLevel: student.gradeLevel || 'Grade 1',
      section: student.section,
      readingLevel: student.readingLevel || 'Not Assessed',
      profileImageUrl: student.profileImageUrl,
      parentId: student.parentId,
      parent: parentInfo, // Include parent info directly
      address: student.address,
      preAssessmentCompleted: student.preAssessmentCompleted || false,
      lastAssessmentDate: student.lastAssessmentDate
    };

    res.json(formattedStudent);
  } catch (error) {
    console.error(`Error fetching student with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching student details', error: error.message });
  }
};



exports.getAssessmentResults = async (req, res) => {
  try {
    const id = req.params.id;

    // First, get the student to access reading level
    const usersCollection = getUsersDb().collection('users');

    // Find student by ID or idNumber
    const student = await usersCollection.findOne({
      $or: [
        { _id: new mongoose.Types.ObjectId(id) },
        { idNumber: parseInt(id) || id }
      ]
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Next, get category results from the category_results collection
    const categoryResultsCollection = getUsersDb().collection('category_results');

    // Find the most recent assessment result for this student
    const categoryResults = await categoryResultsCollection.find({
      studentId: new mongoose.Types.ObjectId(student._id)
    }).sort({ assessmentDate: -1 }).limit(1).toArray();

    // If we have category results
    if (categoryResults && categoryResults.length > 0) {
      const latestAssessment = categoryResults[0];

      // Calculate overall score from categories
      let totalScore = 0;
      let totalCategories = 0;

      if (latestAssessment.categories && latestAssessment.categories.length > 0) {
        latestAssessment.categories.forEach(category => {
          if (typeof category.score === 'number') {
            totalScore += category.score;
            totalCategories++;
          }
        });
      }

      const overallScore = totalCategories > 0 ? totalScore / totalCategories : 0;

      // Prepare skill details
      const skillDetails = latestAssessment.categories ? latestAssessment.categories.map(category => ({
        id: category._id || `${category.categoryName}-${Date.now()}`,
        category: category.categoryName,
        score: category.score || 0,
        totalQuestions: category.totalQuestions || 0,
        correctAnswers: category.correctAnswers || 0,
        isPassed: category.isPassed || false,
        passingThreshold: category.passingThreshold || 75
      })) : [];

      // Return combined data
      return res.json({
        studentId: id,
        readingLevel: student.readingLevel || "Not Assessed",
        recommendedLevel: student.readingLevel || "Not Assessed", // Same as current for now
        assessmentDate: latestAssessment.assessmentDate || latestAssessment.createdAt,
        assessmentType: latestAssessment.assessmentType || "post-assessment",
        overallScore: overallScore,
        readingPercentage: overallScore,
        skillDetails: skillDetails,
        allCategoriesPassed: latestAssessment.allCategoriesPassed || false
      });
    } else {
      // If no category results, return basic information
      return res.json({
        studentId: id,
        readingLevel: student.readingLevel || "Not Assessed",
        recommendedLevel: student.readingLevel || "Not Assessed",
        assessmentDate: student.lastAssessmentDate || null,
        overallScore: student.readingPercentage || 0,
        readingPercentage: student.readingPercentage || 0,
        skillDetails: [],
        allCategoriesPassed: false
      });
    }
  } catch (error) {
    console.error(`Error fetching assessment results for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching assessment results', error: error.message });
  }
};


exports.getProgressData = async (req, res) => {
  try {
    const id = req.params.id;

    // Get progress data collections
    const progressCollection = getUsersDb().collection('intervention_progress');

    // Find progress data
    const progressData = await progressCollection.find({ studentId: id }).toArray();

    // Format recent activities from progress data
    const recentActivities = progressData.map(item => ({
      id: item._id,
      title: item.activityName || item.title || `Activity ${item._id.toString().substr(-4)}`,
      category: item.category || 'General',
      score: item.score || 0,
      date: item.date || new Date(),
      completed: true
    }));

    res.json({
      studentId: id,
      recentActivities,
      currentLevel: progressData[0]?.currentLevel || 'Not Assessed',
      lastUpdated: progressData[0]?.date || new Date()
    });
  } catch (error) {
    console.error(`Error fetching progress data for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching progress data', error: error.message });
  }
};

exports.getRecommendedLessons = async (req, res) => {
  try {
    const id = req.params.id;

    // Return empty array instead of generating mock data
    // This prevents unnecessary population of the lessons collection in test database
    const recommendations = [];

    res.json(recommendations);
  } catch (error) {
    console.error(`Error fetching recommended lessons for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching recommended lessons', error: error.message });
  }
};

exports.getPrescriptiveRecommendations = async function(req, res) {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid student ID format' 
      });
    }

    // Check if student exists - using the exports.getUserById helper method
    const student = await exports.getUserById(id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    // Get the latest category results directly from the collection
    const testDb = mongoose.connection.useDb('test');
    const categoryResultsCollection = testDb.collection('category_results');
    
    const categoryResults = await categoryResultsCollection.findOne({
      studentId: new mongoose.Types.ObjectId(id)
    }, {
      sort: { assessmentDate: -1, createdAt: -1 }
    });

    // 🔒 Short-circuit: no assessment → no prescriptive data
    if (
      student.readingLevel === 'Not Assessed' ||
      !categoryResults
    ) {
      return res.status(200).json({ success: true, data: null });
    }

    // Get all prescriptive analyses for this student
    const PrescriptiveAnalysisService = require('../../services/Teachers/PrescriptiveAnalysisService');
    let analyses = await PrescriptiveAnalysisService.getStudentAnalyses(id);

    // If we have category results but no analyses, generate them
    if (categoryResults && (!analyses || analyses.length === 0)) {
      // Generate analyses from category results
      await PrescriptiveAnalysisService.generateAnalysesFromCategoryResults(
        id,
        categoryResults
      );
      // Fetch the newly generated analyses
      analyses = await PrescriptiveAnalysisService.getStudentAnalyses(id);
    }

    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          readingLevel: student.readingLevel || 'Not Assessed'
        },
        categoryResults,
        prescriptiveAnalyses: analyses
      }
    });
  } catch (error) {
    console.error('Error getting prescriptive recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve prescriptive recommendations',
      error: error.message
    });
  }
};

exports.updateStudentAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    // Get users collection
    const usersCollection = getUsersDb().collection('users');

    // Update student address
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { address } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error(`Error updating address for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating student address', error: error.message });
  }
};

exports.linkParentToStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { parentId } = req.body;

    if (!parentId) {
      return res.status(400).json({ message: 'Parent ID is required' });
    }

    // Get users collection
    const usersCollection = getUsersDb().collection('users');

    // Update student with parent ID
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(studentId) },
      { $set: { parentId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Parent linked to student successfully' });
  } catch (error) {
    console.error(`Error linking parent to student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error linking parent to student', error: error.message });
  }
};

// NEW METHODS FOR FILTER ENDPOINTS

// Get available grade levels
exports.getGradeLevels = async (req, res) => {
  try {
    // Get users collection
    const usersCollection = getUsersDb().collection('users');
    
    // Extract unique grade levels from users collection
    const gradeLevelsAgg = await usersCollection.aggregate([
      { $match: { gradeLevel: { $exists: true, $ne: null } } },
      { $group: { _id: "$gradeLevel" } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Transform to array of grade level strings
    const gradeLevels = gradeLevelsAgg.map(item => item._id);
    
    console.log('Returning grade levels:', gradeLevels);
    res.json(gradeLevels);
  } catch (error) {
    console.error('Error fetching grade levels:', error);
    res.status(500).json({ message: 'Error fetching grade levels', error: error.message });
  }
};

// Get available sections/classes
exports.getSections = async (req, res) => {
  try {
    // Get users collection
    const usersCollection = getUsersDb().collection('users');
    
    // Extract unique sections from users collection
    const sectionsAgg = await usersCollection.aggregate([
      { $match: { section: { $exists: true, $ne: null } } },
      { $group: { _id: "$section" } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Transform to array of section strings
    const sections = sectionsAgg.map(item => item._id);
    
    console.log('Returning sections:', sections);
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Error fetching sections', error: error.message });
  }
};

// Get reading levels
exports.getReadingLevels = async (req, res) => {
  try {
    // Get users collection
    const usersCollection = getUsersDb().collection('users');
    
    // Extract unique reading levels from users collection
    const readingLevelsAgg = await usersCollection.aggregate([
      { $match: { readingLevel: { $exists: true, $ne: null } } },
      { $group: { _id: "$readingLevel" } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    // Transform to array of reading level strings
    const readingLevels = readingLevelsAgg.map(item => item._id);
    
    console.log('Returning reading levels:', readingLevels);
    res.json(readingLevels);
  } catch (error) {
    console.error('Error fetching reading levels:', error);
    res.status(500).json({ 
      message: 'Error fetching reading levels', 
      error: error.message 
    });
  }
};


// FOR THE MANAGE PROGRESS Post Assessment Progress Report

exports.getCategoryResults = async (req, res) => {
  try {
    const id = req.params.id;
    const assessmentType = req.query.type; // Get the assessment type from query params
    
    console.log(`Fetching category results for student ID: ${id}, type: ${assessmentType || 'any'}`);
    
    // Get the test database
    const testDb = mongoose.connection.useDb('test');
    const categoryResultsCollection = testDb.collection('category_results');
    
    // Validate ID - could be ObjectId or studentId
    let studentId;
    try {
      studentId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      // If not valid ObjectId, try using it directly as string id
      studentId = id;
    }
    
    // Find the student 
    const usersCollection = testDb.collection('users');
    const student = await usersCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null },
        { idNumber: id }
      ]
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Use the student's ObjectId to find assessment results
    const studentObjId = student._id;
    console.log('Looking for category results for student ID:', studentObjId);
    
    // Build the query
    const query = {
      $or: [
        { studentId: id.toString() },
        { studentId: student.idNumber ? student.idNumber.toString() : null },
        { studentObjectId: studentObjId }
      ]
    };
    
    // Add assessment type filter if provided
    if (assessmentType) {
      if (assessmentType === 'post-assessment') {
        // For post-assessment, we want records that are not pre-assessment
        query.isPreAssessment = { $ne: true };
      } else if (assessmentType === 'pre-assessment') {
        query.isPreAssessment = true;
      } else {
        query.assessmentType = assessmentType;
      }
    }
    
    console.log('Query for category results:', JSON.stringify(query));
    
    // Find the most recent category results for this student
    const categoryResults = await categoryResultsCollection
      .find(query)
      .sort({ assessmentDate: -1, createdAt: -1 })
      .limit(1)
      .toArray();
    
    if (categoryResults.length === 0) {
      // No results found, return empty result with student's reading level
      return res.json({
        studentId: id,
        readingLevel: student.readingLevel || 'Not Assessed',
        categories: [],
        allCategoriesPassed: false,
        assessmentDate: null,
        overallScore: 0
      });
    }
    
    // Return the most recent assessment result
    const latestResult = categoryResults[0];
    console.log(`Found category result with ID: ${latestResult._id} for student ${id}`);
    
    return res.json(latestResult);
  } catch (error) {
    console.error(`Error fetching category results for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching category results', error: error.message });
  }
};

// Get reading level progress for a student
exports.getReadingLevelProgress = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get the test database
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    const categoryResultsCollection = testDb.collection('category_results');
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Find the student 
    const student = await usersCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null },
        { idNumber: id }
      ]
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get the student's reading level
    const readingLevel = student.readingLevel || 'Not Assessed';
    
    // Find the latest category results for this student
    const categoryResults = await categoryResultsCollection
      .find({ 
        $or: [
          { studentId: id.toString() },
          { studentId: student.idNumber ? student.idNumber.toString() : null },
          { studentObjectId: student._id }
        ]
      })
      .sort({ assessmentDate: -1, createdAt: -1 })
      .limit(1)
      .toArray();
    
    // Get all assessment data for the student's reading level
    const assessmentData = await mainAssessmentCollection
      .find({ readingLevel: readingLevel })
      .toArray();
      
    // Group assessment data by category
    const assessmentsByCategory = {};
    assessmentData.forEach(assessment => {
      if (!assessmentsByCategory[assessment.category]) {
        assessmentsByCategory[assessment.category] = assessment;
      }
    });
    
    // If no category results found, create empty progress data
    if (categoryResults.length === 0) {
      const progressData = {
        studentId: id,
        readingLevel: readingLevel,
        lastAssessmentDate: student.lastAssessmentDate || null,
        categories: Object.keys(assessmentsByCategory).map(category => ({
          category: category,
          totalQuestions: assessmentsByCategory[category].questions.length,
          correctAnswers: 0,
          score: 0,
          isPassed: false,
          passingThreshold: 75,
          questions: assessmentsByCategory[category].questions.map(q => ({
            questionType: q.questionType,
            questionText: q.questionText,
            questionValue: q.questionValue,
            order: q.order,
            isCorrect: false
          }))
        }))
      };
      
      return res.json(progressData);
    }
    
    // Get the latest category result
    const latestResult = categoryResults[0];
    
    // Create the progress data structure with detailed information
    const progressData = {
      studentId: id,
      readingLevel: readingLevel,
      lastAssessmentDate: latestResult.assessmentDate || latestResult.createdAt,
      overallScore: latestResult.overallScore,
      allCategoriesPassed: latestResult.allCategoriesPassed,
      categories: []
    };
    
    // Map categories from results to assessment questions
    if (latestResult.categories && latestResult.categories.length > 0) {
      progressData.categories = latestResult.categories.map(category => {
        const assessmentCategory = assessmentsByCategory[category.categoryName];
        
        // Create category data with detailed questions
        return {
          category: category.categoryName,
          totalQuestions: category.totalQuestions,
          correctAnswers: category.correctAnswers,
          score: category.score,
          isPassed: category.isPassed,
          passingThreshold: category.passingThreshold || 75,
          questions: assessmentCategory ? assessmentCategory.questions.map(q => ({
            questionType: q.questionType,
            questionText: q.questionText,
            questionValue: q.questionValue,
            order: q.order,
            // We don't have specific correct/incorrect info per question
            // This would need to be stored in actual assessment responses
            isCorrect: null,
            choiceOptions: q.choiceOptions
          })) : []
        };
      });
    }
    
    return res.json(progressData);
  } catch (error) {
    console.error(`Error fetching reading level progress for student ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error fetching reading level progress', 
      error: error.message 
    });
  }
};

// Helper method to get user by ID
exports.getUserById = async function(id) {
  try {
    // Get users collection
    const usersCollection = getUsersDb().collection('users');

    // Find user by ID or idNumber
    const user = await usersCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null },
        { idNumber: parseInt(id) || id }
      ]
    });

    return user;
  } catch (error) {
    console.error(`Error fetching user by ID ${id}:`, error);
    return null;
  }
};