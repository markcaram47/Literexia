// src/pages/Teachers/ViewStudent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaFilter,
  FaSortAmountDown,
  FaUserGraduate,
  FaChild,
  FaBookReader,
  FaVenusMars,
  FaLayerGroup,
  FaSchool,
  FaIdBadge,
  FaTags,
  FaCheck,
  FaChevronDown,
  FaTimesCircle
} from 'react-icons/fa';
import ViewStudentService from '../../../services/Teachers/ViewStudentService';
import StudentDetailsService from '../../../services/Teachers/StudentDetailsService';
import '../../../css/Teachers/ViewStudent.css';

const ViewStudent = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [readingLevelFilter, setReadingLevelFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingLevels, setReadingLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [parentProfiles, setParentProfiles] = useState({}); // Cache for parent profiles
  const [loadingParents, setLoadingParents] = useState(true);

  // Load all parent profiles when component mounts
  useEffect(() => {
    const loadParentProfiles = async () => {
      try {
        setLoadingParents(true);
        const parents = await StudentDetailsService.getAllParentProfiles();
        
        // Convert array to object map for faster lookups
        const parentMap = {};
        parents.forEach(parent => {
          if (parent && parent._id) {
            parentMap[parent._id] = parent;
          }
        });
        
        setParentProfiles(parentMap);
        console.log("Loaded parent profiles:", Object.keys(parentMap).length);
      } catch (error) {
        console.error("Error loading parent profiles:", error);
      } finally {
        setLoadingParents(false);
      }
    };
    
    loadParentProfiles();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        // Get reading levels, sections, and grade levels
        const [levelsData, sectionsData, gradesData] = await Promise.all([
          ViewStudentService.getReadingLevels(),
          ViewStudentService.getSections(),
          ViewStudentService.getGradeLevels()
        ]);

        if (Array.isArray(levelsData)) {
          setReadingLevels(levelsData);
        }

        if (Array.isArray(sectionsData)) {
          setSections(sectionsData);
        }

        if (Array.isArray(gradesData)) {
          setGradeLevels(gradesData);
        }

        // Fetch students list
        const studentsData = await ViewStudentService.getStudents();
        if (studentsData && studentsData.students) {
          setStudents(studentsData.students);
          setFilteredStudents(studentsData.students);
        } else {
          setStudents([]);
          setFilteredStudents([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    if (!students || students.length === 0) return;

    let filtered = [...students];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(query) ||
        student.firstName?.toLowerCase().includes(query) ||
        student.lastName?.toLowerCase().includes(query)
      );
    }

    // Filter by reading level (exact match)
    if (readingLevelFilter !== 'all') {
      filtered = filtered.filter(student => {
        const normalizedLevel = ViewStudentService.convertLegacyReadingLevel(student.readingLevel);
        return normalizedLevel === readingLevelFilter;
      });
    }

    // Filter by grade
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.gradeLevel === gradeFilter);
    }

    // Filter by section/class
    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.section === classFilter);
    }

    // Sort students based on criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          // Handle both name formats - single name field or split first/last name
          const aName = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
          const bName = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
          return aName.localeCompare(bName);
        case 'grade':
          return (a.gradeLevel || '').localeCompare(b.gradeLevel || '');
        case 'reading':
          const aLevel = ViewStudentService.convertLegacyReadingLevel(a.readingLevel) || '';
          const bLevel = ViewStudentService.convertLegacyReadingLevel(b.readingLevel) || '';
          return aLevel.localeCompare(bLevel);
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [searchQuery, readingLevelFilter, gradeFilter, classFilter, sortBy, students]);

  const renderParentInfo = () => {
    // If student has parent info directly from the backend
    if (student?.parent && (student.parent.name || student.parent.email || student.parent.contact)) {
      return (
        <div className="parent-info-section">
          <div className="parent-header">
            <h3>Parent Information</h3>
          </div>
          <div className="parent-details">
            <div className="parent-name">
              <strong>Name:</strong> {student.parent.name || 'Not provided'}
            </div>
            {student.parent.email && (
              <div className="parent-email">
                <strong>Email:</strong> {student.parent.email}
              </div>
            )}
            {student.parent.contact && (
              <div className="parent-contact">
                <strong>Contact:</strong> {student.parent.contact}
              </div>
            )}
            {student.parent.address && (
              <div className="parent-address">
                <strong>Address:</strong> {student.parent.address}
              </div>
            )}
          </div>
        </div>
      );
    }

    // If student has parentId but parent info wasn't included directly
    if (student?.parentId) {
      // Convert ObjectId format if needed
      let parentIdStr = student.parentId;
      if (typeof student.parentId === 'object' && student.parentId.$oid) {
        parentIdStr = student.parentId.$oid;
      }
      
      // Check if we have the parent profile in our cache
      const parentProfile = parentProfiles[parentIdStr];
      
      if (parentProfile) {
        // Display the cached parent profile
        return (
          <div className="parent-info-section">
            <div className="parent-header">
              <h3>Parent Information</h3>
            </div>
            <div className="parent-details">
              <div className="parent-name">
                <strong>Name:</strong> {`${parentProfile.firstName || ''} ${parentProfile.middleName ? parentProfile.middleName + ' ' : ''}${parentProfile.lastName || ''}`.trim() || 'Not provided'}
              </div>
              {parentProfile.email && (
                <div className="parent-email">
                  <strong>Email:</strong> {parentProfile.email}
                </div>
              )}
              {parentProfile.contact && (
                <div className="parent-contact">
                  <strong>Contact:</strong> {parentProfile.contact}
                </div>
              )}
              {parentProfile.contactNumber && !parentProfile.contact && (
                <div className="parent-contact">
                  <strong>Contact:</strong> {parentProfile.contactNumber}
                </div>
              )}
              {parentProfile.address && (
                <div className="parent-address">
                  <strong>Address:</strong> {parentProfile.address}
                </div>
              )}
            </div>
          </div>
        );
      }
      
      // If not in cache yet but still loading, show loading indicator
      if (loadingParents) {
        return (
          <div className="parent-info-section">
            <div className="parent-header">
              <h3>Parent Information</h3>
            </div>
            <div className="parent-loading">
              <div className="vs-loading-spinner"></div>
              <p>Loading parent information...</p>
            </div>
          </div>
        );
      }
      
      // If we've finished loading but still don't have the parent info
      return (
        <div className="parent-info-section">
          <div className="parent-header">
            <h3>Parent Information</h3>
          </div>
          <div className="parent-details">
            <div className="parent-name">
              <strong>Parent ID:</strong> {parentIdStr}
            </div>
            <div className="parent-fetch-error">
              <em>Could not retrieve detailed parent information</em>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="parent-info-section">
        <div className="parent-header">
          <h3>Parent Information</h3>
        </div>
        <div className="parent-not-registered">
          Parent/Guardian: Not registered
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setReadingLevelFilter('all');
    setGradeFilter('all');
    setClassFilter('all');
    setGroupBy('none');
    setSearchQuery('');
  };

  const handleViewDetails = (student) => {
    navigate(`/teacher/student-details/${student.id || student._id}`, { state: { student } });
  };

  const getGroupedStudents = () => {
    if (groupBy === 'none') {
      return { 'All Students': filteredStudents };
    }

    return filteredStudents.reduce((groups, student) => {
      let key;

      switch (groupBy) {
        case 'grade':
          key = student.gradeLevel || 'Not Assigned';
          break;
        case 'reading':
          // Convert legacy reading level to the new system
          key = ViewStudentService.convertLegacyReadingLevel(student.readingLevel) || 'Not Assessed';
          break;
        case 'section':
          key = student.section || 'Not Assigned';
          break;
        default:
          key = 'All Students';
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(student);
      return groups;
    }, {});
  };

  // Get color-coded class based on reading level
  const getReadingLevelClass = (level) => {
    return ViewStudentService.getReadingLevelClass(
      ViewStudentService.convertLegacyReadingLevel(level)
    );
  };

  const getReadingLevelDescription = (level) => {
    return ViewStudentService.getReadingLevelDescription(
      ViewStudentService.convertLegacyReadingLevel(level)
    );
  };

  const getParentName = (student) => {
    // If student has no valid data, return default
    if (!student) return 'Not registered';

    // Direct parent object with name
    if (student.parent) {
      // If parent has a name property, use it
      if (typeof student.parent === 'object' && student.parent.name) {
        return student.parent.name;
      }

      // If parent has firstName/lastName properties, construct full name
      if (typeof student.parent === 'object' && (student.parent.firstName || student.parent.lastName)) {
        return `${student.parent.firstName || ''} ${student.parent.middleName ? student.parent.middleName + ' ' : ''}${student.parent.lastName || ''}`.trim();
      }

      // If parent is a string, use it directly
      if (typeof student.parent === 'string' && student.parent) {
        return student.parent;
      }
    }

    // For parentId - try to look up in the cached parent data
    if (student.parentId) {
      // Convert ObjectId format if needed
      let parentIdStr = student.parentId;
      if (typeof student.parentId === 'object' && student.parentId.$oid) {
        parentIdStr = student.parentId.$oid;
      }
      
      const matchedParent = parentProfiles[parentIdStr];
      if (matchedParent) {
        // Format the full name properly
        return `${matchedParent.firstName || ''} ${matchedParent.middleName ? matchedParent.middleName + ' ' : ''}${matchedParent.lastName || ''}`.trim();
      }
      
      // If we have parentName directly available, use it
      if (student.parentName) {
        return student.parentName;
      }
      
      // If we have parent's contact info, show that instead of just "Registered"
      if (student.parentEmail) {
        return student.parentEmail;
      }
      
      // If we're still loading parent data, show loading indicator
      if (loadingParents) {
        return "Loading parent info...";
      }
      
      // If parent ID exists but we couldn't find parent data
      return `Parent ID: ${parentIdStr.substring(0, 6)}...`;
    }

    return 'Not registered';
  };

  const groupedStudents = getGroupedStudents();

  // Are any filters active?
  const hasActiveFilters =
    readingLevelFilter !== 'all' ||
    gradeFilter !== 'all' ||
    classFilter !== 'all' ||
    groupBy !== 'none' ||
    searchQuery.trim() !== '';

  return (
    <div className="vs-container">
      {/* Header */}
      <div className="vs-header">
        <div className="vs-title-section">
          <h1 className="vs-title">Student Details and Progress Report</h1>
          <p className="vs-subtitle">View and manage student details</p>
        </div>

        <div className="vs-search-container">
          <div className="vs-search-wrapper">
            <FaSearch className="vs-search-icon" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vs-search-input"
            />
            {searchQuery && (
              <button
                className="vs-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <FaTimesCircle />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="vs-filters-section">
        <div className="vs-filter-row">
          <div className="vs-filter-group">
            <label className="vs-filter-label">Reading Level:</label>
            <div className="vs-select-wrapper">
              <select
                value={readingLevelFilter}
                onChange={(e) => setReadingLevelFilter(e.target.value)}
                className="vs-select"
              >
                <option value="all">All Levels</option>
                {readingLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <FaBookReader className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Grade:</label>
            <div className="vs-select-wrapper">
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="vs-select"
              >
                <option value="all">All Grades</option>
                {gradeLevels.map((grade, index) => (
                  <option key={index} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <FaUserGraduate className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Section:</label>
            <div className="vs-select-wrapper">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="vs-select"
              >
                <option value="all">All Sections</option>
                {sections.map((section, index) => (
                  <option key={index} value={section}>
                    {section}
                  </option>
                ))}
              </select>
              <FaSchool className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Group by:</label>
            <div className="vs-select-wrapper">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="vs-select"
              >
                <option value="none">No Grouping</option>
                <option value="grade">By Grade</option>
                <option value="reading">By Reading Level</option>
                <option value="section">By Section</option>
              </select>
              <FaLayerGroup className="vs-select-icon" />
            </div>
          </div>

          <div className="vs-filter-group">
            <label className="vs-filter-label">Sort by:</label>
            <div className="vs-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="vs-select"
              >
                <option value="name">Name</option>
                <option value="grade">Grade</option>
                <option value="reading">Reading Level</option>
              </select>
              <FaSortAmountDown className="vs-select-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Section */}
      {hasActiveFilters && (
        <div className="vs-active-filters">
          <div className="vs-active-filters-title">
            <FaFilter /> Active Filters:
          </div>

          <div className="vs-active-filters-content">
            {searchQuery && (
              <div className="vs-filter-tag">
                <FaSearch className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Search:</span>
                <span className="vs-filter-tag-value">{searchQuery}</span>
              </div>
            )}

            {readingLevelFilter !== 'all' && (
              <div className="vs-filter-tag">
                <FaBookReader className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Reading Level:</span>
                <span className="vs-filter-tag-value">{readingLevelFilter}</span>
              </div>
            )}

            {gradeFilter !== 'all' && (
              <div className="vs-filter-tag">
                <FaUserGraduate className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Grade:</span>
                <span className="vs-filter-tag-value">{gradeFilter}</span>
              </div>
            )}

            {classFilter !== 'all' && (
              <div className="vs-filter-tag">
                <FaSchool className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Section:</span>
                <span className="vs-filter-tag-value">{classFilter}</span>
              </div>
            )}

            {groupBy !== 'none' && (
              <div className="vs-filter-tag">
                <FaLayerGroup className="vs-filter-tag-icon" />
                <span className="vs-filter-tag-label">Grouped by:</span>
                <span className="vs-filter-tag-value">
                  {groupBy === 'grade' ? 'Grade' :
                    groupBy === 'reading' ? 'Reading Level' : 'Section'}
                </span>
              </div>
            )}

            <button className="vs-clear-filters-btn" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>

          <div className="vs-filter-divider"></div>
        </div>
      )}

      {/* Results Summary */}
      <div className="vs-results-summary">
        <span className="vs-results-count">
          Found: <strong>{filteredStudents.length}</strong> student(s)
        </span>
        <span className="vs-results-sort">
          <FaSortAmountDown /> Sorted by: <strong>{
            sortBy === 'name' ? 'Name' :
              sortBy === 'grade' ? 'Grade' :
                sortBy === 'reading' ? 'Reading Level' :
                  'Name'
          }</strong>
        </span>
      </div>

      {/* Students List */}
      <div className="vs-students-list">
        {loading ? (
          <div className="vs-loading">
            <div className="vs-loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="vs-no-results">
            <p>No students found matching your criteria.</p>
            {hasActiveFilters && (
              <button className="vs-clear-filters-btn vs-center" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedStudents).map(([group, students]) => (
            <div key={group} className="vs-group-section">
              {group !== 'All Students' && (
                <h2 className="vs-group-title">
                  {groupBy === 'reading' && <FaBookReader className="vs-group-icon" />}
                  {groupBy === 'grade' && <FaUserGraduate className="vs-group-icon" />}
                  {groupBy === 'section' && <FaSchool className="vs-group-icon" />}
                  {group}
                </h2>
              )}

              <div className="vs-cards-grid">
                {students.map(student => {
                  const levelClass = getReadingLevelClass(student.readingLevel);
                  const displayName = student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim();
                  const displayReadingLevel = ViewStudentService.convertLegacyReadingLevel(student.readingLevel);

                  return (
                    <div key={student.id || student._id} className="vs-student-card">
                      <div className="vs-card-header">
                        <div className="vs-student-avatar">
                          {student.profileImageUrl ? (
                            <img
                              src={student.profileImageUrl}
                              alt={displayName}
                              className="vs-student-avatar-img"
                              onError={(e) => {
                                console.error("Error loading student image:", e);
                                e.target.onerror = null;
                                e.target.style.display = "none";
                                // Safely set the initials as text content
                                if (e.target.parentElement) {
                                  e.target.parentElement.textContent = (displayName || '').split(' ')
                                    .map(n => n[0] || '')
                                    .join('')
                                    .toUpperCase();
                                }
                              }}
                            />
                          ) : (
                            (displayName || '').split(' ').map(n => n[0] || '').join('').toUpperCase()
                          )}
                        </div>
                        <div className="vs-student-basic-info">
                          <h3 className="vs-student-name">{displayName}</h3>
                          <span className="vs-student-id">
                            <strong>Student ID:</strong>{' '}
                            <FaIdBadge style={{ margin: '0 4px', color: '#3B4F81' }} />
                            {student.idNumber || ''}
                          </span>
                        </div>
                        <div className={`vs-reading-badge ${levelClass}`}>
                          {student.section || 'No Section'}
                        </div>
                      </div>

                      <div className="vs-card-details">
                        <div className="vs-student-info-row">
                          <div className="vs-info-icon">
                            <FaUserGraduate />
                          </div>
                          <span className="vs-info-text">
                            {student.gradeLevel?.replace('Grade ', '') || 'Grade 1'}
                          </span>

                          <div className="vs-info-icon" style={{ marginLeft: 'auto' }}>
                            <FaChild />
                          </div>
                          <span className="vs-info-text">{student.age} years old</span>
                        </div>

                        <div className="vs-student-info-row">
                          <div className="vs-info-icon">
                            <FaVenusMars />
                          </div>
                          <span className="vs-info-text">{student.gender || 'Not specified'}</span>

                          <div className={`vs-reading-level-indicator ${levelClass}`}>
                            <FaBookReader />
                            <span>{displayReadingLevel}</span>
                          </div>
                        </div>

                        <div className="vs-parent-guardian">
                          <span className="vs-parent-label">Parent/Guardian: </span>
                          <span className="vs-parent-name">
                            {getParentName(student)}
                          </span>
                        </div>
                        <button
                          className="vs-view-details-btn"
                          onClick={() => handleViewDetails(student)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewStudent;