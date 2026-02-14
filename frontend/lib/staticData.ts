// Static system configuration data
// This data is based on the backend AdminService.getSystemConfig() method

import { GRADE_LIST } from './gradeConfig';

export const SYSTEM_CONFIG = {
  platform: {
    name: 'Knowled',
    version: '1.0.0',
    maintenance: false
  },
  features: {
    assessmentDomains: ['Reading', 'Writing', 'Math', 'Visual Perception', 'Motor Skills', 'Attention'],
    gradeList: GRADE_LIST, // Use shared grade configuration
    syllabusList: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'],
    reportTypes: ['INTAKE', 'ASSESSMENT', 'IEP', 'PROGRESS']
  },
  security: {
    passwordMinLength: 6,
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxLoginAttempts: 5
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false
  }
};

// Export individual lists for easier access
// Re-export from gradeConfig to maintain backward compatibility
export { GRADE_LIST } from './gradeConfig';
export const SYLLABUS_LIST = SYSTEM_CONFIG.features.syllabusList;
export const ASSESSMENT_DOMAINS = SYSTEM_CONFIG.features.assessmentDomains;
export const REPORT_TYPES = SYSTEM_CONFIG.features.reportTypes;