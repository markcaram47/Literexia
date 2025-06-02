// src/pages/Parents/ParentDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Heart,
  Book,
  Lock,
  X,
  CheckCircle,
  UserCircle,
  Info,
  GraduationCap,
  School,
  ClipboardList,
  BarChart2,
  Home
} from 'lucide-react';
import parent1 from "../../assets/images/Parents/parent1.png";
import student1 from "../../assets/images/Parents/student1.jpg";
import ChangePasswordModal from "../../components/ParentPage/ChangePasswordModal";
import "../../css/Parents/ParentDashboard.css";

const ParentDashboard = () => {
  // State will be populated from database
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    contactNumber: "",
    email: "",
    address: "",
    civilStatus: "",
    dateOfBirth: "",
    gender: "",
    profileImageUrl: ""
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState([]);
  const [animated, setAnimated] = useState(false);
  
  // Base URL from environment variable or default
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  // Fetch parent profile data when component mounts
  useEffect(() => {
    // Get data on component mount
    fetchParentData();
    
    // Set up interval to refresh data every 30 seconds (optional)
    const intervalId = setInterval(fetchParentData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Trigger animations after data loads
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setAnimated(true);
      }, 300);
    }
  }, [isLoading]);
  
  // Function to fetch parent profile from database
  const fetchParentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get auth token from localStorage - try both formats
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      
      console.log('Attempting to fetch parent profile with:', {
        token: token ? 'Token exists' : 'No token',
        userId: userId || 'No userId'
      });
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setIsLoading(false);
        return;
      }
      
      // Make API request to get parent profile
      console.log('Making request to:', `${BASE_URL}/api/parents/profile`);
      const profileResponse = await axios.get(`${BASE_URL}/api/parents/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile response:', profileResponse.data);
      
      // If successful, update state with data from database
      if (profileResponse.data) {
        setPersonalInfo({
          firstName: profileResponse.data.firstName || "",
          middleName: profileResponse.data.middleName || "",
          lastName: profileResponse.data.lastName || "",
          contactNumber: profileResponse.data.contact || profileResponse.data.contactNumber || "",
          email: profileResponse.data.email || "",
          address: profileResponse.data.address || "",
          civilStatus: profileResponse.data.civilStatus || "",
          dateOfBirth: profileResponse.data.dateOfBirth || "",
          gender: profileResponse.data.gender || "",
          profileImageUrl: profileResponse.data.profileImageUrl || ""
        });
        
        console.log("Profile data loaded from database:", profileResponse.data);
      } else {
        setError("No profile data received from server");
      }
      
      // Fetch children data
      try {
        console.log('Fetching children data...');
        const childrenResponse = await axios.get(`${BASE_URL}/api/parents/children`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Children response:', childrenResponse.data);
        
        if (childrenResponse.data && Array.isArray(childrenResponse.data)) {
          setChildren(childrenResponse.data);
          console.log("Children data loaded from database:", childrenResponse.data);
        }
      } catch (childrenError) {
        console.error("Error fetching children:", childrenError);
        // Don't set error for children fetch failure
      }
      
    } catch (error) {
      console.error("Error fetching parent data:", error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Error loading profile data";
      console.error("Full error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: errorMessage
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  // After fetching parent profile, if personalInfo.children exists and is non-empty, fetch each child's student profile
  useEffect(() => {
    if (personalInfo.children && personalInfo.children.length > 0) {
      const fetchChildren = async () => {
        try {
          const token = localStorage.getItem('token') || localStorage.getItem('authToken');
          const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
          const responses = await Promise.all(
            personalInfo.children.map(childId =>
              axios.get(`${BASE_URL}/api/admin/manage/students/${childId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
            )
          );
          setChildren(responses.map(res => res.data.data.studentProfile));
        } catch (error) {
          setChildren([]);
        }
      };
      fetchChildren();
    } else {
      setChildren([]);
    }
  }, [personalInfo.children]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="parent-dashboard__container">
      {/* Loading indicator */}
      {isLoading && (
        <div className="parent-dashboard__loading-overlay">
          <div className="parent-dashboard__spinner"></div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="parent-dashboard__error-message">
          <X className="parent-dashboard__error-icon" size={24} />
          <div className="parent-dashboard__error-content">
            <h3>Error Loading Profile</h3>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="parent-dashboard__main-content">
        {/* Header section with breadcrumb */}
        <div className="parent-dashboard__header">
          <div className="parent-dashboard__breadcrumb">
            <Home size={16} />
            <span className="parent-dashboard__breadcrumb-separator">/</span>
            <span className="parent-dashboard__breadcrumb-active">Parent Dashboard</span>
          </div>
          <h1 className="parent-dashboard__title">My Profile</h1>
          <p className="parent-dashboard__subtitle">View and manage your personal information and enrolled children</p>
        </div>
        
        {/* Profile overview section */}
        <div className={`parent-dashboard__profile-overview ${animated ? 'animate' : ''}`} style={{animationDelay: '0s'}}>
          <div className="parent-dashboard__info-banner">
            <Info className="parent-dashboard__info-icon" />
            <div className="parent-dashboard__info-content">
              <h3>Parent Dashboard</h3>
              <p>
                Welcome to your parent dashboard. Here you can view your profile information and check details about your enrolled children.
                Use the Change Password button to update your login credentials.
              </p>
            </div>
          </div>
          
          <div className="parent-dashboard__profile-header">
            <div className="parent-dashboard__profile-avatar">
              {personalInfo.profileImageUrl ? (
                <img 
                  src={personalInfo.profileImageUrl} 
                  alt={`${personalInfo.firstName} ${personalInfo.lastName}`} 
                  className="parent-dashboard__avatar-img"
                />
              ) : (
                <UserCircle className="parent-dashboard__avatar-placeholder" size={80} />
              )}
            </div>
            <div className="parent-dashboard__profile-details">
              <h2 className="parent-dashboard__profile-name">
                {`${personalInfo.firstName} ${personalInfo.middleName ? personalInfo.middleName + ' ' : ''}${personalInfo.lastName}`}
              </h2>
              <div className="parent-dashboard__contact-items">
                <div className="parent-dashboard__contact-item">
                  <Mail size={18} />
                  <span>{personalInfo.email || 'No email provided'}</span>
                </div>
                <div className="parent-dashboard__contact-item">
                  <Phone size={18} />
                  <span>{personalInfo.contactNumber || 'No contact number provided'}</span>
                </div>
              </div>
            </div>
            <div className="parent-dashboard__profile-actions">
              <button 
                className="parent-dashboard__change-password-btn" 
                onClick={() => setShowChangePassword(true)}
              >
                <Lock size={18} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Personal Information Cards */}
        <div className="parent-dashboard__section">
          <h3 className="parent-dashboard__section-title">
            <User className="parent-dashboard__section-icon" />
            Personal Information
          </h3>
          
          <div className="parent-dashboard__info-cards">
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.1s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">First Name</div>
              </div>
              <div className="parent-dashboard__info-card-value">{personalInfo.firstName || 'Not provided'}</div>
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.15s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Last Name</div>
              </div>
              <div className="parent-dashboard__info-card-value">{personalInfo.lastName || 'Not provided'}</div>
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.2s'}}>
              <div className="parent-dashboard__info-card-header">
                <User className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Middle Name</div>
              </div>
              <div className="parent-dashboard__info-card-value">{personalInfo.middleName || 'Not provided'}</div>
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.25s'}}>
              <div className="parent-dashboard__info-card-header">
                <Calendar className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Date of Birth</div>
              </div>
              <div className="parent-dashboard__info-card-value">{personalInfo.dateOfBirth ? formatDate(personalInfo.dateOfBirth) : 'Not provided'}</div>
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.3s'}}>
              <div className="parent-dashboard__info-card-header">
                <Heart className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Civil Status</div>
              </div>
              <div className="parent-dashboard__info-card-value">{personalInfo.civilStatus || 'Not provided'}</div>
            </div>
            
            <div className={`parent-dashboard__info-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.35s'}}>
              <div className="parent-dashboard__info-card-header">
                <MapPin className="parent-dashboard__info-card-icon" />
                <div className="parent-dashboard__info-card-label">Address</div>
              </div>
              <div className="parent-dashboard__info-card-value">{personalInfo.address || 'Not provided'}</div>
            </div>
          </div>
        </div>
        
        {/* Children Section */}
        <div className="parent-dashboard__section">
          <h3 className="parent-dashboard__section-title">
            <GraduationCap className="parent-dashboard__section-icon" />
            Children Enrolled
          </h3>
          
          {children.length > 0 ? (
            <div className="parent-dashboard__children-grid">
              {children.map((child, index) => (
                <div 
                  key={child._id || index} 
                  className={`parent-dashboard__child-card ${animated ? 'animate' : ''}`} 
                  style={{animationDelay: `${0.4 + (index * 0.1)}s`}}
                >
                  <div className="parent-dashboard__child-header">
                    <div className="parent-dashboard__child-avatar">
                      {child.profileImage ? (
                        <img 
                          src={child.profileImage} 
                          alt={`${child.firstName || ''} ${child.lastName || ''}`} 
                          className="parent-dashboard__child-avatar-img"
                        />
                      ) : (
                        <School className="parent-dashboard__child-avatar-placeholder" />
                      )}
                    </div>
                    <div className="parent-dashboard__child-title">
                      <h4 className="parent-dashboard__child-name">
                        {`${child.firstName || ''} ${child.middleName ? child.middleName + ' ' : ''}${child.lastName || ''}`}
                      </h4>
                      <div className="parent-dashboard__child-id">
                        ID: {child.idNumber || 'Not assigned'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="parent-dashboard__child-details">
                    <div className="parent-dashboard__child-detail">
                      <ClipboardList size={16} />
                      <span className="parent-dashboard__child-detail-label">Section:</span>
                      <span className="parent-dashboard__child-detail-value">{child.section || 'Not assigned'}</span>
                    </div>
                    
                    <div className="parent-dashboard__child-detail">
                      <BarChart2 size={16} />
                      <span className="parent-dashboard__child-detail-label">Grade Level:</span>
                      <span className="parent-dashboard__child-detail-value">{child.gradeLevel || 'Not specified'}</span>
                    </div>
                    
                    <div className="parent-dashboard__child-detail">
                      <Calendar size={16} />
                      <span className="parent-dashboard__child-detail-label">Enrollment Date:</span>
                      <span className="parent-dashboard__child-detail-value">
                        {child.enrollmentDate ? formatDate(child.enrollmentDate) : 'Not specified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="parent-dashboard__child-footer">
                    {/* <div className={`parent-dashboard__child-status ${child.status === 'active' ? 'active' : 'inactive'}`}>
                      {child.status === 'active' ? 'Active Student' : (child.status || 'Status Unknown')}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="parent-dashboard__empty-children">
              <Book size={48} className="parent-dashboard__empty-icon" />
              <h4>No Children Enrolled</h4>
              <p>When your children are enrolled, they will appear here.</p>
            </div>
          )}
        </div>
        
        {/* Process Note */}
        <div className="parent-dashboard__process-note">
          <Info className="parent-dashboard__process-note-icon" />
          <div className="parent-dashboard__process-note-content">
            <p>
              <strong>Note:</strong> To update your personal information or to enroll a new child, 
              please contact the school administration. They will assist you with the necessary procedures.
            </p>
          </div>
        </div>
      </div>
      
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="parent-dashboard__success-message">
          <CheckCircle size={20} />
          <span>Changes saved successfully!</span>
        </div>
      )}
      
      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default ParentDashboard;