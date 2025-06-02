const mongoose = require('mongoose');

// Import models
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

class PrescriptiveAnalysisService {
  /**
   * Get all prescriptive analyses for a student
   * @param {string} studentId - Student ID (could be MongoDB ObjectId or idNumber)
   * @returns {Promise<Array>} List of analyses
   */
  async getStudentAnalyses(studentId) {
    try {
      // Resolve studentId to MongoDB ObjectId
      let studentObjectId;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If studentId is already a valid ObjectId, use it directly
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        // If studentId is a string (like idNumber), look up the user
        console.log(`Looking up user with idNumber: ${studentId}`);
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        
        if (!user) {
          throw new Error(`Student not found with idNumber: ${studentId}`);
        }
        
        studentObjectId = user._id;
      }

      const analyses = await PrescriptiveAnalysis.find({
        studentId: studentObjectId
      }).sort({ categoryId: 1 });

      return analyses;
    } catch (error) {
      console.error('Error getting student analyses:', error);
      return [];
    }
  }

  /**
   * Get a specific prescriptive analysis by ID
   * @param {string} analysisId - MongoDB ObjectId
   * @returns {Promise<Object>} Prescriptive analysis document
   */
  async getAnalysisById(analysisId) {
    try {
      return await PrescriptiveAnalysis.findById(analysisId);
    } catch (error) {
      console.error('Error fetching analysis by ID:', error);
      throw error;
    }
  }

  /**
   * Get a specific prescriptive analysis by student ID and category
   * @param {string} studentId - Student ID (could be MongoDB ObjectId or idNumber)
   * @param {string} categoryId - Category name
   * @returns {Promise<Object>} Prescriptive analysis document
   */
  async getAnalysisByStudentAndCategory(studentId, categoryId) {
    try {
      // Resolve studentId to MongoDB ObjectId
      let studentObjectId;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If studentId is already a valid ObjectId, use it directly
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        // If studentId is a string (like idNumber), look up the user
        console.log(`Looking up user with idNumber: ${studentId}`);
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        
        if (!user) {
          throw new Error(`Student not found with idNumber: ${studentId}`);
        }
        
        studentObjectId = user._id;
      }

      return await PrescriptiveAnalysis.findOne({
        studentId: studentObjectId,
        categoryId: categoryId
      });
    } catch (error) {
      console.error('Error fetching analysis by student and category:', error);
      throw error;
    }
  }

  /**
   * Create a new prescriptive analysis
   * @param {Object} analysisData - Analysis data
   * @returns {Promise<Object>} Created prescriptive analysis
   */
  async createAnalysis(analysisData) {
    try {
      // First check if an analysis already exists for this student and category
      const existingAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: new mongoose.Types.ObjectId(analysisData.studentId),
        categoryId: analysisData.categoryId
      });

      if (existingAnalysis) {
        // Update existing analysis instead of creating a new one
        return await this.updateAnalysis(existingAnalysis._id, analysisData);
      }

      // Create new analysis
      return await PrescriptiveAnalysis.create({
        studentId: new mongoose.Types.ObjectId(analysisData.studentId),
        categoryId: analysisData.categoryId,
        readingLevel: analysisData.readingLevel,
        strengths: analysisData.strengths || [],
        weaknesses: analysisData.weaknesses || [],
        recommendations: analysisData.recommendations || [],
        createdBy: analysisData.createdBy ? new mongoose.Types.ObjectId(analysisData.createdBy) : null
      });
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  }

  /**
   * Update an existing prescriptive analysis
   * @param {string} analysisId - MongoDB ObjectId
   * @param {Object} updateData - Updated analysis data
   * @returns {Promise<Object>} Updated prescriptive analysis
   */
  async updateAnalysis(analysisId, updateData) {
    try {
      const updates = {
        ...updateData,
        updatedAt: Date.now()
      };

      // Convert studentId to ObjectId if provided
      if (updates.studentId) {
        updates.studentId = new mongoose.Types.ObjectId(updates.studentId);
      }

      // Convert createdBy to ObjectId if provided
      if (updates.createdBy) {
        updates.createdBy = new mongoose.Types.ObjectId(updates.createdBy);
      }

      return await PrescriptiveAnalysis.findByIdAndUpdate(
        analysisId,
        updates,
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error('Error updating analysis:', error);
      throw error;
    }
  }

  /**
   * Delete a prescriptive analysis
   * @param {string} analysisId - MongoDB ObjectId
   * @returns {Promise<Object>} Deleted prescriptive analysis
   */
  async deleteAnalysis(analysisId) {
    try {
      return await PrescriptiveAnalysis.findByIdAndDelete(analysisId);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  }

  /**
   * Initialize prescriptive analyses for all students
   * @returns {Promise<Object>} Count of created and updated analyses
   */
  async initializeForAllStudents() {
    try {
      console.log('Starting initialization of prescriptive analyses for all students...');
      
      // Get all students from users collection
      const users = await mongoose.connection.db.collection('users').find({
        gradeLevel: { $exists: true } // Only get students (they have gradeLevel)
      }).toArray();
      
      console.log(`Found ${users.length} students to initialize...`);
      
      let createdCount = 0;
      let updatedCount = 0;
      let populatedCount = 0;
      let skippedCount = 0;
      
      // For each student, ensure they have analyses for all categories
      for (const student of users) {
        try {
          // Skip students with null or "Not Assessed" reading level
          const readingLevel = student.readingLevel || 'Not Assessed';
          if (readingLevel === 'Not Assessed' || readingLevel === null || student.readingLevel === null) {
            console.log(`Skipping prescriptive analyses for student ${student._id}: reading level not assessed.`);
            skippedCount++;
            continue;
          }
          
          // Use the student's ID and reading level
          const analyses = await this.ensureStudentHasAllAnalyses(
            student._id,
            student.readingLevel || 'Low Emerging'
          );
          
          // NEW: Populate the content for these analyses
          console.log(`Populating content for student ${student._id}`);
          await this.regenerateEmptyAnalyses(student._id);
          populatedCount++;
          
          // Count newly created analyses (those where createdAt equals updatedAt)
          const created = analyses.filter(a => 
            a.createdAt && a.updatedAt && 
            new Date(a.createdAt).getTime() === new Date(a.updatedAt).getTime()
          ).length;
          
          // Count updated analyses
          const updated = analyses.length - created;
          
          createdCount += created;
          updatedCount += updated;
        } catch (error) {
          console.error(`Error processing student ${student._id}:`, error);
          // Continue with next student
        }
      }
      
      console.log(`Initialization complete. Created ${createdCount} new analyses, updated ${updatedCount} existing analyses, populated ${populatedCount} students' analyses, skipped ${skippedCount} students.`);
      return { created: createdCount, updated: updatedCount, populated: populatedCount, skipped: skippedCount };
    } catch (error) {
      console.error('Error initializing prescriptive analyses:', error);
      throw error;
    }
  }

  /**
   * Generate prescriptive analyses from category results
   * @param {string} studentId - Student ID (could be MongoDB ObjectId or idNumber string)
   * @param {Object} categoryResult - Category result document
   * @returns {Promise<Array>} Created or updated analyses
   */
  async generateAnalysesFromCategoryResults(studentId, categoryResult) {
    try {
      const analyses = [];
      
      // Check if student exists
      if (!studentId) {
        throw new Error('Student ID is required');
      }

      // Check if category results exist
      if (!categoryResult || !categoryResult.categories || !Array.isArray(categoryResult.categories)) {
        throw new Error('Valid category results are required');
      }

      // Reading level from category result
      const readingLevel = categoryResult.readingLevel || 'Low Emerging';
      
      // Bail out early if the student has not been assessed
      if (!readingLevel || readingLevel === 'Not Assessed' || readingLevel === null) {
        console.log(`Skipping prescriptive analyses generation for student ${studentId}: reading level not assessed.`);
        return [];   // Nothing created
      }

      // Resolve studentId to MongoDB ObjectId
      let studentObjectId;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If studentId is already a valid ObjectId, use it directly
        studentObjectId = new mongoose.Types.ObjectId(studentId);
        console.log(`Using provided ObjectId: ${studentObjectId}`);
      } else {
        // If studentId is a string (like idNumber), look up the user
        console.log(`Looking up user with idNumber: ${studentId}`);
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        
        if (!user) {
          throw new Error(`Student not found with idNumber: ${studentId}`);
        }
        
        studentObjectId = user._id;
        console.log(`Found user with _id: ${studentObjectId}`);
      }

      // Get existing analyses for this student to avoid duplicates
      const existingAnalyses = await PrescriptiveAnalysis.find({
        studentId: studentObjectId
      });
      
      console.log(`Found ${existingAnalyses.length} existing analyses for student`);
      
      // Generate or update an analysis for each category
      for (const category of categoryResult.categories) {
        // Format category name properly
        const categoryName = category.categoryName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        // Generate automated recommendations based on category type and score
        const generatedAnalysis = this.generateAutomatedAnalysis(categoryName, category.score, readingLevel);
        
        // Find existing analysis or create new one
        let analysis = existingAnalyses.find(a => 
          a.categoryId.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (analysis) {
          // Update existing analysis
          analysis.readingLevel = readingLevel;
          
          // Only update content if it's empty
          if (!analysis.strengths || analysis.strengths.length === 0) {
            analysis.strengths = generatedAnalysis.strengths;
          }
          
          if (!analysis.weaknesses || analysis.weaknesses.length === 0) {
            analysis.weaknesses = generatedAnalysis.weaknesses;
          }
          
          if (!analysis.recommendations || analysis.recommendations.length === 0) {
            analysis.recommendations = generatedAnalysis.recommendations;
          }
          
          analysis.updatedAt = new Date();
          await analysis.save();
          console.log(`Updated existing analysis for ${categoryName}`);
        } else {
          // Create new analysis
          console.log(`Creating new analysis for ${categoryName}`);
          analysis = await PrescriptiveAnalysis.create({
            studentId: studentObjectId,
            categoryId: categoryName,
            readingLevel,
            strengths: generatedAnalysis.strengths,
            weaknesses: generatedAnalysis.weaknesses,
            recommendations: generatedAnalysis.recommendations
          });
        }
        
        analyses.push(analysis);
      }
      
      return analyses;
    } catch (error) {
      console.error('Error generating analyses from category results:', error);
      throw error;
    }
  }

  /**
   * Generate automated analysis based on category and score
   * @param {string} categoryName - Category name
   * @param {number} score - Category score
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Generated analysis
   */
  generateAutomatedAnalysis(categoryName, score, readingLevel) {
    console.log(`generateAutomatedAnalysis called with: category=${categoryName}, score=${score}, readingLevel=${readingLevel}`);
    
    // Default empty analysis
    const analysis = {
      strengths: [],
      weaknesses: [],
      recommendations: []
    };

    // Normalize score
    const normalizedScore = Number(score) || 0;
    
    // For very high scores (perfect or near perfect), always add some strengths
    if (normalizedScore >= 90) {
      // Add general strengths based on category
      switch (categoryName) {
        case 'Alphabet Knowledge':
          analysis.strengths = [
            'Excellent recognition of all letters',
            'Strong understanding of letter-sound relationships',
            'Consistent ability to identify letters in various contexts'
          ];
          analysis.recommendations = [
            'Continue to challenge with more complex letter patterns',
            'Introduce more advanced phonics concepts',
            'Encourage reading materials that reinforce letter recognition'
          ];
          break;
        case 'Phonological Awareness':
          analysis.strengths = [
            'Advanced phoneme manipulation skills',
            'Strong ability to identify and work with sounds in words',
            'Excellent awareness of sound patterns in language'
          ];
          analysis.recommendations = [
            'Continue with more complex phonological activities',
            'Introduce more challenging sound manipulation tasks',
            'Connect phonological awareness to spelling patterns'
          ];
          break;
        case 'Word Recognition':
          analysis.strengths = [
            'Extensive sight word vocabulary',
            'Quick and accurate word recognition',
            'Strong ability to recognize words in various contexts'
          ];
          analysis.recommendations = [
            'Continue to expand vocabulary with more complex words',
            'Encourage fluent reading of texts at appropriate level',
            'Introduce more challenging word families and patterns'
          ];
          break;
        case 'Decoding':
          analysis.strengths = [
            'Strong application of phonics rules',
            'Excellent ability to decode unfamiliar words',
            'Consistent use of decoding strategies'
          ];
          analysis.recommendations = [
            'Introduce more complex decoding patterns',
            'Challenge with multisyllabic words',
            'Encourage application of decoding skills in authentic reading'
          ];
          break;
        case 'Reading Comprehension':
          analysis.strengths = [
            'Strong understanding of text meaning',
            'Excellent recall and analysis of details',
            'Ability to make connections and inferences'
          ];
          analysis.recommendations = [
            'Introduce more complex texts with deeper themes',
            'Encourage critical thinking about text content',
            'Provide opportunities for comparing and analyzing different texts'
          ];
          break;
        default:
          analysis.strengths = [
            'Shows strong performance in this area',
            'Demonstrates consistent mastery of skills',
            'Applies knowledge effectively'
          ];
          analysis.recommendations = [
            'Continue to challenge with more advanced materials',
            'Connect skills to practical applications',
            'Provide opportunities for deepening understanding'
          ];
      }
      
      // Return early for high scores
      return analysis;
    }
    
    // Generate analysis based on category and score for non-perfect scores
    switch (categoryName) {
      case 'Alphabet Knowledge':
        if (normalizedScore < 25) {
          analysis.weaknesses = [
            'Significant difficulty recognizing basic letters',
            'Limited understanding of letter-sound relationships',
            'Struggles with distinguishing between similar letterssss (e.g., b/d, p/q)'
          ];
          analysis.recommendations = [
            'Start with a limited set of high-frequency letters',
            'Use multi-sensory approaches (tactile letters, tracing in sand)',
            'Daily letter recognition practice with visual aids',
            'Focus on one letter-sound correspondence at a time'
          ];
        } else if (normalizedScore < 50) {
          analysis.strengths = ['Can recognize some common letters'];
          analysis.weaknesses = [
            'Difficulty with less common letters',
            'Inconsistent recall of letter names',
            'Struggles with lowercase forms'
          ];
          analysis.recommendations = [
            'Practice matching uppercase to lowercase letters',
            'Use letter-object associations (A is for apple)',
            'Regular review of problematic letters',
            'Incorporate letter hunts in reading materials'
          ];
        } else {
          analysis.strengths = [
            'Recognizes most letters',
            'Some understanding of letter-sound relationships'
          ];
          analysis.weaknesses = [
            'Occasional confusion with similar-looking letters',
            'Difficulty with less frequent letters',
            'Inconsistent letter-sound correspondence'
          ];
          analysis.recommendations = [
            'Targeted practice with confusing letter pairs',
            'Word-building activities using known letters',
            'Games that reinforce quick letter recognition',
            'Begin connecting letters to simple words'
          ];
        }
        break;

      case 'Phonological Awareness':
        if (normalizedScore < 25) {
          analysis.weaknesses = [
            'Significant difficulty identifying sounds in words',
            'Unable to segment words into syllables',
            'Limited awareness of rhyming patterns'
          ];
          analysis.recommendations = [
            'Start with awareness of words in sentences',
            'Clapping or tapping syllable activities',
            'Listening exercises to identify environmental sounds',
            'Simple rhyming activities with picture support'
          ];
        } else if (normalizedScore < 50) {
          analysis.strengths = ['Can identify some beginning sounds', 'Basic syllable awareness'];
          analysis.weaknesses = [
            'Difficulty blending sounds to form words',
            'Struggles with identifying ending sounds',
            'Limited phoneme manipulation skills'
          ];
          analysis.recommendations = [
            'Syllable blending and segmentation activities',
            'Sound isolation exercises (beginning, middle, end)',
            'Phoneme counting with manipulatives',
            'Rhyming games and songs'
          ];
        } else {
          analysis.strengths = [
            'Can identify beginning and ending sounds',
            'Recognizes syllable patterns',
            'Some phoneme blending ability'
          ];
          analysis.weaknesses = [
            'Difficulty with vowel sounds',
            'Struggles with phoneme manipulation',
            'Inconsistent with complex phonological tasks'
          ];
          analysis.recommendations = [
            'Word building with phoneme substitution',
            'Activities focusing on middle/vowel sounds',
            'Sound deletion and addition games',
            'More complex phoneme manipulation tasks'
          ];
        }
        break;

      case 'Word Recognition':
        if (normalizedScore < 25) {
          analysis.weaknesses = [
            'Significant difficulty recognizing common words',
            'Limited sight word vocabulary',
            'Struggles with word-picture matching'
          ];
          analysis.recommendations = [
            'Begin with a small set of high-frequency words',
            'Use picture-word matching activities',
            'Repetitive reading of familiar texts',
            'Word recognition games with visual support'
          ];
        } else if (normalizedScore < 50) {
          analysis.strengths = ['Recognizes some common words', 'Can match some words to pictures'];
          analysis.weaknesses = [
            'Difficulty recognizing words in different contexts',
            'Limited recall of previously learned words',
            'Slow word recognition speed'
          ];
          analysis.recommendations = [
            'Flash card practice with high-frequency words',
            'Word hunts in familiar texts',
            'Word sorting by categories',
            'Word recognition activities in different fonts'
          ];
        } else {
          analysis.strengths = [
            'Recognizes many common words',
            'Growing sight word vocabulary',
            'Can identify familiar words in text'
          ];
          analysis.weaknesses = [
            'Difficulty with less common words',
            'Inconsistent recognition in longer texts',
            'Struggles when reading words in context'
          ];
          analysis.recommendations = [
            'Expand sight word vocabulary systematically',
            'Word recognition activities in authentic texts',
            'Speed drills for quick word recognition',
            'Word building with word families'
          ];
        }
        break;

      case 'Decoding':
        if (normalizedScore < 25) {
          analysis.weaknesses = [
            'Significant difficulty applying phonics rules',
            'Unable to blend sounds to decode words',
            'Limited understanding of sound-symbol relationships'
          ];
          analysis.recommendations = [
            'Start with simple CVC (consonant-vowel-consonant) words',
            'Use manipulatives for sound blending',
            'Sound-by-sound blending activities',
            'Picture support for word decoding'
          ];
        } else if (normalizedScore < 50) {
          analysis.strengths = ['Can decode some simple words', 'Basic sound blending ability'];
          analysis.weaknesses = [
            'Difficulty with vowel sounds',
            'Struggles with multi-syllable words',
            'Inconsistent application of phonics rules'
          ];
          analysis.recommendations = [
            'Systematic practice with vowel patterns',
            'Word family activities',
            'Progressive introduction of more complex phonics patterns',
            'Decodable texts that match current skills'
          ];
        } else {
          analysis.strengths = [
            'Can decode many regular words',
            'Applies basic phonics rules',
            'Good sound blending ability'
          ];
          analysis.weaknesses = [
            'Difficulty with irregular words',
            'Struggles with more complex phonics patterns',
            'Decoding speed needs improvement'
          ];
          analysis.recommendations = [
            'Advanced phonics pattern practice',
            'Word sorting by spelling patterns',
            'Fluency-building with decodable texts',
            'Strategies for tackling multi-syllable words'
          ];
        }
        break;

      case 'Reading Comprehension':
        if (normalizedScore < 25) {
          analysis.weaknesses = [
            'Significant difficulty understanding text',
            'Limited ability to recall story details',
            'Struggles with answering basic questions about text'
          ];
          analysis.recommendations = [
            'Picture walk before reading',
            'Simple comprehension questions during reading',
            'Story sequence activities with pictures',
            'Read-alouds with discussion'
          ];
        } else if (normalizedScore < 50) {
          analysis.strengths = ['Can recall some story details', 'Understands simple texts with support'];
          analysis.weaknesses = [
            'Difficulty making inferences',
            'Limited understanding of story structure',
            'Struggles with independent comprehension'
          ];
          analysis.recommendations = [
            'Story mapping activities',
            'Before-during-after reading questions',
            'Retelling practice with visual aids',
            'Think-aloud strategies during reading'
          ];
        } else {
          analysis.strengths = [
            'Understands literal meaning in texts',
            'Can recall major story events',
            'Answers basic comprehension questions'
          ];
          analysis.weaknesses = [
            'Difficulty with deeper meaning',
            'Limited ability to connect ideas across text',
            'Struggles with drawing conclusions'
          ];
          analysis.recommendations = [
            'Inference training with guided practice',
            'Graphic organizers for text structure',
            'Question generation strategies',
            'Making connections (text-to-self, text-to-text)'
          ];
        }
        break;

      default:
        // Generic recommendations if category doesn't match
        analysis.weaknesses = ['Specific areas of difficulty not identified'];
        analysis.recommendations = [
          'Conduct detailed assessment to identify specific needs',
          'Provide targeted instruction based on assessment results',
          'Use multi-sensory approaches to support learning'
        ];
    }

    return analysis;
  }

  /**
   * Ensure prescriptive analyses exist for a student
   * Creates analyses for all categories if they don't exist
   * @param {string} studentId - MongoDB ObjectId of student
   * @param {string} readingLevel - Student's reading level
   * @returns {Promise<Array>} Created or existing analyses
   */
  async ensureStudentAnalyses(studentId, readingLevel = 'Low Emerging') {
    try {
      // ⛔ If the student has never been assessed, bail out.
      if (!readingLevel || readingLevel === 'Not Assessed') {
        console.log(`No prescriptive analyses for ${studentId}: reading level not assessed.`);
        return [];            // →  controller will send null to the UI
      }
      
      // Categories for analysis
      const categories = [
        'Alphabet Knowledge',
        'Phonological Awareness',
        'Word Recognition',
        'Decoding',
        'Reading Comprehension'
      ];
      
      const analyses = [];
      
      // Check if student ID is valid
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        throw new Error('Valid student ID is required');
      }
      
      // For each category, create analysis if it doesn't exist
      for (const category of categories) {
        // Check if analysis exists
        const existingAnalysis = await PrescriptiveAnalysis.findOne({
          studentId: new mongoose.Types.ObjectId(studentId),
          categoryId: category
        });
        
        if (existingAnalysis) {
          // Update reading level if needed
          if (existingAnalysis.readingLevel !== readingLevel) {
            existingAnalysis.readingLevel = readingLevel;
            existingAnalysis.updatedAt = Date.now();
            await existingAnalysis.save();
          }
          analyses.push(existingAnalysis);
        } else {
          // Create new analysis
          const newAnalysis = await PrescriptiveAnalysis.create({
            studentId: new mongoose.Types.ObjectId(studentId),
            categoryId: category,
            readingLevel,
            strengths: [],
            weaknesses: [],
            recommendations: []
          });
          analyses.push(newAnalysis);
        }
      }
      
      return analyses;
    } catch (error) {
      console.error('Error ensuring student analyses:', error);
      throw error;
    }
  }

  /**
   * Normalize category name to ensure consistent matching
   * @param {string} category - Category name in any format
   * @returns {string} Normalized category name
   */
  normalizeCategoryName(category) {
    if (!category) return '';
    
    // Convert to lowercase and replace underscores with spaces
    const normalized = category.toLowerCase().replace(/_/g, ' ');
    
    // Log original and normalized value for debugging
    console.log(`Normalizing category: "${category}" -> "${normalized}"`);
    
    // Map common variations to standard names
    const nameMap = {
      'alphabet knowledge': 'alphabet knowledge',
      'alphabetknowledge': 'alphabet knowledge',
      'alphabet': 'alphabet knowledge',
      'phonological awareness': 'phonological awareness',
      'phonologicalawareness': 'phonological awareness',
      'phonological': 'phonological awareness',
      'word recognition': 'word recognition',
      'wordrecognition': 'word recognition',
      'decoding': 'decoding',
      'reading comprehension': 'reading comprehension',
      'readingcomprehension': 'reading comprehension'
    };
    
    const result = nameMap[normalized] || normalized;
    
    // Log the final normalized value
    if (result !== normalized) {
      console.log(`Mapped to standard name: "${normalized}" -> "${result}"`);
    }
    
    return result;
  }

  /**
   * Regenerate analysis content for empty prescriptive analyses
   * @param {string} studentId - Student ID (could be MongoDB ObjectId or idNumber)
   * @returns {Promise<Array>} Updated analyses
   */
  async regenerateEmptyAnalyses(studentId) {
    try {
      console.log(`--- DEBUG: regenerateEmptyAnalyses for student ${studentId} ---`);
      
      // Resolve studentId to MongoDB ObjectId
      let studentObjectId;
      let user;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If studentId is already a valid ObjectId, use it directly
        studentObjectId = new mongoose.Types.ObjectId(studentId);
        
        // Get user info for reading level
        user = await mongoose.connection.db.collection('users').findOne({
          _id: studentObjectId
        });
        console.log(`Found user by ObjectId: ${user ? 'Yes' : 'No'}`);
      } else {
        // If studentId is a string (like idNumber), look up the user
        console.log(`Looking up user with idNumber: ${studentId}`);
        user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        
        if (!user) {
          throw new Error(`Student not found with idNumber: ${studentId}`);
        }
        
        studentObjectId = user._id;
        console.log(`Found user with _id: ${studentObjectId}`);
      }
      
      // Bail out early if the student has not been assessed
      if (!user?.readingLevel || user.readingLevel === 'Not Assessed') {
        console.log(`Skipping prescriptive analyses regeneration for student ${studentId}: reading level not assessed.`);
        return [];   // Nothing regenerated
      }
      
      // Get all analyses for this student
      const analyses = await PrescriptiveAnalysis.find({
        studentId: studentObjectId
      });
      
      console.log(`Found ${analyses.length} total analyses for student`);
      
      // Find empty analyses (those with no strengths, weaknesses, or recommendations)
      const emptyAnalyses = analyses.filter(analysis => 
        (!analysis.strengths || analysis.strengths.length === 0) ||
        (!analysis.weaknesses || analysis.weaknesses.length === 0) ||
        (!analysis.recommendations || analysis.recommendations.length === 0)
      );
      
      console.log(`Found ${emptyAnalyses.length} empty analyses to update`);
      
      if (emptyAnalyses.length === 0) {
        console.log('No empty analyses found, returning existing analyses');
        return analyses; // No empty analyses to update
      }
      
      // Debug: print the first empty analysis
      if (emptyAnalyses.length > 0) {
        console.log(`Example empty analysis: categoryId=${emptyAnalyses[0].categoryId}, strengths=${emptyAnalyses[0].strengths?.length || 0}, weaknesses=${emptyAnalyses[0].weaknesses?.length || 0}, recommendations=${emptyAnalyses[0].recommendations?.length || 0}`);
      }
      
      // Get the latest category result for this student
      console.log('Looking for category results...');
      const categoryResult = await mongoose.model('CategoryResult').findOne({
        $or: [
          { studentId: studentObjectId },
          { studentId: studentId.toString() }
        ]
      }).sort({ assessmentDate: -1 });
      
      console.log(`Category result found: ${categoryResult ? 'Yes' : 'No'}`);
      
      // Update each empty analysis
      const updatedAnalyses = [];
      
      for (const analysis of emptyAnalyses) {
        console.log(`Processing empty analysis for category: ${analysis.categoryId}`);
        
        let score = 0;
        let categoryData = null;
        
        if (categoryResult) {
          // Find the corresponding category in the results
          const categoryName = this.normalizeCategoryName(analysis.categoryId);
          categoryData = categoryResult.categories.find(cat => 
            this.normalizeCategoryName(cat.categoryName) === categoryName
          );
          
          if (categoryData) {
            score = categoryData.score || 0;
            console.log(`Found matching category data with score: ${score}`);
          } else {
            console.log(`No matching category found in category result for: ${categoryName}`);
            // Debug: print all category names in the result
            if (categoryResult.categories && categoryResult.categories.length > 0) {
              console.log(`Available categories: ${categoryResult.categories.map(c => c.categoryName).join(', ')}`);
            }
          }
        }
        
        // If we have no category result or matching category, use the reading level to estimate a score
        if (!categoryData) {
          const readingLevel = analysis.readingLevel || user?.readingLevel || 'Low Emerging';
          
          // Estimate a score based on reading level
          switch(readingLevel) {
            case 'At Grade Level':
              score = 85; // High score for at grade level
              break;
            case 'Transitioning':
              score = 70; // Good score for transitioning
              break;
            case 'Developing':
              score = 45; // Medium score for developing
              break;
            case 'High Emerging':
              score = 25; // Low-medium score for high emerging
              break;
            case 'Low Emerging':
            default:
              score = 15; // Low score for low emerging
              break;
          }
          
          console.log(`No category data found for ${analysis.categoryId}, using estimated score ${score} based on reading level ${readingLevel}`);
        }
        
        // Generate content based on category and score
        console.log(`Generating content for ${analysis.categoryId} with score ${score}`);
        const generatedContent = this.generateAutomatedAnalysis(
          analysis.categoryId, 
          score,
          analysis.readingLevel || user?.readingLevel || 'Low Emerging'
        );
        
        console.log(`Generated content: strengths=${generatedContent.strengths.length}, weaknesses=${generatedContent.weaknesses.length}, recommendations=${generatedContent.recommendations.length}`);
        
        // Update the analysis
        analysis.strengths = generatedContent.strengths;
        analysis.weaknesses = generatedContent.weaknesses;
        analysis.recommendations = generatedContent.recommendations;
        analysis.updatedAt = new Date();
        
        // Save the updated analysis
        await analysis.save();
        console.log(`Updated analysis for ${analysis.categoryId} with score ${score}`);
        updatedAnalyses.push(analysis);
      }
      
      console.log(`Updated ${updatedAnalyses.length} analyses with new content`);
      
      // Return all analyses, including the updated ones
      return await PrescriptiveAnalysis.find({
        studentId: studentObjectId
      });
    } catch (error) {
      console.error('Error regenerating empty analyses:', error);
      throw error;
    }
  }

  /**
   * Ensure a student has prescriptive analysis records for all required categories
   * @param {string} studentId - Student ID (could be MongoDB ObjectId or idNumber)
   * @param {string} readingLevel - Student's reading level
   * @returns {Promise<Array>} Created or existing analyses
   */
  async ensureStudentHasAllAnalyses(studentId, readingLevel = 'Low Emerging') {
    try {
      // ⛔ If the student has never been assessed, bail out.
      if (!readingLevel || readingLevel === 'Not Assessed' || readingLevel === null) {
        console.log(`No prescriptive analyses for ${studentId}: reading level not assessed.`);
        return [];            // →  controller will send null to the UI
      }

      // Resolve studentId to MongoDB ObjectId
      let studentObjectId;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If studentId is already a valid ObjectId, use it directly
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        // If studentId is a string (like idNumber), look up the user
        console.log(`Looking up user with idNumber: ${studentId}`);
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        
        if (!user) {
          throw new Error(`Student not found with idNumber: ${studentId}`);
        }
        
        studentObjectId = user._id;
        readingLevel = user.readingLevel || readingLevel; // Use user's reading level if available
      }

      // Categories that should exist for every student
      const requiredCategories = [
        'Alphabet Knowledge',
        'Phonological Awareness',
        'Word Recognition',
        'Decoding',
        'Reading Comprehension'
      ];
      
      // Get existing analyses for this student
      const existingAnalyses = await PrescriptiveAnalysis.find({
        studentId: studentObjectId
      });
      
      const createdAnalyses = [];
      const updatedAnalyses = [];
      
      // Ensure each required category has an analysis record
      for (const categoryName of requiredCategories) {
        // Check if analysis exists for this category
        const existingAnalysis = existingAnalyses.find(a => 
          a.categoryId.toLowerCase() === categoryName.toLowerCase()
        );
        
        if (existingAnalysis) {
          // If reading level has changed, update it
          if (existingAnalysis.readingLevel !== readingLevel) {
            existingAnalysis.readingLevel = readingLevel;
            existingAnalysis.updatedAt = new Date();
            await existingAnalysis.save();
            updatedAnalyses.push(existingAnalysis);
          }
        } else {
          // Create new empty analysis for this category
          console.log(`Creating new analysis for ${categoryName}`);
          const newAnalysis = await PrescriptiveAnalysis.create({
            studentId: studentObjectId,
            categoryId: categoryName,
            readingLevel,
            strengths: [],
            weaknesses: [],
            recommendations: []
          });
          createdAnalyses.push(newAnalysis);
        }
      }
      
      console.log(`Student ${studentId}: Created ${createdAnalyses.length} new analyses, updated ${updatedAnalyses.length} existing analyses`);
      return [...existingAnalyses, ...createdAnalyses];
    } catch (error) {
      console.error(`Error ensuring analyses for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Update categoryResultId for a specific prescriptive analysis
   * This method is used to fix missing categoryResultId fields
   * @param {string} analysisId - Analysis ID
   * @returns {Promise<Object>} Updated analysis
   */
  async updateCategoryResultId(analysisId) {
    try {
      // Get the analysis
      const analysis = await PrescriptiveAnalysis.findById(analysisId);
      
      if (!analysis) {
        throw new Error(`Analysis not found with ID: ${analysisId}`);
      }
      
      // Skip if already has categoryResultId
      if (analysis.categoryResultId) {
        console.log(`Analysis ${analysisId} already has categoryResultId: ${analysis.categoryResultId}`);
        return analysis;
      }
      
      // Get the user to find their idNumber
      const usersCollection = mongoose.connection.db.collection('users');
      const user = await usersCollection.findOne({ 
        _id: mongoose.Types.ObjectId.isValid(analysis.studentId) 
          ? new mongoose.Types.ObjectId(analysis.studentId) 
          : analysis.studentId 
      });
      
      if (!user || !user.idNumber) {
        console.log(`Could not find user with idNumber for analysis ${analysisId}`);
        return analysis;
      }
      
      // Look for category results with this idNumber
      const categoryResults = await mongoose.model('CategoryResult').find({ 
        studentId: user.idNumber 
      });
      
      if (categoryResults.length === 0) {
        console.log(`No category results found for student ${user.idNumber}`);
        return analysis;
      }
      
      // Find a result that contains the matching category
      const matchingResult = categoryResults.find(result => 
        result.categories && 
        result.categories.some(cat => 
          cat.categoryName && 
          cat.categoryName.toLowerCase() === analysis.categoryId.toLowerCase()
        )
      );
      
      if (!matchingResult) {
        console.log(`No matching category result found for ${analysis.categoryId}`);
        return analysis;
      }
      
      // Update the analysis
      analysis.categoryResultId = matchingResult._id;
      await analysis.save();
      
      console.log(`Updated analysis ${analysisId} with categoryResultId ${matchingResult._id}`);
      return analysis;
    } catch (error) {
      console.error(`Error updating categoryResultId for analysis ${analysisId}:`, error);
      throw error;
    }
  }

  /**
   * Update categoryResultIds for all prescriptive analyses
   * This method finds all analyses without categoryResultId and updates them
   * @returns {Promise<Object>} Count of updated and failed analyses
   */
  async updateAllCategoryResultIds() {
    try {
      console.log('Starting update of all missing categoryResultIds...');
      
      // Find all analyses without categoryResultId
      const analyses = await PrescriptiveAnalysis.find({
        $or: [
          { categoryResultId: { $exists: false } },
          { categoryResultId: null }
        ]
      });
      
      console.log(`Found ${analyses.length} analyses without categoryResultId`);
      
      let updatedCount = 0;
      let failedCount = 0;
      
      // Update each analysis
      for (const analysis of analyses) {
        try {
          await this.updateCategoryResultId(analysis._id);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update categoryResultId for analysis ${analysis._id}:`, error);
          failedCount++;
        }
      }
      
      console.log(`Update complete. Updated ${updatedCount} analyses, failed ${failedCount} analyses.`);
      return { updated: updatedCount, failed: failedCount };
    } catch (error) {
      console.error('Error updating all categoryResultIds:', error);
      throw error;
    }
  }
}

module.exports = new PrescriptiveAnalysisService(); 