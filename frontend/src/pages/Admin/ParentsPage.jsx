// src/pages/Admin/ParentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, UserSquare2, BookOpen, Clock, MessageSquare, User, X } from 'lucide-react';
import axios from 'axios';
import Select from 'react-select';
import './ParentsPage.css';

// Success Modal Component
const SuccessModal = ({ message, onClose }) => (
  <div className="admin-parent-modal-overlay">
    <div className="admin-parent-modal">
      <div className="admin-parent-modal-header">
        <h2>Success</h2>
        <button className="admin-parent-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="admin-parent-modal-content">
        <p>{message}</p>
        <button className="admin-parent-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// Validation Error Modal Component
const ValidationErrorModal = ({ message, onClose }) => (
  <div className="admin-parent-modal-overlay">
    <div className="admin-parent-modal">
      <div className="admin-parent-modal-header">
        <h2>Missing Required Fields</h2>
        <button className="admin-parent-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="admin-parent-modal-content">
        <p>{message}</p>
        <button className="admin-parent-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// Credentials Modal Component
const CredentialsModal = ({ credentials, onClose }) => {
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleSendCredentials = async () => {
    try {
      setIsSending(true);
      setSendStatus(null);
      const response = await axios.post('http://localhost:5001/api/admin/send-credentials', {
        email: credentials.email,
        password: credentials.password,
        userType: 'parent'
      });
      if (response.data.success) {
        setSendStatus({ type: 'success', message: 'Credentials sent successfully!' });
      } else {
        setSendStatus({ type: 'error', message: 'Failed to send credentials.' });
      }
    } catch (error) {
      setSendStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send credentials.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-parent-modal-overlay">
      <div className="admin-teacher-modal">
        <div className="admin-teacher-modal-header">
          <h2>Parent Credentials</h2>
          <button className="admin-teacher-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-teacher-credentials-modal-content">
          <p><strong>Email:</strong> {credentials.email}</p>
          <p><strong>Password:</strong> ********</p>
          <p>You can send these credentials to the parent's email.</p>
          {sendStatus && (
            <p className={`admin-teacher-send-status ${sendStatus.type}`}>
              {sendStatus.message}
            </p>
          )}
          <div className="admin-teacher-modal-actions">
            <button 
              className="admin-teacher-send-btn" 
              onClick={handleSendCredentials}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send Login Credentials'}
            </button>
            <button className="admin-teacher-save-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirm Delete Modal Component
const ConfirmDeleteModal = ({ parent, onCancel, onConfirm }) => {
  return (
    <div className="admin-parent-modal-overlay">
      <div className="admin-parent-modal">
        <div className="admin-parent-modal-header">
          <h2>Confirm Delete</h2>
          <button className="admin-parent-modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="admin-parent-confirm-modal-content">
          <p>Are you sure you want to delete this parent?</p>
          <p><strong>{parent.firstName} {parent.lastName}</strong></p>
          <p>This action cannot be undone.</p>
          <div className="admin-parent-confirm-buttons">
            <button className="admin-parent-cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="admin-parent-confirm-delete-btn" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Parent Modal Component
const AddEditParentModal = ({ parent, onClose, onSave, allParents }) => {
  const [formData, setFormData] = useState(
    parent ? { ...parent, children: parent.children || [] } : {
      firstName: '',
      lastName: '',
      middleName: '',
      contact: '',
      profileImage: null,
      address: '',
      civilStatus: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      children: []
    }
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const totalSteps = 3;

  const steps = [
    {
      title: 'Basic Info',
      fields: ['firstName', 'middleName', 'lastName', 'email']
    },
    {
      title: 'Personal Details',
      fields: ['gender', 'dateOfBirth', 'civilStatus', 'contact']
    },
    {
      title: 'Address & Children',
      fields: ['address', 'children', 'profileImage']
    }
  ];

  // Build a set of all linked student IDs (excluding current parent's children)
  const linkedStudentIds = new Set();
  allParents.forEach(p => {
    if (!parent || p._id !== parent._id) {
      (Array.isArray(p.children) ? p.children : []).forEach(id => linkedStudentIds.add(id));
    }
  });

  // Fetch students for children selection
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/admin/manage/students');
        if (response.data.success) {
          setStudents(response.data.data);
        } else {
          console.error("Error fetching students:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching students data:", error);
      }
    };

    fetchStudents();
  }, []);

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    const stepErrors = {};
    let isValid = true;

    // Define required fields for validation (excluding middleName, children, and profileImage)
    const requiredFields = ['firstName', 'lastName', 'email', 'gender', 'dateOfBirth', 'civilStatus', 'contact', 'address'];

    currentFields.forEach(field => {
      if (requiredFields.includes(field)) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          stepErrors[field] = `${getFieldLabel(field)} is required`;
          isValid = false;
        }
        // Add specific validations if needed (e.g., email format)
        if (field === 'email' && formData.email && !validateEmail(formData.email)) {
          stepErrors[field] = `Please enter a valid email address`;
          isValid = false;
        }
      }
    });

    setErrors(stepErrors);
    return isValid;
  };

  // Simple email validation
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
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
    const requiredFields = ['firstName', 'lastName', 'email', 'gender', 'dateOfBirth', 'civilStatus', 'contact', 'address'];

    for (let step = 1; step <= totalSteps; step++) {
      const currentFields = steps[step - 1].fields;
      currentFields.forEach(field => {
        if (requiredFields.includes(field)) {
          if (!formData[field] || formData[field].toString().trim() === '') {
            allErrors[field] = `${getFieldLabel(field)} is required`;
            allStepsValid = false;
          }
          if (field === 'email' && formData.email && !validateEmail(formData.email)) {
            allErrors[field] = `Please enter a valid email address`;
            allStepsValid = false;
          }
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
      console.error('Error saving parent:', error);
      // Handle specific errors if needed, e.g., show a message to the user
      setErrors(prev => ({ ...prev, apiError: error.response?.data?.message || 'Failed to save parent' }));
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
      case 'firstName': return 'First Name';
      case 'middleName': return 'Middle Name';
      case 'lastName': return 'Last Name';
      case 'email': return 'Email';
      case 'contact': return 'Contact Number';
      case 'dateOfBirth': return 'Date of Birth';
      case 'civilStatus': return 'Civil Status';
      case 'gender': return 'Gender';
      case 'address': return 'Address';
      case 'children': return 'Children';
      case 'profileImage': return 'Profile Image';
      default: return field.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const renderFormFields = () => {
    const currentFields = steps[currentStep - 1].fields;
    const requiredFields = ['firstName', 'lastName', 'email', 'gender', 'dateOfBirth', 'civilStatus', 'contact', 'address'];

    return (
      <div className="admin-parent-form-section">
        {currentFields.map(field => {
          const isRequired = requiredFields.includes(field);

          if (field === 'children') {
            return (
              <div key={field} className="admin-parent-form-group full-width">
                <label className="admin-parent-optional">{getFieldLabel(field)} (Optional)</label>
                <div className="admin-parent-children-dropdown">
                  <Select
                    isMulti
                    options={students
                      .filter(student =>
                        !linkedStudentIds.has(student._id) || (formData.children || []).includes(student._id)
                      )
                      .map(student => ({
                        value: student._id,
                        label: `${student.firstName} ${student.lastName} - ID: ${student.idNumber || 'N/A'}`
                      }))}
                    value={(formData.children || []).map(id => {
                      const student = students.find(s => s._id === id);
                      return student ? {
                        value: id,
                        label: `${student.firstName} ${student.lastName} - ID: ${student.idNumber || 'N/A'}`
                      } : null;
                    }).filter(Boolean)}
                    onChange={(selectedOptions) => {
                      setFormData({
                        ...formData,
                        children: selectedOptions.map(option => option.value)
                      });
                    }}
                    placeholder="Select students to link to this parent..."
                    classNamePrefix="react-select"
                  />
                </div>
                {errors[field] && <div className="admin-parent-error-message">{errors[field]}</div>}
              </div>
            );
          }

          if (field === 'profileImage') {
            return (
              <div key={field} className="admin-parent-form-group full-width">
                <label className="admin-parent-optional">Profile Image (Optional)</label>
                <div className="admin-parent-file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="admin-parent-file-input"
                  />
                  <div className="admin-parent-file-input-content">
                    <div className="admin-parent-file-input-icon">📁</div>
                    <div className="admin-parent-file-input-text">
                      {formData.profileImage ? 'Change Image' : 'Upload Image'}
                    </div>
                  </div>
                </div>
                {errors[field] && <div className="admin-parent-error-message">{errors[field]}</div>}
              </div>
            );
          }

          if (field === 'gender') {
            return (
              <div key={field} className="admin-parent-form-group">
                <label className="admin-parent-required">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className={`admin-parent-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <div className="admin-parent-error-message">{errors.gender}</div>}
              </div>
            );
          }

          if (field === 'civilStatus') {
            return (
              <div key={field} className="admin-parent-form-group">
                <label className="admin-parent-required">Civil Status</label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus || ''}
                  onChange={handleChange}
                  className={`admin-parent-input ${errors.civilStatus ? 'error' : ''}`}
                >
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Divorced">Divorced</option>
                </select>
                {errors.civilStatus && <div className="admin-parent-error-message">{errors.civilStatus}</div>}
              </div>
            );
          }

          // Add specific input types for each field
          const inputType = field === 'dateOfBirth' ? 'date' : field === 'email' ? 'email' : field === 'contact' ? 'tel' : 'text';

          return (
            <div key={field} className="admin-parent-form-group">
              <label className={isRequired ? "admin-parent-required" : "admin-parent-optional"}>
                {getFieldLabel(field)} {!isRequired ? '(Optional)' : ''}
              </label>
              <input
                type={inputType}
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
                className={`admin-parent-input ${errors[field] ? 'error' : ''}`}
                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
              />
              {errors[field] && <div className="admin-parent-error-message">{errors[field]}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-parent-modal-overlay">
      <div className="admin-parent-modal">
        <div className="admin-parent-modal-header">
          <h2>{parent ? 'Edit Parent' : 'Add New Parent'}</h2>
          <button className="admin-parent-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="admin-parent-modal-form">
          {/* Progress bar */}
          <div className="admin-parent-progress">
            <div 
              className="admin-parent-progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Steps indicator */}
          <div className="admin-parent-form-steps">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`admin-parent-step ${
                  currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''
                }`}
              >
                <div className="admin-parent-step-circle">
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <div className="admin-parent-step-label">{step.title}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="admin-parent-modal-footer">
              <div className="admin-parent-modal-footer-buttons">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="admin-parent-btn admin-parent-btn-secondary"
                    disabled={isLoading}
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  className={`admin-parent-btn admin-parent-btn-primary ${isLoading ? 'admin-parent-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : currentStep < totalSteps ? 'Next' : (parent ? 'Update Parent' : 'Add Parent')}
                </button>
              </div>
            </div>
            {errors.apiError && <div className="admin-parent-error-message" style={{ textAlign: 'center', marginTop: '10px' }}>{errors.apiError}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

// Parent Profile Modal Component
const ParentProfileModal = ({ parent, viewModalChildren, onClose }) => {
  return (
    <div className="admin-parent-modal-overlay">
      <div className="admin-parent-profile-modal">
        <div className="admin-parent-modal-header">
          <h2>Parent Profile</h2>
          <button className="admin-parent-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="admin-parent-profile-content">
          <div className="admin-parent-profile-avatar">
            {parent.profileImageUrl ? (
              <img 
                src={parent.profileImageUrl} 
                alt={`${parent.firstName} ${parent.lastName}`}
                className="admin-parent-profile-image"
              />
            ) : (
              <User size={64} />
            )}
          </div>
          <h3 className="admin-parent-profile-name">
            {`${parent.firstName} ${parent.middleName ? parent.middleName + ' ' : ''}${parent.lastName}`}
          </h3>
          <div className="admin-parent-profile-details">
            <div className="admin-parent-profile-info">
              <div className="admin-parent-profile-info-item">
                <span className="admin-parent-profile-label">Email</span>
                <span className="admin-parent-profile-value">{parent.email}</span>
              </div>
              <div className="admin-parent-profile-info-item">
                <span className="admin-parent-profile-label">Contact</span>
                <span className="admin-parent-profile-value">{parent.contact || 'N/A'}</span>
              </div>
              <div className="admin-parent-profile-info-item">
                <span className="admin-parent-profile-label">Address</span>
                <span className="admin-parent-profile-value">{parent.address || 'N/A'}</span>
              </div>
              <div className="admin-parent-profile-info-item">
                <span className="admin-parent-profile-label">Date of Birth</span>
                <span className="admin-parent-profile-value">
                  {parent.dateOfBirth ? new Date(parent.dateOfBirth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="admin-parent-profile-info-item">
                <span className="admin-parent-profile-label">Gender</span>
                <span className="admin-parent-profile-value">{parent.gender || 'N/A'}</span>
              </div>
              <div className="admin-parent-profile-info-item">
                <span className="admin-parent-profile-label">Civil Status</span>
                <span className="admin-parent-profile-value">{parent.civilStatus || 'N/A'}</span>
              </div>
            </div>
            
            <div className="admin-parent-profile-children-section">
              <h4 className="admin-parent-profile-section-title">Children</h4>
              {viewModalChildren.length > 0 ? (
                <ul className="admin-parent-profile-children-list">
                  {viewModalChildren.map(child => (
                    <li key={child._id} className="admin-parent-profile-child-item">
                      <div className="admin-parent-profile-child-avatar">
                        {child.profileImageUrl ? (
                          <img 
                            src={child.profileImageUrl} 
                            alt={`${child.firstName} ${child.lastName}`}
                            className="admin-parent-profile-child-image"
                          />
                        ) : (
                          <User size={28} />
                        )}
                      </div>
                      <div className="admin-parent-profile-child-info">
                        <div className="admin-parent-profile-child-name">
                          {child.firstName} {child.middleName ? child.middleName + ' ' : ''}{child.lastName}
                        </div>
                        <div className="admin-parent-profile-child-details">
                          ID: {child.idNumber || 'N/A'} • Section: {child.section || 'N/A'} • Grade: {child.gradeLevel || 'N/A'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-parent-profile-no-children">No children linked to this parent.</p>
              )}
            </div>
          </div>
        </div>
        <div className="admin-parent-profile-actions">
          <button 
            className="admin-parent-close-profile-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ParentListPage Component
const ParentListPage = () => {
  // State for parents data
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [parentsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [error, setError] = useState(null);
  const [viewModalChildren, setViewModalChildren] = useState([]);

  // Fetch parents from database
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/parents');
        if (response.data.success) {
          // Normalize children to always be an array
          const normalizedParents = response.data.data.map(parent => ({
            ...parent,
            children: Array.isArray(parent.children) ? parent.children : (parent.children ? [parent.children] : [])
          }));
          setParents(normalizedParents);
          setFilteredParents(normalizedParents);
        } else {
          console.error("Error fetching parents:", response.data.message);
          setError(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching parents data:", error);
        setError(error.message || "Failed to fetch parents");
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredParents(parents);
    } else {
      const filtered = parents.filter(parent => 
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    }
  }, [searchTerm, parents]);

  // Pagination
  const indexOfLastParent = currentPage * parentsPerPage;
  const indexOfFirstParent = indexOfLastParent - parentsPerPage;
  const currentParents = filteredParents.slice(indexOfFirstParent, indexOfLastParent);
  const totalPages = Math.ceil(filteredParents.length / parentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // View parent profile
  const handleViewProfile = (parent) => {
    setSelectedParent(parent);
    setShowProfileModal(true);
    
    // Fetch children profiles if the parent has children
    if (parent.children && parent.children.length > 0) {
      Promise.all(
        parent.children.map(childId =>
          axios.get(`http://localhost:5001/api/admin/manage/students/${childId}`)
        )
      ).then(responses => {
        setViewModalChildren(responses
          .filter(res => res.data.success)
          .map(res => res.data.data.studentProfile)
        );
      }).catch(error => {
        console.error("Error fetching children:", error);
        setViewModalChildren([]);
      });
    } else {
      setViewModalChildren([]);
    }
  };

  // Edit parent
  const handleEditParent = (parent) => {
    setSelectedParent(parent);
    setShowEditParentModal(true);
  };

  // Delete parent confirmation
  const handleDeleteConfirmation = (parent) => {
    setSelectedParent(parent);
    setShowConfirmDeleteModal(true);
  };

  // Delete parent
  const deleteParent = async () => {
    if (!selectedParent) return;
    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:5001/api/admin/manage/parents/${selectedParent._id}`);
      if (response.data.success) {
        const updatedList = parents.filter(p => p._id !== selectedParent._id);
        setParents(updatedList);
        setFilteredParents(updatedList);
        setShowConfirmDeleteModal(false);
        setSelectedParent(null);
        setSuccessMessage('Parent deleted successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to delete parent');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to delete parent');
    } finally {
      setLoading(false);
    }
  };

  // Add new parent
  const handleAddParent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'children' && Array.isArray(value)) {
            value.forEach(childId => data.append('children[]', childId));
          } else {
            data.append(key, value);
          }
        }
      });
      const response = await axios.post('http://localhost:5001/api/admin/manage/parents', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        // Assuming the backend returns the new parent profile
        setParents([...parents, response.data.data.parentProfile]);
        setFilteredParents([...parents, response.data.data.parentProfile]); // Also update filtered list
        setShowAddParentModal(false);
        
        // Show credentials if they exist
        if (response.data.data.credentials) {
          setNewCredentials(response.data.data.credentials);
          setShowCredentialsModal(true);
        } else {
          setSuccessMessage('Parent added successfully!');
          setShowSuccessModal(true);
        }
      } else {
        // Handle specific backend validation errors if needed
        setValidationError(response.data.message || 'Failed to add parent');
      }
    } catch (error) {
      // Handle network or other errors
      setValidationError(error.response?.data?.message || 'Failed to add parent');
    } finally {
      setLoading(false);
    }
  };

  // Edit parent submission handler
  const handleEditParentSubmit = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'children' && Array.isArray(value)) {
            value.forEach(childId => data.append('children[]', childId));
          } else {
            data.append(key, value);
          }
        }
      });
      const response = await axios.put(`http://localhost:5001/api/admin/manage/parents/${formData._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        // Update the parent in the list with the returned data
        const updatedList = parents.map(p => p._id === formData._id ? response.data.data.parentProfile : p);
        setParents(updatedList);
        setFilteredParents(updatedList); // Also update filtered list
        setShowEditParentModal(false); // Close the edit modal
        setSelectedParent(null); // Clear selected parent
        setSuccessMessage('Parent updated successfully!');
        setShowSuccessModal(true);
      } else {
        // Handle specific backend validation errors if needed
        setValidationError(response.data.message || 'Failed to update parent');
      }
    } catch (error) {
      // Handle network or other errors
      setValidationError(error.response?.data?.message || 'Failed to update parent');
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
      <div className="admin-parent-list-page">
        {/* Header Section */}
        <div className="admin-parent-page-header">
          <div className="admin-parent-title-container">
            <h1>Parent Lists</h1>
            <p className="admin-parent-page-subtitle">Add, View the List of Parents and their Information</p>
          </div>
          <div className="admin-parent-page-image">
            <div className="admin-parent-page-placeholder"></div>
          </div>
        </div>

        <div className="admin-parent-overview-stats">
          <div className="admin-parent-stat-card">
            <h3>Total Parents</h3>
            <p className="admin-parent-stat-number">-</p>
          </div>
          <div className="admin-parent-stat-card">
            <h3>Active Parents</h3>
            <p className="admin-parent-stat-number">-</p>
          </div>
          <div className="admin-parent-stat-card">
            <h3>Parents with Children</h3>
            <p className="admin-parent-stat-number">-</p>
          </div>
        </div>

        <div className="admin-parent-controls-container" style={{ backgroundColor: '#ffffff' }}>
          <div className="admin-parent-search-filter-container">
            <div className="admin-parent-search-box">
              <input
                type="text"
                placeholder="Search parents..."
                disabled
              />
              <Search size={18} />
            </div>
            <button className="admin-parent-filter-button" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="admin-parent-add-button" disabled>
              <Plus size={18} />
              Add Parent
            </button>
          </div>
        </div>

        <div className="admin-parent-table-container" style={{ opacity: 0.6 }}>
          <table className="admin-parent-table">
            <thead>
              <tr>
                <th>Parent Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>View Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((_, index) => (
                <tr key={index}>
                  <td><div className="admin-parent-skeleton-text"></div></td>
                  <td><div className="admin-parent-skeleton-text"></div></td>
                  <td><div className="admin-parent-skeleton-text"></div></td>
                  <td><div className="admin-parent-skeleton-button"></div></td>
                  <td><div className="admin-parent-skeleton-actions"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-parent-error-message">
        <div className="admin-parent-error-icon">⚠️</div>
        <p>Error: {error}</p>
        <button className="admin-parent-btn admin-parent-btn-primary" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-parent-list-page">
      {/* Header Section */}
      <div className="admin-parent-page-header">
        <div className="admin-parent-title-container">
          <h1>Parent Lists</h1>
          <p className="admin-parent-page-subtitle">Add, View the List of Parents and their Information</p>
        </div>
        <div className="admin-parent-page-image">
          {/* This would be replaced with an actual image in production */}
          <div className="admin-parent-page-placeholder"></div>
        </div>
      </div>

      <div className="admin-parent-overview-stats">
        <div className="admin-parent-stat-card">
          <h3>Total Parents</h3>
          <p className="admin-parent-stat-number">{parents.length}</p>
        </div>
        <div className="admin-parent-stat-card">
          <h3>Active Parents</h3>
          <p className="admin-parent-stat-number">{parents.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="admin-parent-stat-card">
          <h3>Parents with Children</h3>
          <p className="admin-parent-stat-number">
            {parents.filter(p => p.children && p.children.length > 0).length}
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="admin-parent-controls-container" style={{ backgroundColor: '#ffffff' }}>
        <div className="admin-parent-search-filter-container">
          <div className="admin-parent-search-box">
            <input
              type="text"
              placeholder="Search parents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} />
          </div>
          <button className="admin-parent-filter-button" onClick={toggleFilters}>
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <select 
            className="admin-parent-sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="recent">Recent Activity</option>
          </select>
          <button 
            className="admin-parent-add-button"
            onClick={() => {
              setShowAddParentModal(true);
              setSelectedParent(null);
            }}
          >
            <Plus size={18} />
            <span>Add Parent</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="admin-parent-filters-panel">
          <div className="admin-parent-filter-group">
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
            className="admin-parent-clear-filters-button"
            onClick={() => {
              setSelectedStatus('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="admin-parent-table-container">
        <table className="admin-parent-table">
          <thead>
            <tr>
              <th>Parent Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentParents.map((parent) => (
              <tr key={parent._id}>
                <td className="admin-parent-name">{`${parent.firstName} ${parent.lastName}`}</td>
                <td>{parent.email}</td>
                <td>{parent.address}</td>
                <td>
                  <button 
                    className="admin-parent-view-btn"
                    onClick={() => handleViewProfile(parent)}
                  >
                    View Profile
                  </button>
                </td>
                <td>
                  <div className="admin-parent-action-buttons">
                    <button className="admin-parent-action-btn edit" onClick={() => handleEditParent(parent)}>
                      <Edit size={16} />
                    </button>
                    <button className="admin-parent-action-btn delete" onClick={() => handleDeleteConfirmation(parent)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredParents.length > parentsPerPage && (
        <div className="admin-parent-pagination">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="admin-parent-pagination-button"
          >
            Previous
          </button>
          <div className="admin-parent-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`admin-parent-page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="admin-parent-pagination-button"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParentModal && (
        <AddEditParentModal
          parent={null}
          onClose={() => setShowAddParentModal(false)}
          onSave={handleAddParent}
          allParents={parents}
        />
      )}

      {/* Edit Parent Modal */}
      {showEditParentModal && selectedParent && (
        <AddEditParentModal
          parent={selectedParent}
          onClose={() => {
            setShowEditParentModal(false);
            setSelectedParent(null);
          }}
          onSave={handleEditParentSubmit}
          allParents={parents}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && selectedParent && (
        <ParentProfileModal
          parent={selectedParent}
          viewModalChildren={viewModalChildren}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedParent(null);
            setViewModalChildren([]);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && selectedParent && (
        <ConfirmDeleteModal
          parent={selectedParent}
          onCancel={() => setShowConfirmDeleteModal(false)}
          onConfirm={deleteParent}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newCredentials && (
        <CredentialsModal
          credentials={newCredentials}
          onClose={() => {
            setShowCredentialsModal(false);
            setNewCredentials(null);
          }}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {/* Validation Error Modal */}
      {validationError && (
        <ValidationErrorModal
          message={validationError}
          onClose={() => setValidationError('')}
        />
      )}
    </div>
  );
};

export default ParentListPage;