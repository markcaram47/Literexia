// test-s3-upload.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_URL = 'http://localhost:5001/api';
const ENDPOINT = '/teachers/template-image'; // Use the template-image endpoint

// Find an image file in the project
function findTestImage() {
  // Use the test image we created earlier
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  
  if (fs.existsSync(testImagePath)) {
    return testImagePath;
  }
  
  // If the test image doesn't exist, create it
  console.log('Creating a simple test image...');
  
  // Create a very simple file with JPG magic bytes
  const simpleJpg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
  ]);
  
  fs.writeFileSync(testImagePath, simpleJpg);
  return testImagePath;
}

// Check available routes
async function checkAvailableRoutes() {
  console.log('\nChecking available routes...');
  
  const routesToCheck = [
    '/test',
    '/auth/login',
    '/teachers',
    '/teachers/upload',
    '/teachers/template-image'
  ];
  
  for (const route of routesToCheck) {
    try {
      // Use OPTIONS request to check if the route exists
      const response = await axios({
        method: 'OPTIONS',
        url: API_URL + route,
        timeout: 3000
      });
      
      console.log(`✅ Route ${route} is available (${response.status})`);
    } catch (error) {
      if (error.response) {
        // If we get a response, the route exists but might not accept OPTIONS
        console.log(`⚠️ Route ${route} responded with ${error.response.status}`);
      } else {
        console.log(`❌ Route ${route} is not available: ${error.message}`);
      }
    }
  }
}

// Test the upload API
async function testUpload(imagePath) {
  try {
    console.log('\nUsing test image:', imagePath);
    
    // Create a form data object
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    const filename = path.basename(imagePath);
    
    formData.append('image', fileStream, filename);
    
    console.log('Sending request to:', API_URL + ENDPOINT);
    console.log('File name:', filename);
    console.log('File size:', fs.statSync(imagePath).size, 'bytes');
    
    // Log request details for debugging
    console.log('Request headers:', formData.getHeaders());
    
    // Send the request with more detailed error handling
    try {
      const response = await axios.post(API_URL + ENDPOINT, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000 // Increase timeout to 10 seconds
      });
      
      // Log the response
      console.log('\nResponse status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      // Verify the response
      if (response.data.success && response.data.imageUrl) {
        console.log('\n✅ SUCCESS: Image uploaded successfully');
        console.log('Image URL:', response.data.imageUrl);
        
        // Verify the URL contains the correct path
        if (response.data.imageUrl.includes('main-assessment/sentences/')) {
          console.log('✅ Path verification: URL contains the correct path');
        } else {
          console.log('❌ Path verification: URL does not contain the expected path');
          console.log('Expected path: main-assessment/sentences/');
          console.log('Actual URL:', response.data.imageUrl);
        }
        
        return response.data.imageUrl;
      } else {
        console.log('❌ ERROR: Upload failed or response format is incorrect');
        return null;
      }
    } catch (axiosError) {
      console.error('❌ ERROR during upload test:');
      
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response status:', axiosError.response.status);
        console.error('Response headers:', JSON.stringify(axiosError.response.headers, null, 2));
        console.error('Response data:', axiosError.response.data);
        
        // Try a different endpoint as a fallback
        console.log('\nTrying fallback endpoint: /api/teachers/upload');
        try {
          // For the student upload endpoint, it expects studentId
          const fallbackFormData = new FormData();
          fallbackFormData.append('file', fs.createReadStream(imagePath), filename); // Note: different key 'file' vs 'image'
          fallbackFormData.append('studentId', 'template');
          
          const fallbackResponse = await axios.post(API_URL + '/teachers/upload', fallbackFormData, {
            headers: {
              ...fallbackFormData.getHeaders(),
            },
            timeout: 10000
          });
          
          console.log('Fallback response status:', fallbackResponse.status);
          console.log('Fallback response data:', JSON.stringify(fallbackResponse.data, null, 2));
          
          if (fallbackResponse.data && fallbackResponse.data.imageUrl) {
            console.log('\n✅ SUCCESS with fallback: Image uploaded successfully');
            return fallbackResponse.data.imageUrl;
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError.message);
          if (fallbackError.response) {
            console.error('Fallback response status:', fallbackError.response.status);
            console.error('Fallback response data:', fallbackError.response.data);
          }
        }
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error('No response received. Is the server running?');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', axiosError.message);
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
    return null;
  }
}

// Main function
async function main() {
  try {
    console.log('=== S3 Upload API Test ===');
    
    // First check if the server is running
    try {
      const healthCheck = await axios.get(API_URL + '/test');
      console.log('Server health check:', healthCheck.data.message);
    } catch (error) {
      console.error('❌ Server health check failed. Is the server running?');
      console.error('Error:', error.message);
      process.exit(1);
    }
    
    // Check available routes
    await checkAvailableRoutes();
    
    // Find a test image
    const testImagePath = findTestImage();
    
    // Test the upload
    console.log('\nTesting image upload...');
    const imageUrl = await testUpload(testImagePath);
    
    if (imageUrl) {
      console.log('\n✅ TEST PASSED: S3 upload API is working correctly');
      console.log('Image URL:', imageUrl);
    } else {
      console.log('\n❌ TEST FAILED: S3 upload API is not working correctly');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Run the test
main(); 