import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { apiClient } from '@/lib/api';
import { queryKeys, invalidationPatterns } from '@/lib/queryKeys';

// Parent Dashboard Hook
export function useParentDashboard() {
  return useQuery({
    queryKey: queryKeys.parent.dashboard(),
    queryFn: () => apiClient.getParentDashboard(),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Parent Children Hook
export function useParentChildren(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const queryClient = useQueryClient();

  const childrenQuery = useQuery({
    queryKey: queryKeys.parent.children(params),
    queryFn: () => apiClient.getParentChildren(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: (childData: any) => apiClient.addChild(childData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.children() });
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.dashboard() });
      toast.success('Child added successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add child');
    },
  });

  // Update child mutation
  const updateChildMutation = useMutation({
    mutationFn: ({ childId, childData }: { childId: string; childData: any }) => 
      apiClient.updateChild(childId, childData),
    onSuccess: (_, { childId }) => {
      // Invalidate specific child and lists
      invalidationPatterns.student(childId).forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      toast.success('Child information updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update child information');
    },
  });

  // Remove child mutation
  const removeChildMutation = useMutation({
    mutationFn: (childId: string) => apiClient.removeChild(childId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.children() });
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.dashboard() });
      toast.success('Child removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove child');
    },
  });

  return {
    children: childrenQuery.data?.data || [],
    pagination: childrenQuery.data?.pagination,
    isLoading: childrenQuery.isLoading,
    error: childrenQuery.error,
    refetch: childrenQuery.refetch,
    addChild: addChildMutation.mutate,
    updateChild: updateChildMutation.mutate,
    removeChild: removeChildMutation.mutate,
    isAdding: addChildMutation.isPending,
    isUpdating: updateChildMutation.isPending,
    isRemoving: removeChildMutation.isPending,
  };
}

// Child Details Hook
export function useChildDetails(childId: string) {
  return useQuery({
    queryKey: queryKeys.parent.childDetails(childId),
    queryFn: () => apiClient.getChildDetails(childId),
    enabled: !!childId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Child Progress Hook
export function useChildProgress(childId: string, params?: {
  period?: string;
  goalId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.parent.childProgress(childId, params),
    queryFn: () => apiClient.getChildProgress(childId, params),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Child Assessments Hook
export function useChildAssessments(childId: string, params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.parent.childAssessments(childId, params),
    queryFn: () => apiClient.getChildAssessments(childId, params),
    enabled: !!childId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Child IEP Goals Hook
export function useChildIEPGoals(childId: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.parent.childIEPGoals(childId, params),
    queryFn: () => apiClient.getChildIEPGoals(childId, params),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Child Session Notes Hook
export function useChildSessionNotes(childId: string, params?: {
  page?: number;
  limit?: number;
  goalId?: string;
  date?: string;
}) {
  return useQuery({
    queryKey: queryKeys.parent.childSessionNotes(childId, params),
    queryFn: () => apiClient.getChildSessionNotes(childId, params),
    enabled: !!childId,
    staleTime: 1 * 60 * 1000, // 1 minute (session notes need fresh data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Child Reports Hook
export function useChildReports(childId: string, params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.parent.childReports(childId, params),
    queryFn: () => apiClient.getChildReports(childId, params),
    enabled: !!childId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Child Schedule Hook
export function useChildSchedule(childId: string, params?: {
  date?: string;
  week?: string;
  month?: string;
}) {
  return useQuery({
    queryKey: queryKeys.parent.childSchedule(childId, params),
    queryFn: () => apiClient.getChildSchedule(childId, params),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Parent Communications Hook
export function useParentCommunications(params?: {
  page?: number;
  limit?: number;
  childId?: string;
  type?: string;
  read?: boolean;
}) {
  const queryClient = useQueryClient();

  const communicationsQuery = useQuery({
    queryKey: queryKeys.parent.communications(params),
    queryFn: () => apiClient.getParentCommunications(params),
    staleTime: 30 * 1000, // 30 seconds (communications need fresh data)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => apiClient.sendParentMessage(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.communications() });
      toast.success('Message sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send message');
    },
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => apiClient.markParentMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.communications() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark message as read');
    },
  });

  // Reply to message mutation
  const replyToMessageMutation = useMutation({
    mutationFn: ({ messageId, replyData }: { messageId: string; replyData: any }) => 
      apiClient.replyToParentMessage(messageId, replyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.communications() });
      toast.success('Reply sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send reply');
    },
  });

  return {
    communications: communicationsQuery.data?.data || [],
    pagination: communicationsQuery.data?.pagination,
    unreadCount: communicationsQuery.data?.unreadCount || 0,
    isLoading: communicationsQuery.isLoading,
    error: communicationsQuery.error,
    refetch: communicationsQuery.refetch,
    sendMessage: sendMessageMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    replyToMessage: replyToMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isReplying: replyToMessageMutation.isPending,
  };
}

// Parent Appointments Hook
export function useParentAppointments(params?: {
  page?: number;
  limit?: number;
  childId?: string;
  status?: string;
  date?: string;
}) {
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.parent.appointments(params),
    queryFn: () => apiClient.getParentAppointments(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Request appointment mutation
  const requestAppointmentMutation = useMutation({
    mutationFn: (appointmentData: any) => apiClient.requestAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.appointments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.dashboard() });
      toast.success('Appointment requested successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to request appointment');
    },
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: string; reason?: string }) => 
      apiClient.cancelAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.appointments() });
      toast.success('Appointment cancelled successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel appointment');
    },
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, newDateTime }: { appointmentId: string; newDateTime: string }) => 
      apiClient.rescheduleAppointment(appointmentId, newDateTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.appointments() });
      toast.success('Appointment rescheduled successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reschedule appointment');
    },
  });

  return {
    appointments: appointmentsQuery.data?.data || [],
    pagination: appointmentsQuery.data?.pagination,
    isLoading: appointmentsQuery.isLoading,
    error: appointmentsQuery.error,
    refetch: appointmentsQuery.refetch,
    requestAppointment: requestAppointmentMutation.mutate,
    cancelAppointment: cancelAppointmentMutation.mutate,
    rescheduleAppointment: rescheduleAppointmentMutation.mutate,
    isRequesting: requestAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending,
    isRescheduling: rescheduleAppointmentMutation.isPending,
  };
}

