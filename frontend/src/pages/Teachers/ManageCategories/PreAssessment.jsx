// src/pages/Teachers/ManageCategories/PreAssessment.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faEye,
  faEdit,
  faPlus,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
  faInfoCircle,
  faListAlt,
  faBook,
  faChartLine,
  faArrowRight,
  faImages,
  faUpload,
  faQuestionCircle,
  faVolumeUp,
  faArrowLeft,
  faLock,
  faBan,
  faTrash,
  faGraduationCap,
  faExclamationCircle,
  faQuestion
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PreAssessment.css";
import "../../../css/Teachers/ManageCategories/PreAssessmentUpdates.css";
import { PreAssessmentService } from "../../../services/Teachers";
import UnifiedTemplatePreview from "./UnifiedTemplatePreview";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="pre-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="pre-tooltip-icon" />
    <span className="pre-tooltip-text">{text}</span>
  </div>
);

const PreAssessment = () => {
  const [preAssessment, setPreAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [dataChangeCounter, setDataChangeCounter] = useState(0);
  const [currentQuestionData, setCurrentQuestionData] = useState({
    questionId: '',
    questionTypeId: '',
    questionType: '',
    questionText: '',
    questionImage: null,
    questionValue: '',
    difficultyLevel: '',
    options: [
      { optionId: '1', optionText: '', isCorrect: true },
      { optionId: '2', optionText: '', isCorrect: false }
    ],
    passages: [
      { pageNumber: 1, pageText: '', pageImage: null, pageImageS3Path: null }
    ],
    sentenceQuestions: [
      { questionText: '', correctAnswer: '', incorrectAnswer: '', correctAnswerChoice: "1" }
    ]
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    totalQuestions: 25,
    categoryCounts: {
      alphabet_knowledge: 5,
      phonological_awareness: 5,
      decoding: 5,
      word_recognition: 5,
      reading_comprehension: 5
    },
    language: "FL",
    questions: []
  });
  const [questionTypes, setQuestionTypes] = useState([]);
  // Preview All state variables
  const [isPreviewAllDialogOpen, setIsPreviewAllDialogOpen] = useState(false);
  const [previewAllTemplates, setPreviewAllTemplates] = useState([]);
  const [previewAllCurrentIndex, setPreviewAllCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch pre-assessment data
    const fetchPreAssessment = async () => {
      try {
        setLoading(true);
        console.log('Fetching pre-assessments from API...');
        
        // Fetch question types first to ensure they're available
        console.log('Fetching question types from API...');
        const typesResponse = await PreAssessmentService.getAllQuestionTypes();
        if (typesResponse.success) {
          console.log('Question types fetched successfully:', typesResponse.data.length);
          setQuestionTypes(typesResponse.data);
        } else {
          console.error('Error fetching question types:', typesResponse.message);
        }
        
        // Use PreAssessmentService to fetch assessment data from the API
        const response = await PreAssessmentService.getAllPreAssessments();
        console.log('API Response for assessments:', response);
        
        if (response.success) {
          // If there are pre-assessments, use the first one
          if (response.data && response.data.length > 0) {
            const assessmentId = response.data[0]._id;
            
            // Fetch the complete pre-assessment with questions
            console.log('Fetching detailed pre-assessment data for ID:', assessmentId);
            const detailResponse = await PreAssessmentService.getPreAssessmentById(assessmentId);
            console.log('Detail response success:', detailResponse.success);
            
            if (detailResponse.success && detailResponse.data) {
              const fetchedPreAssessment = detailResponse.data;
              
              // Ensure isActive field exists with a default value if not present
              fetchedPreAssessment.isActive = fetchedPreAssessment.isActive !== undefined ? 
                fetchedPreAssessment.isActive : true;
                
              // Ensure lastUpdated field exists with a valid date
              fetchedPreAssessment.lastUpdated = fetchedPreAssessment.lastUpdated || 
                fetchedPreAssessment.updatedAt || 
                new Date().toISOString();
              
              // Debug logging for questions
              console.log('Fetched pre-assessment with questions count:', 
                fetchedPreAssessment.questions ? fetchedPreAssessment.questions.length : 0);
              if (fetchedPreAssessment.questions && fetchedPreAssessment.questions.length > 0) {
                console.log('First question:', fetchedPreAssessment.questions[0]);
              }
              
              // Update total questions count
              fetchedPreAssessment.totalQuestions = fetchedPreAssessment.questions ? 
                fetchedPreAssessment.questions.length : 0;
              
              setPreAssessment(fetchedPreAssessment);
              
              // Calculate actual category counts based on questions
              const dynamicCategoryCounts = {
                alphabet_knowledge: 0,
                phonological_awareness: 0,
                decoding: 0,
                word_recognition: 0,
                reading_comprehension: 0
              };
              
              // Count questions by category
              if (fetchedPreAssessment.questions && fetchedPreAssessment.questions.length > 0) {
                fetchedPreAssessment.questions.forEach(question => {
                  if (question.questionTypeId && dynamicCategoryCounts.hasOwnProperty(question.questionTypeId)) {
                    dynamicCategoryCounts[question.questionTypeId]++;
                  }
                });
              }
              
              // Initialize form data
              setFormData({
                title: fetchedPreAssessment.title || "",
                description: fetchedPreAssessment.description || "",
                instructions: fetchedPreAssessment.instructions || "",
                totalQuestions: fetchedPreAssessment.totalQuestions,
                categoryCounts: dynamicCategoryCounts,
                language: fetchedPreAssessment.language || "FL",
                questions: fetchedPreAssessment.questions ? JSON.parse(JSON.stringify(fetchedPreAssessment.questions)) : [],
                isActive: fetchedPreAssessment.isActive,
                lastUpdated: fetchedPreAssessment.lastUpdated
              });
            } else {
              console.error('Error fetching pre-assessment details:', detailResponse.message);
              setPreAssessment(response.data[0]);
            }
          } else {
            console.log('No pre-assessments found');
            setPreAssessment(null);
          }
        } else {
          console.error('Error fetching pre-assessments:', response.message);
          setError(response.message || "Failed to load pre-assessment data. Please try again.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Exception in fetchPreAssessment:', err);
        setError("Failed to load pre-assessment data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchPreAssessment();
  }, []);

  // Add new useEffect to refresh data when changes occur
  useEffect(() => {
    if (dataChangeCounter > 0) {
      const refreshData = async () => {
        try {
          setLoading(true);
          
          if (preAssessment && preAssessment._id) {
            console.log('Refreshing pre-assessment data after change...');
            const refreshResponse = await PreAssessmentService.getPreAssessmentById(preAssessment._id);
            
            if (refreshResponse.success) {
              // Update with fresh data from server
              const freshData = refreshResponse.data;
              
              // Ensure required fields exist
              freshData.isActive = freshData.isActive !== undefined ? freshData.isActive : true;
              freshData.lastUpdated = freshData.lastUpdated || freshData.updatedAt || new Date().toISOString();
              freshData.totalQuestions = freshData.questions ? freshData.questions.length : 0;
              
              console.log('Refreshed data:', freshData);
              setPreAssessment(freshData);
            }
          }
        } catch (err) {
          console.error('Error refreshing data:', err);
        } finally {
          setLoading(false);
        }
      };
      
      refreshData();
    }
  }, [dataChangeCounter]);

  // Handle navigating through questions in preview modal
  const handleQuestionNavigation = (direction) => {
    if (!preAssessment || !preAssessment.questions) return;
    
    if (direction === "next" && currentQuestionIndex < preAssessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === "prev" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Handle Preview All Questions
  const handlePreviewAllQuestions = () => {
    if (preAssessment && preAssessment.questions && preAssessment.questions.length > 0) {
      setPreviewAllTemplates([{
        ...preAssessment,
        // Include any properties needed for the preview
        templateType: 'preassessment'
      }]);
      setPreviewAllCurrentIndex(0);
      setIsPreviewAllDialogOpen(true);
    } else {
      toast.warning("No questions available to preview.");
    }
  };

  // Modified to count questions automatically
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // We don't need to handle totalQuestions change anymore since it's based on actual questions count
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // New function to distribute questions evenly across categories
  const distributeQuestionsEvenly = (total, categories) => {
    const baseCount = Math.floor(total / categories.length);
    const remainder = total % categories.length;
    
    const newCounts = {};
    categories.forEach((category, index) => {
      // Add one extra to some categories if there's a remainder
      newCounts[category] = baseCount + (index < remainder ? 1 : 0);
    });
    
    return newCounts;
  };

  // Handle category count changes - now only updates the total
  const handleCategoryCountChange = (category, value) => {
    // This function is no longer needed as we auto-distribute
    // Keeping it for backward compatibility but making it a no-op
  };

  // Define category-specific question types with improved handling
  const getCategoryQuestionTypes = (categoryId) => {
    if (!categoryId) return [];
    
    // Simplified question types as per request
    const categoryQuestionTypes = {
      'alphabet_knowledge': ['patinig', 'katinig'],
      'phonological_awareness': ['patinigSound', 'katinigSound'],
      'decoding': ['word'],
      'word_recognition': ['word'],
      'reading_comprehension': ['sentence']
    };
    
    return categoryQuestionTypes[categoryId] || [];
  };

  // Handle creating new pre-assessment
  const handleCreatePreAssessment = () => {
    // Initialize with empty questions array
    setFormData({
      title: "",
      description: "",
      instructions: "",
      totalQuestions: 0,
      categoryCounts: {
        alphabet_knowledge: 0,
        phonological_awareness: 0,
        decoding: 0,
        word_recognition: 0,
        reading_comprehension: 0
      },
      language: "FL",
      questions: []
    });
    setShowCreateModal(true);
  };

  // Handle editing existing pre-assessment
  const handleEditPreAssessment = () => {
    // Make sure formData has the latest questions from preAssessment
    if (preAssessment) {
      console.log('Editing pre-assessment with questions:', 
        preAssessment.questions ? preAssessment.questions.length : 0);
      
      // Calculate actual category counts based on questions
      const dynamicCategoryCounts = {
        alphabet_knowledge: 0,
        phonological_awareness: 0,
        decoding: 0,
        word_recognition: 0,
        reading_comprehension: 0
      };
      
      // Count questions by category
      if (preAssessment.questions && preAssessment.questions.length > 0) {
        preAssessment.questions.forEach(question => {
          if (question.questionTypeId && dynamicCategoryCounts.hasOwnProperty(question.questionTypeId)) {
            dynamicCategoryCounts[question.questionTypeId]++;
          }
        });
      }
      
      // Ensure we have valid isActive and lastUpdated values
      const isActive = preAssessment.isActive !== undefined ? preAssessment.isActive : true;
      const lastUpdated = preAssessment.lastUpdated || preAssessment.updatedAt || new Date().toISOString();
      
      // Deep copy the preAssessment data to formData to ensure we have all questions
      setFormData({
        title: preAssessment.title || "",
        description: preAssessment.description || "",
        instructions: preAssessment.instructions || "",
        totalQuestions: preAssessment.questions ? preAssessment.questions.length : 0,
        categoryCounts: dynamicCategoryCounts,
        language: preAssessment.language || "FL",
        questions: preAssessment.questions ? JSON.parse(JSON.stringify(preAssessment.questions)) : [],
        isActive: isActive,
        lastUpdated: lastUpdated
      });
      
      console.log('Form data set with questions count:', 
        preAssessment.questions ? preAssessment.questions.length : 0);
    }
    setShowEditModal(true);
  };

  // Handle deleting pre-assessment
  const handleDeleteConfirm = () => {
    setShowDeleteModal(true);
  };

  // Handle form submission
  const handleFormSubmit = () => {
    // Validate form
    if (!formData.title) {
      toast.error("Please enter a title for the assessment.");
      return;
    }
    
    if (!formData.description) {
      toast.error("Please enter a description for the assessment.");
      return;
    }
    
    if (!formData.instructions) {
      toast.error("Please enter instructions for the assessment.");
      return;
    }

    // Show confirmation dialog
    setShowSubmitConfirmModal(true);
  };

  // Handle confirmed submission
  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      
      // Create assessment data that matches the database schema
      const assessmentData = {
        ...formData,
        type: "pre_assessment",
        status: "active",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        lastUpdated: new Date().toISOString(),
        // Always use this assessment ID
        assessmentId: "FL-G1-001", 
        // If we're editing an existing assessment, keep its ID
        ...(preAssessment && { _id: preAssessment._id }),
        // Add required fields from the schema
        continueButtonText: formData.continueButtonText || "MAG PATULOY",
        difficultyLevels: preAssessment?.difficultyLevels || {
          low_emerging: {
            description: "Basic recognition tasks",
            targetReadingLevel: "Low Emerging",
            weight: 1
          },
          high_emerging: {
            description: "Simple identification and matching",
            targetReadingLevel: "High Emerging",
            weight: 2
          },
          developing: {
            description: "Word formation and basic comprehension",
            targetReadingLevel: "Developing",
            weight: 3
          },
          transitioning: {
            description: "Sentence-level tasks and short texts",
            targetReadingLevel: "Transitioning",
            weight: 4
          },
          at_grade_level: {
            description: "Paragraph-level comprehension",
            targetReadingLevel: "At Grade Level",
            weight: 5
          }
        },
        scoringRules: preAssessment?.scoringRules || {
          "Low Emerging": {
            part1ScoreRange: [0, 10],
            readingPercentageRange: [0, 16],
            correctAnswersRange: [0, 0]
          },
          "High Emerging": {
            part1ScoreRange: [11, 13],
            readingPercentageRange: [1, 25],
            correctAnswersRange: [0, 0]
          },
          "Developing": {
            part1ScoreRange: [14, 16],
            readingPercentageRange: [26, 50],
            correctAnswersRange: [1, 1]
          },
          "Transitioning": {
            part1ScoreRange: [17, 20],
            readingPercentageRange: [51, 75],
            correctAnswersRange: [2, 3]
          },
          "At Grade Level": {
            part1ScoreRange: [17, 20],
            readingPercentageRange: [76, 100],
            correctAnswersRange: [4, 5]
          }
        }
      };
      
      console.log('Submitting pre-assessment data:', assessmentData);
      
      // Use PreAssessmentService to create or update the assessment
      let response;
      if (preAssessment && preAssessment._id) {
        response = await PreAssessmentService.updatePreAssessment(preAssessment._id, assessmentData);
      } else {
        response = await PreAssessmentService.createPreAssessment(assessmentData);
      }
      
      console.log('API Response:', response);
      
      if (response.success) {
        // After successful update/create, fetch the complete assessment data
        if (response.data && response.data._id) {
          const fetchResponse = await PreAssessmentService.getPreAssessmentById(response.data._id);
          if (fetchResponse.success) {
            // Update the preAssessment state with fresh data
            const updatedAssessment = fetchResponse.data;
            
            // Ensure isActive and lastUpdated fields are set properly
            updatedAssessment.isActive = updatedAssessment.isActive !== undefined ? 
              updatedAssessment.isActive : true;
            updatedAssessment.lastUpdated = updatedAssessment.lastUpdated || 
              updatedAssessment.updatedAt || 
              new Date().toISOString();
            
            // Update total questions count
            updatedAssessment.totalQuestions = updatedAssessment.questions ? 
              updatedAssessment.questions.length : 0;
              
            setPreAssessment(updatedAssessment);
          } else {
            // If fetch fails, use the response data as fallback
            const fallbackData = {
              ...response.data,
              isActive: assessmentData.isActive,
              lastUpdated: assessmentData.lastUpdated
            };
            setPreAssessment(fallbackData);
          }
        } else {
          // If no ID in response, use the response data directly
          const fallbackData = {
            ...response.data,
            isActive: assessmentData.isActive,
            lastUpdated: assessmentData.lastUpdated
          };
          setPreAssessment(fallbackData);
        }
        
        setShowSubmitConfirmModal(false);
        setShowCreateModal(false);
        setShowEditModal(false);
        setShowSuccessModal(true);
        
        // Show success toast with improved visibility
        toast.success(preAssessment ? "Pre-assessment updated successfully!" : "Pre-assessment created successfully!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        
        // Trigger refresh
        setDataChangeCounter(prev => prev + 1);
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        setError(response.message || "Failed to save pre-assessment. Please try again.");
        toast.error(response.message || "Failed to save pre-assessment. Please try again.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        setShowSubmitConfirmModal(false);
      }
    } catch (err) {
      console.error('Exception in handleConfirmSubmit:', err);
      setError("Failed to save pre-assessment. Please try again.");
      toast.error("Failed to save pre-assessment. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });
      setShowSubmitConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    try {
      if (!preAssessment || !preAssessment._id) {
        setError("Cannot delete: No pre-assessment selected");
        toast.error("Cannot delete: No pre-assessment selected");
        return;
      }
      
      setLoading(true);
      console.log('Deleting pre-assessment:', preAssessment._id);
      
      // Use PreAssessmentService to delete the assessment
      const response = await PreAssessmentService.deletePreAssessment(preAssessment._id);
      console.log('API Response:', response);
      
      if (response.success) {
        setPreAssessment(null);
        setShowDeleteModal(false);
        setShowSuccessModal(true);
        
        toast.success("Pre-assessment deleted successfully!");
        
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        setError(response.message || "Failed to delete pre-assessment. Please try again.");
        toast.error(response.message || "Failed to delete pre-assessment. Please try again.");
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Exception in handleDelete:', err);
      setError("Failed to delete pre-assessment. Please try again.");
      toast.error("Failed to delete pre-assessment. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Check if actions are allowed based on status
  const canEdit = () => {
    return true; // Always allow editing
  };

  const canDelete = () => {
    return true; // Always allow deletion
  };

  // Modified to add auto-generation of Question ID
  const handleAddQuestion = () => {
    setCurrentQuestionData({
      questionId: '', // Will be auto-generated when category is selected
      questionTypeId: '',
      questionType: '',
      questionText: '',
      questionImage: null,
      difficultyLevel: '',
      options: [
        { optionId: '1', optionText: '', isCorrect: true },
        { optionId: '2', optionText: '', isCorrect: false }
      ],
      passages: [
        { pageNumber: 1, pageText: '', pageImage: null, pageImageS3Path: null }
      ],
      sentenceQuestions: [
        { questionText: '', correctAnswer: '', incorrectAnswer: '', correctAnswerChoice: "1" }
      ]
    });
    
    setEditingQuestionIndex(-1);
    setShowQuestionEditor(true);
  };

  // Adding a function to generate question ID based on category
  const generateQuestionId = (categoryId) => {
    const prefixMap = {
      'alphabet_knowledge': 'AK',
      'phonological_awareness': 'PA',
      'decoding': 'DC',
      'word_recognition': 'WR',
      'reading_comprehension': 'RC'
    };
    
    const prefix = prefixMap[categoryId] || 'QS';
    
    // Count how many questions of this category type already exist
    const existingCount = formData.questions.filter(q => q.questionTypeId === categoryId).length;
    const paddedNumber = String(existingCount + 1).padStart(3, '0');
    
    return `${prefix}_${paddedNumber}`;
  };

  // Restore missing handleEditQuestion function
  const handleEditQuestion = (index) => {
    const question = formData.questions[index];
    
    // Create a base question data object
    const baseQuestionData = {
      questionId: question.questionId || '',
      questionTypeId: question.questionTypeId || '',
      questionType: question.questionType || '', // Preserve the existing questionType
      questionText: question.questionText || '',
      difficultyLevel: question.difficultyLevel || '',
    };
    
    // Add fields based on question type
    if (question.questionTypeId === 'reading_comprehension') {
      // For reading comprehension, don't include questionValue and questionImage
      baseQuestionData.passages = question.passages && question.passages.length > 0 ?
        question.passages.map(p => ({
          pageNumber: p.pageNumber,
          pageText: p.pageText || '',
          pageImage: p.pageImage || null,
          pageImageS3Path: p.pageImageS3Path || null
        })) :
        [{ pageNumber: 1, pageText: '', pageImage: null, pageImageS3Path: null }];
      
      baseQuestionData.sentenceQuestions = question.sentenceQuestions && question.sentenceQuestions.length > 0 ?
        question.sentenceQuestions.map(sq => ({
          questionText: sq.questionText || '',
          correctAnswer: sq.correctAnswer || '',
          incorrectAnswer: sq.incorrectAnswer || '',
          correctAnswerChoice: sq.correctAnswerChoice || "1" // Default to "1" if not set
        })) :
        [{ questionText: '', correctAnswer: '', incorrectAnswer: '', correctAnswerChoice: "1" }];
    } else {
      // For other question types, include questionValue and questionImage
      baseQuestionData.questionValue = question.questionValue || '';
      baseQuestionData.questionImage = question.questionImage || null;
      baseQuestionData.questionImageS3Path = question.questionImageS3Path || null;
      
      baseQuestionData.options = question.options && question.options.length >= 2 ? 
        question.options.map(opt => ({...opt})) : // Deep copy to avoid reference issues
        [
          { optionId: '1', optionText: '', isCorrect: true },
          { optionId: '2', optionText: '', isCorrect: false }
        ];
    }
    
    console.log('Editing question with data:', baseQuestionData);
    setCurrentQuestionData(baseQuestionData);
    setEditingQuestionIndex(index);
    setShowQuestionEditor(true);
  };

  // Restore missing handleDeleteQuestion function
  const handleDeleteQuestion = async (index) => {
    // Show confirmation modal before deleting
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        setLoading(true);
        
        // Get the question ID from the questions array
        const questionId = formData.questions[index].questionId;
        
        if (preAssessment && preAssessment._id && questionId) {
          console.log(`Deleting question ${questionId} from assessment ${preAssessment._id}`);
          
          // Use PreAssessmentService to delete the question
          const response = await PreAssessmentService.deleteQuestionFromPreAssessment(
            preAssessment._id,
            questionId
          );
          
          console.log('API Response:', response);
          
          if (response.success) {
            // Update the local state with the updated assessment from the API
            setPreAssessment(response.data);
            
            // Also update the form data
            setFormData(prev => {
              const updatedQuestions = response.data.questions || [];
              return {
                ...prev,
                questions: updatedQuestions,
                totalQuestions: updatedQuestions.length
              };
            });
            
            toast.success("Question deleted successfully!");
          } else {
            setError(response.message || "Failed to delete question. Please try again.");
            toast.error(response.message || "Failed to delete question. Please try again.");
          }
        } else {
          // No assessment ID yet, just update the local state
          setFormData(prev => {
            const newQuestions = prev.questions.filter((_, i) => i !== index);
            return {
              ...prev,
              questions: newQuestions,
              totalQuestions: newQuestions.length
            };
          });
          
          toast.success("Question removed from draft!");
        }
      } catch (err) {
        console.error('Exception in handleDeleteQuestion:', err);
        setError("Failed to delete question. Please try again.");
        toast.error("Failed to delete question. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Modified to update questionId when category changes
  const handleQuestionDataChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'questionTypeId') {
      // Auto-generate questionId when category is selected
      const questionId = generateQuestionId(value);
      
      // Find the corresponding question type name
      const questionType = questionTypes.find(qt => qt.typeId === value);
      const questionTypeName = questionType ? questionType.typeName : '';
      
      console.log(`Setting question type to ${questionTypeName} for type ID ${value}`);
      
      setCurrentQuestionData(prev => ({
        ...prev,
        [name]: value,
        questionId: questionId,
        questionType: questionTypeName // Set the question type name from the found question type
      }));
    } else {
      setCurrentQuestionData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle question image upload with S3 path
  const handleQuestionImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // First show a preview from local file
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentQuestionData(prev => ({
          ...prev,
          questionImage: reader.result,
          // We'll set the S3 path after upload
        }));
      };
      reader.readAsDataURL(file);
      
      // Only upload to S3 when saving the question
      // This keeps the image as a preview until the user confirms
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionTextChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, optionText: value } : option
      )
    }));
  };

  const handleOptionCorrectChange = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }))
    }));
  };

  // New function to handle toggling active status
  const handleToggleActiveStatus = async (isActive) => {
    try {
      setLoading(true);
      
      if (!preAssessment || !preAssessment._id) {
        setError("Cannot toggle status: No pre-assessment selected");
        toast.error("Cannot toggle status: No pre-assessment selected", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        return;
      }
      
      console.log(`Toggling pre-assessment active status to: ${isActive}`);
      
      const response = await PreAssessmentService.toggleActiveStatus(preAssessment._id, isActive);
      
      if (response.success) {
        // Immediately update UI
        const updatedAssessment = {
          ...preAssessment,
          isActive: isActive,
          lastUpdated: new Date().toISOString()
        };
        
        setPreAssessment(updatedAssessment);
        
        // Update formData state
        setFormData(prev => ({
          ...prev,
          isActive: isActive,
          lastUpdated: updatedAssessment.lastUpdated
        }));
        
        // Show success toast with improved visibility
        toast.success(`Pre-assessment ${isActive ? 'activated' : 'deactivated'} successfully!`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        
        // Trigger refresh
        setDataChangeCounter(prev => prev + 1);
      } else {
        setError(response.message || "Failed to update pre-assessment status. Please try again.");
        toast.error(response.message || "Failed to update pre-assessment status. Please try again.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
      }
    } catch (err) {
      console.error('Exception in handleToggleActiveStatus:', err);
      setError("Failed to update pre-assessment status. Please try again.");
      toast.error("Failed to update pre-assessment status. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });
    } finally {
      setLoading(false);
    }
  };

  // Modified to handle S3 upload when saving
  const handleSaveQuestion = async () => {
    try {
      // Validation checks
      if (!currentQuestionData.questionTypeId) {
        toast.error('Please select a question type');
        return;
      }
    
      if (!currentQuestionData.questionText.trim()) {
        toast.error('Question text is required');
        return;
      }
    
      if (!currentQuestionData.difficultyLevel) {
        toast.error('Please select a difficulty level');
        return;
      }
    
      // Special validation for reading comprehension
      if (currentQuestionData.questionTypeId === 'reading_comprehension') {
        // Check passages
        if (!currentQuestionData.passages.length) {
          toast.error('At least one passage is required');
          return;
        }

        const hasEmptyPassage = currentQuestionData.passages.some(p => !p.pageText.trim());
        if (hasEmptyPassage) {
          toast.error('All passages must have text');
          return;
        }

        // Check sentence questions
        if (!currentQuestionData.sentenceQuestions.length) {
          toast.error('At least one comprehension question is required');
          return;
        }

        const hasEmptySentenceQuestion = currentQuestionData.sentenceQuestions.some(
          q => !q.questionText.trim() || !q.correctAnswer.trim() || !q.incorrectAnswer.trim() || !q.correctAnswerChoice
        );
        if (hasEmptySentenceQuestion) {
          toast.error('All comprehension questions must be complete');
          return;
        }
      } else {
        // Regular question validation
        const hasEmptyOption = currentQuestionData.options.some(opt => !opt.optionText.trim());
        if (hasEmptyOption) {
          toast.error('All options must have text');
          return;
        }
      }

      // Generate a question ID if not already set
      if (!currentQuestionData.questionId) {
        currentQuestionData.questionId = generateQuestionId(currentQuestionData.questionTypeId);
      }

      // Make a copy of the current question data to avoid modifying the state directly
      const questionToSave = { ...currentQuestionData };

      // Ensure question type is preserved
      if (!questionToSave.questionType || questionToSave.questionType.trim() === '') {
        // Get question type name from the questionTypes array if not already set
        const questionType = questionTypes.find(qt => qt.typeId === questionToSave.questionTypeId);
        questionToSave.questionType = questionType ? questionType.typeName : '';
      }

      // For non-reading comprehension questions, handle image upload
      if (questionToSave.questionTypeId !== 'reading_comprehension') {
        // Upload image if present and new
        if (questionToSave.questionImage && 
            typeof questionToSave.questionImage === 'string' && 
            questionToSave.questionImage.startsWith('data:')) {
          try {
            // Convert data URL to file
            const file = await dataURLtoFile(
              questionToSave.questionImage,
              `question_${questionToSave.questionId}.png`
            );
            
            // Upload to server
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await PreAssessmentService.uploadMedia(formData);
            if (response.success) {
              questionToSave.questionImage = response.fileUrl;
              questionToSave.questionImageS3Path = response.s3Path;
            }
          } catch (error) {
            console.error('Error uploading question image:', error);
            toast.error('Failed to upload question image');
            // Continue without the image
            questionToSave.questionImage = null;
          }
        }
      } else {
        // For reading comprehension, explicitly set questionValue and questionImage to null
        questionToSave.questionValue = null;
        questionToSave.questionImage = null;
        questionToSave.questionImageS3Path = null;
      }

      // Upload passage images if present and new
      if (questionToSave.questionTypeId === 'reading_comprehension') {
        for (let i = 0; i < questionToSave.passages.length; i++) {
          const passage = questionToSave.passages[i];
          if (passage.pageImage && 
              typeof passage.pageImage === 'string' && 
              passage.pageImage.startsWith('data:')) {
            try {
              // Convert data URL to file
              const file = await dataURLtoFile(
                passage.pageImage,
                `passage_${questionToSave.questionId}_page${passage.pageNumber}.png`
              );
              
              // Upload to server
              const formData = new FormData();
              formData.append('file', file);
              
              const response = await PreAssessmentService.uploadMedia(formData);
              if (response.success) {
                questionToSave.passages[i].pageImage = response.fileUrl;
                questionToSave.passages[i].pageImageS3Path = response.s3Path;
              }
            } catch (error) {
              console.error('Error uploading passage image:', error);
              toast.error(`Failed to upload image for passage ${passage.pageNumber}`);
              // Continue without the image
              questionToSave.passages[i].pageImage = null;
            }
          }
        }
      }

      // Add question number if not editing
      if (editingQuestionIndex === -1) {
        questionToSave.questionNumber = formData.questions.length + 1;
      } else {
        // Keep the existing question number when editing
        questionToSave.questionNumber = formData.questions[editingQuestionIndex].questionNumber;
      }

      // Update the questions array
      const updatedQuestions = [...formData.questions];
      if (editingQuestionIndex >= 0) {
        // When editing, preserve any fields we didn't modify
        updatedQuestions[editingQuestionIndex] = {
          ...updatedQuestions[editingQuestionIndex],
          ...questionToSave
        };
      } else {
        updatedQuestions.push(questionToSave);
      }

      // Update category counts
      const updatedCategoryCounts = { ...formData.categoryCounts };
      
      // If we're editing, first decrement the old category count
      if (editingQuestionIndex >= 0) {
        const oldCategory = formData.questions[editingQuestionIndex].questionTypeId;
        if (oldCategory && updatedCategoryCounts[oldCategory] > 0) {
          updatedCategoryCounts[oldCategory]--;
        }
      }
      
      // Increment the new category count
      const newCategory = questionToSave.questionTypeId;
      if (newCategory) {
        updatedCategoryCounts[newCategory] = (updatedCategoryCounts[newCategory] || 0) + 1;
      }

      // Log what we're saving for debugging
      console.log('Saving question:', questionToSave);

      // Update form data with new questions and category counts
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions,
        categoryCounts: updatedCategoryCounts
      }));

      // Close the question editor
      setShowQuestionEditor(false);
      toast.success(editingQuestionIndex >= 0 ? 'Question updated successfully' : 'Question added successfully');
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  // Helper function to convert data URL to File object
  const dataURLtoFile = async (dataURL, filename) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  // Function to get color for each category
  const getCategoryColor = (category) => {
    const colorMap = {
      'alphabet_knowledge': '#4299e1',
      'phonological_awareness': '#48bb78',
      'decoding': '#ed8936',
      'word_recognition': '#9f7aea',
      'reading_comprehension': '#f56565'
    };
    
    return colorMap[category] || '#a0aec0';
  };

  if (loading) {
    return (
      <div className="pre-assessment-container">
        <div className="pre-loading">
          <div className="pre-spinner"></div>
          <p>Loading pre-assessment curriculum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pre-assessment-container">
        <div className="pre-error">
          <FontAwesomeIcon icon={faExclamationTriangle} className="pre-error-icon" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="pre-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pre-assessment-container">
      <div className="pre-header">
        <h2>Pre-Assessment Management</h2>
        <p>
          Manage the standardized pre-assessment curriculum used to determine students' initial reading levels based on CRLA standards.
        </p>
      </div>

      {!preAssessment ? (
        // No pre-assessment exists - show create option
        <div className="pre-no-assessment">
          <div className="pre-no-assessment-icon">
            <FontAwesomeIcon icon={faClipboardCheck} />
          </div>
          <h3>No Pre-Assessment Curriculum Found</h3>
          <p>Create a standardized pre-assessment that will be used to evaluate all new students' initial reading levels.</p>
          <button 
            className="pre-button primary"
            onClick={handleCreatePreAssessment}
          >
            <FontAwesomeIcon icon={faPlus} /> Create Pre-Assessment Curriculum
          </button>
        </div>
      ) : (
        // Pre-assessment exists - show overview and actions
        <div className="pre-assessment-overview">
          <div className="pre-assessment-card">
            <div className="pre-assessment-info">
              <div className="pre-assessment-title">
                <FontAwesomeIcon icon={faClipboardCheck} className="pre-icon" />
                <h3>{preAssessment.title}</h3>
                <div className="pre-status-container">
                  <span className={`pre-status-badge ${preAssessment.isActive ? 'active' : 'inactive'}`}>
                    <FontAwesomeIcon icon={preAssessment.isActive ? faCheckCircle : faBan} /> 
                    {preAssessment.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p className="pre-assessment-description">{preAssessment.description}</p>
              
              <div className="pre-assessment-details">
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Total Questions:</span>
                  <span className="pre-detail-value">{preAssessment.questions ? preAssessment.questions.length : 0}</span>
                </div>
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Last Updated:</span>
                  <span className="pre-detail-value">
                    {preAssessment.lastUpdated ? 
                      new Date(preAssessment.lastUpdated).toLocaleString() : 
                      "Not available"}
                  </span>
                </div>
              </div>
              
              <div className="pre-assessment-actions">
                <button 
                  className={`pre-toggle-status-btn ${preAssessment.isActive ? 'deactivate' : 'activate'}`}
                  onClick={() => handleToggleActiveStatus(!preAssessment.isActive)}
                >
                  <FontAwesomeIcon icon={preAssessment.isActive ? faBan : faCheckCircle} />
                  {preAssessment.isActive ? 'Deactivate Assessment' : 'Activate Assessment'}
                </button>
              </div>
              
              <div className="pre-category-distribution">
                <h4>Category Distribution</h4>
                <div className="pre-category-bars">
                  {Object.entries({
                    'alphabet_knowledge': 'Alphabet Knowledge',
                    'phonological_awareness': 'Phonological Awareness',
                    'decoding': 'Decoding',
                    'word_recognition': 'Word Recognition',
                    'reading_comprehension': 'Reading Comprehension'
                  }).map(([category, label]) => {
                    // Count actual questions per category
                    const questionsInCategory = preAssessment.questions ? 
                      preAssessment.questions.filter(q => q.questionTypeId === category).length : 0;
                    
                    // Calculate total questions
                    const totalQuestions = preAssessment.questions ? preAssessment.questions.length : 0;
                    
                    // Calculate percentage based on total questions (avoid division by zero)
                    // Ensure minimum width for visibility
                    const percentage = totalQuestions > 0 ? Math.max((questionsInCategory / totalQuestions) * 100, questionsInCategory > 0 ? 5 : 0) : 0;
                    
                    return (
                      <div key={category} className="pre-category-bar-item">
                        <div className="pre-category-label">
                          {label}
                          <span className="pre-category-label-count">{questionsInCategory}</span>
                        </div>
                        <div className="pre-category-bar-container">
                          <div 
                            className={`pre-category-bar ${questionsInCategory === 0 ? 'pre-category-bar-empty' : ''}`}
                            style={{ width: `${percentage}%` }}
                          >
                            {questionsInCategory > 0 && (
                              <span className="pre-category-count">{questionsInCategory}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pre-actions-panel">
            <button 
              className="pre-action-button"
              onClick={() => setShowPreviewModal(true)}
            >
              <FontAwesomeIcon icon={faEye} />
              <span>Preview Assessment</span>
            </button>
            
            <button 
              className="pre-action-button"
              onClick={handlePreviewAllQuestions}
            >
              <FontAwesomeIcon icon={faEye} />
              <span>Preview All Questions</span>
            </button>
            
            <button 
              className="pre-action-button"
              onClick={handleEditPreAssessment}
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Edit Assessment</span>
            </button>
            
            <button 
              className="pre-action-button delete"
              onClick={handleDeleteConfirm}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Delete Assessment</span>
            </button>
          </div>
        </div>
      )}
      
      <div className="pre-system-info">
        <h3>About Pre-Assessment Process</h3>
        <div className="pre-info-grid">
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <div className="pre-info-content">
              <h4>Standardized Format</h4>
              <p>
                The pre-assessment follows a standardized format covering all five CRLA categories, 
                with questions balanced by difficulty level for accurate initial assessment.
              </p>
            </div>
          </div>
          
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="pre-info-content">
              <h4>Performance Tracking</h4>
              <p>
                Student performance is tracked across all categories, providing detailed 
                insights into strengths and areas for improvement to guide instruction.
              </p>
            </div>
          </div>
          
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faListAlt} />
            </div>
            <div className="pre-info-content">
              <h4>Post-Assessment Guidance</h4>
              <p>
                Results directly inform the creation of targeted post-assessments, 
                helping teachers focus on areas where students need the most support.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pre-process-flow">
        <h3>Pre-Assessment Process Flow</h3>
        <div className="pre-flow-steps">
          <div className="pre-flow-step">
            <div className="pre-step-number">1</div>
            <div className="pre-step-content">
              <h4>Curriculum Setup</h4>
              <p>Teachers create/update the standardized pre-assessment curriculum for the academic year.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">2</div>
            <div className="pre-step-content">
              <h4>Student Assignment</h4>
              <p>New students are automatically assigned the active pre-assessment.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">3</div>
            <div className="pre-step-content">
              <h4>Assessment Completion</h4>
              <p>Students complete the assessment on the mobile app with automatic scoring.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">4</div>
            <div className="pre-step-content">
              <h4>Level Assignment & Planning</h4>
              <p>System assigns reading levels and teachers create targeted post-assessments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && preAssessment && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-preview-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faEye} className="pre-modal-header-icon" />
                Preview Pre-Assessment
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => {
                  setShowPreviewModal(false);
                  setCurrentQuestionIndex(0);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            {preAssessment.questions && preAssessment.questions.length > 0 ? (
              <div className="pre-modal-body">
                <div className="pre-preview-info">
                  <div className="pre-preview-section">
                    <span className="pre-preview-label">Assessment:</span>
                    <span className="pre-preview-value">{preAssessment.title}</span>
                  </div>
                  
                  <div className="pre-preview-section">
                    <span className="pre-preview-label">Total Questions:</span>
                    <span className="pre-preview-value">{preAssessment.questions.length}</span>
                  </div>
                  
                  <div className="pre-preview-section">
                    <span className="pre-preview-label">Question {currentQuestionIndex + 1} of {preAssessment.questions.length}</span>
                  </div>
                </div>
                
                <div className="pre-question-preview">
                  <div className="pre-question-category">
                    {preAssessment.questions[currentQuestionIndex].questionTypeId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {preAssessment.questions[currentQuestionIndex].questionType && (
                      <span className="pre-question-subtype"> - {preAssessment.questions[currentQuestionIndex].questionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    )}
                  </div>
                  
                  <div className="pre-question-content">
                    {preAssessment.questions[currentQuestionIndex].questionImage && (
                      <div className="pre-question-image">
                        <img 
                          src={preAssessment.questions[currentQuestionIndex].questionImage} 
                          alt="Question visual" 
                          onError={(e) => {
                            console.error('Failed to load image:', preAssessment.questions[currentQuestionIndex].questionImage);
                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="pre-question-text">
                      {preAssessment.questions[currentQuestionIndex].questionText}
                    </div>
                    
                    {preAssessment.questions[currentQuestionIndex].questionValue && (
                      <div className="pre-question-value">
                        <span className="pre-question-value-label">Value:</span>
                        {preAssessment.questions[currentQuestionIndex].questionValue}
                      </div>
                    )}
                  </div>
                  
                  {preAssessment.questions[currentQuestionIndex].questionTypeId === 'reading_comprehension' ? (
                    <div className="pre-reading-comprehension">
                      <div className="pre-passages">
                        <h4>
                          <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
                          Story Passages
                        </h4>
                        {preAssessment.questions[currentQuestionIndex].passages && 
                          preAssessment.questions[currentQuestionIndex].passages.map((passage, idx) => (
                            <div key={idx} className="pre-passage">
                              <div className="pre-passage-header">Page {passage.pageNumber}</div>
                              <div className="pre-passage-content">
                                {passage.pageImage && (
                                  <div className="pre-passage-image">
                                    <img 
                                      src={passage.pageImage} 
                                      alt={`Page ${passage.pageNumber}`}
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="pre-passage-text">{passage.pageText}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                      <div className="pre-sentence-questions">
                        <h4>
                          <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
                          Comprehension Questions
                        </h4>
                        {preAssessment.questions[currentQuestionIndex].sentenceQuestions && 
                          preAssessment.questions[currentQuestionIndex].sentenceQuestions.map((question, idx) => (
                            <div key={idx} className="pre-sentence-question">
                              <div className="pre-sentence-question-text">{question.questionText}</div>
                              <div className="pre-sentence-options">
                                <div className="pre-option-item pre-correct-option">
                                  <div className="pre-option-content">{question.correctAnswer}</div>
                                  <div className="pre-correct-marker">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                  </div>
                                </div>
                                <div className="pre-option-item">
                                  <div className="pre-option-content">{question.incorrectAnswer}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="pre-options-preview">
                      {preAssessment.questions[currentQuestionIndex].options.map((option, index) => (
                        <div 
                          key={option.optionId || index} 
                          className={`pre-option-item ${option.isCorrect ? 'pre-correct-option' : ''}`}
                        >
                          <div className="pre-option-content">
                            {option.optionText}
                          </div>
                          {option.isCorrect && (
                            <div className="pre-correct-marker">
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
           
                
                <div className="pre-preview-navigation">
                  <button 
                    className="pre-nav-button"
                    onClick={() => handleQuestionNavigation("prev")}
                    disabled={currentQuestionIndex === 0}
                  >
                    <FontAwesomeIcon icon={faArrowLeft} /> Previous
                  </button>
                  
                  <div className="pre-question-indicator">
                    Question {currentQuestionIndex + 1} of {preAssessment.questions.length}
                  </div>
                  
                  <button 
                    className="pre-nav-button"
                    onClick={() => handleQuestionNavigation("next")}
                    disabled={currentQuestionIndex === preAssessment.questions.length - 1}
                  >
                    Next <FontAwesomeIcon icon={faArrowRight} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="pre-modal-body">
                <div className="pre-no-questions-preview">
                  <FontAwesomeIcon icon={faExclamationCircle} size="3x" />
                  <h4>No Questions Available</h4>
                  <p>This assessment doesn't have any questions yet. Add questions before previewing.</p>
                </div>
              </div>
            )}
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setCurrentQuestionIndex(0);
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Enhanced Create/Edit Modal */}
{(showCreateModal || showEditModal) && (
  <div className="pre-modal-overlay">
    <div className="pre-modal pre-form-modal pre-enhanced-modal">
      <div className="pre-modal-header">
        <h3>
          <FontAwesomeIcon 
            icon={showCreateModal ? faPlus : faEdit} 
            className="pre-modal-header-icon" 
          />
          {showCreateModal ? "Create Pre-Assessment Curriculum" : "Edit Pre-Assessment Curriculum"}
        </h3>
        <button 
          className="pre-modal-close"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingQuestionIndex(-1);
            setShowQuestionEditor(false);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="pre-modal-body">
        {!showQuestionEditor ? (
          // Main Assessment Form
          <form className="pre-assessment-form">
            <div className="pre-form-section">
              <h4>Assessment Information</h4>
              
              <div className="pre-form-group">
                <label htmlFor="title">
                  Assessment Title:
                  <Tooltip text="Enter a descriptive title for this pre-assessment curriculum." />
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Filipino Reading Pre-Assessment - Grade 1"
                  required
                />
              </div>
              
              <div className="pre-form-group">
                <label htmlFor="description">
                  Description:
                  <Tooltip text="Describe the purpose and scope of this assessment." />
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Comprehensive assessment of reading skills based on CRLA standards"
                  rows={3}
                  required
                />
              </div>
              
              <div className="pre-form-group">
                <label htmlFor="instructions">
                  Student Instructions:
                  <Tooltip text="Instructions that will be displayed to students before they begin the assessment." />
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleFormChange}
                  placeholder="Instructions for students on how to complete the assessment"
                  rows={3}
                  required
                />
              </div>
              
              <div className="pre-form-row">
                <div className="pre-form-group">
                  <label htmlFor="language">
                    Language:
                    <Tooltip text="Select the primary language for this assessment." />
                  </label>
                  <div className="pre-language-display">Filipino</div>
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="totalQuestions">
                    Total Questions:
                    <Tooltip text="Total number of questions in the assessment. This is calculated automatically based on the questions you add." />
                  </label>
                  <div className="pre-total-questions-display">
                    <span className="pre-total-questions-value">
                      {showEditModal && preAssessment?.questions ? preAssessment.questions.length : formData.questions.length}
                    </span>
                    <span className="pre-total-questions-label">
                      questions
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pre-form-section">
              <h4>Category Distribution</h4>
              
              <p className="pre-form-help">Questions are automatically distributed across CRLA categories as you add them:</p>
              
              <div className="pre-composition-preview">
                
                <div className="pre-category-counts">
                  <h5>Category Question Counts</h5>
                  <div className="pre-category-counts-grid">
                  {Object.entries({
                    'alphabet_knowledge': 'Alphabet Knowledge',
                    'phonological_awareness': 'Phonological Awareness',
                    'decoding': 'Decoding',
                    'word_recognition': 'Word Recognition',
                    'reading_comprehension': 'Reading Comprehension'
                  }).map(([category, label]) => {
                      // Count actual questions per category
                    const questionsArray = showEditModal && preAssessment?.questions ? 
                      preAssessment.questions : formData.questions;
                    
                    const questionsInCategory = questionsArray ? 
                      questionsArray.filter(q => q.questionTypeId === category).length : 0;
                    
                    return (
                        <div key={category} className="pre-category-count-item">
                          <span className="pre-category-count-label">{label}:</span>
                          <span className="pre-category-count-value">{questionsInCategory}</span>
                      </div>
                    );
                  })}
                    <div className="pre-category-count-item pre-category-count-total">
                      <span className="pre-category-count-label">Total Questions:</span>
                      <span className="pre-category-count-value">
                        {(showEditModal && preAssessment?.questions ? 
                          preAssessment.questions : formData.questions)?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Questions Management Section */}
            <div className="pre-form-section">
              <div className="pre-questions-header">
                <h4>
                  <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '8px' }} />
                  Assessment Questions
                </h4>
                <button
                  type="button"
                  className="pre-add-question-btn"
                  onClick={handleAddQuestion}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Question
                </button>
              </div>
              
              {/* Conditional rendering based on whether we're in edit mode or create mode */}
              {formData.questions && formData.questions.length > 0 ? (
                <div className="pre-questions-list">
                  {formData.questions.map((question, index) => (
                    <div key={question.questionId || index} className="pre-question-item">
                      <div className="pre-question-item-header">
                        <div className="pre-question-info">
                          <span className="pre-question-number">Q{index + 1}</span>
                          <div className="pre-question-details">
                            <span className="pre-question-category">
                              {question.questionTypeId?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="pre-question-type">
                              {question.questionType} • {question.difficultyLevel?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pre-question-actions">
                          <button
                            type="button"
                            className="pre-question-action-btn pre-edit-btn"
                            onClick={() => handleEditQuestion(index)}
                            title="Edit Question"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            type="button"
                            className="pre-question-action-btn pre-delete-btn"
                            onClick={() => handleDeleteQuestion(index)}
                            title="Delete Question"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pre-question-preview">
                        <div className="pre-question-text-preview">
                          {question.questionText}
                        </div>
                        
                        <div className="pre-question-meta">
                          {question.questionImage && (
                            <span className="pre-question-meta-item">
                              <FontAwesomeIcon icon={faImages} /> Has Image
                            </span>
                          )}
                          <span className="pre-question-meta-item">
                            <FontAwesomeIcon icon={faCheckCircle} /> {question.options?.length || 0} Options
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pre-no-questions">
                  <FontAwesomeIcon icon={faInfoCircle} className="pre-no-questions-icon" />
                  <p>No questions added yet. Click "Add Question" to begin building your assessment.</p>
                </div>
              )}
            </div>
          </form>
        ) : (
          // Question Editor
          <div className="pre-question-editor">
            <div className="pre-editor-header">
              <h4>
                <FontAwesomeIcon icon={editingQuestionIndex >= 0 ? faEdit : faPlus} />
                {editingQuestionIndex >= 0 ? `Edit Question ${editingQuestionIndex + 1}` : 'Add New Question'}
              </h4>
              <button
                type="button"
                className="pre-editor-back-btn"
                onClick={() => setShowQuestionEditor(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Assessment
              </button>
            </div>
            
            <form className="pre-question-form">
              <div className="pre-question-form-grid">
                <div className="pre-form-group">
                  <label htmlFor="questionId">
                    Question ID:
                    <Tooltip text="Unique identifier for this question (auto-generated)" />
                  </label>
                  <input
                    type="text"
                    id="questionId"
                    name="questionId"
                    value={currentQuestionData.questionId || ''}
                    readOnly
                    className="pre-readonly-input"
                    placeholder="Will be auto-generated when category is selected"
                  />
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionTypeId">
                    Category: <span className="pre-required-field">*</span>
                    <Tooltip text="Select the reading category for this question" />
                  </label>
                  <select
                    id="questionTypeId"
                    name="questionTypeId"
                    value={currentQuestionData.questionTypeId || ''}
                    onChange={handleQuestionDataChange}
                    required
                    className={!currentQuestionData.questionTypeId ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Category</option>
                    <option value="alphabet_knowledge">Alphabet Knowledge</option>
                    <option value="phonological_awareness">Phonological Awareness</option>
                    <option value="decoding">Decoding</option>
                    <option value="word_recognition">Word Recognition</option>
                    <option value="reading_comprehension">Reading Comprehension</option>
                  </select>
                  {!currentQuestionData.questionTypeId && (
                    <div className="pre-validation-message">Please select a category</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionType">
                    Question Type: <span className="pre-required-field">*</span>
                    <Tooltip text="Specific type within the category" />
                  </label>
                  <select
                    id="questionType"
                    name="questionType"
                    value={currentQuestionData.questionType || ''}
                    onChange={handleQuestionDataChange}
                    required
                    disabled={!currentQuestionData.questionTypeId}
                    className={currentQuestionData.questionTypeId && !currentQuestionData.questionType ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Type</option>
                    {getCategoryQuestionTypes(currentQuestionData.questionTypeId).map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  {currentQuestionData.questionTypeId && !currentQuestionData.questionType && (
                    <div className="pre-validation-message">Please select a question type</div>
                  )}
                  {currentQuestionData.questionTypeId && getCategoryQuestionTypes(currentQuestionData.questionTypeId).length === 0 && (
                    <div className="pre-validation-message">No question types available for this category</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="difficultyLevel">
                    Reading Level: <span className="pre-required-field">*</span>
                    <Tooltip text="Select the appropriate difficulty level for this question" />
                  </label>
                  <select
                    id="difficultyLevel"
                    name="difficultyLevel"
                    value={currentQuestionData.difficultyLevel || ''}
                    onChange={handleQuestionDataChange}
                    required
                    className={!currentQuestionData.difficultyLevel ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Difficulty</option>
                    <option value="low_emerging">Low Emerging</option>
                    <option value="high_emerging">High Emerging</option>
                    <option value="developing">Developing</option>
                    <option value="transitioning">Transitioning</option>
                    <option value="at_grade_level">At Grade Level</option>
                  </select>
                  {!currentQuestionData.difficultyLevel && (
                    <div className="pre-validation-message">Please select a difficulty level</div>
                  )}
                </div>
                
                <div className="pre-form-group pre-full-width">
                  <label htmlFor="questionText">
                    Question Text: <span className="pre-required-field">*</span>
                    <Tooltip text="The question text that will be displayed to students" />
                  </label>
                  <textarea
                    id="questionText"
                    name="questionText"
                    value={currentQuestionData.questionText || ''}
                    onChange={handleQuestionDataChange}
                    placeholder="Enter the question text (e.g., 'Anong ang katumbas na maliit na letra?')"
                    rows={3}
                    required
                    className={!currentQuestionData.questionText.trim() ? 'pre-validation-highlight' : ''}
                  />
                  {!currentQuestionData.questionText.trim() && (
                    <div className="pre-validation-message">Please enter question text</div>
                  )}
                </div>
                
                {/* Only show Question Value for non-reading comprehension questions */}
                {currentQuestionData.questionTypeId !== 'reading_comprehension' && (
                <div className="pre-form-group">
                  <label htmlFor="questionValue">
                    Question Value:
                    <Tooltip text="Optional value shown with the question (e.g., letter, word)" />
                  </label>
                  <input
                    type="text"
                    id="questionValue"
                    name="questionValue"
                    value={currentQuestionData.questionValue || ''}
                    onChange={handleQuestionDataChange}
                    placeholder="e.g., 'A', 'BO + LA'"
                  />
                </div>
                )}
                
                {/* Only show Question Image for non-reading comprehension questions */}
                {currentQuestionData.questionTypeId !== 'reading_comprehension' && (
                <div className="pre-form-group">
                  <label htmlFor="questionImage" style={{ color: '#4a5568' }}>
                    Question Image:
                    <Tooltip text="Upload an image for this question" />
                  </label>
                  <div className="pre-file-upload-container">
                    <label className="pre-file-upload-btnn">
                      <FontAwesomeIcon icon={faUpload} />
                      {currentQuestionData.questionImage ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuestionImageUpload}
                        className="pre-file-input-hidden"
                        id="questionImage"
                      />
                    </label>
                    {currentQuestionData.questionImage && (
                      <div className="pre-image-preview">
                        <img 
                          src={currentQuestionData.questionImage} 
                          alt="Question preview" 
                          className="pre-preview-image" 
                        />
                        <button
                          type="button"
                          className="pre-remove-image"
                          onClick={() => setCurrentQuestionData(prev => ({
                            ...prev,
                            questionImage: null
                          }))}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
              
              {/* Answer Options Section - For regular questions */}
              {currentQuestionData.questionTypeId !== 'reading_comprehension' && (
                <div className="pre-options-section">
                  <h5>
                    <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '8px' }} />
                    Answer Options <span className="pre-required-field">*</span>
                  </h5>
                  
                  {currentQuestionData.options.map((option, index) => (
                    <div key={index} className={`pre-option-item-editor ${!option.optionText.trim() ? 'has-error' : ''}`}>
                      <div className="pre-option-header">
                        <span className="pre-option-label">Option {index + 1}</span>
                        <div className="pre-option-controls">
                          <label className="pre-correct-checkbox">
                            <input
                              type="radio"
                              name="correctOption"
                              checked={option.isCorrect || false}
                              onChange={() => handleOptionCorrectChange(index)}
                            />
                            <span className="pre-checkbox-label">
                              <FontAwesomeIcon icon={option.isCorrect ? faCheckCircle : faQuestionCircle} />
                              Correct Answer
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        value={option.optionText || ''}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        placeholder={`Enter option ${index + 1} text`}
                        required
                        className={`pre-option-input ${!option.optionText.trim() ? 'pre-validation-highlight' : ''}`}
                        aria-label={`Option ${index + 1} text`}
                      />
                      {!option.optionText.trim() && (
                        <div className="pre-validation-message">Option text is required</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reading Comprehension Section - For reading_comprehension questions */}
              {currentQuestionData.questionTypeId === 'reading_comprehension' && (
                <div className="pre-reading-comp-section">
                  {/* Passage Pages */}
                  <div className="pre-passage-section">
                    <h5>
                      <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
                      Reading Passage Pages <span className="pre-required-field">*</span>
                    </h5>
                    
                    {currentQuestionData.passages.map((passage, index) => (
                      <div key={index} className="pre-passage-editor">
                        <div className="pre-passage-header">
                          <h6>Page {passage.pageNumber}</h6>
                          <div className="pre-passage-actions">
                            {currentQuestionData.passages.length > 1 && (
                              <button
                                type="button"
                                className="pre-remove-passage-btn"
                                onClick={() => {
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    passages: prev.passages.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <FontAwesomeIcon icon={faTimes} /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="pre-form-group pre-full-width">
                          <label>
                            Passage Text: <span className="pre-required-field">*</span>
                          </label>
                          <textarea
                            value={passage.pageText || ''}
                            onChange={(e) => {
                              const updatedPassages = [...currentQuestionData.passages];
                              updatedPassages[index] = {
                                ...updatedPassages[index],
                                pageText: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                passages: updatedPassages
                              }));
                            }}
                            placeholder="Enter the passage text for this page"
                            rows={4}
                            className={!passage.pageText.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!passage.pageText.trim() && (
                            <div className="pre-validation-message">Passage text is required</div>
                          )}
                        </div>
                        
                        <div className="pre-form-group">
                          <label>Passage Image:</label>
                          <div className="pre-file-upload-container">
                            <label className="pre-file-upload-btnn">
                              <FontAwesomeIcon icon={faUpload} />
                              {passage.pageImage ? 'Change Image' : 'Upload Image'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  
                                  // Preview image
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const updatedPassages = [...currentQuestionData.passages];
                                    updatedPassages[index] = {
                                      ...updatedPassages[index],
                                      pageImage: reader.result
                                    };
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      passages: updatedPassages
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }}
                                className="pre-file-input-hidden"
                              />
                            </label>
                            {passage.pageImage && (
                              <div className="pre-image-preview">
                                <img 
                                  src={passage.pageImage} 
                                  alt={`Passage page ${passage.pageNumber}`} 
                                  className="pre-preview-image" 
                                />
                                <button
                                  type="button"
                                  className="pre-remove-image"
                                  onClick={() => {
                                    const updatedPassages = [...currentQuestionData.passages];
                                    updatedPassages[index] = {
                                      ...updatedPassages[index],
                                      pageImage: null,
                                      pageImageS3Path: null
                                    };
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      passages: updatedPassages
                                    }));
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="pre-add-passage-btn"
                      onClick={() => {
                        setCurrentQuestionData(prev => ({
                          ...prev,
                          passages: [
                            ...prev.passages,
                            {
                              pageNumber: prev.passages.length + 1,
                              pageText: '',
                              pageImage: null,
                              pageImageS3Path: null
                            }
                          ]
                        }));
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Page
                    </button>
                  </div>
                  
                  {/* Comprehension Questions */}
                  <div className="pre-sentence-questions-section">
                    <h5>
                      <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
                      Comprehension Questions <span className="pre-required-field">*</span>
                    </h5>
                    
                    {currentQuestionData.sentenceQuestions.map((question, index) => (
                      <div key={index} className="pre-sentence-question-editor">
                        <div className="pre-sentence-question-header">
                          <h6>Question {index + 1}</h6>
                          <div className="pre-sentence-question-actions">
                            {currentQuestionData.sentenceQuestions.length > 1 && (
                              <button
                                type="button"
                                className="pre-remove-question-btn"
                                onClick={() => {
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    sentenceQuestions: prev.sentenceQuestions.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <FontAwesomeIcon icon={faTimes} /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="pre-form-group pre-full-width">
                          <label>
                            Question Text: <span className="pre-required-field">*</span>
                          </label>
                          <input
                            type="text"
                            value={question.questionText || ''}
                            onChange={(e) => {
                              const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                              updatedQuestions[index] = {
                                ...updatedQuestions[index],
                                questionText: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                sentenceQuestions: updatedQuestions
                              }));
                            }}
                            placeholder="Enter the question about the passage"
                            className={!question.questionText.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!question.questionText.trim() && (
                            <div className="pre-validation-message">Question text is required</div>
                          )}
                        </div>
                        
                        <div className="pre-answer-choices-container">
                        <div className="pre-form-group">
                          <label>
                              Answer Choice 1: <span className="pre-required-field">*</span>
                          </label>
                          <input
                            type="text"
                            value={question.correctAnswer || ''}
                            onChange={(e) => {
                              const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                              updatedQuestions[index] = {
                                ...updatedQuestions[index],
                                correctAnswer: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                sentenceQuestions: updatedQuestions
                              }));
                            }}
                              placeholder="Enter answer choice 1"
                            className={!question.correctAnswer.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!question.correctAnswer.trim() && (
                              <div className="pre-validation-message">Answer choice 1 is required</div>
                          )}
                        </div>
                        
                        <div className="pre-form-group">
                          <label>
                              Answer Choice 2: <span className="pre-required-field">*</span>
                          </label>
                          <input
                            type="text"
                            value={question.incorrectAnswer || ''}
                            onChange={(e) => {
                              const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                              updatedQuestions[index] = {
                                ...updatedQuestions[index],
                                incorrectAnswer: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                sentenceQuestions: updatedQuestions
                              }));
                            }}
                              placeholder="Enter answer choice 2"
                            className={!question.incorrectAnswer.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!question.incorrectAnswer.trim() && (
                              <div className="pre-validation-message">Answer choice 2 is required</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="pre-form-group pre-correct-answer-selection">
                          <label>
                            Correct Answer: <span className="pre-required-field">*</span>
                          </label>
                          <div className="pre-radio-group">
                            <label className="pre-radio-label">
                              <input
                                type="radio"
                                name={`correctAnswerChoice-${index}`}
                                value="1"
                                checked={question.correctAnswerChoice === "1"}
                                onChange={() => {
                                  const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                                  updatedQuestions[index] = {
                                    ...updatedQuestions[index],
                                    correctAnswerChoice: "1"
                                  };
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    sentenceQuestions: updatedQuestions
                                  }));
                                }}
                              />
                              <span>Choice 1 ({question.correctAnswer || 'Not set'})</span>
                            </label>
                            <label className="pre-radio-label">
                              <input
                                type="radio"
                                name={`correctAnswerChoice-${index}`}
                                value="2"
                                checked={question.correctAnswerChoice === "2"}
                                onChange={() => {
                                  const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                                  updatedQuestions[index] = {
                                    ...updatedQuestions[index],
                                    correctAnswerChoice: "2"
                                  };
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    sentenceQuestions: updatedQuestions
                                  }));
                                }}
                              />
                              <span>Choice 2 ({question.incorrectAnswer || 'Not set'})</span>
                            </label>
                          </div>
                          {!question.correctAnswerChoice && (
                            <div className="pre-validation-message">Please select the correct answer choice</div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="pre-add-sentence-question-btn"
                      onClick={() => {
                        setCurrentQuestionData(prev => ({
                          ...prev,
                          sentenceQuestions: [
                            ...prev.sentenceQuestions,
                            { questionText: '', correctAnswer: '', incorrectAnswer: '', correctAnswerChoice: "1" }
                          ]
                        }));
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Question
                    </button>
                  </div>
                </div>
              )}

              <div className="pre-question-form-actions">
                <button
                  type="button"
                  className="pre-button secondary"
                  onClick={() => setShowQuestionEditor(false)}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
                <button
                  type="button"
                  className="pre-button primary"
                  onClick={handleSaveQuestion}
                >
                  <FontAwesomeIcon icon={editingQuestionIndex >= 0 ? faEdit : faPlus} />
                  {editingQuestionIndex >= 0 ? ' Update Question' : ' Add Question'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      <div className="pre-modal-footer">
        {!showQuestionEditor && (
          <>
            <button 
              className="pre-button secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
            >
              Cancel
            </button>
            <button 
              className="pre-button primary"
              onClick={handleFormSubmit}
            >
              <FontAwesomeIcon icon={showCreateModal ? faPlus : faEdit} />
              {showCreateModal ? " Create Assessment" : " Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-confirm-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faCheckCircle} className="pre-modal-header-icon" />
                Save Pre-Assessment
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => setShowSubmitConfirmModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pre-modal-body">
              <div className="pre-confirm-icon">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="pre-confirm-message">
                <p>You are about to save this pre-assessment curriculum.</p>
                <p className="pre-confirm-question">Would you like to save this assessment now?</p>
              </div>
              
              <div className="pre-submission-summary">
                <h4>Assessment Summary:</h4>
                <div className="pre-summary-details">
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Title:</span>
                    <span className="pre-summary-value">{formData.title}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Language:</span>
                    <span className="pre-summary-value">{formData.language === "FL" ? "Filipino" : "English"}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Total Questions:</span>
                    <span className="pre-summary-value">{formData.totalQuestions}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button secondary"
                onClick={() => setShowSubmitConfirmModal(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back and Edit
              </button>
              <button 
                className="pre-button primary"
                onClick={handleConfirmSubmit}
              >
                <FontAwesomeIcon icon={faCheckCircle} /> Save Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-confirm-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faTrash} className="pre-modal-header-icon" />
                Delete Pre-Assessment
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pre-modal-body">
              <div className="pre-delete-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="pre-delete-message">
                <p>Are you sure you want to delete this pre-assessment curriculum?</p>
                <p className="pre-delete-warning">This action cannot be undone and will remove all associated data.</p>
              </div>
              
              <div className="pre-delete-summary">
                <div className="pre-summary-item">
                  <span className="pre-summary-label">Assessment:</span>
                  <span className="pre-summary-value">{preAssessment.title}</span>
                </div>
                <div className="pre-summary-item">
                  <span className="pre-summary-label">Questions:</span>
                  <span className="pre-summary-value">{preAssessment.totalQuestions}</span>
                </div>
              </div>
            </div>
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="pre-button danger"
                onClick={handleDelete}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessModal && (
        <div className="pre-success-notification">
          <div className="pre-success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="pre-success-message">
            <p>Operation completed successfully!</p>
            <p className="pre-success-detail">
              {preAssessment 
                ? "Pre-assessment has been saved successfully." 
                : "Pre-assessment has been deleted."}
            </p>
          </div>
        </div>
      )}

      {/* Preview All dialog */}
      <UnifiedTemplatePreview 
        isOpen={isPreviewAllDialogOpen}
        onClose={() => setIsPreviewAllDialogOpen(false)}
        templates={previewAllTemplates}
        templateType="preassessment"
        onEditTemplate={() => {
          setIsPreviewAllDialogOpen(false);
          handleEditPreAssessment();
        }}
      />

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

export default PreAssessment;