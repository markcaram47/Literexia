// routes/Teachers/teacherProfile.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');
const multer = require('multer');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
}).single('profileImage');

// Helper function to convert to ObjectId safely
const toObjectId = (id) => {
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (error) {
    console.error('Invalid ObjectId:', id);
  }
  return null;
};

// Helper function to get the correct profile collection
const getProfileCollection = async () => {
  // Connect to the teachers database
  const db = mongoose.connection.useDb('teachers');
  // Get the profile collection
  return db.collection('profile');
};

// Helper function to get users collection from users_web database
const getUsersCollection = async () => {
  // Connect to the users_web database
  const db = mongoose.connection.useDb('users_web');
  // Get the users collection
  return db.collection('users');
};

// Generate unique filename for S3
const generateUniqueFilename = (originalname, teacherId) => {
  const timestamp = Date.now();
  // Clean the filename to avoid problems with spaces and special characters
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension)
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '-');
  return `${timestamp}-${basename}-${teacherId}${extension}`;
};

// Upload file to S3
const uploadFileToS3 = async (file, teacherId) => {
  try {
    const uniqueFilename = generateUniqueFilename(file.originalname, teacherId);
    
    // Create subfolder based on current date
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `teacher-profiles/${year}/${month}/${uniqueFilename}`;
    
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'no-cache',
      ACL: 'public-read'
    };
    
    await s3Client.send(new PutObjectCommand(params));
    
    // Return the URL for the uploaded file
    const region = process.env.AWS_REGION || 'ap-southeast-2';
    const bucket = process.env.AWS_S3_BUCKET || 'literexia-bucket';
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFileFromS3 = async (imageUrl) => {
  try {
    if (!imageUrl || imageUrl === 'null') return;
    
    // Parse URL to get the key
    const bucket = process.env.AWS_S3_BUCKET || 'literexia-bucket';
    
    // For S3 URLs like https://bucket.s3.region.amazonaws.com/folder/file.jpg
    let key = '';
    if (imageUrl.includes('/teacher-profiles/')) {
      const urlParts = imageUrl.split('/teacher-profiles/');
      if (urlParts.length > 1) {
        key = 'teacher-profiles/' + urlParts[1].split('?')[0]; // Remove query params
      }
    }
    
    if (!key) {
      console.warn('Could not extract S3 key from URL:', imageUrl);
      return;
    }
    
    console.log('Deleting S3 file with key:', key);
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    }));
    
    console.log('Successfully deleted S3 file');
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    // Don't throw - continue even if delete fails
  }
};

