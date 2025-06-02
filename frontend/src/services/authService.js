// services/AuthService.js

// Import axios for HTTP requests
import axios from 'axios';

// Get backend URL from environment variables
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const AuthService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} expectedRole - Expected user role (optional)
   * @returns {Promise} Promise with login result
   */
  login: async (email, password, expectedRole) => {
    try {
      // Get expected role from parameter or localStorage
      const role = expectedRole || localStorage.getItem('userType') || 'teacher';
      
      console.log('AuthService login - sending request with:', { 
        email, 
        expectedRole: role 
      });
      
      const response = await axios.post(`${API_URL}/api/auth/login`, { 
        email, 
        password,
        expectedRole: role
      });
      
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        // Also store the token directly for compatibility
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
  },

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise with registration result
   */
  register: async (userData) => {
    try {
      return await axios.post(`${API_URL}/api/auth/register`, userData);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Get current user information
   * @returns {Object|null} Current user data or null if not logged in
   */
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  },

  /**
   * Check if user is logged in
   * @returns {boolean} True if user is logged in
   */
  isLoggedIn: () => {
    const user = AuthService.getCurrentUser();
    return !!user && !!user.token;
  },

  /**
   * Get authentication token
   * @returns {string|null} JWT token or null if not logged in
   */
  getToken: () => {
    try {
      const user = AuthService.getCurrentUser();
      if (!user || !user.token) {
        // First try to get token from localStorage directly
        const directToken = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (directToken) return directToken;
        
        // If still no token, check if there's a raw user string
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          try {
            const parsedUser = JSON.parse(rawUser);
            return parsedUser.token || null;
          } catch (e) {
            console.warn('Failed to parse user JSON from localStorage');
          }
        }
        return null;
      }
      return user.token;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },
  /**
   * Check if current user has a specific role
   * @param {string} roleName - Role to check
   * @returns {boolean} True if user has the role
   */
  hasRole: (roleName) => {
    const user = AuthService.getCurrentUser();
    
    if (!user || !user.user || !user.user.roles) {
      return false;
    }
    
    const userRoles = Array.isArray(user.user.roles) 
      ? user.user.roles 
      : [user.user.roles];
    
    // Handle Tagalog role names
    const roleMap = {
      'guro': 'teacher',
      'magulang': 'parent'
    };
    
    // Check if user has the role (case insensitive)
    const normalizedRoleName = roleName.toLowerCase();
    const mappedRoleName = roleMap[normalizedRoleName] || normalizedRoleName;
    
    return userRoles.some(role => {
      const userRole = typeof role === 'string' ? role.toLowerCase() : '';
      return userRole === normalizedRoleName || userRole === mappedRoleName;
    });
  },

  /**
   * Get user role
   * @returns {string|null} User role or null if not available
   */
  getUserRole: () => {
    const user = AuthService.getCurrentUser();
    
    if (!user || !user.user || !user.user.roles) {
      return null;
    }
    
    const userRoles = Array.isArray(user.user.roles) 
      ? user.user.roles 
      : [user.user.roles];
    
    return userRoles[0] || null;
  }
};

export default AuthService;