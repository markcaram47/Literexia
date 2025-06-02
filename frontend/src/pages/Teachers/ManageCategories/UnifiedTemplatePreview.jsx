import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, faTimes, faSearch, faEdit, 
  faChevronLeft, faChevronRight, faFilter,
  faQuestion, faListAlt, faBook, faCheckCircle,
  faBan, faLayerGroup, faFileAlt, faVolumeUp,
  faImage, faParagraph, faClipboardList, faClipboardCheck
} from '@fortawesome/free-solid-svg-icons';
import "../../../css/Teachers/ManageCategories/TemplateLibrary.css";

const UnifiedTemplatePreview = ({ 
  isOpen, 
  onClose, 
  templates = [], 
  templateType = 'question',
  onEditTemplate
}) => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(1);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChoiceType, setFilterChoiceType] = useState('all');
  const [filterReadingLevel, setFilterReadingLevel] = useState('all');
  
  // Filtered templates
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  
  // Apply filters
  useEffect(() => {
    const filtered = templates.filter(template => {
      // Search term filter
      const searchMatch = 
        templateType === 'question' ? template.templateText?.toLowerCase().includes(searchTerm.toLowerCase()) :
        templateType === 'choice' ? (template.choiceValue || template.soundText || "").toLowerCase().includes(searchTerm.toLowerCase()) :
        template.title?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const categoryMatch = 
        filterCategory === "all" ? true :
        templateType === 'question' ? template.category === filterCategory :
        templateType === 'sentence' ? template.category === filterCategory :
        true; // Choice templates don't have categories
      
      // Reading level filter
      const readingLevelMatch =
        filterReadingLevel === "all" ? true :
        templateType === 'sentence' ? template.readingLevel === filterReadingLevel :
        true;
      
      // Choice type filter
      const choiceTypeMatch = 
        filterChoiceType === "all" ? true :
        templateType === 'choice' ? (
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
        filterStatus === "active" ? template.isActive :
        filterStatus === "inactive" ? !template.isActive : 
        true;
      
      return searchMatch && categoryMatch && statusMatch && choiceTypeMatch && readingLevelMatch;
    });
    
    setFilteredTemplates(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [templates, searchTerm, filterCategory, filterStatus, filterChoiceType, filterReadingLevel, templateType]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  
  // Get unique categories for the current template type
  const getCategories = () => {
    const categories = ["all"];
    if (templateType === 'question' || templateType === 'sentence') {
      templates.forEach(t => {
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
    if (templateType === 'sentence') {
      templates.forEach(t => {
        if (t.readingLevel && !levels.includes(t.readingLevel)) {
          levels.push(t.readingLevel);
        }
      });
    }
    return levels;
  };
  
  // Get unique choice types for choice templates
  const getChoiceTypes = () => {
    const types = ["all"];
    if (templateType === 'choice') {
      templates.forEach(t => {
        if (t.choiceType && !types.includes(t.choiceType)) {
          types.push(t.choiceType);
        }
      });
    }
    return types;
  };
  
  // Get template type icon
  const getTemplateTypeIcon = () => {
    switch(templateType) {
      case 'question':
        return faQuestion;
      case 'choice':
        return faListAlt;
      case 'sentence':
        return faBook;
      case 'assessment':
        return faClipboardList;
      case 'preassessment':
        return faClipboardCheck;
      default:
        return faQuestion;
    }
  };
  
  // Format template type for display
  const getTemplateTypeDisplay = () => {
    if (templateType === 'assessment') {
      return 'Assessment';
    }
    if (templateType === 'preassessment') {
      return 'Pre-Assessment';
    }
    return templateType.charAt(0).toUpperCase() + templateType.slice(1);
  };
  
  // Get question type display name
  const getQuestionTypeDisplay = (type) => {
    switch(type) {
      case 'multipleChoice':
        return 'Multiple Choice';
      case 'imageChoice':
        return 'Image Choice';
      case 'soundChoice': 
        return 'Sound Choice';
      case 'comprehension':
        return 'Comprehension';
      case 'sentence': 
        return 'Sentence';
      default:
        return type;
    }
  };
  
  // Sanitize image URL
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
  
  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Render template content based on type
  const renderTemplateContent = (template) => {
    if (!template) return null;
    
    switch(templateType) {
      case 'question':
        return renderQuestionTemplate(template);
      case 'choice':
        return renderChoiceTemplate(template);
      case 'sentence':
        return renderSentenceTemplate(template);
      case 'assessment':
        return renderAssessmentTemplate(template);
      case 'preassessment':
        return renderPreAssessmentTemplate(template);
      default:
        return <div>Unknown template type</div>;
    }
  };
  
  // Render question template content
  const renderQuestionTemplate = (template) => {
    return (
      <>
        <div className="tl-template-main-content">
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faQuestion} />
              Question Text
            </div>
            <div className="tl-template-property-value highlighted">
              {template.templateText}
            </div>
          </div>
          
          {template.questionType === 'comprehension' && template.passage && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={faParagraph} />
                Passage
              </div>
              <div className="tl-template-property-value">
                {template.passage}
              </div>
            </div>
          )}
          
          {template.questionType === 'comprehension' && template.comprehensionQuestions && template.comprehensionQuestions.length > 0 && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={faQuestion} />
                Comprehension Questions
              </div>
              <div className="tl-template-property-value">
                {template.comprehensionQuestions.map((question, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>Question {index + 1}:</strong> {question.questionText}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="tl-template-meta">
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Category</div>
            <div className="tl-template-meta-value">{template.category || 'N/A'}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Question Type</div>
            <div className="tl-template-meta-value">{getQuestionTypeDisplay(template.questionType)}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Status</div>
            <div className="tl-template-meta-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Render choice template content
  const renderChoiceTemplate = (template) => {
    return (
      <>
        <div className="tl-template-main-content">
          {(template.choiceImage || template.soundFile) && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={template.choiceImage ? faImage : faVolumeUp} />
                {template.choiceImage ? 'Choice Image' : 'Sound File'}
              </div>
              {template.choiceImage ? (
                <div className="tl-template-property-value choice-image">
                  <img src={sanitizeImageUrl(template.choiceImage)} alt="Choice" />
                </div>
              ) : (
                <div className="tl-template-property-value">
                  <audio controls>
                    <source src={template.soundFile} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          )}
          
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faListAlt} />
              {template.choiceValue ? 'Choice Value' : 'Sound Text'}
            </div>
            <div className="tl-template-property-value highlighted">
              {template.choiceValue || template.soundText || 'N/A'}
            </div>
          </div>
        </div>
        
        <div className="tl-template-meta">
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Choice Type</div>
            <div className="tl-template-meta-value">{template.choiceType || 'N/A'}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Is Correct</div>
            <div className="tl-template-meta-value">{template.isCorrect ? 'Yes' : 'No'}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Status</div>
            <div className="tl-template-meta-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Render sentence template content
  const renderSentenceTemplate = (template) => {
    return (
      <>
        <div className="tl-template-main-content">
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faFileAlt} />
              Title
            </div>
            <div className="tl-template-property-value highlighted">
              {template.title}
            </div>
          </div>
          
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faParagraph} />
              Content
            </div>
            <div className="tl-template-property-value">
              {template.content}
            </div>
          </div>
          
          {template.sentenceImage && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={faImage} />
                Sentence Image
              </div>
              <div className="tl-template-property-value choice-image">
                <img src={sanitizeImageUrl(template.sentenceImage)} alt="Sentence" />
              </div>
            </div>
          )}
          
          {template.sentenceQuestions && template.sentenceQuestions.length > 0 && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={faQuestion} />
                Questions
              </div>
              <div className="tl-template-property-value">
                {template.sentenceQuestions.map((question, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>Question {question.questionNumber || index + 1}:</strong> {question.questionText}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="tl-template-meta">
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Category</div>
            <div className="tl-template-meta-value">{template.category || 'N/A'}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Reading Level</div>
            <div className="tl-template-meta-value">{template.readingLevel || 'N/A'}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Status</div>
            <div className="tl-template-meta-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Render assessment template content
  const renderAssessmentTemplate = (template) => {
    return (
      <>
        <div className="tl-template-main-content">
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faBook} />
              Reading Level
            </div>
            <div className="tl-template-property-value highlighted">
              {template.readingLevel}
            </div>
          </div>
          
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faLayerGroup} />
              Category
            </div>
            <div className="tl-template-property-value">
              {template.category}
            </div>
          </div>
          
          {template.questions && template.questions.length > 0 && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={faQuestion} />
                Questions ({template.questions.length})
              </div>
              <div className="tl-template-property-value">
                {template.questions.slice(0, 3).map((question, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>Question {index + 1}:</strong> {question.questionText}
                  </div>
                ))}
                {template.questions.length > 3 && (
                  <div className="tl-more-questions">
                    + {template.questions.length - 3} more questions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="tl-template-meta">
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Total Questions</div>
            <div className="tl-template-meta-value">{template.questions ? template.questions.length : 0}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Last Updated</div>
            <div className="tl-template-meta-value">
              {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Status</div>
            <div className="tl-template-meta-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  // Render pre-assessment template content
  const renderPreAssessmentTemplate = (template) => {
    return (
      <>
        <div className="tl-template-main-content">
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faClipboardCheck} />
              Title
            </div>
            <div className="tl-template-property-value highlighted">
              {template.title}
            </div>
          </div>
          
          <div className="tl-template-property">
            <div className="tl-template-property-label">
              <FontAwesomeIcon icon={faFileAlt} />
              Description
            </div>
            <div className="tl-template-property-value">
              {template.description}
            </div>
          </div>
          
          {template.questions && template.questions.length > 0 && (
            <div className="tl-template-property">
              <div className="tl-template-property-label">
                <FontAwesomeIcon icon={faQuestion} />
                Questions ({template.questions.length})
              </div>
              <div className="tl-template-property-value">
                {template.questions.slice(0, 3).map((question, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <strong>Question {index + 1}:</strong> {question.questionText}
                  </div>
                ))}
                {template.questions.length > 3 && (
                  <div className="tl-more-questions">
                    + {template.questions.length - 3} more questions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="tl-template-meta">
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Language</div>
            <div className="tl-template-meta-value">{template.language === "FL" ? "Filipino" : "English"}</div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Last Updated</div>
            <div className="tl-template-meta-value">
              {template.lastUpdated ? new Date(template.lastUpdated).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="tl-template-meta-item">
            <div className="tl-template-meta-label">Status</div>
            <div className="tl-template-meta-value">
              {template.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="tl-dialog-overlay">
      <div className="tl-dialog tl-unified-preview-dialog">
        {/* Header */}
        <div className="tl-unified-preview-header">
          <div className="tl-unified-preview-title">
            <FontAwesomeIcon icon={faEye} />
            <h3>
              {getTemplateTypeDisplay()} Templates
              {filteredTemplates.length > 0 && 
                <span style={{ marginLeft: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                  ({currentPage} of {totalPages})
                </span>
              }
            </h3>
          </div>
          <button 
            className="tl-dialog-close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Filter Bar */}
        <div className="tl-unified-preview-filter-bar">
          <div className="tl-unified-filter-group">
            <FontAwesomeIcon icon={faFilter} style={{ color: '#6b7280' }} />
            
            {/* Status Filter - Available for all template types */}
            <div className="tl-unified-filter">
              <label>Status:</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            {/* Category Filter - Available for question and sentence templates */}
            {(templateType === 'question' || templateType === 'sentence') && (
              <div className="tl-unified-filter">
                <label>Category:</label>
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {getCategories().map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Reading Level Filter - Available for sentence templates */}
            {templateType === 'sentence' && (
              <div className="tl-unified-filter">
                <label>Reading Level:</label>
                <select 
                  value={filterReadingLevel} 
                  onChange={(e) => setFilterReadingLevel(e.target.value)}
                >
                  {getReadingLevels().map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Choice Type Filter - Available for choice templates */}
            {templateType === 'choice' && (
              <div className="tl-unified-filter">
                <label>Choice Type:</label>
                <select 
                  value={filterChoiceType} 
                  onChange={(e) => setFilterChoiceType(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="patinig">Patinig</option>
                  <option value="katinig">Katinig</option>
                  <option value="Letter">Letter</option>
                  <option value="Sound">Sound</option>
                  <option value="malapatinigText">Malapatinig</option>
                  <option value="wordText">Word</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Search */}
          <div className="tl-unified-search">
            <input 
              type="text" 
              placeholder={`Search ${getTemplateTypeDisplay()} templates...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FontAwesomeIcon icon={faSearch} className="tl-unified-search-icon" />
          </div>
        </div>
        
        {/* Content */}
        <div className="tl-unified-preview-content">
          {filteredTemplates.length > 0 ? (
            <div className="tl-template-preview-container">
              {currentItems.map((template, index) => (
                <div key={index} className="tl-template-card">
                  <div className="tl-template-card-header">
                    <div className="tl-template-card-title">
                      <FontAwesomeIcon icon={getTemplateTypeIcon()} />
                      {templateType === 'question' ? 'Question Template' : 
                       templateType === 'choice' ? 'Choice Template' : 
                       templateType === 'sentence' ? 'Sentence Template' : 
                       templateType === 'assessment' ? 'Assessment Template' :
                       'Pre-Assessment Template'}
                    </div>
                    <div className="tl-template-card-actions">
                      <button 
                        className="tl-template-card-action"
                        onClick={() => onEditTemplate(template)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  </div>
                  <div className="tl-template-card-content">
                    {renderTemplateContent(template)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tl-no-templates">
              No templates found.
            </div>
          )}
        </div>
        
        {/* Pagination */}
        <div className="tl-pagination">
          <button 
            className="tl-pagination-button"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <span>{currentPage} of {totalPages}</span>
          <button 
            className="tl-pagination-button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTemplatePreview;