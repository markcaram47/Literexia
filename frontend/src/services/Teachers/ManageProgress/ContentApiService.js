// services/Teachers/ManageProgress/ContentApiService.js
import axios from "axios";
import { API_BASE_URL } from "../../config";
import AuthService from "../../AuthService";

const ContentApiService = {
  /**
   * Get all letters from Pre_Assessment database
   */
  getLetters: async (type) => {
    try {
      const token = AuthService.getToken();
      // Add '/api' prefix to the URL
      let url = `${API_BASE_URL}/api/teacher/content/letters`;
  
      if (type) {
        url += `?type=${type}`;
      }
  
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching letters:', error);
      return [];
    }
  },

  // Update all other methods to use consistent paths
  getSyllables: async () => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/teacher/content/syllables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching syllables:', error);
      return [];
    }
  },

  getWords: async (category) => {
    try {
      const token = AuthService.getToken();
      let url = `${API_BASE_URL}/api/teacher/content/words`;

      if (category) {
        url += `?category=${category}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching words:', error);
      return [];
    }
  },

  getSentences: async () => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/teacher/content/sentences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sentences:', error);
      return [];
    }
  },

  getShortStories: async () => {
    try {
      const token = AuthService.getToken();
      const response = await axios.get(`${API_BASE_URL}/api/teacher/content/shortstories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching short stories:', error);
      return [];
    }
  }
};

export default ContentApiService;