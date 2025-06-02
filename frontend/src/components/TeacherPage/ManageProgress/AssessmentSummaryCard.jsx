import React from 'react';
import { 
  FaChartLine, 
  FaStar, 
  FaCalendarAlt
} from 'react-icons/fa';
import '../ManageProgress/css/AssessmentSummaryCard.css'; 

const AssessmentSummaryCard = ({ assessmentData }) => {
  if (!assessmentData) return null;

  // Check if student has been assessed
  const isAssessed = assessmentData.readingLevel && assessmentData.readingLevel !== 'Not Assessed';
  
  // Get reading level class based on the level
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'unique-reading-level-not-assessed';
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'unique-reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'unique-reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'unique-reading-level-fluent';
      
      case 'advanced':
        return 'unique-reading-level-advanced';
      
      default:
        return 'unique-reading-level-not-assessed';
    }
  };
  
  // Calculate score from available data sources
  // First check if this is category_results data
  let readingPercentage;
  let assessmentType = 'post-Assessment';
  
  if (assessmentData.categories && assessmentData.categories.length > 0) {
    // This is category_results format
    assessmentType = assessmentData.assessmentType === 'main-assessment' && assessmentData.isPreAssessment !== true 
      ? 'Post-Assessment' 
      : 'Post-Assessment';
    
    // Calculate overall percentage from categories if available
    if (assessmentData.overallScore !== undefined) {
      readingPercentage = assessmentData.overallScore;
    } else if (assessmentData.readingPercentage !== undefined) {
      readingPercentage = assessmentData.readingPercentage;
    } else {
      // Calculate average from categories
      const totalScore = assessmentData.categories.reduce((sum, cat) => sum + (cat.score || 0), 0);
      readingPercentage = Math.round(totalScore / assessmentData.categories.length);
    }
  } else if (assessmentData.scores && assessmentData.scores.overall !== undefined) {
    // This is pre-assessment data format
    readingPercentage = parseFloat(assessmentData.scores.overall);
  } else if (assessmentData.readingPercentage !== undefined) {
    readingPercentage = assessmentData.readingPercentage;
  } else if (assessmentData.overallScore !== undefined) {
    readingPercentage = assessmentData.overallScore;
  } else {
    readingPercentage = isAssessed ? 75 : 0; // Default only as last resort
  }
  
  // Round the percentage for display
  const score = Math.round(readingPercentage);
  
  // Get score class based on score
  const getScoreClass = (score) => {
    if (!isAssessed) return 'unique-score-not-assessed';
    
    if (score >= 85) return 'unique-score-excellent';
    if (score >= 70) return 'unique-score-good';
    if (score >= 50) return 'unique-score-average';
    return 'unique-score-needs-improvement';
  };
  
  // Format date nicely
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      // Try to parse the date
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      // Format as May 7, 2025
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  // Get the assessment date - check multiple possible properties
  const assessmentDate = assessmentData.assessmentDate || assessmentData.lastAssessmentDate;
  
  // Get level class
  const currentLevelClass = getReadingLevelClass(assessmentData.readingLevel);
  const scoreClass = getScoreClass(score);
  
  return (
    <div className={`unique-literexia-assessment-card ${currentLevelClass}`}>
      <div className="unique-literexia-assessment-header">
        <h3 className="unique-literexia-assessment-title">
          <FaChartLine className="unique-literexia-header-icon" />
          (CRLA Based) {assessmentType && `- ${assessmentType}`}
        </h3>
        <div className={`unique-literexia-score-badge ${scoreClass}`}>
          {score}%
        </div>
      </div>
      
      <div className="unique-literexia-assessment-content">
        <div className="unique-literexia-assessment-item">
          <div className={`unique-literexia-item-icon ${currentLevelClass}`}>
            <FaStar />
          </div>
          <div className="unique-literexia-item-content">
            <div className="unique-literexia-item-label">
              Current Reading Level
            </div>
            <div className={`unique-literexia-item-value ${currentLevelClass}`}>
              {assessmentData.readingLevel || "Not Assessed"}
            </div>
          </div>
        </div>
        
        <div className="unique-literexia-assessment-item">
          <div className="unique-literexia-item-icon unique-calendar-icon">
            <FaCalendarAlt />
          </div>
          <div className="unique-literexia-item-content">
            <div className="unique-literexia-item-label">
              Assessment Date
            </div>
            <div className="unique-literexia-item-value unique-date-value">
              {formatDate(assessmentDate)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;