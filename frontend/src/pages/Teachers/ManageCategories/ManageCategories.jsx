// src/pages/Teachers/ManageCategories/ManageCategories.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import PostAssessment from "./PostAssessment";
import PreAssessment from "./PreAssessment";
import TemplateLibrary from "./TemplateLibrary";
import "../../../css/Teachers/ManageCategories/ManageCategories.css";
// Import FontAwesome 
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { getAllTemplates } from '../../../services/Teachers/templateService';
import AuthService from '../../../services/authService';

// Add all FontAwesome solid icons to the library
library.add(fas);

const ManageCategories = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [templates, setTemplates] = useState({
    questionTemplates: [],
    choiceTemplates: [],
    sentenceTemplates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isLoggedIn()) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    // Fetch templates from API
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await getAllTemplates();
        
        // Set the templates with the data from the API
        setTemplates({
          questionTemplates: data.questionTemplates || [],
          choiceTemplates: data.choiceTemplates || [],
          sentenceTemplates: data.sentenceTemplates || []
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching templates:', err);
        
        // Check if error is due to authentication
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          console.log('Authentication error, redirecting to login');
          AuthService.logout(); // Clear any invalid tokens
          navigate('/login');
          return;
        }
        
        setError(err.message || "Failed to load templates. Please try again.");
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [navigate]);

  return (
    <div className="manage-categories-container">
      <div className="mc-header">
        <h1>Assessment Management</h1>
        <p>Create, edit, and manage templates for activities and assessments.</p>
      </div>

      <Tabs 
        selectedIndex={tabIndex} 
        onSelect={index => setTabIndex(index)}
        className="mc-tabs"
      >
        <TabList className="mc-tab-list">
          <Tab 
            className={tabIndex === 0 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Template Library
          </Tab>
          <Tab 
            className={tabIndex === 1 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Post-Assessment
          </Tab>
          <Tab 
            className={tabIndex === 2 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Pre-Assessment
          </Tab>
        </TabList>

        <div className="mc-tab-content">
          <TabPanel>
            {loading ? (
              <div className="mc-loading">
                <div className="mc-spinner"></div>
                <p>Loading templates...</p>
              </div>
            ) : error ? (
              <div className="mc-error">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
              </div>
            ) : (
              <TemplateLibrary 
                templates={templates} 
                setTemplates={setTemplates} 
              />
            )}
          </TabPanel>
          <TabPanel>
            <PostAssessment 
              templates={templates} 
            />
          </TabPanel>
          <TabPanel>
            <PreAssessment />
          </TabPanel>
        </div>
      </Tabs>
    </div>
  );
};

export default ManageCategories;