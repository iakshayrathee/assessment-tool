import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';
import { UserRole, CenterProfile, School, SystemConfig, ExportFilters } from '@/types';

// Interface definitions for mutation data
export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  profileData: Record<string, unknown>;
}

export interface UpdateUserData {
  email?: string;
  role?: UserRole;
  profileData?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreateCenterData {
  centerName: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  [key: string]: unknown;
}

export interface UpdateCenterData {
  centerName?: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  [key: string]: unknown;
}

export interface CreateSchoolData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  centerId: string;
}

export interface UpdateSchoolData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  centerId?: string;
}

export interface UpdateSystemConfigData {
  [key: string]: unknown;
}

// Admin Dashboard Hook
export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => apiClient.getAdminDashboard(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// All Users Hook
export function useAllUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => apiClient.getAllUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserData) => apiClient.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('User created successfully!');
    },
    onError: (error: Error) => {
      toast.error((error as any).response?.data?.error || 'Failed to create user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserData }) => 
      apiClient.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User updated successfully!');
    },
    onError: (error: Error) => {
      toast.error((error as any).response?.data?.error || 'Failed to update user');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('User deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error((error as any).response?.data?.error || 'Failed to delete user');
    },
  });

  // Activate user mutation
  const activateUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User activated successfully!');
    },
    onError: (error: Error) => {
      toast.error((error as any).response?.data?.error || 'Failed to activate user');
    },
  });

  // Deactivate user mutation
  const deactivateUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User deactivated successfully!');
    },
    onError: (error: Error) => {
      toast.error((error as any).response?.data?.error || 'Failed to deactivate user');
    },
  });

  return {
    users: usersQuery.data?.data || [],
    pagination: usersQuery.data?.pagination,
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    activateUser: activateUserMutation.mutate,
    deactivateUser: deactivateUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,
    isActivating: activateUserMutation.isPending,
    isDeactivating: deactivateUserMutation.isPending,
  };
}

// All Centers Hook (Admin)
export function useAllCenters(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const queryClient = useQueryClient();

  const centersQuery = useQuery({
    queryKey: queryKeys.centers.list(params),
    queryFn: () => apiClient.getAllCenters(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create center mutation
  const createCenterMutation = useMutation({
    mutationFn: (centerData: any) => apiClient.createCenter(centerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Center created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create center');
    },
  });

  // Update center mutation
  const updateCenterMutation = useMutation({
    mutationFn: ({ centerId, centerData }: { centerId: string; centerData: any }) => 
      apiClient.updateCenter(centerId, centerData),
    onSuccess: (_, { centerId }) => {
      // Invalidate specific center and lists
      invalidationPatterns.center(centerId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Center updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update center');
    },
  });

  // Delete center mutation
  const deleteCenterMutation = useMutation({
    mutationFn: (centerId: string) => apiClient.deleteCenter(centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Center deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete center');
    },
  });

  return {
    centers: centersQuery.data?.data || [],
    pagination: centersQuery.data?.pagination,
    isLoading: centersQuery.isLoading,
    error: centersQuery.error,
    refetch: centersQuery.refetch,
    createCenter: createCenterMutation.mutate,
    updateCenter: updateCenterMutation.mutate,
    deleteCenter: deleteCenterMutation.mutate,
    isCreating: createCenterMutation.isPending,
    isUpdating: updateCenterMutation.isPending,
    isDeleting: deleteCenterMutation.isPending,
  };
}

// All Schools Hook (Admin)
export function useAllSchools(params?: {
  page?: number;
  limit?: number;
  search?: string;
  centerId?: string;
}) {
  const queryClient = useQueryClient();

  const schoolsQuery = useQuery({
    queryKey: queryKeys.schools.list(params),
    queryFn: () => apiClient.getAllSchools(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: (schoolData: any) => apiClient.createSchool(schoolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.lists() });
      toast.success('School created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create school');
    },
  });

  // Update school mutation
  const updateSchoolMutation = useMutation({
    mutationFn: ({ schoolId, schoolData }: { schoolId: string; schoolData: any }) => 
      apiClient.updateSchool(schoolId, schoolData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.lists() });
      toast.success('School updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update school');
    },
  });

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: (schoolId: string) => apiClient.deleteSchool(schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.lists() });
      toast.success('School deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete school');
    },
  });

  return {
    schools: schoolsQuery.data?.data || [],
    pagination: schoolsQuery.data?.pagination,
    isLoading: schoolsQuery.isLoading,
    error: schoolsQuery.error,
    refetch: schoolsQuery.refetch,
    createSchool: createSchoolMutation.mutate,
    updateSchool: updateSchoolMutation.mutate,
    deleteSchool: deleteSchoolMutation.mutate,
    isCreating: createSchoolMutation.isPending,
    isUpdating: updateSchoolMutation.isPending,
    isDeleting: deleteSchoolMutation.isPending,
  };
}

