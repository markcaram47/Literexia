const express = require('express');
const router = express.Router();
const { sendCredentials } = require('../controllers/emailController');

// Email credentials route
router.post('/send-credentials', sendCredentials);

module.exports = router; 