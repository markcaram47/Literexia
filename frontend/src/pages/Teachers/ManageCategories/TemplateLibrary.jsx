// src/pages/Teachers/ManageCategories/TemplateLibrary.jsx
import React, { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import QuestionTemplateForm from "./QuestionTemplateForm";
import ChoiceTemplateForm from "./ChoiceTemplateForm";
import SentenceTemplateForm from "./SentenceTemplateForm";
import UnifiedTemplatePreview from "./UnifiedTemplatePreview";
import "../../../css/Teachers/ManageCategories/TemplateLibrary.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faEye, faTrash, faTimes, 
  faExclamationTriangle, faSearch, faCheckCircle,
  faInfoCircle, faLock, faLanguage, faVolumeUp,
  faImage, faFont, faBook, faCheck, faBan,
  faPuzzlePiece, faAsterisk, faFile, faFileAlt, 
  faBookOpen, faComments, faFilter, faArrowRight,
  faClipboardList, faChartLine, faUserGraduate,
  faLayerGroup, faCogs, faBullseye, faUsers,
  faGraduationCap, faSync, faExclamationCircle,
  faCheckDouble, faFileImage, faQuestion, faListAlt,
  faSortAlphaDown, faParagraph, faAlignLeft
} from '@fortawesome/free-solid-svg-icons';
import { 
  createQuestionTemplate, 
  createChoiceTemplate, 
  createSentenceTemplate,
  updateQuestionTemplate,
  updateChoiceTemplate,
  updateSentenceTemplate,
  deleteTemplate
} from '../../../services/Teachers/templateService';

/**
 * Sanitizes corrupted S3 image URLs
 * @param {string} url - The potentially corrupted image URL
 * @returns {string} - The fixed URL or an empty string
 */
const sanitizeImageUrl = (url) => {
  if (!url) return '';
  
  // Check if the URL contains JavaScript code (a sign of corruption)
  if (url.includes('async () =>') || url.includes('function(') || url.includes('=>')) {
    // Extract the filename from the corrupted URL if possible
    const filenameMatch = url.match(/main-assessment\/[^/]*\/([^/]+)/);
    const filename = filenameMatch ? filenameMatch[1] : '';
    
    if (filename) {
      // Reconstruct a valid S3 URL with the extracted filename
      return `https://literexia-bucket.s3.amazonaws.com/main-assessment/sentences/${filename}`;
    } else {
      console.error('Could not parse corrupted image URL:', url);
      return '';
    }
  }
  
  return url;
};

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="tl-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="tl-tooltip-icon" />
    <span className="tl-tooltip-text">{text}</span>
  </div>
);

// Specific tooltip for rejection reasons
const RejectionTooltip = ({ reason }) => (
  <div className="tl-rejection-reason-tooltip">
    <FontAwesomeIcon icon={faExclamationCircle} className="tl-rejection-icon" />
    <span className="tl-tooltip-text">
      <strong>Rejection Reason:</strong><br />
      {reason}
    </span>
  </div>
);

