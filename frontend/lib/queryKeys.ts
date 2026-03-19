/**
 * Query Key Factory for consistent caching across the application
 * This prevents cache misses and ensures proper data sharing between components
 */

export const queryKeys = {
  // Auth related queries
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    token: () => [...queryKeys.auth.all, 'token'] as const,
    notifications: (params?: any) => [...queryKeys.auth.all, 'notifications', params] as const,
  },

  // Students related queries
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.students.lists(), params] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
    stats: (centerId?: string, schoolId?: string) => 
      [...queryKeys.students.all, 'stats', centerId, schoolId] as const,
    dashboard: (id: string) => [...queryKeys.students.details(), id, 'dashboard'] as const,
    progress: (id: string) => [...queryKeys.students.details(), id, 'progress'] as const,
  },

  // Centers related queries
  centers: {
    all: ['centers'] as const,
    lists: () => [...queryKeys.centers.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.centers.lists(), params] as const,
    details: () => [...queryKeys.centers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.centers.details(), id] as const,
    dashboard: (id?: string) => [...queryKeys.centers.all, 'dashboard', id] as const,
    students: (id?: string, params?: any) => 
      id ? [...queryKeys.centers.detail(id), 'students', params] as const : ['centers', 'students', params] as const,
    educators: (id?: string, params?: any) => 
      id ? [...queryKeys.centers.detail(id), 'educators', params] as const : ['centers', 'educators', params] as const,
    schools: (id?: string) => 
      id ? [...queryKeys.centers.detail(id), 'schools'] as const : ['centers', 'schools'] as const,
    reports: (id?: string, params?: any) => 
      id ? [...queryKeys.centers.detail(id), 'reports', params] as const : ['centers', 'reports', params] as const,
    compliance: (id?: string) => 
      id ? [...queryKeys.centers.detail(id), 'compliance'] as const : ['centers', 'compliance'] as const,
    overdueReports: (id?: string, params?: any) => 
      id ? [...queryKeys.centers.detail(id), 'overdue-reports', params] as const : ['centers', 'overdue-reports', params] as const,
  },

  // Assessments related queries
  assessments: {
    all: ['assessments'] as const,
    lists: () => [...queryKeys.assessments.all, 'list'] as const,
    byStudent: (studentId: string) => 
      [...queryKeys.assessments.lists(), 'student', studentId] as const,
    history: (studentId: string) => 
      [...queryKeys.assessments.byStudent(studentId), 'history'] as const,
    summary: (studentId: string) => 
      [...queryKeys.assessments.byStudent(studentId), 'summary'] as const,
    stats: (centerId?: string) => 
      [...queryKeys.assessments.all, 'stats', centerId] as const,
  },

  // Intake forms related queries
  intakeForms: {
    all: ['intakeForms'] as const,
    byStudent: (studentId: string) => 
      [...queryKeys.intakeForms.all, 'student', studentId] as const,
  },

  // IEP Goals
  iepGoals: {
    all: ['iepGoals'] as const,
    lists: () => [...queryKeys.iepGoals.all, 'list'] as const,
    details: () => [...queryKeys.iepGoals.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.iepGoals.details(), id] as const,
    byStudent: (studentId: string) => 
      [...queryKeys.iepGoals.all, 'student', studentId] as const,
    byEducator: (educatorId: string) => 
      [...queryKeys.iepGoals.all, 'educator', educatorId] as const,
  },

  iepGoal: {
    all: ['iepGoal'] as const,
    detail: (id: string) => [...queryKeys.iepGoal.all, 'detail', id] as const,
  },

  // Session notes related queries
  sessionNotes: {
    all: ['sessionNotes'] as const,
    lists: () => [...queryKeys.sessionNotes.all, 'list'] as const,
    byStudent: (studentId: string, params?: any) => 
      [...queryKeys.sessionNotes.all, 'student', studentId, params] as const,
  },

  sessionNote: {
    all: ['sessionNote'] as const,
    detail: (id: string) => [...queryKeys.sessionNote.all, 'detail', id] as const,
  },

  // Reports related queries
  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.reports.lists(), params] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.reports.details(), id] as const,
    byStudent: (studentId: string) => 
      [...queryKeys.reports.all, 'student', studentId] as const,
  },

  report: {
    all: ['report'] as const,
    detail: (id: string) => [...queryKeys.report.all, 'detail', id] as const,
  },

  // Users related queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.users.lists(), params] as const,
    byRole: (role: string, params?: any) => 
      [...queryKeys.users.lists(), 'role', role, params] as const,
    search: (query: string, params?: any) => 
      [...queryKeys.users.lists(), 'search', query, params] as const,
    stats: () => [...queryKeys.users.all, 'stats'] as const,
  },

  // Schools related queries
  schools: {
    all: ['schools'] as const,
    lists: () => [...queryKeys.schools.all, 'list'] as const,
    list: (params?: any) => [...queryKeys.schools.lists(), params] as const,
    details: () => [...queryKeys.schools.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.schools.details(), id] as const,
  },

  // Parent related queries
  parent: {
    all: ['parent'] as const,
    dashboard: () => [...queryKeys.parent.all, 'dashboard'] as const,
    profile: () => [...queryKeys.parent.all, 'profile'] as const,
    concerns: (params?: any) => [...queryKeys.parent.all, 'concerns', params] as const,
    documents: (params?: any) => [...queryKeys.parent.all, 'documents', params] as const,
    notifications: (params?: any) => [...queryKeys.parent.all, 'notifications', params] as const,
    communications: (params?: any) => [...queryKeys.parent.all, 'communications', params] as const,
    childSessionNotes: (childId: string, params?: any) => [...queryKeys.parent.all, 'childSessionNotes', childId, params] as const,
    childIEPGoals: (childId: string, params?: any) => [...queryKeys.parent.all, 'childIEPGoals', childId, params] as const,
    childReports: (childId: string, params?: any) => [...queryKeys.parent.all, 'childReports', childId, params] as const,
    children: (params?: any) => [...queryKeys.parent.all, 'children', params] as const,
    childDetails: (childId: string) => [...queryKeys.parent.all, 'childDetails', childId] as const,
    childProgress: (childId: string, params?: any) => [...queryKeys.parent.all, 'childProgress', childId, params] as const,
    childAssessments: (childId: string, params?: any) => [...queryKeys.parent.all, 'childAssessments', childId, params] as const,
    childSchedule: (childId: string, params?: any) => [...queryKeys.parent.all, 'childSchedule', childId, params] as const,
    appointments: (params?: any) => [...queryKeys.parent.all, 'appointments', params] as const,
    consentForms: (params?: any) => [...queryKeys.parent.all, 'consentForms', params] as const,
  },

  // Admin related queries
  admin: {
    all: ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    approvals: (params?: any) => [...queryKeys.admin.all, 'approvals', params] as const,
    auditLogs: (params?: any) => [...queryKeys.admin.all, 'auditLogs', params] as const,
    analytics: (period?: string) => [...queryKeys.admin.all, 'analytics', period] as const,
    systemConfig: () => [...queryKeys.admin.all, 'systemConfig'] as const,
  },

  // Special Educator related queries
  specialEducator: {
    all: ['specialEducator'] as const,
    dashboard: () => [...queryKeys.specialEducator.all, 'dashboard'] as const,
    profile: () => [...queryKeys.specialEducator.all, 'profile'] as const,
    assignedStudents: (params?: any) => 
      [...queryKeys.specialEducator.all, 'assignedStudents', params] as const,
    students: (params?: any) => 
      [...queryKeys.specialEducator.all, 'students', params] as const,
    studentDetails: (studentId: string) => 
      [...queryKeys.specialEducator.all, 'studentDetails', studentId] as const,
    activities: (limit?: number) => 
      [...queryKeys.specialEducator.all, 'activities', limit] as const,
    statistics: () => [...queryKeys.specialEducator.all, 'statistics'] as const,
    schedule: () => [...queryKeys.specialEducator.all, 'schedule'] as const,
    sessionNotes: (params?: any) => 
      [...queryKeys.specialEducator.all, 'sessionNotes', params] as const,
    notifications: (params?: any) => [...queryKeys.specialEducator.all, 'notifications', params] as const,
  },

  // Super Special Educator related queries
  superSpecialEducator: {
    all: ['superSpecialEducator'] as const,
    dashboard: () => [...queryKeys.superSpecialEducator.all, 'dashboard'] as const,
    profile: () => [...queryKeys.superSpecialEducator.all, 'profile'] as const,
    assignedCenters: (params?: any) => 
      [...queryKeys.superSpecialEducator.all, 'assignedCenters', params] as const,
    assignedEducators: (params?: any) => 
      [...queryKeys.superSpecialEducator.all, 'assignedEducators', params] as const,
    studentsUnderSupervision: (params?: any) => 
      [...queryKeys.superSpecialEducator.all, 'studentsUnderSupervision', params] as const,
    pendingReviews: (params?: any) => 
      [...queryKeys.superSpecialEducator.all, 'pendingReviews', params] as const,
    flaggedCases: (params?: any) => 
      [...queryKeys.superSpecialEducator.all, 'flaggedCases', params] as const,
    analytics: (params?: any) => [...queryKeys.superSpecialEducator.all, 'analytics', params] as const,
    analyticsDetailed: {
      crossCenter: (period?: string, metrics?: string[]) => 
        [...queryKeys.superSpecialEducator.all, 'analytics', 'crossCenter', period, metrics] as const,
      performance: (period?: string, centerId?: string) => 
        [...queryKeys.superSpecialEducator.all, 'analytics', 'performance', period, centerId] as const,
    },
    activities: (limit?: number, type?: string) => 
      [...queryKeys.superSpecialEducator.all, 'activities', limit, type] as const,
    assessments: (params?: any) => [...queryKeys.superSpecialEducator.all, 'assessments', params] as const,
    centers: (params?: any) => [...queryKeys.superSpecialEducator.all, 'centers', params] as const,
    students: (params?: any) => [...queryKeys.superSpecialEducator.all, 'students', params] as const,
    notifications: (params?: any) => [...queryKeys.superSpecialEducator.all, 'notifications', params] as const,
    reports: (params?: any) => [...queryKeys.superSpecialEducator.all, 'reports', params] as const,
    specialEducators: () => [...queryKeys.superSpecialEducator.all, 'specialEducators'] as const,
    systemConfig: () => [...queryKeys.superSpecialEducator.all, 'systemConfig'] as const,
    auditLogs: (params?: any) => [...queryKeys.superSpecialEducator.all, 'auditLogs', params] as const,
  },

  // Educator related queries
  educator: {
    all: ['educator'] as const,
    dashboard: () => [...queryKeys.educator.all, 'dashboard'] as const,
    profile: () => [...queryKeys.educator.all, 'profile'] as const,
    students: (params?: any) => 
      [...queryKeys.educator.all, 'students', params] as const,
    studentDetails: (studentId: string) => 
      [...queryKeys.educator.all, 'studentDetails', studentId] as const,
    assessments: (params?: any) => 
      [...queryKeys.educator.all, 'assessments', params] as const,
    iepGoals: (params?: any) => 
      [...queryKeys.educator.all, 'iepGoals', params] as const,
    sessionNotes: (params?: any) => 
      [...queryKeys.educator.all, 'sessionNotes', params] as const,
    reports: (params?: any) => 
      [...queryKeys.educator.all, 'reports', params] as const,
    schedule: (params?: any) => 
      [...queryKeys.educator.all, 'schedule', params] as const,
    notifications: (params?: any) => 
      [...queryKeys.educator.all, 'notifications', params] as const,
  },

  // Files
  files: {
    all: ['files'] as const,
    lists: () => [...queryKeys.files.all, 'list'] as const,
    details: () => [...queryKeys.files.all, 'detail'] as const,
    detail: (fileId: string) => [...queryKeys.files.details(), fileId] as const,
    download: (type: string, fileId: string) => 
      [...queryKeys.files.all, 'download', type, fileId] as const,
  },

  // Global queries
  global: {
    all: ['global'] as const,
    search: (params?: any) => [...queryKeys.global.all, 'search', params] as const,
    searchSuggestions: (query?: string) => [...queryKeys.global.all, 'searchSuggestions', query] as const,
    recentSearches: () => [...queryKeys.global.all, 'recentSearches'] as const,
    appSettings: () => [...queryKeys.global.all, 'appSettings'] as const,
    healthCheck: () => [...queryKeys.global.all, 'healthCheck'] as const,
    statistics: (params?: any) => [...queryKeys.global.all, 'statistics', params] as const,
    activityLogs: (params?: any) => [...queryKeys.global.all, 'activityLogs', params] as const,
    systemConfig: () => [...queryKeys.global.all, 'systemConfig'] as const,
  },

  // Global search
  search: {
    all: ['search'] as const,
    global: (query: string, type?: string) => 
      [...queryKeys.search.all, 'global', query, type] as const,
  },

  // AI Agent queries
  ai: {
    all: ['ai'] as const,
    health: () => [...queryKeys.ai.all, 'health'] as const,
    assessment: (studentId: string) =>
      [...queryKeys.ai.all, 'assessment', studentId] as const,
    iep: (studentId: string) =>
      [...queryKeys.ai.all, 'iep', studentId] as const,
    lessonPlan: (studentId: string, week?: number) =>
      [...queryKeys.ai.all, 'lessonPlan', studentId, week] as const,
    risk: (studentId: string) =>
      [...queryKeys.ai.all, 'risk', studentId] as const,
    schoolRisk: (schoolId: string) =>
      [...queryKeys.ai.all, 'schoolRisk', schoolId] as const,
    educatorInsights: () =>
      [...queryKeys.ai.all, 'educatorInsights'] as const,
  },
} as const;

