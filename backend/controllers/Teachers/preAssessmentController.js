const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const { PreAssessment, QuestionType } = require('../../models/Teachers/preAssessmentModel');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Get the correct databases
const getTestDb = () => mongoose.connection.useDb('test'); // for users
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment'); // for assessment data

// Get all pre-assessments
exports.getAllPreAssessments = async (req, res) => {
  try {
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    const preAssessments = await preAssessmentCollection.find({}).toArray();
    
    // Format the response to include only necessary fields and add category counts
    const formattedAssessments = preAssessments.map(assessment => {
      const categoryCounts = {
        alphabet_knowledge: 0,
        phonological_awareness: 0,
        decoding: 0,
        word_recognition: 0,
        reading_comprehension: 0
      };
      
      // Count questions by category
      if (assessment.questions && assessment.questions.length > 0) {
        assessment.questions.forEach(question => {
          if (question.questionTypeId && categoryCounts.hasOwnProperty(question.questionTypeId)) {
            categoryCounts[question.questionTypeId]++;
          }
        });
      }
      
      return {
        _id: assessment._id,
        assessmentId: assessment.assessmentId,
        title: assessment.title,
        description: assessment.description,
        language: assessment.language,
        status: assessment.status,
        totalQuestions: assessment.totalQuestions,
        type: assessment.type,
        categoryCounts: categoryCounts
      };
    });
    
    res.json(formattedAssessments);
  } catch (error) {
    console.error('Error fetching pre-assessments:', error);
    res.status(500).json({ message: 'Error fetching pre-assessments', error: error.message });
  }
};

// Get a single pre-assessment by ID
exports.getPreAssessmentById = async (req, res) => {
  try {
    const preAssessmentId = req.params.id;
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let preAssessment;
    try {
      // Try as MongoDB ObjectId
      preAssessment = await preAssessmentCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(preAssessmentId) 
      });
    } catch (err) {
      // Try as assessmentId string
      preAssessment = await preAssessmentCollection.findOne({ 
        assessmentId: preAssessmentId 
      });
    }
    
    if (!preAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Calculate category counts
    const categoryCounts = {
      alphabet_knowledge: 0,
      phonological_awareness: 0,
      decoding: 0,
      word_recognition: 0,
      reading_comprehension: 0
    };
    
    // Count questions by category
    if (preAssessment.questions && preAssessment.questions.length > 0) {
      preAssessment.questions.forEach(question => {
        if (question.questionTypeId && categoryCounts.hasOwnProperty(question.questionTypeId)) {
          categoryCounts[question.questionTypeId]++;
        }
      });
    }
    
    // Add category counts to the response
    preAssessment.categoryCounts = categoryCounts;
    
    res.json(preAssessment);
    
  } catch (error) {
    console.error('Error fetching pre-assessment:', error);
    res.status(500).json({ message: 'Error fetching pre-assessment', error: error.message });
  }
};

// Create a new pre-assessment
exports.createPreAssessment = async (req, res) => {
  try {
    const preAssessmentData = req.body;
    
    // Validate required fields
    if (!preAssessmentData.assessmentId || !preAssessmentData.title || !preAssessmentData.language) {
      return res.status(400).json({ message: 'Missing required fields: assessmentId, title, language' });
    }
    
    // Set default values if not provided
    preAssessmentData.status = preAssessmentData.status || 'draft';
    preAssessmentData.type = preAssessmentData.type || 'pre_assessment';
    preAssessmentData.totalQuestions = preAssessmentData.totalQuestions || 25;
    
    // Ensure categoryCounts exists with default values if not provided
    if (!preAssessmentData.categoryCounts) {
      preAssessmentData.categoryCounts = {
        alphabet_knowledge: 5,
        phonological_awareness: 5,
        decoding: 5,
        word_recognition: 5,
        reading_comprehension: 5
      };
    }
    
    // Check if assessment with same ID already exists
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    const existingAssessment = await preAssessmentCollection.findOne({ assessmentId: preAssessmentData.assessmentId });
    
    if (existingAssessment) {
      return res.status(409).json({ message: `Assessment with ID ${preAssessmentData.assessmentId} already exists` });
    }
    
    // Insert the new pre-assessment
    const result = await preAssessmentCollection.insertOne(preAssessmentData);
    
    res.status(201).json({
      message: 'Pre-assessment created successfully',
      assessmentId: preAssessmentData.assessmentId,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating pre-assessment:', error);
    res.status(500).json({ message: 'Error creating pre-assessment', error: error.message });
  }
};

// Update an existing pre-assessment
exports.updatePreAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove _id from update data if present
    if (updateData._id) {
      delete updateData._id;
    }
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const existingAssessment = await preAssessmentCollection.findOne(filter);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Update the assessment
    const result = await preAssessmentCollection.updateOne(filter, { $set: updateData });
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No changes made to the pre-assessment' });
    }
    
    res.json({
      message: 'Pre-assessment updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating pre-assessment:', error);
    res.status(500).json({ message: 'Error updating pre-assessment', error: error.message });
  }
};

