import React, { useState } from 'react';
import { 
  FaInfoCircle, FaChartBar, FaExpandArrowsAlt, FaCompressArrowsAlt,
  FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaCalendarAlt,
  FaClipboardList, FaQuestionCircle, FaLightbulb, FaFileAlt, FaImage,
  FaVolumeUp, FaBook
} from 'react-icons/fa';

import './css/PreAssessmentResults.css';
const PreAssessmentResults = ({ assessmentData }) => {
  const [expandedSkills, setExpandedSkills] = useState({});

  if (!assessmentData) {
    return (
      <div className="pre-assessment-results__empty-state">
        <FaInfoCircle size={48} />
        <h3>No Pre-Assessment Data Available</h3>
        <p>This student has not completed the pre-assessment yet.</p>
      </div>
    );
  }

  if (!assessmentData.hasCompleted) {
    return (
      <div className="pre-assessment-results__empty-state">
        <FaInfoCircle size={48} />
        <h3>Pre-Assessment Not Completed</h3>
        <p>{assessmentData.message || 'This student has not completed the pre-assessment yet.'}</p>
      </div>
    );
  }

  // Check if skillDetails is missing
  if (!assessmentData.skillDetails || assessmentData.skillDetails.length === 0) {
    return (
      <div className="pre-assessment-results__empty-state">
        <FaInfoCircle size={48} />
        <h3>Incomplete Pre-Assessment Data</h3>
        <p>The pre-assessment data is missing skill details. Please contact support if this issue persists.</p>
      </div>
    );
  }

  const toggleSkillExpansion = (categoryKey) => {
    setExpandedSkills(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const getScoreColor = (score) => {
    // Use the same blue color for all scores
    return '#4a5494';
  };
  
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'Not recorded';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getCategoryIcon = (category) => {
    // Icon mapping with uniform color
    const iconMap = {
      'alphabet_knowledge': <FaQuestionCircle />,
      'phonological_awareness': <FaVolumeUp />,
      'decoding': <FaBook />,
      'word_recognition': <FaClipboardList />,
      'reading_comprehension': <FaFileAlt />
    };
    
    // Return the icon with the uniform color style
    return (
      <span style={{ color: '#4a5494', fontSize: '1.25rem' }}>
        {iconMap[category] || <FaQuestionCircle />}
      </span>
    );
  };

  const getCategoryColorClass = (category) => {
    // Using the same class for all skill bars to maintain color consistency
    return 'skill-bar--blue';
  };

  return (
    <div className="pre-assessment-results">
      {/* Info Banner */}
      <div className="pre-assessment-results__info-banner">
        <FaInfoCircle className="pre-assessment-results__info-icon" />
        <div className="pre-assessment-results__info-content">
          <h3>Pre-Assessment Results (CRLA Standards)</h3>
          <p>
            This assessment evaluates <strong>Filipino reading skills</strong> based on DepEd's 
            Comprehensive Reading and Literacy Assessment (CRLA) standards. The results show 
            the student's performance across five key reading skill categories and determine 
            their current reading level.
          </p>
        </div>
      </div>

      {/* Overview Section */}
      <div className="pre-assessment-results__overview">
        <div className="pre-assessment-results__overview-header">
          <h3>
            <FaChartBar className="pre-assessment-results__overview-icon" />
            Assessment Overview
          </h3>
          <div className={`pre-assessment-results__score-badge ${getReadingLevelClass(assessmentData.readingLevel)}`}>
            {assessmentData.readingLevel}
          </div>
        </div>

        {/* Single row grid for overview items */}
        <div className="pre-assessment-results__overview-grid">
          <div className="pre-assessment-results__overview-item">
            <div className="pre-assessment-results__overview-item-icon">
              <FaChartBar />
            </div>
            <div className="pre-assessment-results__overview-item-content">
              <div className="pre-assessment-results__overview-item-label">Overall Score</div>
              <div className="pre-assessment-results__overview-item-value">
                {assessmentData.correctAnswers}/{assessmentData.totalQuestions} ({assessmentData.overallScore}%)
              </div>
            </div>
          </div>

          <div className="pre-assessment-results__overview-item">
            <div className="pre-assessment-results__overview-item-icon">
              <FaCalendarAlt />
            </div>
            <div className="pre-assessment-results__overview-item-content">
              <div className="pre-assessment-results__overview-item-label">Completed On</div>
              <div className="pre-assessment-results__overview-item-value">
                {formatDate(assessmentData.completedAt)}
              </div>
            </div>
          </div>

          <div className="pre-assessment-results__overview-item">
            <div className="pre-assessment-results__overview-item-icon">
              <FaClock />
            </div>
            <div className="pre-assessment-results__overview-item-content">
              <div className="pre-assessment-results__overview-item-label">Time Taken</div>
              <div className="pre-assessment-results__overview-item-value">
                {formatTime(assessmentData.timeTaken)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Results Section */}
      <div className="pre-assessment-results__skills-section">
        <h3 className="pre-assessment-results__section-title">
          <FaChartBar className="pre-assessment-results__section-icon" />
          Reading Skills Performance
        </h3>

        <div className="pre-assessment-results__skill-list">
          {assessmentData.skillDetails && assessmentData.skillDetails.map((skill, index) => (
            <div key={skill.category} className="pre-assessment-results__skill-item">
              <div className="pre-assessment-results__skill-header">
                <div className="pre-assessment-results__skill-title">
                  <div className="pre-assessment-results__skill-name-container">
                    {getCategoryIcon(skill.category)}
                    <span className="pre-assessment-results__skill-name">{skill.categoryName}</span>
                  </div>
                  <span 
                    className="pre-assessment-results__skill-score"
                    style={{ color: getScoreColor(skill.score) }}
                  >
                    {skill.correct}/{skill.total} ({skill.score}%)
                  </span>
                </div>
                <button
                  className="pre-assessment-results__expand-btn"
                  onClick={() => toggleSkillExpansion(skill.category)}
                  aria-label={expandedSkills[skill.category] ? 'Collapse' : 'Expand'}
                >
                  {expandedSkills[skill.category] ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />}
                </button>
              </div>

              <div className="pre-assessment-results__skill-bar-wrapper">
                <div 
                  className={`pre-assessment-results__skill-bar ${getCategoryColorClass(skill.category)}`}
                  style={{ 
                    width: `${Math.round((skill.correct / skill.total) * 100)}%`
                  }}
                />
              </div>

              {expandedSkills[skill.category] && (
                <div className="pre-assessment-results__skill-details">
                  <h4>
                    <FaClipboardList />
                    Question Details
                  </h4>
                  <div className="pre-assessment-results__sample-questions">
                    {skill.questions && skill.questions.map((question, qIndex) => (
                      <div key={question.questionId} className="pre-assessment-results__question-item">
                        <div className="pre-assessment-results__question-header">
                          <span className="pre-assessment-results__question-number">
                            Question {question.questionNumber}
                          </span>
                          <span className={`pre-assessment-results__question-status ${
                            question.isCorrect ? 'correct' : 'incorrect'
                          }`}>
                            {question.isCorrect ? (
                              <>
                                <FaCheckCircle /> Correct
                              </>
                            ) : (
                              <>
                                <FaTimesCircle /> Incorrect
                              </>
                            )}
                          </span>
                        </div>

                        <div className="pre-assessment-results__question-content">
                          <div className="pre-assessment-results__question-text">
                            <strong>Question:</strong> {question.questionText}
                          </div>

                          {question.questionImage && (
                            <div className="pre-assessment-results__question-media">
                              <FaImage /> Image provided
                            </div>
                          )}

                          {question.hasAudio && (
                            <div className="pre-assessment-results__question-media">
                              <FaVolumeUp /> Audio provided
                            </div>
                          )}

                          {question.displayedText && (
                            <div className="pre-assessment-results__displayed-text">
                              <strong>Displayed Text:</strong> {question.displayedText}
                            </div>
                          )}

                          {question.questionValue && (
                            <div className="pre-assessment-results__question-value">
                              <strong>Focus:</strong> {question.questionValue}
                            </div>
                          )}

                          {/* Special handling for reading comprehension */}
                          {question.hasPassage && (
                            <div className="pre-assessment-results__reading-comprehension">
                              {/* Main instruction */}
                              <div className="pre-assessment-results__main-instruction">
                                <strong>Instruction:</strong> {question.mainInstruction}
                              </div>
                              
                              {/* The actual story/passage */}
                              <div className="pre-assessment-results__story-section">
                                <div className="pre-assessment-results__story-header">
                                  <FaBook /> Story:
                                </div>
                                {question.passages && question.passages.length > 0 ? (
                                  <div className="pre-assessment-results__story-content">
                                    {question.passages.map((page, pageIndex) => (
                                      <div key={pageIndex} className="pre-assessment-results__story-page">
                                        {question.passages.length > 1 && (
                                          <div className="pre-assessment-results__page-number">
                                            Page {page.pageNumber}:
                                          </div>
                                        )}
                                        <p className="pre-assessment-results__story-text">
                                          {page.pageText}
                                        </p>
                                        {page.pageImage && (
                                          <div className="pre-assessment-results__story-image">
                                            <FaImage /> Story illustration provided
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="pre-assessment-results__story-text">
                                    {question.passageText}
                                  </p>
                                )}
                              </div>
                              
                              {/* The actual comprehension question */}
                              <div className="pre-assessment-results__actual-question">
                                <div className="pre-assessment-results__question-header">
                                  <FaQuestionCircle /> Question about the story:
                                </div>
                                <div className="pre-assessment-results__question-text">
                                  {question.actualQuestion}
                                </div>
                                {question.questionImage && (
                                  <div className="pre-assessment-results__question-media">
                                    <FaImage /> Question image provided
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pre-assessment-results__question-answers">
                            <div className="pre-assessment-results__answer-row">
                              <span className="pre-assessment-results__answer-label">Student Answer:</span>
                              <span className={`pre-assessment-results__answer-value ${
                                question.isCorrect ? 'pre-assessment-results__answer--correct' : 'pre-assessment-results__answer--incorrect'
                              }`}>
                                {question.hasPassage ? (
                                  // For reading comprehension, show the actual answer text
                                  question.isCorrect ? question.correctAnswer : question.incorrectAnswer
                                ) : (
                                  // For other questions, show option text
                                  question.studentAnswerText || `Option ${question.studentAnswer}`
                                )}
                                {question.isCorrect ? (
                                  <FaCheckCircle className="pre-assessment-results__icon-correct" />
                                ) : (
                                  <FaTimesCircle className="pre-assessment-results__icon-incorrect" />
                                )}
                              </span>
                            </div>

                            {!question.isCorrect && question.hasPassage && (
                              <div className="pre-assessment-results__answer-row">
                                <span className="pre-assessment-results__answer-label">Correct Answer:</span>
                                <span className="pre-assessment-results__answer-value pre-assessment-results__answer--correct">
                                  {question.correctAnswer}
                                  <FaCheckCircle className="pre-assessment-results__icon-correct" />
                                </span>
                              </div>
                            )}

                            <div className="pre-assessment-results__answer-row">
                              <span className="pre-assessment-results__answer-label">Difficulty:</span>
                              <span className="pre-assessment-results__answer-value">
                                {question.difficultyLevel?.replace('_', ' ') || 'Not specified'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion Section */}
      <div className="pre-assessment-results__conclusion">
        <h3 className="pre-assessment-results__conclusion-title">
          <FaFileAlt />
          Assessment Summary
        </h3>
        <p className="pre-assessment-results__conclusion-text">
          Based on the pre-assessment results, <strong>{assessmentData.studentName}</strong> has been 
          placed at the <strong>{assessmentData.readingLevel}</strong> reading level. 
          {assessmentData.focusAreas && assessmentData.focusAreas.length > 0 && (
            <>
             
            </>
          )}
        </p>
        
        {assessmentData.overallScore >= 90 && (
          <div className="pre-assessment-results__focus-areas">
            <strong>Excellent Performance!</strong> The student demonstrates strong reading skills 
            across all assessed categories and is ready for grade-level instruction.
          </div>
        )}
      </div>

      {/* Process Note */}
      <div className="pre-assessment-results__process-note">
        <FaLightbulb className="pre-assessment-results__process-note-icon" />
        <div className="pre-assessment-results__process-note-text">
          <p>
            <strong>Next Steps:</strong> The student will now proceed to the post-assessment phase 
            to measure progress and determine if additional interventions are needed to support 
            their reading development journey.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreAssessmentResults;