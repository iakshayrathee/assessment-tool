import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';

// Educator Dashboard Hook
export function useEducatorDashboard() {
  return useQuery({
    queryKey: queryKeys.educator.dashboard(),
    queryFn: () => apiClient.getSpecialEducatorDashboard(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Educator Students Hook
export function useEducatorStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: queryKeys.educator.students(params || {}),
    queryFn: () => apiClient.getAssignedStudents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => apiClient.createStudent(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      toast.success('Student created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create student');
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ studentId, studentData }: { studentId: string; studentData: any }) => 
      apiClient.updateStudent(studentId, studentData),
    onSuccess: (_, { studentId }) => {
      // Invalidate specific student and lists
      invalidationPatterns.student(studentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Student updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update student');
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (studentId: string) => apiClient.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.students() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
      toast.success('Student deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete student');
    },
  });

  return {
    students: studentsQuery.data?.data || [],
    pagination: studentsQuery.data?.pagination,
    isLoading: studentsQuery.isLoading,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
    createStudent: createStudentMutation.mutate,
    updateStudent: updateStudentMutation.mutate,
    deleteStudent: deleteStudentMutation.mutate,
    isCreating: createStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending,
  };
}

// Educator Assessments Hook
export function useEducatorAssessments(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: string;
  type?: string;
}) {
  const queryClient = useQueryClient();

  const assessmentsQuery = useQuery({
    queryKey: queryKeys.educator.assessments(params || {}),
    queryFn: () => {
      if (params?.studentId) {
        return apiClient.getAssessmentsByStudent(params.studentId);
      }
      // Return empty array if no studentId provided
      return Promise.resolve([]);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: (assessmentData: any) => apiClient.createAssessment(assessmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.assessments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
      toast.success('Assessment created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create assessment');
    },
  });

  // Update assessment mutation
  const updateAssessmentMutation = useMutation({
    mutationFn: ({ assessmentId, assessmentData }: { assessmentId: string; assessmentData: any }) => 
      apiClient.updateAssessment(assessmentId, assessmentData),
    onSuccess: (_, { assessmentId }) => {
      // Invalidate specific assessment and lists
      invalidationPatterns.assessment(assessmentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Assessment updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update assessment');
    },
  });

  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => apiClient.deleteAssessment(assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.assessments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.lists() });
      toast.success('Assessment deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete assessment');
    },
  });

  return {
    assessments: assessmentsQuery.data || [],
    pagination: undefined,
    isLoading: assessmentsQuery.isLoading,
    error: assessmentsQuery.error,
    refetch: assessmentsQuery.refetch,
    createAssessment: createAssessmentMutation.mutate,
    updateAssessment: updateAssessmentMutation.mutate,
    deleteAssessment: deleteAssessmentMutation.mutate,
    isCreating: createAssessmentMutation.isPending,
    isUpdating: updateAssessmentMutation.isPending,
    isDeleting: deleteAssessmentMutation.isPending,
  };
}

// Educator IEP Goals Hook
export function useEducatorIEPGoals(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const iepGoalsQuery = useQuery({
    queryKey: queryKeys.educator.iepGoals(params || {}),
    queryFn: () => {
      if (params?.studentId) {
        return apiClient.getIEPGoalsByStudent(params.studentId);
      }
      // Return empty array if no studentId provided
      return Promise.resolve([]);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create IEP goal mutation
  const createIEPGoalMutation = useMutation({
    mutationFn: (goalData: any) => apiClient.createIEPGoal(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.iepGoals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.iepGoals.lists() });
      toast.success('IEP Goal created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create IEP goal');
    },
  });

  // Update IEP goal mutation
  const updateIEPGoalMutation = useMutation({
    mutationFn: ({ goalId, goalData }: { goalId: string; goalData: any }) => 
      apiClient.updateIEPGoal(goalId, goalData),
    onSuccess: (_, { goalId }) => {
      // Invalidate specific goal and lists
      invalidationPatterns.iepGoal(goalId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('IEP Goal updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update IEP goal');
    },
  });

  // Delete IEP goal mutation
  const deleteIEPGoalMutation = useMutation({
    mutationFn: (goalId: string) => apiClient.deleteIEPGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.iepGoals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.iepGoals.lists() });
      toast.success('IEP Goal deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete IEP goal');
    },
  });

  return {
    iepGoals: iepGoalsQuery.data || [],
    pagination: undefined,
    isLoading: iepGoalsQuery.isLoading,
    error: iepGoalsQuery.error,
    refetch: iepGoalsQuery.refetch,
    createIEPGoal: createIEPGoalMutation.mutate,
    updateIEPGoal: updateIEPGoalMutation.mutate,
    deleteIEPGoal: deleteIEPGoalMutation.mutate,
    isCreating: createIEPGoalMutation.isPending,
    isUpdating: updateIEPGoalMutation.isPending,
    isDeleting: deleteIEPGoalMutation.isPending,
  };
}

