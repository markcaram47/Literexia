// src/components/Parents/ParentSidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  User,
  BookOpen,
  LogOut
} from 'lucide-react';
import './ParentSidebar.css';

const ParentSidebar = ({ onLogout }) => {
  const location = useLocation();
  const [parentData, setParentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base URL from environment variable or default
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchParentProfile = async () => {
      try {
        setLoading(true);
        // Get auth token from localStorage
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     JSON.parse(localStorage.getItem('userData'))?.token;
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Make API request to get parent profile
        const response = await axios.get(`${BASE_URL}/api/parents/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          setParentData({
            firstName: response.data.firstName || "",
            lastName: response.data.lastName || "",
            profileImageUrl: response.data.profileImageUrl || ""
          });
        } else {
          throw new Error('No profile data received');
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParentProfile();
  }, []);

  const navigationItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/parent/dashboard',
    },
    {
      id: 'progress',
      label: 'View Student Progress',
      icon: BookOpen,
      path: '/parent/feedback',
    }
  ];

  const isActiveItem = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="parent-sidebar">
      <div className="parent-sidebar__content">
        <div className="parent-sidebar__header">
          <div className="parent-sidebar__logo">
            <img src="/images/cradleLogoTrans.png" alt="Cradle of Learners" />
            <h1>CRADLE OF LEARNERS INC.</h1>
          </div>
          
          <div className="parent-sidebar__profile">
            <div className="parent-sidebar__avatar">
              {parentData?.profileImageUrl ? (
                <img 
                  src={parentData.profileImageUrl} 
                  alt={`${parentData.firstName} ${parentData.lastName}`} 
                />
              ) : (
                <div className="parent-sidebar__avatar-placeholder">
                  {parentData?.firstName?.charAt(0) || 'P'}
                </div>
              )}
            </div>
            <div className="parent-sidebar__user-info">
              <h3 className="parent-sidebar__name">
                {loading ? 'Loading...' : 
                error ? 'Error loading profile' : 
                parentData ? `${parentData.firstName} ${parentData.lastName}` : 'Parent User'}
              </h3>
              <p className="parent-sidebar__role">Parent</p>
            </div>
          </div>
        </div>

        <div className="parent-sidebar__navigation">
          {navigationItems.map(item => (
            <Link 
              key={item.id}
              to={item.path}
              className={`parent-sidebar__nav-item ${isActiveItem(item.path) ? 'parent-sidebar__nav-item--active' : ''}`}
            >
              <item.icon className="parent-sidebar__icon" />
              <span className="parent-sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="parent-sidebar__footer">
          <button 
            onClick={onLogout} 
            className="parent-sidebar__logout-btn"
          >
            <LogOut className="parent-sidebar__icon" />
            <span className="parent-sidebar__label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ParentSidebar;