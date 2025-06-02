import axios from 'axios';

// Detect production environment
const isProd = import.meta.env.PROD;

// API base URL configuration that works in both dev and production
const API_BASE = import.meta.env.VITE_BACKEND_URL || (isProd ? '' : 'http://localhost:5001');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to add authorization header to all requests
apiClient.interceptors.request.use(config => {
  const token = ParentApiService.getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const ParentApiService = {
  // Get authentication token from all possible storage locations
  getAuthToken() {
    // Try all possible token storage locations
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    const userDataStr = localStorage.getItem('userData');
    
    if (authToken) return authToken;
    if (token) return token;
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.token) return userData.token;
      } catch (e) {
        console.warn('Failed to parse userData from localStorage');
      }
    }
    
    console.warn("No token found in any storage location");
    return '';
  },

  // Get user ID from all possible storage locations
  getUserId() {
    const userId = localStorage.getItem('userId');
    const userDataStr = localStorage.getItem('userData');
    
    if (userId) return userId;
    
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const id = userData.id || userData._id || 
                  (userData.user ? (userData.user.id || userData.user._id) : null);
        if (id) return id;
      } catch (e) {
        console.warn('Failed to parse userData from localStorage');
      }
    }
    
    // Try to decode JWT token
    const token = this.getAuthToken();
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          return payload.id || payload._id || 
                 (payload.user ? (payload.user.id || payload.user._id) : null);
        }
      } catch (e) {
        console.warn('Failed to decode JWT for userId');
      }
    }
    
    return null;
  },

  // Get parent profile data
  async getParentProfile() {
    try {
      const response = await apiClient.get('/api/parents/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching parent profile:', error);
      throw error;
    }
  },

  // Update parent profile data
  async updateParentProfile(profileData) {
    try {
      const response = await apiClient.put('/api/parents/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating parent profile:', error);
      throw error;
    }
  },

  // Get parent's children
  async getChildren() {
    try {
      const response = await apiClient.get('/api/parents/children');
      return response.data;
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  },

  // Get user data
  async getUserData(userId = null) {
    try {
      const id = userId || this.getUserId();
      if (!id) throw new Error('No user ID available');
      
      const response = await apiClient.get(`/api/auth/user/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }
};

export default ParentApiService;