// Educator Session Notes Hook
export function useEducatorSessionNotes(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  goalId?: string;
  date?: string;
}) {
  const queryClient = useQueryClient();

  const sessionNotesQuery = useQuery({
    queryKey: queryKeys.educator.sessionNotes(params || {}),
    queryFn: async () => {
      if (params?.studentId) {
        return apiClient.getEducatorSessionNotes(params.studentId, {
          page: params.page,
          limit: params.limit
        });
      }
      // Return empty result if no studentId provided
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        }
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute (session notes need fresh data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create session note mutation
  const createSessionNoteMutation = useMutation({
    mutationFn: (noteData: any) => apiClient.createSessionNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.sessionNotes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionNotes.lists() });
      toast.success('Session note created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create session note');
    },
  });

  // Update session note mutation
  const updateSessionNoteMutation = useMutation({
    mutationFn: ({ noteId, noteData }: { noteId: string; noteData: any }) => 
      apiClient.updateSessionNote(noteId, noteData),
    onSuccess: (_, { noteId }) => {
      // Invalidate specific note and lists
      invalidationPatterns.sessionNote(noteId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Session note updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update session note');
    },
  });

  // Delete session note mutation
  const deleteSessionNoteMutation = useMutation({
    mutationFn: (noteId: string) => apiClient.deleteSessionNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.sessionNotes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionNotes.lists() });
      toast.success('Session note deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete session note');
    },
  });

  return {
    sessionNotes: sessionNotesQuery.data?.data || [],
    pagination: sessionNotesQuery.data?.pagination,
    isLoading: sessionNotesQuery.isLoading,
    error: sessionNotesQuery.error,
    refetch: sessionNotesQuery.refetch,
    createSessionNote: createSessionNoteMutation.mutate,
    updateSessionNote: updateSessionNoteMutation.mutate,
    deleteSessionNote: deleteSessionNoteMutation.mutate,
    isCreating: createSessionNoteMutation.isPending,
    isUpdating: updateSessionNoteMutation.isPending,
    isDeleting: deleteSessionNoteMutation.isPending,
  };
}

// Educator Reports Hook
export function useEducatorReports(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  type?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: queryKeys.educator.reports(params || {}),
    queryFn: () => {
      if (params?.studentId) {
        return apiClient.getReportsByStudent(params.studentId);
      }
      // Return empty array if no studentId provided
      return Promise.resolve([]);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (reportData: any) => apiClient.generateReport(reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.reports() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      toast.success('Report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate report');
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ reportId, reportData }: { reportId: string; reportData: any }) => 
      apiClient.updateReport(reportId, reportData),
    onSuccess: (_, { reportId }) => {
      // Invalidate specific report and lists
      invalidationPatterns.report(reportId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Report updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update report');
    },
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: (reportId: string) => apiClient.deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.reports() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      toast.success('Report deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete report');
    },
  });

  return {
    reports: reportsQuery.data || [],
    pagination: undefined, // No pagination for array response
    isLoading: reportsQuery.isLoading,
    error: reportsQuery.error,
    refetch: reportsQuery.refetch,
    generateReport: generateReportMutation.mutate,
    updateReport: updateReportMutation.mutate,
    deleteReport: deleteReportMutation.mutate,
    isGenerating: generateReportMutation.isPending,
    isUpdating: updateReportMutation.isPending,
    isDeleting: deleteReportMutation.isPending,
  };
}

// Educator Schedule Hook
export function useEducatorSchedule(params?: {
  date?: string;
  week?: string;
  month?: string;
}) {
  const queryClient = useQueryClient();

  const scheduleQuery = useQuery({
    queryKey: queryKeys.educator.schedule(params),
    queryFn: () => apiClient.getEducatorSchedule(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create schedule entry mutation
  const createScheduleEntryMutation = useMutation({
    mutationFn: (entryData: any) => apiClient.createScheduleEntry(entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.schedule() });
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.dashboard() });
      toast.success('Schedule entry created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create schedule entry');
    },
  });

  // Update schedule entry mutation
  const updateScheduleEntryMutation = useMutation({
    mutationFn: ({ entryId, entryData }: { entryId: string; entryData: any }) => 
      apiClient.updateScheduleEntry(entryId, entryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.schedule() });
      toast.success('Schedule entry updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update schedule entry');
    },
  });

  // Delete schedule entry mutation
  const deleteScheduleEntryMutation = useMutation({
    mutationFn: (entryId: string) => apiClient.deleteScheduleEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.schedule() });
      toast.success('Schedule entry deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete schedule entry');
    },
  });

  return {
    schedule: scheduleQuery.data || [],
    pagination: undefined,
    isLoading: scheduleQuery.isLoading,
    error: scheduleQuery.error,
    refetch: scheduleQuery.refetch,
    createScheduleEntry: createScheduleEntryMutation.mutate,
    updateScheduleEntry: updateScheduleEntryMutation.mutate,
    deleteScheduleEntry: deleteScheduleEntryMutation.mutate,
    isCreating: createScheduleEntryMutation.isPending,
    isUpdating: updateScheduleEntryMutation.isPending,
    isDeleting: deleteScheduleEntryMutation.isPending,
  };
}

// Educator Profile Hook
export function useEducatorProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.educator.profile(),
    queryFn: () => apiClient.getEducatorProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateEducatorProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
  };
}

// Educator Notifications Hook
export function useEducatorNotifications(params?: {
  page?: number;
  limit?: number;
  read?: boolean;
}) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.educator.notifications(params),
    queryFn: () => apiClient.getEducatorNotifications(params),
    staleTime: 30 * 1000, // 30 seconds (notifications need fresh data)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.notifications() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark notification as read');
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.educator.notifications() });
      toast.success('All notifications marked as read!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark all notifications as read');
    },
  });

  return {
    notifications: notificationsQuery.data?.data || [],
    pagination: notificationsQuery.data?.pagination,
    unreadCount: notificationsQuery.data?.unreadCount || 0,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

// Educator Student Details Hook
export function useEducatorStudentDetails(studentId?: string) {
  return useQuery({
    queryKey: queryKeys.educator.studentDetails(studentId!),
    queryFn: () => apiClient.getStudentDetailsForEducator(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}