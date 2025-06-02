// services/index.js
import AuthService from './AuthService';
import StudentApiService from './Teachers/StudentApiService';
import AssessmentApiService from './Teachers/AssessmentApiService';
import ContentApiService from './Teachers/ContentApiService';
import ProgressApiService from './Teachers/ProgressApiService';

export {
  AuthService,
  StudentApiService,
  AssessmentApiService,
  ContentApiService,
  ProgressApiService
};

// This file allows for easier imports from a single source
// Example: import { StudentApiService, AssessmentApiService } from '../services';