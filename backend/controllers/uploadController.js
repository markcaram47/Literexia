const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-2'
});

// Local storage path for fallback
const LOCAL_STORAGE_PATH = path.join(__dirname, '..', 'storage', 'pdf-reports');

// Ensure storage directory exists
try {
  if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
    fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
    console.log(`Created local storage directory: ${LOCAL_STORAGE_PATH}`);
  }
} catch (err) {
  console.error(`Error creating local storage directory: ${err.message}`);
}

class UploadController {
  /**
   * Upload a PDF file to S3
   */
  static async uploadPdfToS3(req, res) {
    try {
      const { filename, data, contentType, metadata, studentId, parentId } = req.body;
      
      if (!filename || !data) {
        return res.status(400).json({
          success: false,
          error: 'Filename and data are required'
        });
      }
      
      console.log(`[UploadController] Processing upload request for file: ${filename}`);
      console.log(`[UploadController] Student ID: ${studentId}, Parent ID: ${parentId}`);
      
      // Decode base64 data
      const buffer = Buffer.from(data, 'base64');
      
      // Generate a unique S3 key with better folder organization
      // Format: pdf-reports/[studentId]/[parentId]/[timestamp]-[filename]
      const timestamp = Date.now();
      const folderPrefix = studentId && parentId 
        ? `pdf-reports/${studentId}/${parentId}/`
        : 'pdf-reports/general/';
      
      const key = `${folderPrefix}${timestamp}-${filename}`;
      
      console.log(`[UploadController] Generated S3 key: ${key}`);
      
      // S3 upload parameters
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME || 'literexia-bucket',
        Key: key,
        Body: buffer,
        ContentType: contentType || 'application/pdf',
        ContentDisposition: 'inline',
        ACL: 'public-read',
        Metadata: {
          ...metadata,
          studentId: studentId || 'unknown',
          parentId: parentId || 'unknown',
          uploadedBy: req.user?.id || 'system',
          uploadedAt: new Date().toISOString()
        }
      };
      
      // Temporary solution if S3 is not set up yet
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.log('[UploadController] S3 not configured, simulating upload');
        
        // In a development environment, simulate successful upload
        // and store the PDF data in a database instead
        try {
          // Store in MongoDB temporarily (for development)
          const db = mongoose.connection.useDb('uploads');
          const uploadsCollection = db.collection('pdf_uploads');
          
          const result = await uploadsCollection.insertOne({
            key,
            filename,
            contentType: contentType || 'application/pdf',
            data: data, // Store base64 data
            metadata: {
              ...metadata,
              uploadedBy: req.user?.id || 'system',
              uploadedAt: new Date()
            },
            createdAt: new Date()
          });
          
          if (!result.acknowledged) {
            throw new Error('Failed to store PDF data');
          }
          
          // Return a simulated S3 URL
          const simulatedUrl = `/api/uploads/pdf/${result.insertedId}`;
          
          return res.json({
            success: true,
            message: 'PDF stored successfully (S3 simulation)',
            fileUrl: simulatedUrl,
            key: result.insertedId.toString()
          });
        } catch (dbError) {
          console.error('[UploadController] Error storing PDF data in MongoDB:', dbError);
          console.log('[UploadController] Attempting to store PDF in filesystem as final fallback');
          
          // Last resort - try to store in the filesystem
          try {
            // Generate a unique filename
            const uniqueFilename = `${Date.now()}-${uuidv4()}.pdf`;
            const filePath = path.join(LOCAL_STORAGE_PATH, uniqueFilename);
            
            // Write the file
            fs.writeFileSync(filePath, buffer);
            console.log(`[UploadController] PDF saved to filesystem: ${filePath}`);
            
            // Create a metadata file alongside the PDF
            const metadataFilePath = `${filePath}.json`;
            fs.writeFileSync(
              metadataFilePath, 
              JSON.stringify({
                originalFilename: filename,
                contentType: contentType || 'application/pdf',
                metadata: {
                  ...metadata,
                  uploadedBy: req.user?.id || 'system',
                  uploadedAt: new Date()
                },
                createdAt: new Date()
              }, null, 2)
            );
            
            // Return a simulated URL that points to the local file
            const fileUrl = `/api/uploads/pdf/local/${uniqueFilename}`;
            
            return res.json({
              success: true,
              message: 'PDF stored successfully in filesystem (fallback)',
              fileUrl: fileUrl,
              key: uniqueFilename
            });
          } catch (fsError) {
            console.error('[UploadController] Error storing PDF in filesystem:', fsError);
            return res.status(500).json({
              success: false,
              error: 'Failed to store PDF data in any storage system',
              message: fsError.message
            });
          }
        }
      }
      
      // Upload to S3
      try {
        const uploadResult = await s3.upload(params).promise();
        
        console.log('[UploadController] PDF uploaded to S3:', uploadResult.Location);
        
        res.json({
          success: true,
          message: 'PDF uploaded successfully',
          fileUrl: uploadResult.Location,
          key: uploadResult.Key
        });
      } catch (s3Error) {
        console.error('[UploadController] S3 upload error:', s3Error);
        res.status(500).json({
          success: false,
          error: 'Failed to upload to S3',
          message: s3Error.message
        });
      }
    } catch (error) {
      console.error('[UploadController] Error uploading PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload PDF',
        message: error.message
      });
    }
  }
  
  /**
   * Get a PDF from storage (S3 or database)
   */
  static async getPdf(req, res) {
    try {
      const { id } = req.params;
      
      // Check if this is a local file request
      if (req.path.startsWith('/local/')) {
        const filename = path.basename(id);
        const filePath = path.join(LOCAL_STORAGE_PATH, filename);
        
        console.log(`[UploadController] Attempting to serve local file: ${filePath}`);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({
            success: false,
            error: 'PDF file not found in local storage'
          });
        }
        
        // Read metadata if available
        let contentType = 'application/pdf';
        try {
          const metadataPath = `${filePath}.json`;
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            if (metadata.contentType) {
              contentType = metadata.contentType;
            }
          }
        } catch (metadataErr) {
          console.warn(`[UploadController] Error reading metadata for ${filename}:`, metadataErr.message);
        }
        
        // Set headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        return fileStream.pipe(res);
      }
      
      // Check if we're using the S3 simulation
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.log('[UploadController] S3 not configured, retrieving from database');
        
        try {
          // Retrieve from MongoDB
          const db = mongoose.connection.useDb('uploads');
          const uploadsCollection = db.collection('pdf_uploads');
          
          // Convert id to ObjectId if it's a valid format
          let objectId;
          try {
            objectId = new mongoose.Types.ObjectId(id);
          } catch (err) {
            return res.status(400).json({
              success: false,
              error: 'Invalid ID format'
            });
          }
          
          const upload = await uploadsCollection.findOne({ _id: objectId });
          
          if (!upload) {
            return res.status(404).json({
              success: false,
              error: 'PDF not found'
            });
          }
          
          // Set response headers
          res.setHeader('Content-Type', upload.contentType || 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + upload.filename + '"');
          
          // Send the PDF data
          const buffer = Buffer.from(upload.data, 'base64');
          return res.send(buffer);
        } catch (dbError) {
          console.error('[UploadController] Error retrieving PDF data:', dbError);
          return res.status(500).json({
            success: false,
            error: 'Failed to retrieve PDF data',
            message: dbError.message
          });
        }
      }
      
      // Get from S3
      try {
        const params = {
          Bucket: process.env.AWS_BUCKET_NAME || 'literexia-bucket',
          Key: id
        };
        
        // Check if the object exists
        await s3.headObject(params).promise();
        
        // Generate a public URL instead of a signed URL
        const publicUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${params.Key}`;
        
        // Redirect to the public URL
        res.redirect(publicUrl);
      } catch (s3Error) {
        console.error('[UploadController] S3 download error:', s3Error);
        
        if (s3Error.code === 'NotFound') {
          return res.status(404).json({
            success: false,
            error: 'PDF not found in S3'
          });
        }
        
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve from S3',
          message: s3Error.message
        });
      }
    } catch (error) {
      console.error('[UploadController] Error retrieving PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve PDF',
        message: error.message
      });
    }
  }
}

module.exports = UploadController; 