const mongoose = require('mongoose');
const User = require('../../models/userModel');

/**
 * Service for handling category results data
 * Includes automatic migration of studentIds to studentObjectIds
 */
class CategoryResultsService {
  /**
   * Run automatic migration of studentIds to studentObjectIds
   * This is called on server startup
   */
  static async migrateStudentIds() {
    try {
      console.log('Starting automatic migration of category_results...');
      
      // Get collections
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');
      const usersCollection = testDb.collection('users');
      
      // Get all category results that don't have studentObjectId
      const categoryResults = await categoryResultsCollection.find({
        studentObjectId: { $exists: false }
      }).toArray();
      
      if (categoryResults.length === 0) {
        console.log('✓ No category results need migration - all records have studentObjectId');
        return;
      }
      
      console.log(`Found ${categoryResults.length} category results to process`);
      
      let updatedCount = 0;
      let errorCount = 0;
      
      // Process each category result
      for (const result of categoryResults) {
        try {
          // Extract studentId as string
          const studentIdStr = result.studentId ? result.studentId.toString() : null;
          
          if (!studentIdStr) {
            console.error(`! Missing studentId for category result ${result._id}`);
            errorCount++;
            continue;
          }
          
          // If studentId is a valid ObjectId, use it directly
          if (mongoose.Types.ObjectId.isValid(studentIdStr)) {
            // Check if this ObjectId exists in users collection
            const userExists = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentIdStr) });
            
            if (userExists) {
              await categoryResultsCollection.updateOne(
                { _id: result._id },
                { 
                  $set: { 
                    studentObjectId: new mongoose.Types.ObjectId(studentIdStr),
                    updatedAt: new Date()
                  } 
                }
              );
              
              console.log(`✓ Updated category result ${result._id}: set studentObjectId to ${studentIdStr} (direct ObjectId)`);
              updatedCount++;
              continue;
            }
          }
          
          // Find user by idNumber
          const user = await usersCollection.findOne({ idNumber: studentIdStr });
          
          if (!user) {
            console.error(`! Could not find user with idNumber: ${studentIdStr}`);
            errorCount++;
            continue;
          }
          
          // Update the category result with user's ObjectId
          await categoryResultsCollection.updateOne(
            { _id: result._id },
            { 
              $set: { 
                studentObjectId: user._id,
                updatedAt: new Date()
              } 
            }
          );
          
          console.log(`✓ Updated category result ${result._id}: added studentObjectId ${user._id} for studentId ${studentIdStr}`);
          updatedCount++;
        } catch (error) {
          console.error(`! Error processing category result ${result._id}:`, error);
          errorCount++;
        }
      }
      
      console.log('\nAutomatic migration completed:');
      console.log(`- Total records processed: ${categoryResults.length}`);
      console.log(`- Updated: ${updatedCount}`);
      console.log(`- Errors: ${errorCount}`);
      
    } catch (error) {
      console.error('Automatic migration failed:', error);
    }
  }

  // Get category results for a student
  static async getCategoryResults(studentId) {
    try {
      console.log(`Fetching category results for student ID: ${studentId}`);
      
      // Get collections
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');
      
      // Find by studentId or studentObjectId
      const query = mongoose.Types.ObjectId.isValid(studentId) 
        ? { $or: [{ studentId }, { studentObjectId: new mongoose.Types.ObjectId(studentId) }] }
        : { studentId };
        
      const results = await categoryResultsCollection
        .find(query)
        .sort({ assessmentDate: -1, createdAt: -1 })
        .toArray();
      
      if (results.length === 0) {
        console.log('No category results found');
        return null;
      }
      
      console.log(`Found ${results.length} category results`);
      return results[0]; // Return the most recent result
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId}:`, error);
      return null;
    }
  }

  /**
   * Get the most recent category result for a specific category and student
   * @param {string} studentId - Student ID or ObjectId
   * @param {string} categoryName - The category name to filter by
   * @returns {Promise<Object|null>} - The most recent category result or null
   */
  static async getCategoryResultByCategory(studentId, categoryName) {
    try {
      console.log(`Fetching category results for student ID: ${studentId} and category: ${categoryName}`);
      
      // Get collections
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');
      const usersCollection = testDb.collection('users');
      
      // Build query based on studentId type
      let query = {};
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If valid ObjectId, search by both ObjectId and string ID
        query = {
          $or: [
            { studentId },
            { studentObjectId: new mongoose.Types.ObjectId(studentId) }
          ]
        };
      } else {
        // Try to find user by idNumber first
        const user = await usersCollection.findOne({ idNumber: studentId });
        
        if (user) {
          // If user found, search by both string ID and ObjectId
          query = {
            $or: [
              { studentId },
              { studentObjectId: user._id }
            ]
          };
        } else {
          // If no user found, search only by string ID
          query = { studentId };
        }
      }
      
      // Add category filter
      query['categories.categoryName'] = categoryName;
      
      console.log('Category result query:', JSON.stringify(query));
      
      // Find the most recent result
      const result = await categoryResultsCollection
        .findOne(query, {
          sort: { assessmentDate: -1, createdAt: -1 }
        });
      
      if (!result) {
        console.log(`No category results found for category ${categoryName}`);
        return null;
      }
      
      console.log(`Found category result ${result._id} for category ${categoryName}`);
      return result;
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId} and category ${categoryName}:`, error);
      return null;
    }
  }

  // Helper function to normalize category data format
  static normalizeCategories(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }
    
    return categories.map(category => ({
      categoryName: category.categoryName || 'Unknown Category',
      totalQuestions: category.totalQuestions || 0,
      correctAnswers: category.correctAnswers || 0,
      score: category.score || 0,
      isPassed: category.isPassed || false,
      passingThreshold: category.passingThreshold || 75
    }));
  }
}

module.exports = CategoryResultsService; 