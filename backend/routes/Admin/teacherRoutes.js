const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const teacherProfileController = require('../../controllers/Teachers/teacherProfileController');
const studentAdminController = require('../../controllers/studentAdminController');
const multer = require('multer');
const upload = multer();

console.log('teacherRoutes.js loaded');

// Get all teachers
router.get('/teachers', async (req, res) => {
    try {
        const teachersDb = mongoose.connection.useDb('teachers');
        const teachers = await teachersDb.collection('profile').find({}).toArray();
        
        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teachers',
            error: error.message
        });
    }
});

// Get all parents
router.get('/parents', async (req, res) => {
    try {
        const parentDb = mongoose.connection.useDb('parent');
        const parents = await parentDb.collection('parent_profile').find({}).toArray();
        
        res.json({
            success: true,
            data: parents
        });
    } catch (error) {
        console.error('Error fetching parents:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching parents',
            error: error.message
        });
    }
});

// Get teacher by ID
router.get('/teachers/:id', async (req, res) => {
    try {
        const teachersDb = mongoose.connection.useDb('teachers');
        const teacher = await teachersDb.collection('profile').findOne({
            _id: new mongoose.Types.ObjectId(req.params.id)
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher',
            error: error.message
        });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    console.log('Received request for students');
    try {
        // Connect to the test database
        const db = mongoose.connection.useDb('test');
        console.log('Connected to test database');

        // Get the users collection
        const collection = db.collection('users');
        console.log('Accessing users collection');

        // Fetch all documents
        const students = await collection.find({}).toArray();
        console.log(`Found ${students.length} students`);

        // Send response
        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
});

// Get student by ID
router.get('/students/:id', async (req, res) => {
    try {
        const db = mongoose.connection.useDb('test');
        const student = await db.collection('users').findOne({
            _id: new mongoose.Types.ObjectId(req.params.id)
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: { studentProfile: student }
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student',
            error: error.message
        });
    }
});

// Test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Teacher routes are working' });
});

// Test POST route
router.post('/teachers/test', (req, res) => {
  res.json({ message: 'POST /teachers/test works!' });
});

// Add new teacher (Create)
router.post('/teachers', upload.single('profileImage'), teacherProfileController.createTeacher);

// Update teacher (PUT)
router.put('/teachers/:id', upload.single('profileImage'), teacherProfileController.updateTeacher);

// Delete teacher (DELETE)
router.delete('/teachers/:id', teacherProfileController.deleteTeacher);

// Add new student (Create)
router.post('/students', upload.single('profileImage'), studentAdminController.createStudent);

// Update student (PUT)
router.put('/students/:id', upload.single('profileImage'), studentAdminController.updateStudent);

// Delete student (DELETE)
router.delete('/students/:id', studentAdminController.deleteStudent);

// GET /api/admin/manage/students/idNumber/:idNumber
router.get('/students/idNumber/:idNumber', async (req, res) => {
  try {
    const db = mongoose.connection.useDb('test');
    const idParam = req.params.idNumber;
    console.log('Student info lookup for:', idParam, typeof idParam);
    const allIds = await db.collection('users').find({}, { projection: { idNumber: 1 } }).toArray();
    console.log('All idNumbers in users:', allIds.map(d => d.idNumber));
    const student = await db.collection('users').findOne({
      $or: [
        { idNumber: idParam },
        { idNumber: Number(idParam) }
      ]
    });
    console.log('Student found:', student);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router; 