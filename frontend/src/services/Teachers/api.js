// src/services/Teachers/api.js
import axios from 'axios';

/**
 * Create a configured Axios instance for API calls
 * This centralizes all API configuration in one place
 */
const api = axios.create({
  // Use environment variable or default to local server
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Include cookies
});

// Add request interceptor to add authentication token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to handle common error patterns
api.interceptors.response.use(
  response => {
    // Any status code within the range of 2xx triggers this function
    return response;
  },
  error => {
    // Any status codes outside the range of 2xx trigger this function
    if (error.response) {
      // Server responded with a status code outside of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('authToken');
        
        // If you have access to your router, you can redirect
        // Example with react-router: history.push('/login');
        
        // Or just use window.location for simplicity
        // window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export API service functions
export default {
  // General API methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // Domain-specific API methods for intervention management
  interventions: {
    // Get all interventions for a student
    getStudentInterventions: (studentId) => 
      api.get(`/api/interventions/student/${studentId}`),
      
    // Get intervention by ID
    getById: (interventionId) => 
      api.get(`/api/interventions/${interventionId}`),
      
    // Check if intervention exists for student and category
    checkExisting: (studentId, category) => 
      api.get(`/api/interventions/check?studentId=${studentId}&category=${category}`),
      
    // Create new intervention
    create: (interventionData) => 
      api.post('/api/interventions', interventionData),
      
    // Update intervention
    update: (interventionId, updateData) => 
      api.put(`/api/interventions/${interventionId}`, updateData),
      
    // Delete intervention
    delete: (interventionId) => 
      api.delete(`/api/interventions/${interventionId}`),
      
    // Push to mobile and activate intervention
    activate: (interventionId) => 
      api.put(`/api/interventions/${interventionId}/activate`, { status: 'active' }),
      
    // Legacy push to mobile (will be deprecated)
    pushToMobile: (interventionId) => 
      api.post(`/api/interventions/${interventionId}/push`),
      
    // Get main assessment questions
    getMainAssessmentQuestions: (category, readingLevel) => 
      api.get(`/api/interventions/questions/main?category=${encodeURIComponent(category)}&readingLevel=${encodeURIComponent(readingLevel)}`),
      
    // Get template questions
    getTemplateQuestions: (category) => 
      api.get(`/api/interventions/templates/questions?category=${encodeURIComponent(category)}`),
      
    // Get template choices
    getTemplateChoices: (choiceTypes = []) => {
      const queryParam = choiceTypes.length > 0 ? 
        `?choiceTypes=${choiceTypes.join(',')}` : '';
      return api.get(`/api/interventions/templates/choices${queryParam}`);
    },
    
    // Get sentence templates
    getSentenceTemplates: (readingLevel) => 
      api.get(`/api/interventions/templates/sentences?readingLevel=${encodeURIComponent(readingLevel)}`),
      
    // Create template question
    createTemplateQuestion: (templateData) => 
      api.post('/api/interventions/templates/questions', templateData),
      
    // Create template choice
    createTemplateChoice: (choiceData) => 
      api.post('/api/interventions/templates/choices', choiceData),
      
    // Get upload URL
    getUploadUrl: (fileName, fileType, targetFolder = 'mobile') => 
      api.post('/api/interventions/upload-url', { fileName, fileType, targetFolder }),
      
    // Record intervention response
    recordResponse: (responseData) => 
      api.post('/api/interventions/responses', responseData),
      
    // Get prescriptive analysis for student and category
    getPrescriptiveAnalysis: (studentId, category) => 
      api.get(`/api/prescriptive-analysis?studentId=${studentId}&category=${encodeURIComponent(category)}`)
  }
};