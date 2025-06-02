// services/Teachers/ManageProgress/ProgressApiService.js 
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import AuthService from '../../AuthService';

const ProgressApiService = {
  /**
   * Get category progress for a student
   */
  getCategoryProgress: async (studentId) => {
    try {
      const token = AuthService.getToken();
      // Use the teacher-specific endpoint consistently
      const response = await axios.get(`${API_BASE_URL}/api/teacher/progress/category-progress/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching category progress for student ${studentId}:`, error);
      
      // Return a more useful default structure with categoryIDs that match your data
      return {
        userId: studentId,
        categories: [],
        completedCategories: 0,
        totalCategories: 5, // Assuming 5 total categories
        overallProgress: 0,
        nextCategory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },

  /**
   * Update category status for a student
   */
  updateCategoryStatus: async (studentId, categoryId, updateData) => {
    try {
      const token = AuthService.getToken();
      // Use teacher-specific endpoint
      const response = await axios.put(
        `${API_BASE_URL}/api/teacher/progress/category-progress/${studentId}/${categoryId}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating category status for student ${studentId}, category ${categoryId}:`, error);
      throw error;
    }
  }
};

export default ProgressApiService;