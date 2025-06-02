// src/pages/Admin/StudentAssessmentResults.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, BarChart2, 
  Book, Award, Layers, CheckCircle, XCircle, AlertTriangle, 
  ChevronDown, ChevronUp, Download, Printer, Share2, Edit
} from 'lucide-react';
import '../../css/Admin/AssessmentResults/StudentAssessmentResults.css';
import axios from 'axios';

const StudentAssessmentResults = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student data by idNumber
        const studentResponse = await axios.get(`http://localhost:5001/api/admin/manage/students/idNumber/${id}`);
        
        if (!studentResponse.data.success) {
          throw new Error('Failed to fetch student data');
        }

        const studentData = studentResponse.data.data;

        // Fetch assessment results by idNumber
        const assessmentResponse = await axios.get(`http://localhost:5001/api/admin/assessment-results/${id}`);
        
        if (!assessmentResponse.data.success) {
          throw new Error('Failed to fetch assessment results');
        }

        const assessmentData = assessmentResponse.data.data;

        // Only use categories if assessmentType is main-assessment
        let mainAssessmentCategories = [];
        if (assessmentData.assessmentType === 'main-assessment') {
          mainAssessmentCategories = assessmentData.categories || [];
        }

        // Combine student and assessment data
        const combinedData = {
          ...studentData,
          ...assessmentData,
          categoryScores: mainAssessmentCategories,
          readingLevel: assessmentData.readingLevel || 'Not Assessed',
          readingPercentage: assessmentData.overallScore || 0,
          totalQuestions: assessmentData.totalQuestions || 0,
          correctAnswers: assessmentData.correctAnswers || 0,
          difficulties: assessmentData.difficulties || [],
          strengths: assessmentData.strengths || [],
          recommendations: assessmentData.recommendations || [],
          allCategoriesPassed: assessmentData.allCategoriesPassed || false,
          completedAt: assessmentData.updatedAt || null
        };
        
        setStudent(combinedData);
      } catch (error) {
        console.error("Error fetching student assessment results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="student-assessment__container">
        <div className="student-assessment__loading">
          <div className="student-assessment__loading-spinner"></div>
          <p>Loading student assessment results...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-assessment__container">
        <div className="student-assessment__error">
          <AlertTriangle size={48} />
          <h3>Student Not Found</h3>
          <p>The student assessment results could not be found.</p>
          <Link to="/admin/assessment-results-overview" className="student-assessment__back-btn">
            <ArrowLeft size={18} />
            Back to Assessment Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="student-assessment__container">
      {/* Header */}
      <div className="student-assessment__header">
        <Link to="/admin/assessment-results-overview" className="student-assessment__back-btn">
          <ArrowLeft size={18} />
          Back to Post Assessment Results
        </Link>
        
        <div className="student-assessment__actions">
          <button className="student-assessment__action-btn">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button className="student-assessment__action-btn">
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button className="student-assessment__action-btn">
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="student-assessment__profile-card">
        <div className="student-assessment__profile-header">
          <div className="student-assessment__profile-avatar">
            {student.profileImageUrl ? (
              <img 
                src={student.profileImageUrl} 
                alt={`${student.firstName} ${student.lastName}`} 
                className="student-assessment__avatar-img"
              />
            ) : (
              <div className="student-assessment__avatar-placeholder">
                {student.firstName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="student-assessment__profile-info">
            <h1>{student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}</h1>
            
            <div className="student-assessment__profile-details">
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">ID Number</span>
                <span className="student-assessment__detail-value">{student.idNumber}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Grade</span>
                <span className="student-assessment__detail-value">{student.gradeLevel}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Section</span>
                <span className="student-assessment__detail-value">{student.section}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Teacher</span>
                <span className="student-assessment__detail-value">{student.teacherName}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Assessment Date</span>
                <span className="student-assessment__detail-value">{formatDate(student.completedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="student-assessment__level-badge-container">
            <div className={`student-assessment__level-badge student-assessment__level--${student.readingLevel.toLowerCase().replace(' ', '-')}`}>
              {student.readingLevel}
            </div>
            <span className="student-assessment__score-badge">Overall Score: {student.readingPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="student-assessment__summary-section">
        <h2 className="student-assessment__section-title">
          <BarChart2 size={20} />
          Post Assessment Summary
        </h2>
        
        <div className="student-assessment__summary-grid">
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Book size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Total Questions</h3>
              <p className="student-assessment__summary-value">{student.totalQuestions}</p>
              <p className="student-assessment__summary-detail">
                Questions across all categories
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <CheckCircle size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Correct Answers</h3>
              <p className="student-assessment__summary-value">{student.correctAnswers}</p>
              <p className="student-assessment__summary-detail">
                {Math.round((student.correctAnswers / student.totalQuestions) * 100)}% accuracy rate
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Award size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Reading Level</h3>
              <p className="student-assessment__summary-value">{student.readingLevel}</p>
              <p className="student-assessment__summary-detail">
                Based on DepEd CRLA post-assessment standards
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Layers size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Categories Passed</h3>
              <p className="student-assessment__summary-value">
                {Object.values(student.categoryScores).filter(category => category.score >= 75).length} / 5
              </p>
              <p className="student-assessment__summary-detail">
                {Object.values(student.categoryScores).filter(category => category.score >= 75).length === 5 ? 
                  'All categories passed!' : 'Some categories need improvement'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="student-assessment__categories-section">
        <h2 className="student-assessment__section-title">
          <Layers size={20} />
          Category Performance
        </h2>
        
        <div className="student-assessment__categories-grid">
          {Array.isArray(student.categoryScores)
            ? student.categoryScores.map((cat, idx) => (
                <div key={cat.categoryName || idx} className="student-assessment__category-card">
                  <div className="student-assessment__category-header">
                    <h3>{cat.categoryName || `Category ${idx + 1}`}</h3>
                    <button 
                      className="student-assessment__toggle-btn"
                      onClick={() => toggleCategory(cat.categoryName)}
                    >
                      {expandedCategories.includes(cat.categoryName) ? 
                        <ChevronUp size={18} /> : 
                        <ChevronDown size={18} />
                      }
                    </button>
                  </div>
                  <div className="student-assessment__category-score">
                    <div className={`student-assessment__score-circle student-assessment__score--${cat.score >= 75 ? 'passed' : cat.score >= 50 ? 'partial' : 'failed'}`}>
                      {cat.score}%
                    </div>
                    <div className="student-assessment__score-details">
                      <p className="student-assessment__correct-count">
                        {cat.correctAnswers} out of {cat.totalQuestions} correct
                      </p>
                      <span className={`student-assessment__status-badge ${cat.score >= 75 ? 'passed' : 'failed'}`}>
                        {cat.score >= 75 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {cat.score >= 75 ? 'Passed' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  <div className="student-assessment__progress-bar">
                    <div 
                      className="student-assessment__progress-fill" 
                      style={{ width: `${cat.score}%` }}
                    ></div>
                  </div>
                  {expandedCategories.includes(cat.categoryName) && (
                    <div className="student-assessment__category-details">
                      <p>{cat.description}</p>
                      <div className="student-assessment__questions-overview">
                        <h4>Question Results</h4>
                        <div className="student-assessment__questions-grid">
                          {cat.questions && cat.questions.map((question, index) => (
                            <div 
                              key={question.id || index} 
                              className={`student-assessment__question-result ${question.result}`}
                              title={question.question}
                            >
                              {index + 1}
                              {question.result === 'correct' ? 
                                <CheckCircle size={12} /> : 
                                <XCircle size={12} />
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentResults;