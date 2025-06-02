import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import ParentSidebar from "./ParentSidebar";
import "./ParentLayout.css";

const ParentLayout = ({ onLogout }) => {
  const location = useLocation();  // Track the current location to force re-render

  return (
    <div className="parent-layout-container">
      <ParentSidebar onLogout={onLogout} />
      <div className="main-content-area">
        <Outlet key={location.pathname} />  {/* This ensures re-rendering when navigating to the same route */}
      </div>
    </div>
  );
};

export default ParentLayout;