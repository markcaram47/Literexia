// src/components/Admin/Layout/NavigationBar/NavigationBar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileCheck, 
  ClipboardList, 
  BarChart2, 
  Inbox, 
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  Eye,
  GraduationCap,
  School,
  UserSquare2,
  PieChart,
  Book
} from 'lucide-react';
import './NavigationBar.css';

const NavigationBar = ({ onLogout }) => {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState([]);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        console.log('Starting admin profile fetch...');
        
        // Get the auth token from all possible storage locations
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     JSON.parse(localStorage.getItem('userData'))?.token;
        
        console.log('Auth token:', token ? 'Found' : 'Not found');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://localhost:5001/api/admin/profile', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (e) {
          console.error('Failed to parse response:', e);
          throw new Error('Invalid response format');
        }

        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        if (!data.success || !data.data) {
          console.error('Invalid response structure:', data);
          throw new Error('Invalid response structure');
        }

        const profileData = data.data;
        console.log('Setting admin profile data:', profileData);

        if (!profileData.firstName || !profileData.lastName) {
          console.error('Missing name data:', profileData);
          throw new Error('Profile data missing required fields');
        }

        setAdminData(profileData);
        setLoading(false);
      } catch (err) {
        console.error('Error in profile fetch:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/admin/dashboard',
      subItems: []
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      path: '/admin/user-management',
      subItems: [
        { id: 'student-list', label: 'Student List', path: '/admin/student-list', icon: GraduationCap },
        { id: 'teacher-list', label: 'Teacher List', path: '/admin/teacher-list', icon: School },
        { id: 'parent-list', label: 'Parent List', path: '/admin/parent-list', icon: UserSquare2 }
      ]
    },
    {
      id: 'assessment-results',
      label: 'Assessments',
      icon: PieChart,
      path: '/admin/assessment-results-overview',
      subItems: [
        { id: 'pre-assessment', label: 'Pre Assessment', path: '/admin/student-assessments', icon: Book },
        { id: 'post-assessment', label: 'Post Assessment', path: '/admin/assessment-results-overview', icon: BarChart2 }
      ]
    },
    // {
    //   id: 'analytics',
    //   label: 'Activity Management',
    //   icon: BarChart2,
    //   path: '/admin/analytics',
    //   subItems: [
    //     { id: 'submission-overview', label: 'Activity Approval', path: '/admin/submissions-overview', icon: FileCheck }
    //   ]
    // }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      }
      return [...prev, sectionId];
    });
  };

  const isActiveItem = (path, subItems = []) => {
    const currentPath = location.pathname;
    return currentPath === path || subItems.some(item => currentPath === item.path);
  };

  const isActiveSubItem = (path) => {
    const currentPath = location.pathname;
    return currentPath === path;
  };

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar__content">
        {/* Logo section */}
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">
            <img src="/images/cradleLogoTrans.png" alt="Cradle of Learners" />
            <h1>CRADLE OF LEARNERS INC.</h1>
          </div>
          
          {/* Profile section */}
          <div className="admin-sidebar__profile">
            <div className="admin-sidebar__avatar">
              {adminData?.profileImageUrl ? (
                <img 
                  src={adminData.profileImageUrl} 
                  alt={`${adminData.firstName} ${adminData.lastName}`} 
                />
              ) : (
                <div className="admin-sidebar__avatar-placeholder">
                  {adminData?.firstName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="admin-sidebar__user-info">
              <h3 className="admin-sidebar__name">
                {loading ? 'Loading...' : 
                error ? `Error: ${error}` : 
                adminData ? `${adminData.firstName} ${adminData.lastName}` : 'Admin User'}
              </h3>
              <p className="admin-sidebar__role">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <div className="admin-sidebar__menu">
          {navigationItems.map(item => (
            <div key={item.id} className="admin-sidebar__section">
              <Link 
                to={item.subItems.length > 0 ? '#' : item.path}
                className={`admin-sidebar__nav-item ${isActiveItem(item.path, item.subItems) ? 'admin-sidebar__nav-item--active' : ''}`}
                onClick={(e) => {
                  if (item.subItems.length > 0) {
                    e.preventDefault();
                    toggleSection(item.id);
                  }
                }}
              >
                <div className="admin-sidebar__item-content">
                  <item.icon className="admin-sidebar__icon" />
                  <span className="admin-sidebar__label">{item.label}</span>
                </div>
                {item.subItems.length > 0 && (
                  <div className="admin-sidebar__expand-icon">
                    {expandedSections.includes(item.id) ? 
                      <ChevronDown size={16} /> : 
                      <ChevronRight size={16} />
                    }
                  </div>
                )}
              </Link>

              {/* Submenu items */}
              {item.subItems.length > 0 && expandedSections.includes(item.id) && (
                <div className="admin-sidebar__submenu">
                  {item.subItems.map(subItem => (
                    <Link 
                      key={subItem.id}
                      to={subItem.path}
                      className={`admin-sidebar__submenu-item ${isActiveSubItem(subItem.path) ? 'admin-sidebar__submenu-item--active' : ''}`}
                    >
                      {subItem.icon && <subItem.icon className="admin-sidebar__submenu-icon" />}
                      <span className="admin-sidebar__submenu-label">{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer section */}
        <div className="admin-sidebar__footer">
          <button 
            onClick={onLogout} 
            className="admin-sidebar__logout-btn"
          >
            <LogOut className="admin-sidebar__icon" />
            <span className="admin-sidebar__label">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;