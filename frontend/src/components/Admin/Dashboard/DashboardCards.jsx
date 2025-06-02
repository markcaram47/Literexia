// src/components/Admin/Dashboard/DashboardCards.jsx
import React from 'react';
import '../../../css/Admin/Dashboard/DashboardCards.css';


// Icon components
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const StudentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const DashboardCards = ({ stats }) => {
  // Default values if props are not passed
  const {
    totalUsers = 2456,
    approvedActivities = 103,
    pendingApprovals = 20,
    priorityStudents = 20
  } = stats || {};

  return (
    <div className="dashboard-cards">
      <div className="dashboard-row">
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-label">Total Users</div>
            <div className="card-value">{totalUsers.toLocaleString()}</div>
          </div>
          <div className="card-icon">
            <UsersIcon />
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-label">Total Approved Activities</div>
            <div className="card-value">{approvedActivities.toLocaleString()}</div>
          </div>
          <div className="card-icon approved">
            <CheckmarkIcon />
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-label">Total Pending Approval</div>
            <div className="card-value">{pendingApprovals.toLocaleString()}</div>
          </div>
          <div className="card-icon pending">
            <PendingIcon />
          </div>
        </div>
      </div>
      
      <div className="dashboard-row">
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-label">Total Users</div>
            <div className="card-value">{totalUsers.toLocaleString()}</div>
          </div>
          <div className="card-icon">
            <UsersIcon />
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-label">Total Approved Activities</div>
            <div className="card-value">{approvedActivities.toLocaleString()}</div>
          </div>
          <div className="card-icon approved">
            <CheckmarkIcon />
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-label">High Priority Students</div>
            <div className="card-value">{priorityStudents.toLocaleString()}</div>
          </div>
          <div className="card-icon priority">
            <StudentIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;