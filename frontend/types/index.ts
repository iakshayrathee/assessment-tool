// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  profile: any;
  lastLogin?: string;
  // Role-specific profiles
  adminProfile?: AdminProfile;
  specialEducatorProfile?: EducatorProfile;
  superSpecialEducatorProfile?: EducatorProfile;
  centerProfile?: CenterProfile;
  parentProfile?: ParentProfile;
  schoolViewerProfile?: SchoolViewerProfile;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_SPECIAL_EDUCATOR = 'SUPER_SPECIAL_EDUCATOR',
  SPECIAL_EDUCATOR = 'SPECIAL_EDUCATOR',
  CENTER = 'CENTER',
  PARENT = 'PARENT',
  SCHOOL_VIEWER = 'SCHOOL_VIEWER',
  STUDENT = 'STUDENT'
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
  PROGRESS = 'PROGRESS',
  LESSON_PLAN = 'LESSON_PLAN',
  AI_COMPREHENSIVE = 'AI_COMPREHENSIVE'
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
  TRANSFERRED = 'TRANSFERRED'
}

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  profileData: any;
}

// Profile Types
export interface AdminProfile {
  id: string;
  fullName: string;
  phone?: string;
  department?: string;
  position?: string;
  accessLevel?: string;
  permissions?: string[];
  lastLoginDate?: string;
  notes?: string;
}

export interface EducatorProfile {
  id: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  primaryLanguage?: string;
  secondaryLanguages?: string[];
  highestQualification?: string;
  fieldOfStudy?: string;
  institutionName?: string;
  yearOfGraduation?: number;
  rciCertified?: boolean;
  rciValidityDate?: string;
  specialEdQualification?: string;
  specializationAreas?: string[];
  additionalCertifications?: string[];
  yearsOfExperience?: number;
  experienceTypes?: string[];
  maxGroupSize?: number;
  totalYearsOfExperience?: number;
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

export interface CenterProfile {
  id: string;
  centerName: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  operatingHours?: string;
  description?: string;
  capacity?: number;
  establishedDate?: string;
  licenseNumber?: string;
  accreditation?: string[];
  servicesOffered?: string[];
  ageGroupsServed?: string[];
  specializations?: string[];
  facilities?: string[];
  staffCount?: number;
  website?: string;
  socialMedia?: Record<string, string>;
  emergencyContact?: string;
  insuranceInfo?: string;
  transportationAvailable?: boolean;
  mealsProvided?: boolean;
  extracurricularActivities?: string[];
  parentInvolvementPrograms?: string[];
  communityPartnerships?: string[];
  qualityRating?: number;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  complianceStatus?: string;
  notes?: string;
}

export interface ParentProfile {
  id: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  occupation?: string;
  education?: string;
  maritalStatus?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  communicationPreferences?: string[];
  relationshipToChild?: string;
  guardianshipStatus?: string;
  consentToShare?: boolean;
  agreementToPolicies?: boolean;
}

export interface SchoolViewerProfile {
  id: string;
  fullName: string;
  position?: string;
  phone?: string;
  department?: string;
  schoolId: string;
  accessLevel?: string;
  permissions?: string[];
  lastAccessDate?: string;
  notes?: string;
  school?: School;
}

// Educational Data Types
export interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: Gender;
  grade: string;
  motherTongue?: string;
  syllabus?: string;
  status: StudentStatus;
  registrationDate: string;
  centerId: string;
  center?: CenterProfile;
  schoolId?: string;
  school?: School;
  parentId: string;
  parent?: ParentProfile;
  assignments?: StudentAssignment[];
  intakeForms?: IntakeForm[];
  assessments?: Assessment[];
  iepGoals?: IEPGoal[];
  sessionNotes?: SessionNote[];
  reports?: Report[];
  documents?: StudentDocument[];
}

export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  centerId: string;
  center?: CenterProfile;
}

export interface StudentAssignment {
  id: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  assignedDate: string;
  isActive: boolean;
}

export interface IntakeForm {
  id: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  
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
  
  status: AssessmentStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  
  // Assessment domains
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
  
