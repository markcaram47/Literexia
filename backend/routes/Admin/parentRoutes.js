const express = require('express');
const router = express.Router();
const parentAdminController = require('../../controllers/parentAdminController');
const multer = require('multer');
const upload = multer();

// Create parent (admin)
router.post('/parents', upload.single('profileImage'), parentAdminController.createParent);

// Update parent (admin)
router.put('/parents/:id', upload.single('profileImage'), parentAdminController.updateParent);

// Delete parent (admin)
router.delete('/parents/:id', parentAdminController.deleteParent);

module.exports = router; 