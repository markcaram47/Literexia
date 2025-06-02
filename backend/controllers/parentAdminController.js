const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer();
const uploadToS3 = require('../utils/s3Upload');

// Helper: get parent profile collection
const getParentProfileCollection = async () => {
  const db = mongoose.connection.useDb('parent');
  return db.collection('parent_profile');
};

// Helper: get user model from users_web
const getUserModel = async () => {
  const userSchema = new mongoose.Schema({
    email: String,
    passwordHash: String,
    roles: mongoose.Schema.Types.ObjectId,
    updatedAt: Date
  }, { collection: 'users' });
  const userConnection = mongoose.connection.useDb('users_web');
  try {
    return userConnection.model('User');
  } catch (e) {
    return userConnection.model('User', userSchema);
  }
};

// Helper: generate random password
const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Add this helper:
const getStudentCollection = async () => {
  const db = mongoose.connection.useDb('test');
  return db.collection('users');
};

exports.createParent = async (req, res) => {
  try {
    const {
      firstName, lastName, middleName, contact, address, civilStatus, dateOfBirth, gender, email, children = []
    } = req.body;
    // Ensure children is always an array
    const childrenArray = Array.isArray(children) ? children : (children ? [children] : []);
    // Check for duplicate email in parent.parent_profile
    const profileCollection = await getParentProfileCollection();
    const existing = await profileCollection.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }
    // 1. Generate password
    const password = generatePassword(8);
    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    // 3. Create user in users_web.users
    const User = await getUserModel();
    const userDoc = new User({
      email,
      passwordHash,
      roles: new mongoose.Types.ObjectId('681b690af9fd9071c6ac2f3b'), // Parent role ObjectId
      updatedAt: new Date()
    });
    await userDoc.save();
    // 4. Create parent profile in parent.parent_profile
    const now = new Date();
    const profileImageUrl = req.file ? await uploadToS3(req.file, 'parent-profiles') : null;
    const profileDoc = {
      userId: userDoc._id,
      firstName,
      lastName,
      middleName: middleName || '',
      contact,
      address,
      civilStatus,
      dateOfBirth,
      gender,
      email,
      children: childrenArray,
      profileImageUrl: profileImageUrl || '',
      createdAt: now,
      updatedAt: now
    };
    const insertResult = await profileCollection.insertOne(profileDoc);
    const parentId = insertResult.insertedId;
    // --- Bidirectional linking: update students' parentId field ---
    const studentCollection = await getStudentCollection();
    const validChildrenObjectIds = childrenArray
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (validChildrenObjectIds.length > 0) {
      await studentCollection.updateMany(
        { _id: { $in: validChildrenObjectIds } },
        { $set: { parentId: parentId } }
      );
    }
    // Remove this parentId from students not in childrenArray
    await studentCollection.updateMany(
      { parentId: parentId, _id: { $nin: validChildrenObjectIds } },
      { $unset: { parentId: "" } }
    );
    // 5. Respond with credentials for admin to display
    res.json({
      success: true,
      message: 'Parent created successfully',
      data: {
        parentProfile: { ...profileDoc, _id: parentId },
        credentials: { email, password }
      }
    });
  } catch (err) {
    console.error('Error creating parent:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const parentId = req.params.id;
    const {
      firstName, lastName, middleName, contact, address, civilStatus, dateOfBirth, gender, email, children = []
    } = req.body;
    // Ensure children is always an array
    const childrenArray = Array.isArray(children) ? children : (children ? [children] : []);
    // Update parent profile
    const profileCollection = await getParentProfileCollection();
    const updateData = {
      firstName,
      lastName,
      middleName: middleName || '',
      contact,
      address,
      civilStatus,
      dateOfBirth,
      gender,
      email,
      children: childrenArray,
      updatedAt: new Date()
    };
    // Handle profile image upload if file is present
    if (req.file) {
      const profileImageUrl = await uploadToS3(req.file, 'parent-profiles');
      updateData.profileImageUrl = profileImageUrl;
    }
    await profileCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(parentId) },
      { $set: updateData }
    );
    const updatedProfile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    // Also update user in users_web.users if email is changed
    if (email && updatedProfile.userId) {
      const User = await getUserModel();
      await User.updateOne(
        { _id: updatedProfile.userId },
        { $set: { email, updatedAt: new Date() } }
      );
    }
    // --- Bidirectional linking: update students' parentId field ---
    const studentCollection = await getStudentCollection();
    const validChildrenObjectIds = childrenArray
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (validChildrenObjectIds.length > 0) {
      await studentCollection.updateMany(
        { _id: { $in: validChildrenObjectIds } },
        { $set: { parentId: new mongoose.Types.ObjectId(parentId) } }
      );
    }
    // Remove this parentId from students not in childrenArray
    await studentCollection.updateMany(
      { parentId: new mongoose.Types.ObjectId(parentId), _id: { $nin: validChildrenObjectIds } },
      { $unset: { parentId: "" } }
    );
    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: { parentProfile: updatedProfile }
    });
  } catch (err) {
    console.error('Error updating parent:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.deleteParent = async (req, res) => {
  try {
    const parentId = req.params.id;
    const profileCollection = await getParentProfileCollection();
    // Find the profile to get userId
    const profile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    // Delete the profile
    const deleteResult = await profileCollection.deleteOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ success: false, message: 'Failed to delete parent profile' });
    }
    // Delete the user in users_web.users
    if (profile.userId) {
      const User = await getUserModel();
      await User.deleteOne({ _id: profile.userId });
    }
    res.json({ success: true, message: 'Parent deleted successfully' });
  } catch (err) {
    console.error('Error deleting parent:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.uploadParentProfileImage = async (req, res) => {
  try {
    const parentId = req.params.id;
    const profileCollection = await getParentProfileCollection();
    const profile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }

    let profileImageUrl = profile.profileImageUrl;
    if (req.file) {
      profileImageUrl = await uploadToS3(req.file, 'parent-profiles');
    }

    await profileCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(parentId) },
      { $set: { profileImageUrl } }
    );

    res.json({
      success: true,
      message: 'Parent profile image updated successfully',
      data: { profileImageUrl }
    });
  } catch (err) {
    console.error('Error updating parent profile image:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 