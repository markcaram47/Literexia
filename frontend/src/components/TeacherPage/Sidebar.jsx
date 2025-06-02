// src/components/TeacherPage/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Updated import for Cradle of Learners logo
import cradleLogo from "../../assets/images/Teachers/cradleLogoTrans.png";
import dashboardIcon from "../../assets/icons/Teachers/Dashboard.png";
import viewStudentIcon from "../../assets/icons/Teachers/ViewStudent.png";
import manageActivityIcon from "../../assets/icons/Teachers/activitymanage.png";
import manageProgressIcon from "../../assets/icons/Teachers/progress.png";
import teacherProfileIcon from "../../assets/icons/Teachers/Feedback.png";
import logoutIcon from "../../assets/icons/Teachers/Logout.png";
import avatarFallback from "../../assets/icons/Teachers/avatar.png";
import chatbotIcon from "../../assets/icons/Teachers/chatbot.png";

import "./Sidebar.css";

function Sidebar({ defaultActive = "dashboard", onLogout, teacherInfo = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(defaultActive);
  const [imageRefreshKey, setImageRefreshKey] = useState(Date.now());

  const {
    firstName = "",
    lastName = "",
    position = "",
    profileImageUrl = null,
  } = teacherInfo;

  const fullName = [firstName, lastName]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setImageRefreshKey(Date.now());
  }, [teacherInfo, profileImageUrl]);

  const avatarSrc = profileImageUrl
    ? `${profileImageUrl}?t=${imageRefreshKey}`
    : avatarFallback;

  useEffect(() => {
    const path = location.pathname;

    // Dashboard route
    if (path.includes("/teacher/dashboard")) {
      setActive("dashboard");
    }
    // Student details and related routes
    else if (
      path.includes("/teacher/view-student") ||
      path.includes("/teacher/student-details")
    ) {
      setActive("view-student");
    }
    // Manage categories and related routes
    else if (
      /* Manage categories and related routes */
      path.includes("/teacher/manage-categories")
    ) {
      setActive("manage-categories");
    }


    // Manage progress and related routes
    else if (
      path.includes("/teacher/manage-progress") ||
      path.includes("/teacher/student-progress") ||
      path.includes("/teacher/pre-assessment") ||
      path.includes("/teacher/create-pre-assessment")
    ) {
      setActive("manage-progress");
    }
    // Profile route
    else if (path.includes("/teacher/profile")) {
      setActive("profile");
    }
    // Chatbot route
    else if (path.includes("/teacher/chatbot")) {
      setActive("chatbot");
    }
    // Default case
    else {
      setActive("");
    }
  }, [location]);

  const handleClick = (item, to) => {
    setActive(item);
    navigate(to);
  };

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/login");
  };

  return (
    <div className={`sidebar`}>
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <img src={cradleLogo} alt="Cradle of Learners Logo" />
          <span className="logo-text">CRADLE OF LEARNERS INC.</span>
        </div>

      </div>

      <div className="sidebar-user-container">
        <div className="sidebar-user-info">
          <img
            src={avatarSrc}
            onError={e => { e.currentTarget.src = avatarFallback; }}
            alt="User Avatar"
            className="sidebar-avatar"
            key={imageRefreshKey}
          />
          <div className="sidebar-user-details">
            <p className="sidebar-user-name">{fullName || "Teacher"}</p>
            <p className="sidebar-user-role">{position || "Educator"}</p>
          </div>
        </div>
      </div>

      <hr className="sidebar-divider" />

      <div className="sidebar-menu-container">
        <ul className="sidebar-menu">
          <li className={active === "dashboard" ? "active" : ""} onClick={() => handleClick("dashboard", "/teacher/dashboard")}>
            <img src={dashboardIcon} alt="Dashboard" /><span>Dashboard</span>
          </li>
          <li className={active === "view-student" ? "active" : ""} onClick={() => handleClick("view-student", "/teacher/view-student")}>
            <img src={viewStudentIcon} alt="View Student" /><span>Student Details and Progress Report</span>
          </li>
          <li
            className={active === "manage-categories" ? "active" : ""}
            onClick={() => handleClick("manage-categories", "/teacher/manage-categories")}
          >
            <img src={manageActivityIcon} alt="Manage Categories" />
            <span>Assessment Management</span>
          </li>
          <li className={active === "manage-progress" ? "active" : ""} onClick={() => handleClick("manage-progress", "/teacher/manage-progress")}>
            <img src={manageProgressIcon} alt="Manage Progress" /><span>Student Progress</span>
          </li>
          <li className={active === "chatbot" ? "active" : ""} onClick={() => handleClick("chatbot", "/teacher/chatbot")}>
            <img src={chatbotIcon} alt="Chatbot Assistant" /><span>Chatbot</span>
          </li>
          <li className={active === "profile" ? "active" : ""} onClick={() => handleClick("profile", "/teacher/profile")}>
            <img src={teacherProfileIcon} alt="Teacher Profile" /><span>Teacher Profile</span>
          </li>
        </ul>
      </div>

      <div className="sidebar-footer-container">
        <hr className="sidebar-divider logout-divider" />

        <div className="sidebar-logout" onClick={handleLogoutClick}>
          <img src={logoutIcon} alt="Logout" /><span>Logout</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;