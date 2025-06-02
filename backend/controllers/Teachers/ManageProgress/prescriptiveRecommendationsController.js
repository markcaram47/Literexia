// controllers/Teachers/ManageProgress/prescriptiveRecommendationsController.js
// 

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to test database
const getTestDb = () => mongoose.connection.useDb('test');
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment');

// Get prescriptive recommendations for a student
exports.getRecommendations = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting prescriptive recommendations for student: ${studentId}`);
    
    const testDb = getTestDb();
    const usersCollection = testDb.collection('users');
    const categoryProgressCollection = testDb.collection('category_progress');
    const responsesCollection = testDb.collection('assessment_responses');
    const recommendationsCollection = testDb.collection('prescriptive_recommendations');
    
    // First check if we have saved recommendations
    let savedRecommendations;
    try {
      savedRecommendations = await recommendationsCollection.find({
        userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
      }).toArray();
      
      console.log(`Found ${savedRecommendations ? savedRecommendations.length : 0} saved recommendations`);
      
      if (savedRecommendations && savedRecommendations.length > 0) {
        return res.json(savedRecommendations);
      }
    } catch (recError) {
      console.warn('Error fetching saved recommendations, will generate new ones:', recError);
    }
    
    // Get the student to determine reading level
    let student;
    try {
      student = await usersCollection.findOne({
        _id: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
      });
      
      if (!student) {
        console.log(`Student not found with ID: ${studentId}`);
        return res.status(404).json({ message: 'Student not found' });
      }
      
      console.log(`Found student: ${student.firstName} ${student.lastName}, reading level: ${student.readingLevel || 'Not Assessed'}`);
    } catch (studentError) {
      console.error('Error fetching student:', studentError);
      return res.status(500).json({ 
        message: 'Error retrieving student information', 
        error: studentError.message 
      });
    }
    
    const readingLevel = student.readingLevel || 'Not Assessed';
    
    // Get student's category progress
    let categoryProgress;
    try {
      categoryProgress = await categoryProgressCollection.findOne({
        userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
      });
      
      console.log(`Category progress ${categoryProgress ? 'found' : 'not found'} for student: ${studentId}`);
    } catch (progressError) {
      console.error('Error fetching category progress:', progressError);
      // Continue without progress data
    }
    
    // Get recent assessment responses
    let responses;
    try {
      responses = await responsesCollection.find({
        userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId,
        completed: true
      }).sort({ completedAt: -1 }).limit(10).toArray();
      
      console.log(`Found ${responses.length} recent responses for student: ${studentId}`);
    } catch (responsesError) {
      console.error('Error fetching assessment responses:', responsesError);
      // Continue without responses data
    }
    
    // Generate recommendations based on reading level and assessment performance
    const defaultRecommendations = {
      'Low Emerging': [
        { id: 1, title: "Pagkilala ng Patinig", category: "Alphabet Knowledge", status: "pending" },
        { id: 2, title: "Pagbigkas ng Tunog ng Titik", category: "Alphabet Knowledge", status: "pending" }
      ],
      'High Emerging': [
        { id: 3, title: "Pagsasanay sa Diptonggo", category: "Phonological Awareness", status: "pending" },
        { id: 4, title: "Pagsasanay sa Pagbuo ng Pantig", category: "Phonological Awareness", status: "pending" }
      ],
      'Developing': [
        { id: 5, title: "Pagsasanay sa Pagkilala ng Pantig", category: "Decoding", status: "pending" },
        { id: 6, title: "Mga Gawain sa Paghihiwalay ng Pantig", category: "Phonological Awareness", status: "pending" }
      ],
      'Transitioning': [
        { id: 7, title: "Pagsasanay sa Pag-unawa sa Binasa", category: "Reading Comprehension", status: "pending" },
        { id: 8, title: "Pagsasanay sa Pagtukoy ng Pangunahing Kaisipan", category: "Reading Comprehension", status: "pending" }
      ],
      'At Grade Level': [
        { id: 9, title: "Komprehensyon sa Pagbasa", category: "Reading Comprehension", status: "pending" },
        { id: 10, title: "Pagsusunod-sunod ng mga Pangyayari", category: "Reading Comprehension", status: "pending" }
      ],
      'Not Assessed': [
        { id: 11, title: "Pre-Assessment Recommendation", category: "Pre-Assessment", status: "pending" }
      ]
    };

    let recommendations = defaultRecommendations[readingLevel] || [
      { id: 11, title: "Pre-Assessment Recommendation", category: "Pre-Assessment", status: "pending" }
    ];
    
    // If we have category progress data, refine recommendations
    if (categoryProgress && categoryProgress.categories && categoryProgress.categories.length > 0) {
      // Find categories that need improvement (score below 75%)
      const needsImprovement = categoryProgress.categories
        .filter(cat => cat.mainAssessmentCompleted && cat.mainAssessmentScore < 75)
        .map(cat => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          score: cat.mainAssessmentScore
        }));
      
      if (needsImprovement.length > 0) {
        console.log(`Found ${needsImprovement.length} categories needing improvement`);
        
        // Add specific category recommendations
        for (const category of needsImprovement) {
          const recId = 100 + recommendations.length;
          
          recommendations.push({
            id: recId,
            title: `Focus on ${category.categoryName}`,
            category: category.categoryName,
            description: `Additional practice needed for ${category.categoryName}. Current score: ${category.score}%`,
            status: "pending",
            priorityLevel: "high"
          });
        }
      }
    }
    
    // If we have response data, refine recommendations further
    if (responses && responses.length > 0) {
      // Analyze patterns in responses
      const categoryErrors = {};
      
      // Group errors by category
      for (const response of responses) {
        if (response.incorrectAnswers && response.incorrectAnswers.length > 0) {
          // Track errors by category
          if (!categoryErrors[response.categoryName]) {
            categoryErrors[response.categoryName] = {
              count: 0,
              questions: []
            };
          }
          
          categoryErrors[response.categoryName].count += response.incorrectAnswers.length;
          categoryErrors[response.categoryName].questions.push(...response.incorrectAnswers);
        }
      }
      
      // Add recommendations based on error patterns
      for (const [category, errors] of Object.entries(categoryErrors)) {
        if (errors.count >= 3) { // Threshold for recommendation
          const recId = 200 + recommendations.length;
          
          recommendations.push({
            id: recId,
            title: `Focused Practice: ${category}`,
            category: category,
            description: `Student has shown difficulty with ${errors.count} questions in this area recently.`,
            status: "pending",
            priorityLevel: "medium",
            questionIds: errors.questions
          });
        }
      }
    }
    
    // Add additional metadata to recommendations
    const now = new Date();
    recommendations = recommendations.map(rec => ({
      ...rec,
      readingLevel: readingLevel,
      generatedAt: now,
      userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId,
      studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      contentReferences: getContentReferences(rec.category)
    }));
    
    // Save recommendations for future use
    try {
      // Only insert if we don't already have recommendations
      if (savedRecommendations && savedRecommendations.length === 0) {
        await recommendationsCollection.insertMany(recommendations);
        console.log(`Saved ${recommendations.length} recommendations for future use`);
      }
    } catch (saveError) {
      console.warn('Error saving recommendations:', saveError);
      // Continue without saving
    }
    
    console.log(`Returning ${recommendations.length} prescriptive recommendations`);
    res.json(recommendations);
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update a recommendation's status
exports.updateRecommendationStatus = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const recommendationId = req.params.id;
    const { status, notes } = req.body;
    const teacherId = req.user ? req.user.id : null;
    
    console.log(`Updating recommendation ${recommendationId} to status "${status}" for student: ${studentId}`);
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const testDb = getTestDb();
    const recommendationsCollection = testDb.collection('prescriptive_recommendations');
    
    // Try to find by ID
    let recommendation;
    try {
      if (mongoose.Types.ObjectId.isValid(recommendationId)) {
        recommendation = await recommendationsCollection.findOne({
          _id: ObjectId(recommendationId),
          userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
        });
      } else {
        recommendation = await recommendationsCollection.findOne({
          id: parseInt(recommendationId) || recommendationId,
          userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
        });
      }
      
      console.log(`Recommendation ${recommendation ? 'found' : 'not found'}`);
    } catch (findError) {
      console.error('Error finding recommendation:', findError);
      return res.status(500).json({ 
        message: 'Error retrieving recommendation', 
        error: findError.message 
      });
    }
    
    if (!recommendation) {
      console.log(`Recommendation not found, creating new one`);
      
      // Create a new recommendation if it doesn't exist
      const newRecommendation = {
        id: mongoose.Types.ObjectId.isValid(recommendationId) ? recommendationId : parseInt(recommendationId) || recommendationId,
        userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId,
        title: req.body.title || "Custom Recommendation",
        category: req.body.category || "Custom",
        description: req.body.description || "",
        status: status,
        notes: notes || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: teacherId ? (mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId) : null
      };
      
      try {
        const result = await recommendationsCollection.insertOne(newRecommendation);
        console.log(`Created new recommendation with ID: ${result.insertedId}`);
        
        return res.json({
          success: true,
          message: 'Recommendation created and status updated',
          recommendation: {
            ...newRecommendation,
            _id: result.insertedId
          }
        });
      } catch (insertError) {
        console.error('Error creating recommendation:', insertError);
        return res.status(500).json({ 
          message: 'Error creating recommendation', 
          error: insertError.message 
        });
      }
    }
    
    // Update existing recommendation
    try {
      const result = await recommendationsCollection.findOneAndUpdate(
        {
          _id: recommendation._id
        },
        {
          $set: {
            status: status,
            notes: notes || recommendation.notes || "",
            updatedAt: new Date(),
            updatedBy: teacherId ? (mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId) : null
          }
        },
        { returnDocument: 'after' }
      );
      
      if (!result.value) {
        console.log(`Recommendation not found after update`);
        return res.status(404).json({ message: 'Recommendation not found after update' });
      }
      
      console.log(`Updated recommendation successfully: ${result.value.title}`);
      
      res.json({
        success: true,
        message: 'Recommendation status updated',
        recommendation: result.value
      });
    } catch (updateError) {
      console.error('Error updating recommendation:', updateError);
      return res.status(500).json({ 
        message: 'Error updating recommendation', 
        error: updateError.message 
      });
    }
  } catch (error) {
    console.error('Error in updateRecommendationStatus:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create a custom recommendation for a student
exports.createCustomRecommendation = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { title, category, description, activities } = req.body;
    const teacherId = req.user ? req.user.id : null;
    
    console.log(`Creating custom recommendation for student: ${studentId}`);
    
    // Input validation
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    const testDb = getTestDb();
    const recommendationsCollection = testDb.collection('prescriptive_recommendations');
    const usersCollection = testDb.collection('users');
    
    // Get student name
    let studentName = "";
    try {
      const student = await usersCollection.findOne({
        _id: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
      });
      
      if (student) {
        studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        console.log(`Found student: ${studentName}`);
      }
    } catch (studentError) {
      console.warn('Error finding student, proceeding without student name:', studentError);
    }
    
    // Create a new custom recommendation
    const customRecommendation = {
      userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId,
      studentName: studentName,
      title: title,
      category: category,
      description: description || `Custom recommendation for ${category}`,
      activities: activities || [],
      status: 'pending',
      isCustom: true,
      createdAt: new Date(),
      createdBy: teacherId ? (mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId) : null,
      updatedAt: new Date(),
      updatedBy: teacherId ? (mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId) : null,
      contentReferences: getContentReferences(category)
    };
    
    // Insert the recommendation
    try {
      const result = await recommendationsCollection.insertOne(customRecommendation);
      console.log(`Created custom recommendation with ID: ${result.insertedId}`);
      
      res.status(201).json({
        success: true,
        message: 'Custom recommendation created',
        recommendationId: result.insertedId,
        recommendation: {
          ...customRecommendation,
          _id: result.insertedId
        }
      });
    } catch (insertError) {
      console.error('Error creating custom recommendation:', insertError);
      return res.status(500).json({ 
        message: 'Error creating custom recommendation', 
        error: insertError.message 
      });
    }
  } catch (error) {
    console.error('Error in createCustomRecommendation:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update activity details
exports.updateActivity = async (req, res) => {
  try {
    const activityId = req.params.id;
    const updatedActivity = req.body;
    const teacherId = req.user ? req.user.id : null;
    
    console.log(`Updating activity: ${activityId}`);
    console.log('Updated activity data:', JSON.stringify(updatedActivity));
    
    if (!updatedActivity) {
      return res.status(400).json({ message: 'Activity data is required' });
    }
    
    const testDb = getTestDb();
    const recommendationsCollection = testDb.collection('prescriptive_recommendations');
    
    // Try to find activity
    let recommendation;
    try {
      // Try different ways to find the recommendation
      if (mongoose.Types.ObjectId.isValid(activityId)) {
        recommendation = await recommendationsCollection.findOne({
          _id: ObjectId(activityId)
        });
      }
      
      if (!recommendation) {
        recommendation = await recommendationsCollection.findOne({
          id: parseInt(activityId) || activityId
        });
      }
      
      console.log(`Activity ${recommendation ? 'found' : 'not found'}`);
    } catch (findError) {
      console.error('Error finding activity:', findError);
      return res.status(500).json({ 
        message: 'Error retrieving activity', 
        error: findError.message 
      });
    }
    
    if (!recommendation) {
      console.log(`Activity not found, creating new one`);
      
      // Create a new activity if it doesn't exist
      const newActivity = {
        ...updatedActivity,
        id: mongoose.Types.ObjectId.isValid(activityId) ? activityId : parseInt(activityId) || activityId,
        status: updatedActivity.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: teacherId ? (mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId) : null,
        updatedBy: teacherId ? (mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId) : null
      };
      
      try {
        const result = await recommendationsCollection.insertOne(newActivity);
        console.log(`Created new activity with ID: ${result.insertedId}`);
        
        return res.json({
          success: true,
          message: 'Activity created and updated',
          activity: {
            ...newActivity,
            _id: result.insertedId
          }
        });
      } catch (insertError) {
        console.error('Error creating activity:', insertError);
        return res.status(500).json({ 
          message: 'Error creating activity', 
          error: insertError.message 
        });
      }
    }
    
    // Update existing activity
    try {
      // Prepare update fields
      const updateFields = {};
      
      // Only update fields that were provided
      for (const [key, value] of Object.entries(updatedActivity)) {
        if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
          updateFields[key] = value;
        }
      }
      
      // Always update timestamps and updatedBy
      updateFields.updatedAt = new Date();
      if (teacherId) {
        updateFields.updatedBy = mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId;
      }
      
      const result = await recommendationsCollection.findOneAndUpdate(
        {
          _id: recommendation._id
        },
        {
          $set: updateFields
        },
        { returnDocument: 'after' }
      );
      
      if (!result.value) {
        console.log(`Activity not found after update`);
        return res.status(404).json({ message: 'Activity not found after update' });
      }
      
      console.log(`Updated activity successfully`);
      
      res.json({
        success: true,
        message: 'Activity updated and pushed to mobile',
        activity: result.value
      });
    } catch (updateError) {
      console.error('Error updating activity:', updateError);
      return res.status(500).json({ 
        message: 'Error updating activity', 
        error: updateError.message 
      });
    }
  } catch (error) {
    console.error('Error in updateActivity:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Helper function to get content references from the Pre_Assessment database
function getContentReferences(category) {
  // Default content references based on category
  const references = {
    "Alphabet Knowledge": {
      collections: ["letters_collection"],
      contentTypes: ["patinig", "katinig"]
    },
    "Phonological Awareness": {
      collections: ["letters_collection", "syllables_collection"],
      contentTypes: ["patinig", "katinig", "pantig"]
    },
    "Decoding": {
      collections: ["syllables_collection", "words_collection"],
      contentTypes: ["pantig", "salita"]
    },
    "Word Recognition": {
      collections: ["words_collection"],
      contentTypes: ["salita"]
    },
    "Reading Comprehension": {
      collections: ["sentences_collection", "shortstory_collection"],
      contentTypes: ["pangungusap", "maikling_kwento"]
    }
  };

  return references[category] || {
    collections: [],
    contentTypes: []
  };
}
