// src/pages/Teachers/ManageCategories/PostAssessment.jsx
// This file has been renamed functionally to MainAssessment but kept the same filename for compatibility
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faEye,
  faTrash,
  faTimes,
  faExclamationTriangle,
  faSearch,
  faCheckCircle,
  faLock,
  faUpload,
  faBook,
  faFont,
  faImages,
  faFileAlt,
  faInfoCircle,
  faPuzzlePiece,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faFilter,
  faCheckDouble,
  faClipboardList,
  faChartLine,
  faUserGraduate,
  faLayerGroup,
  faCogs,
  faBullseye,
  faUsers,
  faGraduationCap,
  faQuestion,
  faCloudUploadAlt
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PostAssessment.css";
import MainAssessmentService from '../../../services/Teachers/MainAssessmentService';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UnifiedTemplatePreview from "./UnifiedTemplatePreview";

// Add import for file helpers
import { dataURLtoFile, validateFileForUpload } from '../../../utils/fileHelpers';

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="pa-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="pa-tooltip-icon" />
    <span className="pa-tooltip-text">{text}</span>
  </div>
);

// Helper function to handle API errors and display user-friendly messages
const handleApiError = (error, defaultMessage = "An error occurred. Please try again.") => {
  if (error.response) {
    // Server responded with an error status code
    const status = error.response.status;
    const errorMessage = error.response.data?.message || defaultMessage;
    
    if (status === 401) {
      return "You are not authorized. Please log in again.";
    } else if (status === 403) {
      return "You don't have permission to perform this action.";
    } else if (status === 404) {
      return "The requested resource was not found. This might be because the Main Assessment feature is new.";
    } else if (status === 422) {
      return errorMessage; // Validation error with specific message
    } else {
      return `Error: ${errorMessage}`;
    }
  } else if (error.request) {
    // Request was made but no response received (network issue)
    return "Unable to connect to the server. Please check your internet connection.";
  } else {
    // Something else happened while setting up the request
    return defaultMessage;
  }
};

