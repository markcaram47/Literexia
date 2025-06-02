// src/pages/Admin/StudentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen, Book, Clock, MoreHorizontal, User, X } from 'lucide-react';
import axios from 'axios';
import './StudentListPage.css';

const SuccessModal = ({ message, onClose }) => (
  <div className="studentlist-modal-overlay">
    <div className="studentlist-modal">
      <div className="studentlist-modal-header">
        <h2>Success</h2>
        <button className="studentlist-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="studentlist-modal-form" style={{ textAlign: 'center', padding: '20px' }}>
        <p>{message}</p>
        <div className="studentlist-modal-footer-buttons" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button className="studentlist-save-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  </div>
);

const ValidationErrorModal = ({ message, onClose }) => (
  <div className="studentlist-modal-overlay">
    <div className="studentlist-modal">
      <div className="studentlist-modal-header">
        <h2>Missing Required Fields</h2>
        <button className="studentlist-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="studentlist-modal-content">
        <p>{message}</p>
        <button className="studentlist-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const AddEditStudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    student ? { ...student } : {
      idNumber: '2025', // Consider making this generated or handled by backend
      firstName: '',
      middleName: '',
      lastName: '',
      age: '',
      gender: '',
      gradeLevel: '',
      section: '',
      address: '',
      profileImage: null
    }
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 3; // Define total steps for student form

  const steps = [
    {
      title: 'Basic Info',
      fields: ['idNumber', 'firstName', 'middleName', 'lastName']
    },
    {
      title: 'Personal Details',
      fields: ['age', 'gender']
    },
    {
      title: 'Academic & Contact',
      fields: ['gradeLevel', 'section', 'address', 'profileImage']
    }
  ];

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    const stepErrors = {};
    let isValid = true;

    // Define required fields for validation (excluding middleName and profileImage)
    const requiredFields = ['idNumber', 'firstName', 'lastName', 'age', 'gender', 'gradeLevel', 'section', 'address'];

    currentFields.forEach(field => {
      if (requiredFields.includes(field) && (!formData[field] || formData[field].toString().trim() === '')) {
        stepErrors[field] = `${getFieldLabel(field)} is required`;
        isValid = false;
      }
      // Add specific validations if needed (e.g., age is a number)
      if (field === 'age' && formData.age && isNaN(formData.age)){
        stepErrors[field] = `Age must be a number`;
        isValid = false;
      }
    });

    setErrors(stepErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setErrors({}); // Clear errors when moving to next step
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({}); // Clear errors when moving to previous step
  };

  const handleFinalSubmit = async () => {
     // Validate all steps before final submission
    let allStepsValid = true;
    let allErrors = {};
     const requiredFields = ['idNumber', 'firstName', 'lastName', 'age', 'gender', 'gradeLevel', 'section', 'address'];

    for (let step = 1; step <= totalSteps; step++) {
      const currentFields = steps[step - 1].fields;
      currentFields.forEach(field => {
        if (requiredFields.includes(field) && (!formData[field] || formData[field].toString().trim() === '')) {
          allErrors[field] = `${getFieldLabel(field)} is required`;
          allStepsValid = false;
        }
         if (field === 'age' && formData.age && isNaN(formData.age)){
          allErrors[field] = `Age must be a number`;
          allStepsValid = false;
        }
      });
    }

    if (!allStepsValid) {
      setErrors(allErrors);
      // Optionally, go back to the first step with errors
       for (let step = 1; step <= totalSteps; step++) {
        const currentFields = steps[step - 1].fields;
        const hasErrorInStep = currentFields.some(field => allErrors[field]);
        if (hasErrorInStep) {
          setCurrentStep(step);
          break;
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving student:', error);
      // Handle specific errors if needed, e.g., show a message to the user
       setErrors(prev => ({ ...prev, apiError: error.response?.data?.message || 'Failed to save student' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentStep < totalSteps) {
      handleNext();
    } else {
      handleFinalSubmit();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
     if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
     const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

   const getFieldLabel = (field) => {
    switch(field) {
      case 'idNumber': return 'ID Number';
      case 'firstName': return 'First Name';
      case 'middleName': return 'Middle Name';
      case 'lastName': return 'Last Name';
      case 'age': return 'Age';
      case 'gender': return 'Gender';
      case 'gradeLevel': return 'Grade Level';
      case 'section': return 'Section';
      case 'address': return 'Address';
      case 'profileImage': return 'Profile Image';
      default: return field.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const renderFormFields = () => {
    const currentFields = steps[currentStep - 1].fields;
    const requiredFields = ['idNumber', 'firstName', 'lastName', 'age', 'gender', 'gradeLevel', 'section', 'address'];

    return (
      <div className="studentlist-form-section">
        {currentFields.map(field => {
          const isRequired = requiredFields.includes(field);

          if (field === 'profileImage') {
             return (
              <div key={field} className="studentlist-form-group full-width">
                <label className="studentlist-optional">Profile Image (Optional)</label>
                <div className="studentlist-file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="studentlist-file-input"
                  />
                  <div className="studentlist-file-input-content">
                    <div className="studentlist-file-input-icon">📁</div>
                    <div className="studentlist-file-input-text">
                      {formData.profileImage ? 'Change Image' : 'Upload Image'}
                    </div>
                  </div>
                </div>
                 {errors[field] && <div className="studentlist-error-message">{errors[field]}</div>}
              </div>
            );
          }

          if (field === 'gender') {
             return (
              <div key={field} className="studentlist-form-group">
                <label className="studentlist-required">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`studentlist-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <div className="studentlist-error-message">{errors.gender}</div>}
              </div>
            );
          }

          if (field === 'gradeLevel') {
            return (
              <div key={field} className="studentlist-form-group">
                <label className="studentlist-required">Grade Level</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className={`studentlist-input ${errors.gradeLevel ? 'error' : ''}`}
                >
                  <option value="">Select Grade Level</option>
                  <option value="Grade 1">Grade 1</option>
                </select>
                {errors.gradeLevel && <div className="studentlist-error-message">{errors.gradeLevel}</div>}
              </div>
            );
          }

           if (field === 'section') {
            return (
              <div key={field} className="studentlist-form-group">
                <label className="studentlist-required">Section</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className={`studentlist-input ${errors.section ? 'error' : ''}`}
                >
                  <option value="">Select Section</option>
                  <option value="Honesty">Honesty</option>
                  <option value="Integrity">Integrity</option>
                  <option value="Patience">Patience</option>
                  <option value="Hope">Hope</option>
                </select>
                {errors.section && <div className="studentlist-error-message">{errors.section}</div>}
              </div>
            );
          }

          // Add specific input types for age, gradeLevel, section, address
          const inputType = field === 'age' ? 'number' : 'text';

          return (
            <div key={field} className="studentlist-form-group">
              <label className={isRequired ? "studentlist-required" : "studentlist-optional"}>
                {getFieldLabel(field)} {!isRequired ? '(Optional)' : ''}
              </label>
              <input
                type={inputType}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className={`studentlist-input ${errors[field] ? 'error' : ''}`}
                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
              />
              {errors[field] && <div className="studentlist-error-message">{errors[field]}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="studentlist-modal-overlay">
      <div className="studentlist-modal">
        <div className="studentlist-modal-header">
          <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="studentlist-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="studentlist-modal-form">
          {/* Progress bar */}
          <div className="studentlist-progress">
            <div 
              className="studentlist-progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Steps indicator */}
          <div className="studentlist-form-steps">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`studentlist-step ${
                  currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''
                }`}
              >
                <div className="studentlist-step-circle">
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <div className="studentlist-step-label">{step.title}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="studentlist-modal-footer">
              <div className="studentlist-modal-footer-buttons">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="studentlist-btn studentlist-btn-secondary"
                    disabled={isLoading}
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  className={`studentlist-btn studentlist-btn-primary ${isLoading ? 'studentlist-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : currentStep < totalSteps ? 'Next' : (student ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </div>
              {errors.apiError && <div className="studentlist-error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{errors.apiError}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

const StudentListPage = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState(''); // Keep this for other validations in StudentListPage if any

  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/students');
        if (response.data.success) {
          setStudents(response.data.data);
          setFilteredStudents(response.data.data);
        } else {
          console.error("Error fetching students:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching students data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.idNumber?.toString().includes(searchTerm.toLowerCase()) ||
        student.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  };

  // View student profile
  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  // Edit student (opens the AddEditStudentModal)
  const editStudent = (student) => {
    setSelectedStudent(student);
    setShowEditStudentModal(true); // Use showEditStudentModal state
  };

  // Delete student
  const deleteStudent = async (studentId) => {
    if (!studentId) return;
    try {
      setLoading(true);
              const response = await axios.delete(`http://localhost:5001/api/admin/manage/students/${studentId}`);
      if (response.data.success) {
        const updatedList = students.filter(s => s._id !== studentId);
        setStudents(updatedList);
        setFilteredStudents(updatedList);
        setShowConfirmDeleteModal(false);
        setSelectedStudent(null);
        setSuccessMessage('Student deleted successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to delete student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  // Add new student
  const handleAddStudent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value); // Check for undefined/null
      });
      const response = await axios.post('http://localhost:5001/api/admin/manage/students', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        // Assuming the backend returns the new student profile
        setStudents([...students, response.data.data.studentProfile]);
        setFilteredStudents([...students, response.data.data.studentProfile]); // Also update filtered list
        setShowAddStudentModal(false);
        setSuccessMessage('Student added successfully!');
        setShowSuccessModal(true);
      } else {
        // Handle specific backend validation errors if needed
        setValidationError(response.data.message || 'Failed to add student');
      }
    } catch (error) {
      // Handle network or other errors
      setValidationError(error.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  // Edit student submission handler
  const handleEditStudentSubmit = async (formData) => {
     try {
      setLoading(true);
      const data = new FormData();
       // Append all form data fields
      Object.entries(formData).forEach(([key, value]) => {
         if (value !== undefined && value !== null) data.append(key, value); // Check for undefined/null
      });
      const response = await axios.put(`http://localhost:5001/api/admin/manage/students/${formData._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        // Update the student in the list with the returned data
        const updatedList = students.map(s => s._id === formData._id ? response.data.data.studentProfile : s);
        setStudents(updatedList);
        setFilteredStudents(updatedList); // Also update filtered list
        setShowEditStudentModal(false); // Close the edit modal
        setSelectedStudent(null); // Clear selected student
        setSuccessMessage('Edited Successfully');
        setShowSuccessModal(true);
      } else {
         // Handle specific backend validation errors if needed
        setValidationError(response.data.message || 'Failed to update student');
      }
    } catch (error) {
       // Handle network or other errors
      setValidationError(error.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (loading) {
    return (
      <div className="student-list-page">
        {/* Header Section */}
        <div className="page-header">
          <div className="page-title-container">
            <h1>Student Lists</h1>
            <p className="page-subtitle">Add, View the List of Students and their Information</p>
          </div>
          <div className="page-image">
            <div className="page-placeholder"></div>
          </div>
        </div>

        <div className="overview-stats">
          <div className="stat-card">
            <h3>Total Students</h3>
            <p className="stat-number">-</p>
          </div>
          <div className="stat-card">
            <h3>Active Students</h3>
            <p className="stat-number">-</p>
          </div>
          <div className="stat-card">
            <h3>Average Performance</h3>
            <p className="stat-number">-</p>
          </div>
        </div>

        <div className="controls-container" style={{ backgroundColor: '#ffffff' }}>
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search students..."
                disabled
              />
              <Search size={18} />
            </div>
            <button className="filter-button" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="add-student-button" disabled>
              <Plus size={18} />
              Add Student
            </button>
          </div>
        </div>

        <div className="students-table-container" style={{ opacity: 0.6 }}>
          <table className="students-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Grade</th>
                <th>View Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((_, index) => (
                <tr key={index}>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-button"></div></td>
                  <td><div className="skeleton-actions"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="student-list-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="page-title-container">
          <h1>Student Lists</h1>
          <p className="page-subtitle">Add, View the List of Students and their Information</p>
        </div>
        <div className="page-image">
          {/* This would be replaced with an actual image in production */}
          <div className="page-placeholder"></div>
        </div>
      </div>

      <div className="overview-stats">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{students.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Students</h3>
          <p className="stat-number">{students.filter(s => s.preAssessmentCompleted === true).length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Performance</h3>
          <p className="stat-number">
            {students.length > 0 
              ? `${Math.round(students.reduce((acc, student) => acc + parseInt(student.averageScore), 0) / students.length)}%` 
              : '0%'}
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-container" style={{ backgroundColor: '#ffffff' }}>
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} />
          </div>
          <button className="filter-button" onClick={toggleFilters}>
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <select 
            className="sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="grade-asc">Grade (Low-High)</option>
            <option value="grade-desc">Grade (High-Low)</option>
            <option value="recent">Recent Activity</option>
            <option value="progress">Progress</option>
          </select>
          <button 
            className="add-student-button"
            onClick={() => {
              setShowAddStudentModal(true);
              setSelectedStudent(null);
            }}
          >
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Grade Level:</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">All Grades</option>
              <option value="Grade 1">Grade 1</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button 
            className="clear-filters-button"
            onClick={() => {
              setSelectedGrade('all');
              setSelectedStatus('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Student Name</th>
              <th>Grade Level</th>
              <th>Section</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.idNumber}</td>
                <td className="student-name">{`${student.firstName} ${student.lastName}`}</td>
                <td>{student.gradeLevel}</td>
                <td>{student.section}</td>
                <td>
                  <button 
                    className="students-page-view-btn"
                    onClick={() => handleViewProfile(student)}
                  >
                    View Profile
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="students-table-action-btn edit" onClick={() => {
                      setSelectedStudent(student);
                      setShowEditStudentModal(true);
                    }}>
                      <Edit size={16} />
                    </button>
                    <button className="students-table-action-btn delete" onClick={() => {
                      setSelectedStudent(student);
                      setShowConfirmDeleteModal(true);
                    }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length > studentsPerPage && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="studentlist-modal-overlay">
          <div className="studentlist-profile-modal">
            <div className="studentlist-modal-header">
              <h2>Student Profile</h2>
              <button className="studentlist-modal-close" onClick={() => setShowProfileModal(false)}>×</button>
            </div>
            <div className="studentlist-profile-content">
              <div className="studentlist-profile-avatar">
                {selectedStudent.profileImageUrl ? (
                  <img 
                    src={selectedStudent.profileImageUrl} 
                    alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    className="studentlist-profile-image"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>
              <div className="studentlist-profile-details">
                <h3 className="studentlist-profile-name">
                  {`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                </h3>
                <div className="studentlist-profile-info">
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">ID Number:</span>
                    <span className="studentlist-profile-value">{selectedStudent.idNumber}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Age:</span>
                    <span className="studentlist-profile-value">{selectedStudent.age}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Section:</span>
                    <span className="studentlist-profile-value">{selectedStudent.section}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Grade Level:</span>
                    <span className="studentlist-profile-value">{selectedStudent.gradeLevel}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Gender:</span>
                    <span className="studentlist-profile-value">{selectedStudent.gender}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Address:</span>
                    <span className="studentlist-profile-value">{selectedStudent.address}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Reading Level:</span>
                    <span className="studentlist-profile-value">{selectedStudent.readingLevel || 'N/A'}</span>
                  </div>
                  <div className="studentlist-profile-info-item">
                    <span className="studentlist-profile-label">Reading %:</span>
                    <span className="studentlist-profile-value">{selectedStudent.readingPercentage != null ? selectedStudent.readingPercentage + '%' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="studentlist-profile-actions">
              <button 
                className="studentlist-close-profile-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddEditStudentModal
          student={null}
          onClose={() => setShowAddStudentModal(false)}
          onSave={handleAddStudent}
        />
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && selectedStudent && (
        <AddEditStudentModal
          student={selectedStudent}
          onClose={() => {
            setShowEditStudentModal(false);
            setSelectedStudent(null);
          }}
          onSave={handleEditStudentSubmit}
        />
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && selectedStudent && (
        <div className="studentlist-modal-overlay">
          <div className="studentlist-modal">
            <div className="studentlist-modal-header">
              <h2>Confirm Delete</h2>
              <button className="studentlist-modal-close" onClick={() => setShowConfirmDeleteModal(false)}>×</button>
            </div>
            <div className="studentlist-confirm-modal-content">
              <p>Are you sure you want to delete this student?</p>
              <div className="studentlist-confirm-buttons">
                <button className="studentlist-cancel-btn" onClick={() => setShowConfirmDeleteModal(false)}>Cancel</button>
                <button className="studentlist-confirm-delete-btn" onClick={() => { deleteStudent(selectedStudent._id); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <SuccessModal message={successMessage} onClose={() => setShowSuccessModal(false)} />
      )}
      {validationError && (
        <ValidationErrorModal message={validationError} onClose={() => setValidationError('')} />
      )}
    </div>
  );
};

export default StudentListPage;