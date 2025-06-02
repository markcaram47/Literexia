const mongoose = require('mongoose');

exports.getAdminProfile = async (req, res) => {
    try {
        // Get the admin user ID and email from the request
        const adminEmail = req.user.email;
        const adminId = req.user.id;
        console.log('Looking up admin profile for:', { email: adminEmail, id: adminId });

        // Connect to admin_user database
        const adminUserDb = mongoose.connection.useDb('admin_user');
        const adminProfileCollection = adminUserDb.collection('admin_profile');

        // Find the admin profile by email and userId if available
        const query = { email: adminEmail };
        if (adminId) {
            query.userId = adminId;
        }

        let adminProfile = await adminProfileCollection.findOne(query);
        console.log('Found admin profile:', JSON.stringify(adminProfile, null, 2));

        // If not found with both email and userId, try just email
        if (!adminProfile && adminId) {
            adminProfile = await adminProfileCollection.findOne({ email: adminEmail });
            
            // If found by email but missing userId, update it
            if (adminProfile) {
                await adminProfileCollection.updateOne(
                    { _id: adminProfile._id },
                    { $set: { userId: adminId } }
                );
                adminProfile.userId = adminId;
            }
        }

        if (!adminProfile) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Return the profile data
        return res.status(200).json({
            success: true,
            data: {
                firstName: adminProfile.firstName,
                lastName: adminProfile.lastName,
                email: adminProfile.email,
                profileImageUrl: adminProfile.profileImageUrl || null
            }
        });

    } catch (error) {
        console.error('Error in getAdminProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching admin profile',
            error: error.message
        });
    }
}; 