const TemplateLibrary = ({ templates, setTemplates }) => {
  const [nestedTabIndex, setNestedTabIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterChoiceType, setFilterChoiceType] = useState("all");
  const [filterReadingLevel, setFilterReadingLevel] = useState("all");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitConfirmDialogOpen, setIsSubmitConfirmDialogOpen] = useState(false);
  const [isSubmitSuccessDialogOpen, setIsSubmitSuccessDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [tempFormData, setTempFormData] = useState(null);
  const [isPreviewAllDialogOpen, setIsPreviewAllDialogOpen] = useState(false);
  const [previewAllTemplates, setPreviewAllTemplates] = useState([]);
  const [previewAllCurrentIndex, setPreviewAllCurrentIndex] = useState(0);

  // Get detailed template stats for the overview section
  const getDetailedTemplateStats = () => {
    // Count total templates
    const totalTemplates = templates.questionTemplates.length + 
                          templates.choiceTemplates.length + 
                          templates.sentenceTemplates.length;
    
    // Count active templates by type
    const activeQuestions = templates.questionTemplates.filter(t => t.isActive).length;
    const activeChoices = templates.choiceTemplates.filter(t => t.isActive).length;
    const activeSentences = templates.sentenceTemplates.filter(t => t.isActive).length;
    
    // Calculate total active templates
    const totalActive = activeQuestions + activeChoices + activeSentences;
    
    return {
      total: totalTemplates,
      totalActive,
      questions: {
        total: templates.questionTemplates.length,
        active: activeQuestions
      },
      choices: {
        total: templates.choiceTemplates.length,
        active: activeChoices
      },
      sentences: {
        total: templates.sentenceTemplates.length,
        active: activeSentences
      }
    };
  };

  const detailedStats = getDetailedTemplateStats();

  // Get template type based on nested tab index
  const getTemplateType = () => {
    switch (nestedTabIndex) {
      case 0:
        return "question";
      case 1:
        return "choice";
      case 2:
        return "sentence";
      default:
        return "question";
    }
  };

  // Get current templates based on nested tab index
  const getCurrentTemplates = () => {
    switch (nestedTabIndex) {
      case 0:
        return templates.questionTemplates;
      case 1:
        return templates.choiceTemplates;
      case 2:
        return templates.sentenceTemplates;
      default:
        return [];
    }
  };

  // Get template statistics
  const getTemplateStats = () => {
    const currentTemplates = getCurrentTemplates();
    const active = currentTemplates.filter(t => 
      nestedTabIndex === 0 ? t.isActive : 
      nestedTabIndex === 1 ? t.isActive : 
      t.isActive
    ).length;
    
    return {
      total: currentTemplates.length,
      active
    };
  };

  const stats = getTemplateStats();

  // Filter templates based on search and filters
  const filteredTemplates = getCurrentTemplates().filter(template => {
    // Search term filter
    const searchMatch = 
      nestedTabIndex === 0 ? template.templateText?.toLowerCase().includes(searchTerm.toLowerCase()) :
      nestedTabIndex === 1 ? (template.choiceValue || template.soundText || "").toLowerCase().includes(searchTerm.toLowerCase()) :
      template.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const categoryMatch = 
      filterCategory === "all" ? true :
      nestedTabIndex === 0 ? template.category === filterCategory :
      nestedTabIndex === 2 ? template.category === filterCategory :
      true; // Choice templates don't have categories
    
    // Reading level filter
    const readingLevelMatch =
      filterReadingLevel === "all" ? true :
      nestedTabIndex === 2 ? template.readingLevel === filterReadingLevel :
      true;
    
    // Choice type filter
    const choiceTypeMatch = 
      filterChoiceType === "all" ? true :
      nestedTabIndex === 1 ? (
        filterChoiceType === "patinig" ? template.choiceType?.includes("patinig") :
        filterChoiceType === "katinig" ? template.choiceType?.includes("katinig") :
        filterChoiceType === "Letter" ? template.choiceType?.includes("Letter") :
        filterChoiceType === "Sound" ? template.choiceType?.includes("Sound") :
        filterChoiceType === "malapatinigText" ? template.choiceType === "malapatinigText" :
        filterChoiceType === "wordText" ? template.choiceType === "wordText" :
        true
      ) : true;
    
    // Status filter
    const statusMatch = 
      filterStatus === "all" ? true :
      filterStatus === "active" ? (
        nestedTabIndex === 0 ? template.isActive : 
        nestedTabIndex === 1 ? template.isActive : 
        template.isActive
      ) :
      filterStatus === "inactive" ? (
        nestedTabIndex === 0 ? !template.isActive : 
        nestedTabIndex === 1 ? !template.isActive : 
        !template.isActive
      ) : true;
    
    return searchMatch && categoryMatch && statusMatch && choiceTypeMatch && readingLevelMatch;
  });

  // Get unique categories for the current template type
  const getCategories = () => {
    const categories = ["all"];
    if (nestedTabIndex === 0) {
      templates.questionTemplates.forEach(t => {
        if (t.category && !categories.includes(t.category)) {
          categories.push(t.category);
        }
      });
    } else if (nestedTabIndex === 2) {
      templates.sentenceTemplates.forEach(t => {
        if (t.category && !categories.includes(t.category)) {
          categories.push(t.category);
        }
      });
    }
    return categories;
  };

  // Get unique reading levels for sentence templates
  const getReadingLevels = () => {
    const levels = ["all"];
    if (nestedTabIndex === 2) {
      templates.sentenceTemplates.forEach(t => {
        if (t.readingLevel && !levels.includes(t.readingLevel)) {
          levels.push(t.readingLevel);
        }
      });
    }
    return levels;
  };

  // Check if a template can be edited (all templates can be edited)
  const canEditTemplate = (template) => {
    return true;
  };

  // Check if a template can be deleted (all templates can be deleted)
  const canDeleteTemplate = (template) => {
    return true;
  };

  const handleAddTemplate = () => {
    setCurrentTemplate(null);
    setIsFormDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    // Close preview dialog if open
    if (isPreviewAllDialogOpen) {
      setIsPreviewAllDialogOpen(false);
    }
    
    setCurrentTemplate(template);
    setIsFormDialogOpen(true);
  };

  const handlePreviewTemplate = (template) => {
    // Set the previewTemplate state
    setPreviewTemplate(template);
    
    // Use the UnifiedTemplatePreview component
    setPreviewAllTemplates([template]);
    setIsPreviewAllDialogOpen(true);
  };

  const handlePreviewAllTemplates = () => {
    setPreviewAllTemplates(getCurrentTemplates());
    setIsPreviewAllDialogOpen(true);
  };

  const handleNextPreviewAll = () => {
    if (previewAllCurrentIndex < previewAllTemplates.length - 1) {
      setPreviewAllCurrentIndex(previewAllCurrentIndex + 1);
    }
  };

  const handlePrevPreviewAll = () => {
    if (previewAllCurrentIndex > 0) {
      setPreviewAllCurrentIndex(previewAllCurrentIndex - 1);
    }
  };

  const handleDeleteConfirm = (template) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      // Determine template type based on current tab
      const templateType = getTemplateType();
      
      // Call API to delete the template
      await deleteTemplate(templateType, templateToDelete._id);
      
      // Update local state
      const updatedTemplates = { ...templates };
      if (nestedTabIndex === 0) {
        updatedTemplates.questionTemplates = updatedTemplates.questionTemplates.filter(
          t => t._id !== templateToDelete._id
        );
      } else if (nestedTabIndex === 1) {
        updatedTemplates.choiceTemplates = updatedTemplates.choiceTemplates.filter(
          t => t._id !== templateToDelete._id
        );
      } else if (nestedTabIndex === 2) {
        updatedTemplates.sentenceTemplates = updatedTemplates.sentenceTemplates.filter(
          t => t._id !== templateToDelete._id
        );
      }
      
      setTemplates(updatedTemplates);
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert(`Error deleting template: ${error.message}`);
    }
  };

  const handleFormSubmit = (formData) => {
    // Store the form data temporarily
    setTempFormData(formData);
    // Show confirmation dialog
    setIsSubmitConfirmDialogOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!tempFormData) return;
    
    try {
      let result;
      const updatedTemplates = { ...templates };
      
      if (nestedTabIndex === 0) {
        // Question template
        if (currentTemplate) {
          // Update existing template
          result = await updateQuestionTemplate(currentTemplate._id, {
            ...tempFormData,
            isActive: true
          });
          
          // Update local state
          updatedTemplates.questionTemplates = updatedTemplates.questionTemplates.map(
            t => t._id === currentTemplate._id ? result : t
          );
        } else {
          // Add new template
          result = await createQuestionTemplate({
            ...tempFormData,
            isActive: true
          });
          
          // Update local state
          updatedTemplates.questionTemplates = [
            ...updatedTemplates.questionTemplates,
            result
          ];
        }
      } else if (nestedTabIndex === 1) {
        // Choice template
        if (currentTemplate) {
          // Update existing template
          result = await updateChoiceTemplate(currentTemplate._id, {
            ...tempFormData,
            isActive: true
          });
          
          // Update local state
          updatedTemplates.choiceTemplates = updatedTemplates.choiceTemplates.map(
            t => t._id === currentTemplate._id ? result : t
          );
        } else {
          // Add new template
          result = await createChoiceTemplate({
            ...tempFormData,
            isActive: true
          });
          
          // Update local state
          updatedTemplates.choiceTemplates = [
            ...updatedTemplates.choiceTemplates,
            result
          ];
        }
      } else if (nestedTabIndex === 2) {
        // Sentence template
        if (currentTemplate) {
          // Update existing template
          result = await updateSentenceTemplate(currentTemplate._id, {
            ...tempFormData,
            isActive: true
          });
          
          // Update local state
          updatedTemplates.sentenceTemplates = updatedTemplates.sentenceTemplates.map(
            t => t._id === currentTemplate._id ? result : t
          );
        } else {
          // Add new template
          result = await createSentenceTemplate({
            ...tempFormData,
            isActive: true
          });
          
          // Update local state
          updatedTemplates.sentenceTemplates = [
            ...updatedTemplates.sentenceTemplates,
            result
          ];
        }
      }
      
      // Update templates state
      setTemplates(updatedTemplates);
      
      // Close dialogs and reset state
      setIsFormDialogOpen(false);
      setIsSubmitConfirmDialogOpen(false);
      setCurrentTemplate(null);
      setTempFormData(null);
      
      // Show success message
      setIsSubmitSuccessDialogOpen(true);
      
      // Auto close success message after 3 seconds
      setTimeout(() => {
        setIsSubmitSuccessDialogOpen(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      // Handle error (could show an error message)
      alert(`Error saving template: ${error.message}`);
    }
  };

  // Helper to get choice type display name
  const getChoiceTypeDisplayName = (type) => {
    const displayNames = {
      "patinigBigLetter": "Vowel (Uppercase)",
      "patinigSmallLetter": "Vowel (Lowercase)",
      "patinigSound": "Vowel Sound",
      "katinigBigLetter": "Consonant (Uppercase)",
      "katinigSmallLetter": "Consonant (Lowercase)",
      "katinigSound": "Consonant Sound",
      "malapatinigText": "Syllable Block",
      "wordText": "Complete Word",
      "wordSound": "Word Sound"
    };
    return displayNames[type] || type;
  };

  // Helper to get appropriate icon for choice type
  const getChoiceTypeIcon = (type) => {
    if (type?.includes('Sound')) {
      return faVolumeUp;
    } else if (type?.includes('Letter')) {
      return faFont;
    } else if (type?.includes('Text')) {
      return faLanguage;
    } else {
      return faFont;
    }
  };

  // Helper to get simplified question type for display
  const getQuestionTypeDisplay = (type) => {
    if (type === "patinig") return "Vowel (Patinig)";
    if (type === "katinig") return "Consonant (Katinig)";
    if (type === "malapantig") return "Syllable (Malapantig)";
    if (type === "word") return "Word";
    if (type === "sentence") return "Reading Passage";
    return type;
  };

  // Helper to get template status display (active or inactive)
  const getTemplateStatusDisplay = (template) => {
    const isActive = 
      nestedTabIndex === 0 ? template.isActive :
      nestedTabIndex === 1 ? template.isActive :
      template.isActive;
    
    if (isActive) {
      return { icon: faCheckCircle, label: "Active", className: "tl-approved" };
    } else {
      return { icon: faBan, label: "Inactive", className: "tl-rejected" };
    }
  };

  // Helper to get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case "Alphabet Knowledge":
        return faFont;
      case "Phonological Awareness":
        return faVolumeUp;
      case "Decoding":
        return faFile;
      case "Word Recognition":
        return faPuzzlePiece;
      case "Reading Comprehension":
        return faBookOpen;
      default:
        return faFileAlt;
    }
  };

  // Function to get display name for choice types
  const getChoiceTypeDisplay = (choiceType) => {
    if (!choiceType) return "Unknown";
    
    // Format camelCase to Title Case with spaces
    return choiceType
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="template-library">
      <div className="tl-header">
        <h2>
          <FontAwesomeIcon icon={faLayerGroup} />
          Template Library
        </h2>
        <p>Create, manage, and organize templates for student activities.</p>
      </div>
      
      {/* Updated Template Overview Section */}
      <div className="tl-template-overview">
        <div className="tl-overview-header">
          <h3>Template Library Overview</h3>
          <p>View your template creation progress across all categories</p>
        </div>
        
        <div className="tl-overview-stats">
          <div className="tl-stat-card total">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{detailedStats.total}</div>
              <div className="tl-stat-label">Total Templates</div>
            </div>
          </div>
          
          <div className="tl-stat-card active">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{detailedStats.totalActive}</div>
              <div className="tl-stat-label">Active Templates</div>
            </div>
          </div>
          
          <div className="tl-stat-card question">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faQuestion} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{detailedStats.questions.total}</div>
              <div className="tl-stat-label">Question Templates</div>
              <div className="tl-stat-sublabel">{detailedStats.questions.active} Active</div>
            </div>
          </div>
          
          <div className="tl-stat-card choice">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faListAlt} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{detailedStats.choices.total}</div>
              <div className="tl-stat-label">Choice Templates</div>
              <div className="tl-stat-sublabel">{detailedStats.choices.active} Active</div>
            </div>
          </div>
          
          <div className="tl-stat-card sentence">
            <div className="tl-stat-icon">
              <FontAwesomeIcon icon={faAlignLeft} />
            </div>
            <div className="tl-stat-content">
              <div className="tl-stat-number">{detailedStats.sentences.total}</div>
              <div className="tl-stat-label">Sentence Templates</div>
              <div className="tl-stat-sublabel">{detailedStats.sentences.active} Active</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Template Library Process Flow */}
      <div className="tl-process-flow">
        <h3>Template Library Process Flow</h3>
        <div className="tl-flow-steps">
          <div className="tl-flow-step">
            <div className="tl-step-number">1</div>
            <div className="tl-step-content">
              <h4>Create Template</h4>
              <p>Design questions, choices, or sentences</p>
            </div>
          </div>
          
          <div className="tl-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          
          <div className="tl-flow-step">
            <div className="tl-step-number">2</div>
            <div className="tl-step-content">
              <h4>Save & Activate</h4>
              <p>Templates are immediately ready for use</p>
            </div>
          </div>
          
          <div className="tl-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          
          <div className="tl-flow-step">
            <div className="tl-step-number">3</div>
            <div className="tl-step-content">
              <h4>Use in Activities</h4>
              <p>Templates appear in student activities</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create New Button Section */}
      <div className="tl-create-new-section">
        <button className="tl-add-button" onClick={handleAddTemplate}>
          <FontAwesomeIcon icon={faPlus} />
          {nestedTabIndex === 0 ? "Create New Question Template" :
           nestedTabIndex === 1 ? "Create New Choice Template" :
           "Create New Sentence Template"}
        </button>
      </div>

      {/* Nested Tabs (Template Types) */}
      <div className="tl-nested-tabs">
        <div className="tl-nested-tab-list">
          <div 
            className={`tl-nested-tab ${nestedTabIndex === 0 ? 'active' : ''}`}
            onClick={() => {
              setNestedTabIndex(0);
              setSearchTerm("");
              setFilterCategory("all");
              setFilterStatus("all");
              setFilterChoiceType("all");
              setFilterReadingLevel("all");
            }}
          >
            <FontAwesomeIcon icon={faQuestion} />
            <span>Question Templates</span>
            <span className="tl-count">{templates.questionTemplates.length}</span>
          </div>
          
          <div 
            className={`tl-nested-tab ${nestedTabIndex === 1 ? 'active' : ''}`}
            onClick={() => {
              setNestedTabIndex(1);
              setSearchTerm("");
              setFilterCategory("all");
              setFilterStatus("all");
              setFilterChoiceType("all");
              setFilterReadingLevel("all");
            }}
          >
            <FontAwesomeIcon icon={faListAlt} />
            <span>Choice Templates</span>
            <span className="tl-count">{templates.choiceTemplates.length}</span>
          </div>
          
          <div 
            className={`tl-nested-tab ${nestedTabIndex === 2 ? 'active' : ''}`}
            onClick={() => {
              setNestedTabIndex(2);
              setSearchTerm("");
              setFilterCategory("all");
              setFilterStatus("all");
              setFilterChoiceType("all");
              setFilterReadingLevel("all");
            }}
          >
            <FontAwesomeIcon icon={faAlignLeft} />
            <span>Sentence Templates</span>
            <span className="tl-count">{templates.sentenceTemplates.length}</span>
          </div>
        </div>
        
        {/* Enhanced Filters */}
        <div className="tl-filters-container">
          <h4 className="tl-filters-title">
            <FontAwesomeIcon icon={faFilter} /> 
            Filter Templates
          </h4>
          
          <div className="tl-filters">
            <div className="tl-search">
              <FontAwesomeIcon icon={faSearch} className="tl-search-icon" />
              <input 
                type="text" 
                placeholder={`Search ${getTemplateType()} templates...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="tl-clear-search" 
                  onClick={() => setSearchTerm('')}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>
            
            <div className="tl-filter-options">
              <div className="tl-filter">
                <label>Status</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {/* Category filter for question and sentence templates */}
              {(nestedTabIndex === 0 || nestedTabIndex === 2) && (
                <div className="tl-filter">
                  <label>Category</label>
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {getCategories().map((category, index) => (
                      <option key={index} value={category}>{category === "all" ? "All Categories" : category}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Choice type filter (only for choice templates) */}
              {nestedTabIndex === 1 && (
                <div className="tl-filter">
                  <label>Choice Type</label>
                  <select 
                    value={filterChoiceType}
                    onChange={(e) => setFilterChoiceType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                    <option value="textWithImage">Text with Image</option>
                  </select>
                </div>
              )}
              
              {/* Reading level filter (only for sentence templates) */}
              {nestedTabIndex === 2 && (
                <div className="tl-filter">
                  <label>Reading Level</label>
                  <select 
                    value={filterReadingLevel}
                    onChange={(e) => setFilterReadingLevel(e.target.value)}
                  >
                    {getReadingLevels().map((level, index) => (
                      <option key={index} value={level}>{level === "all" ? "All Levels" : level}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <button className="tl-preview-all-btn" onClick={handlePreviewAllTemplates}>
                <FontAwesomeIcon icon={faEye} />
                Preview All {getTemplateType().charAt(0).toUpperCase() + getTemplateType().slice(1)} Templates
              </button>
            </div>
          </div>
        </div>
        
        {/* Template Tables */}
        <div className="tl-template-content">
          {filteredTemplates.length === 0 ? (
            <div className="tl-no-templates">
              <FontAwesomeIcon icon={faFileAlt} className="tl-empty-icon" />
              <h3>No {getTemplateType()} templates found</h3>
              <p>
                {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Try changing your search filters to see more results.'
                  : `You haven't created any ${getTemplateType()} templates yet.`}
              </p>
              {!searchTerm && filterCategory === 'all' && filterStatus === 'all' && (
                <button 
                  className="tl-create-first"
                  onClick={handleAddTemplate}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Create your first {getTemplateType()} template
                </button>
              )}
            </div>
          ) : (
            // Template Table - specific implementation for each tab
            <div className="tl-table">
              {/* Table Headers for Question Templates */}
              {nestedTabIndex === 0 && (
                <>
                  <div className="tl-header-row">
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faQuestion} className="tl-header-icon" />
                      Question
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faLayerGroup} className="tl-header-icon" />
                      Category
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faClipboardList} className="tl-header-icon" />
                      Type
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faCheckCircle} className="tl-header-icon" />
                      Status
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faCogs} className="tl-header-icon" />
                      Actions
                    </div>
                  </div>
                </>
              )}
              
              {/* Table Headers for Choice Templates */}
              {nestedTabIndex === 1 && (
                <>
                  <div className="tl-header-row">
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faListAlt} className="tl-header-icon" />
                      Choice
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faClipboardList} className="tl-header-icon" />
                      Type
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faCheckCircle} className="tl-header-icon" />
                      Status
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faCogs} className="tl-header-icon" />
                      Actions
                    </div>
                  </div>
                </>
              )}
              
              {/* Table Headers for Sentence Templates */}
              {nestedTabIndex === 2 && (
                <>
                  <div className="tl-header-row">
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faAlignLeft} className="tl-header-icon" />
                      Title
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faLayerGroup} className="tl-header-icon" />
                      Category
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faGraduationCap} className="tl-header-icon" />
                      Reading Level
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faCheckCircle} className="tl-header-icon" />
                      Status
                    </div>
                    <div className="tl-header-cell">
                      <FontAwesomeIcon icon={faCogs} className="tl-header-icon" />
                      Actions
                    </div>
                  </div>
                </>
              )}
              
              {/* Render table rows based on template type and filters */}
              {filteredTemplates.map(template => (
                /* Question Template Row */
                nestedTabIndex === 0 ? (
                  <div key={template._id} className="tl-row">
                    <div className="tl-cell tl-question-text">{template.templateText}</div>
                    <div className="tl-cell tl-category">
                      <span className={`tl-category-badge ${template.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        <FontAwesomeIcon icon={getCategoryIcon(template.category)} />
                        {template.category}
                      </span>
                    </div>
                    <div className="tl-cell tl-type">
                      <span className={`tl-type-badge ${template.questionType}`}>
                        {getQuestionTypeDisplay(template.questionType)}
                      </span>
                    </div>
                    <div className="tl-cell tl-status-cell">
                      <span className={`tl-status ${template.isActive ? 'tl-active' : 'tl-inactive'}`}>
                        <FontAwesomeIcon icon={template.isActive ? faCheckCircle : faBan} className="tl-status-icon" />
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="tl-cell tl-actions">
                      <button 
                        className="tl-action-btn tl-edit-btn" 
                        onClick={() => handleEditTemplate(template)}
                        disabled={!canEditTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="tl-action-btn tl-preview-btn"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="tl-action-btn tl-delete-btn"
                        onClick={() => handleDeleteConfirm(template)}
                        disabled={!canDeleteTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ) : 
                /* Choice Template Row */
                nestedTabIndex === 1 ? (
                  <div key={template._id} className="tl-row">
                    <div className="tl-cell tl-choice-preview">
                      {template.choiceType === "soundText" || template.soundText ? (
                        <div className="tl-phonetic">
                          <FontAwesomeIcon icon={faVolumeUp} />
                          {template.soundText || template.choiceValue}
                        </div>
                      ) : (
                        <>
                          {template.choiceValue}
                          {template.choiceImage && (
                            <span className="tl-choice-has-image">
                              <FontAwesomeIcon icon={faImage} />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="tl-cell tl-type">
                      <span className={`tl-type-badge ${template.choiceType.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`}>
                        {getChoiceTypeDisplay(template.choiceType)}
                      </span>
                    </div>
                    <div className="tl-cell tl-status-cell">
                      <span className={`tl-status ${template.isActive ? 'tl-active' : 'tl-inactive'}`}>
                        <FontAwesomeIcon icon={template.isActive ? faCheckCircle : faBan} className="tl-status-icon" />
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="tl-cell tl-actions">
                      <button 
                        className="tl-action-btn tl-edit-btn" 
                        onClick={() => handleEditTemplate(template)}
                        disabled={!canEditTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="tl-action-btn tl-preview-btn"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="tl-action-btn tl-delete-btn"
                        onClick={() => handleDeleteConfirm(template)}
                        disabled={!canDeleteTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Sentence Template Row */
                  <div key={template._id} className="tl-row">
                    <div className="tl-cell tl-sentence-title">{template.title}</div>
                    <div className="tl-cell tl-category">
                      <span className={`tl-category-badge ${template.category.toLowerCase().replace(/\s+/g, '-')}`}>
                        <FontAwesomeIcon icon={getCategoryIcon(template.category)} />
                        {template.category}
                      </span>
                    </div>
                    <div className="tl-cell tl-reading-level">
                      <span className={`tl-type-badge`}>
                        <FontAwesomeIcon icon={faGraduationCap} />
                        {template.readingLevel}
                      </span>
                    </div>
                    <div className="tl-cell tl-status-cell">
                      <span className={`tl-status ${template.isActive ? 'tl-active' : 'tl-inactive'}`}>
                        <FontAwesomeIcon icon={template.isActive ? faCheckCircle : faBan} className="tl-status-icon" />
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="tl-cell tl-actions">
                      <button 
                        className="tl-action-btn tl-edit-btn" 
                        onClick={() => handleEditTemplate(template)}
                        disabled={!canEditTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        className="tl-action-btn tl-preview-btn"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                      <button 
                        className="tl-action-btn tl-delete-btn"
                        onClick={() => handleDeleteConfirm(template)}
                        disabled={!canDeleteTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Dialog */}
      {isFormDialogOpen && (
        <div className="tl-dialog-overlay">
          <div className="tl-dialog tl-form-dialog">
            <div className="tl-dialog-header">
              <h3>
                {currentTemplate ? `Edit ${getTemplateType()} Template` : `Create New ${getTemplateType()} Template`}
              </h3>
              <button 
                className="tl-dialog-close"
                onClick={() => setIsFormDialogOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="tl-dialog-body">
              {nestedTabIndex === 0 && (
                <QuestionTemplateForm 
                  template={currentTemplate}
                  onSave={handleFormSubmit}
                  onCancel={() => setIsFormDialogOpen(false)}
                />
              )}
              {nestedTabIndex === 1 && (
                <ChoiceTemplateForm 
                  template={currentTemplate}
                  onSave={handleFormSubmit}
                  onCancel={() => setIsFormDialogOpen(false)}
                />
              )}
              {nestedTabIndex === 2 && (
                <SentenceTemplateForm 
                  template={currentTemplate}
                  onSave={handleFormSubmit}
                  onCancel={() => setIsFormDialogOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {isSubmitConfirmDialogOpen && (
        <div className="tl-dialog-overlay">
          <div className="tl-dialog tl-confirm-dialog">
            <div className="tl-dialog-header">
              <h3>
                <FontAwesomeIcon icon={faCheckCircle} className="tl-modal-header-icon" />
                Confirm Template Submission
              </h3>
              <button 
                className="tl-dialog-close"
                onClick={() => setIsSubmitConfirmDialogOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="tl-dialog-body">
              <div className="tl-confirm-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="tl-confirm-message">
                <p>Your template will be saved to the library and will be immediately available for use in assessments.</p>
                <p className="tl-confirm-question">Would you like to save this template now?</p>
              </div>
              
              <div className="tl-submission-summary">
                <h4>Template Summary:</h4>
                <div className="tl-summary-details">
                  <div className="tl-summary-item">
                    <span className="tl-summary-label">Type:</span>
                    <span className="tl-summary-value">{getTemplateType()} Template</span>
                  </div>
                  {tempFormData && nestedTabIndex === 0 && (
                    <>
                      <div className="tl-summary-item">
                        <span className="tl-summary-label">Category:</span>
                        <span className="tl-summary-value">{tempFormData.category}</span>
                      </div>
                      <div className="tl-summary-item">
                        <span className="tl-summary-label">Question Type:</span>
                        <span className="tl-summary-value">{getQuestionTypeDisplay(tempFormData.questionType)}</span>
                      </div>
                    </>
                  )}
                  {tempFormData && nestedTabIndex === 1 && (
                    <div className="tl-summary-item">
                      <span className="tl-summary-label">Choice Type:</span>
                      <span className="tl-summary-value">{getChoiceTypeDisplayName(tempFormData.choiceType)}</span>
                    </div>
                  )}
                  {tempFormData && nestedTabIndex === 2 && (
                    <>
                      <div className="tl-summary-item">
                        <span className="tl-summary-label">Title:</span>
                        <span className="tl-summary-value">{tempFormData.title}</span>
                      </div>
                      <div className="tl-summary-item">
                        <span className="tl-summary-label">Reading Level:</span>
                        <span className="tl-summary-value">{tempFormData.readingLevel}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="tl-dialog-footer">
              <button 
                className="tl-dialog-btn tl-cancel-btn"
                onClick={() => setIsSubmitConfirmDialogOpen(false)}
              >
                <FontAwesomeIcon icon={faArrowRight} /> Go Back and Edit
              </button>
              <button 
                className="tl-dialog-btn tl-confirm-btn"
                onClick={handleConfirmSubmit}
              >
                <FontAwesomeIcon icon={faCheckCircle} /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Template Preview Dialog */}
      <UnifiedTemplatePreview 
        isOpen={isPreviewAllDialogOpen}
        onClose={() => setIsPreviewAllDialogOpen(false)}
        templates={previewAllTemplates}
        templateType={getTemplateType()}
        onEditTemplate={handleEditTemplate}
      />

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && templateToDelete && (
        <div className="tl-dialog-overlay">
          <div className="tl-dialog tl-delete-dialog">
            <div className="tl-dialog-header">
              <h3>
                <FontAwesomeIcon icon={faTrash} className="tl-modal-header-icon" />
                Delete Template
              </h3>
              <button 
                className="tl-dialog-close"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="tl-dialog-body">
              <div className="tl-delete-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              
              <div className="tl-delete-message">
                <h4>Are you sure you want to delete this template?</h4>
                <p>
                  This action will permanently remove this template from your library.
                  Any activities using this template may be affected.
                </p>
              </div>
              
              <div className="tl-template-info">
                <p><strong>Template Type:</strong> {getTemplateType()}</p>
                {nestedTabIndex === 0 && (
                  <p><strong>Question:</strong> {templateToDelete.templateText}</p>
                )}
                {nestedTabIndex === 1 && (
                  <p><strong>Choice Value:</strong> {templateToDelete.choiceValue || templateToDelete.soundText}</p>
                )}
                {nestedTabIndex === 2 && (
                  <p><strong>Title:</strong> {templateToDelete.title}</p>
                )}
              </div>
            </div>
            
            <div className="tl-dialog-footer">
              <button
                className="tl-dialog-btn tl-cancel-btn"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
              <button
                className="tl-dialog-btn tl-delete-confirm-btn"
                onClick={handleDelete}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {isSubmitSuccessDialogOpen && (
        <div className="tl-success-notification">
          <div className="tl-success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="tl-success-message">
            <p>Template saved successfully!</p>
            <p className="tl-success-detail">Your template is now available for use in assessments.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;