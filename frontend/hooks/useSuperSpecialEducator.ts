'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';
import { toast } from 'react-hot-toast';

// Dashboard
export function useSuperSpecialEducatorDashboard() {
  return useQuery({
    queryKey: queryKeys.superSpecialEducator.dashboard(),
    queryFn: () => apiClient.getSuperSpecialEducatorDashboard(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Profile Management
export function useSuperSpecialEducatorProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.profile(),
    queryFn: () => apiClient.getSuperSpecialEducatorProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateSuperSpecialEducatorProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.profile() });
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
    isUpdating: updateProfileMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
  };
}

// Special Educator Management
export function useSuperSpecialEducatorSpecialEducators(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  centerId?: string;
}) {
  const queryClient = useQueryClient();

  const specialEducatorsQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.specialEducators(),
    queryFn: () => apiClient.getSuperSpecialEducatorSpecialEducators(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const createSpecialEducatorMutation = useMutation({
    mutationFn: (educatorData: any) => apiClient.createUser({ ...educatorData, role: 'SPECIAL_EDUCATOR' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.specialEducators() });
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.dashboard() });
      toast.success('Special educator created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create special educator');
    },
  });

  const updateSpecialEducatorMutation = useMutation({
    mutationFn: ({ educatorId, educatorData }: { educatorId: string; educatorData: any }) =>
      apiClient.updateSpecialEducatorProfile(educatorData),
    onSuccess: (_, { educatorId }) => {
      invalidationPatterns.user().forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Special educator updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update special educator');
    },
  });

  const deleteSpecialEducatorMutation = useMutation({
    mutationFn: (educatorId: string) => apiClient.deleteSpecialEducator(educatorId),
    onSuccess: (_, educatorId) => {
      invalidationPatterns.user().forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Special educator deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete special educator');
    },
  });

  return {
    specialEducators: specialEducatorsQuery.data?.data || [],
    pagination: specialEducatorsQuery.data?.pagination,
    isLoading: specialEducatorsQuery.isLoading,
    isCreating: createSpecialEducatorMutation.isPending,
    isUpdating: updateSpecialEducatorMutation.isPending,
    isDeleting: deleteSpecialEducatorMutation.isPending,
    createSpecialEducator: createSpecialEducatorMutation.mutate,
    updateSpecialEducator: updateSpecialEducatorMutation.mutate,
    deleteSpecialEducator: deleteSpecialEducatorMutation.mutate,
    error: specialEducatorsQuery.error,
    refetch: specialEducatorsQuery.refetch,
  };
}

// Center Management
export function useSuperSpecialEducatorCenters(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const centersQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.centers(params),
    queryFn: () => apiClient.getSuperSpecialEducatorCenters(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createCenterMutation = useMutation({
    mutationFn: (centerData: any) => apiClient.createCenter(centerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.centers() });
      queryClient.invalidateQueries({ queryKey: queryKeys.centers.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.dashboard() });
      toast.success('Center created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create center');
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: ({ centerId, centerData }: { centerId: string; centerData: any }) =>
      apiClient.updateCenter(centerId, centerData),
    onSuccess: (_, { centerId }) => {
      invalidationPatterns.center(centerId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Center updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update center');
    },
  });

  return {
    centers: centersQuery.data?.data || [],
    pagination: centersQuery.data?.pagination,
    isLoading: centersQuery.isLoading,
    isCreating: createCenterMutation.isPending,
    isUpdating: updateCenterMutation.isPending,
    createCenter: createCenterMutation.mutate,
    updateCenter: updateCenterMutation.mutate,
    error: centersQuery.error,
    refetch: centersQuery.refetch,
  };
}

// Student Management
export function useSuperSpecialEducatorStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  centerId?: string;
  educatorId?: string;
}) {
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.students(params),
    queryFn: () => apiClient.getSuperSpecialEducatorStudents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const transferStudentMutation = useMutation({
    mutationFn: (transferData: {
      studentId: string;
      fromEducatorId: string;
      toEducatorId: string;
      reason?: string;
    }) => apiClient.assignStudentToEducator(transferData.studentId, transferData.toEducatorId),
    onSuccess: (_, { studentId }) => {
      invalidationPatterns.student(studentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.dashboard() });
      toast.success('Student transferred successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to transfer student');
    },
  });

  return {
    students: studentsQuery.data?.data || [],
    pagination: studentsQuery.data?.pagination,
    isLoading: studentsQuery.isLoading,
    isTransferring: transferStudentMutation.isPending,
    transferStudent: transferStudentMutation.mutate,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
  };
}

