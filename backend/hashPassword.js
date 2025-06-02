// hashPasswords.js
// This script finds all users with unhashed passwords and converts them to proper bcrypt hashes
// Run with: node hashPasswords.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for confirmation
const confirm = async (message) => {
  return new Promise((resolve) => {
    rl.question(`${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
};

// Main function
async function hashPasswords() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mobile_literexia';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Get users collection
    const usersCollection = mongoose.connection.useDb('users_web').collection('users');

    // Find all users with password field that isn't a bcrypt hash
    const users = await usersCollection.find({
      $or: [
        // Has password that doesn't start with $2a$ or $2b$ (not a bcrypt hash)
        { password: { $exists: true, $not: /^\$2[ab]\$/ } },
        // Has no passwordHash field
        { passwordHash: { $exists: false } },
        // Has both password and passwordHash fields
        { password: { $exists: true }, passwordHash: { $exists: true } }
      ]
    }).toArray();

    console.log(`Found ${users.length} users with non-standard passwords.`);

    if (users.length === 0) {
      console.log('All users have properly hashed passwords!');
      return;
    }

    // Show sample of users
    console.log('\nSample of users that need fixing:');
    const sampleSize = Math.min(users.length, 3);
    for (let i = 0; i < sampleSize; i++) {
      const user = users[i];
      console.log(`- ${user.email} (ID: ${user._id})`);
      console.log(`  Has password field: ${user.password ? 'Yes' : 'No'}`);
      console.log(`  Has passwordHash field: ${user.passwordHash ? 'Yes' : 'No'}`);
    }

    // Ask for confirmation
    const proceed = await confirm('\nDo you want to fix these users?');
    if (!proceed) {
      console.log('Operation cancelled.');
      return;
    }

    // Options for handling existing passwords
    console.log('\nSelect how to handle existing plain passwords:');
    console.log('1. Keep the original password and hash it');
    console.log('2. Generate new secure passwords for all users');
    console.log('3. Set a single temporary password for all users');

    const option = await new Promise((resolve) => {
      rl.question('Enter option number (1-3): ', (answer) => {
        resolve(parseInt(answer));
      });
    });

    let defaultPassword = '';
    if (option === 3) {
      defaultPassword = await new Promise((resolve) => {
        rl.question('Enter temporary password for all users: ', resolve);
      });
    }

    // Process each user
    let fixedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        let newPasswordHash;
        
        if (option === 1 && user.password) {
          // Hash the existing plain password
          newPasswordHash = await bcrypt.hash(user.password, 10);
          console.log(`Hashing existing password for ${user.email}`);
        } else if (option === 2) {
          // Generate a secure random password
          const generatedPassword = Math.random().toString(36).slice(-10) +
            Math.random().toString(36).toUpperCase().slice(-2) +
            Math.floor(Math.random() * 10) +
            '!';
          newPasswordHash = await bcrypt.hash(generatedPassword, 10);
          console.log(`Generated new password for ${user.email}: ${generatedPassword}`);
        } else if (option === 3) {
          // Use the provided temporary password
          newPasswordHash = await bcrypt.hash(defaultPassword, 10);
          console.log(`Set temporary password for ${user.email}`);
        } else {
          // Default case - use a secure default
          newPasswordHash = await bcrypt.hash('Literexia2025!', 10);
          console.log(`Set default password for ${user.email}`);
        }

        // Update the user record
        const updateResult = await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { passwordHash: newPasswordHash },
            $unset: { password: "" }  // Remove the plaintext password field
          }
        );

        if (updateResult.modifiedCount === 1) {
          fixedCount++;
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log(`\nOperation complete:`);
    console.log(`- Fixed ${fixedCount} users successfully`);
    console.log(`- Encountered errors with ${errorCount} users`);

    if (errorCount > 0) {
      console.log('\nPlease check the logs for errors.');
    }

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    
    // Close readline interface
    rl.close();
  }
}

// Run the script
hashPasswords();