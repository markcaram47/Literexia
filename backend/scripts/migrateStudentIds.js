/**
 * Migration script to update existing category_results records
 * Maps studentId to corresponding User ObjectId while keeping original studentId
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017', {
      dbName: 'test',
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 60000
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function migrateStudentIds() {
  try {
    console.log('Starting migration of category_results to add studentObjectId fields...');
    
    // Get collections
    const testDb = mongoose.connection.useDb('test');
    const categoryResultsCollection = testDb.collection('category_results');
    const usersCollection = testDb.collection('users');
    
    // Get all category results
    const categoryResults = await categoryResultsCollection.find({}).toArray();
    console.log(`Found ${categoryResults.length} category results to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Process each category result
    for (const result of categoryResults) {
      try {
        // Skip if studentObjectId is already set
        if (result.studentObjectId && mongoose.Types.ObjectId.isValid(result.studentObjectId)) {
          console.log(`✓ Record ${result._id} already has studentObjectId: ${result.studentObjectId}`);
          skippedCount++;
          continue;
        }
        
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
    
    console.log('\nMigration completed:');
    console.log(`- Total records: ${categoryResults.length}`);
    console.log(`- Updated: ${updatedCount}`);
    console.log(`- Skipped (already valid): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
connectDB()
  .then(() => migrateStudentIds())
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in migration script:', err);
    process.exit(1);
  }); 