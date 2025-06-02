import React, { useState } from 'react';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ onClose }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validatePassword = () => {
    // Clear previous error messages
    setErrorMessage('');
    
    // Check if any field is empty
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setErrorMessage('All fields are required');
      return false;
    }
    
    // Check if new password and confirm password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return false;
    }
    
    // Check password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      setErrorMessage('Password must contain at least 8 characters, including uppercase and lowercase letters, a number, and a special character (!@#$%^&*)');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate the input
    if (!validatePassword()) {
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const response = await axios.put(
        `${BASE_URL}/api/parents/profile/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccessMessage('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response) {
        if (error.response.status === 400 && error.response.data.error === 'INCORRECT_PASSWORD') {
          setErrorMessage('Current password is incorrect');
        } else {
          setErrorMessage(error.response.data.error || error.response.data.message || 'Failed to change password');
        }
      } else {
        setErrorMessage('An error occurred while changing password. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <div className="password-modal-header">
          <h2>Change Password</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="password-modal-content">
          {errorMessage && (
            <div className="error-message">
              <FiAlertCircle size={20} />
              <p>{errorMessage}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="success-message">
              <FiCheckCircle size={20} />
              <p>{successMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group password-input-group">
              <label htmlFor="currentPassword">
                <FiLock /> Current Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            
            <div className="form-group password-input-group">
              <label htmlFor="newPassword">
                <FiLock /> New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            
            <div className="form-group password-input-group">
              <label htmlFor="confirmPassword">
                <FiLock /> Confirm New Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button 
                  type="button" 
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            
            <div className="password-requirements">
              <p>Password must:</p>
              <ul>
                <li>Be at least 8 characters long</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one lowercase letter</li>
                <li>Include at least one number</li>
                <li>Include at least one special character (!@#$%^&*)</li>
              </ul>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;