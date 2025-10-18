import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';

export function useCheckSpecialEducatorToken() {
  // Check token
  const tokenQuery = useQuery({
    queryKey: queryKeys.specialEducator.token(),
    queryFn: () => apiClient.checkSpecialEducatorToken(),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    tokenData: tokenQuery.data,
    
    // Loading states
    isLoading: tokenQuery.isLoading,
    
    // Error states
    error: tokenQuery.error,
    
    // Refetch
    refetch: tokenQuery.refetch,
  };
}

export function useSpecialEducatorDashboard() {
  // Get dashboard data
  const dashboardQuery = useQuery({
    queryKey: queryKeys.specialEducator.dashboard(),
    queryFn: () => apiClient.getSpecialEducatorDashboard(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    // Data
    dashboard: dashboardQuery.data,
    
    // Loading states
    isLoading: dashboardQuery.isLoading,
    
    // Error states
    error: dashboardQuery.error,
    
    // Refetch
    refetch: dashboardQuery.refetch,
  };
}

export function useSpecialEducatorProfile() {
  const queryClient = useQueryClient();

  // Get profile
  const profileQuery = useQuery({
    queryKey: queryKeys.specialEducator.profile(),
    queryFn: () => apiClient.getSpecialEducatorProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateSpecialEducatorProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialEducator.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
  });

  return {
    // Data
    profile: profileQuery.data,
    
    // Loading states
    isLoading: profileQuery.isLoading,
    isUpdating: updateProfileMutation.isPending,
    
    // Actions
    updateProfile: updateProfileMutation.mutate,
    
    // Error states
    error: profileQuery.error,
    
    // Refetch
    refetch: profileQuery.refetch,
  };
}

export function useSpecialEducatorStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  centerId?: string;
}) {
  const queryClient = useQueryClient();

  // Get assigned students
  const studentsQuery = useQuery({
    queryKey: queryKeys.specialEducator.students(params),
    queryFn: () => apiClient.getSpecialEducatorStudents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Assign student mutation
  const assignStudentMutation = useMutation({
    mutationFn: (assignmentData: {
      studentId: string;
      educatorId: string;
      centerId?: string;
    }) => apiClient.assignStudentToSpecialEducator({
      studentId: assignmentData.studentId,
      specialEducatorId: assignmentData.educatorId,
      notes: undefined
    }),
    onSuccess: (_, { studentId }) => {
      // Invalidate specific student and lists
      invalidationPatterns.student(studentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.specialEducator.dashboard() });
      toast.success('Student assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign student');
    },
  });

  return {
    // Data
    students: studentsQuery.data?.data || [],
    pagination: studentsQuery.data?.pagination,
    
    // Loading states
    isLoading: studentsQuery.isLoading,
    isAssigning: assignStudentMutation.isPending,
    
    // Actions
    assignStudent: assignStudentMutation.mutate,
    
    // Error states
    error: studentsQuery.error,
    
    // Refetch
    refetch: studentsQuery.refetch,
  };
}

export function useSpecialEducatorStudentDetails(studentId?: string) {
  // Get student details
  const studentQuery = useQuery({
    queryKey: queryKeys.specialEducator.studentDetails(studentId!),
    queryFn: () => apiClient.getStudentDetailsForSpecialEducator(studentId!),
    enabled: !!studentId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    // Data
    student: studentQuery.data,
    
    // Loading states
    isLoading: studentQuery.isLoading,
    
    // Error states
    error: studentQuery.error,
    
    // Refetch
    refetch: studentQuery.refetch,
  };
}

export function useSpecialEducatorActivities(limit?: number) {
  // Get recent activities
  const activitiesQuery = useQuery({
    queryKey: queryKeys.specialEducator.activities(limit),
    queryFn: () => apiClient.getEducatorRecentActivities(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
  });

  return {
    // Data
    activities: activitiesQuery.data || [],
    
    // Loading states
    isLoading: activitiesQuery.isLoading,
    
    // Error states
    error: activitiesQuery.error,
    
    // Refetch
    refetch: activitiesQuery.refetch,
  };
}

export function useSpecialEducatorStatistics() {
  // Get statistics
  const statsQuery = useQuery({
    queryKey: queryKeys.specialEducator.statistics(),
    queryFn: () => apiClient.getSpecialEducatorStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    // Data
    statistics: statsQuery.data,
    
    // Loading states
    isLoading: statsQuery.isLoading,
    
    // Error states
    error: statsQuery.error,
    
    // Refetch
    refetch: statsQuery.refetch,
  };
}

export function useSpecialEducatorSchedule(params?: {
  date?: string;
  week?: string;
  month?: string;
}) {
  // Get schedule
  const scheduleQuery = useQuery({
    queryKey: queryKeys.specialEducator.schedule(),
    queryFn: () => apiClient.getSpecialEducatorSchedule(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    schedule: scheduleQuery.data || [],
    
    // Loading states
    isLoading: scheduleQuery.isLoading,
    
    // Error states
    error: scheduleQuery.error,
    
    // Refetch
    refetch: scheduleQuery.refetch,
  };
}

export function useSpecialEducatorSessionNotes(studentId?: string, params?: {
  page?: number;
  limit?: number;
  goalId?: string;
  date?: string;
}) {
  const queryClient = useQueryClient();

  // Get session notes
  const sessionNotesQuery = useQuery({
    queryKey: queryKeys.specialEducator.sessionNotes(params),
    queryFn: () => apiClient.getSpecialEducatorSessionNotes(studentId!, params),
    enabled: !!studentId,
    staleTime: 1 * 60 * 1000, // 1 minute (session notes need fresh data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create session note mutation
  const createSessionNoteMutation = useMutation({
    mutationFn: (sessionData: any) => apiClient.createEducatorSessionNote(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.specialEducator.sessionNotes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.specialEducator.activities() });
      queryClient.invalidateQueries({ queryKey: queryKeys.specialEducator.dashboard() });
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
      apiClient.createEducatorSessionNote({ ...noteData, id: noteId }),
    onSuccess: () => {
      // Invalidate specific note and lists
      if (studentId) {
        invalidationPatterns.sessionNote(studentId).forEach((queryKey: any) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      toast.success('Session note updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update session note');
    },
  });

  return {
    // Data
    sessionNotes: sessionNotesQuery.data?.data || [],
    pagination: sessionNotesQuery.data?.pagination,
    
    // Loading states
    isLoading: sessionNotesQuery.isLoading,
    isCreating: createSessionNoteMutation.isPending,
    isUpdating: updateSessionNoteMutation.isPending,
    
    // Actions
    createSessionNote: createSessionNoteMutation.mutate,
    updateSessionNote: updateSessionNoteMutation.mutate,
    
    // Error states
    error: sessionNotesQuery.error,
    
    // Refetch
    refetch: sessionNotesQuery.refetch,
  };
}
