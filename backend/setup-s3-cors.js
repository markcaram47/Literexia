const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load CORS configuration
const corsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'config/cors-s3-config.json'), 'utf8')
);

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function setupCORS() {
  try {
    const bucketName = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
    
    console.log(`Setting up CORS for bucket: ${bucketName}`);
    console.log('CORS Configuration:', JSON.stringify(corsConfig, null, 2));
    
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfig
    });
    
    const response = await s3Client.send(command);
    console.log('✅ CORS configuration applied successfully!');
    console.log('Response:', response);
    
    console.log(`\nYour S3 bucket ${bucketName} is now configured to accept requests from any origin.`);
    console.log('You can now upload files directly to S3 from your frontend application.');
    
  } catch (error) {
    console.error('❌ Error applying CORS configuration:', error);
  }
}

// Run the setup
setupCORS(); 