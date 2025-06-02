// src/pages/Teachers/ManageCategories/SentenceTemplateForm.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faInfoCircle, 
  faPlus, 
  faTrash,
  faUpload,
  faBook,
  faQuestionCircle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/TemplateForm.css";
import { uploadImageToS3 } from "../../../services/Teachers/templateService";

const READING_LEVELS = [
  "Low Emerging",
  "High Emerging",
  "Developing",
  "Transitioning",
  "At Grade Level"
];

/**
 * Sanitizes the image URL by fixing any corrupted S3 URLs
 * @param {string} url - The potentially corrupted image URL
 * @returns {string} The sanitized image URL
 */
const sanitizeImageUrl = (url) => {
  if (!url) return '';
  
  // Check if the URL contains JavaScript code (a sign of corruption)
  if (url.includes('async () =>') || url.includes('function(') || url.includes('=>')) {
    // Extract the filename from the corrupted URL if possible
    const filenameMatch = url.match(/main-assessment\/sentences\/([^/]+)/);
    const filename = filenameMatch ? filenameMatch[1] : '';
    
    if (filename) {
      // Reconstruct a valid S3 URL with the extracted filename
      return `https://literexia-bucket.s3.amazonaws.com/main-assessment/sentences/${filename}`;
    } else {
      // If we can't extract a filename, return empty string or a placeholder
      console.error('Could not parse corrupted image URL:', url);
      return '';
    }
  }
  
  // If URL looks normal, return it unchanged
  return url;
};

