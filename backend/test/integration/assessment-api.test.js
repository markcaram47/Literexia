// test/integration/assessment-api.test.js
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';
const TEST_TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'teacherr@gmail.com';
const TEST_TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD || 'password123';
const TEST_STUDENT_ID = process.env.TEST_STUDENT_ID || '68125915b88c31eb282bdac2'; // Rainer Aganan

// Test data
let authToken;
let categoryIds = [];

// Setup function to get auth token
async function setup() {
  try {
    console.log('Setting up test environment...');
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_TEACHER_EMAIL,
      password: TEST_TEACHER_PASSWORD
    });
    
    authToken = loginResponse.data.token;
    console.log('Authentication successful');
    
    // Get assessment categories for testing
    const categoriesResponse = await axios.get(`${API_BASE_URL}/assessment/categories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    categoryIds = categoriesResponse.data
      .filter(cat => cat.categoryID)
      .map(cat => cat.categoryID);
    
    console.log(`Found ${categoryIds.length} assessment categories`);
    
    return true;
  } catch (error) {
    console.error('Setup failed:', error.message);
    throw error;
  }
}

// Run the tests
async function runTests() {
  try {
    // Setup environment
    await setup();
    
    // 1. Test getting student details
    console.log('\n--- Test: Get Student Details ---');
    try {
      const studentResponse = await axios.get(`${API_BASE_URL}/student/student/${TEST_STUDENT_ID}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Student details retrieved successfully:');
      console.log(`Name: ${studentResponse.data.firstName} ${studentResponse.data.lastName}`);
      console.log(`Reading Level: ${studentResponse.data.readingLevel}`);
      console.log('✅ Test passed');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    // 2. Test getting category progress
    console.log('\n--- Test: Get Category Progress ---');
    try {
      const progressResponse = await axios.get(`${API_BASE_URL}/assessment/category-progress/${TEST_STUDENT_ID}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Category progress retrieved successfully:');
      console.log(`Categories: ${progressResponse.data.categories ? progressResponse.data.categories.length : 0}`);
      console.log(`Completed: ${progressResponse.data.completedCategories || 0}/${progressResponse.data.totalCategories || 0}`);
      console.log('✅ Test passed');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    // 3. Test assigning categories
    console.log('\n--- Test: Assign Categories ---');
    try {
      // Use the first category found in setup
      const categoryToAssign = categoryIds[0] || 1;
      
      const assignResponse = await axios.post(`${API_BASE_URL}/assessment/assign-categories`, {
        studentId: TEST_STUDENT_ID,
        readingLevel: 'Low Emerging',
        categories: [
          { categoryId: categoryToAssign, categoryName: `Category ${categoryToAssign}` }
        ]
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Category assignment response:');
      console.log(`Success: ${assignResponse.data.success}`);
      console.log(`Message: ${assignResponse.data.message}`);
      console.log(`Assignments: ${assignResponse.data.assignments ? assignResponse.data.assignments.length : 0}`);
      console.log('✅ Test passed');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    // 4. Test getting recommendations
    console.log('\n--- Test: Get Recommendations ---');
    try {
      const recommendationsResponse = await axios.get(`${API_BASE_URL}/assessment/recommendations/${TEST_STUDENT_ID}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Recommendations retrieved successfully:');
      console.log(`Count: ${recommendationsResponse.data.length}`);
      console.log('✅ Test passed');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    // 5. Test getting assessment assignments
    console.log('\n--- Test: Get Assessment Assignments ---');
    try {
      const assignmentsResponse = await axios.get(`${API_BASE_URL}/assessment/assessment-assignments/${TEST_STUDENT_ID}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      console.log('Assignments retrieved successfully:');
      console.log(`Count: ${assignmentsResponse.data.length}`);
      console.log('✅ Test passed');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run the tests
runTests();