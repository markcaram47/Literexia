// services/Teachers/ManageProgress/CustomizedAssessmentApiService.js

import axios from 'axios';
import { API_BASE_URL } from '../../config';
import AuthService from '../../AuthService';

const CustomizedAssessmentApiService = {
  /**
   * Create a customized assessment
   * @param {Object} assessmentData - The assessment data to create
   */
  createCustomizedAssessment: async (assessmentData) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/customized-assessment`,
        assessmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating customized assessment:', error);
      throw error;
    }
  },

  /**
   * Get a customized assessment by ID
   * @param {string} id - Assessment ID
   */
  getCustomizedAssessment: async (id) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/customized-assessment/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching customized assessment ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get all customized assessments for a student
   * @param {string} studentId - Student ID
   */
  getCustomizedAssessmentsByStudent: async (studentId) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/customized-assessment/student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching customized assessments for student ${studentId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update a customized assessment
   * @param {string} id - Assessment ID
   * @param {Object} updateData - Data to update
   */
  updateCustomizedAssessment: async (id, updateData) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.put(
        `${API_BASE_URL}/api/customized-assessment/${id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating customized assessment ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a customized assessment
   * @param {string} id - Assessment ID
   */
  deleteCustomizedAssessment: async (id) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.delete(
        `${API_BASE_URL}/api/customized-assessment/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting customized assessment ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Add a question to a customized assessment
   * @param {string} assessmentId - Assessment ID
   * @param {Object} question - Question to add
   */
  addQuestion: async (assessmentId, question) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/customized-assessment/${assessmentId}/question`,
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding question to assessment ${assessmentId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update a question in a customized assessment
   * @param {string} assessmentId - Assessment ID
   * @param {string} questionId - Question ID
   * @param {Object} question - Updated question data
   */
  updateQuestion: async (assessmentId, questionId, question) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.put(
        `${API_BASE_URL}/api/customized-assessment/${assessmentId}/question/${questionId}`,
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating question ${questionId} in assessment ${assessmentId}:`, error);
      throw error;
    }
  },
  
  /**
   * Remove a question from a customized assessment
   * @param {string} assessmentId - Assessment ID
   * @param {string} questionId - Question ID
   */
  removeQuestion: async (assessmentId, questionId) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.delete(
        `${API_BASE_URL}/api/customized-assessment/${assessmentId}/question/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error removing question ${questionId} from assessment ${assessmentId}:`, error);
      throw error;
    }
  },
  
  /**
   * Clone a template question
   * @param {Object} cloneData - Data for cloning (originalAssessmentId, originalQuestionId, newContentReference)
   */
  cloneTemplateQuestion: async (cloneData) => {
    try {
      const token = AuthService.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/customized-assessment/clone-question`,
        cloneData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error cloning template question:', error);
      throw error;
    }
  }
};

export default CustomizedAssessmentApiService;