import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, ChevronDown, PieChart, BarChart2, 
  Book, Award, Layers, CheckCircle, AlertTriangle,
  User, UserPlus
} from 'lucide-react';
import axios from 'axios'; // Import axios
import '../../css/Admin/AssessmentResults/StudentAssessmentsList.css';

const StudentAssessmentsList = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch students data
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/students');
        
        if (response.data.success) {
          setStudents(response.data.data);
          setFilteredStudents(response.data.data);
        } else {
          console.error("Error fetching student assessment data:", response.data.message);
        }

      } catch (error) {
        console.error("Error fetching pre-assessment data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter students based on search term and filters
  useEffect(() => {
    if (!students.length) return;
    
    let filtered = [...students];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.idNumber.toString().includes(searchTerm)
      );
    }
    
    // Apply grade filter
    if (filterGrade !== 'all') {
      filtered = filtered.filter(student => student.gradeLevel === filterGrade);
    }
    
    // Apply section filter
    if (filterSection !== 'all') {
      filtered = filtered.filter(student => student.section === filterSection);
    }
    
    // Apply sorting
    if (sortBy === 'name-asc') {
      filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
    } else if (sortBy === 'level-asc') {
      const levelOrder = {
        'Low Emerging': 1,
        'High Emerging': 2,
        'Developing': 3,
        'Transitioning': 4,
        'At Grade Level': 5
      };
      filtered.sort((a, b) => (levelOrder[a.readingLevel] || 0) - (levelOrder[b.readingLevel] || 0));
    } else if (sortBy === 'level-desc') {
      const levelOrder = {
        'Low Emerging': 1,
        'High Emerging': 2,
        'Developing': 3,
        'Transitioning': 4,
        'At Grade Level': 5
      };
      filtered.sort((a, b) => (levelOrder[b.readingLevel] || 0) - (levelOrder[a.readingLevel] || 0));
    } else if (sortBy === 'score-asc') {
      filtered.sort((a, b) => (a.readingPercentage || 0) - (b.readingPercentage || 0));
    } else if (sortBy === 'score-desc') {
      filtered.sort((a, b) => (b.readingPercentage || 0) - (a.readingPercentage || 0));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    } else if (sortBy === 'grade-asc') {
      filtered.sort((a, b) => a.gradeLevel.localeCompare(b.gradeLevel));
    } else if (sortBy === 'grade-desc') {
      filtered.sort((a, b) => b.gradeLevel.localeCompare(a.gradeLevel));
    }
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, filterGrade, filterSection, sortBy]);

  // Get unique grade levels and sections for filters
  const getUniqueGradeLevels = () => {
    const gradeLevels = [...new Set(students.map(student => student.gradeLevel))];
    return gradeLevels.sort();
  };

  const getUniqueSections = () => {
    const sections = [...new Set(students.map(student => student.section))];
    return sections.sort();
  };

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

  // Get reading level badge class
  const getReadingLevelClass = (level) => {
    switch(level) {
      case 'Low Emerging':
      case 'High Emerging':
        return 'student-assessments__reading-level--emerging';
      case 'Developing':
        return 'student-assessments__reading-level--developing';
      case 'Transitioning':
        return 'student-assessments__reading-level--transitioning';
      case 'At Grade Level':
        return 'student-assessments__reading-level--grade-level';
      default:
        return 'student-assessments__reading-level--not-assessed';
    }
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  return (
    <div className="student-assessments__container">
      {/* Header Section */}
      <div className="student-assessments__header">
        <div className="student-assessments__title-container">
          <h1>Pre Assessment Results</h1>
          <p className="student-assessments__subtitle">
            Overview of initial reading assessments for all students
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="student-assessments__filters-container">
        <div className="student-assessments__search-box">
          <Search size={18} className="student-assessments__search-icon" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="student-assessments__search-input"
          />
        </div>
        
        <div className="student-assessments__filters-controls">
          <button className="student-assessments__filter-toggle" onClick={toggleFilters}>
            <Filter size={16} />
            <span>Filter</span>
            <ChevronDown size={16} />
          </button>
          
          <select 
            className="student-assessments__sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="grade-asc">Grade (Low to High)</option>
            <option value="grade-desc">Grade (High to Low)</option>
            <option value="level-asc">Reading Level (Low to High)</option>
            <option value="level-desc">Reading Level (High to Low)</option>
            <option value="score-asc">Score (Low to High)</option>
            <option value="score-desc">Score (High to Low)</option>
            <option value="recent">Recently Assessed</option>
          </select>
        </div>
      </div>
      
      {/* Expanded Filters */}
      {showFilters && (
        <div className="student-assessments__expanded-filters">
          <div className="student-assessments__filter-group">
            <label>Grade Level</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="student-assessments__filter-select"
            >
              <option value="all">All Grades</option>
              {getUniqueGradeLevels().map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          
          <div className="student-assessments__filter-group">
            <label>Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="student-assessments__filter-select"
            >
              <option value="all">All Sections</option>
              {getUniqueSections().map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="student-assessments__clear-filters"
            onClick={() => {
              setFilterGrade('all');
              setFilterSection('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Students Cards Grid */}
      {loading ? (
        <div className="student-assessments__loading">
          <div className="student-assessments__loading-spinner"></div>
          <p>Loading pre-assessment results...</p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="student-assessments__grid">
          {filteredStudents.map(student => (
            <div key={student._id} className="student-assessments__card">
              <div className="student-assessments__card-header">
                <div className="student-assessments__avatar">
                  {student.profileImageUrl ? (
                    <img 
                      src={student.profileImageUrl} 
                      alt={`${student.firstName} ${student.lastName}`} 
                      className="student-assessments__avatar-img" 
                    />
                  ) : (
                    <div className="student-assessments__avatar-placeholder">
                      <User size={24} />
                    </div>
                  )}
                </div>
                
                <div className={`student-assessments__level-badge ${getReadingLevelClass(student.readingLevel)}`}>
                  {student.readingLevel}
                </div>
              </div>
              
              <div className="student-assessments__card-body">
                <h3 className="student-assessments__student-name">
                  {student.firstName} {student.lastName}
                </h3>
                
                <div className="student-assessments__student-details">
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">ID:</span>
                    <span className="student-assessments__detail-value">{student.idNumber}</span>
                  </div>
                  
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">Grade/Section:</span>
                    <span className="student-assessments__detail-value">{student.gradeLevel} - {student.section}</span>
                  </div>
                  
                  <div className="student-assessments__detail">
                    <span className="student-assessments__detail-label">Assessed:</span>
                    <span className="student-assessments__detail-value">{formatDate(student.lastAssessmentDate)}</span>
                  </div>
                </div>
                
                <div className="student-assessments__score-container">
                  {student.readingPercentage != null ? (
                    <div
                      className="student-assessments__score-circle"
                      style={{
                        background: student.readingPercentage === 100
                          ? 'conic-gradient(#22c55e 360deg, #edf2f7 0deg)' // green for 100%
                          : `conic-gradient(#3B4F81 ${student.readingPercentage * 3.6}deg, #edf2f7 0deg)`
                      }}
                    >
                      <div className="student-assessments__score-inner" style={{ background: '#fff', borderRadius: '50%', padding: '2px 8px' }}>
                        <span className="student-assessments__score-value">{
                          student.readingPercentage === 100
                            ? '100%'
                            : `${Number(student.readingPercentage).toFixed(2)}%`
                        }</span>
                      </div>
                    </div>
                  ) : (
                    <div className="student-assessments__score-not-taken">
                      <AlertTriangle size={24} />
                      <span>Pre-Assessment Not Taken</span>
                    </div>
                  )}
                  <span className="student-assessments__score-label">Pre Assessment Score</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="student-assessments__empty-state">
          <AlertTriangle size={48} />
          <h3>No Pre Assessment Results Found</h3>
          <p>No pre-assessment results match your current filters. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAssessmentsList; 