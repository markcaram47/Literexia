// services/Teachers/DashboardApiService.js
import axios from 'axios';

// API base URL from environment variable
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Add mock data for when API is unavailable
const MOCK_DASHBOARD_DATA = {
  students: [
    {
      id: 'st001',
      name: 'JAJA Percival Mark',
      readingLevel: 'Not Assessed',
      section: 'Hope',
      needsAttention: true,
      completionRate: 0,
      lastScore: 0,
      categoriesForImprovement: ['Needs assessment to determine areas for improvement']
    },
    {
      id: 'st002',
      name: 'Rainn Mae Sarmiento',
      readingLevel: 'Not Assessed',
      section: 'Section 2',
      needsAttention: true,
      completionRate: 0,
      lastScore: 0,
      categoriesForImprovement: ['Needs assessment to determine areas for improvement']
    },
    {
      id: 'st003',
      name: 'Rainn Pascual Aganan',
      readingLevel: 'At Grade Level',
      section: 'Hope',
      needsAttention: false,
      completionRate: 100,
      lastScore: 95,
      categoriesForImprovement: []
    },
    {
      id: 'st004',
      name: 'Kit Nicholas Rish Mark',
      readingLevel: 'Low Emerging',
      section: 'Hope',
      needsAttention: true,
      completionRate: 60,
      lastScore: 45,
      categoriesForImprovement: ['Alphabet Knowledge', 'Phonological Awareness']
    },
    {
      id: 'st005',
      name: 'Kit Nicholas Percival Carammmm',
      readingLevel: 'Developing',
      section: 'Hope',
      needsAttention: true,
      completionRate: 75,
      lastScore: 65,
      categoriesForImprovement: ['Reading Comprehension']
    },
    {
      id: 'st006',
      name: 'Pia Zop Rey',
      readingLevel: 'Transitioning',
      section: 'Section 2',
      needsAttention: true,
      completionRate: 80,
      lastScore: 72,
      categoriesForImprovement: ['Decoding', 'Word Recognition']
    },
    {
      id: 'st007',
      name: 'Neo David',
      readingLevel: 'At Grade Level',
      section: 'Section 1',
      needsAttention: false,
      completionRate: 100,
      lastScore: 92,
      categoriesForImprovement: []
    }
  ],
  studentsNeedingAttention: [
    {
      id: 'st001',
      name: 'JAJA Percival Mark',
      readingLevel: 'Not Assessed',
      section: 'Hope',
      reason: 'Needs assessment'
    },
    {
      id: 'st004',
      name: 'Kit Nicholas Rish Mark',
      readingLevel: 'Low Emerging',
      section: 'Hope',
      reason: 'Poor performance in Alphabet Knowledge'
    }
  ],
  readingLevelDistribution: [
    { name: 'Not Assessed', count: 2, color: '#E0E0E0' },
    { name: 'Low Emerging', count: 1, color: '#FF6B6B' },
    { name: 'Developing', count: 1, color: '#FFC154' },
    { name: 'Transitioning', count: 1, color: '#47B39C' },
    { name: 'At Grade Level', count: 2, color: '#0086CF' }
  ],
  metrics: {
    totalStudents: 7,
    completionRate: 74,
    averageScore: 68,
    pendingEdits: 2
  },
  prescriptiveData: [],
  sections: ['Hope', 'Section 1', 'Section 2'],
  progressData: {
    weekly: [
      { name: 'Week 1', score: 45 },
      { name: 'Week 2', score: 52 },
      { name: 'Week 3', score: 58 },
      { name: 'Week 4', score: 68 }
    ],
    monthly: [
      { name: 'Jan', score: 40 },
      { name: 'Feb', score: 45 },
      { name: 'Mar', score: 55 },
      { name: 'Apr', score: 68 }
    ]
  },
  interventionProgress: [
    {
      studentName: 'JAJA Percival Mark',
      interventionPlanName: 'Phonological Awareness Plan',
      studentReadingLevel: 'Not Assessed',
      percentComplete: 100,
      percentCorrect: 75,
      lastActivityDate: '2023-05-15',
      createdDate: '2023-05-01',
      status: 'Resolved'
    },
    {
      studentName: 'Kit Nicholas Rish Mark',
      interventionPlanName: 'Alphabet Knowledge Plan',
      studentReadingLevel: 'Low Emerging',
      percentComplete: 100,
      percentCorrect: 66.67,
      lastActivityDate: '2023-05-14',
      createdDate: '2023-05-02',
      status: 'In Progress'
    },
    {
      studentName: 'Rainn Mae Sarmiento',
      interventionPlanName: 'Reading Assessment Plan',
      studentReadingLevel: 'Not Assessed',
      percentComplete: 0,
      percentCorrect: 0,
      lastActivityDate: 'N/A',
      createdDate: '2023-05-03',
      status: 'In Progress'
    },
    {
      studentName: 'Kit Nicholas Percival Carammmm',
      interventionPlanName: 'Reading Comprehension Plan',
      studentReadingLevel: 'Developing',
      percentComplete: 45,
      percentCorrect: 62,
      lastActivityDate: '2023-05-10',
      createdDate: '2023-05-01',
      status: 'In Progress'
    },
    {
      studentName: 'Pia Zop Rey',
      interventionPlanName: 'Decoding Skills Plan',
      studentReadingLevel: 'Transitioning',
      percentComplete: 75,
      percentCorrect: 81,
      lastActivityDate: '2023-05-12',
      createdDate: '2023-04-28',
      status: 'In Progress'
    }
  ]
};

