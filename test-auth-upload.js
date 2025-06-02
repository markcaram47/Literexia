const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

// Create a simple PDF buffer
const testPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj\n<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>\nendobj\n4 0 obj\n<</Length 23>>stream\nBT /F1 12 Tf 100 700 Td (Test PDF) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \n0000000192 00000 n \ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n265\n%%EOF');

// Write the PDF to a temporary file
const tempFilePath = path.join(__dirname, 'temp-test.pdf');
fs.writeFileSync(tempFilePath, testPdf);

// Create a FormData object
const form = new FormData();
form.append('pdfFile', fs.createReadStream(tempFilePath), 'test-upload-auth.pdf');
form.append('studentId', 'test-student-api-123');
form.append('parentId', 'test-parent-api-456');

// Create a valid JWT token
const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'your-secret-key';
const token = jwt.sign(
  { 
    id: '681b690af9fd9071c6ac2f3a', 
    email: 'teacher@gmail.com', 
    roles: ['teacher'] 
  }, 
  secretKey, 
  { expiresIn: '1h' }
);

console.log('Testing PDF upload with valid token...');

// Make the API request
axios.post('http://localhost:5001/api/uploads/pdf', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('✅ Upload successful!');
  console.log('Response:', JSON.stringify(response.data, null, 2));
  fs.unlinkSync(tempFilePath);
})
.catch(error => {
  console.error('❌ Upload failed:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', JSON.stringify(error.response.data, null, 2));
  }
  fs.unlinkSync(tempFilePath);
}); 