  assessmentType: string;
  status: AssessmentStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEPGoal {
  id: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  
  domain: string;
  goalStatement: string;
  strategy?: string;
  startDate: string;
  targetDate: string;
  expectedOutcome?: string;
  progressPercent: number;
  status: IEPGoalStatus;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
  progressUpdates?: IEPProgress[];
}

export interface IEPProgress {
  id: string;
  goalId: string;
  updateDate: string;
  progress: number;
  notes?: string;
  rating?: string;
  createdAt: string;
}

// New IEP Types for Updated Format
export enum IEPDocumentStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum TeacherAssistanceLevel {
  INDEPENDENT = 'INDEPENDENT',
  MINIMAL_ASSISTANCE = 'MINIMAL_ASSISTANCE',
  MODERATE_ASSISTANCE = 'MODERATE_ASSISTANCE',
  MAXIMAL_ASSISTANCE = 'MAXIMAL_ASSISTANCE',
  PHYSICAL_PROMPT = 'PHYSICAL_PROMPT'
}

export enum BehavioralAttentionLevel {
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT'
}

export enum BehavioralSittingTolerance {
  POOR = 'POOR',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  EXCELLENT = 'EXCELLENT'
}

export enum BehavioralTaskCompletion {
  NOT_COMPLETED = 'NOT_COMPLETED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  COMPLETED_WITH_ASSISTANCE = 'COMPLETED_WITH_ASSISTANCE',
  COMPLETED_INDEPENDENTLY = 'COMPLETED_INDEPENDENTLY'
}

export enum IEPSubject {
  ORAL_LANGUAGE = 'ORAL_LANGUAGE',
  READING = 'READING',
  WRITING = 'WRITING',
  SPELLING = 'SPELLING',
  MATH = 'MATH'
}

export interface IEPDocument {
  id: string;
  title: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  
  durationMonths: number;
  startDate: string;
  endDate: string;
  areasOfRemediation: string[];
  status: IEPDocumentStatus;
  
  subjectSections?: IEPSubjectSection[];
  weeklyEvaluations?: WeeklyEvaluation[];
  
  createdAt: string;
  updatedAt: string;
}

export interface IEPSubjectSection {
  id: string;
  iepDocumentId: string;
  iepDocument?: IEPDocument;
  
  subject: string;
  presentLevelReceptive: string;
  presentLevelExpressive: string;
  
  longTermGoals: IEPLongTermGoal[];
  shortTermGoals: IEPShortTermGoal[];
  
  createdAt: string;
  updatedAt: string;
}

export interface IEPLongTermGoal {
  id: string;
  subjectSectionId: string;
  subjectSection?: IEPSubjectSection;
  
  objective: string;
  durationMonths: number;
  measurableCriteria: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface IEPShortTermGoal {
  id: string;
  subjectSectionId: string;
  subjectSection?: IEPSubjectSection;
  
  steppingStone: string;
  teacherAssistanceLevel: TeacherAssistanceLevel;
  
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyEvaluation {
  id: string;
  iepDocumentId: string;
  iepDocument?: IEPDocument;
  
  weekNumber: number;
  evaluationDate: string;
  
  dailyActivities: string;
  strategyEffectiveness: string;
  subjectObservations: string;
  behavioralAttention: BehavioralAttentionLevel;
  behavioralSittingTolerance: BehavioralSittingTolerance;
  behavioralTaskCompletion: BehavioralTaskCompletion;
  wasAbleToDo: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SessionNote {
  id: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  
  sessionDate: string;
  duration?: number;
  activities: string;
  observations?: string;
  progress?: string;
  nextSteps?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  studentId: string;
  student?: Student;
  specialEducatorId: string;
  specialEducator?: EducatorProfile;
  superSpecialEducatorId?: string;
  superSpecialEducator?: EducatorProfile;
  
  type: ReportType;
  title: string;
  content: string;
  summary?: string;
  recommendations?: string;
  educatorSignature?: string;
  
  status: AssessmentStatus;
  submittedAt?: string;
  reviewedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ParentConcern {
  id: string;
  parentId: string;
  parent?: ParentProfile;
  studentId?: string;
  title: string;
  description: string;
  category?: string;
  priority: string;
  status: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentDocument {
  id: string;
  studentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category?: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
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
  unreadCount?: number;
}

// Backend-specific response types that match the actual API
export interface BackendApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BackendPaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalStudents?: number;
  totalEducators?: number;
  totalCenters?: number;
  totalSchools?: number;
  pendingAssessments?: number;
  pendingReports?: number;
  activeIEPGoals?: number;
}

// Admin Dashboard Types (matching backend response)
export interface AdminDashboardData {
  totalUsers: number;
  totalCenters: number;
  totalStudents: number;
  totalReports: number;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    user: string;
    timestamp: string;
    details: string;
    ipAddress?: string;
  }>;
}

// Center Dashboard Types (matching backend response)
export interface CenterDashboardData {
  totalEducators: number;
  totalStudents: number;
  totalSchools: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

// Parent Dashboard Types (matching backend response)
export interface ParentDashboardData {
  children: Array<{
    id: string;
    fullName: string;
    age: number;
    grade: string;
    status: string;
    recentReports: number;
    activeGoals: number;
  }>;
  recentReports: Array<{
    id: string;
    title: string;
    type: string;
    studentName: string;
    createdAt: string;
  }>;
  upcomingSessions: Array<{
    id: string;
    studentName: string;
    educatorName: string;
    scheduledAt: string;
    type: string;
  }>;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: any;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

// UI Component Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'number';
  options?: { value: string; label: string }[];
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// File Upload Types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  role?: UserRole;
  status?: string;
  centerId?: string;
  schoolId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Navigation Types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<any>;
  badge?: string | number;
  children?: NavItem[];
  roles?: UserRole[];
}
