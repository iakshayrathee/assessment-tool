// Static system configuration data
// This data is based on the backend AdminService.getSystemConfig() method

export const SYSTEM_CONFIG = {
  platform: {
    name: 'Knowled',
    version: '1.0.0',
    maintenance: false
  },
  features: {
    assessmentDomains: ['Reading', 'Writing', 'Math', 'Visual Perception', 'Motor Skills', 'Attention'],
    gradeList: ['Pre-K', 'Kinder Garden', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
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
export const GRADE_LIST = SYSTEM_CONFIG.features.gradeList;
export const SYLLABUS_LIST = SYSTEM_CONFIG.features.syllabusList;
export const ASSESSMENT_DOMAINS = SYSTEM_CONFIG.features.assessmentDomains;
export const REPORT_TYPES = SYSTEM_CONFIG.features.reportTypes;