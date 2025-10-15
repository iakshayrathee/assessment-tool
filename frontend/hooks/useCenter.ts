import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';

// Center Dashboard Hook
export function useCenterDashboard(centerId?: string) {
  return useQuery({
    queryKey: ['center', 'dashboard', centerId],
    queryFn: () => apiClient.getCenterDashboard(centerId),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Center Students Hook
export function useCenterStudents(centerId?: string, params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  schoolId?: string;
  hasAssignment?: boolean;
}) {
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: ['center', 'students', centerId, params],
    queryFn: () => apiClient.getCenterStudents(centerId!, params),
    enabled: !!centerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Assign student mutation
  const assignStudentMutation = useMutation({
    mutationFn: ({ studentId, educatorId }: { studentId: string; educatorId: string }) =>
      apiClient.assignStudentToEducator(studentId, educatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['center', 'dashboard'] });
      toast.success('Student assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign student');
    },
  });

  return {
    students: studentsQuery.data?.data || [],
    pagination: studentsQuery.data?.pagination,
    isLoading: studentsQuery.isLoading,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
    assignStudent: assignStudentMutation.mutate,
    isAssigning: assignStudentMutation.isPending,
  };
}

// Center Educators Hook
export function useCenterEducators(centerId?: string) {
  const queryClient = useQueryClient();

  const educatorsQuery = useQuery({
    queryKey: ['center', 'educators', centerId],
    queryFn: () => apiClient.getCenterEducators(centerId!),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Remove educator mutation
  const removeEducatorMutation = useMutation({
    mutationFn: (assignmentId: string) => 
      apiClient.removeEducatorFromCenter(centerId!, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center', 'educators'] });
      queryClient.invalidateQueries({ queryKey: ['center', 'dashboard'] });
      toast.success('Educator removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove educator');
    },
  });

  return {
    educators: educatorsQuery.data || [],
    isLoading: educatorsQuery.isLoading,
    error: educatorsQuery.error,
    refetch: educatorsQuery.refetch,
    removeEducator: removeEducatorMutation.mutate,
    isRemoving: removeEducatorMutation.isPending,
  };
}

// Center Schools Hook
export function useCenterSchools(centerId?: string) {
  const queryClient = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: ['center', 'schools', centerId],
    queryFn: () => apiClient.getCenterSchools(centerId!),
    enabled: !!centerId,
    staleTime: 10 * 60 * 1000, // 10 minutes (schools change less frequently)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Link school mutation
  const linkSchoolMutation = useMutation({
    mutationFn: (schoolData: any) => 
      apiClient.linkSchoolToCenter(centerId!, schoolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center', 'schools'] });
      queryClient.invalidateQueries({ queryKey: ['center', 'dashboard'] });
      toast.success('School linked successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to link school');
    },
  });

  return {
    schools: schoolsQuery.data || [],
    isLoading: schoolsQuery.isLoading,
    error: schoolsQuery.error,
    refetch: schoolsQuery.refetch,
    linkSchool: linkSchoolMutation.mutate,
    isLinking: linkSchoolMutation.isPending,
  };
}

// Center Reports Hook
export function useCenterReports(centerId?: string, params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['center', 'reports', centerId, params],
    queryFn: () => apiClient.getCenterReports(centerId!, params),
    enabled: !!centerId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Center Compliance Hook
export function useCenterCompliance(centerId?: string) {
  const complianceQuery = useQuery({
    queryKey: ['center', 'compliance', centerId],
    queryFn: () => apiClient.getCenterCompliance(centerId!),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const overdueReportsQuery = useQuery({
    queryKey: ['center', 'overdue-reports', centerId],
    queryFn: () => apiClient.getCenterOverdueReports(centerId!, { page: 1, limit: 10 }),
    enabled: !!centerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    compliance: complianceQuery.data,
    overdueReports: overdueReportsQuery.data?.data || [],
    isLoading: complianceQuery.isLoading || overdueReportsQuery.isLoading,
    error: complianceQuery.error || overdueReportsQuery.error,
    refetch: () => {
      complianceQuery.refetch();
      overdueReportsQuery.refetch();
    },
  };
}
