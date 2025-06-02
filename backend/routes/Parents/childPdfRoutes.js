const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../../middleware/auth');
const { ObjectId } = require('mongodb');

// GET /api/parent/child_pdf
router.get('/child_pdf', authenticateToken, async (req, res) => {
  try {
    const db = mongoose.connection.useDb('parent');
    console.log('childPdfRoutes: req.user.id type:', typeof req.user.id, 'value:', req.user.id);
    // Log all parent profiles for debugging
    const allProfiles = await db.collection('parent_profile').find({}).toArray();
    console.log('childPdfRoutes: all parent profiles:', allProfiles);
    console.log('childPdfRoutes: attempting lookup with userId:', req.user.id);
    let parentProfile = null;
    try {
      parentProfile = await db.collection('parent_profile').findOne({
        userId: new ObjectId(req.user.id)
      });
      console.log('childPdfRoutes: parentProfile by ObjectId:', parentProfile);
    } catch (e) {
      console.log('childPdfRoutes: ObjectId lookup error:', e.message);
    }
    if (!parentProfile) {
      parentProfile = await db.collection('parent_profile').findOne({
        userId: req.user.id
      });
      console.log('childPdfRoutes: parentProfile by string:', parentProfile);
    }
    if (!parentProfile) {
      console.log('childPdfRoutes: parentProfile not found, returning all profiles for debugging');
      return res.json(allProfiles);
    }

    const parentId = parentProfile._id;
    console.log('childPdfRoutes: querying child_pdf with parentId:', parentId);
    const pdfs = await db.collection('child_pdf').find({ parentId: parentProfile._id }).toArray();
    console.log('childPdfRoutes: found pdfs:', pdfs);

    // Prepare connections to other collections
    const teachersDb = mongoose.connection.useDb('teachers');
    const testDb = mongoose.connection.useDb('test');

    // Map reports with names
    const mapped = await Promise.all(pdfs.map(async (item) => {
      // Teacher name
      let teacherName = 'Unknown';
      if (item.teacherId) {
        const teacher = await teachersDb.collection('profile').findOne({ _id: item.teacherId });
        if (teacher) teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
      }
      // Parent name
      let parentName = 'Unknown';
      if (item.parentId) {
        const parent = await db.collection('parent_profile').findOne({ _id: item.parentId });
        if (parent) parentName = `${parent.firstName || ''} ${parent.lastName || ''}`.trim();
      }
      // Student name
      let studentName = 'Unknown';
      if (item.studentId) {
        const student = await testDb.collection('users').findOne({ _id: item.studentId });
        if (student) studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
      }
      return {
        teacher: teacherName,
        parent: parentName,
        student: studentName,
        subject: item.subject || 'Unknown',
        week: item.week || 'N/A',
        date: item.sentAt,
        pdfUrl: item.pdfS3Path,
      };
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching child_pdf:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; 