// backend/routes/Teachers/uploadFile.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');

const router = express.Router();

// Define a simple Student schema if the model file is missing
const StudentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  profileImageUrl: String,
  idNumber: String
}, { collection: 'users' });

// use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('file');
const imageUpload = multer({ storage }).single('image');

// bind the Student model to the same DB your studentRoutes use
const Student = mongoose
    .connection
    .useDb('test')                   // <— switch this to whatever DB you're using
    .model('Student', StudentSchema, 'users');

// Add a S3 upload endpoint that doesn't require authentication
router.post('/s3', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('[S3 UPLOAD] Error:', err);
      return res.status(400).json({
        success: false,
        message: 'Upload error',
        error: err.message
      });
    }
    
    if (!req.file) {
      console.error('[S3 UPLOAD] No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    try {
      const uploadPath = req.body.path || 'main-assessment';
      const fileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '-')}`;
      
      console.log(`[S3 UPLOAD] Uploading file to ${uploadPath}/${fileName}`);
      
      // Configure S3 upload
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME || 'literexia-bucket',
        Key: `${uploadPath}/${fileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read'
      };
      
      try {
        // Try to upload to S3
        await s3Client.send(new PutObjectCommand(s3Params));
        
        console.log('[S3 UPLOAD] Upload successful');
        
        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          filename: fileName
        });
      } catch (s3Error) {
        console.error('[S3 UPLOAD] S3 error:', s3Error);
        
        // In development, mock a successful response
        if (process.env.NODE_ENV !== 'production') {
          console.log('[S3 UPLOAD] Using mock response for development');
          
          return res.status(200).json({
            success: true,
            message: 'Development mode: Mocked successful upload',
            filename: fileName,
            mock: true
          });
        }
        
        throw s3Error;
      }
    } catch (error) {
      console.error('[S3 UPLOAD] Failed:', error);
      return res.status(500).json({
        success: false,
        message: 'S3 upload failed',
        error: error.message
      });
    }
  });
});

router.post('/upload', (req, res) => {
    console.log('Upload endpoint hit');
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).json({ message: 'Upload error', error: err.message });
        }
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { studentId } = req.body;
        const ext = path.extname(req.file.originalname);
        const filename = `${Date.now()}-${req.file.originalname}`;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME || 'literexia-bucket',
            Key: `student-profiles/${filename}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        try {
            console.log('Attempting S3 upload to:', s3Params.Key);
            await s3Client.send(new PutObjectCommand(s3Params));

            // build the correct URL from your bucket + region
            const region = s3Client?.config?.region || 'us-east-1';
            const bucket = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
            const url = `https://${bucket}.s3.${region}.amazonaws.com/student-profiles/${filename}`;
            console.log('S3 upload successful, URL:', url);

            // save it on the **same** DB/collection your GET uses
            if (studentId && studentId !== 'template') {
                try {
                    const student = await Student.findById(studentId);
                    if (!student) {
                        console.warn('Student not found:', studentId);
                    } else {
                        student.profileImageUrl = url;
                        await student.save();
                        console.log('Updated student profile image');
                    }
                } catch (studentErr) {
                    console.error('Error updating student:', studentErr);
                }
            }

            return res.json({ message: 'Upload successful', imageUrl: url });
        } catch (uploadErr) {
            console.error('S3 upload failed:', uploadErr);
            return res.status(500).json({ message: 'S3 upload failed', error: uploadErr.message });
        }
    });
});

// New route for uploading template images
router.post('/template-image', (req, res) => {
    console.log('Template image upload endpoint hit');
    imageUpload(req, res, async (err) => {
        if (err) {
            console.error('Template image upload error:', err);
            return res.status(400).json({ 
                success: false,
                message: 'Upload error', 
                error: err.message 
            });
        }
        
        if (!req.file) {
            console.error('No image file uploaded');
            return res.status(400).json({ 
                success: false,
                message: 'No image file uploaded' 
            });
        }
        
        // Generate a unique filename
        const timestamp = Date.now();
        const originalName = req.file.originalname.replace(/\s+/g, '-').toLowerCase();
        const filename = `${timestamp}-${originalName}`;
        
        // Use the designated folder for sentence templates
        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME || 'literexia-bucket',
            Key: `main-assessment/sentences/${filename}`, // Use the designated folder path
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };
        
        try {
            console.log('Attempting to upload to S3:', s3Params.Key);
            
            // Try to upload to S3
            try {
                await s3Client.send(new PutObjectCommand(s3Params));
                
                // Build the correct URL
                const region = s3Client?.config?.region || 'us-east-1';
                const bucket = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
                const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/main-assessment/sentences/${filename}`;
                
                console.log('S3 upload successful, URL:', imageUrl);
                
                return res.status(200).json({
                    success: true,
                    message: 'Template image uploaded successfully',
                    imageUrl: imageUrl
                });
            } catch (s3Error) {
                console.error('S3 upload error:', s3Error);
                
                // If S3 upload fails, fallback to a mock URL for development
                if (process.env.NODE_ENV !== 'production') {
                    const mockImageUrl = `https://literexia-bucket.s3.amazonaws.com/main-assessment/sentences/${timestamp}-${originalName}`;
                    
                    console.log('Using mock S3 URL for development:', mockImageUrl);
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Development mode: Using mock S3 URL',
                        imageUrl: mockImageUrl,
                        isMock: true
                    });
                }
                
                throw s3Error;
            }
        } catch (error) {
            console.error('Template image processing error:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to process template image', 
                error: error.message 
            });
        }
    });
});

module.exports = router;
