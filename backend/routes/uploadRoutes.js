const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const uploadAuthMiddleware = require('../middleware/uploadAuthMiddleware');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[uploadRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes for file uploads - using the special auth middleware for uploads
router.post('/pdf', uploadAuthMiddleware, UploadController.uploadPdfToS3);

// Routes for getting PDFs - no auth required
router.get('/pdf/:id', UploadController.getPdf);
router.get('/pdf/local/:id', UploadController.getPdf);

module.exports = router; 