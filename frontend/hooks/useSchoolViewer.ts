import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export function useSchoolViewer() {
  const queryClient = useQueryClient();

  // Get School Viewer profile
  const profileQuery = useQuery({
    queryKey: ['school-viewer', 'profile'],
    queryFn: () => apiClient.getSchoolViewerProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get dashboard data
  const dashboardQuery = useQuery({
    queryKey: ['school-viewer', 'dashboard'],
    queryFn: () => apiClient.getSchoolViewerDashboard(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    // Data
    profile: profileQuery.data,
    dashboard: dashboardQuery.data,
    
    // Loading states
    isLoadingProfile: profileQuery.isLoading,
    isLoadingDashboard: dashboardQuery.isLoading,
    
    // Error states
    profileError: profileQuery.error,
    dashboardError: dashboardQuery.error,
    
    // Refetch functions
    refetchProfile: profileQuery.refetch,
    refetchDashboard: dashboardQuery.refetch,
  };
}

export function useSchoolViewerStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  grade?: string;
}) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    grade
  } = params || {};

  const studentsQuery = useQuery({
    queryKey: ['school-viewer', 'students', { page, limit, search, status, grade }],
    queryFn: () => apiClient.getSchoolViewerStudents({ page, limit, search, status, grade }),
    staleTime: 2 * 60 * 1000, // 2 minutes
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

export function useSchoolViewerStudent(studentId: string) {
  const studentQuery = useQuery({
    queryKey: ['school-viewer', 'students', studentId],
    queryFn: () => apiClient.getSchoolViewerStudent(studentId),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

export function useSchoolViewerReports(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  studentId?: string;
}) {
  const {
    page = 1,
    limit = 10,
    type,
    status,
    studentId
  } = params || {};

  const reportsQuery = useQuery({
    queryKey: ['school-viewer', 'reports', { page, limit, type, status, studentId }],
    queryFn: () => apiClient.getSchoolViewerReports({ page, limit, type, status, studentId }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    // Data
    reports: reportsQuery.data?.data || [],
    pagination: reportsQuery.data?.pagination,
    
    // Loading states
    isLoading: reportsQuery.isLoading,
    
    // Error states
    error: reportsQuery.error,
    
    // Refetch
    refetch: reportsQuery.refetch,
  };
}

export function useSchoolViewerReport(reportId: string) {
  const reportQuery = useQuery({
    queryKey: ['school-viewer', 'reports', reportId],
    queryFn: () => apiClient.getSchoolViewerReport(reportId),
    enabled: !!reportId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // Data
    report: reportQuery.data,
    
    // Loading states
    isLoading: reportQuery.isLoading,
    
    // Error states
    error: reportQuery.error,
    
    // Refetch
    refetch: reportQuery.refetch,
  };
}

export function useSchoolViewerActivity(params?: {
  page?: number;
  limit?: number;
}) {
  const {
    page = 1,
    limit = 20
  } = params || {};

  const activityQuery = useQuery({
    queryKey: ['school-viewer', 'activity', { page, limit }],
    queryFn: () => apiClient.getSchoolViewerActivity({ page, limit }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  return {
    // Data
    activities: activityQuery.data?.data || [],
    pagination: activityQuery.data?.pagination,
    
    // Loading states
    isLoading: activityQuery.isLoading,
    
    // Error states
    error: activityQuery.error,
    
    // Refetch
    refetch: activityQuery.refetch,
  };
}
