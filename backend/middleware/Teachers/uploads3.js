// backend/middleware/uploads3.js
const multer       = require('multer');
const { Upload }   = require('@aws-sdk/lib-storage');
const s3Client     = require('../../config/s3');
const { PassThrough } = require('stream');

const uploadParser = multer().single('file');

module.exports = (req, res, next) => {
  uploadParser(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const pass = new PassThrough();
    pass.end(req.file.buffer);

    const uploader = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key:    `uploads/${Date.now()}-${req.file.originalname}`,
        Body:   pass,
        ACL:    'public-read'        
      },
    });

    try {
      const data = await uploader.done();
      // 4) Respond with the S3 URL
      res.json({
        message: 'File uploaded successfully',
        url:     data.Location
      });
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};
