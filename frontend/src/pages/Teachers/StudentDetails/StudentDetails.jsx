// src/pages/Teachers/StudentDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FaArrowLeft,
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaSchool,
  FaVenusMars,
  FaMapMarkerAlt,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
  FaSave,
  FaEdit,
  FaPrint,
  FaFilePdf,
  FaTimes,
  FaBookReader,
  FaCheckSquare,
  FaBuilding,
  FaRing,
  FaAddressCard,
  FaCheckCircle,
  FaSync,
  FaCheck
} from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentDetailsService from '../../../services/Teachers/StudentDetailsService';
import IEPService from '../../../services/Teachers/ManageProgress/IEPService';
import '../../../css/Teachers/StudentDetails.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '../../../utils/toastHelper';
import SuccessDialog from '../../../components/Teachers/SuccessDialog';

// Import cradle logo - using Vite's import mechanism
const cradleLogo = new URL('../../../assets/images/Teachers/cradleLogo.jpg', import.meta.url).href;

const StudentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const studentId = id || (location.state?.student?.id);
  const filterReadingLevel = location.state?.filterReadingLevel;
  const progressReportRef = useRef(null);

  // Add navigation function
  const goBack = () => navigate(-1);

  // State variables
  const [student, setStudent] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recommendedLessons, setRecommendedLessons] = useState([]);
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [parentImageLoaded, setParentImageLoaded] = useState(false);
  const [parentImageError, setParentImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const [readingLevelProgress, setReadingLevelProgress] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 9;
  const [iepReport, setIepReport] = useState(null);
  const [successDialogData, setSuccessDialogData] = useState({
    message: '',
    submessage: ''
  });

  // If only a reading level filter is provided, redirect to the students page with that filter
  useEffect(() => {
    if (filterReadingLevel && !studentId) {
      // Redirect to students page with reading level filter
      navigate('/teacher/students', { state: { filterReadingLevel } });
    }
  }, [filterReadingLevel, studentId, navigate]);

  // Default progress report
  const defaultProgress = {
    schoolYear: '2024-2025',
    reportDate: new Date().toISOString().split('T')[0],
    recommendations: [
      `Student continues to develop reading skills. May need additional practice and support to improve reading comprehension.`,
      `Encourage practice with phonemic awareness activities at home to strengthen reading foundation.`,
      `Regular practice with guided reading will help improve fluency and comprehension.`
    ]
  };

  // UI state
  const [progressReport, setProgressReport] = useState(defaultProgress);
  const [feedbackMessage, setFeedbackMessage] = useState({
    subject: '',
    content: ''
  });
  const [showProgressReport, setShowProgressReport] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [includeProgressReport, setIncludeProgressReport] = useState(true);
  const [previousReports, setPreviousReports] = useState([]);
  const [loadingPreviousReports, setLoadingPreviousReports] = useState(false);

  // Add a new state variable for assessment questions
  const [assessmentQuestions, setAssessmentQuestions] = useState({});

  // Add a new state variable for category results
  const [categoryResults, setCategoryResults] = useState({});

  const isParentConnected = () => {
    return (
      (parentProfile && (parentProfile.name || parentProfile.email)) ||
      (typeof student.parent === 'string' && student.parent) ||
      (student.parent && student.parent.name) ||
      (student.parentId)
    );
  };

  // Main data fetching effect
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchAllStudentData = async () => {
      try {
        setLoading(true);
        console.log("Fetching data for student ID:", studentId);
  
        // Fetch student details
        const studentData = await StudentDetailsService.getStudentDetails(studentId);
  
        // Normalize reading level to new categories
        if (studentData) {
          studentData.readingLevel = StudentDetailsService.convertLegacyReadingLevel(studentData.readingLevel);
        }

        setStudent(studentData);
        console.log("Student data loaded:", studentData);

        // Fetch parent profile if parentId exists
        if (studentData && studentData.parentId) {
          try {
            console.log("Fetching parent profile for ID:", studentData.parentId);
            // Pass the student data as second parameter for fallback
            const parentData = await StudentDetailsService.getParentProfileWithFallback(
              studentData.parentId, 
              studentData
            );
            setParentProfile(parentData);
            console.log("Parent profile loaded:", parentData);

            // Set up feedback message with parent name
            setFeedbackMessage({
              subject: `Progress Report for ${studentData.name}`,
              content: `Dear ${parentData?.name || 'Parent'},\n\nI'm writing to update you on ${studentData.name}'s progress in our reading comprehension activities...`
            });
          } catch (e) {
            console.warn('Could not load parent profile:', e);
            // Set feedback with fallback parent name
            setFeedbackMessage({
              subject: `Progress Report for ${studentData.name}`,
              content: `Dear Parent,\n\nI'm writing to update you on ${studentData.name}'s progress...`
            });
          }
        }

        // Fetch other data (assessment, progress, etc.)
        const [assessmentData, progressData, lessonsData, recs, readingProgressData] = await Promise.all([
          StudentDetailsService.getAssessmentResults(studentId),
          StudentDetailsService.getProgressData(studentId),
          StudentDetailsService.getRecommendedLessons(studentId),
          StudentDetailsService.getPrescriptiveRecommendations(studentId),
          StudentDetailsService.getReadingLevelProgress(studentId)
        ]);

        setAssessment(assessmentData);
        setProgress(progressData);
        setRecommendedLessons(lessonsData);
        setPrescriptiveRecommendations(recs);
        setReadingLevelProgress(readingProgressData);
        console.log("Reading level progress data loaded:", readingProgressData);

        // Fetch category results for detailed question answers
        try {
          const categoryResultsData = await StudentDetailsService.getCategoryResults(studentId);
          console.log("Category results loaded:", categoryResultsData);
          
          // Check if the response is HTML instead of JSON
          if (typeof categoryResultsData === 'string' && categoryResultsData.includes('<!DOCTYPE html>')) {
            console.error('Received HTML instead of JSON for category results');
            setCategoryResults({});
          } else {
            // Organize category results by category name for easier access
            if (categoryResultsData && categoryResultsData.categories && Array.isArray(categoryResultsData.categories)) {
              const resultsByCategory = {};
              categoryResultsData.categories.forEach(categoryResult => {
                if (categoryResult.categoryName) {
                  resultsByCategory[categoryResult.categoryName] = categoryResult;
                }
              });
              setCategoryResults(resultsByCategory);
            }
          }
        } catch (error) {
          console.error("Error fetching category results:", error);
          setCategoryResults({});
        }

        // Now fetch main assessment data based on student's reading level
        if (studentData && studentData.readingLevel && studentData.readingLevel !== 'Not Assessed') {
          try {
            const mainAssessmentData = await StudentDetailsService.getMainAssessment(studentData.readingLevel);
            console.log("Main assessment data loaded:", mainAssessmentData);
            
            // Organize questions by category
            const questionsByCategory = {};
            if (mainAssessmentData && Array.isArray(mainAssessmentData)) {
              mainAssessmentData.forEach(item => {
                if (item.category && item.questions && Array.isArray(item.questions)) {
                  questionsByCategory[item.category] = item.questions;
                }
              });
            }
            setAssessmentQuestions(questionsByCategory);
            
            // If we don't have a selected category yet and we have categories, select the first one
            if (!selectedCategory && Object.keys(questionsByCategory).length > 0) {
              setSelectedCategory(Object.keys(questionsByCategory)[0]);
            }
          } catch (error) {
            console.error("Error fetching main assessment data:", error);
          }
        }

        // Update progress report recommendations
        if (recs && recs.length) {
          setProgressReport(prev => ({
            ...prev,
            recommendations: recs.map(r => r.rationale || r.recommendation || r.text || '')
          }));
        }

        // Fetch IEP report data - moved to the end
        let iepActivitiesCreated = false;

        try {
          const iepData = await IEPService.getIEPReport(studentId);
          console.log("IEP report data loaded:", iepData);
          
          if (iepData && iepData.success && iepData.data && iepData.data.objectives && iepData.data.objectives.length > 0) {
            setIepReport(iepData.data);

            console.log("IEP Data Structure:", {
              hasObjectives: !!iepData.data.objectives,
              objectivesLength: iepData.data.objectives?.length || 0,
              firstObjective: iepData.data.objectives?.[0] || 'No objectives'
            });

            const formattedIepActivities = iepData.data.objectives.map(objective => {
              return {
                id: objective._id || objective.id || `iep-${Math.random().toString(36).substr(2, 9)}`,
                name: objective.lesson || objective.title || 'Learning Activity',
                description: objective.categoryName || objective.category || 'Reading Skills',
                completed: objective.completed || false,
                status: objective.status || 'in_progress',
                score: objective.score || 0,
                passingThreshold: objective.passingThreshold || 75,
                minimalSupport: objective.supportLevel === 'minimal',
                moderateSupport: objective.supportLevel === 'moderate',
                extensiveSupport: objective.supportLevel === 'extensive',
                remarks: objective.remarks || `Student is working on ${objective.categoryName || 'reading'} skills.`,
                hasIntervention: objective.hasIntervention || false,
                interventionName: objective.interventionName || '',
                interventionStatus: objective.interventionStatus || null,
                interventionId: objective.interventionId || null,
                lastUpdated: objective.lastUpdated || null
              };
            });
            
            console.log("✅ Using IEP activities:", formattedIepActivities);
            setActivities(formattedIepActivities);
            iepActivitiesCreated = true;
          }
        } catch (error) {
          console.error("Error fetching IEP report:", error);
        }

        // Only create default activities if IEP activities weren't created
        if (!iepActivitiesCreated) {
          // Check if student is assessed before creating default activities
          if (!student.readingLevel || student.readingLevel === 'Not Assessed') {
            console.log("Student has not been assessed yet. Setting empty activities.");
            setActivities([]);
          } else {
            console.log("📝 Creating default activities since IEP activities not available");
            createDefaultActivities(readingProgressData);
          }
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to create default activities from reading level progress - moved outside useEffect
    const createDefaultActivities = (readingLevelData) => {
      try {
        let defaultActivities = [];
        
        // First try to create activities from reading level categories
        if (readingLevelData && readingLevelData.categories && readingLevelData.categories.length > 0) {
          defaultActivities = readingLevelData.categories.map((category, index) => {
            const score = category.score || 0;
            const supportLevel = score >= 70 ? 'minimal' : score >= 40 ? 'moderate' : 'extensive';
            
            return {
              id: `default-${index}`,
              name: `${category.category || 'Reading'} Practice`,
              description: category.category || 'Reading Skills',
              completed: false,
              status: score >= 75 ? 'completed' : 'in_progress',
              score: score,
              passingThreshold: 75,
              minimalSupport: supportLevel === 'minimal',
              moderateSupport: supportLevel === 'moderate',
              extensiveSupport: supportLevel === 'extensive',
              remarks: `Student ${score >= 70 ? 'excels at' : score >= 40 ? 'is progressing with' : 'needs additional support with'} ${(category.category || 'reading skills').toLowerCase()}.`,
              hasIntervention: false,
              interventionName: '',
              interventionStatus: null,
              interventionId: null,
              lastUpdated: new Date().toISOString()
            };
          });
        } 
        // Fallback to progress data if available
        else if (progress && progress.recentActivities && progress.recentActivities.length > 0) {
          defaultActivities = progress.recentActivities.map(act => {
            const score = act.score || 0;
            return {
              id: act.id || `progress-${Math.random().toString(36).substr(2, 9)}`,
              name: act.title || 'Learning Activity',
              description: act.category || 'Reading Skills',
              completed: true,
              status: 'completed',
              score: score,
              passingThreshold: 75,
              minimalSupport: score >= 70,
              moderateSupport: score >= 40 && score < 70,
              extensiveSupport: score < 40,
              remarks: `Student ${score >= 70 ? 'excels at' : score >= 40 ? 'is progressing with' : 'needs additional support with'} ${(act.category || 'reading skills').toLowerCase()}.`,
              hasIntervention: false,
              interventionName: '',
              interventionStatus: null,
              interventionId: null,
              lastUpdated: act.date || new Date().toISOString()
            };
          });
        }
        // If no real data, use empty activities instead of creating generic ones
        else {
          console.log("No assessment or progress data available. Using empty activities.");
          defaultActivities = [];
        }
        
        console.log("Created default activities:", defaultActivities);
        setActivities(defaultActivities);
      } catch (error) {
        console.error("Error creating default activities:", error);
        // Set empty activities if all else fails
        setActivities([]);
      }
    };

    fetchAllStudentData();
  }, [studentId]);

  // Function to fetch previous reports
  const fetchPreviousReports = async () => {
    if (!studentId) return;
    
    try {
      setLoadingPreviousReports(true);
      const reportsData = await IEPService.getPreviousPdfReports(studentId);
      if (reportsData && reportsData.success) {
        setPreviousReports(reportsData.data || []);
        console.log("Previous reports loaded:", reportsData.data);
      }
    } catch (reportsError) {
      console.warn('Could not load previous reports:', reportsError);
      setPreviousReports([]);
    } finally {
      setLoadingPreviousReports(false);
    }
  };
  
  // Call this function after the student data is loaded
  useEffect(() => {
    if (student && student.id) {
      fetchPreviousReports();
    }
  }, [student]);

  const handleParentImageLoad = () => {
    console.log("Parent image loaded successfully");
    setParentImageLoaded(true);
    setParentImageError(false);
  };

  const handleParentImageError = (e) => {
    console.error("Error loading parent image:", e.target.src);
    console.warn("Failed image URL:", e.target.src);
    setParentImageError(true);
    setParentImageLoaded(false);
  
    // Add browser console debugging info
    console.info("Try accessing the image directly in your browser:", e.target.src);
    console.info("Check the Network tab in DevTools for more details on the failure");
  };
  
  // Update the retryLoadImage function:
  const retryLoadImage = () => {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying image load (${retryCount + 1}/${MAX_RETRIES})`);
      console.log("Original URL:", parentProfile.profileImageUrl);
  
      setParentImageError(false);
      setParentImageLoaded(false);
      setRetryCount(prev => prev + 1);
  
      // Force reload with cache-busting parameter
      const cacheBuster = `cb=${Date.now()}`;
      const newUrl = parentProfile.profileImageUrl.includes('?')
        ? `${parentProfile.profileImageUrl}&${cacheBuster}`
        : `${parentProfile.profileImageUrl}?${cacheBuster}`;
  
      console.log("Retrying with URL:", newUrl);
  
      // Update the image src
      const imgElement = document.querySelector('.sdx-parent-avatar img');
      if (imgElement) {
        imgElement.src = newUrl;
      }
    }
  };

  // Update support level function
  const updateSupportLevel = async (activityId, supportType) => {
    try {
      console.log(`Updating support level for activity ${activityId} to ${supportType}`);
      
      // Find the activity in our local state
      const activity = activities.find(act => act.id === activityId);
      if (!activity) {
        console.warn(`Activity ${activityId} not found`);
        return;
      }
      
      // Determine the new support level
      let newSupportLevel = null;
      
      if (supportType === 'minimal') {
        newSupportLevel = activity.minimalSupport ? null : 'minimal';
      } else if (supportType === 'moderate') {
        newSupportLevel = activity.moderateSupport ? null : 'moderate';
      } else if (supportType === 'extensive') {
        newSupportLevel = activity.extensiveSupport ? null : 'extensive';
      }
      
      console.log(`Setting ${supportType} to ${newSupportLevel}`);
      
      // Call the API to update
      const result = await IEPService.updateSupportLevel(studentId, activityId, newSupportLevel);
      
      console.log("Update result:", result);
      
      // Update the local state
      if (result.success) {
        const updatedActivities = activities.map(act => {
          if (act.id === activityId) {
            return {
              ...act,
              minimalSupport: newSupportLevel === 'minimal',
              moderateSupport: newSupportLevel === 'moderate',
              extensiveSupport: newSupportLevel === 'extensive'
            };
          }
          return act;
        });
        
        setActivities(updatedActivities);
      } else {
        console.error("Failed to update support level:", result.error || result.message);
      }
    } catch (error) {
      console.error('Error updating support level:', error);
    }
  };

  // Helper function to reduce PDF size if needed
  const reducePdfSize = (pdfData, qualityFactor = 0.8) => {
    if (!pdfData || typeof pdfData !== 'string') {
      return null;
    }
    
    // Try to limit size for very large PDFs
    const MAX_SIZE = 2000000; // 2MB
    
    if (pdfData.length > MAX_SIZE) {
      console.log(`PDF data size (${pdfData.length} bytes) exceeds ${MAX_SIZE} bytes, attempting to reduce quality...`);
      
      // If it's already reduced to minimum quality and still too large, return null
      if (qualityFactor <= 0.5) {
        console.warn('PDF is still too large even at minimum quality');
        return null;
      }
      
      try {
        // This approach assumes pdfData is a base64 string
        // A real implementation would need more sophisticated compression
        return reducePdfSize(pdfData, qualityFactor - 0.1);
      } catch (error) {
        console.error('Error reducing PDF size:', error);
        return null;
      }
    }
    
    return pdfData;
  };

  // Helper function to view a PDF from S3 URL
  const viewPdfFromS3 = (pdfUrl) => {
    if (!pdfUrl) {
      toast.error('No PDF URL available');
      return;
    }
    
    console.log(`Opening PDF from URL: ${pdfUrl}`);
    
    // Check if it's a relative URL (our API) or absolute URL (S3)
    if (pdfUrl.startsWith('/')) {
      // It's a relative URL from our server
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      window.open(`${apiBaseUrl}${pdfUrl}`, '_blank');
    } else {
      // It's an absolute URL (likely S3)
      window.open(pdfUrl, '_blank');
    }
  };

  // Export progress report to PDF
  const exportToPDF = async () => {
    try {
      // Show the progress report modal first
      setShowProgressReport(true);
      
      // Log data for debugging
      console.log("Preparing PDF data with:", {
        hasStudent: !!student,
        hasProgress: !!progressReport,
        activitiesCount: activities?.length || 0,
        hasReadingProgress: !!readingLevelProgress,
        hasIepReport: !!iepReport,
        iepObjectivesCount: iepReport?.objectives?.length || 0
      });
      
      // Wait a moment for the modal to render completely
      await new Promise(resolve => setTimeout(resolve, 800));
      
        if (!progressReportRef.current) {
          console.error("Progress report element not found");
        toast.error("Failed to generate PDF - Report element not found");
          return;
        }
        
        try {
        // Use html2canvas to capture the report with optimized settings
          const canvas = await html2canvas(progressReportRef.current, {
          scale: 1.5, // Reduced from 2 to generate a smaller file
            useCORS: true,
            logging: false,
            allowTaint: true,
          scrollY: -window.scrollY,
          backgroundColor: '#ffffff',
          removeContainer: true,
          imageTimeout: 15000
          });
          
          // Create PDF with proper dimensions
        const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for smaller file size
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfW = pdf.internal.pageSize.getWidth();
          const pdfH = pdf.internal.pageSize.getHeight();
          
          // Calculate image dimensions for PDF
          const imgW = pdfW;
          const imgH = (canvas.height * imgW) / canvas.width;
          
          // Add image to PDF, potentially across multiple pages
          let yOffset = 0;
          let remainingH = imgH;
          
          // First page
        pdf.addImage(imgData, 'JPEG', 0, yOffset, imgW, imgH, undefined, 'FAST');
          remainingH -= pdfH;
          yOffset -= pdfH;
          
          // Add extra pages if needed
          while (remainingH > 0) {
            pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, yOffset, imgW, imgH, undefined, 'FAST');
            remainingH -= pdfH;
            yOffset -= pdfH;
          }
          
          // Save the PDF with the student's name
          pdf.save(`${student.name.replace(/[^a-z0-9]/gi, '_')}_progress_report.pdf`);
          
          console.log("PDF generated successfully");
        toast.success("PDF report generated successfully");
        } catch (error) {
          console.error("Error generating PDF:", error);
        toast.error("Failed to generate PDF");
          alert("There was an error generating the PDF. Please try again.");
        }
    } catch (error) {
      console.error('Error preparing PDF data:', error);
      toast.error("Failed to prepare PDF data");
      alert('Failed to prepare PDF data. Please try again.');
    } finally {
      setShowProgressReport(false);
    }
  };

  // Helper functions
  const getReadingLevelClass = (level) => {
    const classMap = {
      'Low Emerging': 'reading-level-early',
      'High Emerging': 'reading-level-early',
      'Developing': 'reading-level-developing',
      'Transitioning': 'reading-level-developing',
      'At Grade Level': 'reading-level-fluent',
      'Advanced': 'reading-level-advanced'
    };
    return classMap[level] || 'reading-level-not-assessed';
  };

  const getReadingLevelDescription = (level) => {
    const descriptions = {
      'Low Emerging': 'Beginning to recognize letters and sounds',
      'High Emerging': 'Developing letter-sound connections',
      'Developing': 'Building phonemic awareness and basic vocabulary',
      'Transitioning': 'Building reading comprehension skills',
      'At Grade Level': 'Can read and comprehend grade-level text',
      'Advanced': 'Reading above grade level with strong comprehension'
    };
    return descriptions[level] || 'Not yet assessed - Needs initial assessment';
  };

  // UI event handlers
  const handleSaveFeedback = () => setIsEditingFeedback(false);
  
  const handleSendReport = async () => {
    try {
      // Validate parent connection
      if (!isParentConnected() || !student.parentId) {
        alert('Cannot send report - No parent account is connected to this student.');
        return;
      }
      
      // Don't allow sending if editing the message
      if (isEditingFeedback) {
        alert('Please save your message before sending the report.');
        return;
      }
      
      // Show a loading message
      console.log('Preparing report for sending...');
      toast.loading('Preparing report...'); // Changed from toast() to toast.loading()
      
      // If including progress report, generate the PDF
      let pdfBase64 = null;
      if (includeProgressReport) {
        try {
          // First show the progress report modal to ensure it's rendered
          setShowProgressReport(true);
          
          // Wait for the modal to render
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if the element is available
          const element = progressReportRef.current;
          if (!element) {
            throw new Error('Progress report element not found');
          }
          
          // Generate PDF data with optimized settings
          const canvas = await html2canvas(element, {
            scale: 1.5, // Reduced from 2 to lower file size
            useCORS: true,
            scrollY: -window.scrollY,
            logging: false,
            imageTimeout: 15000,
            backgroundColor: '#ffffff',
            // Add quality options to reduce file size
            allowTaint: true,
            removeContainer: true
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG instead of PNG for smaller file size
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          // Add image with compression settings
          pdf.addImage(
            imgData, 
            'JPEG', 
            0, 
            0, 
            imgWidth * ratio, 
            imgHeight * ratio,
            undefined,
            'FAST' // Use FAST compression
          );
          
          // Convert to base64 with lower quality
          const pdfOutput = pdf.output('datauristring');
          pdfBase64 = pdfOutput.split(',')[1]; // Extract the base64 part
          
          console.log(`PDF generated successfully, original size: ${pdfBase64.length} bytes`);
          
          // Try to reduce size if needed
          if (pdfBase64.length > 5000000) { // Check if PDF is over 5MB
            toast.loading('PDF is too large, attempting to optimize...'); // Changed from toast() to toast.loading()
            
            // Try a more aggressive approach for large PDFs
            const smallerCanvas = document.createElement('canvas');
            const ctx = smallerCanvas.getContext('2d');
            const scaleFactor = 0.5; // Scale down by 50%
            
            smallerCanvas.width = canvas.width * scaleFactor;
            smallerCanvas.height = canvas.height * scaleFactor;
            
            ctx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
            const smallerImgData = smallerCanvas.toDataURL('image/jpeg', 0.5);
            
            const smallerPdf = new jsPDF('p', 'mm', 'a4');
            smallerPdf.addImage(
              smallerImgData,
              'JPEG',
              0,
              0,
              pdfWidth,
              pdfHeight * (smallerCanvas.height / smallerCanvas.width) * (pdfWidth / pdfHeight),
              undefined,
              'FAST'
            );
            
            const smallerPdfOutput = smallerPdf.output('datauristring');
            const smallerPdfBase64 = smallerPdfOutput.split(',')[1];
            
            console.log(`Reduced PDF size from ${pdfBase64.length} to ${smallerPdfBase64.length} bytes`);
            
            if (smallerPdfBase64.length <= 5000000) {
              pdfBase64 = smallerPdfBase64;
            } else {
              console.warn('PDF is still too large after optimization');
              const continueWithoutPDF = window.confirm(
                'The generated PDF is too large to send. Would you like to send the message without the PDF attachment?'
              );
              
              if (continueWithoutPDF) {
                pdfBase64 = null;
                setIncludeProgressReport(false);
              } else {
                setShowProgressReport(false);
                return;
              }
            }
          }
          
          // Hide the modal after generating PDF
          setShowProgressReport(false);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          setShowProgressReport(false);
          toast.error('Failed to generate PDF');
          
          // Ask user if they want to continue without PDF
          const continueWithoutPDF = window.confirm(
            'Failed to generate PDF report. Would you like to send the message without the PDF attachment?'
          );
          
          if (continueWithoutPDF) {
            setIncludeProgressReport(false);
          } else {
            return;
          }
        }
      }
      
      // Prepare report data
      const reportData = {
        subject: feedbackMessage.subject,
        content: feedbackMessage.content,
        includeProgressReport: includeProgressReport && !!pdfBase64, // Only include if we have PDF data
        pdfData: pdfBase64,
        reportDate: progressReport.reportDate
      };
      
      toast.loading('Sending report to parent...'); // Changed from toast() to toast.loading()
      console.log('Sending report to parent...');
      
      try {
        // Send report through service
        const result = await IEPService.sendReportToParent(
          studentId,
          student.parentId,
          reportData
        );
        
        if (result && result.success) {
          console.log('Report sent successfully:', result);
          toast.success('Report sent successfully!');
          setSuccessDialogData({
            message: `Progress report has been successfully sent to ${getParentName()}!`,
            submessage: 'A copy has been saved to the student\'s records.'
          });
          setShowSuccessDialog(true);
        } else {
          throw new Error(result?.message || 'Failed to send report');
        }
      } catch (sendError) {
        console.error('Error sending report:', sendError);
        toast.error('Error sending report');
        
        // If error is likely related to PDF size, offer to send without PDF
        if (sendError.message.includes('too large') || 
            sendError.message.includes('413') || 
            sendError.message.includes('Server error') ||
            sendError.message.includes('offset') ||
            sendError.message.includes('size')) {
          
          const continueWithoutPDF = window.confirm(
            `${sendError.message}\n\nWould you like to try sending just the message without the PDF attachment?`
          );
          
          if (continueWithoutPDF) {
            // Try again without PDF
            try {
              toast.loading('Trying to send without PDF attachment...'); // Changed from toast() to toast.loading()
              const simpleResult = await IEPService.sendReportToParent(
                studentId,
                student.parentId,
                {
                  ...reportData,
                  includeProgressReport: false,
                  pdfData: null
                }
              );
              
              if (simpleResult && simpleResult.success) {
                console.log('Simple report sent successfully:', simpleResult);
                toast.success('Message sent successfully (without PDF attachment)');
                setSuccessDialogData({
                  message: `Progress report has been successfully sent to ${getParentName()}!`,
                  submessage: 'A copy has been saved to the student\'s records.'
                });
                setShowSuccessDialog(true);
              } else {
                throw new Error(simpleResult?.message || 'Failed to send simple report');
              }
            } catch (finalError) {
              console.error('Error sending simple report:', finalError);
              toast.error('Failed to send report');
              alert(`Error sending report: ${finalError.message || 'Unknown error'}`);
            }
          } else {
            alert(`Error sending report: ${sendError.message}`);
          }
        } else {
          alert(`Error sending report: ${sendError.message}`);
        }
      }
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Error preparing report');
      alert(`Error preparing report: ${error.message || 'Unknown error'}`);
    }
  };
  
  const closeSuccessDialog = () => setShowSuccessDialog(false);

  // Format assessment items for display
  const formatAssessmentItems = () => {
    // If reading level progress data exists, use it
    if (readingLevelProgress && readingLevelProgress.categories && readingLevelProgress.categories.length > 0) {
      return readingLevelProgress.categories.map(category => {
        const score = category.score || 0;
        const correctAnswers = category.correctAnswers || 0;
        const totalQuestions = category.totalQuestions || 0;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const description = getCategoryDescription(category.category, score);
        
        return {
          id: category.category,
          name: category.category,
          score: score,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          totalQuestions: totalQuestions,
          isPassed: category.isPassed,
          description: description,
          questions: category.questions || [] // Include the questions
        };
      });
    }
    
    // Fall back to assessment data if reading level progress is not available
    if (assessment && assessment.skillDetails) {
      return assessment.skillDetails.map(skill => {
        // Calculate incorrect answers if we have the data
        const correctAnswers = skill.correctAnswers || 0;
        const totalQuestions = skill.totalQuestions || 10; // Fallback to 10 if not specified
        const incorrectAnswers = totalQuestions - correctAnswers;
        
        return {
          id: skill.id || Math.random().toString(36).substr(2, 9),
          code: skill.category === 'Patinig' ? 'Pa' :
            skill.category === 'Pantig' ? 'Pg' :
              skill.category === 'Pagkilala ng Salita' ? 'PS' :
                skill.category === 'Pag-unawa sa Binasa' ? 'PB' : 'RL',
          name: skill.category,
          score: skill.score || 0,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          totalQuestions: totalQuestions,
          isPassed: skill.isPassed || (skill.score >= 75),
          description: skill.analysis || 'No analysis available',
          questions: [] // No questions available in this data source
        };
      });
    }
    
    return [];
  };

  // Add a helper function to get category descriptions
  const getCategoryDescription = (category, score) => {
    // Descriptions based on category and score
    if (score >= 80) {
      return `Excellent performance in ${category}. Student has mastered the key skills in this area.`;
    } else if (score >= 60) {
      return `Good progress in ${category}. Student demonstrates understanding but may benefit from additional practice.`;
    } else if (score >= 40) {
      return `Average performance in ${category}. Student needs targeted support to strengthen these skills.`;
    } else {
      return `Needs improvement in ${category}. Student requires structured intervention to develop these foundational skills.`;
    }
  };

  // Get parent name for display
  const getParentName = () => {
    // Check if parentProfile exists and has name properties
    if (parentProfile) {
      // First check for a complete name property
      if (parentProfile.name) {
        return parentProfile.name;
      }
      
      // Next check for firstName/lastName/middleName
      if (parentProfile.firstName || parentProfile.lastName) {
        return `${parentProfile.firstName || ''} ${parentProfile.middleName ? parentProfile.middleName + ' ' : ''}${parentProfile.lastName || ''}`.trim();
      }
    }
    
    // Check student.parent object
    if (typeof student.parent === 'string' && student.parent) {
      return student.parent;
    }
    
    if (student.parent && typeof student.parent === 'object') {
      // Check if parent object has a name
      if (student.parent.name) {
        return student.parent.name;
      }
      
      // Check if parent object has firstName/lastName/middleName
      if (student.parent.firstName || student.parent.lastName) {
        return `${student.parent.firstName || ''} ${student.parent.middleName ? student.parent.middleName + ' ' : ''}${student.parent.lastName || ''}`.trim();
      }
    }
    
    // Check for parentName property
    if (student.parentName) {
      return student.parentName;
    }
    
    // If parentId exists but we don't have the name, check the fallback data
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
        return `${matchedParent.firstName || ''} ${matchedParent.middleName ? matchedParent.middleName + ' ' : ''}${matchedParent.lastName || ''}`.trim();
      }
      
      return `Registered Parent (ID: ${student.parentId.substring(0, 6)}...)`;
    }
    
    return 'Parent';
  };

  // In StudentDetails.jsx, update the renderParentImage function:
  const renderParentImage = () => {
    if (parentProfile && parentProfile.profileImageUrl) {
      return (
        <div className="sdx-parent-avatar">
          <img
            src={parentProfile.profileImageUrl}
            alt={getParentName()}
            className="sdx-parent-avatar-img"
            onLoad={handleParentImageLoad}
            onError={handleParentImageError}
          />
          {parentImageError && retryCount < MAX_RETRIES && (
            <div className="sdx-image-retry" onClick={retryLoadImage}>
              <FaSync size={14} /> Retry
            </div>
          )}
        </div>
      );
    }

    const initial = parentProfile && parentProfile.name ?
      parentProfile.name.charAt(0).toUpperCase() :
      typeof student.parent === 'string' ?
        student.parent.charAt(0).toUpperCase() :
        student.parent && student.parent.name ?
          student.parent.name.charAt(0).toUpperCase() : 'P';

    return (
      <div className="sdx-parent-avatar-placeholder">
        {initial}
      </div>
    );
  };

  // Add these functions for category selection and pagination
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setCurrentPage(1);
  };

  const getQuestionsForCategory = () => {
    if (!selectedCategory) {
      return [];
    }
    
    // First try to get questions from assessmentQuestions
    if (assessmentQuestions && assessmentQuestions[selectedCategory]) {
      return assessmentQuestions[selectedCategory];
    }
    
    // Fallback to readingLevelProgress if we don't have data in assessmentQuestions
    if (readingLevelProgress && readingLevelProgress.categories) {
      const category = readingLevelProgress.categories.find(cat => cat.category === selectedCategory);
      return category && category.questions ? category.questions : [];
    }
    
    return [];
  };

  const handleNextPage = () => {
    const questions = getQuestionsForCategory();
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Render learning activities section
  const renderActivitiesTable = () => {
    // Check if student has been assessed
    if (!student.readingLevel || student.readingLevel === 'Not Assessed') {
      return (
        <div className="sdx-activities-container">
          <table className="sdx-table">
            <thead>
              <tr className="sdx-table-header">
                <th className="sdx-header-cell sdx-lesson-col">Lesson</th>
                <th className="sdx-header-cell sdx-status-col">Status</th>
                <th className="sdx-header-cell sdx-score-col">Score</th>
                <th className="sdx-header-cell sdx-support-col" colSpan="3">Support Level</th>
                <th className="sdx-header-cell sdx-remarks-col">Remarks</th>
              </tr>
              <tr className="sdx-table-subheader">
                <th className="sdx-subheader-cell sdx-placeholder"></th>
                <th className="sdx-subheader-cell sdx-placeholder"></th>
                <th className="sdx-subheader-cell sdx-placeholder"></th>
                <th className="sdx-subheader-cell sdx-support-level">Minimal</th>
                <th className="sdx-subheader-cell sdx-support-level">Moderate</th>
                <th className="sdx-subheader-cell sdx-support-level">Extensive</th>
                <th className="sdx-subheader-cell sdx-placeholder"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="sdx-table-row">
                <td colSpan="7" className="sdx-cell sdx-no-activities">
                  No learning activities available. Student has not been assessed yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    
    // Check if we have IEP data
    const hasIepData = iepReport && iepReport.objectives && iepReport.objectives.length > 0;
    
    // Determine if we're in view-only mode (for progress report/overview)
    const isViewOnly = true; // Set to true since this is just an overview
    
    return (
      <div className="sdx-activities-container">
        <table className="sdx-table">
          <thead>
            <tr className="sdx-table-header">
              <th className="sdx-header-cell sdx-lesson-col">Lesson</th>
              <th className="sdx-header-cell sdx-status-col">Status</th>
              <th className="sdx-header-cell sdx-score-col">Score</th>
              <th className="sdx-header-cell sdx-support-col" colSpan="3">Support Level</th>
              <th className="sdx-header-cell sdx-remarks-col">Remarks</th>
            </tr>
            <tr className="sdx-table-subheader">
              <th className="sdx-subheader-cell sdx-placeholder"></th>
              <th className="sdx-subheader-cell sdx-placeholder"></th>
              <th className="sdx-subheader-cell sdx-placeholder"></th>
              <th className="sdx-subheader-cell sdx-support-level">Minimal</th>
              <th className="sdx-subheader-cell sdx-support-level">Moderate</th>
              <th className="sdx-subheader-cell sdx-support-level">Extensive</th>
              <th className="sdx-subheader-cell sdx-placeholder"></th>
            </tr>
          </thead>
          <tbody>
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <tr key={index} className={`sdx-table-row ${index % 2 === 0 ? 'sdx-row-even' : 'sdx-row-odd'}`}>
                  <td className="sdx-cell sdx-activity-name">
                    <div className="sdx-activity-name-container">
                      <span className="sdx-activity-title">{activity.name}</span>
                      <span className="sdx-activity-category">{activity.description}</span>
                    </div>
                  </td>
                  <td className="sdx-cell sdx-activity-status">
                    <span className={`sdx-status-badge status-${activity.status || 'in_progress'}`}>
                      {activity.completed ? 'Completed' : activity.status === 'not_started' ? 'Not Started' : 'In Progress'}
                    </span>
                  </td>
                  <td className="sdx-cell sdx-activity-score">
                    <div className="sdx-score-container">
                      <span className={`sdx-score ${activity.score >= (activity.passingThreshold || 75) ? 'passing' : 'failing'}`}>
                        {activity.score || 0}%
                      </span>
                      {activity.passingThreshold && (
                        <span className="sdx-passing-threshold">
                          (Pass: {activity.passingThreshold}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="sdx-cell sdx-activity-support">
                    <div 
                      className={`sdx-checkbox ${activity.minimalSupport ? 'checked' : ''}`}
                      title={isViewOnly ? "Support level indicator (read-only)" : "Click to toggle minimal support level"}
                      style={{ cursor: isViewOnly ? 'default' : 'pointer' }}
                    >
                      {activity.minimalSupport && <FaCheck className="sdx-checkmark" />}
                    </div>
                  </td>
                  <td className="sdx-cell sdx-activity-support">
                    <div 
                      className={`sdx-checkbox ${activity.moderateSupport ? 'checked' : ''}`}
                      title={isViewOnly ? "Support level indicator (read-only)" : "Click to toggle moderate support level"}
                      style={{ cursor: isViewOnly ? 'default' : 'pointer' }}
                    >
                      {activity.moderateSupport && <FaCheck className="sdx-checkmark" />}
                    </div>
                  </td>
                  <td className="sdx-cell sdx-activity-support">
                    <div 
                      className={`sdx-checkbox ${activity.extensiveSupport ? 'checked' : ''}`}
                      title={isViewOnly ? "Support level indicator (read-only)" : "Click to toggle extensive support level"}
                      style={{ cursor: isViewOnly ? 'default' : 'pointer' }}
                    >
                      {activity.extensiveSupport && <FaCheck className="sdx-checkmark" />}
                    </div>
                  </td>
                  <td className="sdx-cell sdx-activity-remarks">
                    <div className="sdx-remarks-content">
                    {activity.remarks ? activity.remarks : (
                      <span className="sdx-no-remarks">No remarks added</span>
                    )}
                    {activity.hasIntervention && (
                      <div className="sdx-intervention-info">
                        <span className="sdx-intervention-badge">
                          <FaSync className="sdx-intervention-icon" /> Intervention Active
                        </span>
                        <div className="sdx-intervention-name">
                          {activity.interventionName || 'Targeted intervention in progress'}
                        </div>
                      </div>
                    )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="sdx-table-row">
                <td colSpan="7" className="sdx-cell sdx-no-activities">
                  No learning activities recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {hasIepData && iepReport && (
          <div className="sdx-iep-summary">
            <div className="sdx-iep-header">
              <h4 className="sdx-iep-title">IEP Summary</h4>
              <div className="sdx-iep-meta">
                <span className="sdx-iep-academic-year">Academic Year: {iepReport.academicYear || '2025'}</span>
                <span className="sdx-iep-last-updated">
                  Last Updated: {new Date(iepReport.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="sdx-iep-details">
              <div className="sdx-iep-detail">
                <span className="sdx-iep-label">Overall Score:</span>
                <span className="sdx-iep-value">{iepReport.overallScore || 0}%</span>
              </div>
              <div className="sdx-iep-detail">
                <span className="sdx-iep-label">Reading Level:</span>
                <span className="sdx-iep-value">{iepReport.readingLevel || 'Not Assessed'}</span>
              </div>
              <div className="sdx-iep-detail">
                <span className="sdx-iep-label">Active Interventions:</span>
                <span className="sdx-iep-value">
                  {iepReport.objectives ? 
                    iepReport.objectives.filter(obj => obj.hasIntervention).length : 0} 
                  of {iepReport.objectives ? iepReport.objectives.length : 0}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="sdx-container">
        <div className="vs-loading">
          <div className="vs-loading-spinner"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }

  // Render "not found" state
  if (!student) {
    return (
      <div className="sdx-container">
        <div className="vs-no-results">
          <p>Student not found.</p>
          <button className="sdx-back-btn" onClick={goBack}>
            <FaArrowLeft /> Back to Student List
          </button>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="sdx-container">
      {/* Header */}
      <div className="sdx-header">
        <button className="sdx-back-btn" onClick={goBack}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="sdx-title"></h1>
        <div className="sdx-actions">
          <button
            className="sdx-view-report-btn"
            onClick={() => setShowProgressReport(true)}
          >
            <FaFilePdf /> View Progress Report
          </button>
        </div>
      </div>

      {/* Student Profile Section */}
      <div className="sdx-profile-card">
        <div className="sdx-profile-header">
          <div className="sdx-avatar">
            {student.profileImageUrl ? (
              <img
                src={student.profileImageUrl}
                alt={student.name}
                className="sdx-avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.parentElement.innerText = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
                }}
              />
            ) : (
              student.name.split(' ').map(n => n[0]).join('').toUpperCase()
            )}
          </div>
          <div className="sdx-profile-info">
            <h2 className="sdx-student-name">{student.name}</h2>
            <div className="sdx-student-id">
              <FaIdCard /> ID: {student.idNumber || student.id || student._id}
            </div>
          </div>
        </div>

        <div className="sdx-profile-details">
          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaCalendarAlt />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Age</span>
                <span className="sdx-detail-value">{student.age} years old</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaSchool />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Grade </span>
                <span className="sdx-detail-value">{student.gradeLevel || 'Grade 1'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaUsers />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Section</span>
                <span className="sdx-detail-value">{student.section || 'Sampaguita'}</span>
              </div>
            </div>
          </div>

          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaVenusMars />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Gender</span>
                <span className="sdx-detail-value">{student.gender || 'Not specified'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Address</span>
                <span className="sdx-detail-value">{student.address || 'Not provided'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaBookReader />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Reading Level</span>
                <span className="sdx-detail-value">{student.readingLevel || 'Not Assessed'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

   {/* Parent Information */}
<div className="sdx-parent-card">
  <h3 className="sdx-section-title">
    <FaUser /> Parent Information
  </h3>
  <div className="sdx-parent-details">
    <div className="sdx-parent-avatar">
      {renderParentImage()}
    </div>
    <div className="sdx-parent-info">
      <h4 className="sdx-parent-name">
        {isParentConnected() ? getParentName() : 'Not connected'}
      </h4>
      {isParentConnected() ? (
        <div className="sdx-parent-contact">
          <div className="sdx-contact-item">
            <FaEnvelope className="sdx-contact-icon" />
            <span>
              {parentProfile && parentProfile.email ? 
                parentProfile.email : 
                typeof student.parentEmail === 'string' ? 
                  student.parentEmail : 
                  student.parent && student.parent.email ? 
                    student.parent.email : 'Not available'}
            </span>
          </div>
          <div className="sdx-contact-item">
            <FaPhone className="sdx-contact-icon" />
            <span>
              {parentProfile && parentProfile.contact ? 
                parentProfile.contact : 
                typeof student.parentContact === 'string' ? 
                  student.parentContact : 
                  student.parent && student.parent.contact ? 
                    student.parent.contact : 'Not available'}
            </span>
          </div>
        </div>
      ) : (
        <div className="sdx-parent-contact">
          <div className="sdx-contact-item">
            <FaEnvelope className="sdx-contact-icon" />
            <span>Not available</span>
          </div>
          <div className="sdx-contact-item">
            <FaPhone className="sdx-contact-icon" />
            <span>Not available</span>
          </div>
        </div>
      )}
    </div>

    {/* Additional parent details in grid format */}
    <div className="sdx-parent-details-grid">
      <div className="sdx-contact-item">
        <FaAddressCard className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Address</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.address ? 
              parentProfile.address : 
              student.parent && typeof student.parent === 'object' && student.parent.address ? 
                student.parent.address : 'Not provided'}
          </span>
        </div>
      </div>
      <div className="sdx-contact-item">
        <FaRing className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Civil Status</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.civilStatus ? 
              parentProfile.civilStatus : 
              student.parent && typeof student.parent === 'object' && student.parent.civilStatus ? 
                student.parent.civilStatus : 'Not provided'}
          </span>
        </div>
      </div>
      <div className="sdx-contact-item">
        <FaVenusMars className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Gender</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.gender ? 
              parentProfile.gender : 
              student.parent && typeof student.parent === 'object' && student.parent.gender ? 
                student.parent.gender : 'Not provided'}
          </span>
        </div>
      </div>
      <div className="sdx-contact-item">
        <FaBuilding className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Occupation</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.occupation ? 
              parentProfile.occupation : 
              student.parent && typeof student.parent === 'object' && student.parent.occupation ? 
                student.parent.occupation : 'Not provided'}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Learning Activities and Progress Section */}
      <div className="sdx-activities-card">
        <h3 className="sdx-section-title">
          <FaBookReader /> Progress Report
        </h3>
        <div className="sdx-activities-table">
          {renderActivitiesTable()}
        </div>
      </div>

      {/* Reading Level Progress Section */}
      {(assessment || readingLevelProgress) && (
        <div className="sdx-assessment-wrapper">
          <h3 className="sdx-section-title">
            <FaBookReader /> Reading Level Progress
          </h3>
          <div className="sdx-assessment-inner">
            <div className="sdx-level-info">
              <div className={`sdx-level-badge ${getReadingLevelClass(student.readingLevel || 'Not Assessed')}`}>
                {student.readingLevel || 'Not Assessed'}
              </div>
              <div className="sdx-level-details">
                <span className="sdx-level-name">{student.readingLevel || 'Not Assessed'}</span>
                <span className="sdx-level-description">
                  {getReadingLevelDescription(student.readingLevel || 'Not Assessed')}
                </span>
              </div>
            </div>
            
            {/* Reading Level Categories in Card Format */}
            <div className="sdx-reading-categories-grid">
              {formatAssessmentItems().map((skill, index) => (
                <div key={index} className="sdx-reading-category-card">
                  <div className="sdx-reading-category-header">
                    <span className="sdx-reading-category-name">{skill.name}</span>
                    <span className={`sdx-reading-category-score ${skill.score >= 75 ? 'passing' : 'failing'}`}>
                      {skill.score}%
                    </span>
                  </div>
                  
                  <div className="sdx-reading-progress-bar">
                    <div 
                      className={`sdx-reading-progress-fill ${skill.score >= 75 ? 'passing' : 'failing'}`}
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                  
                  <div className="sdx-reading-category-results">
                    <div className="sdx-reading-category-answers">
                      <span className="sdx-correct">✓ {skill.correctAnswers} correct</span>
                      <span className="sdx-incorrect">✗ {skill.incorrectAnswers} incorrect</span>
                    </div>
                    <span className={`sdx-reading-status ${skill.isPassed ? 'passed' : 'failed'}`}>
                      {skill.isPassed ? 'Passed' : 'Not Passed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="sdx-level-overall-summary">
              <p className="sdx-level-overall-description">
                {student.name} is currently at the <strong>{student.readingLevel || 'Not Assessed'}</strong> reading level. 
                {student.readingLevel && student.readingLevel !== 'Not Assessed' ? 
                  ` This means ${getReadingLevelDescription(student.readingLevel).toLowerCase()}.` : 
                  ' An assessment is needed to determine the appropriate reading level.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Send Progress Report Section */}
      <div className="sdx-send-report-section">
        <h3 className="sdx-section-title">
          <FaPaperPlane /> Send Report to Parent
        </h3>

        <div className="sdx-message-box">
          <div className="sdx-message-header">
            <div className="sdx-message-subject">
              <label><strong>Subject:</strong></label>
              {isEditingFeedback ? (
                <input
                  type="text"
                  value={feedbackMessage.subject}
                  onChange={(e) => setFeedbackMessage({ ...feedbackMessage, subject: e.target.value })}
                  className="sdx-subject-input"
                />
              ) : (
                <span>{feedbackMessage.subject}</span>
              )}
            </div>
            <div className="sdx-message-recipient">
              <span>To:</span>
              <div className="sdx-recipient-badge">
                <FaUser className="sdx-recipient-icon" />
                <span>{getParentName()}</span>
              </div>
            </div>
          </div>

          <div className="sdx-message-content">
            {isEditingFeedback ? (
              <textarea
                value={feedbackMessage.content}
                onChange={(e) => setFeedbackMessage({ ...feedbackMessage, content: e.target.value })}
                className="sdx-message-textarea"
                rows="6"
              ></textarea>
            ) : (
              <p className="sdx-message-text">{feedbackMessage.content}</p>
            )}
          </div>

          <div className="sdx-include-report">
            <label className="sdx-include-report-label">
              <input
                type="checkbox"
                checked={includeProgressReport}
                onChange={() => setIncludeProgressReport(!includeProgressReport)}
                className="sdx-include-report-checkbox"
              />
              <FaCheckSquare className={`sdx-checkbox-icon ${includeProgressReport ? 'checked' : ''}`} />
              <span><strong>Include Progress Report</strong></span>
            </label>
          </div>

          <div className="sdx-message-actions">
            {isEditingFeedback ? (
              <button
                className="sdx-save-btn"
                onClick={handleSaveFeedback}
              >
                <FaSave /> Save Message
              </button>
            ) : (
              <button
                className="sdx-edit-btn"
                onClick={() => setIsEditingFeedback(true)}
              >
                <FaEdit /> Edit Message
              </button>
            )}

            <button
              className="sdx-send-btn"
              onClick={handleSendReport}
              disabled={isEditingFeedback}
            >
              <FaPaperPlane /> Send Report
            </button>
          </div>
        </div>
      </div>

      {/* Progress Report Modal */}
      {showProgressReport && (
        <div className="sdx-modal-overlay" onClick={() => setShowProgressReport(false)}>
          <div className="sdx-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sdx-modal-header">
              <h2 className="sdx-modal-title">Progress Report</h2>
              <div className="sdx-modal-actions">
                <button className="sdx-export-btn" onClick={exportToPDF}>
                  <FaFilePdf /> Export as PDF
                </button>
                <button
                  className="sdx-close-btn"
                  onClick={() => setShowProgressReport(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Scrollable wrapper keeps the scrollbar */}
            <div className="sdx-scroll-wrapper">
              {/* Printable body (FULL height) */}
              <div className="sdx-report-printable" ref={progressReportRef}>
                {/* Report Header */}
                <div className="sdx-report-header">
                  <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
                  <div className="sdx-report-school-info">
                    <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
                    <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                    <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                    <p className="sdx-report-school-contact">☎ 8294‑7772 | ✉ cradle.of.learners@gmail.com</p>
                  </div>
                </div>

                {/* Report Title */}
                <div className="sdx-report-title-section">
                  <h2 className="sdx-report-main-title">PROGRESS REPORT</h2>
                  <p className="sdx-report-school-year">S.Y. {progressReport.schoolYear}</p>
                </div>

                {/* Student Information */}
                <div className="sdx-report-student-info">
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Name:</strong> {student.name}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Age:</strong> {student.age}
                    </div>
                  </div>
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Grade:</strong> {student.gradeLevel || 'Grade 1'}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Gender:</strong> {student.gender || 'Not specified'}
                    </div>
                  </div>
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Parent:</strong> {getParentName()}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Date:</strong> {progressReport.reportDate}
                    </div>
                  </div>
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Reading Level:</strong> {student.readingLevel || 'Not Assessed'}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Last Assessment:</strong> {student.lastAssessment || student.lastAssessmentDate ? new Date(student.lastAssessment || student.lastAssessmentDate).toLocaleDateString() : 'Not available'}
                    </div>
                  </div>
                </div>

                {/* Reading Level Progress */}
                <div className="sdx-report-section-title">Reading Level Progress</div>
                
                {/* Reading Level Categories */}
                <div className="sdx-report-level-progress">
                  {formatAssessmentItems().map((skill, index) => (
                    <div key={index} className="sdx-report-level-category">
                      <div className="sdx-report-level-header">
                        <span className="sdx-report-level-name">{skill.name}</span>
                        <span className="sdx-report-level-score">{skill.score}%</span>
                      </div>
                      
                      <div className="sdx-report-level-bar">
                        <div 
                          className="sdx-report-level-fill"
                          style={{ width: `${skill.score}%` }}
                        ></div>
                      </div>
                      
                      <div className="sdx-report-level-results">
                        <div className="sdx-report-level-answers">
                          <span>✓ {skill.correctAnswers} correct</span>
                          <span>✗ {skill.incorrectAnswers} incorrect</span>
                        </div>
                        <span className="sdx-report-level-status">
                          {skill.isPassed ? 'Passed' : 'Not Passed'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="sdx-level-overall-summary">
                  <p className="sdx-level-overall-description">
                    {student.name} is currently at the <strong>{student.readingLevel || 'Not Assessed'}</strong> reading level. 
                    {student.readingLevel && student.readingLevel !== 'Not Assessed' ? 
                      ` This means ${getReadingLevelDescription(student.readingLevel).toLowerCase()}.` : 
                      ' An assessment is needed to determine the appropriate reading level.'}
                  </p>
                </div>

                {/* Progress Table */}
                <div className="sdx-report-section-title">Learning Progress</div>
                <div className="sdx-report-progress-table">
                  <table className="sdx-report-table">
                    <thead>
                      <tr>
                        <th className="sdx-report-th">Lesson</th>
                        <th className="sdx-report-th">Status</th>
                        <th className="sdx-report-th">Score</th>
                        <th className="sdx-report-th" colSpan="3">Support Level</th>
                        <th className="sdx-report-th">Remarks</th>
                      </tr>
                      <tr>
                        <th className="sdx-report-th-empty"></th>
                        <th className="sdx-report-th-empty"></th>
                        <th className="sdx-report-th-empty"></th>
                        <th className="sdx-report-th-level">Minimal</th>
                        <th className="sdx-report-th-level">Moderate</th>
                        <th className="sdx-report-th-level">Extensive</th>
                        <th className="sdx-report-th-empty"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities && activities.length > 0 ? (
                        activities.map((activity, index) => (
                          <tr key={index} className="sdx-report-tr">
                            <td className="sdx-report-td sdx-report-td-aralin">
                              <div>
                                <div>{activity.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{activity.description}</div>
                              </div>
                            </td>
                            <td className="sdx-report-td sdx-report-td-status">
                              <span className={`sdx-status-badge status-${activity.status || 'in_progress'}`}>
                                {activity.completed ? 'Completed' : activity.status === 'not_started' ? 'Not Started' : 'In Progress'}
                              </span>
                            </td>
                            <td className="sdx-report-td sdx-report-td-score">
                              <div className="sdx-score-container">
                                <span className={`sdx-score ${activity.score >= (activity.passingThreshold || 75) ? 'passing' : 'failing'}`}>
                                  {activity.score || 0}%
                                </span>
                              </div>
                            </td>
                            <td className="sdx-report-td sdx-report-td-support">
                              {activity.minimalSupport ? "✓" : ""}
                            </td>
                            <td className="sdx-report-td sdx-report-td-support">
                              {activity.moderateSupport ? "✓" : ""}
                            </td>
                            <td className="sdx-report-td sdx-report-td-support">
                              {activity.extensiveSupport ? "✓" : ""}
                            </td>
                            <td className="sdx-report-td sdx-report-td-puna">
                              <div>
                                {activity.remarks ? activity.remarks : (
                                  <span className="sdx-no-remarks">No remarks added</span>
                                )}
                                {activity.hasIntervention && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: '#ff6b00' }}>
                                    Intervention active: {activity.interventionName || 'Targeted intervention'}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="sdx-report-tr">
                          <td colSpan="7" className="sdx-report-td-empty">
                            No learning activities recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                  {/* Recommendations */}
                  <div className="sdx-report-section-title">Prescriptive Recommendations</div>
                <div className="sdx-report-recommendations">
                  <ul className="sdx-report-rec-list">
                    {progressReport.recommendations.map((rec, index) => (
                      <li key={index} className="sdx-report-rec-item">{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Signatures */}
                <div className="sdx-report-signatures">
                  <div className="sdx-report-signature">
                    <div className="sdx-report-sign-line"></div>
                    <p className="sdx-report-sign-name">Teacher's Signature</p>
                  </div>
                  <div className="sdx-report-signature">
                    <div className="sdx-report-sign-line"></div>
                    <p className="sdx-report-sign-name">Principal's Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="Success"
        message={successDialogData.message}
        submessage={successDialogData.submessage}
      />
    </div>
  );
};

export default StudentDetails;