// Assessment Management
export function useSuperSpecialEducatorAssessments(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  studentId?: string;
  educatorId?: string;
  centerId?: string;
}) {
  const queryClient = useQueryClient();

  const assessmentsQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.assessments(params),
    queryFn: () => apiClient.getAssessmentStats(params?.centerId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const reviewAssessmentMutation = useMutation({
    mutationFn: ({ assessmentId, reviewData }: { assessmentId: string; reviewData: any }) =>
      apiClient.updateAssessment(assessmentId, reviewData),
    onSuccess: (_, { assessmentId }) => {
      invalidationPatterns.assessment(assessmentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Assessment reviewed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to review assessment');
    },
  });

  const approveAssessmentMutation = useMutation({
    mutationFn: (assessmentId: string) => apiClient.updateAssessment(assessmentId, { status: 'APPROVED' }),
    onSuccess: (_, assessmentId) => {
      invalidationPatterns.assessment(assessmentId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Assessment approved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve assessment');
    },
  });

  return {
    assessments: assessmentsQuery.data?.data || [],
    pagination: assessmentsQuery.data?.pagination,
    isLoading: assessmentsQuery.isLoading,
    isReviewing: reviewAssessmentMutation.isPending,
    isApproving: approveAssessmentMutation.isPending,
    reviewAssessment: reviewAssessmentMutation.mutate,
    approveAssessment: approveAssessmentMutation.mutate,
    error: assessmentsQuery.error,
    refetch: assessmentsQuery.refetch,
  };
}

// Reports Management
export function useSuperSpecialEducatorReports(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  centerId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.reports(params),
    queryFn: () => apiClient.getAllReportsAsAdmin(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const generateReportMutation = useMutation({
    mutationFn: (reportData: any) => apiClient.createReport(reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.reports() });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.lists() });
      toast.success('Report generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to generate report');
    },
  });

  return {
    reports: reportsQuery.data?.data || [],
    pagination: reportsQuery.data?.pagination,
    isLoading: reportsQuery.isLoading,
    isGenerating: generateReportMutation.isPending,
    generateReport: generateReportMutation.mutate,
    error: reportsQuery.error,
    refetch: reportsQuery.refetch,
  };
}

// Analytics
export function useSuperSpecialEducatorAnalytics(params?: {
  period?: string;
  centerId?: string;
  educatorId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.superSpecialEducator.analytics(params),
    queryFn: () => apiClient.getSuperSpecialEducatorAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// System Configuration
export function useSuperSpecialEducatorSystemConfig() {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.systemConfig(),
    queryFn: () => apiClient.getSystemConfig(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const updateConfigMutation = useMutation({
    mutationFn: (configData: any) => apiClient.updateSystemConfig(configData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.systemConfig() });
      toast.success('System configuration updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update system configuration');
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    isUpdating: updateConfigMutation.isPending,
    updateConfig: updateConfigMutation.mutate,
    error: configQuery.error,
    refetch: configQuery.refetch,
  };
}

// Audit Logs
export function useSuperSpecialEducatorAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: queryKeys.superSpecialEducator.auditLogs(params),
    queryFn: () => apiClient.getSuperSpecialEducatorAuditLogs(params),
    staleTime: 1 * 60 * 1000, // 1 minute (audit logs need fresh data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Notifications
export function useSuperSpecialEducatorNotifications(params?: {
  page?: number;
  limit?: number;
  type?: string;
  read?: boolean;
}) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.superSpecialEducator.notifications(params),
    queryFn: () => apiClient.getSuperSpecialEducatorNotifications(params),
    staleTime: 30 * 1000, // 30 seconds (notifications need fresh data)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.notifications() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superSpecialEducator.notifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.notifications() });
      toast.success('All notifications marked as read!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark all notifications as read');
    },
  });

  return {
    notifications: notificationsQuery.data?.data || [],
    pagination: notificationsQuery.data?.pagination,
    isLoading: notificationsQuery.isLoading,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
  };
}