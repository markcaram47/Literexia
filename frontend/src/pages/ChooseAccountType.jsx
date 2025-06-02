// src/pages/ChooseAccountType.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/chooseAccount.css';

import logo from '../assets/images/Teachers/LITEREXIA.png';
import parentIcon from '../assets/icons/Teachers/parent.png';
import teacherIcon from '../assets/icons/Teachers/teacher.png';
import adminIcon from '../assets/icons/Teachers/admin.png';
import wave from '../assets/images/Teachers/wave.png';

const ChooseAccountType = () => {
  const navigate = useNavigate();
  const [roleTypes, setRoleTypes] = useState({
    teacher: { displayName: 'Guro' },
    parent: { displayName: 'Magulang' },
    admin: { displayName: 'Admin' }
  });

  // When component mounts, fetch role types from API if possible
  useEffect(() => {
    const fetchRoleTypes = async () => {
      try {
        const BASE = import.meta.env.VITE_API_BASE_URL || 
                    (import.meta.env.DEV ? 'http://localhost:5001' : '');
        
        // Try to fetch role definitions from API
        const response = await fetch(`${BASE}/api/roles`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data)) {
            // Create a mapping of role type to display name
            const roleMapping = {};
            data.forEach(role => {
              if (role.name) {
                // Map Tagalog display names based on role name
                const displayName = 
                  role.name === 'teacher' ? 'Guro' : 
                  role.name === 'parent' ? 'Magulang' : 
                  role.name === 'admin' ? 'Admin' : role.name;
                
                roleMapping[role.name] = {
                  displayName,
                  ...role
                };
              }
            });
            
            if (Object.keys(roleMapping).length > 0) {
              setRoleTypes(roleMapping);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching role types:', error);
        // Continue with default values in case of error
      }
    };
    
    fetchRoleTypes();
  }, []);

  const handleSelect = (type) => {
    // Only store the type name, no hardcoded IDs
    localStorage.setItem('userType', type);
    
    // Navigate to login where the role will be used for redirection
    navigate('/login');
  };

  return (
    <div className="choose-container">
      <img src={logo} alt="Literexia Logo" className="choose-logo" />
      <button className="choose-exit" onClick={() => navigate('/')}>X</button>
      <div className="choose-content">
        <h1>Choose Your Account Type</h1>
        <div className="account-options">
          <div className="account-card" onClick={() => handleSelect('parent')}>
            <img src={parentIcon} alt="Parent" />
            <span>{roleTypes.parent?.displayName || 'Magulang'}</span>
          </div>
          <div className="account-card" onClick={() => handleSelect('teacher')}>
            <img src={teacherIcon} alt="Teacher" />
            <span>{roleTypes.teacher?.displayName || 'Guro'}</span>
          </div>
          <div className="account-card" onClick={() => handleSelect('admin')}>
            <img src={adminIcon} alt="Admin" />
            <span>{roleTypes.admin?.displayName || 'Admin'}</span>
          </div>
        </div>
      </div>
      <img src={wave} alt="Wave" className="bottom-wave" />
    </div>
  );
};

export default ChooseAccountType;