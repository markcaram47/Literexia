// routes/Teachers/categoryProgressRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const categoryProgressController = require('../../controllers/Teachers/ManageProgress/categoryProgressController');

// Get category progress for a student
router.get('/category-progress/:id', categoryProgressController.getCategoryProgress);

module.exports = router;