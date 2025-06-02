// src/components/Layout/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from './NavigationBar/NavigationBar';
import './AdminLayout.css';

const AdminLayout = ({ onLogout }) => {
  return (
    <div className="admin-layout">
      <NavigationBar onLogout={onLogout} />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;