// Delete a pre-assessment
exports.deletePreAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const existingAssessment = await preAssessmentCollection.findOne(filter);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Delete the assessment
    const result = await preAssessmentCollection.deleteOne(filter);
    
    res.json({
      message: 'Pre-assessment deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting pre-assessment:', error);
    res.status(500).json({ message: 'Error deleting pre-assessment', error: error.message });
  }
};

// Upload media files (images, audio) to S3
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.file;
    const fileType = file.mimetype.split('/')[0]; // 'image' or 'audio'
    const fileExt = file.originalname.split('.').pop();
    
    // Generate a unique file name with pre-assessment path
    const fileName = `pre-assessment/${fileType}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload to S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    const uploadResult = await s3.upload(params).promise();
    
    res.json({
      message: 'File uploaded successfully',
      fileUrl: uploadResult.Location,
      fileKey: uploadResult.Key,
      s3Path: fileName
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

// Delete media file from S3
exports.deleteMedia = async (req, res) => {
  try {
    const { fileKey } = req.params;
    
    if (!fileKey) {
      return res.status(400).json({ message: 'File key is required' });
    }
    
    // Delete from S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey
    };
    
    await s3.deleteObject(params).promise();
    
    res.json({
      message: 'File deleted successfully',
      fileKey
    });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};

// Get all question types
exports.getAllQuestionTypes = async (req, res) => {
  try {
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    const questionTypes = await questionTypesCollection.find({}).toArray();
    
    res.json(questionTypes);
  } catch (error) {
    console.error('Error fetching question types:', error);
    res.status(500).json({ message: 'Error fetching question types', error: error.message });
  }
};

// Create a new question type
exports.createQuestionType = async (req, res) => {
  try {
    const questionTypeData = req.body;
    
    // Validate required fields
    if (!questionTypeData.typeId || !questionTypeData.typeName) {
      return res.status(400).json({ message: 'Missing required fields: typeId, typeName' });
    }
    
    // Check if question type with same ID already exists
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    const existingType = await questionTypesCollection.findOne({ typeId: questionTypeData.typeId });
    
    if (existingType) {
      return res.status(409).json({ message: `Question type with ID ${questionTypeData.typeId} already exists` });
    }
    
    // Insert the new question type
    const result = await questionTypesCollection.insertOne(questionTypeData);
    
    res.status(201).json({
      message: 'Question type created successfully',
      typeId: questionTypeData.typeId,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating question type:', error);
    res.status(500).json({ message: 'Error creating question type', error: error.message });
  }
};

// Update an existing question type
exports.updateQuestionType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove _id from update data if present
    if (updateData._id) {
      delete updateData._id;
    }
    
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as typeId string
      filter = { typeId: id };
    }
    
    // Check if question type exists
    const existingType = await questionTypesCollection.findOne(filter);
    if (!existingType) {
      return res.status(404).json({ message: 'Question type not found' });
    }
    
    // Update the question type
    const result = await questionTypesCollection.updateOne(filter, { $set: updateData });
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No changes made to the question type' });
    }
    
    res.json({
      message: 'Question type updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating question type:', error);
    res.status(500).json({ message: 'Error updating question type', error: error.message });
  }
};

// Delete a question type
exports.deleteQuestionType = async (req, res) => {
  try {
    const { id } = req.params;
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as typeId string
      filter = { typeId: id };
    }
    
    // Check if question type exists
    const existingType = await questionTypesCollection.findOne(filter);
    if (!existingType) {
      return res.status(404).json({ message: 'Question type not found' });
    }
    
    // Delete the question type
    const result = await questionTypesCollection.deleteOne(filter);
    
    res.json({
      message: 'Question type deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting question type:', error);
    res.status(500).json({ message: 'Error deleting question type', error: error.message });
  }
};

exports.getPreAssessmentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('⭐ Getting pre-assessment results for student ID:', studentId);
    console.log('⭐ Full request path:', req.originalUrl);
    console.log('⭐ Request method:', req.method);
    
    // Get collections from correct databases
    const usersCollection = getTestDb().collection('users');
    const userResponsesCollection = getPreAssessmentDb().collection('user_responses');
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    // Find student from test database
    let student;
    try {
      // Try as ObjectId first
      console.log('Attempting to find student with ObjectId:', studentId);
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    } catch (err) {
      // If not valid ObjectId, try as idNumber
      console.log('Not a valid ObjectId, trying as idNumber:', studentId);
      student = await usersCollection.findOne({ idNumber: studentId });
    }
    
    if (!student) {
      console.log('❌ Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('✅ Found student:', student.firstName, student.lastName);
    
    // Find user responses from Pre_Assessment database
    // Try multiple ways to match the user ID
    let userResponses = null;
    const possibleUserIds = [
      student.idNumber?.toString(),
      student._id.toString(),
      studentId
    ];
    
    // Try each possible user ID until we find a match
    for (const userId of possibleUserIds) {
      if (!userId) continue;
      
      userResponses = await userResponsesCollection.findOne({
        userId: userId
      });
      
      if (userResponses) break;
    }
    
    if (!userResponses) {
      return res.status(404).json({ 
        message: 'No pre-assessment results found for this student',
        studentId: studentId,
        hasCompleted: false
      });
    }
    
    console.log('Found user responses:', userResponses._id);
    
    // Get the pre-assessment structure from Pre_Assessment database
    // Use FL-G1-001 as default if assessmentId is not available
    const assessmentId = userResponses.assessmentId || "FL-G1-001";
    const preAssessment = await preAssessmentCollection.findOne({
      assessmentId: assessmentId
    });
    
    if (!preAssessment) {
      console.error(`Pre-assessment structure not found for assessmentId: ${assessmentId}`);
      return res.status(404).json({ message: `Pre-assessment structure not found for assessmentId: ${assessmentId}` });
    }
    
    console.log('Found pre-assessment structure:', preAssessment.title);
    
    // Process the results
    const processedResults = await processAssessmentResults(userResponses, preAssessment, student);
    
    res.json(processedResults);
    
  } catch (error) {
    console.error('Error fetching pre-assessment results:', error);
    res.status(500).json({ 
      message: 'Error fetching pre-assessment results', 
      error: error.message 
    });
  }
};

async function processAssessmentResults(userResponses, preAssessment, student) {
  const results = {
    studentId: student._id,
    studentName: `${student.firstName} ${student.lastName}`,
    assessmentId: userResponses.assessmentId,
    readingLevel: userResponses.readingLevel || student.readingLevel,
    overallScore: userResponses.readingPercentage || 0,
    totalQuestions: userResponses.totalQuestions || 25,
    correctAnswers: userResponses.score || 0,
    part1Score: userResponses.part1Score || 0,
    completedAt: userResponses.completedAt,
    timeTaken: userResponses.timeTaken,
    categoryScores: userResponses.categoryScores || {},
    difficultyBreakdown: userResponses.difficultyBreakdown || {},
    skillDetails: [],
    focusAreas: [],
    hasCompleted: true
  };
  
  // Normalize the category scores keys to handle both formats
  let normalizedCategoryScores = {};
  if (userResponses.categoryScores) {
    // Log the original category scores for debugging
    console.log('Original category scores:', JSON.stringify(userResponses.categoryScores));
    
    // Process each category key to ensure consistency
    Object.keys(userResponses.categoryScores).forEach(key => {
      // Convert key to lowercase with underscores if it has capitals or spaces
      const normalizedKey = key.includes(' ') ? 
        key.toLowerCase().replace(/ /g, '_') : 
        key.toLowerCase();
        
      normalizedCategoryScores[normalizedKey] = userResponses.categoryScores[key];
    });
    
    // Log the normalized scores
    console.log('Normalized category scores:', JSON.stringify(normalizedCategoryScores));
  }
  
  // Group questions by category
  const questionsByCategory = {};
  preAssessment.questions.forEach(question => {
    const categoryId = question.questionTypeId;
    if (!questionsByCategory[categoryId]) {
      questionsByCategory[categoryId] = [];
    }
    questionsByCategory[categoryId].push(question);
  });
  
  // Log available categories for debugging
  console.log('Question categories available:', Object.keys(questionsByCategory));
  console.log('Normalized category keys available:', Object.keys(normalizedCategoryScores));
  
  // Process each category
  Object.keys(questionsByCategory).forEach(categoryKey => {
    const categoryQuestions = questionsByCategory[categoryKey];
    // Use the normalized category data or create default if missing
    const categoryData = normalizedCategoryScores[categoryKey] || {
      total: categoryQuestions.length,
      correct: 0,
      score: 0
    };
    
    // Log processing info for debugging
    console.log(`Processing category ${categoryKey} with ${categoryQuestions.length} questions`);
    
    // Special handling for reading comprehension
    if (categoryKey === 'reading_comprehension') {
      // Process reading comprehension questions directly
      const processedQuestions = categoryQuestions.map(q => {
        const studentAnswer = userResponses.answers[q.questionId];
        
        // Get ALL passage pages and their text
        const allPages = q.passages || [];
        const passageText = allPages.map(page => page.pageText).join(' ');
        
        // Get the actual comprehension questions from sentenceQuestions
        const comprehensionQuestions = q.sentenceQuestions || [];
        const mainComprehensionQ = comprehensionQuestions[0] || {};
        
        // Determine if student was correct based on the correctAnswerChoice field
        // If correctAnswerChoice is "2", then "2" is the correct answer, otherwise "1" is correct
        const correctAnswer = mainComprehensionQ.correctAnswerChoice === "2" ? "2" : "1";
        const isCorrect = studentAnswer === correctAnswer;
        
        return {
          questionId: q.questionId,
          questionNumber: q.questionNumber,
          mainInstruction: q.questionText, // "Basahin ang kwento at sagutin ang tanong"
          
          // Story/Passage information
          passageText: passageText, // Combined story text
          passages: allPages, // Individual pages with pageText and pageImage
          
          // Actual question information
          actualQuestion: mainComprehensionQ.questionText, // The real question like "Ano ang kinain ni Maria?"
          
          // Answer information
          studentAnswer: studentAnswer,
          correctAnswer: mainComprehensionQ.correctAnswerChoice === "2" ? mainComprehensionQ.incorrectAnswer : mainComprehensionQ.correctAnswer,
          incorrectAnswer: mainComprehensionQ.correctAnswerChoice === "2" ? mainComprehensionQ.correctAnswer : mainComprehensionQ.incorrectAnswer,
          correctAnswerChoice: mainComprehensionQ.correctAnswerChoice || "1",
          isCorrect: isCorrect,
          
          // Additional metadata
          difficultyLevel: q.difficultyLevel,
          questionType: q.questionType,
          hasPassage: true,
          allComprehensionQuestions: comprehensionQuestions // In case there are multiple questions per passage
        };
      });

      // Create the skill detail
      const skillDetail = {
        category: categoryKey,
        categoryName: getCategoryDisplayName(categoryKey),
        score: categoryData.score || 0,
        correct: categoryData.correct || 0,
        total: categoryData.total || 5,
        questions: processedQuestions
      };
      
      results.skillDetails.push(skillDetail);
    } else {
      const skillDetail = processRegularCategory(
        categoryKey, 
        categoryQuestions, 
        userResponses.answers, 
        categoryData
      );
      results.skillDetails.push(skillDetail);
    }
    
    // Add to focus areas if score is below 75%
    if (categoryData.score < 75) {
      results.focusAreas.push(getCategoryDisplayName(categoryKey));
    }
  });
  
  // Log the final skill details to verify they were created properly
  console.log(`Generated ${results.skillDetails.length} skill details`);
  
  return results;
}

function processRegularCategory(categoryKey, categoryQuestions, studentAnswers, categoryData) {
  const questions = categoryQuestions.map(question => {
    const studentAnswerOptionId = studentAnswers[question.questionId];
    const correctOption = question.options.find(opt => opt.isCorrect);
    const studentSelectedOption = question.options.find(opt => opt.optionId === studentAnswerOptionId);
    
    // Based on your data: "1" is correct, "2" is incorrect
    const isCorrect = studentAnswerOptionId === "1";
    
    return {
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      questionImage: question.questionImage,
      questionValue: question.questionValue,
      studentAnswer: studentAnswerOptionId,
      correctAnswer: correctOption ? correctOption.optionText : null,
      studentSelectedAnswer: studentSelectedOption ? studentSelectedOption.optionText : null,
      isCorrect: isCorrect,
      difficultyLevel: question.difficultyLevel,
      questionType: question.questionType,
      hasAudio: question.hasAudio || false,
      audioUrl: question.audioUrl
    };
  });
  
  return {
    category: categoryKey,
    categoryName: getCategoryDisplayName(categoryKey),
    score: categoryData.score || 0,
    correct: categoryData.correct || 0,
    total: categoryData.total || 5,
    questions
  };
}

function getCategoryDisplayName(categoryKey) {
  const categoryMap = {
    'alphabet_knowledge': 'Alphabet Knowledge',
    'phonological_awareness': 'Phonological Awareness',
    'decoding': 'Decoding',
    'word_recognition': 'Word Recognition',
    'reading_comprehension': 'Reading Comprehension'
  };
  
  return categoryMap[categoryKey] || categoryKey;
}

exports.getStudentPreAssessmentStatus = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('⭐ Getting pre-assessment status for student ID:', studentId);
    console.log('⭐ Full request path:', req.originalUrl);
    console.log('⭐ Request method:', req.method);
    
    const usersCollection = getTestDb().collection('users');
    const userResponsesCollection = getPreAssessmentDb().collection('user_responses');
    
    // Find student from test database
    let student;
    try {
      console.log('Attempting to find student with ObjectId:', studentId);
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    } catch (err) {
      console.log('Not a valid ObjectId, trying as idNumber:', studentId);
      student = await usersCollection.findOne({ idNumber: studentId });
    }
    
    if (!student) {
      console.log('❌ Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('✅ Found student:', student.firstName, student.lastName);
    
    // Try multiple ways to find user responses
    let hasResponses = null;
    const possibleUserIds = [
      student.idNumber?.toString(),
      student._id.toString(),
      studentId
    ];
    
    // Try each possible user ID until we find a match
    for (const userId of possibleUserIds) {
      if (!userId) continue;
      
      hasResponses = await userResponsesCollection.findOne({
        userId: userId
      });
      
      if (hasResponses) break;
    }
    
    res.json({
      studentId: studentId,
      hasCompleted: !!hasResponses,
      preAssessmentCompleted: student.preAssessmentCompleted || false,
      readingLevel: student.readingLevel,
      lastAssessmentDate: student.lastAssessmentDate
    });
    
  } catch (error) {
    console.error('Error checking pre-assessment status:', error);
    res.status(500).json({ 
      message: 'Error checking pre-assessment status', 
      error: error.message 
    });
  }
};

// Toggle assessment active status
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive field is required' });
    }
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const existingAssessment = await preAssessmentCollection.findOne(filter);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Update the active status and lastUpdated timestamp
    const result = await preAssessmentCollection.updateOne(filter, { 
      $set: { 
        isActive: Boolean(isActive),
        lastUpdated: new Date()
      } 
    });
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No changes made to the pre-assessment' });
    }
    
    // Get the updated assessment
    const updatedAssessment = await preAssessmentCollection.findOne(filter);
    
    res.json({
      message: `Pre-assessment ${isActive ? 'activated' : 'deactivated'} successfully`,
      assessment: updatedAssessment
    });
  } catch (error) {
    console.error('Error toggling pre-assessment active status:', error);
    res.status(500).json({ message: 'Error updating pre-assessment status', error: error.message });
  }
};

// Convert base64 images to S3 paths for a pre-assessment
exports.convertImagesToS3 = async (req, res) => {
  try {
    const { id } = req.params;
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const preAssessment = await preAssessmentCollection.findOne(filter);
    if (!preAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Process each question
    let updatedQuestions = [];
    let imagesProcessed = 0;
    
    for (const question of preAssessment.questions) {
      const updatedQuestion = { ...question };
      
      // Process question image if it exists and is base64
      if (question.questionImage && question.questionImage.startsWith('data:image')) {
        try {
          // Extract image data and MIME type
          const matches = question.questionImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
          }
          
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate filename
          const fileExt = mimeType.split('/')[1] || 'png';
          const fileName = `${question.questionId}_${Date.now()}.${fileExt}`;
          const key = `pre-assessment/images/${fileName}`;
          
          // S3 upload parameters
          const params = {
            Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            ACL: 'public-read'
          };
          
          // Upload to S3
          await s3.upload(params).promise();
          
          // Generate S3 URL
          const s3Url = `https://${params.Bucket}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;
          
          // Update question with S3 path
          updatedQuestion.questionImageS3Path = s3Url;
          updatedQuestion.questionImage = ''; // Clear base64 data
          
          imagesProcessed++;
        } catch (error) {
          console.error(`Error processing image for question ${question.questionId}:`, error);
        }
      }
      
      updatedQuestions.push(updatedQuestion);
    }
    
    // Update the pre-assessment document
    const updateResult = await preAssessmentCollection.updateOne(
      filter,
      { $set: { questions: updatedQuestions } }
    );
    
    res.json({
      message: 'Pre-assessment images converted to S3 successfully',
      imagesProcessed,
      modifiedCount: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('Error converting images to S3:', error);
    res.status(500).json({ message: 'Error converting images to S3', error: error.message });
  }
};