// controllers/parentProfileController.js
const bcrypt = require('bcrypt');
const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const getParentProfileModel = require('../models/parentProfileModel');

// Sanitize input helper function
const sanitizeInput = (obj) => {
  if (!obj) return obj;
  const sanitized = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'string') {
      sanitized[key] = obj[key]
        .replace(/\$/g, '')
        .replace(/\.\./g, '')
        .replace(/\{/g, '')
        .replace(/\}/g, '');
    } else {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
};

// Get parent profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting parent profile for user ID:', req.user.id);
    
    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();
    
    // First, try to find profile by userId
    let parent = await ParentProfile.findOne({ userId: req.user.id }).select('-profileImage.data -passwordHash');
    
    // If not found by userId, try by email
    if (!parent && req.user.email) {
      parent = await ParentProfile.findOne({ email: req.user.email }).select('-profileImage.data -passwordHash');
      
      // If found by email but without userId, update it
      if (parent && !parent.userId) {
        parent.userId = req.user.id;
        await parent.save();
        console.log('Updated existing profile with user ID');
      }
    }
    
    // If no profile exists, return 404
    if (!parent) {
      return res.status(404).json({ 
        error: 'No parent profile found.',
        action: 'initialize'
      });
    }

    // Create response object with profile data
    const parentObj = parent.toObject({ virtuals: true });

    // If name fields aren't populated yet but name is available, split it
    if (parent.name && (!parent.firstName && !parent.middleName && !parent.lastName)) {
      const nameParts = parent.name.split(' ');

      if (nameParts.length === 1) {
        parentObj.firstName = nameParts[0];
        parentObj.middleName = '';
        parentObj.lastName = '';
      } else if (nameParts.length === 2) {
        parentObj.firstName = nameParts[0];
        parentObj.middleName = '';
        parentObj.lastName = nameParts[1];
      } else {
        parentObj.firstName = nameParts[0];
        parentObj.lastName = nameParts[nameParts.length - 1];
        parentObj.middleName = nameParts.slice(1, nameParts.length - 1).join(' ');
      }
    }

    // Transform profileImageUrl from "null" string to actual null
    if (parentObj.profileImageUrl === "null") {
      parentObj.profileImageUrl = null;
    }

    res.json(parentObj);
  } catch (err) {
    console.error('Error fetching parent profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Initialize parent profile
exports.initializeProfile = async (req, res) => {
  try {
    console.log('Initializing parent profile for user:', req.user.email);
    
    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();
    
    // First, try to find profile by userId
    let parent = await ParentProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!parent && req.user.email) {
      parent = await ParentProfile.findOne({ email: req.user.email });
    }
    
    // If profile exists, return it
    if (parent) {
      console.log('Found existing profile for:', parent.name || parent.email);
      
      // If the profile doesn't have userId, update it
      if (!parent.userId) {
        parent.userId = req.user.id;
        await parent.save();
        console.log('Updated profile with user ID:', req.user.id);
      }
      
      const parentData = parent.toObject({ virtuals: true });
      delete parentData.passwordHash;
      delete parentData.profileImage?.data;
      
      return res.json({
        message: 'Profile already exists',
        parent: parentData
      });
    }
    
    // Create a default profile
    const defaultFirstName = req.user.email ? req.user.email.split('@')[0] : '';
    const newParent = new ParentProfile({
      userId: req.user.id,
      email: req.user.email,
      firstName: defaultFirstName || 'New',
      lastName: 'Parent',
      // Add default contact number to satisfy the required field
      contact: '09000000000', // Default placeholder phone number
      passwordHash: await bcrypt.hash("DefaultPassword123!", 10),
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newParent.save();
    console.log('Created default profile for:', req.user.email);
    
    const returnData = newParent.toObject({ virtuals: true });
    delete returnData.passwordHash;
    
    return res.status(201).json({
      message: 'Default profile created',
      parent: returnData
    });
  } catch (err) {
    console.error('Error initializing parent profile:', err);
    res.status(500).json({ error: 'Failed to initialize profile', details: err.message });
  }
};

// Create parent profile
exports.createProfile = async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Validate required fields
    if (!sanitizedData.firstName || !sanitizedData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();
    
    // Check if profile already exists for this user
    let existingParent = await ParentProfile.findOne({ userId: req.user.id });
    if (!existingParent && req.user.email) {
      existingParent = await ParentProfile.findOne({ email: req.user.email });
    }
    
    if (existingParent) {
      return res.status(400).json({ error: 'Parent profile already exists. Use PUT to update.' });
    }

    // Create a new parent profile
    const parent = new ParentProfile({
      ...sanitizedData,
      userId: req.user.id, // Link to authenticated user
      email: sanitizedData.email || req.user.email,
      passwordHash: await bcrypt.hash("DefaultPassword123!", 10), // Set default password
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate full name from parts
    parent.name = [parent.firstName, parent.middleName, parent.lastName]
      .filter(part => part && part.trim())
      .join(' ');

    await parent.save();

    // Log the creation action
    console.log(`[${new Date().toISOString()}] Created new parent profile for ${parent.name}`);

    // Return the new parent without sensitive data
    const returnData = parent.toObject({ virtuals: true });
    delete returnData.passwordHash;

    res.status(201).json({ message: 'Profile created!', parent: returnData });
  } catch (err) {
    console.error('Error creating parent profile:', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
};

// Update parent profile
exports.updateProfile = async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Validate required fields
    if (!sanitizedData.firstName || !sanitizedData.email || !sanitizedData.contact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone number format (Philippine format)
    const phoneRegex = /^(\+?63|0)[\d]{10}$/;
    const cleanPhone = sanitizedData.contact.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();

    // Find profile by user ID
    let updateFilter = { userId: req.user.id };
    
    // Check if profile exists by userId
    const profileExists = await ParentProfile.findOne(updateFilter);
    if (!profileExists) {
      // If no profile found by userId, try email
      if (req.user.email) {
        const profileByEmail = await ParentProfile.findOne({ email: req.user.email });
        if (profileByEmail) {
          // If found by email, update it to use userId
          profileByEmail.userId = req.user.id;
          await profileByEmail.save();
          console.log('Added userId to existing profile found by email');
        } else {
          // If still not found, look for any profile
          const anyProfile = await ParentProfile.findOne();
          if (anyProfile) {
            // Update any profile to use the current user's ID
            anyProfile.userId = req.user.id;
            anyProfile.email = req.user.email || anyProfile.email;
            await anyProfile.save();
            console.log('Linked existing profile to current user');
          }
        }
      }
      
      // For findOneAndUpdate, use empty filter as fallback if no profile found yet
      updateFilter = {};
    }

    // Find existing profile using findOneAndUpdate
    const updateResult = await ParentProfile.findOneAndUpdate(
      updateFilter,
      {
        userId: req.user.id, // Ensure userId is set
        firstName: sanitizedData.firstName,
        middleName: sanitizedData.middleName || '',
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        contact: sanitizedData.contact,
        gender: sanitizedData.gender || '',
        address: sanitizedData.address || '',
        childrenInfo: sanitizedData.childrenInfo || [],
        name: [sanitizedData.firstName, sanitizedData.middleName, sanitizedData.lastName]
          .filter(part => part && part.trim())
          .join(' '),
        updatedAt: new Date()
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if it doesn't exist
        runValidators: true, // Run model validators
        setDefaultsOnInsert: true // Apply default values if creating new doc
      }
    );

    // Log the update action
    console.log(`[${new Date().toISOString()}] Profile updated for ${updateResult.name}`);

    // Return updated parent data without sensitive data
    const returnData = updateResult.toObject({ virtuals: true });
    delete returnData.passwordHash;
    delete returnData.profileImage?.data; // Don't send binary data

    // Transform profileImageUrl from "null" string to actual null
    if (returnData.profileImageUrl === "null") {
      returnData.profileImageUrl = null;
    }

    res.json({ message: 'Profile updated!', parent: returnData });
  } catch (err) {
    console.error('Error updating parent profile:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
};

// Update parent password
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Sanitize inputs
  const sanitizedCurrentPassword = currentPassword.replace(/[^ -]/g, '');
  const sanitizedNewPassword = newPassword.replace(/[^ -]/g, '');

  // Validate password complexity
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(sanitizedNewPassword)) {
    return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
  }

  try {
    const mongoose = require('mongoose');
    const userIdObj = mongoose.Types.ObjectId.isValid(req.user.id) ? new mongoose.Types.ObjectId(req.user.id) : null;
    if (!userIdObj) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }
    // Find parent profile by userId only
    const ParentProfile = await getParentProfileModel();
    let parentProfile = await ParentProfile.findOne({ userId: userIdObj });
    if (!parentProfile) {
      // Auto-create minimal parent profile if not found
      parentProfile = new ParentProfile({
        userId: userIdObj,
        email: req.user.email,
        firstName: '',
        lastName: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await parentProfile.save();
      console.log('Auto-created minimal parent profile:', parentProfile);
    }
    console.log('Parent profile found:', parentProfile);
    // Get userId from parent profile
    const userId = parentProfile.userId;
    if (!userId) {
      return res.status(404).json({ error: 'User ID not found in parent profile.' });
    }
    // Connect to users_web.users
    const usersWebDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersWebDb.collection('users');
    // Find user by _id
    const user = await usersCollection.findOne({ _id: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found in users_web.users.' });
    }
    // Validate current password
    let passwordIsValid = false;
    if (user.passwordHash) {
      passwordIsValid = await bcrypt.compare(sanitizedCurrentPassword, user.passwordHash);
    }
    if (!passwordIsValid) {
      return res.status(400).json({ error: 'INCORRECT_PASSWORD' });
    }
    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(sanitizedNewPassword, 10);
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { passwordHash: newPasswordHash, updatedAt: new Date() } }
    );
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Password update failed.' });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing image upload: file size =', req.file.size, 'bytes');
    console.log('MIME type =', req.file.mimetype);

    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();
    
    // Find profile by userId
    let parent = await ParentProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!parent && req.user.email) {
      parent = await ParentProfile.findOne({ email: req.user.email });
    }

    if (!parent) {
      console.error('No parent profile found in the database');
      return res.status(404).json({ error: 'Parent profile not found. Please create a profile first.' });
    }

    // Add userId if missing
    if (!parent.userId) {
      parent.userId = req.user.id;
      await parent.save();
    }

    console.log('Found parent profile with ID:', parent._id.toString());

    try {
      // Check if S3 config exists
      if (!process.env.AWS_BUCKET_NAME) {
        throw new Error('AWS_BUCKET_NAME is not configured');
      }

      // Delete existing S3 image if present
      if (parent.profileImageUrl &&
        parent.profileImageUrl !== "null" &&
        parent.profileImageUrl.includes('amazonaws.com')) {
        try {
          // Extract key from URL
          const urlParts = parent.profileImageUrl.split('/');
          const key = urlParts.slice(3).join('/');

          console.log('Deleting previous S3 image with key:', key);

          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          });

          await s3Client.send(deleteCommand);
          console.log('Successfully deleted previous S3 image');
        } catch (deleteError) {
          console.error('Failed to delete previous S3 image:', deleteError.message);
          // Continue with upload even if deletion fails
        }
      }

      // Create organized folder structure
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

      // Generate unique filename with parent information
      const timestamp = Date.now();
      const sanitizedId = parent._id.toString().replace(/[^a-zA-Z0-9]/g, '');
      const sanitizedName = parent.lastName ?
        parent.lastName.toLowerCase().replace(/[^a-z0-9]/g, '') :
        'parent';
      const fileExt = req.file.originalname.split('.').pop().toLowerCase() || 'jpg';

      // Create structured key with folders
      const filename = `${timestamp}-${sanitizedName}-${sanitizedId}.${fileExt}`;
      const key = `parent-profiles/${currentYear}/${currentMonth}/${filename}`;

      console.log('S3 upload starting:');
      console.log('- Bucket:', process.env.AWS_BUCKET_NAME);
      console.log('- Key:', key);
      console.log('- File size:', req.file.size, 'bytes');

      // Create S3 upload
      const uploader = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ACL: 'public-read',
          ContentType: req.file.mimetype
        }
      });

      // Perform the upload
      const uploadResult = await uploader.done();
      console.log('S3 upload successful:', uploadResult.Location);

      // Update MongoDB document - using findOneAndUpdate to avoid document not found errors
      const updateResult = await ParentProfile.findOneAndUpdate(
        { _id: parent._id },
        {
          profileImageUrl: uploadResult.Location,
          updatedAt: new Date()
        },
        {
          new: true, // Return updated document
          runValidators: true
        }
      );

      if (!updateResult) {
        throw new Error('Failed to update parent profile after successful S3 upload');
      }

      console.log('Parent profile updated with new image URL:', updateResult.profileImageUrl);

      return res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: uploadResult.Location
      });
    } catch (s3Error) {
      console.error('S3 upload or MongoDB update failed:', s3Error.message);

      // Fallback to MongoDB storage
      console.log('Falling back to MongoDB storage...');

      try {
        // Store image in MongoDB using findOneAndUpdate
        const mongoUpdate = await ParentProfile.findOneAndUpdate(
          { _id: parent._id },
          {
            profileImage: {
              data: req.file.buffer,
              contentType: req.file.mimetype,
              filename: req.file.originalname,
              uploadDate: new Date()
            },
            // Local API URL as fallback
            profileImageUrl: `/api/parents/profile/image/current?noCache=${Date.now()}`,
            updatedAt: new Date()
          },
          {
            new: true,
            runValidators: true
          }
        );

        if (!mongoUpdate) {
          throw new Error('Failed to update MongoDB with image data');
        }

        console.log('Image successfully stored in MongoDB');

        return res.json({
          success: true,
          message: 'Profile image stored in MongoDB (S3 upload failed)',
          imageUrl: mongoUpdate.profileImageUrl,
          fallback: true
        });
      } catch (mongoError) {
        console.error('MongoDB fallback storage failed:', mongoError.message);
        throw new Error(`S3 upload failed and MongoDB fallback failed: ${mongoError.message}`);
      }
    }
  } catch (err) {
    console.error('Image upload failed:', err.message);
    console.error(err.stack);
    res.status(500).json({
      error: 'Failed to upload image',
      details: err.message
    });
  }
};

