// controllers/parentController.js
const mongoose = require('mongoose');

// Helper function to extract ObjectId
const getObjectId = (id) => {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === 'object' && id.$oid) return new mongoose.Types.ObjectId(id.$oid);
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    return null;
  }
};

// This function won't be used since we're using the inline implementation in parentRoutes.js
exports.getParentProfile = async (req, res) => {
  try {
    const parentId = req.params.id;
    console.log("Getting parent profile for ID:", parentId);

    if (!parentId) {
      return res.status(400).json({ message: 'Parent ID is required' });
    }

    // Connect to the parent database
    const parentDb = mongoose.connection.useDb('parent');
    const parentCollection = parentDb.collection('parent_profile');

    // Convert the parentId string to ObjectId
    let parentObjId;
    try {
      parentObjId = new mongoose.Types.ObjectId(parentId);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid parent ID format' });
    }

    // Find parent by ID
    const parentProfile = await parentCollection.findOne({ _id: parentObjId });

    if (!parentProfile) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Format parent data
    const firstName = parentProfile.firstName || '';
    const middleName = parentProfile.middleName || '';
    const lastName = parentProfile.lastName || '';
    
    let fullName = firstName;
    if (middleName) fullName += ` ${middleName}`;
    if (lastName) fullName += ` ${lastName}`;

    const parentInfo = {
      id: parentProfile._id,
      name: fullName.trim(),
      email: parentProfile.email || '',
      contact: parentProfile.contact || '',
      address: parentProfile.address || '',
      civilStatus: parentProfile.civilStatus || '',
      gender: parentProfile.gender || '',
      occupation: parentProfile.occupation || '',
      profileImageUrl: parentProfile.profileImageUrl || ''
    };

    return res.json(parentInfo);
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};