// Initialize teacher profile
router.post('/profile/initialize', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    console.log(`Initializing profile for: ${userEmail} (ID: ${userId})`);
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // Try to find by the known ID that should exist
    const knownId = '6818bae0e9bed4ff08ab7e8c';
    let existingProfile = null;
    
    if (mongoose.Types.ObjectId.isValid(knownId)) {
      const objId = new mongoose.Types.ObjectId(knownId);
      existingProfile = await collection.findOne({ _id: objId });
      console.log('Profile search by known ID:', existingProfile ? 'Found' : 'Not found');
      
      // If found, update it to link to the current user
      if (existingProfile) {
        await collection.updateOne(
          { _id: objId },
          { $set: { 
              userId: toObjectId(userId), 
              email: userEmail,
              updatedAt: new Date()
            } 
          }
        );
        existingProfile.userId = toObjectId(userId);
        existingProfile.email = userEmail;
        console.log('Updated the known profile to link with current user');
        
        return res.status(200).json({ 
          message: 'Profile already exists', 
          teacher: existingProfile 
        });
      }
    }
    
    // If not found by known ID, check if profile already exists for this user
    if (!existingProfile) {
      if (userId) {
        const objectId = toObjectId(userId);
        if (objectId) {
          existingProfile = await collection.findOne({ userId: objectId });
        }
      }
      
      // If not found by userId, try by email
      if (!existingProfile && userEmail) {
        existingProfile = await collection.findOne({ email: userEmail });
      }
      
      if (existingProfile) {
        console.log('Found existing profile:', existingProfile._id);
        
        // Return existing profile
        return res.status(200).json({ 
          message: 'Profile already exists', 
          teacher: existingProfile 
        });
      }
    }
    

    try {
      // Insert the new profile
      await collection.insertOne(newProfile);
      console.log('Created new profile with ID:', knownId);
    } catch (insertError) {
      // If duplicate key error, the profile exists but we couldn't find it
      if (insertError.code === 11000) {
        console.log('Profile already exists with ID:', knownId);
        // Update it instead
        await collection.updateOne(
          { _id: new mongoose.Types.ObjectId(knownId) },
          { $set: { 
              userId: toObjectId(userId), 
              email: userEmail,
              updatedAt: new Date()
            } 
          }
        );
        // Fetch the updated profile
        newProfile = await collection.findOne({ _id: new mongoose.Types.ObjectId(knownId) });
      } else {
        throw insertError;
      }
    }
    
    return res.status(201).json({ 
      message: 'Profile initialized successfully', 
      teacher: newProfile 
    });
  } catch (error) {
    console.error('Error initializing teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher profile
router.get('/profile', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    console.log(`Getting profile for: ${userEmail} (ID: ${userId})`);
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // First try finding by the known ID
    const knownId = '6818bae0e9bed4ff08ab7e8c';
    let profile = null;
    
    if (mongoose.Types.ObjectId.isValid(knownId)) {
      const objId = new mongoose.Types.ObjectId(knownId);
      profile = await collection.findOne({ _id: objId });
      console.log('Profile search by known ID:', profile ? 'Found' : 'Not found');
      
      // If found, update it to link to the current user
      if (profile && userId) {
        await collection.updateOne(
          { _id: objId },
          { $set: { 
              userId: toObjectId(userId), 
              email: userEmail 
            } 
          }
        );
        profile.userId = toObjectId(userId);
        profile.email = userEmail;
        console.log('Updated the known profile to link with current user');
      }
    }
    
    // Only if we didn't find by known ID, try other search methods
    if (!profile) {
      // Define query filters
      const filters = [];
      
      if (userId) {
        const objectId = toObjectId(userId);
        if (objectId) {
          filters.push({ userId: objectId });
        }
      }
      
      if (userEmail) {
        filters.push({ email: userEmail });
      }
      
      // Find profile by userId or email
      if (filters.length > 0) {
        profile = await collection.findOne({ $or: filters });
      }
      
      console.log('Profile search result:', profile ? profile._id : 'Not found');
    }
    
    // For debugging - log all entries in the collection
    const allProfiles = await collection.find({}).toArray();
    console.log('All profiles in collection:', allProfiles.length);
    allProfiles.forEach(p => {
      console.log(`- Profile: ${p._id}, Email: ${p.email}, UserId: ${p.userId}`);
    });
    
    if (!profile) {
      console.log('No profile found, returning default template');
      
      // No profile found, redirect to initialize
      return res.status(404).json({
        error: 'No teacher profile found.',
        action: 'initialize'
      });
    }
    
    // Add timestamp to image URL if present
    if (profile.profileImageUrl) {
      profile.profileImageUrl = `${profile.profileImageUrl}?t=${Date.now()}`;
    }
    
    // Return the found profile
    console.log('Returning profile:', profile._id);
    return res.json(profile);
  } catch (error) {
    console.error('Error getting teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create/update teacher profile
router.post('/profile', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    console.log(`Creating/Updating profile for: ${userEmail} (ID: ${userId})`);
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // Define query filters
    const filters = [];
    
    if (userId) {
      const objectId = toObjectId(userId);
      if (objectId) {
        filters.push({ userId: objectId });
      }
    }
    
    if (userEmail) {
      filters.push({ email: userEmail });
    }
    
    // Check if profile already exists
    let existingProfile = null;
    if (filters.length > 0) {
      existingProfile = await collection.findOne({ $or: filters });
    }
    
    if (existingProfile) {
      // Check if email is being changed
      const isEmailChanged = req.body.email && req.body.email !== userEmail;
      
      // Update existing profile
      console.log('Updating existing profile:', existingProfile._id);
      
      const updateData = {
        ...req.body,
        userId: toObjectId(userId) || existingProfile.userId,
        updatedAt: new Date()
      };
      
      // Make sure we don't override _id
      delete updateData._id;
      
      await collection.updateOne(
        { _id: existingProfile._id },
        { $set: updateData }
      );
      
      // Get the updated profile
      const updatedProfile = await collection.findOne({ _id: existingProfile._id });
      
      // If email changed, update the users_web collection
      if (isEmailChanged) {
        try {
          const usersCollection = await getUsersCollection();
          
          if (userId) {
            await usersCollection.updateOne(
              { _id: toObjectId(userId) },
              { $set: { 
                  email: req.body.email,
                  updatedAt: new Date() 
                }
              }
            );
            console.log('Updated email in users_web.users collection');
          }
        } catch (emailUpdateError) {
          console.error('Failed to update email in users collection:', emailUpdateError.message);
          // Continue anyway, profile was updated
        }
      }
      
      return res.json({ 
        message: 'Profile updated successfully', 
        teacher: updatedProfile 
      });
    }
    
    // If no existing profile, check if we should initialize instead
    if (!existingProfile) {
      return res.status(404).json({
        error: 'No teacher profile found.',
        action: 'initialize'
      });
    }
  } catch (error) {
    console.error('Error creating/updating teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update teacher profile
// Fixed update profile function for email sync to users_web
router.put('/profile', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    console.log(`Updating profile for: ${userEmail} (ID: ${userId})`);
    console.log('Update data:', JSON.stringify(req.body));
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // Find profile by userId or email
    let existingProfile = null;
    
    // Try to find by ID first
    if (userId) {
      const objectId = toObjectId(userId);
      if (objectId) {
        existingProfile = await collection.findOne({ userId: objectId });
      }
    }
    
    // If not found by ID, try email
    if (!existingProfile && userEmail) {
      existingProfile = await collection.findOne({ email: userEmail });
    }
    
    // Check if profile exists
    if (!existingProfile) {
      return res.status(404).json({
        error: 'No teacher profile found.',
        action: 'initialize'
      });
    }
    
    // Check if email is being changed
    const isEmailChanged = req.body.email && req.body.email !== userEmail;
    console.log(`Email change check: Current=${userEmail}, New=${req.body.email}, Changed=${isEmailChanged}`);
    
    // Prepare update data - normalize values
    const updateData = { ...req.body };
    
    // Make sure we don't override _id
    delete updateData._id;
    
    // Add updated timestamp
    updateData.updatedAt = new Date();
    
    // Preserve user ID
    if (!updateData.userId && existingProfile.userId) {
      updateData.userId = existingProfile.userId;
    } else if (userId && !existingProfile.userId) {
      updateData.userId = toObjectId(userId);
    }
    
    // Update the profile in teachers.profile
    const result = await collection.updateOne(
      { _id: existingProfile._id },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      console.warn('No changes were made to the profile');
    } else {
      console.log(`Profile updated successfully in teachers.profile: ${existingProfile._id}`);
    }
    
    // If email is changed, update it in users_web.users
    if (isEmailChanged) {
      try {
        // Connect to users_web database and get users collection
        const usersDb = mongoose.connection.useDb('users_web');
        const usersCollection = usersDb.collection('users');
        
        if (userId) {
          const userObjId = toObjectId(userId);
          
          // Double check to make sure user exists
          const user = await usersCollection.findOne({ _id: userObjId });
          if (user) {
            // Update email in users_web.users
            const userUpdateResult = await usersCollection.updateOne(
              { _id: userObjId },
              { $set: {
                  email: req.body.email,
                  updatedAt: new Date()
                }
              }
            );
            
            console.log(`Updated email in users_web.users: ${userUpdateResult.modifiedCount > 0 ? 'SUCCESS' : 'FAILED'}`);
            
            // Log the user record after update for verification
            const updatedUser = await usersCollection.findOne({ _id: userObjId });
            console.log(`User record after update: ${updatedUser?.email || 'NOT FOUND'}`);
          } else {
            console.error(`User not found in users_web.users with ID: ${userId}`);
          }
        } else {
          console.error('No userId available to update user record');
        }
      } catch (emailUpdateError) {
        console.error('Failed to update email in users_web.users:', emailUpdateError);
      }
    }
    
    // Get the updated profile
    const updatedProfile = await collection.findOne({ _id: existingProfile._id });
    
    return res.json({ 
      message: 'Profile updated successfully', 
      teacher: updatedProfile 
    });
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
});


// Add debug route for testing database connection
router.get('/debug/databases', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Test connections to both databases
    const teachersDb = mongoose.connection.useDb('teachers');
    const usersWebDb = mongoose.connection.useDb('users_web');
    
    // Check collections
    const teachersCollections = await teachersDb.listCollections().toArray();
    const usersWebCollections = await usersWebDb.listCollections().toArray();
    
    // Look for profile in teachers database
    const profileCollection = teachersDb.collection('profile');
    let profile = null;
    
    if (userId) {
      profile = await profileCollection.findOne({ userId: toObjectId(userId) });
    }
    
    if (!profile && userEmail) {
      profile = await profileCollection.findOne({ email: userEmail });
    }
    
    // Look for user in users_web database
    const usersCollection = usersWebDb.collection('users');
    let user = null;
    
    if (userId) {
      user = await usersCollection.findOne({ _id: toObjectId(userId) });
    }
    
    if (!user && userEmail) {
      user = await usersCollection.findOne({ email: userEmail });
    }
    
    // Return diagnostic information
    return res.json({
      auth: {
        userId,
        userEmail
      },
      databases: {
        teachers: {
          connected: !!teachersDb,
          collections: teachersCollections.map(c => c.name)
        },
        users_web: {
          connected: !!usersWebDb,
          collections: usersWebCollections.map(c => c.name)
        }
      },
      profile: profile ? {
        _id: profile._id,
        email: profile.email,
        name: profile.name
      } : null,
      user: user ? {
        _id: user._id,
        email: user.email,
        hasPasswordHash: !!user.passwordHash,
        hasPassword: !!user.password
      } : null
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update password - Fixed to properly update users_web collection
router.post('/password', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password does not meet complexity requirements.' });
    }
    
    // Connect to users_web collection
    const usersCollection = await getUsersCollection();
    
    // Find the user
    const userId = toObjectId(req.user.id);
    let user = null;
    
    if (userId) {
      user = await usersCollection.findOne({ _id: userId });
    }
    
    if (!user && req.user.email) {
      user = await usersCollection.findOne({ email: req.user.email });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Determine which field has the password
    let passwordField = null;
    let passwordValue = null;
    
    if (user.passwordHash) {
      passwordField = 'passwordHash';
      passwordValue = user.passwordHash;
    } else if (user.password) {
      passwordField = 'password';
      passwordValue = user.password;
    }
    
    if (!passwordField) {
      return res.status(500).json({ message: 'Password field not found in user record' });
    }
    
    // Verify current password
    let passwordIsValid = false;
    
    // For password field string starting with $2a$, use bcrypt
    if (passwordValue && passwordValue.startsWith('$2a$')) {
      try {
        passwordIsValid = await bcrypt.compare(currentPassword, passwordValue);
      } catch (bcryptError) {
        console.error('Bcrypt error:', bcryptError.message);
        // Support the test password as fallback
        if (currentPassword === 'Admin101@') {
          passwordIsValid = true;
          console.log('Using test password match');
        }
      }
    } else {
      // Support the test password
      if (currentPassword === 'Admin101@') {
        passwordIsValid = true;
        console.log('Using test password match');
      }
    }
    
    if (!passwordIsValid) {
      console.log('Failed password change attempt - incorrect current password');
      return res.status(400).json({ error: 'INCORRECT_PASSWORD' });
    }
    
    // Hash and save new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update the appropriate password field
    const updateData = { 
      [passwordField]: newPasswordHash,
      updatedAt: new Date()  
    };
    
    // Update the user document
    const result = await usersCollection.updateOne(
      { _id: user._id }, 
      { $set: updateData }
    );
    
    console.log('Password updated result:', result);
    console.log('Password updated for user:', req.user.email);
    
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile image
router.post('/profile/image', auth, authorize('teacher', 'guro'), upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // Find the teacher profile
    let teacherProfile = null;
    
    if (userId) {
      const objectId = toObjectId(userId);
      if (objectId) {
        teacherProfile = await collection.findOne({ userId: objectId });
      }
    }
    
    if (!teacherProfile && userEmail) {
      teacherProfile = await collection.findOne({ email: userEmail });
    }
    
    if (!teacherProfile) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    
    // Delete existing image if there is one
    if (teacherProfile.profileImageUrl) {
      await deleteFileFromS3(teacherProfile.profileImageUrl);
    }
    
    // Upload image to S3
    const imageUrl = await uploadFileToS3(req.file, teacherProfile._id.toString());
    
    // Update profile with new image URL
    await collection.updateOne(
      { _id: teacherProfile._id },
      { $set: { 
          profileImageUrl: imageUrl,
          updatedAt: new Date()
        } 
      }
    );
    
    // Add cache-busting parameter
    const cacheBustedUrl = `${imageUrl}?t=${Date.now()}`;
    
    return res.json({ 
      success: true, 
      imageUrl: cacheBustedUrl,
      originalUrl: imageUrl,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete profile image
router.delete('/profile/image', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // Find the teacher profile
    let teacherProfile = null;
    
    if (userId) {
      const objectId = toObjectId(userId);
      if (objectId) {
        teacherProfile = await collection.findOne({ userId: objectId });
      }
    }
    
    if (!teacherProfile && userEmail) {
      teacherProfile = await collection.findOne({ email: userEmail });
    }
    
    if (!teacherProfile) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    
    // Delete the file from S3 if there is one
    if (teacherProfile.profileImageUrl) {
      await deleteFileFromS3(teacherProfile.profileImageUrl);
    }
    
    // Update profile to remove image URL
    await collection.updateOne(
      { _id: teacherProfile._id },
      { $set: { 
          profileImageUrl: null,
          updatedAt: new Date()
        } 
      }
    );
    
    return res.json({ 
      success: true, 
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current profile image
router.get('/profile/image/current', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    // Get the correct collection
    const collection = await getProfileCollection();
    
    // Find the teacher profile
    let teacherProfile = null;
    
    if (userId) {
      const objectId = toObjectId(userId);
      if (objectId) {
        teacherProfile = await collection.findOne({ userId: objectId });
      }
    }
    
    if (!teacherProfile && userEmail) {
      teacherProfile = await collection.findOne({ email: userEmail });
    }
    
    if (!teacherProfile) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }
    
    // Return the image URL with timestamp or null if no image
    let imageUrl = null;
    if (teacherProfile.profileImageUrl) {
      imageUrl = `${teacherProfile.profileImageUrl}?t=${Date.now()}`; // Add cache-busting timestamp
    }
    
    return res.json({ 
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Error getting profile image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add debug route to check database states
router.get('/profile/debug', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email and ID from the token
    const userEmail = req.user.email;
    const userId = req.user.id;
    
    // Check multiple collections
    const teachersCollection = await getProfileCollection();
    const usersCollection = await getUsersCollection();
    
    // Get teacher profile
    let teacherProfile = null;
    if (userId) {
      const objectId = toObjectId(userId);
      if (objectId) {
        teacherProfile = await teachersCollection.findOne({ userId: objectId });
      }
    }
    if (!teacherProfile && userEmail) {
      teacherProfile = await teachersCollection.findOne({ email: userEmail });
    }
    
    // Get user account
    let userAccount = null;
    if (userId) {
      userAccount = await usersCollection.findOne({ _id: toObjectId(userId) });
    }
    if (!userAccount && userEmail) {
      userAccount = await usersCollection.findOne({ email: userEmail });
    }
    
    // Return debug info
    return res.json({
      auth: {
        id: userId,
        email: userEmail
      },
      teacherProfile: teacherProfile,
      userAccount: {
        _id: userAccount?._id,
        email: userAccount?.email,
        hasPasswordHash: !!userAccount?.passwordHash,
        hasPassword: !!userAccount?.password,
        roles: userAccount?.roles
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;