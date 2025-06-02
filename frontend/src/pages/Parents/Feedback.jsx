// src/pages/Parents/Feedback.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText, // Changed from FilePdf to FileText
  Info,
  Calendar,
  User,
  Book,
  X,
  Download,
  BookOpen,
  Eye,
  Home
} from 'lucide-react';
import '../../css/Parents/Feedback.css';
import axios from 'axios';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [animated, setAnimated] = useState(false);

  // Fetch feedbacks from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/parent/child_pdf', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setFeedbacks(res.data);
      })
      .catch(() => setFeedbacks([]));
  }, []);

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedPdf) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPdf]);

  // Function to handle PDF viewing
  const viewPdf = (pdfUrl) => {
    setSelectedPdf(pdfUrl);
  };

  const closePdf = () => {
    setSelectedPdf(null);
  };

  // Format date string to readable format
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

  return (
    <div className="parent-feedback__container">
      {/* Header section with breadcrumb */}
      <div className="parent-feedback__main-content">
        <div className="parent-feedback__header">
          <div className="parent-feedback__breadcrumb">
            <Home size={16} />
            <span className="parent-feedback__breadcrumb-separator">/</span>
            <span className="parent-feedback__breadcrumb-active">Progress Reports</span>
          </div>
          <h1 className="parent-feedback__title">Weekly Progress Reports</h1>
          <p className="parent-feedback__subtitle">View and download your child's progress reports submitted by teachers</p>
        </div>

        {/* Info Banner */}
        <div className={`parent-feedback__info-banner ${animated ? 'animate' : ''}`} style={{ animationDelay: '0s' }}>
          <Info className="parent-feedback__info-icon" />
          <div className="parent-feedback__info-content">
            <h3>Progress Report Overview</h3>
            <p>
              These weekly reports provide detailed feedback on your child's performance and development.
              Click on "View Report" to open the PDF document. You can download reports for your records.
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className={`parent-feedback__table-container ${animated ? 'animate' : ''}`} style={{ animationDelay: '0.2s' }}>
          <div className="parent-feedback__table-header">
            <BookOpen className="parent-feedback__table-icon" />
            <h3>Available Reports</h3>
          </div>
          <div className="parent-feedback__table-wrapper">
            <table className="parent-feedback__table">
              <thead>
                <tr>
                  <th>
                    <div className="parent-feedback__th-content">
                      <User size={16} className="parent-feedback__th-icon" />
                      <span>Teacher</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <User size={16} className="parent-feedback__th-icon" />
                      <span>Parent</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <User size={16} className="parent-feedback__th-icon" />
                      <span>Student</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <Calendar size={16} className="parent-feedback__th-icon" />
                      <span>Week</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <Calendar size={16} className="parent-feedback__th-icon" />
                      <span>Date</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <FileText size={16} className="parent-feedback__th-icon" /> 
                      <span>Action</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback, index) => (
                  <tr
                    key={index}
                    className={`parent-feedback__table-row ${animated ? 'animate' : ''}`}
                    style={{ animationDelay: `${0.3 + (index * 0.05)}s` }}
                  >
                    <td className="parent-feedback__teacher-cell">
                      <div className="parent-feedback__teacher-info">
                        <span className="parent-feedback__teacher-name">{feedback.teacher}</span>
                      </div>
                    </td>
                    <td>{feedback.parent}</td>
                    <td>{feedback.student}</td>
                    <td>{feedback.week}</td>
                    <td>{formatDate(feedback.date)}</td>
                    <td>
                      <button
                        className="parent-feedback__view-btn"
                        onClick={() => viewPdf(feedback.pdfUrl)}
                      >
                        <Eye size={16} />
                        <span>View Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Note */}
        <div className={`parent-feedback__process-note ${animated ? 'animate' : ''}`} style={{ animationDelay: '0.5s' }}>
          <Info className="parent-feedback__process-note-icon" />
          <div className="parent-feedback__process-note-content">
            <p>
              <strong>Note:</strong> Progress reports are generated weekly by your child's teachers.
              If you have any questions about a specific report, please contact the teacher directly.
            </p>
          </div>
        </div>
      </div>

      {/* Modal PDF Viewer */}
      {selectedPdf && (
        <div className="parent-feedback__modal-overlay" onClick={closePdf}>
          <div className="parent-feedback__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="parent-feedback__modal-header">
              <h2>Progress Report</h2>
              <div className="parent-feedback__modal-actions">
                <a
                  href={selectedPdf}
                  download
                  className="parent-feedback__download-btn"
                >
                  <Download size={16} />
                  <span>Download</span>
                </a>
                <button
                  className="parent-feedback__close-btn"
                  onClick={closePdf}
                >
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>
            <div className="parent-feedback__modal-body">
              <iframe
                src={selectedPdf}
                title="Progress Report PDF"
                className="parent-feedback__pdf-frame"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;