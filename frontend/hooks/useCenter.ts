'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';

// Center Dashboard Hook
export function useCenterDashboard(centerId?: string) {
  return useQuery({
    queryKey: queryKeys.centers.dashboard(centerId),
    queryFn: () => apiClient.getCenterDashboard(centerId),
    enabled: !!centerId,
    staleTime: 3 * 60 * 1000, // 3 minutes
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
    queryKey: queryKeys.centers.students(centerId, params),
    queryFn: () => apiClient.getCenterStudents(centerId!, params),
    enabled: !!centerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Assign student to educator
  const assignStudentMutation = useMutation({
    mutationFn: ({ studentId, educatorId }: { studentId: string; educatorId: string }) =>
      apiClient.assignStudentToEducator(studentId, educatorId),
    onSuccess: (_, { studentId, educatorId }) => {
      // Use invalidation patterns for comprehensive cache updates
      invalidationPatterns.student(studentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      invalidationPatterns.user().forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      if (centerId) {
        invalidationPatterns.center(centerId).forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      toast.success('Student assigned to educator successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign student');
    },
  });

  // Remove student from educator
  const removeStudentMutation = useMutation({
    mutationFn: ({ studentId, educatorId }: { studentId: string; educatorId: string }) =>
      apiClient.unassignStudentFromEducator(studentId, educatorId),
    onSuccess: (_, { studentId, educatorId }) => {
      // Use invalidation patterns for comprehensive cache updates
      invalidationPatterns.student(studentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      invalidationPatterns.user().forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      if (centerId) {
        invalidationPatterns.center(centerId).forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      toast.success('Student removed from educator successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove student');
    },
  });

  return {
    // Data
    students: studentsQuery.data?.data || [],
    pagination: studentsQuery.data?.pagination,
    
    // Loading states
    isLoading: studentsQuery.isLoading,
    isAssigning: assignStudentMutation.isPending,
    isRemoving: removeStudentMutation.isPending,
    
    // Actions
    assignStudent: assignStudentMutation.mutate,
    removeStudent: removeStudentMutation.mutate,
    
    // Error states
    error: studentsQuery.error,
    
    // Refetch
    refetch: studentsQuery.refetch,
  };
}

// Center Educators Hook
export function useCenterEducators(centerId?: string, params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const queryClient = useQueryClient();

  const educatorsQuery = useQuery({
    queryKey: queryKeys.centers.educators(centerId, params),
    queryFn: () => apiClient.getCenterEducators(centerId!, params),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Remove educator mutation
  const removeEducatorMutation = useMutation({
    mutationFn: (assignmentId: string) => 
      apiClient.removeEducatorFromCenter(centerId!, assignmentId),
    onSuccess: () => {
      if (centerId) {
        invalidationPatterns.center(centerId).forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove educator');
    },
  });

  // Assign educator mutation
  const assignEducatorMutation = useMutation({
    mutationFn: ({ educatorId, role }: { educatorId: string; role: string }) => 
      apiClient.assignEducator(centerId!, educatorId, role),
    onSuccess: () => {
      if (centerId) {
        invalidationPatterns.center(centerId).forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      toast.success('Educator assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign educator');
    },
  });

  return {
    educators: educatorsQuery.data?.data || [],
    pagination: educatorsQuery.data?.pagination,
    isLoading: educatorsQuery.isLoading,
    error: educatorsQuery.error,
    refetch: educatorsQuery.refetch,
    removeEducator: removeEducatorMutation.mutate,
    isRemoving: removeEducatorMutation.isPending,
    assignEducator: assignEducatorMutation.mutate,
    isAssigning: assignEducatorMutation.isPending,
  };
}

// Center Schools Hook
export function useCenterSchools(centerId?: string) {
  const queryClient = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: queryKeys.centers.schools(centerId),
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
      if (centerId) {
        invalidationPatterns.center(centerId).forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
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
    queryKey: queryKeys.centers.reports(centerId, params),
    queryFn: () => apiClient.getCenterReports(centerId!, params),
    enabled: !!centerId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Center Compliance Hook
export function useCenterCompliance(centerId?: string) {
  const complianceQuery = useQuery({
    queryKey: queryKeys.centers.compliance(centerId),
    queryFn: () => apiClient.getCenterCompliance(centerId!),
    enabled: !!centerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const overdueReportsQuery = useQuery({
    queryKey: queryKeys.centers.overdueReports(centerId),
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
