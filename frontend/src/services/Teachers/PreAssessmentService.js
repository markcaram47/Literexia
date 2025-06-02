import axios from 'axios';
import API_URL from '../../config/apiConfig';
import imageCompression from 'browser-image-compression';

/**
 * PreAssessmentService - Service for managing pre-assessments in the teacher dashboard
 * Handles all API interactions with the pre-assessment endpoints
 */
class PreAssessmentService {
  constructor() {
    this.apiUrl = `${API_URL}/pre-assessment`;
    console.log('PreAssessmentService: API URL is', this.apiUrl);
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with authentication token
   */
  getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };
  };

  /**
   * Fetch all pre-assessments from the server
   * @returns {Promise} Promise with the assessment data
   */
  getAllPreAssessments = async () => {
    try {
      console.log('PreAssessmentService: Fetching all pre-assessments');
      
      // Log the auth token being used
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (token) {
        console.log('PreAssessmentService: Using auth token:', token.substring(0, 20) + '...');
      } else {
        console.warn('PreAssessmentService: No auth token found in localStorage');
      }
      
      // Request pre-assessments from the API
      console.log('PreAssessmentService: Making GET request to', `${this.apiUrl}/assessments`);
      const response = await axios.get(`${this.apiUrl}/assessments`, this.getAuthHeaders());
      console.log('PreAssessmentService: Received response:', response.status, response.statusText);
      
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      // If the error is a 404 (Not Found), it might mean the collection doesn't exist yet
      if (error.response && error.response.status === 404) {
        console.warn('PreAssessmentService: Resource not found (404)');
        return {
          success: true,
          data: [] // Return empty array for 404s
        };
      }
      
      console.error('PreAssessmentService: Error fetching pre-assessments:', error);
      return {
        success: false,
        data: [],
        message: "Failed to fetch pre-assessments. Please try again later."
      };
    }
  };

  /**
   * Fetch a single pre-assessment by ID
   * @param {string} id - The ID of the assessment to fetch
   * @returns {Promise} Promise with the assessment data
   */
  getPreAssessmentById = async (id) => {
    try {
      const response = await axios.get(`${this.apiUrl}/assessments/${id}`, this.getAuthHeaders());
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error fetching pre-assessment ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Create a new pre-assessment
   * @param {Object} assessmentData - The assessment data to create
   * @returns {Promise} Promise with the created assessment
   */
  createPreAssessment = async (assessmentData) => {
    try {
      console.log('Creating pre-assessment with data:', JSON.stringify(assessmentData, null, 2));
      
      // Validate required fields before sending to API
      if (!assessmentData.assessmentId) {
        console.error('Missing required field: assessmentId');
        return {
          success: false,
          data: null,
          message: 'Missing required field: assessmentId'
        };
      }
      
      if (!assessmentData.title) {
        console.error('Missing required field: title');
        return {
          success: false,
          data: null,
          message: 'Missing required field: title'
        };
      }
      
      if (!assessmentData.language) {
        console.error('Missing required field: language');
        return {
          success: false,
          data: null,
          message: 'Missing required field: language'
        };
      }
      
      const response = await axios.post(
        `${this.apiUrl}/assessments`,
        assessmentData,
        this.getAuthHeaders()
      );
      
      console.log('Pre-assessment creation response:', response.data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      // Log detailed information about 400 Bad Request errors
      if (error.response && error.response.status === 400) {
        console.error('Bad Request Error (400):', error.response.data);
        console.error('Request payload that caused the error:', JSON.stringify(assessmentData, null, 2));
        return {
          success: false,
          data: null,
          message: `Failed to create pre-assessment: ${error.response.data.message || 'Bad Request'}`
        };
      }
      
      console.error('Error creating pre-assessment:', error);
      return {
        success: false,
        data: null,
        message: `Failed to create pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Update an existing pre-assessment
   * @param {string} id - The ID of the assessment to update
   * @param {Object} updateData - The updated assessment data
   * @returns {Promise} Promise with the updated assessment
   */
  updatePreAssessment = async (id, updateData) => {
    try {
      const response = await axios.put(
        `${this.apiUrl}/assessments/${id}`,
        updateData,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error updating pre-assessment ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Delete a pre-assessment
   * @param {string} id - The ID of the assessment to delete
   * @returns {Promise} Promise with the deletion result
   */
  deletePreAssessment = async (id) => {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/assessments/${id}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error deleting pre-assessment ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Toggle the active status of a pre-assessment
   * @param {string} id - The ID of the assessment to toggle
   * @param {boolean} isActive - The new active status
   * @returns {Promise} Promise with the updated assessment
   */
  toggleActiveStatus = async (id, isActive) => {
    try {
      console.log(`Toggling pre-assessment ${id} active status to: ${isActive}`);
      
      const response = await axios.put(
        `${this.apiUrl}/assessments/${id}/toggle-active`,
        { isActive },
        this.getAuthHeaders()
      );
      
      return {
        success: true,
        data: response.data.assessment || response.data
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error(`Error toggling pre-assessment ${id} active status:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update pre-assessment status. Please try again later.`
      };
    }
  };

  /**
   * Get all question types
   * @returns {Promise} Promise with the question types
   */
  getAllQuestionTypes = async () => {
    try {
      console.log('PreAssessmentService: Fetching question types');
      
      // Make the API request
      const response = await axios.get(`${this.apiUrl}/question-types`, this.getAuthHeaders());
      
      console.log(`PreAssessmentService: Received ${response.data ? response.data.length : 0} question types`);
      
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      // Log authentication errors but don't expose them to components
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication required for pre-assessment API.');
      }
      
      console.error('Error fetching question types:', error);
      
      // Provide static fallback question types if the API request fails
      const fallbackQuestionTypes = [
        {
          typeId: "alphabet_knowledge",
          typeName: "Alphabet Knowledge",
          description: "Tests knowledge of letters, their sounds, and characteristics",
          questionTypes: ['patinig', 'katinig', 'patinig_katinig', 'unang_letra'],
          difficultyWeights: {
            low_emerging: 0.9,
            high_emerging: 0.1,
            developing: 0,
            transitioning: 0,
            at_grade_level: 0
          }
        },
        {
          typeId: "phonological_awareness",
          typeName: "Phonological Awareness",
          description: "Tests ability to identify and manipulate sounds in spoken language",
          questionTypes: ['tunog_letra', 'tunog_salita', 'unang_tunog', 'pantig', 'hulling_tunog'],
          difficultyWeights: {
            low_emerging: 0.7,
            high_emerging: 0.3,
            developing: 0,
            transitioning: 0,
            at_grade_level: 0
          }
        },
        {
          typeId: "decoding",
          typeName: "Decoding",
          description: "Tests ability to apply knowledge of letter-sound relationships",
          questionTypes: ['word', 'buoin_salita'],
          difficultyWeights: {
            low_emerging: 0.2,
            high_emerging: 0.5,
            developing: 0.3,
            transitioning: 0,
            at_grade_level: 0
          }
        },
        {
          typeId: "word_recognition",
          typeName: "Word Recognition",
          description: "Tests ability to identify and read words accurately",
          questionTypes: ['malapantig', 'tunog_salita'],
          difficultyWeights: {
            low_emerging: 0.1,
            high_emerging: 0.2,
            developing: 0.4,
            transitioning: 0.3,
            at_grade_level: 0
          }
        },
        {
          typeId: "reading_comprehension",
          typeName: "Reading Comprehension",
          description: "Tests ability to understand and interpret text",
          questionTypes: ['sentence'],
          difficultyWeights: {
            low_emerging: 0,
            high_emerging: 0,
            developing: 0,
            transitioning: 0.5,
            at_grade_level: 0.5
          }
        }
      ];
      
      console.log('Using fallback question types due to API error');
      
      return {
        success: true,
        data: fallbackQuestionTypes,
        message: "Using fallback question types due to API error",
        usingFallback: true
      };
    }
  };

  /**
   * Create a new question type
   * @param {Object} questionTypeData - The question type data to create
   * @returns {Promise} Promise with the created question type
   */
  createQuestionType = async (questionTypeData) => {
    try {
      const response = await axios.post(
        `${this.apiUrl}/question-types`,
        questionTypeData,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating question type:', error);
      return {
        success: false,
        data: null,
        message: `Failed to create question type. Please try again later.`
      };
    }
  };

  /**
   * Update an existing question type
   * @param {string} id - The ID of the question type to update
   * @param {Object} updateData - The updated question type data
   * @returns {Promise} Promise with the updated question type
   */
  updateQuestionType = async (id, updateData) => {
    try {
      const response = await axios.put(
        `${this.apiUrl}/question-types/${id}`,
        updateData,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error updating question type ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update question type. Please try again later.`
      };
    }
  };

  /**
   * Delete a question type
   * @param {string} id - The ID of the question type to delete
   * @returns {Promise} Promise with the deletion result
   */
  deleteQuestionType = async (id) => {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/question-types/${id}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting question type ${id}:`, error);
      return {
        success: false,
        message: `Failed to delete question type. Please try again later.`
      };
    }
  };

  /**
   * Upload media file (image or audio) with compression for images
   * @param {FormData|File} fileOrFormData - The file or FormData to upload
   * @returns {Promise} Promise with the uploaded file URL
   */
  uploadMedia = async (fileOrFormData) => {
    try {
      let formData;
      let file;
      
      // Check if we received FormData or a File
      if (fileOrFormData instanceof FormData) {
        formData = fileOrFormData;
        file = formData.get('file');
      } else {
        file = fileOrFormData;
        formData = new FormData();
      }
      
      // If it's an image, compress it before uploading
      if (file && file.type && file.type.startsWith('image/')) {
        console.log('Compressing image before upload, original size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        
        const options = {
          maxSizeMB: 1,          // Max size in MB
          maxWidthOrHeight: 1920, // Max width/height
          useWebWorker: true,    // Use web worker for better performance
          fileType: file.type    // Preserve file type
        };
        
        try {
          const compressedFile = await imageCompression(file, options);
          console.log('Image compressed successfully. New size:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');
          
          // Create new FormData with compressed file
          formData = new FormData();
          formData.append('file', compressedFile, file.name);
        } catch (compressionError) {
          console.error('Error compressing image:', compressionError);
          // Continue with original file if compression fails
          if (!(fileOrFormData instanceof FormData)) {
            formData = new FormData();
            formData.append('file', file);
          }
        }
      } else if (!(fileOrFormData instanceof FormData)) {
        // If not an image and not FormData, create FormData
        formData = new FormData();
        formData.append('file', file);
      }
      
      // Set headers for file upload (don't include Content-Type, browser will set it)
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers = {
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      // Upload file
      const response = await axios.post(
        `${this.apiUrl}/upload-media`,
        formData,
        { headers }
      );
      
      console.log('File upload response:', response.data);
      
      return {
        success: true,
        fileUrl: response.data.fileUrl,
        fileKey: response.data.fileKey,
        s3Path: response.data.s3Path || `pre-assessment/${file.type.split('/')[0]}/${response.data.fileKey}`
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        message: `Failed to upload file. Please try again later.`
      };
    }
  };

  /**
   * Delete media file
   * @param {string} fileKey - The key of the file to delete
   * @returns {Promise} Promise with the deletion result
   */
  deleteMedia = async (fileKey) => {
    try {
      const response = await axios.delete(
        `${this.apiUrl}/delete-media/${fileKey}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting media file with key ${fileKey}:`, error);
      return {
        success: false,
        message: `Failed to delete media file. Please try again later.`
      };
    }
  };

  /**
   * Get pre-assessment results for a student
   * @param {string} studentId - The ID of the student
   * @returns {Promise} Promise with the student's pre-assessment results
   */
  getStudentPreAssessmentResults = async (studentId) => {
    try {
      const response = await axios.get(
        `${this.apiUrl}/student-results/${studentId}`,
        this.getAuthHeaders()
      );
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // If 404, the student hasn't taken the assessment yet
      if (error.response && error.response.status === 404) {
        return {
          success: true,
          data: {
            hasCompleted: false,
            studentId
          }
        };
      }
      
      console.error(`Error fetching pre-assessment results for student ${studentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch pre-assessment results. Please try again later.`
      };
    }
  };

  /**
   * Add a question to a pre-assessment
   * @param {string} assessmentId - The ID of the assessment
   * @param {Object} questionData - The question data to add
   * @returns {Promise} Promise with the updated assessment
   */
  addQuestionToPreAssessment = async (assessmentId, questionData) => {
    try {
      // First get the current assessment
      const assessmentResponse = await this.getPreAssessmentById(assessmentId);
      if (!assessmentResponse.success) {
        return assessmentResponse;
      }
      
      const assessment = assessmentResponse.data;
      
      // Add the new question to the questions array
      const updatedQuestions = [...assessment.questions, questionData];
      
      // Update the assessment with the new questions array
      return await this.updatePreAssessment(assessmentId, {
        ...assessment,
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error adding question to pre-assessment ${assessmentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to add question to pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Update a question in a pre-assessment
   * @param {string} assessmentId - The ID of the assessment
   * @param {string} questionId - The ID of the question to update
   * @param {Object} questionData - The updated question data
   * @returns {Promise} Promise with the updated assessment
   */
  updateQuestionInPreAssessment = async (assessmentId, questionId, questionData) => {
    try {
      // First get the current assessment
      const assessmentResponse = await this.getPreAssessmentById(assessmentId);
      if (!assessmentResponse.success) {
        return assessmentResponse;
      }
      
      const assessment = assessmentResponse.data;
      
      // Find the existing question to update
      const existingQuestionIndex = assessment.questions.findIndex(q => q.questionId === questionId);
      
      if (existingQuestionIndex === -1) {
        console.error(`Question ${questionId} not found in assessment ${assessmentId}`);
        return {
          success: false,
          data: null,
          message: `Question not found in assessment.`
        };
      }
      
      // Log the existing question and the update data for debugging
      console.log('Existing question:', assessment.questions[existingQuestionIndex]);
      console.log('Update data:', questionData);
      
      // Create updated questions array with the modified question
      const updatedQuestions = [...assessment.questions];
      updatedQuestions[existingQuestionIndex] = {
        ...assessment.questions[existingQuestionIndex], // Preserve existing fields
        ...questionData, // Apply updates
        // Ensure critical fields are preserved
        questionType: questionData.questionType || assessment.questions[existingQuestionIndex].questionType
      };
      
      // Log the final question after update
      console.log('Updated question:', updatedQuestions[existingQuestionIndex]);
      
      // Update the assessment with the modified questions array
      return await this.updatePreAssessment(assessmentId, {
        ...assessment,
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error updating question ${questionId} in pre-assessment ${assessmentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to update question in pre-assessment. Please try again later.`
      };
    }
  };

  /**
   * Delete a question from a pre-assessment
   * @param {string} assessmentId - The ID of the assessment
   * @param {string} questionId - The ID of the question to delete
   * @returns {Promise} Promise with the updated assessment
   */
  deleteQuestionFromPreAssessment = async (assessmentId, questionId) => {
    try {
      // First get the current assessment
      const assessmentResponse = await this.getPreAssessmentById(assessmentId);
      if (!assessmentResponse.success) {
        return assessmentResponse;
      }
      
      const assessment = assessmentResponse.data;
      
      // Filter out the question to be deleted
      const updatedQuestions = assessment.questions.filter(question => 
        question.questionId !== questionId
      );
      
      // Update the assessment with the filtered questions array
      return await this.updatePreAssessment(assessmentId, {
        ...assessment,
        questions: updatedQuestions
      });
    } catch (error) {
      console.error(`Error deleting question ${questionId} from pre-assessment ${assessmentId}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to delete question from pre-assessment. Please try again later.`
      };
    }
  };
}

export default new PreAssessmentService();