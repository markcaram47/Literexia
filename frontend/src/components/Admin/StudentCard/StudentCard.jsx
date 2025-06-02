// src/components/Admin/StudentCard/StudentCard.jsx
import React from 'react';
import './StudentCard.css';

const StudentCard = ({ student }) => {
  const {
    name,
    avatar,
    grade,
    progress,
    learningChallenges = [],
    learningStrengths = [],
    recentActivity = {},
    prescriptiveAnalysis = "",
    recommendedActivities = []
  } = student || {};

  // Generate avatar background color based on name
  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#7A6FF0', '#F25F5C'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get the first letter of first and last name for avatar
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="student-card">
      <div className="student-header">
        <div 
          className="student-avatar" 
          style={{ 
            backgroundColor: avatar ? 'transparent' : getAvatarColor(name || '') 
          }}
        >
          {avatar ? (
            <img src={avatar} alt={name} />
          ) : (
            <span>{getInitials(name || '')}</span>
          )}
        </div>
        <div className="student-info">
          <h3 className="student-name">{name}</h3>
          <div className="student-grade-progress">
            <span className="student-grade">Grade {grade}</span>
            <span className="student-progress">Progress: {progress}%</span>
          </div>
        </div>
      </div>
      
      <div className="student-analytics">
        <div className="analytics-section">
          <h4>Learning Challenges</h4>
          <div className="tag-container">
            {learningChallenges.map((challenge, index) => (
              <span key={index} className={`tag challenge ${challenge.toLowerCase().replace(/\s+/g, '-')}`}>
                {challenge}
              </span>
            ))}
          </div>
        </div>
        
        <div className="analytics-section">
          <h4>Learning Strengths</h4>
          <div className="tag-container">
            {learningStrengths.map((strength, index) => (
              <span key={index} className={`tag strength ${strength.toLowerCase().replace(/\s+/g, '-')}`}>
                {strength}
              </span>
            ))}
          </div>
        </div>
        
        <div className="analytics-section">
          <h4>Recent Activity</h4>
          <p className="recent-activity">
            {recentActivity.description || "No recent activity"}
          </p>
        </div>
        
        <div className="analytics-section">
          <h4>Prescriptive Analysis</h4>
          <p className="prescriptive-analysis">{prescriptiveAnalysis || "No analysis available"}</p>
        </div>
        
        {recommendedActivities && recommendedActivities.length > 0 && (
          <div className="analytics-section">
            <h4>Recommended Activities</h4>
            <ul className="recommended-activities">
              {recommendedActivities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCard;