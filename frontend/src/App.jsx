// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login';
import ManageCategories from './pages/Teachers/ManageCategories/ManageCategories';
import AuthService from './services/authService';

// Public Pages
import Homepage from "./pages/Homepage";
import ChooseAccountType from "./pages/ChooseAccountType";
import TeacherDashboard from "./pages/Teachers/TeacherDashboard";
import ViewStudent from "./pages/Teachers/StudentDetails/ViewStudent";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import StudentDetails from "./pages/Teachers/StudentDetails/StudentDetails";
import ManageProgress from "./pages/Teachers/ManageProgress/ManageProgress";
import StudentProgressView from "./pages/Teachers/ManageProgress/StudentProgressView";
import TeacherChatbot from "./pages/Teachers/Chatbot/TeacherChatbot"; 
import StudentProgressPDF from './pages/Teachers/StudentProgressPDF';

// Parent Pages
import ParentDashboard from "./pages/Parents/ParentDashboard";
import Feedback from "./pages/Parents/Feedback";  

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import SubmissionsOverview from './pages/Admin/SubmissionsOverview';
import StudentListPage from './pages/Admin/StudentListPage';
import TeacherListPage from './pages/Admin/TeacherLists';
import ParentListPage from './pages/Admin/ParentsPage';
import AssessmentResultsOverview from './pages/Admin/AssessmentResultsOverview';
import StudentAssessmentResults from './pages/Admin/StudentAssessmentResults';
import StudentAssessmentsList from './pages/Admin/StudentAssessmentsList';

// Layouts
import TeacherLayout from "./components/TeacherPage/TeacherLayout";
import ParentLayout from "./components/ParentPage/ParentLayout";
import AdminLayout from "./components/Admin/AdminLayout";

import "./App.css";

// Helper function to determine user type from roles
const getUserTypeFromRoles = (roles) => {
  // Default to teacher if no role is found
  let userType = "teacher";
  
  // Handle different formats of roles data
  if (!roles) {
    return userType;
  }
  
  // Handle array of roles
  if (Array.isArray(roles)) {
    if (roles.includes('admin')) {
      userType = "admin";
    } else if (roles.includes('parent') || roles.includes('magulang')) {
      userType = "parent";
    } else if (roles.includes('teacher') || roles.includes('guro')) {
      userType = "teacher";
    } 
    return userType;
  }
  
  // Handle string role
  if (typeof roles === 'string') {
    if (roles === 'admin') {
      return "admin";
    } else if (roles === 'parent' || roles === 'magulang') {
      return "parent";
    } else if (roles === 'teacher' || roles === 'guro') {
      return "teacher";
    }
  }
  
  return userType;
};

// Use a component that doesn't cause re-renders for protected routes
const ProtectedRoute = ({ children }) => {
  // Use a straightforward check without causing re-renders
  const isLoggedIn = AuthService.isLoggedIn();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  // Simplified state management
  const [isAuthenticated, setIsAuthenticated] = useState(
    AuthService.isLoggedIn()
  );
  
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "teacher"
  );

  // Handle auth changes
  useEffect(() => {
    // Check auth status once on mount
    const checkAuthStatus = () => {
      const isLoggedIn = AuthService.isLoggedIn();
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn) {
        try {
          const userData = AuthService.getCurrentUser()?.user;
          if (userData && userData.roles) {
            const detectedType = getUserTypeFromRoles(userData.roles);
            if (detectedType !== userType) {
              setUserType(detectedType);
            }
          }
        } catch (e) {
          console.error("Error processing user data:", e);
        }
      }
    };
    
    // Check auth status initially
    checkAuthStatus();
    
    // Set up event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'token' || e.key === 'user') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);  // Empty dependency array - only run on mount

  // Memoize these functions to prevent unnecessary re-renders
  const handleLogout = useCallback(() => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserType("teacher");
  }, []);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
    const currentUserType = localStorage.getItem("userType") || "teacher";
    setUserType(currentUserType);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={`/${userType}/dashboard`} replace />
            ) : (
              <Homepage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={`/${userType}/dashboard`} replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route path="/choose-account" element={<ChooseAccountType />} />

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute>
              <TeacherLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="view-student" element={<ViewStudent />} />
          <Route path="manage-categories" element={<ManageCategories />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="manage-progress" element={<ManageProgress />} />
          <Route path="student-progress/:id" element={<StudentProgressView />} />
          <Route path="student-details/:id" element={<StudentDetails />} />
          <Route path="chatbot" element={<TeacherChatbot />} />
          <Route path="student-report" element={<StudentProgressPDF />} />
          
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Parent Routes */}
        <Route
          path="/parent/*"
          element={
            <ProtectedRoute>
              <ParentLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="feedback" element={<Feedback />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="submissions-overview" element={<SubmissionsOverview />} />
          <Route path="student-list" element={<StudentListPage />} />
          <Route path="teacher-list" element={<TeacherListPage />} />
          <Route path="parent-list" element={<ParentListPage />} />
          <Route path="assessment-results-overview" element={<AssessmentResultsOverview />} />
          <Route path="assessment-results/:id" element={<StudentAssessmentResults />} />
          <Route path="student-assessments" element={<StudentAssessmentsList />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;