const MainAssessment = ({ templates }) => {
  // State variables
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterReadingLevel, setFilterReadingLevel] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create", "edit", "preview", "delete"
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [formData, setFormData] = useState({
    readingLevel: "",
    category: "",
    questions: [],
    isActive: true,
    status: "active"
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    questionType: "",
    questionText: "",
    questionImage: null,
    questionValue: "",
    choiceOptions: [
      { optionId: "1", optionText: "", isCorrect: true, description: "" },
      { optionId: "2", optionText: "", isCorrect: false, description: "" }
    ],
    passages: [],
    sentenceQuestions: [],
    order: 1
  });
  const [previewPage, setPreviewPage] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitSuccessDialog, setSubmitSuccessDialog] = useState(false);
  const [deleteSuccessDialog, setDeleteSuccessDialog] = useState(false);
  const [submitConfirmDialog, setSubmitConfirmDialog] = useState(false);
  const [duplicateRestrictionDialog, setDuplicateRestrictionDialog] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [apiMessage, setApiMessage] = useState(null);
  // Preview All state variables
  const [isPreviewAllDialogOpen, setIsPreviewAllDialogOpen] = useState(false);
  const [previewAllTemplates, setPreviewAllTemplates] = useState([]);
  const [previewAllCurrentIndex, setPreviewAllCurrentIndex] = useState(0);

  // Helper function to get category prefix
  const getCategoryPrefix = (category) => {
    const prefixMap = {
      'Alphabet Knowledge': 'AK',
      'Phonological Awareness': 'PA',
      'Decoding': 'DC',
      'Word Recognition': 'WR',
      'Reading Comprehension': 'RC'
    };
    return prefixMap[category] || 'Q';
  };
  
  // Check if an assessment already exists for a reading level and category
  const checkExistingAssessment = (readingLevel, category, excludeId = null) => {
    return assessments.find(assessment => 
      (assessment.readingLevel || '').trim() === readingLevel.trim() && 
      assessment.category === category &&
      assessment._id !== excludeId
    );
  };

  // Check if a new assessment can be created for a reading level and category
  const canCreateAssessment = (readingLevel, category) => {
    const existing = checkExistingAssessment(readingLevel, category);
    
    if (existing) {
      return {
        canCreate: false,
        reason: "An assessment already exists for this reading level and category combination",
        existingAssessment: existing
      };
    }
    
    return { canCreate: true };
  };

  useEffect(() => {
    // Fetch assessments data from the backend
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch assessments...");

        // Add retry mechanism
        let attempts = 0;
        const maxAttempts = 3;
        let response = null;
        let lastError = null;

        while (attempts < maxAttempts) {
          try {
            console.log(`Fetch attempt ${attempts + 1} of ${maxAttempts}`);
            response = await MainAssessmentService.getAllAssessments();
            // If successful, break out of the retry loop
            break;
          } catch (err) {
            lastError = err;
            console.error(`Attempt ${attempts + 1} failed:`, err);
            attempts++;
            if (attempts < maxAttempts) {
              // Wait 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!response && lastError) {
          throw lastError;
        }
        
        console.log("API Response:", response); // Debug log
        
        if (response && response.success) {
          const assessmentData = response.data || [];
          console.log("Setting assessments:", assessmentData.length, "items"); // Debug log
          
          if (assessmentData.length === 0) {
            console.log("No assessments found in the response");
            setApiMessage("No assessment templates found. This could be because templates haven't been created yet, or there might be an issue with the database connection.");
          }
          
          setAssessments(assessmentData);
          
          // If there's a message from the API, store it
          if (response.message) {
            setApiMessage(response.message);
          }
        } else if (response && !response.success) {
          console.error("API request was not successful:", response.message || "Unknown error");
          setError(response.message || "Failed to load assessments due to an unknown error.");
          setApiMessage(response.message || "There was an error loading assessment templates. Please try again later.");
        } else {
          console.log("No data or unsuccessful response");
          setAssessments([]);
          setApiMessage("No assessment templates found. This could be because templates haven't been created yet.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        const errorMessage = handleApiError(err, "Failed to load assessments. Please try again later.");
        setError(errorMessage);
        setApiMessage("There was an error connecting to the assessment service. Please check your connection and try again.");
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // Add debug logging to see what assessments are loaded
  useEffect(() => {
    if (assessments.length > 0) {
      console.log("Total assessments loaded:", assessments.length);
      console.log("Assessments by reading level:");
      
      const byLevel = assessments.reduce((acc, assessment) => {
        const level = assessment.readingLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push({
          id: assessment._id,
          category: assessment.category,
          questions: assessment.questions.length
        });
        return acc;
      }, {});
      
      console.table(byLevel);
      
      // Check specifically for Low Emerging
      const lowEmerging = assessments.filter(a => a.readingLevel === "Low Emerging");
      console.log("Low Emerging assessments:", lowEmerging.length);
      console.log("Low Emerging details:", lowEmerging.map(a => ({ 
        id: a._id, 
        category: a.category, 
        questions: a.questions.length 
      })));

      // Check for exact reading level strings
      const uniqueLevels = [...new Set(assessments.map(a => `"${a.readingLevel}"`))];
      console.log("Unique reading levels (with quotes to see spaces):", uniqueLevels);
      
      // Add more detailed debugging for reading levels
      console.log("All assessments with reading levels and categories:");
      assessments.forEach((a, index) => {
        console.log(`Assessment ${index + 1}: ID=${a._id}, Level="${a.readingLevel}", Category="${a.category}", charCodes=${[...a.readingLevel].map(c => c.charCodeAt(0))}`);
      });
      
      // Check if any don't match expected values
      const expectedLevels = ["Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"];
      const unexpectedLevels = assessments.filter(a => !expectedLevels.includes(a.readingLevel));
      
      if (unexpectedLevels.length > 0) {
        console.warn("Assessments with unexpected reading levels:", unexpectedLevels);
      }
    }
  }, [assessments]);

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    // Reading level filter
    const levelMatch = filterReadingLevel === "all" ? true : 
      (assessment.readingLevel || '').trim() === filterReadingLevel.trim();

    // Category filter
    const categoryMatch = filterCategory === "all" ? true : assessment.category === filterCategory;

    // Search term
    const searchMatch =
      assessment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.readingLevel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.questions.some(q => q.questionText?.toLowerCase().includes(searchTerm.toLowerCase())));

    return levelMatch && categoryMatch && searchMatch;
  });

  const readingLevels = ["all", "Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"];
  const categories = ["all", "Alphabet Knowledge", "Phonological Awareness",
    "Decoding", "Word Recognition", "Reading Comprehension"];

  // Get assessment statistics
  const getAssessmentStats = () => {
    const totalAssessments = assessments.length;
    const activeAssessments = assessments.filter(a => a.isActive).length;
    const inactiveAssessments = assessments.filter(a => !a.isActive).length;

    return {
      total: totalAssessments,
      active: activeAssessments,
      inactive: inactiveAssessments
    };
  };

  const stats = getAssessmentStats();

  const handleCreateAssessment = () => {
    setModalType("create");
    setSelectedAssessment(null);
    setFormData({
      readingLevel: "",
      category: "",
      questions: [],
      isActive: true,
      status: "active"
    });
    setShowModal(true);
  };

  const handleEditAssessment = (assessment) => {
    setModalType("edit");
    setSelectedAssessment(assessment);
    
    // Add debug logging
    console.log("Loading assessment for editing:", assessment);
    
    // Check if any questions are missing questionValue
    const missingValues = assessment.questions.filter(q => q.questionValue === undefined || q.questionValue === null);
    if (missingValues.length > 0) {
      console.warn("Warning: Found questions with missing questionValue", missingValues);
    }
    
    // Create a fixed copy of the questions with questionValue guaranteed
    const fixedQuestions = assessment.questions.map(q => ({
      ...q,
      questionValue: q.questionValue !== undefined ? q.questionValue : (q.questionType === "sentence" ? "" : null)
    }));
    
    setFormData({
      readingLevel: assessment.readingLevel,
      category: assessment.category,
      questions: fixedQuestions,
      isActive: assessment.isActive,
      status: assessment.status
    });
    setShowModal(true);
  };

  const handlePreviewAssessment = (assessment) => {
    setModalType("preview");
    setSelectedAssessment(assessment);
    setPreviewPage(0); // Reset to first page
    setShowModal(true);
  };

  const handlePreviewAllAssessments = () => {
    // Use filtered assessments for preview all
    setPreviewAllTemplates(filteredAssessments);
    setPreviewAllCurrentIndex(0);
    setIsPreviewAllDialogOpen(true);
  };

  const handleDeleteConfirm = (assessment) => {
    setModalType("delete");
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      const response = await MainAssessmentService.deleteAssessment(selectedAssessment._id);
      
      if (response && response.success) {
        // Remove from local state
    setAssessments(prev => prev.filter(a => a._id !== selectedAssessment._id));
    setShowModal(false);
    setSelectedAssessment(null);

        // Show success notification
    setDeleteSuccessDialog(true);
    setTimeout(() => {
      setDeleteSuccessDialog(false);
    }, 3000);
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert(handleApiError(error, "Failed to delete assessment. Please try again."));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // When both readingLevel and category are set, check for existing assessments
    if (modalType === 'create' && name === 'category' && formData.readingLevel) {
      // We need to use the current value for category since it's what just changed
      const validation = canCreateAssessment(formData.readingLevel, value);
      if (!validation.canCreate) {
        toast.warning(`An assessment already exists for ${formData.readingLevel} - ${value}. Only one assessment per combination is allowed.`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Show a more prominent message about the existing assessment
        const existingAssessment = validation.existingAssessment;
        if (existingAssessment) {
          const message = `
            An assessment already exists for this combination with ${existingAssessment.questions.length} questions.
            ${existingAssessment.isActive ? 'This assessment is currently active.' : 'This assessment is currently inactive.'}
            Please edit the existing assessment instead.
          `;
          
          setTimeout(() => {
            // Add a slight delay so this appears after the first toast
            toast.error(message, {
              position: "top-center",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }, 500);
        }
      }
    } else if (modalType === 'create' && name === 'readingLevel' && formData.category) {
      // We need to use the current value for reading level since it's what just changed
      const validation = canCreateAssessment(value, formData.category);
      if (!validation.canCreate) {
        toast.warning(`An assessment already exists for ${value} - ${formData.category}. Only one assessment per combination is allowed.`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Show a more prominent message about the existing assessment
        const existingAssessment = validation.existingAssessment;
        if (existingAssessment) {
          const message = `
            An assessment already exists for this combination with ${existingAssessment.questions.length} questions.
            ${existingAssessment.isActive ? 'This assessment is currently active.' : 'This assessment is currently inactive.'}
            Please edit the existing assessment instead.
          `;
          
          setTimeout(() => {
            // Add a slight delay so this appears after the first toast
            toast.error(message, {
              position: "top-center", 
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }, 500);
        }
      }
    }
  };

  const handleAddQuestion = () => {
    setShowQuestionForm(true);
    setCurrentQuestion(null);

    const initialQuestionType =
      formData.category === "Alphabet Knowledge" ? "patinig" :
        formData.category === "Phonological Awareness" ? "patinig" :
          formData.category === "Word Recognition" ? "word" :
            formData.category === "Decoding" ? "word" :
              "sentence";

    // Generate a temporary questionId based on category only for non-sentence types
    const categoryPrefix = getCategoryPrefix(formData.category);
    const questionNumber = String(formData.questions.length + 1).padStart(3, '0');
    const tempQuestionId = `${categoryPrefix}_${questionNumber}`;
    
    // For sentence questions, we'll use a parent ID to generate child IDs, but not store it on the parent
    const parentId = initialQuestionType === "sentence" ? tempQuestionId : null;

    setQuestionFormData({
      questionType: initialQuestionType,
      questionText: "",
      questionImage: null,
      questionValue: "",
      // Add questionId for all question types
      questionId: tempQuestionId,
      // Store parent ID temporarily for generating child IDs
      _parentId: parentId,
      choiceOptions: [
        { optionId: "1", optionText: "", isCorrect: true, description: "" },
        { optionId: "2", optionText: "", isCorrect: false, description: "" }
      ],
      passages: initialQuestionType === "sentence" ? [
        { pageNumber: 1, pageText: "", pageImage: null }
      ] : [],
      sentenceQuestions: initialQuestionType === "sentence" ? [
        { 
          questionText: "", 
          correctAnswer: "", 
          incorrectAnswer: "", 
          correctDescription: "", 
          incorrectDescription: "",
          questionId: `${parentId}_SQ01`, // Use parent ID to generate child ID
          order: 1  // Start with order 1
        }
      ] : [],
      order: 0 // Will be set when added to questions array
    });
  };

  const handleEditQuestion = (question, index) => {
    setShowQuestionForm(true);
    setCurrentQuestion(index);
    // Make sure we preserve the questionId from the original question
    setQuestionFormData({
      ...question,
      // Ensure questionId exists, if not generate a temporary one
      questionId: question.questionId || (() => {
        const categoryPrefix = getCategoryPrefix(formData.category);
        const questionNumber = String(index + 1).padStart(3, '0');
        return `${categoryPrefix}_${questionNumber}`;
      })(),
      order: index + 1
    });
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setQuestionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChoiceChange = (index, field, value) => {
    setQuestionFormData(prev => {
      const updatedChoices = [...prev.choiceOptions];
      updatedChoices[index] = {
        ...updatedChoices[index],
        [field]: value
      };
      return {
        ...prev,
        choiceOptions: updatedChoices
      };
    });
  };

  const handleAddChoice = () => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: [
        ...prev.choiceOptions,
        { optionId: (prev.choiceOptions.length + 1).toString(), optionText: "", isCorrect: false, description: "" }
      ]
    }));
  };

  const handleRemoveChoice = (index) => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: prev.choiceOptions.filter((_, i) => i !== index)
    }));
  };

  const handleAddSentenceQuestion = () => {
    // Generate a questionId for the new sentence question using the parent ID
    const currentQuestionCount = questionFormData.sentenceQuestions.length;
    const subQuestionNumber = String(currentQuestionCount + 1).padStart(2, '0');
    // Format: RC_001_SQ01 (parent ID + subQuestionNumber)
    const parentId = questionFormData._parentId;
    const subQuestionId = `${parentId}_SQ${subQuestionNumber}`;

    setQuestionFormData(prev => ({
      ...prev,
      sentenceQuestions: [
        ...prev.sentenceQuestions,
        { 
          questionText: "", 
          correctAnswer: "", 
          incorrectAnswer: "", 
          correctDescription: "",
          incorrectDescription: "",
          questionId: subQuestionId,
          order: prev.sentenceQuestions.length + 1  // Add order based on current length + 1
        }
      ]
    }));
  };

  const handleQuestionFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!questionFormData.questionText) {
      toast.error("Please enter a question text.");
      return;
    }

    // Remove validation for questionValue - it's now optional
    // The backend will use null when it's not provided

    // Validate minimum choice options
    if (questionFormData.questionType !== "sentence" && questionFormData.choiceOptions.length < 2) {
      toast.error("Please add at least two choices for the question.");
      return;
    }

    // Validate choice options have text
    if (questionFormData.questionType !== "sentence") {
      const emptyOptions = questionFormData.choiceOptions.filter(c => !c.optionText);
      if (emptyOptions.length > 0) {
        toast.error("All answer choices must have text.");
        return;
      }
    }

    if (
      questionFormData.questionType !== "sentence" &&
      !questionFormData.choiceOptions.some(c => c.isCorrect)
    ) {
      toast.error("Please mark at least one choice as correct.");
      return;
    }
    
    // Validate sentence questions for Reading Comprehension
    if (questionFormData.questionType === "sentence") {
      // Check if passages exist and have content
      if (!questionFormData.passages || questionFormData.passages.length === 0) {
        toast.error("Please add at least one passage page.");
        return;
      }
      
      // Check if passages have text
      const emptyPassages = questionFormData.passages.filter(p => !p.pageText);
      if (emptyPassages.length > 0) {
        toast.error("All passage pages must have text content.");
        return;
      }
      
      // Check if sentence questions exist and have content
      if (!questionFormData.sentenceQuestions || questionFormData.sentenceQuestions.length === 0) {
        toast.error("Please add at least one comprehension question.");
        return;
      }
      
      // Check if all sentence questions have question text, correct and incorrect answers
      const invalidQuestions = questionFormData.sentenceQuestions.filter(
        q => !q.questionText || !q.correctAnswer || !q.incorrectAnswer
      );
      if (invalidQuestions.length > 0) {
        toast.error("All comprehension questions must have question text, correct and incorrect answers.");
        return;
      }
    }
    
    try {
      let finalQuestionData = { ...questionFormData };
      
      // Ensure questionValue is always set for non-sentence questions
      if (finalQuestionData.questionType !== "sentence" && !finalQuestionData.questionValue) {
        // This should never happen due to validation, but just in case:
        finalQuestionData.questionValue = null;
      }
      
      // Ensure sentenceQuestions have order field
      if (finalQuestionData.questionType === "sentence" && finalQuestionData.sentenceQuestions) {
        finalQuestionData.sentenceQuestions = finalQuestionData.sentenceQuestions.map((sq, sqIndex) => ({
          ...sq,
          order: sqIndex + 1 // Add order field starting from 1
        }));
      }
      
      // Get category-specific folder name for S3 upload
      const getCategoryFolder = (category) => {
        const folderMap = {
          'Alphabet Knowledge': 'alphabet-knowledge',
          'Phonological Awareness': 'phonological-awareness',
          'Decoding': 'decoding',
          'Word Recognition': 'word-recognition',
          'Reading Comprehension': 'reading-comprehension'
        };
        return folderMap[category] || '';
      };
      
      // Construct S3 path with category folder
      const categoryFolder = getCategoryFolder(formData.category);
      const s3Path = categoryFolder ? `main-assessment/${categoryFolder}` : 'main-assessment';
      
      // If there's an image file pending upload, upload it to S3 first
      if (questionFormData.imageFile) {
        const result = await MainAssessmentService.uploadImageToS3(questionFormData.imageFile, s3Path);
        
        if (result.success) {
          finalQuestionData.questionImage = result.url;
        } else {
          toast.error(result.error || "Failed to upload image");
        }
        
        // Remove temporary fields used for handling the upload
        delete finalQuestionData.imageFile;
        delete finalQuestionData.imageName;
      }
      
      // If we have passage pages with images, handle those uploads as well
      if (finalQuestionData.questionType === "sentence" && finalQuestionData.passages) {
        const updatedPassages = [];
        
        for (const passage of finalQuestionData.passages) {
          let updatedPassage = { ...passage };
          
          // Check if this passage has a blob URL that needs uploading
          if (passage.pageImage && typeof passage.pageImage === 'string' && passage.pageImage.startsWith('blob:')) {
            try {
              // Convert blob URL back to File object
              const response = await fetch(passage.pageImage);
              const blob = await response.blob();
              const fileName = `page_${passage.pageNumber}_${Date.now()}.jpg`;
              const imageFile = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
              
              // Upload to S3
              const uploadResult = await MainAssessmentService.uploadImageToS3(imageFile, s3Path);
              
              if (uploadResult.success) {
                updatedPassage.pageImage = uploadResult.url;
                console.log(`Successfully uploaded page ${passage.pageNumber} image:`, uploadResult.url);
              } else {
                console.error(`Failed to upload image for page ${passage.pageNumber}:`, uploadResult.error);
                toast.error(`Failed to upload image for page ${passage.pageNumber}`);
                // Keep the original blob URL as fallback (though this isn't ideal)
                updatedPassage.pageImage = passage.pageImage;
              }
            } catch (error) {
              console.error(`Error processing image for page ${passage.pageNumber}:`, error);
              toast.error(`Error processing image for page ${passage.pageNumber}`);
              // Keep the original blob URL as fallback
              updatedPassage.pageImage = passage.pageImage;
            }
          }
          // If it's already a proper URL (starts with https://), keep it as is
          else if (passage.pageImage && typeof passage.pageImage === 'string' && passage.pageImage.startsWith('https://')) {
            updatedPassage.pageImage = passage.pageImage;
          }
          // If it's null or empty, keep it as is
          else {
            updatedPassage.pageImage = passage.pageImage;
          }
          
          updatedPassages.push(updatedPassage);
        }
        
        finalQuestionData.passages = updatedPassages;
      }
      
      // Ensure questionId exists
      if (!finalQuestionData.questionId) {
        const categoryPrefix = getCategoryPrefix(formData.category);
        const questionNumber = String(currentQuestion !== null ? currentQuestion + 1 : formData.questions.length + 1).padStart(3, '0');
        finalQuestionData.questionId = `${categoryPrefix}_${questionNumber}`;
      }
      
      // Update the form data with the final question data
      if (currentQuestion !== null) {
        setFormData(prev => {
          const updatedQuestions = [...prev.questions];
          // Ensure questionValue is at least null if it's empty string or undefined
          finalQuestionData.questionValue = finalQuestionData.questionValue || null;
          updatedQuestions[currentQuestion] = finalQuestionData;
          return {
            ...prev,
            questions: updatedQuestions
          };
        });
        
        // Reset for a new question and keep the form open
        setCurrentQuestion(null);
        
        // Generate temporary questionId for the next question
        const nextQuestionNumber = String(formData.questions.length + 2).padStart(3, '0'); // +2 because we just added one
        const nextTempQuestionId = `${getCategoryPrefix(formData.category)}_${nextQuestionNumber}`;
        const nextParentId = finalQuestionData.questionType === "sentence" ? nextTempQuestionId : null;
        
        setQuestionFormData({
          questionType: finalQuestionData.questionType,
          questionText: "",
          questionImage: null,
          // Ensure it has a default value
          questionValue: finalQuestionData.questionType === "sentence" ? "" : null,
          // Include questionId for all question types
          questionId: nextTempQuestionId,
          // Store parent ID temporarily for generating child IDs
          _parentId: nextParentId,
          choiceOptions: [
            { optionId: "1", optionText: "", isCorrect: true, description: "" },
            { optionId: "2", optionText: "", isCorrect: false, description: "" }
          ],
          passages: finalQuestionData.questionType === "sentence" ? [
            { pageNumber: 1, pageText: "", pageImage: null }
          ] : [],
          sentenceQuestions: finalQuestionData.questionType === "sentence" ? [
            { 
              questionText: "", 
              correctAnswer: "", 
              incorrectAnswer: "", 
              correctDescription: "", 
              incorrectDescription: "",
              questionId: nextParentId ? `${nextParentId}_SQ01` : null,
              order: 1  // Start with order 1
            }
          ] : [],
          order: formData.questions.length + 2 // +2 because we just added one
        });
        
        toast.success("Question updated! You can add another or click Back to return to the assessment.");
      } else {
        // Ensure questionValue is at least null if it's empty string or undefined
        finalQuestionData.questionValue = finalQuestionData.questionValue || null;
        
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, finalQuestionData]
        }));
        
        // Reset for a new question and keep the form open
        // Generate temporary questionId for the next question
        const nextQuestionNumber = String(formData.questions.length + 2).padStart(3, '0'); // +2 because we just added one
        const nextTempQuestionId = `${getCategoryPrefix(formData.category)}_${nextQuestionNumber}`;
        const nextParentId = finalQuestionData.questionType === "sentence" ? nextTempQuestionId : null;
        
        setQuestionFormData({
          questionType: finalQuestionData.questionType,
          questionText: "",
          questionImage: null,
          // Ensure it has a default value
          questionValue: finalQuestionData.questionType === "sentence" ? "" : null,
          // Include questionId for all question types
          questionId: nextTempQuestionId,
          // Store parent ID temporarily for generating child IDs
          _parentId: nextParentId,
          choiceOptions: [
            { optionId: "1", optionText: "", isCorrect: true, description: "" },
            { optionId: "2", optionText: "", isCorrect: false, description: "" }
          ],
          passages: finalQuestionData.questionType === "sentence" ? [
            { pageNumber: 1, pageText: "", pageImage: null }
          ] : [],
          sentenceQuestions: finalQuestionData.questionType === "sentence" ? [
            { 
              questionText: "", 
              correctAnswer: "", 
              incorrectAnswer: "", 
              correctDescription: "", 
              incorrectDescription: "",
              questionId: nextParentId ? `${nextParentId}_SQ01` : null,
              order: 1  // Start with order 1
            }
          ] : [],
          order: formData.questions.length + 2 // +2 because we just added one
        });
        
        toast.success("Question added! You can add another or click Back to return to the assessment.");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question with image upload. Please try again.");
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
  
    // Validate the file
    const validation = validateFileForUpload(file);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }
  
    // Create a temporary URL for preview
    const previewUrl = URL.createObjectURL(file);
  
    // Store the file for later upload when the question is submitted
    if (field === 'questionImage') {
      setQuestionFormData(prev => ({
        ...prev,
        questionImage: previewUrl,
        imageFile: file, // Store the file for later S3 upload with proper category folder
        imageName: file.name
      }));
    } else if (field.includes('pageImage')) {
      const pageIndex = parseInt(field.split('-')[1]);
      setQuestionFormData(prev => {
        const updatedPassages = [...prev.passages];
        updatedPassages[pageIndex] = {
          ...updatedPassages[pageIndex],
          pageImage: previewUrl, // Store blob URL for preview
          _imageFile: file, // Store the actual file for later upload
          _imageName: file.name
        };
        return {
          ...prev,
          passages: updatedPassages
        };
      });
    }
  };
  const handleSaveAssessment = () => {
    // Validate form data
    if (!formData.readingLevel || !formData.category || formData.questions.length === 0) {
      alert("Please fill in all required fields and add at least one question.");
      return;
    }
    
    // Check restrictions for new assessments
    if (modalType === 'create') {
      const validation = canCreateAssessment(formData.readingLevel, formData.category);
      if (!validation.canCreate) {
        setRestrictionReason(validation.reason);
        setDuplicateRestrictionDialog(true);
        return;
      }
    }
    
    // Open confirmation dialog
    setSubmitConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitConfirmDialog(false);
      
      // Construct S3 path with category folder
      const categoryFolder = getCategoryFolder(modalType === 'edit' ? selectedAssessment.category : formData.category);
      const s3Path = categoryFolder ? `main-assessment/${categoryFolder}` : 'main-assessment';
      
      // Ensure each question has proper format
      const formattedQuestions = formData.questions.map((question, index) => {
        // Ensure questionId exists and follows the correct format for non-sentence types
        let questionId = question.questionId;
        if (modalType === 'edit' && selectedAssessment) {
          // When editing, make sure the questionId follows the correct format
          const categoryPrefix = getCategoryPrefix(selectedAssessment.category);
          const questionNumber = String(index + 1).padStart(3, '0');
          
          // Set questionId for all question types
          questionId = `${categoryPrefix}_${questionNumber}`;
        }
        
        // Handle sentence type questions that might be missing required arrays
        const isSentenceType = question.questionType === 'sentence';
        
        // IMPORTANT: Ensure questionValue is always present and non-null for ALL question types
        // For sentence type questions, use a default empty string if missing
        const questionValue = isSentenceType 
          ? (question.questionValue || "") 
          : (question.questionValue || null);
        
        // Prepare sentenceQuestions with proper field names for backend
        let formattedSentenceQuestions;
        if (isSentenceType && question.sentenceQuestions) {
          formattedSentenceQuestions = question.sentenceQuestions.map((sq, sqIndex) => {
            // If there's no questionId, generate one
            const subQuestionNumber = String(sqIndex + 1).padStart(2, '0');
            // Get a base ID for generating subQuestionIds if needed
            const categoryPrefix = getCategoryPrefix(modalType === 'edit' ? selectedAssessment.category : formData.category);
            const questionNumber = String(index + 1).padStart(3, '0');
            const baseId = `${categoryPrefix}_${questionNumber}`;
            // Use existing questionId, or generate a new one based on baseId
            const subQuestionId = sq.questionId || `${baseId}_SQ${subQuestionNumber}`;
            
            return {
              questionText: sq.questionText,
              correctAnswer: sq.correctAnswer,
              incorrectAnswer: sq.incorrectAnswer,
              correctDescription: sq.correctDescription || "",
              incorrectDescription: sq.incorrectDescription || "",
              questionImage: sq.questionImage || null,
              questionId: subQuestionId,
              order: sqIndex + 1  // Add order field starting from 1
            };
          });
        }
        
        return {
          ...question,
          // Include questionId for all question types
          questionId,
          // Set questionValue directly 
          questionValue: isSentenceType ? null : questionValue,
          order: index + 1,
          // Ensure passages exist for sentence type
          passages: isSentenceType ? (question.passages || []) : undefined,
          // Ensure sentenceQuestions exist for sentence type
          sentenceQuestions: isSentenceType ? formattedSentenceQuestions : undefined,
          // Ensure choiceOptions have optionId, description if missing
          choiceOptions: isSentenceType ? undefined : 
            (question.choiceOptions ? question.choiceOptions.map((option, optIndex) => ({
              ...option,
              optionId: option.optionId || (optIndex + 1).toString(),
              description: option.description || (option.isCorrect ? 
                "Ito ang tamang sagot." : 
                "Hindi ito ang tamang sagot.")
            })) : [
              // Default choices if none exist
              { optionId: "1", optionText: "Choice 1", isCorrect: true, description: "Ito ang tamang sagot." },
              { optionId: "2", optionText: "Choice 2", isCorrect: false, description: "Hindi ito ang tamang sagot." }
            ])
        };
      });
      
      // Final processing - explicitly remove questionId from sentence questions
      const finalQuestions = formattedQuestions;
      
      let response;
      
      if (modalType === 'edit' && selectedAssessment) {
        // Update existing assessment - don't include readingLevel and category in the update
        // as the backend doesn't allow these to be changed
        const updateData = {
          questions: finalQuestions, // Use finalQuestions instead of formattedQuestions
          isActive: formData.isActive,
          status: formData.status
        };
        
        // Update existing assessment
        response = await MainAssessmentService.updateAssessment(selectedAssessment._id, updateData);
      } else {
        // Create new assessment - include all fields
        const assessmentData = {
          readingLevel: formData.readingLevel,
          category: formData.category,
          questions: finalQuestions, // Use finalQuestions instead of formattedQuestions
          isActive: formData.isActive,
          status: formData.status
        };
        
        // For debugging - log the data being sent
        console.log("Submitting assessment data:", JSON.stringify(assessmentData, null, 2));
        
        // Create new assessment
        response = await MainAssessmentService.createAssessment(assessmentData);
      }
      
      // Check if response indicates success - handle different response formats
      const isSuccess = 
        (response && response.success) || 
        (response && response.data && response.data._id);
      
      if (isSuccess) {
        // Get the assessment data from the response
        const assessmentResponse = response.data || (response.success ? response : null);
        
        if (modalType === 'edit' && selectedAssessment) {
          // Update local state for edit
          setAssessments(prev => 
            prev.map(a => a._id === selectedAssessment._id ? assessmentResponse : a)
          );
        } else {
          // Add to local state for create
          setAssessments(prev => [...prev, assessmentResponse]);
        }
        
        // Reset form and close modal
        setShowModal(false);
        setSelectedAssessment(null);
        setFormData({
          readingLevel: "",
          category: "",
          questions: [],
          isActive: true,
          status: "active"
        });
        
        // Show success notification
        setSubmitSuccessDialog(true);
        setTimeout(() => {
          setSubmitSuccessDialog(false);
        }, 3000);
      } else {
        // Handle unsuccessful response
        toast.error("Failed to save assessment. The server did not return a valid response.");
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      
      // Show a more detailed error message to help debugging
      let errorMessage = "Failed to save assessment. Please check your inputs and try again.";
      
      if (error.response) {
        // Server responded with an error status
        if (error.response.data && error.response.data.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        }
        
        if (error.response.data && error.response.data.error) {
          errorMessage += `\nDetails: ${error.response.data.error}`;
        }
        
        console.error('Server response error:', error.response.data);
      }
      
      toast.error(errorMessage);
    }
  };

  const handlePreviewPageChange = (direction) => {
    if (direction === 'next' && selectedAssessment?.questions?.[0]?.passages?.length > previewPage + 1) {
      setPreviewPage(prev => prev + 1);
    } else if (direction === 'prev' && previewPage > 0) {
      setPreviewPage(prev => prev - 1);
    }
  };

  const getQuestionTypeDisplay = (type) => {
    switch (type) {
      case "patinig": return "Vowel (Patinig)";
      case "katinig": return "Consonant (Katinig)";
      case "malapantig": return "Syllable (Malapantig)";
      case "word": return "Word";
      case "sentence": return "Reading Passage";
      default: return type;
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (assessment) => {
    try {
      const newStatus = assessment.status === 'active' ? 'inactive' : 'active';
      const newIsActive = newStatus === 'active';
      
      const response = await MainAssessmentService.toggleAssessmentStatus(assessment._id, newStatus);
      
      if (response && response.success) {
        // Update local state
        setAssessments(prev => 
          prev.map(a => a._id === assessment._id ? 
            { ...a, status: newStatus, isActive: newIsActive } : a
          )
        );
      }
    } catch (error) {
      console.error('Error toggling assessment status:', error);
      alert(handleApiError(error, "Failed to update status. Please try again."));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate the file
    const validation = validateFileForUpload(file);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    setUploadingImage(true);
    
    try {
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuestionFormData(prev => ({
          ...prev,
          [field]: reader.result, // Set data URL for preview
          imageFile: file, // Store the file for later upload
          imageName: file.name // Store the name for display
        }));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setUploadingImage(false);
      toast.error("Error processing image. Please try again.");
    }
  };

  // Helper function to get category-specific folder for S3 uploads
  const getCategoryFolder = (category) => {
    const folderMap = {
      'Alphabet Knowledge': 'alphabet-knowledge',
      'Phonological Awareness': 'phonological-awareness',
      'Decoding': 'decoding',
      'Word Recognition': 'word-recognition',
      'Reading Comprehension': 'reading-comprehension'
    };
    return folderMap[category] || '';
  };

  if (loading) {
    return (
      <div className="post-assessment-container">
        <div className="pa-loading">
          <div className="pa-spinner"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-assessment-container">
        <div className="pa-error">
          <FontAwesomeIcon icon={faExclamationTriangle} className="pa-error-icon" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="pa-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Add styles for the troubleshooting elements
  const styles = {
    troubleshootingList: {
      listStyle: 'disc',
      margin: '0 0 20px 20px',
      color: '#666',
      fontSize: '0.95rem'
    },
    actionButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px'
    },
    retryBtn: {
      backgroundColor: '#f0f0f0',
      color: '#333',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <div className="post-assessment-container">
      <div className="pa-header">
        <h2>
          <FontAwesomeIcon icon={faClipboardList} />
          Main Assessment Management
        </h2>
        <p>Create and manage targeted assessments for specific reading levels and categories based on student performance and learning progress.</p>
      </div>

      <div className="pa-assessment-overview">
        <div className="pa-overview-header">
          <h3><FontAwesomeIcon icon={faLayerGroup} /> Assessment Overview</h3>
        </div>
        <div className="pa-overview-stats">
          <div className="pa-stat-card">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.total}</div>
              <div className="pa-stat-label">Total Assessments</div>
            </div>
          </div>

          <div className="pa-stat-card active">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.active}</div>
              <div className="pa-stat-label">Active</div>
            </div>
          </div>

          <div className="pa-stat-card inactive">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.inactive}</div>
              <div className="pa-stat-label">Inactive</div>
            </div>
            </div>
          </div>

        <div className="pa-reading-level-overview">
          <div className="pa-reading-level-header">
            <h4><FontAwesomeIcon icon={faBook} /> Assessments by Reading Level</h4>
            <p>Manage assessments for different reading levels and track their availability</p>
          </div>
          <div className="pa-reading-level-grid">
            {/* Dynamic generation of reading level cards */}
            {['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'].map(level => {
              // Get all assessments for this reading level - use normalized comparison to handle whitespace/case issues
              const levelAssessments = assessments.filter(a => {
                // Normalize both strings for comparison (trim whitespace and ensure case match)
                const normalizedLevel = level.trim();
                const normalizedAssessmentLevel = (a.readingLevel || '').trim();
                return normalizedAssessmentLevel === normalizedLevel;
              });
              
              // Debug log to see what's happening
              console.log(`Level: ${level}, Assessments found:`, levelAssessments.length);
              console.log(`Assessments for ${level}:`, levelAssessments.map(a => ({ id: a._id, level: a.readingLevel, category: a.category })));
              
              // Get all unique categories for this reading level
              const levelCategories = [...new Set(levelAssessments.map(a => a.category))].sort();
              
              return (
                <div className="pa-reading-level-card" key={level}>
                  <div className={`pa-reading-level-header-bar pa-level-${level.toLowerCase().replace(' ', '-')}`}>
                    <div className="pa-reading-level-name">
                      <FontAwesomeIcon icon={faBook} /> {level}
                    </div>
                    <div className="pa-reading-level-count" title={`${levelAssessments.length} assessment(s) for ${level} reading level`}>
                      {levelAssessments.length}
                    </div>
                  </div>
                  <div className="pa-reading-level-body">
                    <div className="pa-category-list">
                      {levelCategories.length > 0 ? (
                        levelCategories.map(category => {
                          // Get all assessments for this category in this reading level
                          const categoryAssessments = levelAssessments.filter(a => a.category === category);
                          
                          // Debug log for this category
                          console.log(`Level: ${level}, Category: ${category}, Assessments:`, categoryAssessments.length);
                          
                          // Choose the appropriate icon based on category
                          const categoryIcon = 
                            category === "Reading Comprehension" ? faBook : 
                            category === "Alphabet Knowledge" ? faFont : 
                            category === "Phonological Awareness" ? faPuzzlePiece : 
                            category === "Decoding" ? faFileAlt : 
                            faImages; // Word Recognition
                          
                          return (
                            <div className="pa-category-item" key={category}>
                              <div className="pa-category-name">
                                <FontAwesomeIcon icon={categoryIcon} /> {category}
                              </div>
                              <div className="pa-category-count" title={`${categoryAssessments.length} assessment(s) with ${categoryAssessments.reduce((total, a) => total + (a.questions ? a.questions.length : 0), 0)} total questions`}>
                                {categoryAssessments.length}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="pa-category-item">
                          <div className="pa-category-name">
                            <FontAwesomeIcon icon={faInfoCircle} /> No categories yet
                          </div>
                          <div className="pa-category-count">
                            0
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pa-process-flow">
        <h3>Main Assessment Process Flow</h3>
        <div className="pa-flow-steps">
          <div className="pa-flow-step">
            <div className="pa-step-number">1</div>
            <div className="pa-step-content">
              <h4>Assessment Creation</h4>
              <p>Teachers create targeted assessments based on student reading levels and specific learning objectives.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">2</div>
            <div className="pa-step-content">
              <h4>Assessment Activation</h4>
              <p>Teachers activate assessments to make them available to students in the mobile application.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">3</div>
            <div className="pa-step-content">
              <h4>Student Assignment</h4>
              <p>Activated assessments are assigned to students based on their reading level and identified needs.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">4</div>
            <div className="pa-step-content">
              <h4>Progress Tracking</h4>
              <p>Monitor student performance and advancement through the assessment system in real-time.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">5</div>
            <div className="pa-step-content">
              <h4>Level Advancement</h4>
              <p>Students advance to higher reading levels based on successful completion of assessments.</p>
            </div>
          </div>
        </div>
      </div>

    

      <div className="pa-system-info">
        <h3>About Main Assessment Process</h3>
        <div className="pa-info-grid">
          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div className="pa-info-content">
              <h4>Targeted Interventions</h4>
              <p>
                Create specialized assessments tailored to specific reading levels and categories
                to address individual student needs and learning gaps.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="pa-info-content">
              <h4>Progress Monitoring</h4>
              <p>
                Track student advancement through customized assessments that measure
                improvement in specific skill areas identified during pre-assessment.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faCogs} />
            </div>
            <div className="pa-info-content">
              <h4>Flexible Assessment Design</h4>
              <p>
                Build assessments with various question types including visual, auditory,
                and text-based elements to accommodate different learning styles.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <div className="pa-info-content">
              <h4>Adaptive Learning Path</h4>
              <p>
                Enable students to progress through reading levels at their own pace
                with assessments that adapt to their current skill level and performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pa-create-assessment-section">
        <button
          className="pa-create-assessment-btn"
          onClick={handleCreateAssessment}
        >
          <FontAwesomeIcon icon={faPlus} /> Create New Assessment
        </button>
      </div>

      <div className="pa-filters">
        <div className="pa-search">
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="pa-search-icon" />
        </div>

        <div className="pa-filter-group">
          <label><FontAwesomeIcon icon={faFilter} className="pa-filter-icon" /> Reading Level:</label>
          <select
            value={filterReadingLevel}
            onChange={e => setFilterReadingLevel(e.target.value)}
          >
            {readingLevels.map(level => (
              <option key={level} value={level}>
                {level === "all" ? "All Levels" : level}
              </option>
            ))}
          </select>
        </div>

        <div className="pa-filter-group">
          <label><FontAwesomeIcon icon={faFilter} className="pa-filter-icon" /> Category:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
        
        {filteredAssessments.length > 0 && (
          <button 
            className="pa-preview-all-btn"
            onClick={handlePreviewAllAssessments}
            title="Preview all assessments"
          >
            <FontAwesomeIcon icon={faEye} /> Preview All
          </button>
        )}
      </div>

      {apiMessage && (
        <div className="pa-api-message">
          <FontAwesomeIcon icon={faInfoCircle} className="pa-api-message-icon" />
          <p>{apiMessage}</p>
          <button 
            className="pa-dismiss-message" 
            onClick={() => setApiMessage(null)}
            title="Dismiss message"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      <div className="pa-assessment-list">
        {filteredAssessments.length === 0 ? (
          <div className="pa-no-assessments">
            <div className="pa-empty-icon">
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
            {searchTerm || filterReadingLevel !== "all" || filterCategory !== "all" ? (
              <>
                <h3>No matching assessments found</h3>
                <p>Try adjusting your search or filter criteria to find assessments.</p>
                <button
                  className="pa-reset-filters"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterReadingLevel("all");
                    setFilterCategory("all");
                  }}
                >
                  <FontAwesomeIcon icon={faFilter} /> Reset Filters
                </button>
              </>
            ) : (
              <>
                <h3>No Assessment Templates Found</h3>
                <p>This could be due to one of the following reasons:</p>
                <ul className="pa-troubleshooting-list" style={styles.troubleshootingList}>
                  <li>No assessment templates have been created yet</li>
                  <li>The database connection might be unavailable</li>
                  <li>There might be an issue with the server</li>
                </ul>
                <div className="pa-getting-started-tips">
                  <h4><FontAwesomeIcon icon={faInfoCircle} /> Options</h4>
                  <ol>
                    <li>Click "Create New Assessment" to build your first assessment</li>
                    <li>Try refreshing the page</li>
                    <li>Check your internet connection</li>
                    <li>Contact the administrator if the problem persists</li>
                  </ol>
                </div>
                <div className="pa-action-buttons" style={styles.actionButtons}>
                  <button
                    className="pa-retry-btn"
                    style={styles.retryBtn}
                    onClick={() => window.location.reload()}
                  >
                    <FontAwesomeIcon icon={faFilter} /> Refresh Page
                  </button>
                  <button
                    className="pa-create-first"
                    onClick={handleCreateAssessment}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Create Your First Assessment
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pa-table">
            <div className="pa-header-row">
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faBook} className="pa-header-icon" /> 
                Reading Level
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faLayerGroup} className="pa-header-icon" /> 
                Category
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faClipboardList} className="pa-header-icon" /> 
                Questions
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faCheckCircle} className="pa-header-icon" /> 
                Status
              </div>
              <div className="pa-header-cell">
                Actions
              </div>
            </div>

            {filteredAssessments.map(assessment => (
              <div key={assessment._id} className="pa-row">
                <div className="pa-cell">
                  <FontAwesomeIcon icon={faBook} className="pa-cell-icon" />
                  {assessment.readingLevel}
                </div>
                <div className="pa-cell">
                  <FontAwesomeIcon icon={
                    assessment.category === "Reading Comprehension" ? faBook : 
                    assessment.category === "Alphabet Knowledge" ? faFont : 
                    assessment.category === "Phonological Awareness" ? faPuzzlePiece : 
                    assessment.category === "Decoding" ? faFileAlt : 
                    faImages
                  } className="pa-cell-icon" /> 
                  {assessment.category}
                </div>
                <div className="pa-cell">{assessment.questions.length}</div>
                <div className="pa-cell">
                  {assessment.isActive ? (
                    <span className="pa-status pa-active">
                      <FontAwesomeIcon icon={faCheckCircle} /> Active
                    </span>
                  ) : (
                                          <span className="pa-status pa-inactive">
                      <FontAwesomeIcon icon={faExclamationTriangle} /> Inactive
                      </span>
                  )}
                </div>
                <div className="pa-cell pa-actions">
                      <button
                        className="pa-edit-btn"
                        onClick={() => handleEditAssessment(assessment)}
                        title="Edit assessment"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                  
                      <button
                        className="pa-preview-btn"
                        onClick={() => handlePreviewAssessment(assessment)}
                        title="Preview assessment"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                  
                      <button
                        className={`pa-status-toggle-btn ${assessment.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(assessment)}
                        title={assessment.isActive ? "Deactivate assessment" : "Activate assessment"}
                      >
                        <FontAwesomeIcon icon={assessment.isActive ? faLock : faCheckCircle} />
                      </button>
                  
                      <button
                        className="pa-delete-btn"
                        onClick={() => handleDeleteConfirm(assessment)}
                        title="Delete assessment"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="pa-modal-overlay">
          <div className={`pa-modal ${modalType === 'preview' || showQuestionForm ? 'pa-modal-enhanced' : ''} ${modalType === 'delete' ? 'pa-modal-narrow' : ''}`}>
            <div className="pa-modal-header">
              <h3>
                {modalType === 'create' ?
                  <><FontAwesomeIcon icon={faPlus} className="pa-modal-header-icon" /> Create New Assessment</> :
                  modalType === 'edit' ?
                    <><FontAwesomeIcon icon={faEdit} className="pa-modal-header-icon" /> Edit Assessment</> :
                    modalType === 'preview' ?
                      <><FontAwesomeIcon icon={faEye} className="pa-modal-header-icon" /> Assessment Preview</> :
                      <><FontAwesomeIcon icon={faTrash} className="pa-modal-header-icon" /> Delete Assessment</>
                }
              </h3>
              <button
                className="pa-modal-close"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="pa-modal-body">
                              {modalType === 'delete' ? (
                <div className="pa-delete-confirm">
                  <div className="pa-delete-icon">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                  </div>
                  <div className="pa-delete-message">
                    <h4>Delete Assessment</h4>
                    <p>Are you sure you want to permanently delete this assessment?</p>
                        <p className="pa-delete-warning">
                      This action cannot be undone. All questions and content will be permanently removed.
                    </p>
                  </div>
                </div>
              ) : modalType === 'preview' ? (
                <div className="pa-assessment-preview">
                  <div className="pa-preview-header">
                    <div className="pa-preview-info">
                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Reading Level:</span>
                          <span className="pa-preview-value">{selectedAssessment.readingLevel}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Category:</span>
                          <span className="pa-preview-value">{selectedAssessment.category}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Total Questions:</span>
                          <span className="pa-preview-value">{selectedAssessment.questions.length}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Status:</span>
                          <span className="pa-preview-value">
                          {selectedAssessment.isActive ? (
                              <span className="pa-status-tag active">
                                <FontAwesomeIcon icon={faCheckCircle} /> Active
                              </span>
                            ) : (
                            <span className="pa-status-tag inactive">
                              <FontAwesomeIcon icon={faExclamationTriangle} /> Inactive
                              </span>
                            )}
                          </span>
                      </div>
                    </div>
                  </div>

                  <div className="pa-preview-content">
                    <h4>
                      <FontAwesomeIcon icon={faClipboardList} className="pa-preview-icon" /> 
                      Assessment Questions
                    </h4>

                    {selectedAssessment.questions.map((question, index) => (
                      <div key={index} className="pa-preview-question-card">
                        <div className="pa-question-header">
                                                <div className="pa-question-metadata">
                            <span className="pa-question-num">Question {index + 1}</span>
                          <span className="pa-question-type">
                            <FontAwesomeIcon
                              icon={
                                question.questionType === "patinig" || question.questionType === "katinig"
                                  ? faFont
                                  : question.questionType === "malapantig"
                                    ? faPuzzlePiece
                                    : question.questionType === "sentence"
                                      ? faBook
                                      : faFileAlt
                              }
                              className="pa-question-type-icon"
                            />
                            {getQuestionTypeDisplay(question.questionType)}
                          </span>
                        </div>
                        </div>

                        <div className="pa-question-content">
                          <div className="pa-question-prompt">
                            {question.questionImage && (
                              <div className="pa-question-image-container">
                                <img
                                  src={question.questionImage}
                                  alt="Question visual"
                                  className="pa-question-image"
                                />
                              </div>
                            )}

                            <div className="pa-question-text-container">
                              <p className="pa-question-text">{question.questionText}</p>
                              {question.questionValue && (
                                <div className="pa-question-value">
                                  <strong>Value:</strong> {question.questionValue}
                                </div>
                              )}
                            </div>
                          </div>

                          {question.questionType === 'sentence' && question.passages ? (
                            <div className="pa-passage-preview">
                              <h5><FontAwesomeIcon icon={faBook} /> Reading Passage</h5>

                              <div className="pa-passage-navigation">
                                <button
                                  className="pa-page-nav-btn"
                                  onClick={() => handlePreviewPageChange('prev')}
                                  disabled={previewPage === 0}
                                >
                                  <FontAwesomeIcon icon={faArrowLeft} /> Previous
                                </button>

                                <span className="pa-page-indicator">
                                  Page {previewPage + 1} of {question.passages.length}
                                </span>

                                <button
                                  className="pa-page-nav-btn"
                                  onClick={() => handlePreviewPageChange('next')}
                                  disabled={previewPage >= question.passages.length - 1}
                                >
                                  Next <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                              </div>

                              <div className="pa-passage-container">
                                {question.passages[previewPage]?.pageImage && (
                                  <div className="pa-passage-image-container">
                                    <img
                                      src={question.passages[previewPage].pageImage}
                                      alt={`Page ${previewPage + 1} illustration`}
                                      className="pa-passage-image"
                                    />
                                  </div>
                                )}

                                <div className="pa-passage-text-container">
                                  <p className="pa-passage-text">{question.passages[previewPage]?.pageText}</p>
                                </div>
                              </div>

                              <div className="pa-comprehension-questions">
                                <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>
                                {question.sentenceQuestions && question.sentenceQuestions.length > 0 ? (
                                  question.sentenceQuestions.map((sq, sqIndex) => (
                                    <div key={sqIndex} className="pa-comprehension-question">
                                      <div className="pa-comprehension-q-header">
                                        <span className="pa-comprehension-q-number">Q{sqIndex + 1}:</span>
                                        <span className="pa-comprehension-q-text">{sq.questionText}</span>
                                      </div>

                                      <div className="pa-comprehension-options">
                                        <div className="pa-option pa-option-correct">
                                          <FontAwesomeIcon icon={faCheckCircle} className="pa-option-icon" />
                                          {sq.correctAnswer}
                                        </div>
                                        <div className="pa-option">
                                          {sq.incorrectAnswer}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="pa-no-questions">
                                    <p>No comprehension questions added yet.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="pa-choice-options">
                              <h5><FontAwesomeIcon icon={faCheckDouble} /> Answer Options</h5>

                              <div className="pa-options-list">
                                {question.choiceOptions && question.choiceOptions.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`pa-option ${option.isCorrect ? 'pa-option-correct' : ''}`}
                                  >
                                    <div className="pa-option-header">
                                    {option.isCorrect && (
                                      <FontAwesomeIcon icon={faCheckCircle} className="pa-option-icon" />
                                    )}
                                    {option.optionText}
                                  </div>
                                    
                                    {option.description && (
                                      <div className="pa-option-description">
                                        {option.description}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                    </div>
                          )}
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              ) : showQuestionForm ? (
                <div className="pa-question-form">
                  <div className="pa-question-form-header">
                    <h4>
                      {currentQuestion !== null ? (
                        <><FontAwesomeIcon icon={faEdit} /> Edit Question #{currentQuestion + 1}</>
                      ) : (
                        <><FontAwesomeIcon icon={faPlus} /> Add New Question</>
                      )}
                    </h4>
                    <button
                      type="button"
                      className="pa-back-to-form-btn"
                      onClick={() => setShowQuestionForm(false)}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} /> Back to Assessment
                    </button>
                  </div>

                  <div className="pa-question-form-content">
                    <div className="pa-question-form-grid">
                      <div className="pa-form-group">
                        <label htmlFor="questionType">
                          Question Type:
                          <Tooltip text="Select the type of question you want to create based on your assessment category." />
                        </label>
                        <select
                          id="questionType"
                          name="questionType"
                          value={questionFormData.questionType}
                          onChange={handleQuestionFormChange}
                          className="pa-select-input"
                        >
                          {formData.category === "Alphabet Knowledge" && (
                            <>
                              <option value="patinig">Vowel (Patinig)</option>
                              <option value="katinig">Consonant (Katinig)</option>
                            </>
                          )}
                          {formData.category === "Phonological Awareness" && (
                            <>
                              <option value="patinig">Vowel (Patinig)</option>
                              <option value="katinig">Consonant (Katinig)</option>
                            </>
                          )}
                          {(formData.category === "Word Recognition" || formData.category === "Decoding") && (
                            <option value="word">Word</option>
                          )}
                          {formData.category === "Reading Comprehension" && (
                            <option value="sentence">Reading Passage</option>
                          )}
                        </select>
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="questionText">
                          Question Text:
                          <Tooltip text="The main instruction or question displayed to the student." />
                        </label>
                        <input
                          type="text"
                          id="questionText"
                          name="questionText"
                          value={questionFormData.questionText}
                          onChange={handleQuestionFormChange}
                          placeholder="Enter the question text (e.g., 'Anong katumbas na maliit na letra?')"
                          required
                          className="pa-text-input"
                        />
                      </div>

                      {questionFormData.questionType !== "sentence" && (
                        <>
                          <div className="pa-form-group">
                            <label htmlFor="questionValue">
                              Question Display Text:
                              <Tooltip text="The text shown alongside the question, like a letter or word combination that students need to analyze. Optional - will be set to null if empty." />
                            </label>
                            <input
                              type="text"
                              id="questionValue"
                              name="questionValue"
                              value={questionFormData.questionValue || ""}
                              onChange={handleQuestionFormChange}
                              placeholder="Enter text to display with the question (e.g., 'A' or 'BO + LA') - optional"
                              className="pa-text-input"
                            />
                          </div>

                          <div className="pa-form-group">
                            <label>
                              Question Image:
                              <Tooltip text="Upload an image to display with the question (e.g., a picture of the letter or word)." />
                            </label>
                            <div className="pa-file-upload">
                              <label className="pa-file-upload-btn">
                                <FontAwesomeIcon icon={faCloudUploadAlt} />
                                {uploadingImage ? "Uploading..." : "Upload Image"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, "questionImage")}
                                  className="pa-file-input"
                                  disabled={uploadingImage}
                                />
                              </label>

                              {questionFormData.questionImage && (
                                <div className="pa-image-preview">
                                  <img
                                    src={
                                      typeof questionFormData.questionImage === 'string' && 
                                      questionFormData.questionImage.startsWith('data:') 
                                        ? questionFormData.questionImage // Show data URL for preview
                                        : questionFormData.questionImage // Show existing URL
                                    } 
                                    alt="Question" 
                                    className="pa-preview-image"
                                  />
                                  
                                  <div className="pa-file-name">
                                    {questionFormData.imageName || "Image Preview"}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestionFormData({
                                        ...questionFormData,
                                        questionImage: null,
                                        imageFile: null,
                                        imageName: ""
                                      });
                                    }}
                                    className="pa-remove-image"
                                    title="Remove Image"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pa-form-group pa-full-width">
                            <label>
                              Answer Choices:
                              <Tooltip text="Add answer options for the student to choose from. Mark one as correct." />
                            </label>

                            <div className="pa-choices-container">
                              {questionFormData.choiceOptions.map((choice, index) => (
                                <div className="pa-choice-item" key={index}>
                                  <div className="pa-choice-input-group">
                                    <input
                                      type="text"
                                      value={choice.optionText}
                                      onChange={(e) => handleChoiceChange(index, "optionText", e.target.value)}
                                      placeholder={`Option ${index + 1} (e.g., "a" or "BOLA")`}
                                      required
                                      className="pa-text-input"
                                    />

                                    <div className="pa-choice-controls">
                                      <label className={`pa-correct-checkbox ${choice.isCorrect ? 'selected' : ''}`}>
                                        <input
                                          type="radio"
                                          name="correctOption"
                                          checked={choice.isCorrect}
                                          onChange={() => {
                                            // Update all choices to be incorrect first
                                            const updatedChoices = questionFormData.choiceOptions.map(c => ({
                                              ...c,
                                              isCorrect: false
                                            }));
                                            // Then set the selected one to correct
                                            updatedChoices[index].isCorrect = true;
                                            setQuestionFormData(prev => ({
                                              ...prev,
                                              choiceOptions: updatedChoices
                                            }));
                                          }}
                                        />
                                        <FontAwesomeIcon icon={choice.isCorrect ? faCheckCircle : faQuestion} />
                                        Correct Answer
                                      </label>

                                      {index > 1 && (
                                        <button
                                          type="button"
                                          className="pa-remove-choice"
                                          onClick={() => handleRemoveChoice(index)}
                                          title="Remove this option"
                                        >
                                          <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pa-choice-description">
                                    <label>
                                      Description:
                                      <Tooltip text="Provide feedback to be shown when this option is selected. For correct answers, explain why it's right. For incorrect answers, give guidance." />
                                    </label>
                                    <textarea
                                      value={choice.description || ''}
                                      onChange={(e) => handleChoiceChange(index, "description", e.target.value)}
                                      placeholder={choice.isCorrect ? 
                                        "Explain why this is the correct answer (e.g., 'Tama! Ang letra B ay may tunog na /buh/.')" : 
                                        "Explain why this is incorrect (e.g., 'Mali. Ang tunog na /kuh/ ay para sa letra K.')"}
                                    ></textarea>
                                  </div>
                                </div>
                              ))}

                              <div className="pa-help-text">
                                <FontAwesomeIcon icon={faInfoCircle} />
                                Note: This assessment type is limited to exactly 2 answer choices for optimal mobile experience.
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {questionFormData.questionType === "sentence" && (
                        <div className="pa-passage-form pa-full-width">
                          <div className="pa-form-section">
                            <h5><FontAwesomeIcon icon={faBook} /> Reading Passage Pages</h5>

                            {questionFormData.passages.map((page, index) => (
                              <div key={index} className="pa-passage-item">
                                <div className="pa-passage-header">
                                  <h5>Page {index + 1}</h5>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      className="pa-remove-page"
                                      onClick={() => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          passages: prev.passages.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      title="Remove page"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  )}
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Page Text:
                                    <Tooltip text="The text content for this page of the reading passage." />
                                  </label>
                                  <textarea
                                    value={page.pageText}
                                    onChange={(e) => {
                                      const updatedPassages = [...questionFormData.passages];
                                      updatedPassages[index] = {
                                        ...updatedPassages[index],
                                        pageText: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        passages: updatedPassages
                                      }));
                                    }}
                                    placeholder="Enter the text for this page of the story"
                                    rows={4}
                                    className="pa-textarea"
                                  ></textarea>
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Page Image:
                                    <Tooltip text="Upload an illustration for this page of the reading passage." />
                                  </label>
                                  <div className="pa-file-upload">
                                    <label className="pa-file-upload-btn">
                                      <FontAwesomeIcon icon={faUpload} /> Choose Image
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, `pageImage-${index}`)}
                                        className="pa-file-input"
                                      />
                                    </label>
                                    <span className="pa-file-name">
                                      {page.pageImage
                                        ? page.pageImage.split('/').pop()
                                        : "No file chosen"}
                                    </span>

                                    {page.pageImage && (
                                      <div className="pa-image-preview">
                                        <img
                                          src={page.pageImage}
                                          alt={`Page ${index + 1} preview`}
                                          className="pa-preview-image"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="pa-add-page-btn"
                              onClick={() => {
                                setQuestionFormData(prev => ({
                                  ...prev,
                                  passages: [
                                    ...prev.passages,
                                    {
                                      pageNumber: prev.passages.length + 1,
                                      pageText: "",
                                      pageImage: null
                                    }
                                  ]
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Page
                            </button>
                          </div>

                          <div className="pa-form-section">
                            <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>

                            {questionFormData.sentenceQuestions.map((sq, index) => (
                              <div key={index} className="pa-sentence-question-item">
                                <div className="pa-sentence-question-header">
                                  <h5>Question {index + 1}</h5>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      className="pa-remove-sentence-question"
                                      onClick={() => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: prev.sentenceQuestions.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      title="Remove question"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  )}
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Question Text:
                                    <Tooltip text="The comprehension question about the passage." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.questionText}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        questionText: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter question text (e.g., 'Sino ang pangunahing tauhan?')"
                                    className="pa-text-input"
                                  />
                                </div>

                                <div className="pa-answer-section">
                                  <h5><FontAwesomeIcon icon={faCheckCircle} /> Correct Answer</h5>
                                  
                                  <div className="pa-form-group">
                                    <label>
                                      Correct Answer Text:
                                      <Tooltip text="The correct answer to the comprehension question." />
                                    </label>
                                    <input
                                      type="text"
                                      value={sq.correctAnswer}
                                      onChange={(e) => {
                                        const updatedQuestions = [...questionFormData.sentenceQuestions];
                                        updatedQuestions[index] = {
                                          ...updatedQuestions[index],
                                          correctAnswer: e.target.value
                                        };
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: updatedQuestions
                                        }));
                                      }}
                                      placeholder="Enter the correct answer"
                                      className="pa-text-input pa-correct-input"
                                    />
                                  </div>
                                  
                                  <div className="pa-form-group">
                                    <label>
                                      Correct Answer Feedback:
                                      <Tooltip text="Provide feedback to be shown when the student selects the correct answer." />
                                    </label>
                                    <textarea
                                      value={sq.correctDescription || ''}
                                      onChange={(e) => {
                                        const updatedQuestions = [...questionFormData.sentenceQuestions];
                                        updatedQuestions[index] = {
                                          ...updatedQuestions[index],
                                          correctDescription: e.target.value
                                        };
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: updatedQuestions
                                        }));
                                      }}
                                      placeholder="Explain why this is the correct answer (e.g., 'Tama! Ito ang sagot dahil...')"
                                      className="pa-textarea"
                                      rows={2}
                                    ></textarea>
                                  </div>
                                </div>

                                <div className="pa-answer-section">
                                  <h5><FontAwesomeIcon icon={faTimes} /> Incorrect Answer</h5>
                                  
                                  <div className="pa-form-group">
                                    <label>
                                      Incorrect Answer Text:
                                      <Tooltip text="One incorrect option for the comprehension question." />
                                    </label>
                                    <input
                                      type="text"
                                      value={sq.incorrectAnswer}
                                      onChange={(e) => {
                                        const updatedQuestions = [...questionFormData.sentenceQuestions];
                                        updatedQuestions[index] = {
                                          ...updatedQuestions[index],
                                          incorrectAnswer: e.target.value
                                        };
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: updatedQuestions
                                        }));
                                      }}
                                      placeholder="Enter an incorrect answer"
                                      className="pa-text-input pa-incorrect-input"
                                    />
                                  </div>
                                  
                                  <div className="pa-form-group">
                                    <label>
                                      Incorrect Answer Feedback:
                                      <Tooltip text="Provide feedback to be shown when the student selects the incorrect answer." />
                                    </label>
                                    <textarea
                                      value={sq.incorrectDescription || ''}
                                      onChange={(e) => {
                                        const updatedQuestions = [...questionFormData.sentenceQuestions];
                                        updatedQuestions[index] = {
                                          ...updatedQuestions[index],
                                          incorrectDescription: e.target.value
                                        };
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: updatedQuestions
                                        }));
                                      }}
                                      placeholder="Explain why this is not the correct answer (e.g., 'Hindi tama. Ang sagot ay...')"
                                      className="pa-textarea"
                                      rows={2}
                                    ></textarea>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="pa-add-sentence-question-btn"
                              onClick={handleAddSentenceQuestion}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Comprehension Question
                            </button>

                            <div className="pa-help-text">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              Note: Only two answer choices (correct and incorrect) will be shown to students.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pa-question-form-buttons">
                      <button
                        type="button"
                        className="pa-cancel-btn"
                        onClick={() => setShowQuestionForm(false)}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                      </button>
                      <button
                        type="button"
                        className="pa-save-question-btn"
                        onClick={handleQuestionFormSubmit}
                      >
                        <FontAwesomeIcon icon={currentQuestion !== null ? faEdit : faPlus} />
                        {currentQuestion !== null ? ' Update Question' : ' Add Question'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pa-assessment-form">
                  <div className="pa-assessment-form-header">
                    <h4>
                      <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                      {modalType === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
                    </h4>
                    <p className="pa-form-description">
                      Build targeted assessments to evaluate student progress in specific reading skills and categories.
                    </p>
                  </div>

                  <div className="pa-form-section">
                    <h5>
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Assessment Configuration
                    </h5>

                    <div className="pa-form-row">
                      <div className="pa-form-group">
                        <label htmlFor="readingLevel">
                          Reading Level:
                          <Tooltip text="Select the CRLA reading level this assessment targets." />
                        </label>
                        <select
                          id="readingLevel"
                          name="readingLevel"
                          value={formData.readingLevel}
                          onChange={handleFormChange}
                          required
                          className={`pa-select-input ${modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate ? 'pa-select-error' : ''}`}
                        >
                          <option value="">Select Reading Level</option>
                          <option value="Low Emerging">Low Emerging</option>
                          <option value="High Emerging">High Emerging</option>
                          <option value="Developing">Developing</option>
                          <option value="Transitioning">Transitioning</option>
                          <option value="At Grade Level">At Grade Level</option>
                        </select>
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="category">
                          Category:
                          <Tooltip text="Select the specific reading skill category to assess." />
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className={`pa-select-input ${modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate ? 'pa-select-error' : ''}`}
                        >
                          <option value="">Select Category</option>
                          <option value="Alphabet Knowledge">Alphabet Knowledge</option>
                          <option value="Phonological Awareness">Phonological Awareness</option>
                          <option value="Decoding">Decoding</option>
                          <option value="Word Recognition">Word Recognition</option>
                          <option value="Reading Comprehension">Reading Comprehension</option>
                        </select>
                        
                        {modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate && (
                          <div className="pa-combination-error">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            This combination already exists. Only one assessment per reading level and category is allowed.
                            <button 
                              type="button"
                              className="pa-edit-existing-link"
                              onClick={() => {
                                // Close current modal
                                setShowModal(false);
                                // Find the existing assessment
                                const existing = checkExistingAssessment(formData.readingLevel, formData.category);
                                if (existing) {
                                  // Open it in edit mode
                                  setTimeout(() => handleEditAssessment(existing), 300);
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} /> Edit Existing Assessment
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pa-form-section">
                    <div className="pa-questions-header">
                      <h5>
                        <FontAwesomeIcon icon={faFileAlt} />
                        Assessment Questions
                      </h5>
                      <div className="pa-questions-stats">
                        <span className="pa-questions-count">
                          {formData.questions.length} questions added
                        </span>
                        <button
                          type="button"
                          className="pa-add-question-btn"
                          onClick={handleAddQuestion}
                          disabled={!formData.category || (modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate)}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Add Question
                        </button>
                      </div>
                    </div>

                    <div className="pa-questions-container">
                      {formData.questions.length === 0 ? (
                        <div className="pa-no-questions">
                          <FontAwesomeIcon icon={faQuestion} className="pa-no-questions-icon" />
                          <h6>No questions added yet</h6>
                          <p>Start building your assessment by adding questions tailored to your selected category and reading level.</p>
                          {!formData.category && (
                            <div className="pa-category-reminder">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              Select a category above to begin adding questions.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pa-question-list">
                          {formData.questions.map((question, index) => (
                            <div key={index} className="pa-question-item">
                              <div className="pa-question-item-header">
                                <div className="pa-question-info">
                                  <span className="pa-question-number">Q{index + 1}</span>
                                  <div className="pa-question-details">
                                    <span className="pa-question-category">
                                      {getQuestionTypeDisplay(question.questionType)}
                                    </span>
                                    <span className="pa-question-text-preview">
                                      {question.questionText}
                                    </span>
                                  </div>
                                </div>

                                <div className="pa-question-item-actions">
                                  <button
                                    className="pa-edit-question-btn"
                                    onClick={() => handleEditQuestion(question, index)}
                                    title="Edit question"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    className="pa-remove-question"
                                    onClick={() => handleRemoveQuestion(index)}
                                    title="Remove question"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              </div>

                              <div className="pa-question-item-metadata">
                                <div className="pa-question-meta-item">
                                  {question.questionImage && (
                                    <span className="pa-meta-tag">
                                      <FontAwesomeIcon icon={faImages} /> Has Image
                                    </span>
                                  )}
                                  {question.questionType === "sentence" ? (
                                    <>
                                      <span className="pa-meta-tag">
                                        <FontAwesomeIcon icon={faBook} /> {question.passages?.length || 0} Pages
                                      </span>
                                      <span className="pa-meta-tag">
                                        <FontAwesomeIcon icon={faQuestion} /> {question.sentenceQuestions?.length || 0} Questions
                                      </span>
                                    </>
                                  ) : (
                                    <span className="pa-meta-tag">
                                      <FontAwesomeIcon icon={faCheckCircle} /> {question.choiceOptions?.length || 0} Options
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin approval message removed */}
                </div>
              )}
            </div>

            <div className="pa-modal-footer">
              {modalType === 'delete' ? (
                <>
                  <button
                    className="pa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button
                    className="pa-modal-delete"
                    onClick={handleDeleteAssessment}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Assessment
                  </button>
                </>
              ) : modalType === 'preview' ? (
                <button
                  className="pa-modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} /> Close Preview
                </button>
              ) : showQuestionForm ? (
                null
              ) : (
                <>
                  <button
                    className="pa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button
                    className="pa-modal-save"
                    onClick={handleSaveAssessment}
                    disabled={!formData.readingLevel || !formData.category || formData.questions.length === 0 || (modalType === 'create' && !canCreateAssessment(formData.readingLevel, formData.category).canCreate)}
                  >
                    <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                    {modalType === 'create' ? ' Create Assessment' : ' Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {submitConfirmDialog && (
        <div className="pa-modal-overlay">
          <div className="pa-modal pa-confirm-dialog">
            <div className="pa-modal-header">
              <h3><FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} className="pa-modal-header-icon" /> 
                {modalType === 'create' ? 'Create Assessment' : 'Save Changes'}
              </h3>
              <button
                className="pa-modal-close"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="pa-modal-body">
              <div className="pa-confirm-icon">
                <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
              </div>
              <div className="pa-confirm-message">
                <p>You're about to {modalType === 'create' ? 'create a new' : 'update this'} assessment.</p>
                <p>Once saved, it will be immediately available in the system.</p>
                <p className="pa-confirm-question">Would you like to proceed?</p>
              </div>

              <div className="pa-submission-summary">
                <h4>Assessment Summary:</h4>
                <div className="pa-summary-details">
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Reading Level:</span>
                    <span className="pa-summary-value">{formData.readingLevel}</span>
                  </div>
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Category:</span>
                    <span className="pa-summary-value">{formData.category}</span>
                  </div>
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Total Questions:</span>
                    <span className="pa-summary-value">{formData.questions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pa-modal-footer">
              <button
                className="pa-modal-cancel"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back and Edit
              </button>
              <button
                className="pa-modal-save"
                onClick={handleConfirmSubmit}
              >
                <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} /> 
                {modalType === 'create' ? 'Create Assessment' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {submitSuccessDialog && (
        <div className="pa-success-notification">
          <div className="pa-success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="pa-success-message">
            <p>
              {modalType === 'create' 
                ? 'Assessment created successfully!' 
                : 'Assessment updated successfully!'}
            </p>
            <div className="pa-success-detail">
              <span>{formData.readingLevel}</span> | <span>{formData.category}</span>
            </div>
          </div>
        </div>
      )}

      {deleteSuccessDialog && (
        <div className="pa-success-notification">
          <div className="pa-success-icon">
            <FontAwesomeIcon icon={faTrash} />
          </div>
          <div className="pa-success-message">
            <p>Assessment deleted successfully!</p>
          </div>
        </div>
      )}

      {duplicateRestrictionDialog && (
        <div className="pa-modal-overlay">
          <div className="pa-modal pa-restriction-dialog">
            <div className="pa-modal-header">
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} className="pa-modal-header-icon" /> 
                Cannot Create Assessment
              </h3>
              <button 
                className="pa-modal-close"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pa-modal-body">
              <div className="pa-restriction-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="pa-restriction-message">
                <p>
                  <strong>Restriction:</strong> Only one assessment per reading level and category combination is allowed.
                </p>
                <p>
                  For <strong>{formData.readingLevel}</strong> level and <strong>{formData.category}</strong> category:
                </p>
                
                {(() => {
                  const existing = checkExistingAssessment(formData.readingLevel, formData.category);
                  if (existing) {
                    return (
                      <div className="pa-restriction-details">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>An assessment already exists for this reading level and category combination</span>
                        
                        <div className="pa-existing-assessment-details">
                          <h5>Existing Assessment Details:</h5>
                          <div className="pa-existing-detail">
                            <span className="pa-existing-label">Status:</span>
                            <span className={`pa-existing-value ${existing.isActive ? 'active' : 'inactive'}`}>
                              <FontAwesomeIcon icon={existing.isActive ? faCheckCircle : faExclamationTriangle} />
                              {existing.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="pa-existing-detail">
                            <span className="pa-existing-label">Questions:</span>
                            <span className="pa-existing-value">{existing.questions?.length || 0}</span>
                          </div>
                          <div className="pa-existing-detail">
                            <span className="pa-existing-label">ID:</span>
                            <span className="pa-existing-value pa-existing-id">{existing._id}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
                
                <div className="pa-restriction-options">
                  <p>You can:</p>
                  <ul className="pa-restriction-list">
                    <li>Edit the existing assessment instead of creating a new one</li>
                    <li>Choose a different reading level or category combination</li>
                    <li>Deactivate or delete the existing assessment first</li>
                    <li>Contact an administrator if you need special assistance</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="pa-modal-footer">
              <button
                className="pa-modal-close-btn"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unified Template Preview for Preview All functionality */}
      <UnifiedTemplatePreview 
        isOpen={isPreviewAllDialogOpen}
        onClose={() => setIsPreviewAllDialogOpen(false)}
        templates={previewAllTemplates}
        templateType="assessment"
        onEditTemplate={(assessment) => {
          setIsPreviewAllDialogOpen(false);
          handleEditAssessment(assessment);
        }}
      />
      
      <ToastContainer position="top-center" />
    </div>
  );
};

// To maintain compatibility, we export as both MainAssessment and the original PostAssessment name
export { MainAssessment as PostAssessment };
export default MainAssessment;