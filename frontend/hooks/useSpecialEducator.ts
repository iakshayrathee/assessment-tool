import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';

export function useCheckSpecialEducatorToken() {
  // Check token
  const tokenQuery = useQuery({
    queryKey: ['specialEducator', 'token'],
    queryFn: () => apiClient.checkSpecialEducatorToken(),
    staleTime: 1 * 60 * 1000, // 1 minute
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
    queryKey: ['specialEducator', 'dashboard'],
    queryFn: () => apiClient.getSpecialEducatorDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
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
    queryKey: ['specialEducator', 'profile'],
    queryFn: () => apiClient.getSpecialEducatorProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateSpecialEducatorProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialEducator', 'profile'] });
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

export function useEducatorStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  // Get assigned students
  const studentsQuery = useQuery({
    queryKey: ['specialEducator', 'students', params],
    queryFn: () => apiClient.getAssignedStudents(params),
    staleTime: 2 * 60 * 1000,
  });

  return {
    // Data
    students: studentsQuery.data?.data || [],
    pagination: studentsQuery.data?.pagination,
    
    // Loading states
    isLoading: studentsQuery.isLoading,
    
    // Error states
    error: studentsQuery.error,
    
    // Refetch
    refetch: studentsQuery.refetch,
  };
}

export function useEducatorStudentDetails(studentId?: string) {
  // Get student details
  const studentQuery = useQuery({
    queryKey: ['specialEducator', 'student', studentId],
    queryFn: () => apiClient.getStudentDetailsForEducator(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
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

export function useEducatorActivities(limit?: number) {
  // Get recent activities
  const activitiesQuery = useQuery({
    queryKey: ['specialEducator', 'activities', limit],
    queryFn: () => apiClient.getEducatorRecentActivities(limit),
    staleTime: 1 * 60 * 1000, // 1 minute
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

export function useEducatorStatistics() {
  // Get statistics
  const statsQuery = useQuery({
    queryKey: ['specialEducator', 'statistics'],
    queryFn: () => apiClient.getEducatorStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
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

export function useTodaysSchedule() {
  // Get today's schedule
  const scheduleQuery = useQuery({
    queryKey: ['specialEducator', 'schedule', 'today'],
    queryFn: () => apiClient.getTodaysSchedule(),
    staleTime: 10 * 60 * 1000, // 10 minutes
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

export function useEducatorSessionNotes(studentId?: string, params?: {
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  // Get session notes
  const sessionNotesQuery = useQuery({
    queryKey: ['specialEducator', 'sessionNotes', studentId, params],
    queryFn: () => apiClient.getEducatorSessionNotes(studentId!, params),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Create session note mutation
  const createSessionNoteMutation = useMutation({
    mutationFn: (sessionData: any) => apiClient.createEducatorSessionNote(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialEducator', 'sessionNotes'] });
      queryClient.invalidateQueries({ queryKey: ['specialEducator', 'activities'] });
      queryClient.invalidateQueries({ queryKey: ['specialEducator', 'dashboard'] });
      toast.success('Session note created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create session note');
    },
  });

  return {
    // Data
    sessionNotes: sessionNotesQuery.data?.data || [],
    pagination: sessionNotesQuery.data?.pagination,
    
    // Loading states
    isLoading: sessionNotesQuery.isLoading,
    isCreating: createSessionNoteMutation.isPending,
    
    // Actions
    createSessionNote: createSessionNoteMutation.mutate,
    
    // Error states
    error: sessionNotesQuery.error,
    
    // Refetch
    refetch: sessionNotesQuery.refetch,
  };
}
