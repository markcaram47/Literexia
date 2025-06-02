// src/pages/Teachers/TeacherProfile.jsx - Updated version
import React, { useState, useEffect, useRef } from "react";
import DOMPurify from 'dompurify';
import "../../css/Teachers/TeacherProfile.css";

// Import service functions for API calls
import {
  fetchTeacherProfile,
  initializeTeacherProfile,
  updateTeacherProfile,
  updateTeacherPassword,
  uploadProfileImage,
  deleteProfileImage
} from "../../services/Teachers/teacherService";

/**
 * TeacherProfile Component - Updated to better handle profile data
 */
function TeacherProfile() {
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [imageLoadError, setImageLoadError] = useState(false);


  // State for tracking actions and changes
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastAction, setLastAction] = useState({
    type: null, // 'success', 'error'
    message: '',
    timestamp: null
  });

  // Refs for file input
  const fileInputRef = useRef(null);

  // Add a state for image refresh trigger
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  // Effect to fetch profile data
  useEffect(() => {
    const getTeacherData = async () => {
      try {
        setIsLoading(true);

        // First try to initialize profile if it doesn't exist
        try {
          await initializeTeacherProfile();
        } catch (initError) {
          console.log("Profile initialization skipped:", initError.message);
        }

        // Fetch profile data from API
        const data = await fetchTeacherProfile();

        // Debug logs
        console.log("Profile data received:", data);
        if (data.profileImageUrl) {
          console.log("Profile image URL:", data.profileImageUrl);
        } else {
          console.log("No profile image URL found.");
        }

        // Ensure emergencyContact exists
        const normalizedData = {
          ...data,
          // ensure emergencyContact always exists
          emergencyContact: data.emergencyContact || { name: '', number: '' }
        };

        setFormData(normalizedData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoadError("Failed to load profile data. Please try again later.");
        setIsLoading(false);
      }
    };

    getTeacherData();
  }, []);

  // Log actions for audit purposes
  useEffect(() => {
    if (lastAction.type) {
      // This could be extended to send logs to a backend service
      console.log(`[${new Date().toISOString()}] ${lastAction.type.toUpperCase()}: ${lastAction.message}`);
    }
  }, [lastAction]);


  // Add debugging output when profile is loaded
  useEffect(() => {
    const getTeacherData = async () => {
      try {
        setIsLoading(true);

        // First try to initialize profile if it doesn't exist
        try {
          await initializeTeacherProfile();
        } catch (initError) {
          console.log("Profile initialization skipped:", initError.message);
        }

        // Fetch profile data from API
        const data = await fetchTeacherProfile();

        // Debug logs
        console.log("Profile data received:", data);
        console.log("Full profile object:", JSON.stringify(data, null, 2));

        if (data.profileImageUrl) {
          console.log("Profile image URL:", data.profileImageUrl);
          console.log("Encoded image URL:", encodeURI(data.profileImageUrl));
        } else {
          console.log("No profile image URL found.");
        }

        // Update form data state
        setFormData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setLoadError("Failed to load profile data. Please try again later.");
        setIsLoading(false);
      }
    };

    getTeacherData();
  }, []);

  // States for form handling
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ show: false, message: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showImageControls, setShowImageControls] = useState(false);

  // Initial form data state - this would be populated from API
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    position: "",
    employeeId: "",
    email: "",
    contact: "",
    gender: "",
    civilStatus: "",
    dob: "",
    address: "",
    profileImageUrl: null,
    emergencyContact: {
      name: "",
      number: ""
    }
  });

  // Handle input changes with sanitization
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitize input
    const sanitizedValue = DOMPurify.sanitize(value);
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  // Handle emergency contact changes with sanitization
  const handleEmergencyChange = (field, value) => {
    // Sanitize input
    const sanitizedValue = DOMPurify.sanitize(value);
    setFormData((prev) => ({
      ...prev,
      emergencyContact: { ...(prev.emergencyContact || {}), [field]: sanitizedValue },
    }));
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number format (simple validation for Philippine format)
  const isValidPhoneNumber = (phone) => {
    // Allow +63 format or local 09xx format
    const phoneRegex = /^(\+?63|0)[\d]{10}$/;
    // Remove spaces for validation
    const cleanPhone = phone.replace(/\s+/g, '');
    return phoneRegex.test(cleanPhone);
  };

  // Handle profile image click - only show controls when in edit mode
  const handleImageClick = () => {
    if (isEditing) {
      setShowImageControls(!showImageControls);
    }
  };


  // Open file browser when upload button is clicked
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Process the selected image file
  // Improved handleFileChange
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setImageLoadError(false);

    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      setErrorDialog({
        show: true,
        message: "Please upload a valid image file (JPEG, PNG, or GIF)."
      });
      return;
    }

    // Validate file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorDialog({
        show: true,
        message: "File size exceeds 5MB. Please upload a smaller image."
      });
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(0);

      // Progress callback function
      const onProgress = (percent) => {
        setUploadProgress(percent);
      };

      // After successful upload
      const result = await uploadProfileImage(file, onProgress);
      console.log("Upload result:", result);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // Update form data with new image URL
      setFormData(prev => {
        console.log("Updating form data with new image URL:", result.imageUrl);
        return {
          ...prev,
          profileImageUrl: result.imageUrl
        };
      });

      // Force image refresh
      setImageRefreshKey(Date.now());

      setLastAction({
        type: 'success',
        message: 'Profile image updated successfully',
        timestamp: new Date()
      });

      // Hide controls after successful upload
      setShowImageControls(false);

      // Force reload of profile data to ensure we have the latest state
      try {
        const refreshedData = await fetchTeacherProfile();
        setFormData(prevData => ({
          ...prevData,
          ...refreshedData,
          profileImageUrl: refreshedData.profileImageUrl
        }));
      } catch (refreshError) {
        console.warn("Could not refresh profile data after image upload:", refreshError);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setErrorDialog({
        show: true,
        message: error.message || "Failed to upload profile image. Please try again."
      });

      setLastAction({
        type: 'error',
        message: `Failed to upload image: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle profile image deletion
  const handleDeleteImage = async () => {
    if (!formData.profileImageUrl) return;

    try {
      await deleteProfileImage();

      // Update form data to remove image URL
      setFormData(prev => ({
        ...prev,
        profileImageUrl: null
      }));

      // Force image refresh
      setImageRefreshKey(Date.now());

      setLastAction({
        type: 'success',
        message: 'Profile image deleted successfully',
        timestamp: new Date()
      });

      // Hide controls after deletion
      setShowImageControls(false);
    } catch (error) {
      console.error("Error deleting image:", error);
      setErrorDialog({
        show: true,
        message: "Failed to delete profile image. Please try again."
      });

      setLastAction({
        type: 'error',
        message: `Failed to delete image: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      });
    }
  };

  // Toggle edit mode with validation
  const toggleEdit = async () => {
    if (isEditing) {
      // Form validation
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        return setErrorDialog({ show: true, message: "First and last name are required." });
      }

      if (!formData.email.trim()) {
        return setErrorDialog({ show: true, message: "Email is required." });
      }

      if (!isValidEmail(formData.email)) {
        return setErrorDialog({ show: true, message: "Please enter a valid email address." });
      }

      if (!formData.contact.trim()) {
        return setErrorDialog({ show: true, message: "Contact number is required." });
      }

      if (!isValidPhoneNumber(formData.contact)) {
        return setErrorDialog({
          show: true,
          message: "Please enter a valid Philippine phone number (e.g., +63 912 345 6789 or 0912 345 6789)."
        });
      }
      try {
        // Create a copy of the form data to normalize
        const updateData = { ...formData };

        // Ensure we're not sending undefined or invalid values
        if (!updateData.middleName) updateData.middleName = '';
        if (!updateData.gender) updateData.gender = '';
        if (!updateData.civilStatus) updateData.civilStatus = '';
        if (!updateData.dob) updateData.dob = '';
        if (!updateData.address) updateData.address = '';

        // Make sure emergency contact is properly formatted
        if (!updateData.emergencyContact) {
          updateData.emergencyContact = { name: '', number: '' };
        }

        // Send data to API
        const updateResult = await updateTeacherProfile(updateData);

        // If the API returns updated data, use it to refresh our form
        if (updateResult && updateResult.teacher) {
          setFormData(updateResult.teacher);
        }

        setIsEditing(false);
        setShowSaveDialog(true);
        // Hide image controls when exiting edit mode
        setShowImageControls(false);

        setLastAction({
          type: 'success',
          message: 'Profile updated successfully',
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        setErrorDialog({
          show: true,
          message: error.response?.data?.error || "Failed to update profile. Please try again later."
        });

        setLastAction({
          type: 'error',
          message: `Failed to update profile: ${error.message || 'Unknown error'}`,
          timestamp: new Date()
        });
      }
    } else {
      setIsEditing(true);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="lit-teacherprofile-container">
        <div className="lit-teacherprofile-card lit-loading-state">
          <div className="lit-loading-spinner"></div>
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadError) {
    return (
      <div className="lit-teacherprofile-container">
        <div className="lit-teacherprofile-card lit-error-state">
          <div className="lit-error-icon">!</div>
          <h3>Something went wrong</h3>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  // Get initials for avatar if no profile image exists
  const getInitials = () => {
    const first = formData.firstName?.charAt(0) || '';
    const last = formData.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Generate a random cache-busting parameter for the image URL
  const getCacheBustedImageUrl = (url) => {
    if (!url) return null;

    try {
      // First clean the URL by removing any existing query parameters
      const baseUrl = url.split('?')[0];

      // Handle URLs with spaces and special characters
      const encodedUrl = encodeURI(baseUrl);

      // Add timestamp for cache busting
      const timestamp = Date.now();

      return `${encodedUrl}?t=${timestamp}`;
    } catch (error) {
      console.error('Error formatting image URL:', error);
      return url; // Return original URL if formatting fails
    }
  };


  return (
    <div className="lit-teacherprofile-container">
      <div className="lit-teacherprofile-card">
        <h2 className="lit-page-title">Teacher Profile</h2>

        <div className="lit-profile-card">
          {/* Error Dialog */}
          {errorDialog.show && (
            <div className="lit-dialog-overlay">
              <div className="lit-dialog-box lit-error">
                <h4>Error</h4>
                <p>{errorDialog.message}</p>
                <button onClick={() => setErrorDialog({ show: false, message: "" })}>OK</button>
              </div>
            </div>
          )}

          {/* Success Save Dialog */}
          {showSaveDialog && (
            <div className="lit-dialog-overlay">
              <div className="lit-dialog-box lit-success">
                <h4>Success</h4>
                <p>Profile information updated successfully!</p>
                <button onClick={() => setShowSaveDialog(false)}>OK</button>
              </div>
            </div>
          )}

          {/* Password Modal */}
          {showPasswordModal && (
            <ChangePasswordModal
              onClose={() => setShowPasswordModal(false)}
              onActionLog={(type, message) => setLastAction({ type, message, timestamp: new Date() })}
            />
          )}

          {/* Header Row */}
          <div className="lit-personal-header">
            <div
              className={`lit-avatar-lg ${formData.profileImageUrl ? 'lit-has-image' : ''} ${isEditing ? 'lit-editable' : ''}`}
              onClick={handleImageClick}
            >
              <div
                className={`lit-avatar-lg ${formData.profileImageUrl && !imageLoadError ? 'lit-has-image' : ''} ${isEditing ? 'lit-editable' : ''}`}
                onClick={handleImageClick}
              >
                {formData.profileImageUrl && !imageLoadError ? (
                  <img
                    key={imageRefreshKey}
                    src={getCacheBustedImageUrl(formData.profileImageUrl)}
                    alt="Profile"
                    className="lit-profile-image"
                    onError={(e) => {
                      console.error("Failed to load image:", e.target.src);
                      setImageLoadError(true);
                    }}
                  />
                ) : (
                  getInitials()
                )}
                {/* Show edit indicator when in edit mode */}
                {isEditing && (
                  <div className="lit-avatar-overlay">
                    <span className="lit-camera-text">Edit</span>
                  </div>
                )}
              </div>


              {/* Show edit indicator when in edit mode */}
              {isEditing && (
                <div className="lit-avatar-overlay">
                  <span className="lit-camera-text">Edit</span>
                </div>
              )}
            </div>

            {/* Image controls - shown only when in edit mode AND avatar is clicked */}
            {isEditing && showImageControls && (
              <div className="lit-image-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif"
                  className="lit-file-input"
                />

                <button
                  className="lit-image-btn lit-upload-btn"
                  onClick={triggerFileInput}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? `Uploading ${uploadProgress}%` : 'Upload Image'}
                </button>

                {formData.profileImageUrl && (
                  <button
                    className="lit-image-btn lit-delete-btn"
                    onClick={handleDeleteImage}
                    disabled={isUploadingImage}
                  >
                    Remove Image
                  </button>
                )}
              </div>
            )}

            <div className="lit-personal-info">
              <h3 className="lit-teacher-name">
                {formData.firstName} {formData.middleName ? `${formData.middleName} ` : ''}{formData.lastName}
              </h3>

              <div className="lit-contact-edit-group">
                <div className="lit-input-group">
                  <span className="lit-input-label">Email:</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Email Address"
                    aria-label="Email Address"
                  />
                </div>
                <div className="lit-input-group">
                  <span className="lit-input-label">Position:</span>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Position"
                    aria-label="Position"
                  />
                </div>
              </div>
            </div>
            <div className="lit-action-buttons">
              <button className="lit-edit-btn" onClick={toggleEdit} aria-label={isEditing ? "Save Profile" : "Edit Profile"}>
                {isEditing ? "Save Profile" : "Edit Profile"}
              </button>
              <button
                className="lit-change-password-btn"
                onClick={() => setShowPasswordModal(true)}
                aria-label="Change Password"
              >
                Change Password
              </button>
            </div>
          </div>

          <hr className="lit-divider" />

          {/* Personal Information Section */}
          <h4 className="lit-subtitle">Personal Information</h4>
          <div className="lit-info-grid">
            <div className="lit-input-group">
              <label htmlFor="teacher-first-name">First Name</label>
              <input
                id="teacher-first-name"
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="First Name"
                aria-label="First Name"
              />
              {isEditing && !formData.firstName?.trim() &&
                <span className="lit-input-error">First Name is required</span>
              }
            </div>

            <div className="lit-input-group">
              <label htmlFor="teacher-middle-name">Middle Name</label>
              <input
                id="teacher-middle-name"
                type="text"
                name="middleName"
                value={formData.middleName || ''}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Middle Name"
                aria-label="Middle Name"
              />
            </div>

            <div className="lit-input-group">
              <label htmlFor="teacher-last-name">Last Name</label>
              <input
                id="teacher-last-name"
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Last Name"
                aria-label="Last Name"
              />
              {isEditing && !formData.lastName?.trim() &&
                <span className="lit-input-error">Last Name is required</span>
              }
            </div>


            <div className="lit-input-group">
              <label htmlFor="teacher-contact">Contact Number</label>
              <input
                id="teacher-contact"
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Contact Number"
                aria-label="Contact Number"
              />
              {isEditing && formData.contact && !isValidPhoneNumber(formData.contact) &&
                <span className="lit-input-error">Enter valid Philippine number</span>
              }
            </div>
            <div className="lit-input-group">
              <label htmlFor="teacher-dob">Date of Birth</label>
              <input
                id="teacher-dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                readOnly={!isEditing}
                aria-label="Date of Birth"
              />
            </div>
            <div className="lit-input-group">
              <label htmlFor="teacher-gender">Gender</label>
              <select
                id="teacher-gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
                aria-label="Gender"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="lit-input-group">
              <label htmlFor="teacher-civil-status">Civil Status</label>
              <select
                id="civil-status"
                name="civilStatus"
                value={formData.civilStatus}
                onChange={handleChange}
                disabled={!isEditing}
                aria-label="Civil Status"
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>

            <div className="lit-input-group lit-full-width">
              <label htmlFor="teacher-address">Address</label>
              <input
                id="teacher-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                readOnly={!isEditing}
                placeholder="Complete Address"
                aria-label="Address"
                className="lit-full-width-input"
              />
            </div>
          </div>

          <h4 className="lit-subtitle">Emergency Contact</h4>
          <div className="lit-info-grid">
            <div className="lit-input-group">
              <label htmlFor="emergency-name">Contact Person</label>
              <input
                id="emergency-name"
                name="name"
                type="text"
                value={formData.emergencyContact?.name || ""}
                onChange={(e) => handleEmergencyChange("name", e.target.value)}
                readOnly={!isEditing}
                placeholder="Emergency Contact Name"
                aria-label="Emergency Contact Name"
              />
            </div>
            <div className="lit-input-group">
              <label htmlFor="emergency-number">Contact Number</label>
              <input
                id="emergency-number"
                type="text"
                name="number"
                value={formData.emergencyContact?.number || ""}
                onChange={(e) => handleEmergencyChange("number", e.target.value)}
                readOnly={!isEditing}
                placeholder="Emergency Contact Number"
                aria-label="Emergency Contact Number"
              />
              {isEditing &&
                formData.emergencyContact.number &&
                !isValidPhoneNumber(formData.emergencyContact.number) &&
                <span className="lit-input-error">Enter valid Philippine number</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ChangePasswordModal Component
 * 
 * Modal for changing teacher password with validation and security features.
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onActionLog - Function to log actions
 */
function ChangePasswordModal({ onClose, onActionLog }) {
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "#ccc"
  });

  // Check password strength
  const checkPasswordStrength = (password) => {
    // Initial score
    let score = 0;
    let message = "Very weak";
    let color = "#ff4d4d";

    // If password is empty, return default values
    if (!password) {
      return { score: 0, message: "", color: "#ccc" };
    }

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Contains lowercase
    if (/[a-z]/.test(password)) score++;

    // Contains uppercase
    if (/[A-Z]/.test(password)) score++;

    // Contains number
    if (/\d/.test(password)) score++;

    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Determine message and color based on score
    if (score >= 6) {
      message = "Very strong";
      color = "#4CAF50";
    } else if (score >= 4) {
      message = "Strong";
      color = "#8BC34A";
    } else if (score >= 3) {
      message = "Moderate";
      color = "#FFC107";
    } else if (score >= 2) {
      message = "Weak";
      color = "#FF9800";
    }

    return { score, message, color };
  };

  // Update password strength when new password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(newPass));
  }, [newPass]);

  const handleChangePassword = async () => {
    // Reset error state
    setError("");

    // Validate inputs
    if (!currentPass) {
      setError("Current password is required.");
      return;
    }

    if (!newPass) {
      setError("New password is required.");
      return;
    }

    if (newPass !== confirmPass) {
      setError("New passwords do not match.");
      return;
    }

    // Password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPass)) {
      setError("Password must be at least 8 characters long and include lowercase, uppercase, number, and special character.");
      return;
    }

    // Prevent using the same password
    if (currentPass === newPass) {
      setError("New password must be different from current password.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Call API to update password
      await updateTeacherPassword(currentPass, newPass);

      // Show success message
      setSuccess("Password updated successfully!");

      // Log action
      if (onActionLog) {
        onActionLog('success', 'Password changed successfully');
      }

      // Reset form fields
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");

      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      // Handle specific error cases
      if (error.message === "INCORRECT_PASSWORD") {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to update password. Please try again later.");
      }

      // Log action
      if (onActionLog) {
        onActionLog('error', `Failed to change password: ${error.message || 'Unknown error'}`);
      }

      console.error("Error updating password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lit-dialog-overlay">
      <div className="lit-dialog-box lit-password-modal">
        <h2 className="lit-password-title">Change Password</h2>

        {/* Error message */}
        {error && <p className="lit-password-error">{error}</p>}

        {/* Success message */}
        {success && <p className="lit-password-success">{success}</p>}

        {/* Current password field */}
        <div className="lit-password-field">
          <label htmlFor="current-password">Current Password</label>
          <div className="lit-password-input-wrapper">
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
              disabled={isSubmitting || success}
              aria-label="Current Password"
            />
            <button
              type="button"
              className="lit-password-toggle-btn"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              Show
            </button>
          </div>
        </div>

        {/* New password field */}
        <div className="lit-password-field">
          <label htmlFor="new-password">New Password</label>
          <div className="lit-password-input-wrapper">
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              placeholder="Enter new password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              disabled={isSubmitting || success}
              aria-label="New Password"
            />
            <button
              type="button"
              className="lit-password-toggle-btn"
              onClick={() => setShowNew(!showNew)}
            >
              Show
            </button>
          </div>
        </div>

        {/* Password strength indicator */}
        {newPass && (
          <div className="lit-strength-indicator">
            <div className="lit-strength-label">
              Password strength: <span style={{ color: passwordStrength.color }}>{passwordStrength.message}</span>
            </div>
            <div className="lit-strength-bar-container">
              <div
                className="lit-strength-bar-fill"
                style={{
                  width: `${(passwordStrength.score / 6) * 100}%`,
                  backgroundColor: passwordStrength.color
                }}
              ></div>
            </div>
            <div className="lit-password-requirements">
              <ul>
                <li className={newPass.length >= 8 ? "lit-met" : ""}>At least 8 characters</li>
                <li className={/[A-Z]/.test(newPass) ? "lit-met" : ""}>Uppercase letter (A-Z)</li>
                <li className={/[a-z]/.test(newPass) ? "lit-met" : ""}>Lowercase letter (a-z)</li>
                <li className={/\d/.test(newPass) ? "lit-met" : ""}>Number (0-9)</li>
                <li className={/[^A-Za-z0-9]/.test(newPass) ? "lit-met" : ""}>Special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Confirm password field */}
        <div className="lit-password-field">
          <label htmlFor="confirm-password">Confirm Password</label>
          <div className="lit-password-input-wrapper">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              disabled={isSubmitting || success}
              aria-label="Confirm Password"
            />
            <button
              type="button"
              className="lit-password-toggle-btn"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              Show
            </button>
          </div>
          {newPass && confirmPass && newPass !== confirmPass && (
            <span className="lit-input-error">Passwords do not match</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="lit-password-action-buttons">
          <button
            onClick={handleChangePassword}
            disabled={isSubmitting || success}
            className="lit-password-update-btn"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
          <button
            onClick={onClose}
            className="lit-password-cancel-btn"
            disabled={isSubmitting || success}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;