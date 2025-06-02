// Test script to check if the main_assessment collection exists and has data
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB at', mongoUri);

    // Get the test database and main_assessment collection
    const testDb = mongoose.connection.useDb('test');
    const mainAssessmentCollection = testDb.collection('main_assessment');

    // Check if the collection exists
    console.log('Checking if main_assessment collection exists...');
    const collections = await testDb.listCollections({ name: 'main_assessment' }).toArray();
    if (collections.length === 0) {
      console.log('Collection main_assessment does not exist!');
      
      // Create the collection with a sample document
      console.log('Creating main_assessment collection with a sample document...');
      await mainAssessmentCollection.insertOne({
        readingLevel: 'Low Emerging',
        category: 'Alphabet Knowledge',
        questions: [
          {
            questionType: 'patinig',
            questionText: 'Sample Question',
            questionId: 'AK_001',
            choiceOptions: [
              { optionId: '1', optionText: 'Option 1', isCorrect: true, description: 'Correct answer' },
              { optionId: '2', optionText: 'Option 2', isCorrect: false, description: 'Incorrect answer' }
            ],
            order: 1
          }
        ],
        isActive: true,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Sample document created successfully!');
    } else {
      console.log('Collection main_assessment exists!');

      // Count documents
      const count = await mainAssessmentCollection.countDocuments();
      console.log(`Collection has ${count} documents`);

      // Get a sample of documents
      const documents = await mainAssessmentCollection.find({}).limit(5).toArray();
      console.log('Sample documents:');
      if (documents.length === 0) {
        console.log('No documents found in collection!');
        
        // Create a sample document
        console.log('Creating a sample document...');
        await mainAssessmentCollection.insertOne({
          readingLevel: 'Low Emerging',
          category: 'Alphabet Knowledge',
          questions: [
            {
              questionType: 'patinig',
              questionText: 'Sample Question',
              questionId: 'AK_001',
              choiceOptions: [
                { optionId: '1', optionText: 'Option 1', isCorrect: true, description: 'Correct answer' },
                { optionId: '2', optionText: 'Option 2', isCorrect: false, description: 'Incorrect answer' }
              ],
              order: 1
            }
          ],
          isActive: true,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('Sample document created successfully!');
      } else {
        documents.forEach((doc, i) => {
          console.log(`Document ${i + 1}:`);
          console.log(` - ID: ${doc._id}`);
          console.log(` - Reading Level: ${doc.readingLevel}`);
          console.log(` - Category: ${doc.category}`);
          console.log(` - Questions: ${doc.questions ? doc.questions.length : 0}`);
          console.log(` - Active: ${doc.isActive}`);
          console.log(` - Status: ${doc.status}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main(); 