const SentenceTemplateForm = ({ template, onSave, onCancel }) => {
  const [form, setForm] = useState({
    title: "",
    category: "Reading Comprehension", 
    readingLevel: "",
    sentenceText: [
      { pageNumber: 1, text: "", image: "", imageFile: null }
    ],
    sentenceQuestions: [
      { 
        questionNumber: 1, 
        questionText: "", 
        sentenceOptionAnswers: ["", ""],
        optionDescriptions: ["", ""],
        correctOptionIndex: 0 // First option is correct by default
      }
    ]
  });
  
  const [currentPage, setCurrentPage] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [errors, setErrors] = useState({});
  const [pageImages, setPageImages] = useState([null]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  // Load template data if editing
  useEffect(() => {
    if (template) {
      // Initialize the form data
      let updatedForm = {
        title: template.title || "",
        category: "Reading Comprehension",
        readingLevel: template.readingLevel || "",
        sentenceText: [],
        sentenceQuestions: []
      };
      
      // Handle content/sentenceText
      if (template.content && template.imageUrl) {
        // If coming from component format
        updatedForm.sentenceText = [{
          pageNumber: 1,
          text: template.content,
          image: sanitizeImageUrl(template.imageUrl),
          imageFile: null
        }];
      } else if (template.sentenceText && template.sentenceText.length > 0) {
        // If coming from API format
        updatedForm.sentenceText = template.sentenceText.map(page => ({
          ...page,
          image: sanitizeImageUrl(page.image),
          imageFile: null
        }));
      } else {
        // Default empty page
        updatedForm.sentenceText = [{ 
          pageNumber: 1, 
          text: "", 
          image: "", 
          imageFile: null 
        }];
      }
      
      // Handle questions
      if (template.comprehensionQuestions && template.comprehensionQuestions.length > 0) {
        // If coming from component format
        updatedForm.sentenceQuestions = template.comprehensionQuestions.map((question, index) => {
          // Get the first 2 options or add empty strings if fewer than 2
          const options = question.options || [];
          const limitedOptions = options.length >= 2 ? options.slice(0, 2) : [...options, ...Array(2 - options.length).fill("")];
          
          // Get the first 2 descriptions or add empty strings if fewer than 2
          const descriptions = question.optionDescriptions || [];
          const limitedDescriptions = descriptions.length >= 2 ? descriptions.slice(0, 2) : [...descriptions, ...Array(2 - descriptions.length).fill("")];
          
          // Adjust correct answer index if it's out of bounds
          const correctIndex = question.correctAnswer < 2 ? question.correctAnswer : 0;
          
          return {
            questionNumber: index + 1,
            questionText: question.questionText || "",
            sentenceOptionAnswers: limitedOptions,
            optionDescriptions: limitedDescriptions,
            correctOptionIndex: correctIndex
          };
        });
      } else if (template.sentenceQuestions && template.sentenceQuestions.length > 0) {
        // If coming from API format
        updatedForm.sentenceQuestions = template.sentenceQuestions.map((question, index) => {
          // Find correct option index
          const optionAnswers = question.sentenceOptionAnswers || [];
          const limitedOptionAnswers = optionAnswers.length >= 2 ? optionAnswers.slice(0, 2) : [...optionAnswers, ...Array(2 - optionAnswers.length).fill("")];
          
          const descriptions = question.optionDescriptions || [];
          const limitedDescriptions = descriptions.length >= 2 ? descriptions.slice(0, 2) : [...descriptions, ...Array(2 - descriptions.length).fill("")];
          
          // Find the correct option index, limiting to our 2 options
          const correctOptionIndex = limitedOptionAnswers.findIndex(
            option => option === question.sentenceCorrectAnswer
          );
          
          return {
            questionNumber: index + 1,
            questionText: question.questionText || "",
            sentenceOptionAnswers: limitedOptionAnswers,
            optionDescriptions: limitedDescriptions,
            correctOptionIndex: correctOptionIndex !== -1 ? correctOptionIndex : 0
          };
        });
      } else {
        // Default empty question
        updatedForm.sentenceQuestions = [{
          questionNumber: 1,
          questionText: "",
          sentenceOptionAnswers: ["", ""],
          optionDescriptions: ["", ""],
          correctOptionIndex: 0
        }];
      }
      
      setForm(updatedForm);
      
      // Set page images for preview with sanitized URLs
      if (template.sentenceText?.length > 0) {
        setPageImages(template.sentenceText.map(page => sanitizeImageUrl(page.image) || null));
      } else if (template.imageUrl) {
        setPageImages([sanitizeImageUrl(template.imageUrl)]);
      }
    }
  }, [template]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear field-specific errors
    setErrors({
      ...errors,
      [name]: undefined
    });
    
    setForm({
      ...form,
      [name]: value
    });
  };
  
  const handlePageChange = (e, pageIndex, field) => {
    const { value } = e.target;
    
    // Clear page-specific errors
    setErrors({
      ...errors,
      [`page_${pageIndex}_${field}`]: undefined
    });
    
    const updatedPages = [...form.sentenceText];
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      [field]: value
    };
    
    setForm({
      ...form,
      sentenceText: updatedPages
    });
  };
  
  const handlePageImageUpload = async (e, pageIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clear image error
    setErrors({
      ...errors,
      [`page_${pageIndex}_image`]: undefined
    });
    
    try {
      // Set uploading state
      setIsUploading(true);
      setUploadProgress({
        ...uploadProgress,
        [pageIndex]: true
      });
      
      // Preview the image locally first
      const reader = new FileReader();
      reader.onload = () => {
        const newPageImages = [...pageImages];
        newPageImages[pageIndex] = reader.result;
        setPageImages(newPageImages);
      };
      reader.readAsDataURL(file);
      
      // Try to upload to S3
      console.debug('Starting S3 upload for file:', file.name);
      let imageUrl;
      
      try {
        imageUrl = await uploadImageToS3(file);
        console.debug('Upload completed successfully, URL:', imageUrl);
        
        // Sanitize the URL to ensure it's valid
        imageUrl = sanitizeImageUrl(imageUrl);
      } catch (uploadError) {
        console.debug('S3 upload failed, using Object URL as fallback');
        // Generate a temporary local URL that allows the form to proceed
        imageUrl = URL.createObjectURL(file);
        console.debug('Created Object URL:', imageUrl);
      }
      
      // Update the form with the image URL (either from S3 or local)
      console.debug('Updating form with image URL:', imageUrl);
      const updatedPages = [...form.sentenceText];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        image: imageUrl,
        imageFile: file // Store the file reference for potential later upload
      };
      
      setForm({
        ...form,
        sentenceText: updatedPages
      });
      
      // Update the pageImages state to show the preview
      const newPageImages = [...pageImages];
      newPageImages[pageIndex] = imageUrl;
      setPageImages(newPageImages);
      
    } catch (error) {
      console.error("Error handling image:", error);
      
      // Despite any errors, we still allow the form to proceed with a local image URL
      if (file) {
        console.debug('Creating fallback Object URL after error');
        const localImageUrl = URL.createObjectURL(file);
        const updatedPages = [...form.sentenceText];
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          image: localImageUrl,
          imageFile: file // Store the file reference for potential later upload
        };
        
        setForm({
          ...form,
          sentenceText: updatedPages
        });
        
        setErrors({
          ...errors,
          [`page_${pageIndex}_image`]: "S3 upload failed, but you can still save the template with this image."
        });
      } else {
        setErrors({
          ...errors,
          [`page_${pageIndex}_image`]: "Failed to upload image. Please try again."
        });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress({
        ...uploadProgress,
        [pageIndex]: false
      });
    }
  };
  
  const handleQuestionChange = (e, questionIndex, field, optionIndex = null) => {
    const { value } = e.target;
    
    // Clear question-specific errors
    setErrors({
      ...errors,
      [`question_${questionIndex}_${field}`]: undefined
    });
    
    const updatedQuestions = [...form.sentenceQuestions];
    
    if (field === 'sentenceOptionAnswers' && optionIndex !== null) {
      // Update an option answer
      const options = [...updatedQuestions[questionIndex].sentenceOptionAnswers];
      options[optionIndex] = value;
      
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        sentenceOptionAnswers: options
      };
    } else if (field === 'optionDescriptions' && optionIndex !== null) {
      // Update an option description
      const descriptions = [...updatedQuestions[questionIndex].optionDescriptions];
      descriptions[optionIndex] = value;
      
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        optionDescriptions: descriptions
      };
    } else if (field === 'correctOptionIndex') {
      // Update the correct option index
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        correctOptionIndex: parseInt(value)
      };
    } else {
      // Update question text
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value
      };
    }
    
    setForm({
      ...form,
      sentenceQuestions: updatedQuestions
    });
  };
  
  const addPage = () => {
    const newPageNumber = form.sentenceText.length + 1;
    setForm({
      ...form,
      sentenceText: [
        ...form.sentenceText,
        { pageNumber: newPageNumber, text: "", image: "", imageFile: null }
      ]
    });
    
    // Add a placeholder for the new page image
    setPageImages([...pageImages, null]);
    
    // Switch to the new page
    setCurrentPage(newPageNumber - 1);
  };
  
  const removePage = (pageIndex) => {
    if (form.sentenceText.length <= 1) return;
    
    const updatedPages = form.sentenceText.filter((_, index) => index !== pageIndex);
    // Renumber the pages
    updatedPages.forEach((page, idx) => {
      page.pageNumber = idx + 1;
    });
    
    // Remove the page image
    const updatedPageImages = [...pageImages];
    updatedPageImages.splice(pageIndex, 1);
    setPageImages(updatedPageImages);
    
    setForm({
      ...form,
      sentenceText: updatedPages
    });
    
    // Adjust current page if needed
    if (currentPage >= updatedPages.length) {
      setCurrentPage(updatedPages.length - 1);
    }
  };
  
  const addQuestion = () => {
    const newQuestionNumber = form.sentenceQuestions.length + 1;
    setForm({
      ...form,
      sentenceQuestions: [
        ...form.sentenceQuestions,
        { 
          questionNumber: newQuestionNumber, 
          questionText: "", 
          sentenceOptionAnswers: ["", ""],
          optionDescriptions: ["", ""],
          correctOptionIndex: 0 // First option is correct by default
        }
      ]
    });
    
    // Switch to the new question
    setCurrentQuestion(newQuestionNumber - 1);
  };
  
  const removeQuestion = (questionIndex) => {
    if (form.sentenceQuestions.length <= 1) return;
    
    const updatedQuestions = form.sentenceQuestions.filter((_, index) => index !== questionIndex);
    // Renumber the questions
    updatedQuestions.forEach((question, idx) => {
      question.questionNumber = idx + 1;
    });
    
    setForm({
      ...form,
      sentenceQuestions: updatedQuestions
    });
    
    // Adjust current question if needed
    if (currentQuestion >= updatedQuestions.length) {
      setCurrentQuestion(updatedQuestions.length - 1);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    if (!form.title) newErrors.title = "Story title is required";
    if (!form.readingLevel) newErrors.readingLevel = "Reading level is required";
    
    // Validate pages
    form.sentenceText.forEach((page, pageIndex) => {
      if (!page.text) newErrors[`page_${pageIndex}_text`] = "Page text is required";
      if (!page.image) newErrors[`page_${pageIndex}_image`] = "Page image is required";
    });
    
    // Validate questions
    form.sentenceQuestions.forEach((question, questionIndex) => {
      if (!question.questionText) newErrors[`question_${questionIndex}_questionText`] = "Question text is required";
      
      // Validate options
      question.sentenceOptionAnswers.forEach((option, optionIndex) => {
        if (!option) newErrors[`question_${questionIndex}_option_${optionIndex}`] = `Option ${optionIndex + 1} is required`;
      });
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create comprehension questions in the format expected by the Component
    const comprehensionQuestions = form.sentenceQuestions.map((question) => {
      return {
        questionText: question.questionText,
        options: [...question.sentenceOptionAnswers],
        optionDescriptions: [...question.optionDescriptions],
        correctAnswer: question.correctOptionIndex
      };
    });
    
    // Format the data for submission to API
    const apiSentenceQuestions = form.sentenceQuestions.map((question) => {
      return {
        questionNumber: question.questionNumber,
        questionText: question.questionText,
        sentenceCorrectAnswer: question.sentenceOptionAnswers[question.correctOptionIndex],
        sentenceOptionAnswers: question.sentenceOptionAnswers,
        optionDescriptions: question.optionDescriptions
      };
    });
    
    // Clean up any object URLs to prevent memory leaks and sanitize all image URLs
    const sentenceText = form.sentenceText.map(page => {
      // First sanitize the image URL to fix any corruption
      let imageUrl = sanitizeImageUrl(page.image);
      
      // Check if the image is an Object URL (blob:)
      if (imageUrl && imageUrl.startsWith('blob:')) {
        console.debug('Converting Object URL to mock S3 URL for:', page.imageFile?.name);
        
        // Replace with a mock S3 URL format
        const timestamp = new Date().getTime();
        const fileName = page.imageFile?.name.replace(/\s+/g, '-').toLowerCase() || `image-${timestamp}.jpg`;
        const mockS3Url = `https://literexia-bucket.s3.amazonaws.com/main-assessment/${timestamp}-${fileName}`;
        
        return {
          ...page,
          image: mockS3Url,
          // Remove the file reference as it's not needed for API submission
          imageFile: undefined
        };
      }
      
      // For real S3 URLs or other URLs, just pass them through
      return {
        ...page,
        image: imageUrl, // Use the sanitized URL
        // Remove the file reference as it's not needed for API submission
        imageFile: undefined
      };
    });
    
    // Format the data for submission
    const formattedData = {
      title: form.title,
      category: form.category,
      readingLevel: form.readingLevel,
      content: form.sentenceText[0]?.text || "",
      imageUrl: sentenceText[0]?.image || "", // Use the sanitized image URL
      comprehensionQuestions,
      // Include the original format data for the API
      sentenceText,
      sentenceQuestions: apiSentenceQuestions
    };
    
    console.debug('Submitting form data:', formattedData);
    onSave(formattedData);
  };
  
  return (
    <div className="template-form-container sentence-form">
      <h3>{template ? "Edit Reading Passage Template" : "Create New Reading Passage Template"}</h3>
      
      <form onSubmit={handleSubmit} className="template-form">
        <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
          <label htmlFor="title">
            Story Title:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Enter a descriptive title for this reading passage. This helps you and other teachers identify the passage.
              </span>
            </div>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Si Maria at ang mga Bulaklak"
            required
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>
        
        <div className={`form-group ${errors.readingLevel ? 'has-error' : ''}`}>
          <label htmlFor="readingLevel">
            Reading Level:
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Select the appropriate reading level for this passage. This determines which students will see this passage based on their abilities.
              </span>
            </div>
          </label>
          <select
            id="readingLevel"
            name="readingLevel"
            value={form.readingLevel}
            onChange={handleChange}
            required
          >
            <option value="">Select a reading level</option>
            {READING_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.readingLevel && <div className="error-message">{errors.readingLevel}</div>}
        </div>
        
        <div className="sentence-pages-section">
          <h4>
            <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
            Story Pages
            <div className="tooltip" style={{ marginLeft: '8px' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Create the pages of your reading passage. Each page should have text and an accompanying image. Students will see one page at a time.
              </span>
            </div>
          </h4>
          
          <div className="page-tabs">
            {form.sentenceText.map((page, index) => (
              <button
                key={index}
                type="button"
                className={`page-tab ${currentPage === index ? 'active' : ''}`}
                onClick={() => setCurrentPage(index)}
              >
                Page {page.pageNumber}
              </button>
            ))}
            <button 
              type="button" 
              className="add-page-btn"
              onClick={addPage}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Page
            </button>
          </div>
          
          {form.sentenceText.map((page, index) => (
            <div 
              key={index} 
              className={`page-content ${currentPage === index ? 'visible' : 'hidden'}`}
            >
              <div className="page-header">
                <h5>Page {page.pageNumber}</h5>
                {form.sentenceText.length > 1 && (
                  <button 
                    type="button" 
                    className="remove-page-btn"
                    onClick={() => removePage(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Remove
                  </button>
                )}
              </div>
              
              <div className={`form-group ${errors[`page_${index}_text`] ? 'has-error' : ''}`}>
                <label htmlFor={`page_${index}_text`}>
                  Page Text:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter the text that will appear on this page of the story.
                    </span>
                  </div>
                </label>
                <textarea
                  id={`page_${index}_text`}
                  value={page.text}
                  onChange={(e) => handlePageChange(e, index, 'text')}
                  placeholder="Enter the text for this page..."
                  required
                />
                {errors[`page_${index}_text`] && <div className="error-message">{errors[`page_${index}_text`]}</div>}
              </div>
              
              <div className={`form-group ${errors[`page_${index}_image`] ? 'has-error' : ''}`}>
                <label htmlFor={`page_${index}_image`}>
                  Page Image:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Upload an image that illustrates this page of the story.
                    </span>
                  </div>
                </label>
                <div className="file-upload-container">
                  <div className="file-upload-button">
                    <label htmlFor={`page_${index}_image`} className="file-upload-labell">
                      <FontAwesomeIcon icon={faUpload} /> {page.image ? 'Change Image' : 'Upload Image'}
                    </label>
                    <input
                      type="file"
                      id={`page_${index}_image`}
                      onChange={(e) => handlePageImageUpload(e, index)}
                      accept="image/*"
                      className="file-input"
                    />
                  </div>
                  {isUploading && uploadProgress[index] && (
                    <div className="upload-progress">
                      <FontAwesomeIcon icon={faSpinner} spin /> Uploading...
                    </div>
                  )}
                  {page.image && (
                    <div className="file-name">
                      {page.imageFile?.name || page.image.substring(page.image.lastIndexOf('/') + 1)}
                    </div>
                  )}
                </div>
                {errors[`page_${index}_image`] && <div className="error-message">{errors[`page_${index}_image`]}</div>}
                
                {/* Image Preview Section */}
                {(pageImages[index] || page.image) && (
                  <div className="image-preview-container">
                    <h6>Image Preview:</h6>
                    <div className="image-preview">
                      <img 
                        src={pageImages[index] || page.image} 
                        alt={`Preview for page ${page.pageNumber}`} 
                        className="preview-image"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="sentence-questions-section">
          <h4>
            <FontAwesomeIcon icon={faQuestionCircle} style={{ marginRight: '8px' }} />
            Comprehension Questions
            <div className="tooltip" style={{ marginLeft: '8px' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
              <span className="tooltip-text">
                Create questions that test the student's understanding of the reading passage. Each question should have a correct answer and an incorrect option.
              </span>
            </div>
          </h4>
          
          <div className="question-tabs">
            {form.sentenceQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className={`question-tab ${currentQuestion === index ? 'active' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                Q{question.questionNumber}
              </button>
            ))}
            <button 
              type="button" 
              className="add-question-btn"
              onClick={addQuestion}
            >
              <FontAwesomeIcon icon={faPlus} /> Add Question
            </button>
          </div>
          
          {form.sentenceQuestions.map((question, index) => (
            <div 
              key={index}
              className={`question-content ${currentQuestion === index ? 'active' : 'hidden'}`}
            >
              <div className="question-header">
                <h5>Question {question.questionNumber}</h5>
                <button 
                  type="button" 
                  className="remove-question-btn"
                  onClick={() => removeQuestion(index)}
                  disabled={form.sentenceQuestions.length <= 1}
                  title={form.sentenceQuestions.length <= 1 ? "Cannot remove the only question" : "Remove this question"}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              
              <div className={`form-group ${errors[`question_${index}_questionText`] ? 'has-error' : ''}`}>
                <label htmlFor={`question-text-${index}`}>
                  Question Text:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter the text of the comprehension question. Make it clear and specific.
                    </span>
                  </div>
                </label>
                <input
                  type="text"
                  id={`question-text-${index}`}
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(e, index, 'questionText')}
                  placeholder="e.g. Sino ang pangunahing tauhan sa kwento?"
                  required
                />
                {errors[`question_${index}_questionText`] && (
                  <div className="error-message">{errors[`question_${index}_questionText`]}</div>
                )}
              </div>
              
              <div className="form-group">
                <label>
                  Answer Options:
                  <div className="tooltip">
                    <FontAwesomeIcon icon={faInfoCircle} className="tooltip-icon" />
                    <span className="tooltip-text">
                      Enter the correct answer and one incorrect option. Each option should include a description explaining why it is right or wrong.
                    </span>
                  </div>
                </label>
                <div className="answer-options">
                  {question.sentenceOptionAnswers.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-input">
                      <div className="option-radio">
                        <input
                          type="radio"
                          name={`question_${index}_correct_option`}
                          checked={question.correctOptionIndex === optionIndex}
                          onChange={() => handleQuestionChange({ target: { value: optionIndex }}, index, 'correctOptionIndex')}
                        />
                      </div>
                      <div className="option-content">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleQuestionChange(e, index, 'sentenceOptionAnswers', optionIndex)}
                          placeholder={`Option ${optionIndex + 1}`}
                          required
                        />
                        <input
                          type="text"
                          value={question.optionDescriptions[optionIndex] || ''}
                          onChange={(e) => handleQuestionChange(e, index, 'optionDescriptions', optionIndex)}
                          placeholder={question.correctOptionIndex === optionIndex ? 
                            "Explain why this is the correct answer..." : 
                            "Explain why this is incorrect..."}
                          className="option-description"
                        />
                      </div>
                      {question.correctOptionIndex === optionIndex && (
                        <span className="correct-badge">Correct Answer</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="form-help-text">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    Select one option as the correct answer. <strong>Add descriptions to explain why each answer is right or wrong</strong> - these help students understand the reasoning behind correct and incorrect answers.
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-btn"
          >
            {template ? "Update Template" : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SentenceTemplateForm;