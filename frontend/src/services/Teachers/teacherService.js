// src/services/teacherService.js - Key fixes for image handling
import axios from 'axios';

// Detect production environment
const isProd = import.meta.env.PROD;

// API base URL configuration that works in both dev and production
const API_BASE = import.meta.env.VITE_API_URL || (isProd ? '' : 'http://localhost:5001');

// Setup axios defaults for API calls
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Add auth token to all requests
api.interceptors.request.use(
  config => {
    // Add the auth token to every request
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);

      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Initialize teacher profile - called after login
 * @returns {Promise<Object>} New or existing teacher profile
 */
export const initializeTeacherProfile = async () => {
  try {
    const { data } = await api.post('/teachers/profile/initialize');
    console.log('Profile initialization response:', data);
    
    if (data.teacher) {
      // Ensure proper data normalization
      if (data.teacher.profileImageUrl === "null") {
        data.teacher.profileImageUrl = null;
      }
      
      // Ensure emergencyContact exists
      if (!data.teacher.emergencyContact) {
        data.teacher.emergencyContact = { name: '', number: '' };
      }
      
      return data.teacher;
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing teacher profile:', error);
    throw error; // Re-throw to allow handling in the component
  }
};

/**
 * Fetch teacher profile from API
 * @returns {Promise<Object>} Teacher profile data
 */
export const fetchTeacherProfile = async () => {
  try {
    const { data } = await api.get('/teachers/profile');
    
    // Normalize the profileImageUrl field - convert "null" string to actual null
    if (data && data.profileImageUrl === "null") {
      data.profileImageUrl = null;
    }
    
    // Ensure emergencyContact exists
    if (!data.emergencyContact) {
      data.emergencyContact = { name: '', number: '' };
    }

    return data;
  } catch (error) {
    // Handle the case where profile needs initialization
    if (error.response && error.response.status === 404 && 
        error.response.data.action === 'initialize') {
      console.log("No teacher profile found - attempting to initialize");
      
      try {
        const profile = await initializeTeacherProfile();
        if (profile) {
          return profile;
        }
      } catch (initError) {
        console.error("Failed to initialize profile:", initError);
        throw initError; // Re-throw to show error UI
      }
    }
    
    // Re-throw the error to handle in component
    throw error;
  }
};

/**
 * Update teacher profile data
 * @param {Object} profile - The updated profile data
 * @returns {Promise<Object>} The updated teacher profile
 */
export const updateTeacherProfile = async (profile) => {
  // Validate required fields on client side
  if (!profile.firstName?.trim() || !profile.email?.trim()) {
    throw new Error('Missing required fields');
  }

  // Create a copy of the profile data to normalize
  const normalizedProfile = { ...profile };

  // Ensure profileImageUrl is handled correctly
  if (normalizedProfile.profileImageUrl === "null" || normalizedProfile.profileImageUrl === undefined) {
    normalizedProfile.profileImageUrl = null;
  }
  
  // Make sure all fields are properly formatted
  if (!normalizedProfile.middleName) normalizedProfile.middleName = '';
  if (!normalizedProfile.position) normalizedProfile.position = '';
  if (!normalizedProfile.gender) normalizedProfile.gender = '';
  if (!normalizedProfile.civilStatus) normalizedProfile.civilStatus = '';
  if (!normalizedProfile.dob) normalizedProfile.dob = '';
  if (!normalizedProfile.address) normalizedProfile.address = '';
  
  // Ensure emergencyContact is properly structured
  if (!normalizedProfile.emergencyContact) {
    normalizedProfile.emergencyContact = { name: '', number: '' };
  } else if (typeof normalizedProfile.emergencyContact === 'object') {
    if (!normalizedProfile.emergencyContact.name) normalizedProfile.emergencyContact.name = '';
    if (!normalizedProfile.emergencyContact.number) normalizedProfile.emergencyContact.number = '';
  }

  try {
    const { data } = await api.put('/teachers/profile', normalizedProfile);

    // Normalize the returned data
    if (data.teacher && data.teacher.profileImageUrl === "null") {
      data.teacher.profileImageUrl = null;
    }
    
    // Ensure emergencyContact exists in response
    if (data.teacher && !data.teacher.emergencyContact) {
      data.teacher.emergencyContact = { name: '', number: '' };
    }

    return data;
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    throw error;
  }
};

/**
 * Upload profile image to S3
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result
 */
export const uploadProfileImage = async (file, onProgress) => {
  // Create form data
  const formData = new FormData();
  formData.append('profileImage', file);
  
  try {
    console.log('Starting profile image upload, size:', file.size);
    
    const { data } = await api.post('/teachers/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
        if (onProgress) {
          onProgress(percentCompleted);
        }
      },
      // Increase timeout for larger files
      timeout: 60000 // 60 seconds
    });
    
    console.log('Upload completed successfully:', data);
    
    // Handle various response formats
    if (data && typeof data === 'object') {
      // If response contains success flag, return it directly
      if ('success' in data) {
        return data;
      }
      // Normalize response format
      return { 
        success: true, 
        imageUrl: data.imageUrl || data.url || null,
        message: data.message || 'Upload successful'
      };
    }
    
    // Fallback for unexpected response format
    return { 
      success: true, 
      imageUrl: null,
      message: 'Upload completed but no URL returned'
    };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // Create a more informative error
    const errorMessage = error.response?.data?.details || 
                         error.response?.data?.error || 
                         error.message || 
                         'Unknown error';
    const enhancedError = new Error(`Failed to upload image: ${errorMessage}`);
    
    throw enhancedError;
  }
};

/**
 * Delete profile image from S3
 * @returns {Promise<Object>} Delete result
 */
export const deleteProfileImage = async () => {
  try {
    const { data } = await api.delete('/teachers/profile/image');
    return data; // { success: true, message: '...' }
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
};

/**
 * Update teacher password - updates the user record in users_web collection
 * @param {string} currentPassword - The current password
 * @param {string} newPassword - The new password
 * @returns {Promise<Object>} Success message
 */
export const updateTeacherPassword = async (currentPassword, newPassword) => {
  // Validate password complexity on client side
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    throw new Error('Password does not meet requirements');
  }

  try {
    const { data } = await api.post('/teachers/password', { currentPassword, newPassword });
    return data;
  } catch (error) {
    // If server returns specific error code, preserve it
    if (error.response?.data?.error === 'INCORRECT_PASSWORD') {
      const customError = new Error('INCORRECT_PASSWORD');
      throw customError;
    }

    // Rethrow the error
    throw error;
  }
};

/**
 * Get the current profile image with cache busting
 * @returns {Promise<Object>} Image URL info
 */
export const getCurrentProfileImage = async () => {
  try {
    const { data } = await api.get('/teachers/profile/image/current');
    return data;
  } catch (error) {
    console.error('Error getting profile image:', error);
    return { imageUrl: null };
  }
};

/**
 * Helper function to get profile image URL with cache busting
 * @param {string} url - The image URL
 * @returns {string|null} Formatted URL with cache busting
 */
export const getCacheBustedImageUrl = (url) => {
  if (!url) return null;

  try {
    // Add a timestamp for cache busting
    const timestamp = Date.now();
    
    // Create a proper URL object to handle the URL correctly
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Add or update the timestamp parameter
    urlObj.searchParams.set('t', timestamp);
    
    return urlObj.toString();
  } catch (error) {
    console.error('Error formatting image URL:', error);
    
    // Fallback to simple string concatenation
    const joinChar = url.includes('?') ? '&' : '?';
    return `${url}${joinChar}t=${Date.now()}`;
  }
};

// Create a service object with all exported functions
const teacherService = {
  initializeTeacherProfile,
  fetchTeacherProfile,
  updateTeacherProfile,
  uploadProfileImage,
  deleteProfileImage,
  updateTeacherPassword,
  getCurrentProfileImage,
  getCacheBustedImageUrl
};

export default teacherService;