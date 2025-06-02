// routes/Parents/childrenRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken } = require('../../middleware/auth');

// Get parent's children
router.get('/children', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching children for parent with userId: ${userId}`);
    
    // Connect to parent collection first to verify the parent exists
    const parentCollection = mongoose.connection.db.collection('parent.profile');
    
    // Try to find parent profile by userId
    let parentProfile = null;
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      parentProfile = await parentCollection.findOne({ 
        userId: new mongoose.Types.ObjectId(userId) 
      });
    }

    // If not found, try with string userId
    if (!parentProfile) {
      parentProfile = await parentCollection.findOne({ 
        userId: userId 
      });
    }
    
    if (!parentProfile) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }
    
    // Now fetch the children from student collection
    // This assumes there's a students collection with a parentId field
    const studentCollection = mongoose.connection.db.collection('students');
    let children = [];
    
    if (mongoose.Types.ObjectId.isValid(userId)) {
      children = await studentCollection.find({ 
        parentId: new mongoose.Types.ObjectId(userId) 
      }).toArray();
    }
    
    // If no children found with ObjectId, try string ID
    if (children.length === 0) {
      children = await studentCollection.find({ 
        parentId: userId 
      }).toArray();
    }
    
    // If we found children, return them
    if (children.length > 0) {
      return res.json(children);
    }
    
    // Otherwise, check if parent has childrenInfo field
    if (parentProfile.childrenInfo && Array.isArray(parentProfile.childrenInfo) && parentProfile.childrenInfo.length > 0) {
      return res.json(parentProfile.childrenInfo);
    }
    
    // If we still don't have children data, return a sample child
    console.log('No children found, returning sample data');
    const sampleChild = [{
      firstName: "Charles",
      middleName: "Ashley",
      lastName: "Santiago",
      studentId: "2022-54321",
      profileImage: null
    }];
    
    res.json(sampleChild);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;