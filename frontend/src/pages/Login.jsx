import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';
import AuthService from '../services/authService';

import logo from '../assets/images/Teachers/LITEREXIA.png';
import wave from '../assets/images/Teachers/wave.png';
import { FiMail, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

function ErrorDialog({ message, onClose }) {
  return (
    <div className="error-dialog-overlay fade-in">
      <div className="error-dialog-box pop-in">
        <div className="error-icon">
          <FiAlertCircle size={24} color="#d9534f" />
        </div>
        <p>{message}</p>
        <button className="dialog-close-btn" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [expectedRoleType, setExpectedRoleType] = useState(null);

  // Retrieve the expected role type from localStorage when component mounts
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    if (userType) {
      setExpectedRoleType(userType);
      console.log('Expected user type:', userType);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.email || !formData.password) {
        setError('Email and password are required.');
        setIsLoading(false);
        return;
      }

      if (!expectedRoleType) {
        setError('User type not specified. Please return to account selection.');
        setIsLoading(false);
        return;
      }

      console.log('Login attempt:', {
        email: formData.email,
        expectedRole: expectedRoleType
      });

      // Pass the expectedRoleType to the login method
      const response = await AuthService.login(
        formData.email, 
        formData.password,
        expectedRoleType
      );
      
      console.log('Login successful, user data:', response.user);

      // Store expected role type
      localStorage.setItem('userType', expectedRoleType);
      
      // Store user ID if available
      if (response.user && response.user.id) {
        localStorage.setItem('userId', response.user.id);
      }

      // Call the onLogin function to update App state
      if (onLogin) {
        onLogin();
      }

      // Route based on user type
      if (expectedRoleType === 'parent') {
        navigate('/parent/dashboard');
      } else if (expectedRoleType === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (expectedRoleType === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid account type selected');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide a more user-friendly error message for common errors
      if (err.response) {
        if (err.response.status === 403) {
          setError('Access denied. You do not have the selected role.');
        } else if (err.response.status === 401) {
          setError('Invalid email or password.');
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Login failed. Please try again later.');
        }
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get label for the current account type
  const getAccountTypeLabel = () => {
    switch (expectedRoleType) {
      case 'parent': return 'Parent';
      case 'teacher': return 'Teacher';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  return (
    <div className="login-container">
      <img src={logo} alt="Literexia Logo" className="top-left-logo" />
      {/* Exit button to return to Choose Account page */}
      <button className="exit-button" onClick={() => navigate('/choose-account')}>X</button>

      {error && <ErrorDialog message={error} onClose={() => setError('')} />}

      <div className="login-card">
        <h1 className="welcome-text">Welcome Back!</h1>
        <p className="instruction-text">
          Enter your email and password for {getAccountTypeLabel()} account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group icon-input">
            <input
              type="email"
              name="email"
              placeholder="Email" required
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              data-testid="email-input"
            />
            <FiMail className="input-icon" />
          </div>

          <div className="form-group icon-input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password" required
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              disabled={isLoading}
              data-testid="password-input"
            />
            {showPassword ? (
              <FiEyeOff
                className="input-icon clickable"
                onClick={() => setShowPassword(false)}
                data-testid="hide-password"
              />
            ) : (
              <FiEye
                className="input-icon clickable"
                onClick={() => setShowPassword(true)}
                data-testid="show-password"
              />
            )}
          </div>

          <button
            className="signin-button"
            type="submit"
            disabled={
              isLoading ||
              formData.email.trim() === '' ||
              formData.password === ''
            }
            data-testid="login-button"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <img src={wave} alt="Wave" className="bottom-wave" />
    </div>
  );
};

export default Login;