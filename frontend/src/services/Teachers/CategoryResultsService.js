// src/services/Teachers/CategoryResultsService.js
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
      `Category API Request: ${config.method.toUpperCase()} ${config.url}`
    );
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR: handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(
        'API Error:',
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

const CategoryResultsService = {
  // Get category results for a student
  getCategoryResults: async (studentId) => {
    try {
      console.log(`Fetching category results for student ID: ${studentId}`);
      const { data } = await api.get(`${studentId}/category-results`);
      
      console.log("Category results received:", data);
      
      // Check if we have meaningful data
      if (data && data.categories && data.categories.length > 0) {
        // Valid data, return it directly
        console.log("Valid category data found with", data.categories.length, "categories");
        return data;
      } else {
        // No meaningful data, return null
        console.log("No valid category data found");
        return null;
      }
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId}:`, error);
      
      // Return null in case of error
      return null;
    }
  },

  // Helper function to normalize category data format
  normalizeCategories: (categories) => {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }
    
    return categories.map(category => ({
      categoryName: category.categoryName || 'Unknown Category',
      totalQuestions: category.totalQuestions || 0,
      correctAnswers: category.correctAnswers || 0,
      score: category.score || 0,
      isPassed: category.isPassed || false,
      passingThreshold: category.passingThreshold || 75
    }));
  },

  // Helper function to transform pre-assessment data to category results format
  transformPreAssessmentData: (preAssessmentData) => {
    if (!preAssessmentData) return null;
    
    // Check if we have categories directly in the data
    if (preAssessmentData.categories && preAssessmentData.categories.length > 0) {
      console.log("Using existing categories from data");
      return preAssessmentData; // Already in the right format
    }
    
    // Check if we have skillDetails to transform
    if (!preAssessmentData.skillDetails || preAssessmentData.skillDetails.length === 0) {
      console.log("No skillDetails to transform");
      return null;
    }

    console.log("Transforming skillDetails to categories format");
    
    // Create categories array from skillDetails
    const categories = preAssessmentData.skillDetails.map(skill => ({
      categoryName: skill.categoryName || skill.category,
      totalQuestions: skill.total || 0,
      correctAnswers: skill.correct || 0,
      score: skill.score || 0,
      isPassed: skill.score >= 75,
      passingThreshold: 75
    }));

    // Calculate if all categories passed
    const allCategoriesPassed = categories.every(cat => cat.isPassed);

    // Format the data to match category_results structure
    return {
      studentId: preAssessmentData.studentId,
      assessmentType: preAssessmentData.assessmentType || 'pre-assessment',
      assessmentDate: preAssessmentData.completedAt || preAssessmentData.assessmentDate || new Date().toISOString(),
      categories: categories,
      overallScore: preAssessmentData.overallScore || 0,
      readingLevel: preAssessmentData.readingLevel || 'Not Assessed',
      readingPercentage: preAssessmentData.overallScore || 0,
      allCategoriesPassed: allCategoriesPassed
    };
  },

  // Helper function to get a more descriptive level name
  getReadingLevelDescription: (level) => {
    const descriptions = {
      'Low Emerging': 'Nagsisimulang Matuto - Beginning to recognize letters and sounds',
      'High Emerging': 'Umuunlad na Matuto - Developing letter-sound connections',
      'Developing': 'Paunlad na Pagbasa - Working on basic fluency and word recognition',
      'Transitioning': 'Lumalago na Pagbasa - Building reading comprehension skills',
      'At Grade Level': 'Batay sa Antas - Reading at expected grade level',
      'Not Assessed': 'Hindi pa nasusuri - Evaluation needed'
    };
    return descriptions[level] || level;
  },

  // Get a CSS class based on reading level
  getReadingLevelClass: (level) => {
    const classMap = {
      'Low Emerging': 'level-low-emerging',
      'High Emerging': 'level-high-emerging',
      'Developing': 'level-developing',
      'Transitioning': 'level-transitioning',
      'At Grade Level': 'level-at-grade',
      'Not Assessed': 'level-not-assessed'
    };
    return classMap[level] || 'level-not-assessed';
  }
};

export default CategoryResultsService;