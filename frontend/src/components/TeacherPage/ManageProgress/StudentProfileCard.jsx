import React from 'react';
import {
  FaUser,
  FaIdCard,
  FaUserGraduate,
  FaBookReader,
  FaMale,
  FaFemale,
  FaUsers
} from 'react-icons/fa';
import '../ManageProgress/css/StudentProfileCard.css';
import S3Image from '../../S3Image';

const StudentProfileCard = ({ student }) => {
  if (!student) return null;
  
  /* ---------- helpers ---------- */
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
   
  const getFullName = (student) => {
    // Check if first, middle, and last name exist
    if (student.firstName && student.lastName) {
      const middle = student.middleName ? `${student.middleName} ` : '';
      return `${student.firstName} ${middle}${student.lastName}`;
    }
    // Fallback to name if it exists
    return student.name || 'Student';
  };

  // Get CSS class for reading level
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'reading-level-not-assessed';
    
    switch(level?.toLowerCase()) {
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
  
  // Get reading level class
  const readingLevelClass = getReadingLevelClass(student.readingLevel);
  
  /* ---------- render ---------- */
  return (
    <div className="literexia-student-card">
      {/* header: avatar + name/id */}
      <div className="literexia-student-header">
        <div className="literexia-avatar">
          <div className="literexia-avatar-circle">
            <S3Image 
              src={student.profileImageUrl}
              alt={getFullName(student)}
              fallbackText={getInitials(getFullName(student))}
              className="literexia-avatar-image"
            />
          </div>
        </div>
        <div className="literexia-student-name-section">
          <h2 className="literexia-student-name">{getFullName(student)}</h2>
          <span className="literexia-student-id">
            <FaIdCard /> ID: {student.idNumber || student.id || ''}
          </span>
        </div>
      </div>
      {/* core details */}
      <div className="literexia-student-details">
        <div className="literexia-detail-row">
          <div className="literexia-detail-item">
            <div className="literexia-detail-icon">
              <FaUser />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Age</span>
              <span className="literexia-detail-value">
                {student.age} years old
              </span>
            </div>
          </div>
          <div className="literexia-detail-item">
            <div className="literexia-detail-icon">
              <FaUserGraduate />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Grade</span>
              <span className="literexia-detail-value">
                {student.gradeLevel}
              </span>
            </div>
          </div>
        </div>
        <div className="literexia-detail-row">
          <div className="literexia-detail-item">
            <div className={`literexia-detail-icon gender-icon ${student.gender && student.gender.toLowerCase() === 'female' ? 'female-icon' : 'male-icon'}`}>
              {student.gender && student.gender.toLowerCase() === 'female' ? <FaFemale /> : <FaMale />}
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Gender</span>
              <span className="literexia-detail-value">
                {student.gender || 'Not specified'}
              </span>
            </div>
          </div>
          <div className="literexia-detail-item">
            <div className="literexia-detail-icon section-icon">
              <FaUsers />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Section</span>
              <span className="literexia-detail-value">
                {student.section || 'Not Assigned'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileCard;