// src/services/adminDashboardService.js
/**
 * Admin Dashboard Service
 * This service handles all data fetching for the admin dashboard.
 */
// Configuration for the service
const config = {
  useMockData: false, // Changed to false to use real data
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  refreshInterval: 30000,
  collections: {
    users: 'users',
    activities: 'activities',
    assessments: 'assessments',
    prescriptiveData: 'prescriptiveData',
    submissions: 'submissions',
    assignments: 'assignments'
  }
};

// Import axios for API calls
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
    baseURL: `${API_URL}/dashboard`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
    }
);

/**
 * Database query templates for MongoDB integration
 * These can be used when transitioning from mock data to real database
 */
const mongoQueries = {
  getUserStats: {
    totalUsers: { $match: {} },
    activeUsers: { $match: { lastActive: { $gte: new Date(Date.now() - 24*60*60*1000) } } },
    userTypes: { $group: { _id: '$userType', count: { $sum: 1 } } }
  },
  getActivityStats: {
    totalActivities: { $match: { type: 'activity' } },
    completedActivities: { $match: { status: 'completed' } },
    pendingApprovals: { $match: { status: 'pending_approval' } }
  },
  getStudentPerformance: {
    byReadingLevel: {
      $group: {
        _id: '$readingLevel',
        count: { $sum: 1 },
        avgScore: { $avg: '$averageScore' }
      }
    },
    challengeAreas: {
      $group: {
        _id: '$challengeArea',
        studentCount: { $sum: 1 },
        avgScore: { $avg: '$scores.$challengeArea' }
      }
    }
  },
  getTeacherPerformance: {
    topPerformers: {
      $group: {
        _id: '$teacherId',
        studentsHelped: { $sum: 1 },
        avgImprovement: { $avg: '$studentImprovement' },
        activitiesCreated: { $sum: '$activitiesCreated' }
      }
    }
  },
  // Submissions queries
  getSubmissions: {
    byGrade: {
      $match: { 
        grade: 'Grade 1',
        antas: { $in: ['Antas 1', 'Antas 2'] }
      }
    },
    pending: {
      $match: { status: 'pending' }
    },
    flagged: {
      $match: { status: 'flagged' }
    },
    recent: {
      $sort: { submissionDate: -1 },
      $limit: 50
    }
  },
  getSubmissionStats: {
    totalCount: [
      { $match: { grade: 'Grade 1' } },
      { $count: 'total' }
    ],
    statusDistribution: [
      { $match: { grade: 'Grade 1' } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ],
    averageScore: [
      { $match: { grade: 'Grade 1', status: 'graded' } },
      { $group: { _id: null, avgScore: { $avg: { $multiply: [ { $divide: ['$score', '$totalPoints'] }, 100 ] } } } }
    ]
  }
};

/**
 * API utility functions
 */
const api = {
  get: async (endpoint) => {
    if (config.useMockData) {
      // Return mock data instead of making API call
      return mockDataService[endpoint]();
    }
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  post: async (endpoint, data) => {
    if (config.useMockData) {
      console.log('Mock POST to:', endpoint, data);
      return { success: true };
    }
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },
  // MongoDB query helper (for future use)
  mongoQuery: async (collection, query, options = {}) => {
    const endpoint = `/mongodb/${collection}/find`;
    const data = { query, options };
    return api.post(endpoint, data);
  }
};

/**
 * Mock data service
 * This provides realistic mock data for the dashboard
 */
const mockDataService = {
  getDashboardStats: () => {
    return Promise.resolve({
      users: {
        total: 2456,
        students: 1950,
        teachers: 126,
        parents: 350,
        admins: 30,
        activeToday: 487,
        userGrowth: {
          month: 12.5,
          week: 3.2,
          day: 0.8
        }
      },
      activities: {
        totalApproved: 103,
        pendingApproval: 20,
        rejected: 5,
        totalActivities: 450,
        completedActivities: 3250,
        averageCompletionRate: 67.5,
        completionTrend: 'up'
      },
      prescriptiveAnalytics: {
        highPriorityStudents: 20,
        needingIntervention: 45,
        onTarget: 1250,
        excelling: 635,
        averageReadingLevel: 2.3,
        improvementRate: 15.2
      },
      academicData: {
        averageScore: 52,
        overallTrend: 'improving',
        patternAnalysis: {
          phonics: 55,
          wordRecognition: 48,
          comprehension: 52,
          fluency: 50,
          vocabulary: 58
        },
        antasDistribution: {
          'Antas 1': 580,
          'Antas 2': 690,
          'Antas 3': 490,
          'Antas 4': 190,
          'Antas 5': 0
        },
        assessmentCompletion: {
          preAssessment: 95,
          ongoing: 78,
          postAssessment: 45
        }
      },
      systemHealth: {
        uptime: 99.9,
        activeUsers: 487,
        avgResponseTime: 250,
        errorRate: 0.1,
        databaseHealth: 'good',
        serverLoad: 35
      }
    });
  },
  
  // Mock submissions data service
  getSubmissions: (filter = {}) => {
    const mockSubmissions = [
      {
        id: 'SUB001',
        studentName: 'Maria Santos',
        studentId: 'ST001',
        grade: 'Grade 1',
        section: 'Sampaguita',
        antas: 'Antas 1',
        activityTitle: 'Mga Uri ng Pangungusap',
        activityType: 'Worksheet',
        submissionDate: new Date().toISOString(),
        dueDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        score: null,
        totalPoints: 20,
        teacherComments: '',
        attachments: 2,
        timeSpent: '15 mins'
      },
      {
        id: 'SUB002',
        studentName: 'Juan dela Cruz',
        studentId: 'ST002',
        grade: 'Grade 1',
        section: 'Sampaguita',
        antas: 'Antas 2',
        activityTitle: 'Salitang Naglalarawan',
        activityType: 'Quiz',
        submissionDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date().toISOString(),
        status: 'graded',
        score: 18,
        totalPoints: 20,
        teacherComments: 'Mahusay! Pero tandaan ang tamang pagbigkas ng "mayaman".',
        attachments: 1,
        timeSpent: '12 mins'
      },
      {
        id: 'SUB003',
        studentName: 'Anna Reyes',
        studentId: 'ST003',
        grade: 'Grade 1',
        section: 'Rosal',
        antas: 'Antas 1',
        activityTitle: 'Pangngalan',
        activityType: 'Assignment',
        submissionDate: new Date(new Date().getTime() - 48 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        score: null,
        totalPoints: 15,
        teacherComments: '',
        attachments: 3,
        timeSpent: '18 mins'
      },
      {
        id: 'SUB004',
        studentName: 'Pedro Gomez',
        studentId: 'ST004',
        grade: 'Grade 1',
        section: 'Orchid',
        antas: 'Antas 2',
        activityTitle: 'Pandiwa',
        activityType: 'Practice',
        submissionDate: new Date(new Date().getTime() - 72 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(new Date().getTime() - 48 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        score: 12,
        totalPoints: 15,
        teacherComments: 'Kailangan ng karagdagang pagsasanay sa mga aspekto ng pandiwa.',
        attachments: 1,
        timeSpent: '22 mins'
      },
      {
        id: 'SUB005',
        studentName: 'Sofia Lim',
        studentId: 'ST005',
        grade: 'Grade 1',
        section: 'Sampaguita',
        antas: 'Antas 1',
        activityTitle: 'Sanhi at Bunga',
        activityType: 'Interactive',
        submissionDate: new Date(new Date().getTime() - 96 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(new Date().getTime() - 72 * 60 * 60 * 1000).toISOString(),
        status: 'graded',
        score: 20,
        totalPoints: 20,
        teacherComments: 'Napakagaling! Perfect score sa pagkilala ng sanhi at bunga.',
        attachments: 0,
        timeSpent: '25 mins'
      },
      {
        id: 'SUB006',
        studentName: 'Miguel Torres',
        studentId: 'ST006',
        grade: 'Grade 1',
        section: 'Rosal',
        antas: 'Antas 1',
        activityTitle: 'Mga Uri ng Pangungusap',
        activityType: 'Worksheet',
        submissionDate: new Date(new Date().getTime() - 120 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(new Date().getTime() - 96 * 60 * 60 * 1000).toISOString(),
        status: 'flagged',
        score: null,
        totalPoints: 20,
        teacherComments: '',
        attachments: 1,
        timeSpent: '8 mins',
        flagReason: 'Possible copying detected'
      }
    ];
    
    // Apply filters
    let filtered = mockSubmissions;
    
    if (filter.status) {
      filtered = filtered.filter(s => s.status === filter.status);
    }
    if (filter.activityType) {
      filtered = filtered.filter(s => s.activityType === filter.activityType);
    }
    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.studentName.toLowerCase().includes(search) ||
        s.activityTitle.toLowerCase().includes(search) ||
        s.section.toLowerCase().includes(search)
      );
    }
    if (filter.antas) {
      filtered = filtered.filter(s => s.antas === filter.antas);
    }
    
    // Apply sorting
    if (filter.sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[filter.sortBy];
        let bVal = b[filter.sortBy];
        
        if (filter.sortBy === 'submissionDate' || filter.sortBy === 'dueDate') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (filter.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    return Promise.resolve(filtered);
  },
  
  getSubmissionStats: () => {
    return Promise.resolve({
      total: 6,
      pending: 2,
      graded: 3,
      flagged: 1,
      averageScore: 83,
      averageCompletionTime: '17 mins',
      submissionsToday: 2,
      upcomingDeadlines: 3
    });
  },
  
  getActivityTypes: () => {
    return Promise.resolve([
      'Worksheet',
      'Quiz', 
      'Assignment',
      'Practice',
      'Interactive'
    ]);
  },
  
  getSections: () => {
    return Promise.resolve([
      'Sampaguita',
      'Rosal',
      'Orchid'
    ]);
  },
  
  // Continue with the rest of the mock data service methods...
  getRecentActivities: (limit = 10) => {
    const activityTypes = [
      'student_assessment',
      'teacher_activity',
      'parent_engagement',
      'system_alert',
      'approval',
      'user_registration',
      'data_export',
      'system_update'
    ];
    
    const statuses = ['success', 'warning', 'error', 'pending', 'info'];
    
    const activities = {
      student_assessment: [
        'Completed Phonics Assessment - Antas 2',
        'Submitted Comprehension Test - Antas 3',
        'Finished Pre-assessment evaluation',
        'Achieved 90% in Word Recognition'
      ],
      teacher_activity: [
        'Submitted new activity for approval',
        'Updated lesson plan for Antas 2',
        'Created custom assessment',
        'Submitted weekly progress report'
      ],
      parent_engagement: [
        'Viewed Ana Ramirez progress report',
        'Downloaded monthly assessment',
        'Scheduled parent-teacher meeting',
        'Accessed student dashboard'
      ],
      system_alert: [
        'Low performance detected',
        'System maintenance required',
        'Database backup completed',
        'New security patch applied'
      ],
      approval: [
        'Activity approved by admin',
        'Assessment template approved',
        'New user account approved',
        'Resource permission granted'
      ],
      user_registration: [
        'New student registered',
        'New teacher onboarded',
        'Parent account created',
        'Admin user added'
      ],
      data_export: [
        'Monthly report generated',
        'Student data exported',
        'Assessment results exported',
        'Analytics dashboard exported'
      ],
      system_update: [
        'System updated to v2.3.0',
        'New feature deployed',
        'Security patch applied',
        'Database optimized'
      ]
    };
    
    const generateActivity = (index) => {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const actionsForType = activities[type] || [];
      const action = actionsForType.length > 0 
        ? actionsForType[Math.floor(Math.random() * actionsForType.length)] 
        : 'Performed an action';
      
      const firstNames = ['Juan', 'Maria', 'Pedro', 'Ana', 'Carlos'];
      const lastNames = ['Cruz', 'Santos', 'Reyes', 'Gomez', 'Mendoza'];
      
      return {
        id: Date.now() + index,
        type,
        user: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        action,
        timestamp: new Date(Date.now() - Math.random() * 3600000 * 24).toISOString(),
        status,
        details: `Score: ${Math.floor(Math.random() * 100)}/100`
      };
    };
    
    return Promise.resolve(
      Array.from({ length: limit }, (_, i) => generateActivity(i))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );
  },
  
  // Continue with all other mock data service methods...
  getSystemAlerts: () => {
    return Promise.resolve([
      {
        id: 'alert_001',
        type: 'critical',
        title: 'Reading Comprehension Performance Alert',
        message: '15 students in Antas 2 scoring below 40% in comprehension activities over the past week',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        action: 'View Details',
        impact: 'high',
        category: 'academic_performance'
      },
      {
        id: 'alert_002',
        type: 'warning',
        title: 'Pending Teacher Approvals',
        message: '8 activities have been awaiting approval for more than 24 hours',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        action: 'Review Pending',
        impact: 'medium',
        category: 'workflow'
      },
      {
        id: 'alert_003',
        type: 'info',
        title: 'Weekly Performance Report Available',
        message: 'Performance analytics for week 3-2025 are now ready for review and download',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        action: 'Download Report',
        impact: 'low',
        category: 'reporting'
      },
      {
        id: 'alert_004',
        type: 'warning',
        title: 'Low Parent Engagement',
        message: 'Parent dashboard access has decreased by 25% this month',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        action: 'View Analytics',
        impact: 'medium',
        category: 'engagement'
      }
    ]);
  },
  
  // Rest of the mock data service methods...
  getPrescriptiveAnalytics: () => {
    return Promise.resolve({
      studentCategories: [
        {
          category: 'excelling',
          label: 'Excelling Students',
          count: 635,
          color: '#4CAF50',
          details: 'Students performing above 80% consistently',
          trend: 'up',
          percentage: 32.5
        },
        {
          category: 'onTarget',
          label: 'On Target',
          count: 1250,
          color: '#2196F3',
          details: 'Students meeting expected progress',
          trend: 'stable',
          percentage: 64.1
        },
        {
          category: 'needingSupport',
          label: 'Needing Support',
          count: 45,
          color: '#FF9800',
          details: 'Students requiring additional interventions',
          trend: 'down',
          percentage: 2.3
        },
        {
          category: 'highPriority',
          label: 'High Priority',
          count: 20,
          color: '#F44336',
          details: 'Students requiring immediate intervention',
          trend: 'down',
          percentage: 1.0
        }
      ],
      commonChallenges: [
        {
          area: 'Phonological Awareness',
          affectedStudents: 420,
          averageScore: 48,
          trend: 'improving',
          improvementRate: 5.2,
          targetScore: 75
        },
        {
          area: 'Word Recognition',
          affectedStudents: 380,
          averageScore: 52,
          trend: 'stable',
          improvementRate: 1.1,
          targetScore: 80
        },
        {
          area: 'Reading Comprehension',
          affectedStudents: 520,
          averageScore: 45,
          trend: 'declining',
          improvementRate: -2.3,
          targetScore: 70
        },
        {
          area: 'Reading Fluency',
          affectedStudents: 350,
          averageScore: 55,
          trend: 'improving',
          improvementRate: 3.8,
          targetScore: 85
        },
        {
          area: 'Vocabulary',
          affectedStudents: 280,
          averageScore: 58,
          trend: 'improving',
          improvementRate: 4.5,
          targetScore: 75
        }
      ],
      interventionRecommendations: [
        {
          area: 'Reading Comprehension',
          recommendation: 'Implement daily reading sessions with guided questions',
          priority: 'high',
          expectedImprovement: 15
        },
        {
          area: 'Phonological Awareness',
          recommendation: 'Increase use of audio-visual learning aids',
          priority: 'medium',
          expectedImprovement: 10
        }
      ]
    });
  },
  
  getTeacherPerformance: () => {
    return Promise.resolve({
      topPerformers: [
        {
          id: 't_001',
          name: 'Ms. Maria Santos',
          studentsHelped: 45,
          averageImprovement: 38,
          rating: 4.9,
          department: 'Grade 1',
          specialization: 'Reading Comprehension'
        },
        {
          id: 't_002',
          name: 'Mr. Juan Torres',
          studentsHelped: 38,
          averageImprovement: 35,
          rating: 4.8,
          department: 'Grade 2',
          specialization: 'Phonics'
        },
        {
          id: 't_003',
          name: 'Ms. Isabella Cruz',
          studentsHelped: 42,
          averageImprovement: 32,
          rating: 4.7,
          department: 'Grade 3',
          specialization: 'Writing'
        },
        {
          id: 't_004',
          name: 'Mr. Pedro Ramirez',
          studentsHelped: 35,
          averageImprovement: 30,
          rating: 4.6,
          department: 'Special Education',
          specialization: 'Intervention'
        },
        {
          id: 't_005',
          name: 'Ms. Ana Gomez',
          studentsHelped: 40,
          averageImprovement: 28,
          rating: 4.5,
          department: 'Grade 1',
          specialization: 'Vocabulary'
        }
      ],
      engagement: {
        activitiesCreated: 128,
        studentsMonitored: 1250,
        parentCommunications: 340,
        averageResponseTime: 4.2,
        weeklyContribution: {
          newActivities: 12,
          assessmentsGraded: 156,
          progressReports: 45,
          parentMeetings: 8
        }
      },
      performance: {
        overallRating: 4.5,
        engagementRate: 92,
        completionRate: 89,
        satisfactionRate: 94
      },
      departments: [
        { name: 'Grade 1', teachers: 35, avgPerformance: 4.6, studentsImpact: 420 },
        { name: 'Grade 2', teachers: 32, avgPerformance: 4.5, studentsImpact: 390 },
        { name: 'Grade 3', teachers: 28, avgPerformance: 4.4, studentsImpact: 380 },
        { name: 'Special Education', teachers: 15, avgPerformance: 4.7, studentsImpact: 75 },
        { name: 'Intervention', teachers: 10, avgPerformance: 4.8, studentsImpact: 60 }
      ]
    });
  },
  
  getStudentProgress: () => {
    return Promise.resolve({
      overall: {
        averageProgress: 67.5,
        completionRate: 82.3,
        engagementRate: 78.9,
        retentionRate: 94.2
      },
      byAntas: {
        'Antas 1': {
          progress: 75.2,
          students: 580,
          avgScore: 68,
          challenges: ['Phonics', 'Letter Recognition']
        },
        'Antas 2': {
          progress: 69.8,
          students: 690,
          avgScore: 62,
          challenges: ['Word Recognition', 'Simple Comprehension']
        },
        'Antas 3': {
          progress: 64.5,
          students: 490,
          avgScore: 58,
          challenges: ['Reading Fluency', 'Complex Comprehension']
        },
        'Antas 4': {
          progress: 58.2,
          students: 190,
          avgScore: 54,
          challenges: ['Advanced Comprehension', 'Critical Thinking']
        }
      },
      progressTrends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          progress: 65 + Math.random() * 10
        })).reverse(),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          progress: 60 + Math.random() * 15
        })),
        monthly: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
          progress: 58 + Math.random() * 20
        })).reverse()
      }
    });
  },
  
  getParentEngagement: () => {
    return Promise.resolve({
      overall: {
        activeParents: 280,
        totalParents: 350,
        engagementRate: 80,
        avgWeeklyLogins: 3.5
      },
      activities: {
        dashboardViews: 1250,
        reportDownloads: 420,
        teacherCommunications: 340,
        meetingsScheduled: 85,
        feedbackSubmitted: 195
      },
      satisfaction: {
        overall: 4.3,
        communication: 4.5,
        reportClarity: 4.2,
        systemUsability: 4.1,
        support: 4.4
      },
      trends: {
        monthly: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
          engagement: 75 + Math.random() * 15
        })).reverse()
      }
    });
  }
};