/**
 * Service for handling Dashboard API requests
 */
class DashboardApiService {
  /**
   * Fetch all dashboard data in a single request
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Dashboard data
   */
  static async getDashboardData(authHeaders) {
    try {
      console.log('Fetching dashboard data from API...');
      
      // Create axios instance with timeout
      const instance = axios.create({
        timeout: 8000, // 8 second timeout
      });
      
      const response = await instance.get(`${API_BASE_URL}/dashboard/data`, authHeaders);
      
      if (response.data) {
        console.log('Successfully retrieved dashboard data');
        return response.data;
      } else {
        console.warn('Dashboard data response was empty, using fallback data');
        return await this.getFallbackData();
      }
    } catch (error) {
      // Detailed error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`Error fetching dashboard data: Status ${error.response.status}`);
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error fetching dashboard data: No response received');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error fetching dashboard data:', error.message);
      }
      
      console.log('Using fallback data instead');
      return await this.getFallbackData();
    }
  }

  /**
   * Get fallback data from static JSON file or use in-memory mock data
   * @returns {Promise<Object>} - Fallback dashboard data
   */
  static async getFallbackData() {
    try {
      // Try to fetch the static JSON file first
      const response = await fetch('./dashboard-mock.json');
      if (response.ok) {
        console.log('Using static JSON file for dashboard data');
        return await response.json();
      }
    } catch (error) {
      console.warn('Error loading static JSON, using in-memory mock data:', error);
    }
    
    // Fallback to in-memory mock data
    console.log('Using in-memory mock data for dashboard');
    return MOCK_DASHBOARD_DATA;
  }

  /**
   * Get parent profile by ID
   * @param {string} parentId - Parent ID
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Parent profile
   */
  static async getParentProfile(parentId, authHeaders) {
    try {
      if (!parentId) {
        return { 
          name: 'Not Specified',
          address: 'Address not available' 
        };
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/parent/${parentId}`,
        authHeaders
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      return { 
        name: 'Not Found',
        address: 'Address not available' 
      };
    }
  }

  /**
   * Update activity status
   * @param {string} activityId - ID of the activity to update
   * @param {string} status - New status
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Updated activity
   */
  static async updateActivityStatus(activityId, status, authHeaders) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/dashboard/update-activity/${activityId}`,
        { status },
        authHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Error updating activity status:', error);
      // Return mock successful update response
      return { success: true, message: 'Status updated (mock)' };
    }
  }

  /**
   * Get metrics for dashboard
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Dashboard metrics
   */
  static async getMetrics(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/metrics`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return MOCK_DASHBOARD_DATA.metrics;
    }
  }

  /**
   * Get reading level distribution
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} - Reading level distribution data
   */
  static async getReadingLevelDistribution(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/reading-level-distribution`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching reading level distribution:', error);
      return MOCK_DASHBOARD_DATA.readingLevelDistribution;
    }
  }

  /**
   * Get students needing attention
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} - Students needing attention
   */
  static async getStudentsNeedingAttention(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/students-needing-attention`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching students needing attention:', error);
      return MOCK_DASHBOARD_DATA.studentsNeedingAttention;
    }
  }

  /**
   * Get students by section
   * @param {string} section - Section name
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} - Students in the specified section
   */
  static async getStudentsBySection(section, authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/by-section/${section}`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching students by section:', error);
      return MOCK_DASHBOARD_DATA.students.filter(student => 
        section === 'all' || student.section === section
      );
    }
  }
}

export default DashboardApiService;