// src/services/Teachers/StudentDetailsService.js
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
            `Student Details API Request: ${config.method.toUpperCase()} ${config.url}`
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

// StudentDetailsService object with methods
const StudentDetailsService = {
    // Single student details
    getStudentDetails: async (id) => {
        try {
            // Use the correct path - no need for leading slash since baseURL already has /api/student
            const { data } = await api.get(`/${id}`);
            console.log(`Successfully fetched student details for ID ${id}`);
            
            // Ensure reading level is properly set
            if (data) {
                data.readingLevel = StudentDetailsService.convertLegacyReadingLevel(data.readingLevel);
            }
            
            return data;
        } catch (error) {
            console.error(`Error fetching student details for ID ${id}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for student details with ID ${id}`);
                const { data } = await directApi.get(`/student/${id}`);
                console.log(`Successfully fetched student details from alternate endpoint for ID ${id}`);
                
                // Ensure reading level is properly set
                if (data) {
                    data.readingLevel = StudentDetailsService.convertLegacyReadingLevel(data.readingLevel);
                }
                
                return data;
            } catch (alternateError) {
                console.error(`Error fetching student details from alternate endpoint for ID ${id}:`, alternateError);
                
                // Create a minimal student object as fallback
                return {
                    id: id,
                    name: `Student ID: ${id}`,
                    readingLevel: 'Not Assessed',
                    error: 'Failed to load complete student data'
                };
            }
        }
    },

    // Assessment results
    getAssessmentResults: async (id) => {
        try {
            // Use the correct path
            const { data } = await api.get(`/${id}/assessment`);
            
            // Check if the response is HTML instead of JSON
            if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                console.error(`Received HTML instead of JSON for assessment results ID ${id}`);
                throw new Error('Invalid response format (HTML received)');
            }
            
            console.log(`Successfully fetched assessment results for ID ${id}`);
            return data;
        } catch (error) {
            console.error(`Error fetching assessment results for ID ${id}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for assessment results with ID ${id}`);
                const { data } = await directApi.get(`/student/${id}/assessment`);
                
                // Check if the response is HTML instead of JSON
                if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                    console.error(`Received HTML instead of JSON for assessment results from alternate endpoint ID ${id}`);
                    throw new Error('Invalid response format (HTML received)');
                }
                
                console.log(`Successfully fetched assessment results from alternate endpoint for ID ${id}`);
                return data;
            } catch (alternateError) {
                console.error(`Error fetching assessment results from alternate endpoint for ID ${id}:`, alternateError);
                
                // Return empty assessment data as fallback
                return {
                    studentId: id,
                    readingLevel: 'Not Assessed',
                    recommendedLevel: 'Not Assessed',
                    assessmentDate: null,
                    overallScore: 0,
                    readingPercentage: 0,
                    skillDetails: [],
                    allCategoriesPassed: false
                };
            }
        }
    },

    // Reading level progress data
    getReadingLevelProgress: async (id) => {
        try {
            const { data } = await api.get(`/${id}/reading-level-progress`);
            
            // Check if the response is HTML instead of JSON
            if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                console.error(`Received HTML instead of JSON for reading level progress ID ${id}`);
                throw new Error('Invalid response format (HTML received)');
            }
            
            console.log(`Successfully fetched reading level progress for ID ${id}`);
            return data;
        } catch (error) {
            console.error(`Error fetching reading level progress for ID ${id}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for reading level progress with ID ${id}`);
                const { data } = await directApi.get(`/student/${id}/reading-level-progress`);
                
                // Check if the response is HTML instead of JSON
                if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                    console.error(`Received HTML instead of JSON for reading level progress from alternate endpoint ID ${id}`);
                    throw new Error('Invalid response format (HTML received)');
                }
                
                console.log(`Successfully fetched reading level progress from alternate endpoint for ID ${id}`);
                return data;
            } catch (alternateError) {
                console.error(`Error fetching reading level progress from alternate endpoint for ID ${id}:`, alternateError);
                
                // Return empty progress data as fallback
                return {
                    studentId: id,
                    readingLevel: 'Not Assessed',
                    lastAssessmentDate: null,
                    categories: [],
                    overallScore: 0,
                    allCategoriesPassed: false
                };
            }
        }
    },

    // Add the getMainAssessment method after the getReadingLevelProgress method
    getMainAssessment: async (readingLevel) => {
        try {
            const { data } = await directApi.get('/main-assessment', {
                params: { readingLevel }
            });
            console.log(`Successfully fetched main assessment data for reading level ${readingLevel}`);
            return data;
        } catch (error) {
            console.error(`Error fetching main assessment data for reading level ${readingLevel}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for main assessment data with reading level ${readingLevel}`);
                const { data } = await directApi.get(`/student/main-assessment?readingLevel=${readingLevel}`);
                console.log(`Successfully fetched main assessment data from alternate endpoint for reading level ${readingLevel}`);
                return data;
            } catch (alternateError) {
                console.error(`Error fetching main assessment data from alternate endpoint for reading level ${readingLevel}:`, alternateError);
                
                // Return empty data as fallback
                return [];
            }
        }
    },

    // Add the getCategoryResults method to fetch individual question results
    getCategoryResults: async (studentId) => {
        try {
            const { data } = await api.get(`/${studentId}/category-results`);
            
            // Check if the response is HTML instead of JSON
            if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                console.error(`Received HTML instead of JSON for category results for student ID ${studentId}`);
                throw new Error('Invalid response format (HTML received)');
            }
            
            console.log(`Successfully fetched category results for student ID ${studentId}`);
            
            // Check if we have meaningful data
            if (data && data.categories && data.categories.length > 0) {
                // Valid data, return it directly
                console.log("Valid category data found with", data.categories.length, "categories");
                return data;
            } else {
                // No meaningful data, try alternate endpoint
                throw new Error('No valid category data found in response');
            }
        } catch (error) {
            console.error(`Error fetching category results for student ${studentId}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for category results with student ID ${studentId}`);
                const { data } = await directApi.get(`/student/${studentId}/category-results`);
                
                // Check if the response is HTML instead of JSON
                if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
                    console.error(`Received HTML instead of JSON from alternate endpoint for category results for student ID ${studentId}`);
                    throw new Error('Invalid response format (HTML received)');
                }
                
                if (data && data.categories && data.categories.length > 0) {
                    console.log(`Successfully fetched category results from alternate endpoint for student ID ${studentId}`);
                    return data;
                } else {
                    throw new Error('No valid category data found in alternate response');
                }
            } catch (alternateError) {
                console.error(`Error fetching category results from alternate endpoint for student ID ${studentId}:`, alternateError);
                
                // Return empty data as fallback
                return {
                    studentId: studentId,
                    assessmentType: 'unknown',
                    categories: [],
                    overallScore: 0,
                    readingLevel: 'Not Assessed',
                    allCategoriesPassed: false
                };
            }
        }
    },

    // Parent profile
    getParentProfile: async (parentId) => {
        try {
            // Check if parentId is valid MongoDB ObjectId format
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(parentId);
            if (!isValidObjectId) {
                console.warn(`Invalid parent ID format: ${parentId}`);
                throw new Error('Invalid parent ID format');
            }
            
            console.log("Fetching parent profile for ID:", parentId);
            // First try the parent database
            try {
                const { data } = await directApi.get(`/parent-profiles/${parentId}`);
                console.log("Parent profile data received from parent database:", data);
                return data;
            } catch (parentDbError) {
                console.warn("Could not find parent in parent database:", parentDbError.message);
                
                // Try the Literexia database next
                try {
                    const { data } = await directApi.get(`/literexia/parents/${parentId}`);
                    console.log("Parent profile data received from Literexia database:", data);
                    return data;
                } catch (literexiaDbError) {
                    console.warn("Could not find parent in Literexia database:", literexiaDbError.message);
                    
                    // Last resort: Try a direct MongoDB query via API
                    const { data } = await directApi.get(`/parent-by-id/${parentId}`);
                    if (!data) {
                        throw new Error('No parent data returned');
                    }
                    return data;
                }
            }
        } catch (error) {
            console.error('Error fetching parent profile:', error);
            throw error;
        }
    },

    // Get all parents in a single call (useful for bulk operations)
    getAllParentProfiles: async () => {
        try {
            const { data } = await directApi.get('/parent-profiles');
            console.log("Retrieved all parent profiles:", data?.length || 0);
            return data || [];
        } catch (error) {
            console.error('Error fetching all parent profiles:', error);
            // Fallback to hardcoded parent data for development/testing
            return [
                {
                    _id: "681a2933af165878136e05da",
                    firstName: "Jan Mark",
                    middleName: "Percival",
                    lastName: "Caram",
                    email: "parent@gmail.com",
                    contact: "09155933015"
                },
                {
                    _id: "6827575c89b0d728f9333a20",
                    firstName: "Kit Nicholas",
                    middleName: "Tongol",
                    lastName: "Santiago",
                    email: "parent2@gmail.com",
                    contact: "09155933015"
                },
                {
                    _id: "682ca15af0bfb8e632bdfd13",
                    firstName: "Rain",
                    middleName: "Percival",
                    lastName: "Aganan",
                    email: "parentrain@gmail.com",
                    contact: "09155933015"
                },
                {
                    _id: "682d75b9f7897b64cec98cc7",
                    firstName: "Kit Nicholas",
                    middleName: "Rish",
                    lastName: "Aganan",
                    email: "paraaaaaaaaaent@gmail.com",
                    contact: "09155933015"
                },
                {
                    _id: "6830d880779e20b64f720f44",
                    firstName: "Kit Nicholas",
                    middleName: "Pascual",
                    lastName: "Caram",
                    email: "teacher65@gmail.com",
                    contact: "09155933015"
                },
                {
                    _id: "6835ef1645a2af9158a6d5b7",
                    firstName: "Pia",
                    middleName: "Zop",
                    lastName: "Rey",
                    email: "markcaram47@icloud.comm",
                    contact: "09155933015"
                }
            ];
        }
    },

    // In StudentDetailsService.js, update the getParentProfileWithFallback method to fall back to student.parent:
    getParentProfileWithFallback: async (parentId, student = null) => {
        try {
          // If we already have parent info from the student object, use it
          if (student && student.parent && typeof student.parent === 'object' && 
              student.parent.name && student.parent.profileImageUrl) {
            console.log("Using parent info directly from student object:", student.parent);
            return student.parent;
          }
          
          if (!parentId) {
            console.log("No parent ID provided, returning null");
            return null;
          }
    
          console.log("Fetching parent profile with ID:", parentId);
          
          try {
            // First try to get from the parent database cache or any cached parent profiles
            let parentData = null;
            
            try {
              // Try to get all parent profiles first (faster if cached)
              const allParents = await StudentDetailsService.getAllParentProfiles();
              parentData = allParents.find(p => p._id === parentId);
              
              if (parentData) {
                console.log("Found parent in cached profiles:", parentData);
                return parentData;
              }
            } catch (cacheError) {
              console.warn("Could not get parent from cache:", cacheError.message);
            }
            
            // If not found in cache, try a direct API call
            const { data } = await directApi.get(`/parent-by-id/${parentId}`, {
              timeout: 8000 // Longer timeout since it checks multiple DBs
            });
            
            if (data) {
              console.log("Parent profile successfully retrieved from API:", data);
              
              // Ensure the profileImageUrl has a cache-busting parameter
              if (data.profileImageUrl) {
                const cacheBuster = Date.now();
                data.profileImageUrl = data.profileImageUrl.includes('?') 
                  ? `${data.profileImageUrl}&t=${cacheBuster}` 
                  : `${data.profileImageUrl}?t=${cacheBuster}`;
              }
              
              return data;
            }
          } catch (e) {
            console.warn("Parent fetch from API failed:", e.message);
            
            // If the student object has parent info, use it as a fallback
            if (student && student.parent && typeof student.parent === 'object') {
              console.log("Falling back to parent info from student object:", student.parent);
              return student.parent;
            }
          }
          
          console.warn("No parent profile found, returning null");
          return null;
        } catch (err) {
          console.warn("Error in getParentProfileWithFallback:", err);
          return null;
        }
    },

    // Progress data
    getProgressData: async (id) => {
        try {
            const { data } = await api.get(`/${id}/progress`);
            console.log(`Successfully fetched progress data for ID ${id}`);
            return data;
        } catch (error) {
            console.error(`Error fetching progress data for ID ${id}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for progress data with ID ${id}`);
                const { data } = await directApi.get(`/student/${id}/progress`);
                console.log(`Successfully fetched progress data from alternate endpoint for ID ${id}`);
                return data;
            } catch (alternateError) {
                console.error(`Error fetching progress data from alternate endpoint for ID ${id}:`, alternateError);
                
                // Return empty progress data as fallback
                return {
                    studentId: id,
                    activities: [],
                    completedActivities: 0,
                    totalActivities: 0,
                    completionRate: 0,
                    lastActivityDate: null
                };
            }
        }
    },

    // Recommended lessons
    getRecommendedLessons: async (id) => {
        try {
            const { data } = await api.get(`/${id}/recommended-lessons`);
            console.log(`Successfully fetched recommended lessons for ID ${id}`);
            return data;
        } catch (error) {
            console.error(`Error fetching recommended lessons for ID ${id}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for recommended lessons with ID ${id}`);
                const { data } = await directApi.get(`/student/${id}/recommended-lessons`);
                console.log(`Successfully fetched recommended lessons from alternate endpoint for ID ${id}`);
                return data;
            } catch (alternateError) {
                console.error(`Error fetching recommended lessons from alternate endpoint for ID ${id}:`, alternateError);
                
                // Return empty lessons data as fallback
                return {
                    studentId: id,
                    lessons: [],
                    message: 'No recommended lessons available'
                };
            }
        }
    },

    // Prescriptive recommendations
    getPrescriptiveRecommendations: async (id) => {
        try {
            const { data } = await api.get(`/${id}/prescriptive-recommendations`);
            console.log(`Successfully fetched prescriptive recommendations for ID ${id}`);
            return data;
        } catch (error) {
            console.error(`Error fetching prescriptive recommendations for ID ${id}:`, error);
            
            // Try alternate endpoint
            try {
                console.log(`Trying alternate endpoint for prescriptive recommendations with ID ${id}`);
                const { data } = await directApi.get(`/student/${id}/prescriptive-recommendations`);
                console.log(`Successfully fetched prescriptive recommendations from alternate endpoint for ID ${id}`);
                return data;
            } catch (alternateError) {
                console.error(`Error fetching prescriptive recommendations from alternate endpoint for ID ${id}:`, alternateError);
                
                // Return empty recommendations data as fallback
                return {
                    studentId: id,
                    recommendations: [],
                    message: 'No prescriptive recommendations available'
                };
            }
        }
    },

    // Update a prescriptive activity
    updateActivity: async (activityId, updatedActivity) => {
        try {
            const { data } = await api.put(
                `/update-activity/${activityId}`,
                updatedActivity
            );
            console.log(`Successfully updated activity ${activityId}`);
            return data;
        } catch (error) {
            console.error(`Error updating activity ${activityId}:`, error);
            return {
                success: false,
                message: 'Failed to update activity',
                error: error.message
            };
        }
    },

    // Patch student address
    updateStudentAddress: async (studentId, address) => {
        try {
            const { data } = await api.patch(
                `/${studentId}/address`,
                { address }
            );
            console.log(`Successfully updated address for student ${studentId}`);
            return data;
        } catch (error) {
            console.error(`Error updating student address for ID ${studentId}:`, error);
            return {
                success: false,
                message: 'Failed to update student address',
                error: error.message
            };
        }
    },

    // Link a parent to a student
    linkParentToStudent: async (studentId, parentId) => {
        try {
            const { data } = await api.post(
                `/${studentId}/link-parent`,
                { parentId }
            );
            console.log(`Successfully linked parent ${parentId} to student ${studentId}`);
            return data;
        } catch (error) {
            console.error(`Error linking parent ${parentId} to student ${studentId}:`, error);
            return {
                success: false,
                message: 'Failed to link parent to student',
                error: error.message
            };
        }
    },

    // Send progress report to parent
    sendProgressReport: async (studentId, reportData) => {
        try {
            const { data } = await api.post(
                `/${studentId}/progress-report/send`,
                reportData
            );
            console.log(`Successfully sent progress report for student ${studentId}`);
            return data;
        } catch (error) {
            console.error(`Error sending progress report for student ${studentId}:`, error);
            return {
                success: false,
                message: 'Failed to send progress report',
                error: error.message
            };
        }
    },

    // Export progress report to PDF
    exportProgressReport: async (studentId, includeInterventions = true) => {
        try {
            const { data } = await api.get(`/${studentId}/progress-report/export`, {
                params: { includeInterventions }
            });
            console.log(`Successfully exported progress report for student ${studentId}`);
            return data;
        } catch (error) {
            console.error(`Error exporting progress report for student ${studentId}:`, error);
            return {
                success: false,
                message: 'Failed to export progress report',
                error: error.message
            };
        }
    },

    // Reading Level Helpers
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
            'Low Emerging': 'mp-level-1',
            'High Emerging': 'mp-level-2',
            'Developing': 'mp-level-3',
            'Transitioning': 'mp-level-4',
            'At Grade Level': 'mp-level-5',
            'Advanced': 'mp-level-5',
            'Not Assessed': ''
        };
        return classMap[level] || 'mp-level-1';
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
    },

    // Score-to-level helper
    getReadingLevelFromScore: (score, maxScore = 5) => {
        const pct = (score / maxScore) * 100;
        if (pct <= 20) return 'Low Emerging';
        if (pct <= 40) return 'High Emerging';
        if (pct <= 60) return 'Developing';
        if (pct <= 80) return 'Transitioning';
        return 'At Grade Level';
    }
};

export default StudentDetailsService;