/**
 * Helper function to invalidate related queries
 * Use this for smart cache invalidation
 */
export const invalidationPatterns = {
  // When a student is updated, invalidate all student-related queries
  student: (studentId: string) => [
    queryKeys.students.detail(studentId),
    queryKeys.students.lists(),
    queryKeys.assessments.byStudent(studentId),
    queryKeys.intakeForms.byStudent(studentId),
    queryKeys.iepGoals.byStudent(studentId),
    queryKeys.sessionNotes.byStudent(studentId),
    queryKeys.reports.byStudent(studentId),
  ],

  // When a center is updated, invalidate center-related queries
  center: (centerId: string) => [
    queryKeys.centers.detail(centerId),
    queryKeys.centers.lists(),
    queryKeys.centers.dashboard(centerId),
    queryKeys.centers.students(centerId),
    queryKeys.centers.educators(centerId),
    queryKeys.centers.schools(centerId),
  ],

  // When user data changes, invalidate user-related queries
  user: () => [
    queryKeys.auth.user(),
    queryKeys.auth.profile(),
    queryKeys.users.lists(),
  ],

  // When assessments change, invalidate assessment-related queries
  assessment: (studentId: string) => [
    queryKeys.assessments.byStudent(studentId),
    queryKeys.assessments.history(studentId),
    queryKeys.assessments.summary(studentId),
    queryKeys.students.detail(studentId),
  ],

  // When session notes change, invalidate session note-related queries
  sessionNote: (studentId: string) => [
    queryKeys.sessionNotes.byStudent(studentId),
    queryKeys.students.detail(studentId),
    queryKeys.educator.sessionNotes(),
  ],

  // When files change, invalidate file-related queries
  file: (fileId: string) => [
    queryKeys.files.detail(fileId),
    queryKeys.files.lists(),
  ],

  // When reports change, invalidate report-related queries
  report: (reportId: string) => [
    queryKeys.reports.detail(reportId),
    queryKeys.reports.lists(),
    queryKeys.educator.reports(),
  ],
  iepGoal: (goalId: string) => [
    queryKeys.iepGoals.detail(goalId),
    queryKeys.iepGoals.lists(),
    queryKeys.educator.iepGoals(),
  ],
};