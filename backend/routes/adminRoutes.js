const express = require('express');
const router = express.Router();
const { sendCredentials } = require('../controllers/emailController');

// Import your other controllers
const teacherController = require('../controllers/teacherController');
const parentController = require('../controllers/parentController');
// ... other controller imports ...

// Teacher routes
router.post('/manage/teachers', teacherController.createTeacher);
router.get('/manage/teachers', teacherController.getAllTeachers);
router.put('/manage/teachers/:id', teacherController.updateTeacher);
router.delete('/manage/teachers/:id', teacherController.deleteTeacher);

// Parent routes
router.post('/manage/parents', parentController.createParent);
router.get('/manage/parents', parentController.getAllParents);
router.put('/manage/parents/:id', parentController.updateParent);
router.delete('/manage/parents/:id', parentController.deleteParent);

// Email credentials route
router.post('/send-credentials', sendCredentials);

module.exports = router; 