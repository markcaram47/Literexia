// src/components/TeacherDashboard/StudentProgress/ProgressReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaInfoCircle, 
  FaBookOpen, 
  FaChartLine, 
  FaCheckCircle, 
  FaBrain,
  FaCalendarAlt,
  FaFilter,
  FaArrowRight,
  FaBook,
  FaListAlt,
  FaQuestionCircle,
  FaCheck,
  FaLightbulb,
  FaPercentage,
  FaTag,
  FaHistory,
  FaExclamationTriangle,
  FaVolumeUp,
  FaFileAlt,
  FaTools,
  FaGraduationCap
} from 'react-icons/fa';

import './css/ProgressReport.css';

const ProgressReport = ({ progressData, onViewRecommendations }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [animated, setAnimated] = useState(false);
  const animatedRef = useRef(false);
  
  useEffect(() => {
    if (animatedRef.current) return;
    
    const timer = setTimeout(() => {
      setAnimated(true);
      animatedRef.current = true;
      
      // Animate counters on page load
      const counters = document.querySelectorAll('.student-progress-counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || 0, 10);
        const duration = 1500; // milliseconds
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const currentValue = Math.ceil(progress * target);
            counter.textContent = currentValue;
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        }
        
        requestAnimationFrame(updateCounter);
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if we have valid category results data
  const hasCategoryResults = progressData && 
    progressData.categories && 
    Array.isArray(progressData.categories) && 
    progressData.categories.length > 0;
  
  if (!progressData) {
    return (
      <div className="student-progress-empty-state">
        <FaInfoCircle size={48} />
        <h3>No Progress Data</h3>
        <p>No progress data available for this student. They may not have completed any assessment yet.</p>
      </div>
    );
  }
  
  // Calculate progress metrics from category results
  const calculateCompletionRate = () => {
    if (!hasCategoryResults) return 0;
    
    // Count passed categories
    const passedCategories = progressData.categories.filter(cat => cat.isPassed).length;
    return Math.round((passedCategories / progressData.categories.length) * 100);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate completion rate and other metrics
  const completionRate = calculateCompletionRate();
  const totalQuestions = hasCategoryResults ? 
    progressData.categories.reduce((total, category) => total + (Number(category.totalQuestions) || 0), 0) : 0;
  const correctAnswers = hasCategoryResults ? 
    progressData.categories.reduce((total, category) => total + (Number(category.correctAnswers) || 0), 0) : 0;
  const passedCategories = hasCategoryResults ? 
    progressData.categories.filter(cat => cat.isPassed).length : 0;
  const totalCategories = hasCategoryResults ? 
    progressData.categories.length : 0;
  const assessmentDate = formatDate(progressData.assessmentDate || progressData.createdAt);
  const readingLevel = progressData.readingLevel || "Not Assessed";
  
  // Calculate overall score - either use the one from the API or calculate
  const overallScore = progressData.overallScore || (hasCategoryResults ? 
    Math.round(progressData.categories.reduce((total, category) => total + (Number(category.score) || 0), 0) / totalCategories) : 0);

  // Determine if any categories need attention (below 75% threshold)
  const categoriesNeedingAttention = hasCategoryResults ? 
    progressData.categories.filter(cat => (Number(cat.score) || 0) < 75) : [];
  
  // Get status class based on score
  const getStatusClass = (score) => {
    score = Number(score) || 0;
    if (score >= 75) return 'achieved';
    if (score >= 50) return 'developing';
    return 'emerging';
  };

  // Handle view recommendations click
  const handleViewRecommendations = (category) => {
    if (onViewRecommendations) {
      onViewRecommendations(category);
    }
  };
  
  // Format category name for display
  const formatCategoryName = (categoryName) => {
    if (!categoryName) return "Unknown Category";
    
    return categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get category icon based on category name
  const getCategoryIcon = (category) => {
    // Icon mapping with uniform color
    const iconMap = {
      'alphabet_knowledge': <FaQuestionCircle />,
      'phonological_awareness': <FaVolumeUp />,
      'decoding': <FaBook />,
      'word_recognition': <FaListAlt />,
      'reading_comprehension': <FaFileAlt />
    };
    
    // Try to match category name (case insensitive)
    const categoryLower = category ? category.toLowerCase() : '';
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryLower.includes(key.toLowerCase().replace('_', ' '))) {
        return icon;
      }
    }
    
    // Default icon
    return <FaBookOpen />;
  };
  
  // Get reading level class for styling
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'reading-level-not-assessed';
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'reading-level-fluent';
      
      case 'advanced':
        return 'reading-level-advanced';
      
      default:
        return 'reading-level-not-assessed';
    }
  };
  
  return (
    <div className="student-progress-container">
      {/* Progress info section */}
      <div className="student-progress-info">
        <FaInfoCircle className="student-progress-info-icon" />
        <div className="student-progress-info-text">
          <h3>Post Assessment Progress Report</h3>
          <p>
            This report shows the student's progress based on their assessment
            completed on <strong>{assessmentDate}</strong>. Current reading level: <strong>{readingLevel}</strong>.
            You can view their performance across the key reading skill categories.
          </p>
        </div>
      </div>
      
      {/* Assessment Summary Cards */}
      <div className="student-progress-summary-cards">
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaCheckCircle />
            </div>
            <div className="student-progress-card-value">
              <span className="student-progress-counter" data-target={completionRate}>{animated ? completionRate : '0'}</span>%
            </div>
          </div>
          <div className="student-progress-card-label">Categories Passed ({passedCategories}/{totalCategories})</div>
        </div>
        
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.1s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaChartLine />
            </div>
            <div className="student-progress-card-value">
              <span className="student-progress-counter" data-target={overallScore}>{animated ? overallScore : '0'}</span>%
            </div>
          </div>
          <div className="student-progress-card-label">Average Score</div>
        </div>
        
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.2s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaBookOpen />
            </div>
            <div className="student-progress-card-value">
              <span className="student-progress-counter" data-target={correctAnswers}>{animated ? correctAnswers : '0'}</span>/{totalQuestions}
            </div>
          </div>
          <div className="student-progress-card-label">Correct Answers</div>
        </div>
        
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.3s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaCalendarAlt />
            </div>
            <div className="student-progress-card-value">
              <div className={`student-progress-reading-level ${getReadingLevelClass(readingLevel)}`}>
                {readingLevel}
              </div>
            </div>
          </div>
          <div className="student-progress-card-label">Reading Level</div>
        </div>
      </div>

      {/* Combined Category Progress & Performance Section */}
      {hasCategoryResults && (
        <div className="student-progress-category-section">
          <h3 className="student-progress-section-title">
            <FaChartLine className="student-progress-section-icon" /> 
            Reading Skills Assessment
          </h3>
          
          <div className="student-progress-info" style={{ marginBottom: '1.5rem' }}>
            <FaInfoCircle className="student-progress-info-icon" />
            <div className="student-progress-info-text">
              <h3>Category Performance</h3>
              <p>
                Each category contains sets of questions. Students need to score at least 75% to pass each category.
                Categories below the threshold need targeted interventions to improve skills.
              </p>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="student-progress-completion-bar">
            <div className="student-progress-completion-bar-label">
              <span>Overall Progress:</span>
              <span className="student-progress-completion-count">{correctAnswers}/{totalQuestions} questions correct ({Math.round((correctAnswers / totalQuestions) * 100)}%)</span>
            </div>
            <div className="student-progress-completion-bar-container">
              <div 
                className="student-progress-completion-bar-fill" 
                style={{width: `${Math.min(100, Math.round((correctAnswers / totalQuestions) * 100))}%`}}
              ></div>
            </div>
          </div>
          
          {/* Category Cards Grid */}
          <div className="student-progress-category-grid">
            {progressData.categories.map((category, index) => {
              const categoryName = category.categoryName || `Category ${index + 1}`;
              const displayName = typeof categoryName === 'string' ?
                formatCategoryName(categoryName) : 
                `Category ${index + 1}`;
              
              const correctCount = Number(category.correctAnswers) || 0;
              const totalCount = Number(category.totalQuestions) || 0;
              const score = Number(category.score) || 0;
              const isPassed = category.isPassed || score >= 75;
              
              // Check if this category has interventions
              const hasInterventions = category.interventions && category.interventions.length > 0;
              
              // Track intervention progress
              const interventionProgress = category.interventionProgress || 0;
              const showInterventionProgress = hasInterventions && interventionProgress > 0;
              
              // Simplified status with intervention tracking
              let status, statusClass;
              if (score >= 75) {
                status = "Passed";
                statusClass = "passed";
              } else if (hasInterventions && interventionProgress >= 100) {
                status = "Intervention Complete";
                statusClass = "intervention-complete";
              } else if (hasInterventions && interventionProgress > 0) {
                status = "Intervention In Progress";
                statusClass = "intervention-progress";
              } else if (score === 0) {
                status = "Not Started";
                statusClass = "not-started";
              } else if (score < 40) {
                status = "Needs Attention";
                statusClass = "needs-attention";
              } else {
                status = "Needs Attention";
                statusClass = "in-progress";
              }
              
              return (
                <div key={index} className={`student-progress-category-card ${statusClass}`}>
                  {/* Category Header */}
                  <div className="student-progress-category-header">
                    <div className="student-progress-category-icon">
                      {getCategoryIcon(categoryName)}
                    </div>
                    <div className="student-progress-category-info">
                      <h4>{displayName}</h4>
                      <div className="student-progress-category-metrics">
                        <span className="student-progress-score">{score}%</span>
                        <span className="student-progress-count">{correctCount}/{totalCount} correct</span>
                      </div>
                    </div>
                    <div className={`student-progress-status ${statusClass}`}>
                      {status}
                    </div>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="student-progress-dots">
                    {Array.from({ length: totalCount }).map((_, qIndex) => (
                      <div 
                        key={qIndex} 
                        className={`student-progress-dot ${qIndex < correctCount ? 'correct' : 'empty'}`}
                        title={qIndex < correctCount ? 'Correct' : 'Incorrect/Not Answered'}
                      />
                    ))}
                  </div>
                  
                  {/* Intervention Progress (if applicable) */}
                  {showInterventionProgress && (
                    <div className="student-progress-intervention-status">
                      <div className="student-progress-intervention-icon">
                        <FaTools />
                      </div>
                      <div className="student-progress-intervention-progress">
                        <div className="student-progress-intervention-label">
                          Intervention Progress: {interventionProgress}%
                        </div>
                        <div className="student-progress-intervention-bar">
                          <div 
                            className="student-progress-intervention-fill"
                            style={{ width: `${interventionProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Section */}
                  <div className="student-progress-category-action">
                    {!isPassed ? (
                      <>
                        <div className="student-progress-message">
                          {correctCount === 0 ? (
                            <span>Category not yet started</span>
                          ) : hasInterventions ? (
                            <span>Intervention assigned {interventionProgress > 0 ? `(${interventionProgress}% complete)` : ''}</span>
                          ) : (
                            <span>Need {Math.ceil(totalCount * 0.75) - correctCount} more to pass</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="student-progress-success-message">
                        <FaCheckCircle /> Category Mastered
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Unified View Recommendations Button */}
          {categoriesNeedingAttention.length > 0 && (
            <div className="student-progress-unified-action">
              <button 
                className="student-progress-unified-recommendations-btn"
                onClick={() => handleViewRecommendations(categoriesNeedingAttention[0])}
              >
                <FaGraduationCap /> View Recommendations for All Categories
                <FaArrowRight style={{ marginLeft: '0.5rem' }} />
              </button>
              <div className="student-progress-unified-info">
                {categoriesNeedingAttention.length} {categoriesNeedingAttention.length === 1 ? 'category' : 'categories'} need attention
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Display warning if some categories need attention */}
      {categoriesNeedingAttention.length > 0 && (
        <div className="student-progress-categories-attention">
          <div className="student-progress-attention-icon">
            <FaExclamationTriangle />
          </div>
          <div className="student-progress-attention-message">
            <h4>Categories Needing Attention</h4>
            <p>
              {categoriesNeedingAttention.length} {categoriesNeedingAttention.length === 1 ? 'category is' : 'categories are'} below the 75% threshold. 
              View recommendations to create targeted interventions.
            </p>
          </div>
        </div>
      )}

      {/* Process Note */}
      <div className="student-progress-process-note">
        <FaLightbulb className="student-progress-process-note-icon" />
        <div className="student-progress-process-note-text">
          <p>
            <strong>Next Steps:</strong> Based on these results, you can create personalized intervention plans in the Prescriptive Analysis tab to address specific areas where the student needs additional support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressReport;