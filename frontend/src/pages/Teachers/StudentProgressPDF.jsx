// src/pages/Teachers/StudentProgressPDF.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaBookReader } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import StudentDetailsService from '../../services/Teachers/StudentDetailsService';
import '../../css/Teachers/StudentDetails.css';

// Import cradle logo
const cradleLogo = new URL('../../assets/images/Teachers/cradleLogo.jpg', import.meta.url).href;

const StudentProgressPDF = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [readingLevelProgress, setReadingLevelProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parentProfile, setParentProfile] = useState(null);
  const reportRef = useRef(null);

  // Default progress report
  const [progressReport, setProgressReport] = useState({
    schoolYear: '2024-2025',
    reportDate: new Date().toISOString().split('T')[0],
    recommendations: [
      "Student continues to develop reading skills. May need additional practice and support to improve reading comprehension.",
      "Encourage practice with phonemic awareness activities at home to strengthen reading foundation.",
      "Regular practice with guided reading will help improve fluency and comprehension."
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const studentData = await StudentDetailsService.getStudentDetails(id);
        
        // Normalize reading level
        if (studentData) {
          studentData.readingLevel = StudentDetailsService.convertLegacyReadingLevel(studentData.readingLevel);
        }
        
        setStudent(studentData);
        
        // Fetch parent profile if parentId exists
        if (studentData && studentData.parentId) {
          try {
            const parentData = await StudentDetailsService.getParentProfileWithFallback(
              studentData.parentId, 
              studentData
            );
            setParentProfile(parentData);
          } catch (e) {
            console.warn('Could not load parent profile:', e);
          }
        }
        
        // Fetch reading level progress
        const readingProgressData = await StudentDetailsService.getReadingLevelProgress(id);
        setReadingLevelProgress(readingProgressData);
        
        // Get prescriptive recommendations
        const recommendations = await StudentDetailsService.getPrescriptiveRecommendations(id);
        if (recommendations && recommendations.length > 0) {
          setProgressReport(prev => ({
            ...prev,
            recommendations: recommendations.map(r => r.rationale || r.recommendation || r.text || '')
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const getReadingLevelClass = (level) => {
    const classMap = {
      'Low Emerging': 'reading-level-early',
      'High Emerging': 'reading-level-early',
      'Developing': 'reading-level-developing',
      'Transitioning': 'reading-level-developing',
      'At Grade Level': 'reading-level-fluent',
      'Advanced': 'reading-level-advanced'
    };
    return classMap[level] || 'reading-level-not-assessed';
  };

  const getReadingLevelDescription = (level) => {
    const descriptions = {
      'Low Emerging': 'Beginning to recognize letters and sounds',
      'High Emerging': 'Developing letter-sound connections',
      'Developing': 'Building phonemic awareness and basic vocabulary',
      'Transitioning': 'Building reading comprehension skills',
      'At Grade Level': 'Can read and comprehend grade-level text',
      'Advanced': 'Reading above grade level with strong comprehension'
    };
    return descriptions[level] || 'Not yet assessed - Needs initial assessment';
  };

  const exportToPDF = async () => {
    try {
      if (!reportRef.current) {
        console.error('Report element not found');
        return;
      }
      
      // Setup for PDF generation with proper scaling
      const element = reportRef.current;
      const options = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        logging: false,
        quality: 1.0,
        height: element.scrollHeight
      };
      
      // Generate canvas from HTML
      const canvas = await html2canvas(element, options);
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions for A4 page
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate the total number of pages needed
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, 1);
      const imgHeightScaled = imgHeight * ratio;
      const totalPages = Math.ceil(imgHeightScaled / pdfHeight);
      
      let heightLeft = imgHeightScaled;
      let position = 0;
      let page = 1;
      
      // Add image across multiple pages if needed
      while (heightLeft > 0) {
        pdf.addPage();
        position = -pdfHeight * (page - 1);
        
        pdf.addImage(
          imgData, 
          'PNG', 
          0, 
          position, 
          pdfWidth, 
          imgHeightScaled
        );
        
        heightLeft -= pdfHeight;
        page++;
      }
      
      // Remove the first blank page that was automatically added
      pdf.deletePage(1);
      
      // Save the PDF
      pdf.save(`${student.name.replace(/[^a-z0-9]/gi, '_')}_progress_report.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formatScoreClass = (score) => {
    if (score >= 75) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-needs-improvement';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const getParentName = () => {
    if (parentProfile) {
      if (parentProfile.name) return parentProfile.name;
      if (parentProfile.firstName || parentProfile.lastName) {
        return `${parentProfile.firstName || ''} ${parentProfile.middleName ? parentProfile.middleName + ' ' : ''}${parentProfile.lastName || ''}`.trim();
      }
    }
    
    if (student) {
      if (typeof student.parent === 'string' && student.parent) return student.parent;
      if (student.parent && student.parent.name) return student.parent.name;
      if (student.parentName) return student.parentName;
    }
    
    return 'Parent/Guardian';
  };

  const renderReadingLevelCategories = () => {
    // Check if we have reading level progress data
    if (!readingLevelProgress || !readingLevelProgress.categories || readingLevelProgress.categories.length === 0) {
      return (
        <div className="sdx-report-no-data">
          <p>Student has not been assessed yet</p>
        </div>
      );
    }
    
    // For students marked as "Not Assessed" explicitly
    if (student.readingLevel === 'Not Assessed') {
      return (
        <div className="sdx-report-no-data">
          <p>Student has not been assessed yet</p>
        </div>
      );
    }
    
    return (
      <div className="sdx-report-reading-progress">
        {/* Reading Level Badge and Description */}
        <div className="sdx-report-reading-level">
          <div className={`sdx-report-level-badge ${getReadingLevelClass(student.readingLevel || 'Not Assessed')}`}>
            {student.readingLevel || 'Not Assessed'}
          </div>
          <p className="sdx-report-level-description">
            {getReadingLevelDescription(student.readingLevel || 'Not Assessed')}
          </p>
        </div>
        
        {/* Categories Grid */}
        <div className="sdx-report-categories-grid">
          {readingLevelProgress.categories.map((category, index) => {
            const score = category.score || 0;
            const correctAnswers = category.correctAnswers || 0;
            const totalQuestions = category.totalQuestions || 0;
            const incorrectAnswers = totalQuestions - correctAnswers;
            
            return (
              <div key={index} className="sdx-report-category-card">
                <div className="sdx-report-category-header">
                  <span className="sdx-report-category-name">{category.category}</span>
                  <span className={`sdx-report-category-score ${score >= 75 ? 'passing' : 'failing'}`}>
                    {score}%
                  </span>
                </div>
                
                <div className="sdx-report-category-progress">
                  <div 
                    className={`sdx-report-category-bar ${score >= 75 ? 'passing' : 'failing'}`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                
                <div className="sdx-report-category-details">
                  <div className="sdx-report-category-answers">
                    <span className="sdx-report-correct">✓ {correctAnswers} correct</span>
                    <span className="sdx-report-incorrect">✗ {incorrectAnswers} incorrect</span>
                  </div>
                  <div className={`sdx-report-status ${category.isPassed ? 'passed' : 'failed'}`}>
                    {category.isPassed ? 'Passed' : 'Not Passed'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary */}
        <div className="sdx-report-summary">
          <p className="sdx-report-summary-text">
            {student.name} is currently at the <strong>{student.readingLevel || 'Not Assessed'}</strong> reading level. 
            {student.readingLevel && student.readingLevel !== 'Not Assessed' ? 
              ` This means ${getReadingLevelDescription(student.readingLevel).toLowerCase()}.` : 
              ' An assessment is needed to determine the appropriate reading level.'}
          </p>
        </div>
      </div>
    );
  };

  const renderActivitiesTable = () => {
    // Check if we have reading level progress data or if the student is marked as "Not Assessed"
    if (!readingLevelProgress || !readingLevelProgress.categories || readingLevelProgress.categories.length === 0 || 
        student.readingLevel === 'Not Assessed') {
      // Create an empty table structure for unassessed students
      return (
        <div className="sdx-report-activities">
          <table className="sdx-report-table">
            <thead>
              <tr>
                <th className="sdx-report-th">Lesson</th>
                <th className="sdx-report-th">Status</th>
                <th className="sdx-report-th">Score</th>
                <th className="sdx-report-th" colSpan="3">Support Level</th>
                <th className="sdx-report-th">Remarks</th>
              </tr>
              <tr>
                <th className="sdx-report-th-empty"></th>
                <th className="sdx-report-th-empty"></th>
                <th className="sdx-report-th-empty"></th>
                <th className="sdx-report-th-level">Minimal</th>
                <th className="sdx-report-th-level">Moderate</th>
                <th className="sdx-report-th-level">Extensive</th>
                <th className="sdx-report-th-empty"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="sdx-report-tr">
                <td colSpan="7" className="sdx-report-td-empty">
                  No activities available. Student has not been assessed yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    const activities = readingLevelProgress.categories.map((category, index) => {
      const score = category.score || 0;
      const supportLevel = score >= 70 ? 'minimal' : score >= 40 ? 'moderate' : 'extensive';
      // Determine status based on score
      const status = score === 0 ? 'Not Started' : score >= 75 ? 'Mastered' : 'In Progress';
      
      return {
        id: `category-${index}`,
        name: `${category.category || 'Reading'} Practice`,
        description: category.category || 'Reading Skills',
        score: score,
        status: status,
        minimalSupport: supportLevel === 'minimal',
        moderateSupport: supportLevel === 'moderate',
        extensiveSupport: supportLevel === 'extensive',
        remarks: category.remarks || '', // Don't generate default remarks
        hasIntervention: category.hasIntervention || false,
        interventionName: category.interventionName || ''
      };
    });
    
    return (
      <div className="sdx-report-activities">
        <table className="sdx-report-table">
          <thead>
            <tr>
              <th className="sdx-report-th">Lesson</th>
              <th className="sdx-report-th">Status</th>
              <th className="sdx-report-th">Score</th>
              <th className="sdx-report-th" colSpan="3">Support Level</th>
              <th className="sdx-report-th">Remarks</th>
            </tr>
            <tr>
              <th className="sdx-report-th-empty"></th>
              <th className="sdx-report-th-empty"></th>
              <th className="sdx-report-th-empty"></th>
              <th className="sdx-report-th-level">Minimal</th>
              <th className="sdx-report-th-level">Moderate</th>
              <th className="sdx-report-th-level">Extensive</th>
              <th className="sdx-report-th-empty"></th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index} className="sdx-report-tr">
                <td className="sdx-report-td sdx-report-td-lesson">
                  <div>
                    <div className="sdx-report-lesson-name">{activity.name}</div>
                    <div className="sdx-report-lesson-category">{activity.description}</div>
                  </div>
                </td>
                <td className="sdx-report-td sdx-report-td-status">
                  {activity.status}
                </td>
                <td className="sdx-report-td sdx-report-td-score">
                  <span className={`sdx-report-score ${activity.score >= 75 ? 'passing' : 'failing'}`}>
                    {activity.score}%
                  </span>
                </td>
                <td className="sdx-report-td sdx-report-td-support">
                  {activity.minimalSupport ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-support">
                  {activity.moderateSupport ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-support">
                  {activity.extensiveSupport ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-remarks">
                  {activity.remarks ? (
                    <div>{activity.remarks}</div>
                  ) : (
                    <span className="sdx-no-remarks"></span>
                  )}
                  {activity.hasIntervention && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: '#ff6b00' }}>
                      Intervention active: {activity.interventionName || 'Targeted intervention'}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const goBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="sdx-pdf-page">
        <div className="vs-loading">
          <div className="vs-loading-spinner"></div>
          <p>Loading progress report...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="sdx-pdf-page">
        <div className="vs-no-results">
          <p>Student not found.</p>
          <button className="sdx-back-btn" onClick={goBack}>
            <FaArrowLeft /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sdx-pdf-page">
      <div className="sdx-pdf-controls">
        <button className="sdx-back-btn" onClick={goBack}>
          <FaArrowLeft /> Back to Student Details
        </button>
        <button className="sdx-export-pdf-btn" onClick={exportToPDF}>
          <FaFilePdf /> Export PDF
        </button>
      </div>

      <div className="sdx-report-printable" ref={reportRef}>
        {/* Report Header */}
        <div className="sdx-report-header">
          <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
          <div className="sdx-report-school-info">
            <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
            <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
            <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
            <p className="sdx-report-school-contact">☎ 8294‑7772 | ✉ cradle.of.learners@gmail.com</p>
          </div>
        </div>

        {/* Report Title */}
        <div className="sdx-report-title-section">
          <h2 className="sdx-report-main-title">PROGRESS REPORT</h2>
          <p className="sdx-report-school-year">S.Y. {progressReport.schoolYear}</p>
        </div>

        {/* Student Information */}
        <div className="sdx-report-student-info">
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Name:</strong> {student.name}
            </div>
            <div className="sdx-report-info-item">
              <strong>Age:</strong> {student.age}
            </div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Grade:</strong> {student.gradeLevel || 'Grade 1'}
            </div>
            <div className="sdx-report-info-item">
              <strong>Gender:</strong> {student.gender || 'Not specified'}
            </div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Parent:</strong> {getParentName()}
            </div>
            <div className="sdx-report-info-item">
              <strong>Date:</strong> {formatDate(progressReport.reportDate)}
            </div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Reading Level:</strong> {student.readingLevel || 'Not Assessed'}
            </div>
            <div className="sdx-report-info-item">
              <strong>Last Assessment:</strong> {formatDate(student.lastAssessment || student.lastAssessmentDate)}
            </div>
          </div>
        </div>

        {/* Reading Level Progress */}
        <div className="sdx-report-section-title">Reading Level Progress</div>
        {renderReadingLevelCategories()}

        {/* Learning Activities */}
        <div className="sdx-report-section-title">Learning Activities</div>
        {renderActivitiesTable()}

        {/* Recommendations */}
        <div className="sdx-report-section-title">Prescriptive Recommendations</div>
        <div className="sdx-report-recommendations">
          {student.readingLevel === 'Not Assessed' ? (
            <div className="sdx-report-no-data">
              <p>No recommendations available. Student needs to be assessed first.</p>
            </div>
          ) : (
            <ul className="sdx-report-rec-list">
              {progressReport.recommendations.map((rec, index) => (
                <li key={index} className="sdx-report-rec-item">{rec}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Signatures */}
        <div className="sdx-report-signatures">
          <div className="sdx-report-signature">
            <div className="sdx-report-sign-line"></div>
            <p className="sdx-report-sign-name">Teacher's Signature</p>
          </div>
          <div className="sdx-report-signature">
            <div className="sdx-report-sign-line"></div>
            <p className="sdx-report-sign-name">Principal's Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgressPDF;