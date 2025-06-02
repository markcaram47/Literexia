// src/components/Admin/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Activity, 
  Eye, 
  Users, 
  GraduationCap, 
  School, 
  UserSquare2,
  AlertTriangle,
  Info,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    students: { count: 0, active: 0, avgReadingLevel: 2.5 },
    teachers: { count: 0, activities: 0 },
    parents: { count: 0, communications: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching dashboard data...');
        
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
          throw new Error('No auth token found');
        }

        // Try to get user data to verify admin role
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
          if (!roles.includes('admin')) {
            throw new Error('User is not authorized to view admin dashboard');
          }
        }

        const response = await fetch('http://localhost:5001/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          } else if (response.status === 403) {
            throw new Error('You are not authorized to view this dashboard.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received dashboard data:', data);

        // Process the data to match our dashboard structure
        const processedData = {
          totalUsers: data.users?.total || 0,
          students: {
            count: data.users?.students || 0,
            active: data.users?.activeToday || 0,
            avgReadingLevel: data.academicData?.averageReadingLevel || 2.5
          },
          teachers: {
            count: data.users?.teachers || 0,
            activities: data.activities?.activitiesCreated || 0
          },
          parents: {
            count: data.users?.parents || 0,
            communications: data.activities?.parentCommunications || 0
          }
        };

        setDashboardData(processedData);
        
        // Simulate a slight delay to show loading animation
        setTimeout(() => {
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data');
        
        // If unauthorized, redirect to login
        if (error.message.includes('Session expired') || error.message.includes('not authorized')) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleViewStudents = () => navigate('/admin/student-list');
  const handleViewTeachers = () => navigate('/admin/teacher-list');
  const handleViewParents = () => navigate('/admin/parent-list');
  
  // Format date for display
  const formatDate = (date = new Date()) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const chartData = [
    { name: 'Teachers', value: dashboardData.teachers.count || 0, color: '#FFB347' },
    { name: 'Parents', value: dashboardData.parents.count || 0, color: '#98D8AA' },
    { name: 'Students', value: dashboardData.students.count || 0, color: '#FF6B6B' }
  ];

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="admin-dashboard__loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard admin-dashboard--error">
        <div className="admin-dashboard__error-message">
          <p>Error loading dashboard: {error}</p>
          <button onClick={() => window.location.reload()} className="admin-dashboard__retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall stats for the attention banner
  const activeStudentsPercentage = dashboardData.students.count > 0 
    ? Math.round((dashboardData.students.active / dashboardData.students.count) * 100) 
    : 0;
  
  const showAttentionBanner = activeStudentsPercentage < 30;

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">
          <BarChart3 size={24} />
          Dashboard Overview
        </h1>
        <div className="admin-dashboard__actions">
          <button onClick={() => window.location.reload()} className="admin-dashboard__refresh-btn">
            <Activity size={20} />
            Refresh
          </button>
          <button className="admin-dashboard__notification-btn">
            <Bell size={20} />
          </button>
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="admin-dashboard__info-banner">
        <Info className="admin-dashboard__info-icon" size={28} />
        <div className="admin-dashboard__info-content">
          <h3>Admin Dashboard Overview</h3>
          <p>
            Welcome to the admin dashboard. Here you can view key metrics about users, 
            student performance, and system activities. Last updated: {formatDate()}
          </p>
        </div>
      </div>

      <div className="admin-dashboard__metrics-grid">
        {/* Total Users Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <Users size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Total Users</h3>
            <p className="admin-dashboard-card__value">{dashboardData.totalUsers}</p>
            <p className="admin-dashboard-card__subtitle">{dashboardData.students.active} active today</p>
          </div>
        </div>

        {/* Students Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <GraduationCap size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Students</h3>
            <p className="admin-dashboard-card__value">{dashboardData.students.count}</p>
            <p className="admin-dashboard-card__subtitle">{dashboardData.students.avgReadingLevel.toFixed(1)} avg reading level</p>
            <button className="admin-dashboard-card__view-btn" onClick={handleViewStudents}>
              <Eye size={16} />
              View Students
            </button>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <School size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Teachers</h3>
            <p className="admin-dashboard-card__value">{dashboardData.teachers.count}</p>
            <p className="admin-dashboard-card__subtitle">{dashboardData.teachers.activities} activities created</p>
            <button className="admin-dashboard-card__view-btn" onClick={handleViewTeachers}>
              <Eye size={16} />
              View Teachers
            </button>
          </div>
        </div>

        {/* Parents Card */}
        <div className="admin-dashboard-card">
          <div className="admin-dashboard-card__header">
            <div className="admin-dashboard-card__icon" style={{ background: 'linear-gradient(135deg, #4a5494, #3B4F81)', color: 'white' }}>
              <UserSquare2 size={24} />
            </div>
          </div>
          <div className="admin-dashboard-card__content">
            <h3 className="admin-dashboard-card__title">Parents</h3>
            <p className="admin-dashboard-card__value">{dashboardData.parents.count}</p>
            <p className="admin-dashboard-card__subtitle">{dashboardData.parents.communications} communications</p>
            <button className="admin-dashboard-card__view-btn" onClick={handleViewParents}>
              <Eye size={16} />
              View Parents
            </button>
          </div>
        </div>
      </div>
      
      {/* Show attention banner if needed */}
      {showAttentionBanner && (
        <div className="admin-dashboard__attention-banner">
          <AlertTriangle className="admin-dashboard__attention-icon" size={28} />
          <div className="admin-dashboard__attention-content">
            <h4>Low Student Activity</h4>
            <p>
              Only {activeStudentsPercentage}% of students were active today. 
              Consider sending a notification to teachers and parents to encourage platform usage.
            </p>
          </div>
          <button className="admin-dashboard__action-btn">
            <Bell size={16} />
            Send Notification
          </button>
        </div>
      )}

      <div className="admin-dashboard__analytics-section">
        <h2 className="admin-dashboard__section-title">
          <Activity size={20} />
          User Analytics
        </h2>
        <div className="admin-dashboard__chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={5}
                dataKey="value"
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  value,
                  index
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill={chartData[index].color}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${chartData[index].name} (${value})`}
                    </text>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} Users`, name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                wrapperStyle={{
                  paddingLeft: '24px',
                  fontSize: '14px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;