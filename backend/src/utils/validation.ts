import { body, param, query, ValidationChain } from 'express-validator';
import { UserRole, Gender } from '../models';
import { GRADE_LIST, isValidGrade } from '../constants/gradeConstants';

// Custom validation for CUID format (used by Prisma)
const isCUID = (value: string): boolean => {
  // CUID format: starts with 'c', followed by 24 alphanumeric characters
  const cuidRegex = /^c[0-9a-z]{24}$/i;
  return cuidRegex.test(value);
};

// Custom validation for either UUID or CUID format
const isValidId = (value: string): boolean => {
  // UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // CUID format
  const cuidRegex = /^c[0-9a-z]{24}$/i;

  return uuidRegex.test(value) || cuidRegex.test(value);
};

export class ValidationRules {
  // Authentication validations
  static login(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
    ];
  }

  static register(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
      body('role')
        .isIn(Object.values(UserRole))
        .withMessage('Invalid user role')
    ];
  }

  // Profile validations
  static updateProfile(): ValidationChain[] {
    return [
      body('fullName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
      body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
      body('gender')
        .optional()
        .isIn(Object.values(Gender))
        .withMessage('Invalid gender value')
    ];
  }

  // Student validations
  static createStudent(): ValidationChain[] {
    return [
      body('fullName')
        .isLength({ min: 2, max: 100 })
        .withMessage('Student name must be between 2 and 100 characters. Please enter the full name.'),
      body('dateOfBirth')
        .isISO8601()
        .withMessage('Please provide a valid date of birth in YYYY-MM-DD format (e.g., 2015-03-15)'),
      body('gender')
        .isIn(Object.values(Gender))
        .withMessage('Gender must be one of: MALE, FEMALE, or OTHER'),
      body('grade')
        .notEmpty()
        .withMessage('Grade is required')
        .custom((value) => isValidGrade(value))
        .withMessage(`Invalid grade value. Must be one of: ${Array.from(GRADE_LIST).join(', ')}`),
      body('school')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('School name must be between 2 and 100 characters'),
      body('parentName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Parent name must be between 2 and 100 characters'),
      body('parentPhone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number (e.g., +1234567890)'),
      body('parentEmail')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address (e.g., parent@example.com)'),
      body('address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Address must be less than 500 characters'),
      body('parentPassword')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Parent password must be at least 6 characters long'),
      body('parentEmergencyContact')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid emergency contact phone number')
    ];
  }

  static updateStudent(): ValidationChain[] {
    return [
      param('id')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('fullName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Student name must be between 2 and 100 characters. Please enter the full name.'),
      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth in YYYY-MM-DD format (e.g., 2015-03-15)'),
      body('gender')
        .optional()
        .isIn(Object.values(Gender))
        .withMessage('Gender must be one of: MALE, FEMALE, or OTHER'),
      body('grade')
        .optional()
        .custom((value) => !value || isValidGrade(value))
        .withMessage(`Invalid grade value. Must be one of: ${Array.from(GRADE_LIST).join(', ')}`),
      body('school')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('School name must be between 2 and 100 characters'),
      body('parentName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Parent name must be between 2 and 100 characters'),
      body('parentPhone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number (e.g., +1234567890)'),
      body('parentEmail')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address (e.g., parent@example.com)')
    ];
  }

  // Intake form validations
  static createIntakeForm(): ValidationChain[] {
    return [
      body('studentId')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('dailyDigitalUse')
        .optional()
        .isInt({ min: 0, max: 24 })
        .withMessage('Daily digital use must be between 0 and 24 hours'),
      body('dailyParentChildTime')
        .optional()
        .isInt({ min: 0, max: 24 })
        .withMessage('Daily parent-child time must be between 0 and 24 hours'),
      body('ageOfWalking')
        .optional()
        .isInt({ min: 1, max: 60 })
        .withMessage('Age of walking must be between 1 and 60 months'),
      body('ageOfTwoWordSpeech')
        .optional()
        .isInt({ min: 1, max: 60 })
        .withMessage('Age of two-word speech must be between 1 and 60 months')
    ];
  }

  // Assessment validations
  static createAssessment(): ValidationChain[] {
    return [
      body('studentId')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('assessmentType')
        .optional()
        .isIn(['Initial', 'Reassessment'])
        .withMessage('Assessment type must be Initial or Reassessment')
    ];
  }

  // IEP Goal validations
  static createIEPGoal(): ValidationChain[] {
    return [
      body('studentId')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('domain')
        .isLength({ min: 1, max: 50 })
        .withMessage('Domain is required and must be less than 50 characters'),
      body('goalStatement')
        .isLength({ min: 10, max: 500 })
        .withMessage('Goal statement must be between 10 and 500 characters'),
      body('startDate')
        .isISO8601()
        .withMessage('Please provide a valid start date'),
      body('targetDate')
        .isISO8601()
        .withMessage('Please provide a valid target date')
        .custom((value, { req }) => {
          if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error('Target date must be after start date');
          }
          return true;
        })
    ];
  }

  // Session note validations
  static createSessionNote(): ValidationChain[] {
    return [
      body('studentId')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('sessionDate')
        .isISO8601()
        .withMessage('Please provide a valid session date'),
      body('activities')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Activities description must be between 10 and 1000 characters'),
      body('duration')
        .optional()
        .isInt({ min: 1, max: 480 })
        .withMessage('Duration must be between 1 and 480 minutes')
    ];
  }

  // Report validations
  static createReport(): ValidationChain[] {
    return [
      body('studentId')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('type')
        .isIn(['INTAKE', 'ASSESSMENT', 'IEP', 'PROGRESS'])
        .withMessage('Invalid report type'),
      body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Report title must be between 5 and 200 characters'),
      body('content')
        .isLength({ min: 50 })
        .withMessage('Report content must be at least 50 characters')
    ];
  }

  // Parent concern validations
  static createParentConcern(): ValidationChain[] {
    return [
      body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Concern title must be between 5 and 200 characters'),
      body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Concern description must be between 10 and 1000 characters'),
      body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High'])
        .withMessage('Priority must be Low, Medium, or High')
    ];
  }

  // Center validations
  static createCenter(): ValidationChain[] {
    return [
      body('centerName')
        .isLength({ min: 2, max: 100 })
        .withMessage('Center name must be between 2 and 100 characters'),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number')
    ];
  }

  // School validations
  static createSchool(): ValidationChain[] {
    return [
      body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('School name must be between 2 and 100 characters'),
      body('centerId')
        .custom(isValidId)
        .withMessage('Valid center ID is required'),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number')
    ];
  }

  // Center validations
  static updateCenter(): ValidationChain[] {
    return [
      param('id')
        .custom(isValidId)
        .withMessage('Valid center ID is required'),
      body('centerName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Center name must be between 2 and 100 characters'),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number')
    ];
  }

  // Parent profile validations
  static updateParentProfile(): ValidationChain[] {
    return [
      body('fullName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
      body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
      body('address')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Address must be less than 500 characters'),
      body('emergencyContact')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Emergency contact must be less than 200 characters')
    ];
  }

  // File upload validations
  static uploadDocument(): ValidationChain[] {
    return [
      body('category')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Category must be between 1 and 50 characters'),
      body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters')
    ];
  }

  // Common parameter validations
  static validateId(): ValidationChain[] {
    return [
      param('id')
        .notEmpty()
        .withMessage('ID is required')
        .isString()
        .withMessage('ID must be a string')
    ];
  }

  static validatePagination(): ValidationChain[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
    ];
  }

  // Admin-specific validations
  static createUser(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
      body('role')
        .isIn(Object.values(UserRole))
        .withMessage('Invalid user role'),
      body('profileData')
        .isObject()
        .withMessage('Profile data is required')
    ];
  }

  static updateUser(): ValidationChain[] {
    return [
      param('userId')
        .custom(isValidId)
        .withMessage('Valid user ID is required'),
      body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('isActive')
        .optional()
        .isBoolean()
        .withMessage('Active status must be boolean')
    ];
  }

  static assignEducatorToCenter(): ValidationChain[] {
    return [
      body('centerId')
        .custom(isValidId)
        .withMessage('Valid center ID is required'),
      body('educatorId')
        .custom(isValidId)
        .withMessage('Valid educator ID is required'),
      body('educatorType')
        .isIn(['SPECIAL_EDUCATOR', 'SUPER_SPECIAL_EDUCATOR'])
        .withMessage('Invalid educator type')
    ];
  }

  static assignStudentToEducator(): ValidationChain[] {
    return [
      body('studentId')
        .custom(isValidId)
        .withMessage('Valid student ID is required'),
      body('specialEducatorId')
        .custom(isValidId)
        .withMessage('Valid special educator ID is required')
    ];
  }

  static updateSystemConfig(): ValidationChain[] {
    return [
      body('config')
        .isObject()
        .withMessage('Configuration object is required')
    ];
  }

  static exportData(): ValidationChain[] {
    return [
      body('type')
        .isIn(['users', 'students', 'reports', 'assessments'])
        .withMessage('Invalid export type'),
      body('format')
        .isIn(['csv', 'excel', 'pdf'])
        .withMessage('Invalid export format')
    ];
  }

  // Special Educator profile validations
  static updateSpecialEducatorProfile(): ValidationChain[] {
    return [
      body('fullName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
      body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Please provide a valid phone number'),
      body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth'),
      body('gender')
        .optional()
        .isIn(Object.values(Gender))
        .withMessage('Invalid gender value'),
      body('yearOfGraduation')
        .optional()
        .isInt({ min: 1980, max: new Date().getFullYear() })
        .withMessage('Year of graduation must be between 1980 and current year'),
      body('yearsOfExperience')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Years of experience must be between 0 and 50'),
      body('maxGroupSize')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Max group size must be between 1 and 50'),
      body('rciCertified')
        .optional()
        .isBoolean()
        .withMessage('RCI certification status must be boolean'),
      body('consentToShare')
        .optional()
        .isBoolean()
        .withMessage('Consent to share must be boolean'),
      body('agreementToPolicies')
        .optional()
        .isBoolean()
        .withMessage('Agreement to policies must be boolean')
    ];
  }
}

// Simple validation function for special educator profile
export function validateSpecialEducatorProfile(profileData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (profileData.fullName && (profileData.fullName.length < 2 || profileData.fullName.length > 100)) {
    errors.push('Full name must be between 2 and 100 characters');
  }

  if (profileData.yearOfGraduation && (profileData.yearOfGraduation < 1980 || profileData.yearOfGraduation > new Date().getFullYear())) {
    errors.push('Year of graduation must be between 1980 and current year');
  }

  if (profileData.yearsOfExperience && (profileData.yearsOfExperience < 0 || profileData.yearsOfExperience > 50)) {
    errors.push('Years of experience must be between 0 and 50');
  }

  if (profileData.maxGroupSize && (profileData.maxGroupSize < 1 || profileData.maxGroupSize > 50)) {
    errors.push('Max group size must be between 1 and 50');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
