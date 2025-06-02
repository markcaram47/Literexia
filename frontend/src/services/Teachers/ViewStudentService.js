// src/services/Teachers/ViewStudentService.js
import axios from 'axios';

// Detect production environment
const isProd = import.meta.env.PROD;

// API base URL configuration that works in both dev and production
const API_BASE = import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:5001');

// Create axios instance with baseURL, timeouts, JSON headers
const api = axios.create({
  baseURL: `${API_BASE}/api/student`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Create a separate instance for direct backend calls
const directApi = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// REQUEST INTERCEPTOR: attach bearer token + log
api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(
      `View Student API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Apply same interceptor to directApi
directApi.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(
      `Direct API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: handle errors + 401 redirect
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'API Error:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        // Don't redirect to login for all 401s - just log it
        console.warn('Authorization failed for API request - continuing with available data');
      }
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Apply same interceptor to directApi
directApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'Direct API Error:',
        error.response.status,
        error.response.data
      );
      if (error.response.status === 401) {
        console.warn('Authorization failed for direct API request - continuing with available data');
      }
    } else if (error.request) {
      console.error('Direct API No Response:', error.request);
    } else {
      console.error('Direct API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ViewStudentService object with methods
const ViewStudentService = {
  // List students with optional query params (page, filters, etc.)
  getStudents: async (params = {}) => {
    try {
      const { data } = await api.get('/students', { params });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  // Get all students for dashboard
  getAllStudents: async () => {
    try {
      const { data } = await api.get('/students', { 
        params: { limit: 100 } // Get more students for dashboard
      });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
        return data.students;
      }
      return [];
    } catch (error) {
      console.error('Error fetching all students:', error);
      throw error;
    }
  },
  
  // Search students by name
  searchStudents: async (query) => {
    try {
      const { data } = await api.get('/students/search', { 
        params: { q: query } 
      });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error searching students:', error);
      throw error;
    }
  },

  // Filter students by criteria
  filterStudents: async (filters) => {
    try {
      const { data } = await api.get('/students/filter', { params: filters });
      
      // Process students to normalize reading levels
      if (data && data.students) {
        data.students = data.students.map(student => ({
          ...student,
          readingLevel: ViewStudentService.convertLegacyReadingLevel(student.readingLevel)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error filtering students:', error);
      throw error;
    }
  },

  // Static lookup endpoints
  getGradeLevels: async () => {
    try {
      // Get grade levels directly from users collection
      try {
        // Get all students and extract unique grade levels
        const { data: studentsData } = await api.get('/students', { params: { limit: 100 } });
        
        if (studentsData && studentsData.students && studentsData.students.length > 0) {
          console.log("Extracting grade levels from students data");
          
          // Extract unique grade levels from students
          const gradeLevelsSet = new Set();
          
          studentsData.students.forEach(student => {
            if (student.gradeLevel) {
              gradeLevelsSet.add(student.gradeLevel);
            }
          });
          
          const uniqueLevels = Array.from(gradeLevelsSet);
          console.log("Successfully extracted grade levels from students:", uniqueLevels);
          return uniqueLevels;
        }
      } catch (error) {
        console.warn('Error extracting grade levels from users collection:', error);
      }
      
      // If extraction failed, return empty array
      return [];
    } catch (error) {
      // Fallback to empty array
      console.warn('Error fetching grade levels:', error);
      return [];  
    }
  },
  
  getReadingLevels: async () => {
    try {
      // Get reading levels directly from users collection
      try {
        // Get all students and extract unique reading levels
        const { data: studentsData } = await api.get('/students', { params: { limit: 100 } });
        
        if (studentsData && studentsData.students && studentsData.students.length > 0) {
          console.log("Extracting reading levels from students data");
          
          // Extract unique reading levels from students
          const readingLevelsSet = new Set();
          
          studentsData.students.forEach(student => {
            if (student.readingLevel) {
              const normalizedLevel = ViewStudentService.convertLegacyReadingLevel(student.readingLevel);
              readingLevelsSet.add(normalizedLevel);
            }
          });
          
          const uniqueLevels = Array.from(readingLevelsSet);
          console.log("Successfully extracted reading levels from students:", uniqueLevels);
          return uniqueLevels;
        }
      } catch (error) {
        console.warn('Error extracting reading levels from users collection:', error);
      }
      
      // If extraction failed, return empty array
      return [];
    } catch (error) {
      // Fallback to empty array
      console.warn('Error fetching reading levels:', error);
      return [];
    }
  },
  
  getSections: async () => {
    try {
      // Get sections directly from users collection
      try {
        // Get all students and extract unique sections
        const { data: studentsData } = await api.get('/students', { params: { limit: 100 } });
        
        if (studentsData && studentsData.students && studentsData.students.length > 0) {
          console.log("Extracting sections from students data");
          
          // Extract unique sections from students
          const sectionsSet = new Set();
          
          studentsData.students.forEach(student => {
            if (student.section) {
              sectionsSet.add(student.section);
            }
          });
          
          const uniqueSections = Array.from(sectionsSet);
          console.log("Successfully extracted sections from students:", uniqueSections);
          return uniqueSections;
        }
      } catch (error) {
        console.warn('Error extracting sections from users collection:', error);
      }
      
      // If extraction failed, return empty array
      return [];
    } catch (error) {
      // Fallback to empty array
      console.warn('Error fetching sections:', error);
      return [];
    }
  },

  getReadingLevelDescription: (level) => {
    const descriptions = {
      'Low Emerging': 'Beginning to recognize letters and sounds',
      'High Emerging': 'Developing letter-sound connections',
      'Developing': 'Working on basic fluency and word recognition',
      'Transitioning': 'Building reading comprehension skills',
      'At Grade Level': 'Reading at expected grade level', 
      'Advanced': 'Reading above grade level with strong comprehension',
      'Not Assessed': 'Evaluation needed'
    };
    return descriptions[level] || level;
  },

  getReadingLevelClass: (level) => {
    const classMap = {
      'Low Emerging': 'vs-level-1',
      'High Emerging': 'vs-level-2',
      'Developing': 'vs-level-3',
      'Transitioning': 'vs-level-4',
      'At Grade Level': 'vs-level-5',
      'Advanced': 'vs-level-advanced',
      'Not Assessed': 'vs-level-na'
    };
    return classMap[level] || 'vs-level-na';
  },
  
  // Legacy ↔ CRLA DEPED level conversion
  convertLegacyReadingLevel: (oldLevel) => {
    if (!oldLevel) return 'Not Assessed';
    if (oldLevel === false) return 'Not Assessed';
    
    const map = {
      'Antas 1': 'Low Emerging',
      'Antas 2': 'Developing',
      'Antas 3': 'Transitioning',
      'Antas 4': 'At Grade Level',
      'Antas 5': 'Advanced',
      'Emergent': 'High Emerging',
      'Early': 'Low Emerging',
      'Fluent': 'At Grade Level'
    };
    return map[oldLevel] || oldLevel;
  }
};

export default ViewStudentService;