/**
 * Main service class for admin dashboard
 * This class provides all the data needed for the admin dashboard
 * and can easily be switched between mock data and real MongoDB queries
 */
class AdminDashboardService {
  constructor() {
    this.mockData = mockDataService;
  }
  
  // Dashboard statistics
  async getDashboardStats() {
    try {
      console.log('Fetching dashboard stats...');
      const response = await axiosInstance.get('/stats');
      console.log('Dashboard response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
  
  // Recent activities
  async getRecentActivities(limit = 10) {
    if (config.useMockData) {
      return this.mockData.getRecentActivities(limit);
    }
    return api.mongoQuery(config.collections.systemLogs, {
      $match: {},
      $sort: { timestamp: -1 },
      $limit: limit
    });
  }
  
  // System alerts
  async getSystemAlerts() {
    if (config.useMockData) {
      return this.mockData.getSystemAlerts();
    }
    return api.get('/dashboard/alerts');
  }
  
  // Prescriptive analytics
  async getPrescriptiveAnalytics() {
    if (config.useMockData) {
      return this.mockData.getPrescriptiveAnalytics();
    }
    return api.get('/dashboard/prescriptive-analytics');
  }
  
  // Teacher performance
  async getTeacherPerformance() {
    if (config.useMockData) {
      return this.mockData.getTeacherPerformance();
    }
    return api.mongoQuery(config.collections.teacherPerformance,
      mongoQueries.getTeacherPerformance
    );
  }
  
  // Student progress
  async getStudentProgress() {
    if (config.useMockData) {
      return this.mockData.getStudentProgress();
    }
    return api.get('/dashboard/student-progress');
  }
  
  // Parent engagement
  async getParentEngagement() {
    if (config.useMockData) {
      return this.mockData.getParentEngagement();
    }
    return api.get('/dashboard/parent-engagement');
  }
  
  // === SUBMISSIONS-RELATED METHODS ===
  
  // Get all submissions for Grade 1 students
  async getSubmissions(filter = {}) {
    if (config.useMockData) {
      return this.mockData.getSubmissions(filter);
    }
    
    const query = {
      grade: 'Grade 1',
      antas: { $in: ['Antas 1', 'Antas 2'] }
    };
    
    if (filter.status) query.status = filter.status;
    if (filter.activityType) query.activityType = filter.activityType;
    if (filter.antas) query.antas = filter.antas;
    
    const options = {};
    if (filter.sortBy) {
      options.sort = { [filter.sortBy]: filter.sortOrder === 'desc' ? -1 : 1 };
    }
    
    return api.mongoQuery(config.collections.submissions, query, options);
  }
  
  // Get submissions statistics
  async getSubmissionStats() {
    if (config.useMockData) {
      return this.mockData.getSubmissionStats();
    }
    
    const [total, statusDist, avgScore] = await Promise.all([
      api.mongoQuery(config.collections.submissions, ...mongoQueries.getSubmissionStats.totalCount),
      api.mongoQuery(config.collections.submissions, ...mongoQueries.getSubmissionStats.statusDistribution),
      api.mongoQuery(config.collections.submissions, ...mongoQueries.getSubmissionStats.averageScore)
    ]);
    
    const stats = { total: total[0]?.total || 0 };
    statusDist.forEach(item => {
      stats[item._id] = item.count;
    });
    stats.averageScore = avgScore[0]?.avgScore || 0;
    
    return stats;
  }
  
  // Get available activity types
  async getActivityTypes() {
    if (config.useMockData) {
      return this.mockData.getActivityTypes();
    }
    
    const types = await api.mongoQuery(config.collections.submissions, [
      { $match: { grade: 'Grade 1' } },
      { $group: { _id: '$activityType' } },
      { $sort: { _id: 1 } }
    ]);
    return types.map(t => t._id);
  }
  
  // Get available sections
  async getSections() {
    if (config.useMockData) {
      return this.mockData.getSections();
    }
    
    const sections = await api.mongoQuery(config.collections.users, [
      { $match: { userType: 'student', grade: 'Grade 1' } },
      { $group: { _id: '$section' } },
      { $sort: { _id: 1 } }
    ]);
    return sections.map(s => s._id);
  }
  
  // Grade a submission
  async gradeSubmission(submissionId, score, totalPoints, comments = '') {
    if (config.useMockData) {
      console.log('Mock grading submission:', submissionId, score, totalPoints, comments);
      return { success: true };
    }
    
    return api.post(`/submissions/${submissionId}/grade`, {
      score,
      totalPoints,
      comments,
      status: 'graded'
    });
  }
  
  // Flag a submission
  async flagSubmission(submissionId, reason) {
    if (config.useMockData) {
      console.log('Mock flagging submission:', submissionId, reason);
      return { success: true };
    }
    
    return api.post(`/submissions/${submissionId}/flag`, {
      reason,
      status: 'flagged'
    });
  }
  
  // Get submission details
  async getSubmissionDetails(submissionId) {
    if (config.useMockData) {
      const submissions = await this.mockData.getSubmissions();
      return submissions.find(s => s.id === submissionId) || null;
    }
    
    return api.get(`/submissions/${submissionId}`);
  }
  
  // Export submissions data
  async exportSubmissions(format = 'csv', filter = {}) {
    const submissions = await this.getSubmissions(filter);
    
    if (format === 'csv') {
      const headers = [
        'Student Name',
        'Student ID',
        'Section',
        'Antas',
        'Activity Title',
        'Activity Type',
        'Submission Date',
        'Due Date',
        'Status',
        'Score',
        'Total Points',
        'Time Spent',
        'Teacher Comments'
      ];
      
      const rows = submissions.map(sub => [
        sub.studentName,
        sub.studentId,
        sub.section,
        sub.antas,
        sub.activityTitle,
        sub.activityType,
        new Date(sub.submissionDate).toLocaleString('en-PH'),
        new Date(sub.dueDate).toLocaleString('en-PH'),
        sub.status,
        sub.score || '-',
        sub.totalPoints,
        sub.timeSpent,
        sub.teacherComments || '-'
      ]);
      
      const csv = [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      return {
        data: csv,
        filename: `submissions_grade1_${new Date().toISOString().split('T')[0]}.csv`,
        contentType: 'text/csv'
      };
    }
    
    // JSON export
    return {
      data: JSON.stringify(submissions, null, 2),
      filename: `submissions_grade1_${new Date().toISOString().split('T')[0]}.json`,
      contentType: 'application/json'
    };
  }
  
  // Get pending submissions requiring review
  async getPendingSubmissions() {
    return this.getSubmissions({ status: 'pending' });
  }
  
  // Get flagged submissions
  async getFlaggedSubmissions() {
    return this.getSubmissions({ status: 'flagged' });
  }
  
  // Get overdue submissions
  async getOverdueSubmissions() {
    const submissions = await this.getSubmissions();
    const now = new Date();
    
    return submissions.filter(sub => 
      sub.status === 'pending' && 
      new Date(sub.dueDate) < now
    );
  }
  
  // Get activity performance analytics
  async getActivityPerformance() {
    if (config.useMockData) {
      return {
        byActivityType: [
          { type: 'Worksheet', averageScore: 85, completionRate: 92 },
          { type: 'Quiz', averageScore: 78, completionRate: 88 },
          { type: 'Assignment', averageScore: 82, completionRate: 95 }
        ],
        byAntas: [
          { level: 'Antas 1', averageScore: 78, completionRate: 89 },
          { level: 'Antas 2', averageScore: 83, completionRate: 92 }
        ],
        topActivities: [
          { title: 'Mga Patinig', score: 92, completionCount: 45 },
          { title: 'Pantig', score: 87, completionCount: 38 }
        ]
      };
    }
    
    const [byActivityType, byAntas, topActivities] = await Promise.all([
      api.mongoQuery(config.collections.submissions, [
        { $match: { grade: 'Grade 1', status: 'graded' } },
        { $group: {
          _id: '$activityType',
          averageScore: { $avg: { $multiply: [ { $divide: ['$score', '$totalPoints'] }, 100 ] } },
          completionRate: { $sum: 1 }
        }},
        { $project: {
          type: '$_id',
          averageScore: { $round: ['$averageScore', 2] },
          completionRate: 1
        }}
      ]),
      api.mongoQuery(config.collections.submissions, [
        { $match: { grade: 'Grade 1', status: 'graded' } },
        { $group: {
          _id: '$antas',
          averageScore: { $avg: { $multiply: [ { $divide: ['$score', '$totalPoints'] }, 100 ] } },
          completionRate: { $sum: 1 }
        }},
        { $project: {
          level: '$_id',
          averageScore: { $round: ['$averageScore', 2] },
          completionRate: 1
        }}
      ]),
      api.mongoQuery(config.collections.submissions, [
        { $match: { grade: 'Grade 1', status: 'graded' } },
        { $group: {
          _id: '$activityTitle',
          averageScore: { $avg: { $multiply: [ { $divide: ['$score', '$totalPoints'] }, 100 ] } },
          completionCount: { $sum: 1 }
        }},
        { $project: {
          title: '$_id',
          score: { $round: ['$averageScore', 2] },
          completionCount: 1
        }},
        { $sort: { averageScore: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    return { byActivityType, byAntas, topActivities };
  }
  
  // Get student submission patterns
  async getStudentSubmissionPatterns() {
    if (config.useMockData) {
      return {
        submissionTrends: [
          { date: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split('T')[0], count: 15 },
          { date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], count: 22 },
          { date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString().split('T')[0], count: 18 },
          { date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0], count: 25 },
          { date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], count: 19 },
          { date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0], count: 28 },
          { date: new Date().toISOString().split('T')[0], count: 24 }
        ],
        hourlyPatterns: [
          { hour: '08:00', submissions: 5 },
          { hour: '09:00', submissions: 12 },
          { hour: '10:00', submissions: 18 },
          { hour: '11:00', submissions: 22 },
          { hour: '14:00', submissions: 15 },
          { hour: '15:00', submissions: 25 },
          { hour: '16:00', submissions: 20 }
        ]
      };
    }
    
    const [submissionTrends, hourlyPatterns] = await Promise.all([
      api.mongoQuery(config.collections.submissions, [
        { $match: { grade: 'Grade 1' } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissionDate' } },
          count: { $sum: 1 }
        }},
        { $project: {
          date: '$_id',
          count: 1
        }},
        { $sort: { date: -1 } },
        { $limit: 30 }
      ]),
      api.mongoQuery(config.collections.submissions, [
        { $match: { grade: 'Grade 1' } },
        { $group: {
          _id: { $hour: '$submissionDate' },
          submissions: { $sum: 1 }
        }},
        { $project: {
          hour: { $concat: [{ $toString: '$_id' }, ':00'] },
          submissions: 1
        }},
        { $sort: { _id: 1 } }
      ])
    ]);
    
    return { submissionTrends, hourlyPatterns };
  }
  
  // === UTILITY METHODS ===
  
  // Calculate trends
  calculateTrends(data, timeframe = 'weekly') {
    return data.map((item, index) => ({
      ...item,
      trend: index > 0 ?
        ((item.value - data[index - 1].value) / data[index - 1].value * 100).toFixed(1) :
        0
    }));
  }
  
  // Export all dashboard data
  async exportDashboardData(format = 'json', dateRange = null) {
    const data = await Promise.all([
      this.getDashboardStats(),
      this.getRecentActivities(),
      this.getPrescriptiveAnalytics(),
      this.getTeacherPerformance(),
      this.getSubmissionStats()
    ]);
    
    const dashboardData = {
      exportDate: new Date().toISOString(),
      dateRange,
      stats: data[0],
      activities: data[1],
      prescriptiveAnalytics: data[2],
      teacherPerformance: data[3],
      submissionStats: data[4]
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(dashboardData, null, 2);
      case 'csv':
        return this.convertToCSV(dashboardData);
      default:
        return dashboardData;
    }
  }
  
  // Convert to CSV
  convertToCSV(data) {
    const csv = [];
    // CSV conversion logic can be expanded based on requirements
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        csv.push(`\n--- ${key.toUpperCase()} ---`);
        data[key].forEach(item => {
          csv.push(JSON.stringify(item));
        });
      }
    });
    return csv.join('\n');
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;