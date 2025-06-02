// routes/Parents/parentProfile.js
// Adjusted to fix any potential issues

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken, authorize } = require('../../middleware/auth');
const parentProfileController = require('../../controllers/parentProfileController');

// Debug middleware to log all incoming requests to this router
router.use((req, res, next) => {
  console.log('[PARENT ROUTER] Incoming:', req.method, req.originalUrl);
  next();
});

// Get parent profile
router.get('/profile', authenticateToken, authorize('parent', 'magulang'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    console.log('Parent profile request:', {
      userId,
      userEmail,
      userRoles: req.user.roles,
      headers: req.headers,
      token: req.headers.authorization
    });

    // Try to find parent profile in different databases/collections
    const dbNames = ['Literexia', 'parent'];
    const collectionNames = ['parent', 'parent_profile', 'profile'];
    let parentProfile = null;
    let usedDb = null;
    let usedCollection = null;

    console.log('Searching for parent profile in databases:', dbNames);
    console.log('Will search in collections:', collectionNames);

    for (const dbName of dbNames) {
      console.log(`\nTrying database: ${dbName}`);
      const db = mongoose.connection.useDb(dbName);
      
      for (const collName of collectionNames) {
        console.log(`  Checking collection: ${collName}`);
        try {
          const collection = db.collection(collName);
          
          // Try to find by various identifiers
          const query = {
            $or: [
              { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId },
              { userId: userId },
              { email: userEmail?.toLowerCase() }
            ]
          };
          
          console.log('  Using query:', JSON.stringify(query, null, 2));
          
          parentProfile = await collection.findOne(query);

          if (parentProfile) {
            console.log(`✅ Found parent profile in ${dbName}.${collName}:`, parentProfile);
            usedDb = db;
            usedCollection = collection;
            break;
          } else {
            console.log(`  No profile found in ${dbName}.${collName}`);
          }
        } catch (collError) {
          console.log(`❌ Error with collection ${collName} in ${dbName}:`, collError.message);
        }
      }
      if (parentProfile) break;
    }

    // If profile found, ensure it has all required fields
    if (parentProfile) {
      console.log('\nUpdating existing profile with any missing fields');
      // Ensure profile has basic fields
      const updatedFields = {
        updatedAt: new Date()
      };

      if (!parentProfile.userId && userId) {
        updatedFields.userId = mongoose.Types.ObjectId.isValid(userId) ? 
          new mongoose.Types.ObjectId(userId) : userId;
      }

      if (!parentProfile.email && userEmail) {
        updatedFields.email = userEmail.toLowerCase();
      }

      // Update profile if needed
      if (Object.keys(updatedFields).length > 0) {
        try {
          console.log('Updating profile with fields:', updatedFields);
          await usedCollection.updateOne(
            { _id: parentProfile._id },
            { $set: updatedFields }
          );
          parentProfile = { ...parentProfile, ...updatedFields };
          console.log('Profile updated successfully');
        } catch (updateError) {
          console.error('Error updating parent profile:', updateError);
        }
      }

      return res.json(parentProfile);
    }

    console.log('\nNo existing profile found, creating new one');
    // If no profile exists, create a new one in Literexia.parent
    const literexiaDb = mongoose.connection.useDb('Literexia');
    const parentCollection = literexiaDb.collection('parent');

    const newProfile = {
      userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId,
      email: userEmail?.toLowerCase(),
      firstName: '',
      middleName: '',
      lastName: '',
      contactNumber: '',
      address: '',
      civilStatus: '',
      dateOfBirth: '',
      gender: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      console.log('Creating new profile:', newProfile);
      const result = await parentCollection.insertOne(newProfile);
      console.log('Created new parent profile:', result.insertedId);
      newProfile._id = result.insertedId;
      res.json(newProfile);
    } catch (insertError) {
      console.error('Error creating parent profile:', insertError);
      // Return the profile even if save failed
      res.json(newProfile);
    }
  } catch (error) {
    console.error('Error in parent profile route:', error);
    res.status(500).json({ 
      message: 'Error retrieving parent profile', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update parent profile
router.put('/profile', authenticateToken, authorize('parent'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const {
      firstName,
      middleName,
      lastName,
      contactNumber,
      address,
      civilStatus,
      dateOfBirth,
      gender
    } = req.body;

    // Try to find parent profile in different databases/collections
    const dbNames = ['Literexia', 'parent'];
    const collectionNames = ['parent', 'parent_profile', 'profile'];
    let parentProfile = null;
    let usedCollection = null;

    for (const dbName of dbNames) {
      const db = mongoose.connection.useDb(dbName);
      for (const collName of collectionNames) {
        try {
          const collection = db.collection(collName);
          
          // Try to find by various identifiers
          parentProfile = await collection.findOne({
            $or: [
              { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId },
              { userId: userId },
              { email: userEmail?.toLowerCase() }
            ]
          });

          if (parentProfile) {
            console.log(`Found parent profile in ${dbName}.${collName}`);
            usedCollection = collection;
            break;
          }
        } catch (collError) {
          console.log(`Error with collection ${collName} in ${dbName}:`, collError.message);
        }
      }
      if (parentProfile) break;
    }

    // If no profile found, create in Literexia.parent
    if (!parentProfile) {
      const literexiaDb = mongoose.connection.useDb('Literexia');
      usedCollection = literexiaDb.collection('parent');
    }

    const updateData = {
      userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId,
      email: userEmail?.toLowerCase(),
      firstName,
      middleName,
      lastName,
      contactNumber,
      address,
      civilStatus,
      dateOfBirth,
      gender,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Update or create profile
    const result = await usedCollection.findOneAndUpdate(
      parentProfile ? { _id: parentProfile._id } : { email: userEmail?.toLowerCase() },
      { $set: updateData },
      { 
        upsert: true,
        returnDocument: 'after'
      }
    );

    const updatedProfile = result.value || { ...updateData, _id: result.upsertedId };
    res.json(updatedProfile);

  } catch (error) {
    console.error('Error updating parent profile:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Get parent's children - explicitly authorize parent role
router.get('/children', authenticateToken, authorize('parent'), async (req, res) => {
  try {
    const userId = req.user.id;

    // Find parent profile in the correct collection
    const parentDb = mongoose.connection.useDb('parent');
    const parentProfile = await parentDb.collection('parent_profile').findOne({
      $or: [
        { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId },
        { userId: userId }
      ]
    });

    if (!parentProfile) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // If parentProfile has a children array, fetch student details from test.users
    if (parentProfile.children && Array.isArray(parentProfile.children) && parentProfile.children.length > 0) {
      const testDb = mongoose.connection.useDb('test');
      // Only use valid ObjectIds
      const childrenObjectIds = parentProfile.children
        .map(id => id.toString())
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

      if (childrenObjectIds.length === 0) {
        return res.json([]);
      }

      const students = await testDb.collection('users').find({
        _id: { $in: childrenObjectIds }
      }).toArray();
      return res.json(students);
    }

    // Return empty array if no children found
    res.json([]);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this route for password update:
router.put('/profile/password', authenticateToken, authorize('parent'), parentProfileController.updatePassword);

module.exports = router;