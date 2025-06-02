import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaSortAmountDown,
  FaUserGraduate,
  FaChild,
  FaMars,
  FaVenus,
  FaGenderless,
  FaBookReader,
  FaCalendarAlt,
  FaAngleLeft,
  FaAngleRight,
  FaCheck,
  FaTimes,
  FaChalkboardTeacher,
  FaFilter,
  FaLayerGroup,
  FaSort,
  FaIdCard,
  FaUserFriends,
  FaChartLine,
  FaTrophy,
  FaBook,
  FaBullseye,
  FaArrowRight
} from 'react-icons/fa';
import StudentApiService from '../../../services/Teachers/StudentApiService';
import S3Image from '../../../components/S3Image';
import '../../../css/Teachers/ManageProgress.css';

function getPageNumbers(currentPage, totalPages) {
  const visiblePageCount = 5;
  let startPage = Math.max(currentPage - Math.floor(visiblePageCount / 2), 1);
  let endPage = startPage + visiblePageCount - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(endPage - visiblePageCount + 1, 1);
  }

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage);
}

const ManageProgress = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [readingLevelFilter, setReadingLevelFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [sections, setSections] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [readingLevels, setReadingLevels] = useState([]);
  const [parentProfiles, setParentProfiles] = useState({});
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        console.log('Fetching students from API...');

        // Using the StudentApiService to fetch students
        const data = await StudentApiService.getStudents({
          page: 1,
          limit: 50, // Get more students to ensure we have enough for filtering
          search: searchQuery,
          readingLevelFilter: readingLevelFilter !== 'all' ? readingLevelFilter : undefined,
          sectionFilter: sectionFilter !== 'all' ? sectionFilter : undefined
        });

        console.log('Students data received:', data);

        if (!data || !data.students || !Array.isArray(data.students)) {
          throw new Error('Invalid response format');
        }

        // Fetch parent profiles for each student
        const parentIds = data.students
          .filter(student => student.parentId)
          .map(student => student.parentId);
        
        // Create a unique set of parent IDs to avoid duplicate fetches
        const uniqueParentIds = [...new Set(parentIds)].filter(id => id); // Filter out null/undefined
        
        console.log(`Found ${uniqueParentIds.length} unique parent IDs to fetch`);
        
        const parentProfilesData = {};
        
        // Fetch parent profiles in parallel with a limit of 5 concurrent requests
        const fetchParentBatch = async (batch) => {
          return Promise.all(
            batch.map(async (parentId) => {
              try {
                const parentProfile = await StudentApiService.getParentProfileWithFallback(parentId);
                parentProfilesData[parentId] = parentProfile;
                console.log(`Successfully fetched parent profile for ID ${parentId}`);
              } catch (err) {
                console.error(`Error fetching parent profile for ID ${parentId}:`, err);
                // Still add a placeholder to avoid repeated failed requests
                parentProfilesData[parentId] = {
                  name: `Parent ID: ${parentId.substring(0, 8)}...`,
                  firstName: null,
                  lastName: null
                };
              }
            })
          );
        };
        
        // Process in batches of 5
        const batchSize = 5;
        for (let i = 0; i < uniqueParentIds.length; i += batchSize) {
          const batch = uniqueParentIds.slice(i, i + batchSize);
          await fetchParentBatch(batch);
        }
        
        setParentProfiles(parentProfilesData);
        setStudents(data.students);

        // Get reading levels
        try {
          const readingLevelsData = await StudentApiService.getReadingLevels();
          setReadingLevels(readingLevelsData);
        } catch (readingLevelsError) {
          console.error("Error fetching reading levels:", readingLevelsError);
          // Use default reading levels as fallback
          setReadingLevels([
            'Low Emerging',
            'High Emerging',
            'Developing',
            'Transitioning',
            'At Grade Level',
            'Not Assessed'
          ]);
        }

        // Get sections
        try {
          const sectionsData = await StudentApiService.getSections();
          setSections(sectionsData);
          console.log("Sections fetched from users collection:", sectionsData);
        } catch (sectionsError) {
          console.error("Error fetching sections:", sectionsError);
          // Don't use fallback sections anymore as we want to get them from users collection
          setSections([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError(`Failed to load student data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchStudents();
  }, [searchQuery, readingLevelFilter, sectionFilter]);

  // Filter and sort students when any filter or search changes
  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(query) ||
        (student.parentName && student.parentName.toLowerCase().includes(query)) ||
        student.id.toLowerCase().includes(query)
      );
    }

    // Apply reading level filter
    if (readingLevelFilter !== 'all') {
      filtered = filtered.filter(student => student.readingLevel === readingLevelFilter);
    }

    // Apply section filter
    if (sectionFilter !== 'all') {
      filtered = filtered.filter(student => student.section === sectionFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'reading':
          // Sort by reading level priority
          const levelPriority = {
            'Low Emerging': 1,
            'High Emerging': 2,
            'Developing': 3,
            'Transitioning': 4,
            'At Grade Level': 5,
            'Fluent': 6,
            'Advanced': 7,
            'Not Assessed': 0
          };
          return (levelPriority[b.readingLevel] || 0) - (levelPriority[a.readingLevel] || 0);
        case 'progress':
          const progressA = a.totalActivities > 0 ? (a.activitiesCompleted / a.totalActivities) : 0;
          const progressB = b.totalActivities > 0 ? (b.activitiesCompleted / b.totalActivities) : 0;
          return progressB - progressA;
        case 'recent':
          return new Date(b.lastActivityDate || 0) - new Date(a.lastActivityDate || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredStudents(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchQuery, readingLevelFilter, sectionFilter, sortBy, students]);

  const handleViewDetails = (student) => {
    navigate(`/teacher/student-progress/${student.id}`, { state: student });
  };

  // Reading level descriptions (in English)
  const readingLevelDescriptions = {
    'Low Emerging': 'Beginning to recognize letters and sounds',
    'High Emerging': 'Developing letter-sound connections',
    'Developing': 'Working on basic fluency and word recognition',
    'Transitioning': 'Building reading comprehension skills',
    'At Grade Level': 'Reading at expected grade level',
    'Not Assessed': 'Evaluation needed'
  };

  // Get reading level CSS class
  const getReadingLevelClass = (level) => {
    switch (level) {
      case 'Low Emerging': return 'mp-level-1';
      case 'High Emerging': return 'mp-level-2';
      case 'Developing': return 'mp-level-3';
      case 'Transitioning': return 'mp-level-4';
      case 'At Grade Level': return 'mp-level-5';
      case 'Fluent': return 'mp-level-fluent';
      case 'Not Assessed': return 'mp-level-na';
      default: return 'mp-level-na';
    }
  };

  // Get progress CSS class
  const getProgressClass = (progress) => {
    if (progress >= 85) return 'mp-progress-excellent';
    if (progress >= 70) return 'mp-progress-good';
    if (progress >= 50) return 'mp-progress-average';
    return 'mp-progress-needs-improvement';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    try {
      if (dateString.includes('T')) {
        // ISO format date
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
      }
      // Already formatted date
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  // Get grouped students
  const getGroupedStudents = () => {
    if (groupBy === 'none') {
      return { 'All Students': filteredStudents };
    }

    return filteredStudents.reduce((groups, student) => {
      let key;

      switch (groupBy) {
        case 'reading':
          key = student.readingLevel || 'Not Assessed';
          break;
        case 'section':
          key = student.section || 'No Section';
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

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  const groupedStudents = getGroupedStudents();

  // Get icon for reading level
  const getReadingLevelIcon = (level) => {
    switch (level) {
      case 'Low Emerging':
      case 'High Emerging':
        return <FaBook />;
      case 'Developing':
        return <FaBookReader />;
      case 'Transitioning':
      case 'At Grade Level':
        return <FaChartLine />;
      case 'Fluent':
        return <FaTrophy />;
      case 'Not Assessed':
      default:
        return <FaBookReader />;
    }
  };

  // Function to get parent name from parent profile
  const getParentName = (student) => {
    // If student has no valid data, return default
    if (!student) return "Not specified";
    
    // Check for direct parentName property first
    if (student.parentName && student.parentName !== "Not specified") {
      return student.parentName;
    }
    
    // If student has parentId and we have the profile
    if (student.parentId && parentProfiles[student.parentId]) {
      const parentProfile = parentProfiles[student.parentId];
      
      // If we have a name directly, use it (but verify it's not a placeholder)
      if (parentProfile.name && !parentProfile.name.includes('Parent ID:')) {
        return parentProfile.name;
      }
      
      // Build the full name from the parent profile
      if (parentProfile.firstName || parentProfile.lastName) {
        const middleName = parentProfile.middleName ? ` ${parentProfile.middleName}` : '';
        return `${parentProfile.firstName || ''}${middleName} ${parentProfile.lastName || ''}`.trim();
      }
    }
    
    // If student has parent property
    if (student.parent) {
      // If parent is a string, use it directly
      if (typeof student.parent === 'string') {
        return student.parent;
      }
      
      // If parent is an object with name
      if (typeof student.parent === 'object' && student.parent.name) {
        return student.parent.name;
      }
      
      // If parent is an object with firstName/lastName
      if (typeof student.parent === 'object' && (student.parent.firstName || student.parent.lastName)) {
        const middleName = student.parent.middleName ? ` ${student.parent.middleName}` : '';
        return `${student.parent.firstName || ''}${middleName} ${student.parent.lastName || ''}`.trim();
      }
    }
    
    // If we have parentId but couldn't find the profile details in the fetched data,
    // try using the hardcoded data as a fallback
    if (student.parentId) {
      // Fallback parent profiles from MongoDB if API fetch failed
      const fallbackParentProfiles = [
        { _id: "681a2933af165878136e05da", firstName: "Jan Mark", middleName: "Percival", lastName: "Caram" },
        { _id: "6827575c89b0d728f9333a20", firstName: "Kit Nicholas", middleName: "Tongol", lastName: "Santiago" },
        { _id: "682ca15af0bfb8e632bdfd13", firstName: "Rain", middleName: "Percival", lastName: "Aganan" },
        { _id: "682d75b9f7897b64cec98cc7", firstName: "Kit Nicholas", middleName: "Rish", lastName: "Aganan" },
        { _id: "6830d880779e20b64f720f44", firstName: "Kit Nicholas", middleName: "Pascual", lastName: "Caram" },
        { _id: "6835ef1645a2af9158a6d5b7", firstName: "Pia", middleName: "Zop", lastName: "Rey" }
      ];
      
      const matchedParent = fallbackParentProfiles.find(p => p._id === student.parentId);
      if (matchedParent) {
        const middleName = matchedParent.middleName ? ` ${matchedParent.middleName}` : '';
        return `${matchedParent.firstName || ''}${middleName} ${matchedParent.lastName || ''}`.trim();
      }
      
      return `Registered Parent (ID: ${student.parentId.substring(0, 6)}...)`;
    }
    
    // Final fallback
    return "Not specified";
  };

  return (
    <div className="mp-container">
      {/* Header */}
      <div className="mp-header">
        <div className="mp-title-section">
          <h1 className="mp-title">Manage Progress</h1>
          <p className="mp-subtitle">Track student progress, conduct pre-assessments, and assign recommended activities</p>
        </div>

        <div className="mp-search-container">
          <div className="mp-search-wrapper">
            <FaSearch className="mp-search-icon" />
            <input
              type="text"
              placeholder="Search for students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mp-search-input"
            />
          </div>
        </div>
      </div>

      {/* Filters Section - Always visible */}
      <div className="mp-filters-section">
        <div className="mp-filter-row">
          <div className="mp-filter-group">
            <label className="mp-filter-label">
              <FaFilter style={{ marginRight: '0.5rem' }} /> Reading Level:
            </label>
            <div className="mp-select-wrapper">
              <select
                value={readingLevelFilter}
                onChange={(e) => setReadingLevelFilter(e.target.value)}
                className="mp-select"
              >
                <option value="all">All Levels</option>
                {readingLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mp-filter-group">
            <label className="mp-filter-label">
              <FaChalkboardTeacher style={{ marginRight: '0.5rem' }} /> Section:
            </label>
            <div className="mp-select-wrapper">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="mp-select"
              >
                <option value="all">All Sections</option>
                {sections.map((section, index) => (
                  <option key={index} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mp-filter-group">
            <label className="mp-filter-label">
              <FaLayerGroup style={{ marginRight: '0.5rem' }} /> Group By:
            </label>
            <div className="mp-select-wrapper">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="mp-select"
              >
                <option value="none">No Grouping</option>
                <option value="reading">By Reading Level</option>
                <option value="section">By Section</option>
              </select>
            </div>
          </div>

          <div className="mp-filter-group">
            <label className="mp-filter-label">
              <FaSort style={{ marginRight: '0.5rem' }} /> Sort By:
            </label>
            <div className="mp-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="mp-select"
              >
                <option value="name">Name</option>
                <option value="reading">Reading Level</option>
                <option value="progress">Progress</option>
                <option value="recent">Recent Activity</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mp-results-summary">
        <span className="mp-results-count">
          Found: <strong>{filteredStudents.length}</strong> students
        </span>
        <span className="mp-results-sort">
          <FaSortAmountDown style={{ marginRight: '0.5rem' }} /> Sorted by: <strong>{sortBy === 'name' ? 'Name' :
            sortBy === 'reading' ? 'Reading Level' :
              sortBy === 'progress' ? 'Progress' : 'Recent Activity'}</strong>
        </span>
      </div>

      {/* Students Progress Cards */}
      <div className="mp-students-list">
        {loading ? (
          <div className="mp-loading">
            <div className="mp-loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="mp-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="mp-view-details-btn">Try again</button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="mp-no-results">
            <p>No students found matching the filters.</p>
          </div>
        ) : (
          Object.entries(groupedStudents).map(([group, students]) => (
            <div key={group} className="mp-group-section">
              {group !== 'All Students' && (
                <h2 className="mp-group-title">
                  {getReadingLevelIcon(group)} {group} {group !== 'All Students' && readingLevelDescriptions[group] ? `- ${readingLevelDescriptions[group]}` : ''}
                </h2>
              )}

              <div className="mp-cards-grid">
                {students
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map(student => (
                    <div key={student.id} className="mp-student-card">
                      <div className="mp-card-header">
                        <div className="mp-student-avatar">
                          {student.profileImageUrl ? (
                            <S3Image
                              src={student.profileImageUrl}
                              alt={student.name}
                              className="mp-student-avatar__img"
                              fallbackText={student.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()}
                            />
                          ) : (
                            <span className="mp-student-avatar__initials">
                              {student.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Header main section */}
                        <div className="mp-header-main">
                          <div className="mp-student-basic-info">
                            <h3 className="mp-student-name">{student.name}</h3>
                            <span className="mp-student-number">
                              <FaIdCard style={{ marginRight: '0.4rem' }} /> ID: {student.idNumber || student.id}
                            </span>
                          </div>

                          <div className={`mp-reading-level ${getReadingLevelClass(student.readingLevel)}`}>
                            {getReadingLevelIcon(student.readingLevel)} {student.readingLevel}
                          </div>
                        </div>
                      </div>

                      <div className="mp-card-details">
                        <div className="mp-detail-row">
                          <div className="mp-detail-item">
                            <div className="mp-detail-icon">
                              <FaUserGraduate />
                            </div>
                            <span className="mp-detail-text">Grade 1</span>
                          </div>
                          <div className="mp-detail-item">
                            <div className="mp-detail-icon">
                              <FaChild />
                            </div>
                            <span className="mp-detail-text">{student.age} years old</span>
                          </div>
                        </div>

                        {/* Proper positioning of gender and reading level */}
                        <div className="mp-detail-row">
                          <div className="mp-detail-item">
                            <div className="mp-detail-icon">
                              <FaBookReader />
                            </div>
                            <span className="mp-detail-text">
                              {student.readingLevel !== 'Not Assessed'
                                ? readingLevelDescriptions[student.readingLevel] || student.readingLevel
                                : 'Not Assessed'}
                            </span>
                          </div>
                          <div className="mp-detail-item">
                            <div className="mp-detail-icon">
                              {student.gender === "Male" ? (
                                <FaMars />
                              ) : student.gender === "Female" ? (
                                <FaVenus />
                              ) : (
                                <FaGenderless />
                              )}
                            </div>
                            <span className="mp-detail-text">{student.gender || "Not specified"}</span>
                          </div>
                        </div>

                        <div className="mp-section-divider"></div>

                        <div className="mp-assessment-section">
                          <div className="mp-assessment-label">Pre-Assessment Status:</div>
                          <div className="mp-assessment-status">
                            {student.preAssessmentCompleted ? (
                              <span className="mp-assessment-complete">
                                <FaCheck className="mp-status-icon-inner" />
                                <span>Completed</span>
                              </span>
                            ) : (
                              <span className="mp-assessment-incomplete">
                                <span className="mp-status-circle">
                                  <FaTimes className="mp-status-icon-inner" />
                                </span>
                                <span>Not Assessed</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mp-section-divider"></div>

                        <div className="mp-parent-info">
                          <div className="mp-parent-label">Parent or Guardian:</div>
                          <div className="mp-parent-name">{getParentName(student)}</div>
                        </div>

                        <div className="mp-btn-wrapper">
                          <button
                            className="mp-view-details-btn"
                            onClick={() => handleViewDetails(student)}
                          >
                            View Progress Details<FaArrowRight style={{ marginLeft: '0.5rem' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {!loading && !error && filteredStudents.length > 0 && (
          <div className="mp-pagination">
            <div className="mp-pagination-info">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            {totalPages > 1 && (
              <div className="mp-pagination-controls">
                <button
                  className="mp-pagination-arrow"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <FaAngleLeft /> Previous
                </button>

                {getPageNumbers(currentPage, totalPages).map(page => (
                  <button
                    key={page}
                    className={`mp-pagination-number ${page === currentPage ? 'mp-pagination-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page < 10 ? `0${page}` : page}
                  </button>
                ))}

                <button
                  className="mp-pagination-arrow"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FaAngleRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProgress;