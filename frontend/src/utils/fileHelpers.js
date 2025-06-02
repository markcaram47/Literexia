/**
 * File helper utilities for handling file operations
 */

/**
 * Converts a data URL to a File object
 * @param {string} dataURL - The data URL to convert
 * @param {string} filename - The filename to use for the created File
 * @returns {File|null} - The created File object or null if conversion fails
 */
export const dataURLtoFile = (dataURL, filename) => {
  if (!dataURL) return null;
  
  try {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  } catch (error) {
    console.error('Error converting data URL to file:', error);
    return null;
  }
};

/**
 * Validates a file for upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedTypes - Array of allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @returns {Object} - Validation result with success flag and error message if applicable
 */
export const validateFileForUpload = (file, options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize = 5 * 1024 * 1024 // 5MB default
  } = options;
  
  if (!file) {
    return { 
      success: false, 
      error: 'No file provided'
    };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      success: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    return { 
      success: false, 
      error: `File is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`
    };
  }
  
  return { success: true };
}; 