// Parent Profile Hook
export function useParentProfile() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: queryKeys.parent.profile(),
    queryFn: () => apiClient.getParentProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: any) => apiClient.updateParentProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.profile() });
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

// Parent Notifications Hook
export function useParentNotifications(params?: {
  page?: number;
  limit?: number;
  read?: boolean;
  type?: string;
}) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.parent.notifications(params),
    queryFn: () => apiClient.getParentNotifications(params),
    staleTime: 30 * 1000, // 30 seconds (notifications need fresh data)
    gcTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => apiClient.markParentNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.notifications() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark notification as read');
    },
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.markAllParentNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.notifications() });
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

// Parent Documents Hook
export function useParentDocuments(params?: {
  page?: number;
  limit?: number;
  childId?: string;
  type?: string;
}) {
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: queryKeys.parent.documents(params),
    queryFn: () => apiClient.getParentDocuments(params),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: ({ file, category, description }: { file: File; category: string; description?: string }) => 
      apiClient.uploadParentDocument(file, category, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.documents() });
      toast.success('Document uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload document');
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => apiClient.deleteParentDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.documents() });
      toast.success('Document deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    },
  });

  return {
    documents: documentsQuery.data?.data || [],
    pagination: documentsQuery.data?.pagination,
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    refetch: documentsQuery.refetch,
    uploadDocument: uploadDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    isUploading: uploadDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
}

// Parent Consent Forms Hook
export function useParentConsentForms(params?: {
  page?: number;
  limit?: number;
  childId?: string;
  status?: string;
}) {
  const queryClient = useQueryClient();

  const consentFormsQuery = useQuery({
    queryKey: queryKeys.parent.consentForms(params),
    queryFn: () => apiClient.getParentConsentForms(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Submit consent form mutation
  const submitConsentFormMutation = useMutation({
    mutationFn: ({ formId, formData }: { formId: string; formData: any }) => 
      apiClient.submitParentConsentForm(formId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.consentForms() });
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.dashboard() });
      toast.success('Consent form submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit consent form');
    },
  });

  return {
    consentForms: consentFormsQuery.data?.data || [],
    pagination: consentFormsQuery.data?.pagination,
    isLoading: consentFormsQuery.isLoading,
    error: consentFormsQuery.error,
    refetch: consentFormsQuery.refetch,
    submitConsentForm: submitConsentFormMutation.mutate,
    isSubmitting: submitConsentFormMutation.isPending,
  };
}