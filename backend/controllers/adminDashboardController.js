const mongoose = require('mongoose');

const getDashboardStats = async (req, res) => {
    try {
        console.log('Starting to fetch dashboard stats...');

        // Ensure we have a valid database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection is not ready');
        }

        // Connect to each specific database
        const testDb = mongoose.connection.useDb('test');
        const teachersDb = mongoose.connection.useDb('teachers');
        const parentDb = mongoose.connection.useDb('parent');

        // Get counts from each collection
        const [studentsCount, teachersCount, parentsCount] = await Promise.all([
            testDb.collection('users').countDocuments(),
            teachersDb.collection('profile').countDocuments(),
            parentDb.collection('parent_profile').countDocuments()
        ]);

        // Calculate total users
        const totalUsers = studentsCount + teachersCount + parentsCount;

        // Prepare response data
        const stats = {
            users: {
                total: totalUsers,
                students: studentsCount,
                teachers: teachersCount,
                parents: parentsCount,
                activeToday: totalUsers // For now, assume all users are active
            },
            academicData: {
                averageScore: 85, // Default value
                averageReadingLevel: 2.5 // Default value
            },
            activities: {
                averageCompletionRate: 75,
                completedActivities: studentsCount * 2, // Estimate 2 activities per student
                pendingApproval: Math.floor(studentsCount * 0.3), // Estimate 30% pending
                activitiesCreated: teachersCount * 5, // Estimate 5 activities per teacher
                parentCommunications: parentsCount * 2 // Estimate 2 communications per parent
            },
            prescriptiveAnalytics: {
                highPriorityStudents: Math.floor(studentsCount * 0.1) // Estimate 10% high priority
            }
        };

        console.log('Sending response with stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard statistics', 
            details: error.message
        });
    }
};

module.exports = {
    getDashboardStats
}; 