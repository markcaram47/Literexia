// routes/Teachers/teacherRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const teacherProfileController = require('../../controllers/teacherProfileController');
const { auth, authorize } = require('../../middleware/auth');

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit 
  }, 
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('profileImage');

// Handle file upload errors
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred (file too large, etc)
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    // No errors, continue
    next();
  });
};

/**
 * @route GET /api/teachers/profile
 * @desc Get teacher profile
 * @access Private (teachers only)
 */
router.get('/profile', auth, authorize('teacher', 'guro'), teacherProfileController.getProfile);

/**
 * @route GET /api/teachers/profile/debug
 * @desc Debug endpoint to check raw profile data
 * @access Private (teachers only)
 */
// routes/Teachers/teacherRoutes.js

// Add detailed debug route
router.get('/profile/debug', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get user profile from mobile_literexia database
    const mobileDB = mongoose.connection.useDb('mobile_literexia');
    
    // Try both profile and teachers.profile collections
    const profileCollection = mobileDB.collection('profile');
    const teachersProfileCollection = mobileDB.collection('teachers.profile');
    
    // Get user account from users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    
    // Find user in each collection
    let profile = null;
    let teachersProfile = null;
    let user = null;
    
    if (req.user.id) {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      
      profile = await profileCollection.findOne({ userId });
      teachersProfile = await teachersProfileCollection.findOne({ userId });
      user = await usersCollection.findOne({ _id: userId });
    }
    
    if (!profile && !teachersProfile && !user && req.user.email) {
      profile = await profileCollection.findOne({ email: req.user.email });
      teachersProfile = await teachersProfileCollection.findOne({ email: req.user.email });
      user = await usersCollection.findOne({ email: req.user.email });
    }
    
    // Find all databases and collections
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    
    // Get collections for relevant databases
    const collections = {};
    if (dbList && dbList.databases) {
      for (const db of dbList.databases) {
        if (db.name === 'mobile_literexia' || db.name === 'users_web' || db.name === 'teachers') {
          const dbObj = mongoose.connection.useDb(db.name);
          collections[db.name] = await dbObj.listCollections().toArray();
        }
      }
    }
    
    // Return full debug info
    res.json({
      user_id: req.user.id,
      user_email: req.user.email,
      profile: profile,
      teachersProfile: teachersProfile,
      user: user,
      databases: dbList.databases,
      collections: collections,
      message: "Debug data from all relevant collections"
    });
  } catch (err) {
    console.error('Debug route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add debug route to see both database records
router.get('/profile/debug', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get user profile from mobile_literexia database
    const mobileDB = mongoose.connection.useDb('mobile_literexia');
    const profileCollection = mobileDB.collection('profile');
    
    let profile = null;
    if (req.user.id) {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      profile = await profileCollection.findOne({ userId });
    }
    
    if (!profile && req.user.email) {
      profile = await profileCollection.findOne({ email: req.user.email });
    }
    
    // Get user account from users_web database
    const usersDB = mongoose.connection.useDb('users_web');
    const usersCollection = usersDB.collection('users');
    
    let user = null;
    if (req.user.id) {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      user = await usersCollection.findOne({ _id: userId });
    }
    
    res.json({
      profile: profile,
      user: user,
      message: "Raw data from both databases"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route POST /api/teachers/profile/initialize
 * @desc Initialize teacher profile
 * @access Private (teachers only)
 */
router.post('/profile/initialize', auth, authorize('teacher', 'guro'), teacherProfileController.initializeProfile);

/**
 * @route PUT /api/teachers/profile
 * @desc Update teacher profile
 * @access Private (teachers only)
 */
router.put('/profile', auth, authorize('teacher', 'guro'), teacherProfileController.updateProfile);

/**
 * @route POST /api/teachers/password
 * @desc Update teacher password
 * @access Private (teachers only)
 */
router.post('/password', auth, authorize('teacher', 'guro'), teacherProfileController.updatePassword);

/**
 * @route POST /api/teachers/profile/image
 * @desc Upload profile image
 * @access Private (teachers only)
 */
router.post('/profile/image', auth, authorize('teacher', 'guro'), handleUpload, teacherProfileController.uploadProfileImage);

/**
 * @route DELETE /api/teachers/profile/image
 * @desc Delete profile image
 * @access Private (teachers only)
 */
router.delete('/profile/image', auth, authorize('teacher', 'guro'), teacherProfileController.deleteProfileImage);

/**
 * @route GET /api/teachers/profile/image/current
 * @desc Get current profile image
 * @access Private (teachers only)
 */
router.get('/profile/image/current', auth, authorize('teacher', 'guro'), teacherProfileController.getCurrentProfileImage);

module.exports = router;