// Delete profile image
exports.deleteProfileImage = async (req, res) => {
  try {
    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();
    
    // Find profile by userId
    let parent = await ParentProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!parent && req.user.email) {
      parent = await ParentProfile.findOne({ email: req.user.email });
    }

    if (!parent) {
      return res.status(404).json({ error: 'No parent profile found.' });
    }

    // Check if S3 image URL exists
    if (parent.profileImageUrl &&
      parent.profileImageUrl !== "null" &&
      parent.profileImageUrl.includes('amazonaws.com')) {
      try {
        // Extract key from URL
        const urlParts = parent.profileImageUrl.split('/');
        const key = urlParts.slice(3).join('/');

        console.log('Deleting S3 image with key:', key);

        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        });

        await s3Client.send(deleteCommand);
        console.log('Successfully deleted S3 image');
      } catch (deleteError) {
        console.error('Failed to delete S3 image:', deleteError.message);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Update MongoDB document using findOneAndUpdate
    const updateResult = await ParentProfile.findOneAndUpdate(
      { _id: parent._id },
      {
        profileImageUrl: null, // Set to null, not "null" string
        profileImage: null, // Remove MongoDB image data too
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updateResult) {
      throw new Error('Failed to update parent profile after deleting image');
    }

    console.log('Profile image record deleted for parent:', updateResult.name || 'unknown');

    return res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting profile image:', err.message);
    res.status(500).json({
      error: 'Failed to delete image',
      details: err.message
    });
  }
};

// Get current profile image
exports.getCurrentProfileImage = async (req, res) => {
  try {
    console.log(`Attempting to fetch current parent profile image for user:`, req.user.id);

    // Get the ParentProfile model
    const ParentProfile = await getParentProfileModel();
    
    // Find profile by userId
    let parent = await ParentProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!parent && req.user.email) {
      parent = await ParentProfile.findOne({ email: req.user.email });
    }

    if (!parent) {
      console.log('No parent profile found');
      return res.status(404).json({ error: 'No parent profile found.' });
    }

    // Check if we have an S3 URL - if yes, redirect to it
    if (parent.profileImageUrl && parent.profileImageUrl !== "null") {
      console.log(`Parent has S3 URL, redirecting to: ${parent.profileImageUrl}`);
      return res.redirect(parent.profileImageUrl);
    }

    // Fall back to binary data in MongoDB if no S3 URL
    if (!parent.profileImage || !parent.profileImage.data) {
      console.log(`Parent found but no profile image data exists`);
      return res.status(404).json({ error: 'No profile image found.' });
    }

    // Serve from MongoDB (legacy support)
    res.set('Content-Type', parent.profileImage.contentType);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.send(parent.profileImage.data);
    console.log(`Successfully served image from MongoDB`);
  } catch (err) {
    console.error(`Error fetching profile image:`, err);
    res.status(500).json({ error: 'Server error' });
  }
};