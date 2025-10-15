// User and Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  token: string;
  expiresIn: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  profile: any; // Will be typed based on role
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_SPECIAL_EDUCATOR = 'SUPER_SPECIAL_EDUCATOR',
  SPECIAL_EDUCATOR = 'SPECIAL_EDUCATOR',
  CENTER = 'CENTER',
  PARENT = 'PARENT',
  SCHOOL_VIEWER = 'SCHOOL_VIEWER'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER'
}

export enum AssessmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED'
}

export enum IEPGoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ACHIEVED = 'ACHIEVED',
  DISCONTINUED = 'DISCONTINUED'
}

export enum ReportType {
  INTAKE = 'INTAKE',
  ASSESSMENT = 'ASSESSMENT',
  IEP = 'IEP',
  PROGRESS = 'PROGRESS'
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  TRANSFERRED = 'TRANSFERRED'
}

// Profile Interfaces
export interface AdminProfileData {
  fullName: string;
  phone?: string;
}

export interface EducatorProfileData {
  fullName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;
  primaryLanguage?: string;
  secondaryLanguages?: string[];
  highestQualification?: string;
  fieldOfStudy?: string;
  institutionName?: string;
  yearOfGraduation?: number;
  rciCertified?: boolean;
  rciValidityDate?: Date;
  specialEdQualification?: string;
  specializationAreas?: string[];
  yearsOfExperience?: number;
  experienceTypes?: string[];
  maxGroupSize?: number;
  currentWorkLocations?: string[];
  ldTypesHandled?: string[];
  gradeLevelsServed?: string[];
  assessmentTools?: string;
  assistiveTechProficiency?: string[];
  areasOfInterest?: string[];
  consentToShare?: boolean;
  agreementToPolicies?: boolean;
  personalStatement?: string;
}

export interface CenterProfileData {
  centerName: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  operatingHours?: string;
  description?: string;
}

export interface ParentProfileData {
  fullName: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  relationship?: string;
}

export interface SchoolViewerProfileData {
  fullName: string;
  position?: string;
  phone?: string;
  schoolId: string;
}

// Student and Educational Data
export interface StudentData {
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  grade: string;
  motherTongue?: string;
  syllabus?: string;
  centerId: string;
  schoolId?: string;
  parentId?: string; // Optional for new registrations
  // Parent information for new registrations
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
}

export interface IntakeFormData {
  studentId: string;
  // Socio Demographic Data
  address?: string;
  familyIncome?: string;
  familyType?: string;
  digitalResourcesAtHome?: boolean;
  dailyDigitalUse?: number;
  enjoysSchool?: boolean;
  studyAssistant?: string;
  externalAcademicSupport?: boolean;
  enjoysReading?: boolean;
  dailyParentChildTime?: number;
  childType?: string;
  
  // Family History
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  
  // Prenatal, Natal & Delivery
  pregnancyNormal?: boolean;
  medicationsDuringPregnancy?: string;
  miscarriagesAbortions?: boolean;
  fullTermOrPremature?: string;
  deliveryType?: string;
  
  // Post Natal Factors
  breastFed?: boolean;
  infantJaundice?: boolean;
  incubation?: boolean;
  immunizationDone?: boolean;
  consanguineousMarriage?: boolean;
  birthCry?: string;
  delayInNeckStanding?: boolean;
  delayInNeckStandingDetails?: string;
  ageOfWalking?: number;
  ageOfTwoWordSpeech?: number;
  
  // Medical History
  healthConcerns?: string;
  epilepticHistory?: boolean;
  onMedication?: boolean;
  medicationDetails?: string;
  asthmaWheezing?: boolean;
  wearsGlasses?: boolean;
  visionTestDone?: boolean;
  hearingTestDone?: boolean;
  
  // Educational History
  attendedPreschool?: boolean;
  repeatedGrades?: boolean;
  whichGradeRepeated?: string;
  dominantWritingHand?: string;
  strugglesInLanguages?: boolean;
}

export interface AssessmentData {
  studentId: string;
  readingObservations?: string;
  readingLevel?: string;
  readingFiles?: string[];
  writingObservations?: string;
  writingLevel?: string;
  writingFiles?: string[];
  mathObservations?: string;
  mathLevel?: string;
  mathFiles?: string[];
  vpObservations?: string;
  vpLevel?: string;
  vpFiles?: string[];
  motorObservations?: string;
  motorLevel?: string;
  motorFiles?: string[];
  attentionObservations?: string;
  attentionLevel?: string;
  attentionFiles?: string[];
  assessmentType?: string;
}

export interface IEPGoalData {
  studentId: string;
  domain: string;
  goalStatement: string;
  strategy?: string;
  startDate: Date;
  targetDate: Date;
  expectedOutcome?: string;
}

export interface SessionNoteData {
  studentId: string;
  sessionDate: Date;
  duration?: number;
  activities: string;
  observations?: string;
  progress?: string;
  nextSteps?: string;
}

export interface ReportData {
  studentId: string;
  type: ReportType;
  title: string;
  content: string;
  summary?: string;
  recommendations?: string;
}

export interface ParentConcernData {
  studentId?: string;
  title: string;
  description: string;
  category?: string;
  priority?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Data Types
export interface DashboardStats {
  totalStudents?: number;
  totalEducators?: number;
  totalCenters?: number;
  totalSchools?: number;
  pendingAssessments?: number;
  pendingReports?: number;
  activeIEPGoals?: number;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
}

// File Upload Types
export interface FileUploadData {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category?: string;
  description?: string;
}
