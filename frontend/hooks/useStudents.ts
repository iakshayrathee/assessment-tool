import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';

export function useStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  centerId?: string;
  schoolId?: string;
}) {
  const queryClient = useQueryClient();

  // Get students query
  const studentsQuery = useQuery({
    queryKey: ['students', params],
    queryFn: () => apiClient.getStudents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get student stats query
  const statsQuery = useQuery({
    queryKey: ['students', 'stats', params?.centerId, params?.schoolId],
    queryFn: () => apiClient.getStudentStats(params?.centerId, params?.schoolId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => apiClient.createStudent(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create student');
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      toast.success('Student updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update student');
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete student');
    },
  });

  // Assign student to educator mutation
  const assignStudentMutation = useMutation({
    mutationFn: ({ studentId, educatorId }: { studentId: string; educatorId: string }) =>
      apiClient.assignStudentToEducator(studentId, educatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
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
    stats: statsQuery.data,
    
    // Loading states
    isLoading: studentsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    
    // Actions
    createStudent: createStudentMutation.mutate,
    updateStudent: updateStudentMutation.mutate,
    deleteStudent: deleteStudentMutation.mutate,
    assignStudent: assignStudentMutation.mutate,
    
    // Mutation objects (for advanced usage)
    createStudentMutation,
    updateStudentMutation,
    deleteStudentMutation,
    assignStudentMutation,
    
    // Action loading states
    isCreating: createStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending,
    isAssigning: assignStudentMutation.isPending,
    
    // Refetch
    refetch: studentsQuery.refetch,
    refetchStats: statsQuery.refetch,
  };
}

export function useStudent(id: string) {
  const queryClient = useQueryClient();

  // Get single student query
  const studentQuery = useQuery({
    queryKey: ['student', id],
    queryFn: () => apiClient.getStudent(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  // Get student dashboard query
  const dashboardQuery = useQuery({
    queryKey: ['student', id, 'dashboard'],
    queryFn: () => apiClient.getStudentDashboard(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Get student progress query
  const progressQuery = useQuery({
    queryKey: ['student', id, 'progress'],
    queryFn: () => apiClient.getStudentProgress(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    // Data
    student: studentQuery.data,
    dashboard: dashboardQuery.data,
    progress: progressQuery.data,
    
    // Loading states
    isLoading: studentQuery.isLoading,
    isLoadingDashboard: dashboardQuery.isLoading,
    isLoadingProgress: progressQuery.isLoading,
    
    // Error states
    error: studentQuery.error,
    
    // Refetch
    refetch: studentQuery.refetch,
    refetchDashboard: dashboardQuery.refetch,
    refetchProgress: progressQuery.refetch,
  };
}
