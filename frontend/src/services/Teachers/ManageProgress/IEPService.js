import api from '../api';
import axios from 'axios';

class IEPService {
  
  // Get IEP report for a student
  static async getIEPReport(studentId, academicYear = null) {
    try {
      console.log(`[IEPService] Fetching IEP report for student: ${studentId}`);
      
      const params = {};
      if (academicYear) {
        params.academicYear = academicYear;
      }
      
      const response = await api.get(`/api/iep/student/${studentId}`, { params });
      
      console.log('[IEPService] IEP report fetched successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching IEP report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('IEP report not found for this student');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this IEP report');
      } else if (error.response?.status === 401) {
        throw new Error('You must be logged in to access IEP reports');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch IEP report');
    }
  }
  
  // Update support level for an IEP objective
  static async updateSupportLevel(studentId, objectiveId, supportLevel) {
    try {
      console.log(`Updating support level for objective ${objectiveId} to ${supportLevel}`);
      
      // Try the new endpoint first (direct objective update)
      try {
        const response = await api.put(`/api/iep/objective/${objectiveId}/support-level`, {
          supportLevel,
          studentId
        });
        
        console.log('Support level update response:', response.data);
        return response.data;
      } catch (firstError) {
        console.warn('New API endpoint failed, trying legacy endpoint:', firstError.message);
        
        // Fall back to the legacy endpoint
        const response = await api.put(
          `/api/iep/student/${studentId}/objective/${objectiveId}/support-level`,
          { supportLevel }
        );
        
        console.log('Support level update response (legacy):', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating support level:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
  
  // Update remarks for an objective
  static async updateRemarks(studentId, objectiveId, remarks) {
    try {
      console.log(`[IEPService] Updating remarks:`, {
        studentId,
        objectiveId,
        remarksLength: remarks?.length || 0
      });
      
      const response = await api.put(
        `/api/iep/student/${studentId}/objective/${objectiveId}/remarks`,
        { remarks: remarks || '' }
      );
      
      console.log('[IEPService] Remarks updated successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error updating remarks:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Student or objective not found');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update remarks');
    }
  }
  
  // Bulk update multiple objectives
  static async bulkUpdateObjectives(studentId, updates) {
    try {
      console.log(`[IEPService] Bulk updating objectives:`, {
        studentId,
        updateCount: updates?.length || 0
      });
      
      // Validate updates array
      if (!Array.isArray(updates)) {
        throw new Error('Updates must be an array');
      }
      
      // Validate each update object
      const validUpdates = updates.filter(update => {
        return update.objectiveId && (
          update.supportLevel || 
          update.hasOwnProperty('remarks')
        );
      });
      
      if (validUpdates.length === 0) {
        throw new Error('No valid updates provided');
      }
      
      const response = await api.put(
        `/api/iep/student/${studentId}/bulk-update`,
        { updates: validUpdates }
      );
      
      console.log('[IEPService] Bulk update completed successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error bulk updating objectives:', error);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Invalid update data');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update objectives');
    }
  }
  
  // Get class IEP reports (for teacher dashboard)
  static async getClassIEPReports(studentIds = null, academicYear = null) {
    try {
      console.log(`[IEPService] Fetching class IEP reports:`, {
        studentIds: studentIds?.length || 'all',
        academicYear
      });
      
      const params = {};
      
      if (studentIds && Array.isArray(studentIds)) {
        params.studentIds = studentIds.join(',');
      }
      
      if (academicYear) {
        params.academicYear = academicYear;
      }
      
      const response = await api.get('/api/iep/class', { params });
      
      console.log('[IEPService] Class IEP reports fetched successfully:', {
        count: response.data?.count || 0
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching class IEP reports:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch class IEP reports');
    }
  }
  
  // Create a new IEP report manually (if needed)
  static async createIEPReport(studentId, data = {}) {
    try {
      console.log(`[IEPService] Creating IEP report for student: ${studentId}`);
      
      const response = await api.post(`/api/iep/student/${studentId}`, data);
      
      console.log('[IEPService] IEP report created successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error creating IEP report:', error);
      
      if (error.response?.status === 409) {
        throw new Error('IEP report already exists for this student');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to create IEP report');
    }
  }
  
  // Delete/Archive an IEP report
  static async archiveIEPReport(studentId, iepReportId) {
    try {
      console.log(`[IEPService] Archiving IEP report:`, {
        studentId,
        iepReportId
      });
      
      const response = await api.delete(`/api/iep/student/${studentId}/report/${iepReportId}`);
      
      console.log('[IEPService] IEP report archived successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error archiving IEP report:', error);
      throw new Error(error.response?.data?.message || 'Failed to archive IEP report');
    }
  }
  
  // Get IEP report history for a student
  static async getIEPHistory(studentId, limit = 10) {
    try {
      console.log(`[IEPService] Fetching IEP history for student: ${studentId}`);
      
      const params = { limit };
      const response = await api.get(`/api/iep/student/${studentId}/history`, { params });
      
      console.log('[IEPService] IEP history fetched successfully:', {
        count: response.data?.data?.length || 0
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching IEP history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch IEP history');
    }
  }
  
  // Export IEP report as PDF (if implemented on backend)
  static async exportIEPAsPDF(studentId, iepReportId) {
    try {
      console.log(`[IEPService] Exporting IEP as PDF:`, {
        studentId,
        iepReportId
      });
      
      const response = await api.get(
        `/api/iep/student/${studentId}/report/${iepReportId}/export`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `IEP_Report_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('[IEPService] IEP exported successfully');
      return { success: true, message: 'IEP report exported successfully' };
      
    } catch (error) {
      console.error('[IEPService] Error exporting IEP:', error);
      throw new Error(error.response?.data?.message || 'Failed to export IEP report');
    }
  }
  
  // Get IEP statistics for dashboard
  static async getIEPStatistics(classId = null, academicYear = null) {
    try {
      console.log(`[IEPService] Fetching IEP statistics`);
      
      const params = {};
      if (classId) params.classId = classId;
      if (academicYear) params.academicYear = academicYear;
      
      const response = await api.get('/api/iep/statistics', { params });
      
      console.log('[IEPService] IEP statistics fetched successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching IEP statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch IEP statistics');
    }
  }
  
  // Validate objective data before sending to server
  static validateObjectiveUpdate(update) {
    if (!update.objectiveId) {
      throw new Error('Objective ID is required');
    }
    
    if (update.supportLevel && !['minimal', 'moderate', 'extensive'].includes(update.supportLevel)) {
      throw new Error('Invalid support level');
    }
    
    if (update.remarks && typeof update.remarks !== 'string') {
      throw new Error('Remarks must be a string');
    }
    
    return true;
  }
  
  // Helper method to format IEP data for display
  static formatIEPDataForDisplay(iepData) {
    if (!iepData || !iepData.objectives) return null;
    
    return {
      ...iepData,
      objectives: iepData.objectives.map(objective => ({
        ...objective,
        categoryDisplayName: objective.categoryName
          ?.replace(/_/g, ' ')
          ?.replace(/\b\w/g, l => l.toUpperCase()),
        lastUpdatedFormatted: objective.lastUpdated 
          ? new Date(objective.lastUpdated).toLocaleDateString()
          : null,
        scorePercentage: `${objective.score || 0}%`,
        isPassingScore: (objective.score || 0) >= (objective.passingThreshold || 75)
      })),
      lastUpdatedFormatted: iepData.updatedAt 
        ? new Date(iepData.updatedAt).toLocaleDateString()
        : null
    };
  }
  
  // Add the refreshInterventionData method to the IEPService class
  static async refreshInterventionData(studentId) {
    try {
      console.log(`[IEPService] Refreshing intervention data for student: ${studentId}`);
      
      const response = await api.put(`/api/iep/student/${studentId}/refresh-interventions`);
      
      console.log('[IEPService] Intervention data refreshed successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error refreshing intervention data:', error);
      throw new Error(error.response?.data?.message || 'Failed to refresh intervention data');
    }
  }

  // Send progress report to parent and save PDF
  static async sendReportToParent(studentId, parentId, reportData) {
    try {
      console.log(`[IEPService] Sending progress report to parent:`, {
        studentId,
        parentId,
        subject: reportData?.subject,
        hasPdfData: !!reportData?.pdfData,
        pdfDataSize: reportData?.pdfData ? reportData.pdfData.length : 0
      });
      
      // Upload PDF to S3 if PDF data exists
      let pdfS3Path = null;
      if (reportData?.pdfData && reportData.includeProgressReport) {
        try {
          pdfS3Path = await IEPService.uploadPdfToS3(
            studentId, 
            parentId, 
            reportData.pdfData,
            reportData.subject
          );
          console.log('[IEPService] PDF uploaded to S3:', pdfS3Path);
        } catch (s3Error) {
          console.error('[IEPService] Error uploading PDF to S3:', s3Error);
          // Continue without PDF if upload fails
        }
      }
      
      // Check if API endpoint is available
      try {
        const checkResponse = await api.get(`/api/iep/student/${studentId}`);
        console.log('[IEPService] API connection test successful:', checkResponse.status);
      } catch (checkError) {
        console.error('[IEPService] API connection test failed:', checkError);
        // Continue with the main request anyway
      }
      
      // Create a safe version of the data without potentially large PDF content for logging
      const safeLogData = {
        parentId,
        subject: reportData?.subject,
        content: reportData?.content?.substring(0, 100) + '...',
        includeProgressReport: reportData?.includeProgressReport,
        reportDate: reportData?.reportDate,
        hasPdfData: !!reportData?.pdfData,
        pdfS3Path
      };
      
      console.log('[IEPService] Sending with data:', safeLogData);
      
      // Create the request data - now using S3 path instead of embedding the PDF
      const requestData = {
        parentId,
        subject: reportData.subject,
        content: reportData.content,
        includeProgressReport: reportData.includeProgressReport && !!pdfS3Path,
        reportDate: reportData.reportDate,
        // Include S3 path instead of the full PDF data
        pdfS3Path: pdfS3Path
      };
      
      // Send the report with timeout extended
      const response = await api.post(
        `/api/iep/student/${studentId}/send-report`, 
        requestData,
        {
          timeout: 30000 // 30 second timeout
        }
      );
      
      console.log('[IEPService] Progress report sent successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error sending progress report:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to send progress report';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('[IEPService] Error response data:', error.response.data);
        console.error('[IEPService] Error response status:', error.response.status);
        
        if (error.response.status === 413) {
          errorMessage = 'The PDF file is too large to send. Try without including the progress report.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error: ' + (error.response.data?.message || 'Internal server error');
        } else {
          errorMessage = `${error.response.status} error: ${error.response.data?.error || error.response.data?.message || errorMessage}`;
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[IEPService] No response received from server');
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      throw new Error(errorMessage);
    }
  }

  // New method to upload PDF to S3 bucket
  static async uploadPdfToS3(studentId, parentId, pdfBase64, subject) {
    try {
      console.log(`[IEPService] Uploading PDF to S3 for student ${studentId}`);
      
      // Format date for filename
      const dateString = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Create a descriptive filename for the S3 object
      const subjectSlug = subject ? subject.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'report';
      const filename = `${subjectSlug}-${dateString}.pdf`;
      
      // Call the API endpoint that handles S3 uploads
      const response = await api.post('/api/uploads/pdf', {
        filename,
        contentType: 'application/pdf',
        data: pdfBase64,
        studentId, // Pass studentId for folder organization
        parentId,  // Pass parentId for folder organization
        metadata: {
          studentId,
          parentId,
          subject,
          createdAt: dateString
        }
      });
      
      if (!response.data?.success || !response.data?.fileUrl) {
        throw new Error('Upload failed: ' + (response.data?.message || 'Unknown error'));
      }
      
      console.log('[IEPService] PDF uploaded successfully:', response.data.fileUrl);
      return response.data.fileUrl; // Return the S3 URL
      
    } catch (error) {
      console.error('[IEPService] Error uploading PDF to S3:', error);
      throw new Error('Failed to upload PDF: ' + (error.message || 'Unknown error'));
    }
  }

  // Get previous PDF reports for a student
  static async getPreviousPdfReports(studentId) {
    try {
      console.log(`[IEPService] Getting previous PDF reports for student: ${studentId}`);
      
      const response = await api.get(`/api/iep/student/${studentId}/reports`);
      
      console.log('[IEPService] Found previous reports:', response.data);
      return response.data;
    } catch (error) {
      console.error('[IEPService] Error getting previous PDF reports:', error);
      throw new Error(error.response?.data?.message || 'Failed to get previous PDF reports');
    }
  }
}

export default IEPService; 