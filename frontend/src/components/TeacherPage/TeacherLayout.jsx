// src/components/TeacherPage/TeacherLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { fetchTeacherProfile, initializeTeacherProfile } from "../../services/Teachers/teacherService";
import "./teacherLayout.css";

function TeacherLayout({ onLogout }) {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        setLoading(true);
        
        // First try to initialize the profile if needed
        await initializeTeacherProfile();
        
        // Then fetch the profile
        const data = await fetchTeacherProfile();
        setTeacherInfo(data);
      } catch (err) {
        console.error("Failed to fetch teacher profile:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadTeacher();
  }, [location]); // Reload whenever the location changes

  return (
    <div className="teacher-layout-container">
      <Sidebar onLogout={onLogout} teacherInfo={teacherInfo || {}} />
      <div className="main-content-area">
        {loading ? <div>Loading profile...</div> : <Outlet />}
      </div>
    </div>
  );
}

export default TeacherLayout;