// routes/Parents/parentRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');

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

/**
 * @route GET /api/parents/profile/:id
 * @desc Get parent profile by ID
 * @access Private (teachers, admins)
 */
router.get('/profile/:id', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const parentId = req.params.id;
    console.log("Getting parent profile for ID:", parentId);

    if (!parentId) {
      return res.status(400).json({ message: 'Parent ID is required' });
    }

    // Try all potential parent collections in different databases
    const databases = ['parent', 'users_web', 'test'];
    const collections = ['parent_profile', 'parents'];
    
    let parentProfile = null;
    let db, collection;
    
    for (const dbName of databases) {
      if (parentProfile) break;
      
      db = mongoose.connection.useDb(dbName);
      console.log(`Checking database: ${dbName}`);
      
      // Get all collections in this database
      const dbCollections = await db.listCollections().toArray();
      const collectionNames = dbCollections.map(c => c.name);
      
      for (const colName of collections) {
        if (!collectionNames.includes(colName)) continue;
        
        collection = db.collection(colName);
        console.log(`Checking collection: ${dbName}.${colName}`);
        
        // Try to find by ObjectId
        const objId = getObjectId(parentId);
        if (objId) {
          parentProfile = await collection.findOne({ _id: objId });
          if (parentProfile) {
            console.log(`Found parent in ${dbName}.${colName} by _id`);
            break;
          }
        }
        
        // Try to find by userId
        if (objId) {
          parentProfile = await collection.findOne({ userId: objId });
          if (parentProfile) {
            console.log(`Found parent in ${dbName}.${colName} by userId`);
            break;
          }
        }
        
        // Try string ID as a last resort
        parentProfile = await collection.findOne({ 
          $or: [
            { _id: parentId },
            { userId: parentId }
          ]
        });
        
        if (parentProfile) {
          console.log(`Found parent in ${dbName}.${colName} by string ID`);
          break;
        }
      }
    }

    if (!parentProfile) {
      console.log(`Parent profile with ID ${parentId} not found in any database`);
      return res.status(404).json({ message: 'Parent profile not found' });
    }
    
    // Get the parent's email from the users collection if available
    let userEmail = "";
    if (parentProfile.userId) {
      try {
        const usersDb = mongoose.connection.useDb('users_web');
        const usersCollection = usersDb.collection('users');
        const userId = getObjectId(parentProfile.userId);
        
        if (userId) {
          const user = await usersCollection.findOne({ _id: userId });
          if (user) {
            userEmail = user.email || "";
          }
        }
      } catch (e) {
        console.warn("Error fetching user email:", e);
      }
    }

    // Format parent information
    const firstName = parentProfile.firstName || '';
    const middleName = parentProfile.middleName || '';
    const lastName = parentProfile.lastName || '';
    
    let name = firstName;
    if (middleName) name += ` ${middleName}`;
    if (lastName) name += ` ${lastName}`;
    
    const response = {
      id: parentProfile._id,
      name: name.trim() || 'Unknown',
      email: parentProfile.email || userEmail || '',
      contact: parentProfile.contact || '',
      address: parentProfile.address || '',
      civilStatus: parentProfile.civilStatus || '',
      gender: parentProfile.gender || '',
      occupation: parentProfile.occupation || '',
      profileImageUrl: parentProfile.profileImageUrl || ''
    };
    
    console.log("Returning parent profile:", response);
    return res.json(response);
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});




module.exports = router;