// Pending Approvals Hook
export function usePendingApprovals(params?: {
  page?: number;
  limit?: number;
  type?: string;
}) {
  const queryClient = useQueryClient();

  const approvalsQuery = useQuery({
    queryKey: queryKeys.admin.approvals(params),
    queryFn: () => apiClient.getPendingApprovals(params),
    staleTime: 1 * 60 * 1000, // 1 minute (approvals need fresh data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: ({ requestId, comments }: { requestId: string; comments?: string }) => 
      apiClient.approveRequest(requestId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approvals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Request approved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve request');
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) => 
      apiClient.rejectRequest(requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.approvals() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard() });
      toast.success('Request rejected successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject request');
    },
  });

  return {
    approvals: approvalsQuery.data?.data || [],
    pagination: approvalsQuery.data?.pagination,
    isLoading: approvalsQuery.isLoading,
    error: approvalsQuery.error,
    refetch: approvalsQuery.refetch,
    approveRequest: approveRequestMutation.mutate,
    rejectRequest: rejectRequestMutation.mutate,
    isApproving: approveRequestMutation.isPending,
    isRejecting: rejectRequestMutation.isPending,
  };
}

// System Analytics Hook
export function useSystemAnalytics(params?: { period?: string; metrics?: string[] }) {
  return useQuery({
    queryKey: queryKeys.admin.analytics(params?.period),
    queryFn: () => apiClient.getSystemAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Audit Logs Hook
export function useAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs(params),
    queryFn: () => apiClient.getAuditLogs(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// All Reports Hook (Admin)
export function useAllReports(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  centerId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.reports.list(params),
    queryFn: () => apiClient.getAllReportsAsAdmin(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// All Students Hook (Admin)
export function useAllStudentsAsAdmin(params?: {
  page?: number;
  limit?: number;
  search?: string;
  centerId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.students.list({ ...params, admin: true }),
    queryFn: () => apiClient.getAllStudentsAsAdmin(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Student Details Hook (Admin)
export function useStudentDetailsAsAdmin(studentId: string) {
  return useQuery({
    queryKey: queryKeys.students.detail(studentId),
    queryFn: () => apiClient.getStudentDetailsAsAdmin(studentId),
    enabled: !!studentId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// System Config Hook
export function useSystemConfig() {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: queryKeys.admin.systemConfig(),
    queryFn: () => apiClient.getSystemConfig(),
    staleTime: 10 * 60 * 1000, // 10 minutes (config changes rarely)
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Update system config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (configData: any) => apiClient.updateSystemConfig(configData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.systemConfig() });
      toast.success('System configuration updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update system configuration');
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    error: configQuery.error,
    refetch: configQuery.refetch,
    updateConfig: updateConfigMutation.mutate,
    isUpdating: updateConfigMutation.isPending,
  };
}

// Educator Assignment Mutations
export function useEducatorAssignments() {
  const queryClient = useQueryClient();

  // Assign educator to center mutation
  const assignEducatorToCenterMutation = useMutation({
    mutationFn: (assignmentData: {
      centerId: string;
      educatorId: string;
      educatorType: string;
    }) => apiClient.assignEducatorToCenter(assignmentData.centerId, assignmentData.educatorId, assignmentData.educatorType),
    onSuccess: (_, { centerId }) => {
      // Invalidate center-related queries
      invalidationPatterns.center(centerId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('Educator assigned to center successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign educator to center');
    },
  });

  // Remove educator from center mutation
  const removeEducatorFromCenterMutation = useMutation({
    mutationFn: (data: { centerId: string; assignmentId: string }) => apiClient.removeEducatorFromCenter(data.centerId, data.assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.centers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('Educator removed from center successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove educator from center');
    },
  });

  // Assign student to educator mutation
  const assignStudentToEducatorMutation = useMutation({
    mutationFn: (assignmentData: {
      studentId: string;
      specialEducatorId: string;
    }) => apiClient.assignStudentToEducator(assignmentData.studentId, assignmentData.specialEducatorId),
    onSuccess: (_, { studentId }) => {
      // Invalidate student-related queries
      invalidationPatterns.student(studentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Student assigned to educator successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign student to educator');
    },
  });

  return {
    assignEducatorToCenter: assignEducatorToCenterMutation.mutate,
    removeEducatorFromCenter: removeEducatorFromCenterMutation.mutate,
    assignStudentToEducator: assignStudentToEducatorMutation.mutate,
    isAssigningEducator: assignEducatorToCenterMutation.isPending,
    isRemovingEducator: removeEducatorFromCenterMutation.isPending,
    isAssigningStudent: assignStudentToEducatorMutation.isPending,
  };
}

// Export Data Hook
export function useExportData() {
  const exportDataMutation = useMutation({
    mutationFn: (exportData: {
      type: string;
      format: string;
      filters?: any;
    }) => apiClient.exportData(exportData),
    onSuccess: () => {
      toast.success('Data export initiated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export data');
    },
  });

  return {
    exportData: exportDataMutation.mutate,
    isExporting: exportDataMutation.isPending,
  };
}