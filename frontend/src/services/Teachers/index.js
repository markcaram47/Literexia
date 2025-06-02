// Export all teacher services from this directory
import MainAssessmentService from './MainAssessmentService';
import TemplateService from './templateService';
import TeacherService from './teacherService';
import ViewStudentService from './ViewStudentService';
import StudentDetailsService from './StudentDetailsService';
import CategoryResultsService from './CategoryResultsService';
import StudentApiService from './StudentApiService';
import DashboardApiService from './DashboardApiService';
import ChatbotService from './chatbotService';
import PreAssessmentService from './PreAssessmentService';

export {
  MainAssessmentService,
  TemplateService,
  TeacherService,
  ViewStudentService,
  StudentDetailsService,
  CategoryResultsService,
  StudentApiService,
  DashboardApiService,
  ChatbotService,
  PreAssessmentService
};

// Default export for backward compatibility
export default {
  MainAssessmentService,
  TemplateService,
  TeacherService,
  ViewStudentService,
  StudentDetailsService,
  CategoryResultsService,
  StudentApiService,
  DashboardApiService,
  ChatbotService,
  PreAssessmentService
}; 