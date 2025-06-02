// services/Teachers/ManageProgress/AssessmentApiService.js
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import AuthService from '../../AuthService';

const AssessmentApiService = {


  /**
   * Get all assessment categories
   */
  getAssessmentCategories: async () => {
    try {
      const token = AuthService.getToken();
      // Use the most reliable path first
      const response = await axios.get(`${API_BASE_URL}/api/content/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment categories:', error);
      // More consistent fallback path
      try {
        const token = AuthService.getToken();
        const response = await axios.get(`${API_BASE_URL}/api/teacher/progress/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback for assessment categories also failed:', fallbackError);


        // Return default categories
        return [
          {
            categoryID: 1,
            categoryTitle: "Alphabet Knowledge",
            categoryDescription: "Assessment of alphabet knowledge including letter recognition and sounds.",
            questionTypes: ["letter_recognition", "letter_sound", "vowel_consonant"],
            order: 1
          },
          // ... other default categories ...
        ];
      }
    }
  },

  /**
   * Get all reading levels
   */
  getReadingLevels: async () => {
    try {
      const token = AuthService.getToken();
      // Use the most reliable path first
      const response = await axios.get(`${API_BASE_URL}/api/teacher/progress/reading-levels`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reading levels:', error);
      // Return default reading levels without trying additional endpoints
      return [
        'Low Emerging',
        'High Emerging',
        'Developing',
        'Transitioning',
        'At Grade Level',
        'Not Assessed'
      ];
    }
  },

  getAllQuestionsForCategory: async (categoryId, readingLevel) => {
    try {
      // Query all published assessments for this category and reading level
      const assessments = await axios.get(
        `${API_BASE_URL}/api/teacher/progress/category-questions`,
        {
          params: {
            categoryId,
            readingLevel
          }
        }
      );

      // Return the questions
      return assessments.data;
    } catch (error) {
      console.error('Error fetching questions for category:', error);
      // Return empty array to prevent UI errors
      return [];
    }
  },


  /**
   * Get published assessments
   */
  getPublishedAssessments: async (categoryId, readingLevel) => {
    try {
      const token = AuthService.getToken();
      // Add '/api' prefix to the URL
      let url = `${API_BASE_URL}/api/teacher/progress/published-assessments`;

      // Add query parameters if provided
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (readingLevel) params.append('readingLevel', readingLevel);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching published assessments:', error);
      return [];
    }
  },


  /**
   * Get template questions for a category
   * @param {string|number} categoryId - Category ID
   * @param {string} readingLevel - Optional reading level filter
   */
  getTemplateQuestions: async (categoryId, readingLevel) => {
    try {
      const token = AuthService.getToken();
      // Fixed endpoint path
      let url = `${API_BASE_URL}/api/teacher/customized-assessment/templates/${categoryId}`;

      // Add reading level as query parameter if provided
      if (readingLevel) {
        url += `?readingLevel=${encodeURIComponent(readingLevel)}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.data || !response.data.templateQuestions) {
        return {
          success: true,
          count: 0,
          templateQuestions: []
        };
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching template questions:', error);
      // Return empty data structure
      return {
        success: false,
        count: 0,
        templateQuestions: []
      };
    }
  },



  /**
   * Assign categories to a student
   */
  assignCategoriesToStudent: async (assignmentData) => {
    try {
      const token = AuthService.getToken();
      // Use the teacher-specific endpoint consistently
      const response = await axios.post(
        `${API_BASE_URL}/api/teacher/progress/assign-categories`,
        assignmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning categories to student:', error);
      throw error; // Let the UI handle the error
    }
  }
};

export default AssessmentApiService;