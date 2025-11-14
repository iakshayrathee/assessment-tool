import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';

// Helper function to format user-friendly error messages
const formatErrorMessage = (error: any, defaultMessage: string): string => {
  const errorMessage = error.response?.data?.error || error.message || defaultMessage;
  
  // Handle common database/technical errors with user-friendly messages
  if (errorMessage.includes('foreign key constraint')) {
    return 'Unable to save assessment. Please ensure all required information is provided.';
  }
  
  if (errorMessage.includes('validation')) {
    return 'Please check that all required fields are filled out correctly.';
  }
  
  if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
    return 'An assessment with this information already exists.';
  }
  
  if (errorMessage.includes('not found')) {
    return 'The requested assessment could not be found.';
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return 'Connection error. Please check your internet connection and try again.';
  }
  
  // Return the original error message if it's already user-friendly (doesn't contain technical terms)
  if (!errorMessage.includes('SQL') && 
      !errorMessage.includes('database') && 
      !errorMessage.includes('constraint') &&
      !errorMessage.includes('prisma') &&
      errorMessage.length < 100) {
    return errorMessage;
  }
  
  // Fallback to default message for other technical errors
  return defaultMessage;
};

export function useIntakeForm(studentId?: string) {
  const queryClient = useQueryClient();

  // Get intake form by student
  const intakeFormQuery = useQuery({
    queryKey: ['intakeForm', studentId],
    queryFn: () => apiClient.getIntakeFormByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });

  // Create intake form mutation
  const createIntakeFormMutation = useMutation({
    mutationFn: (intakeData: any) => apiClient.createIntakeForm(intakeData),
    onSuccess: (data, variables) => {
      // Invalidate both specific student intake form and all intake forms queries
      queryClient.invalidateQueries({ queryKey: ['intakeForm', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['intakeForm'] });
      toast.success('Intake form created successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to create intake form');
      toast.error(userFriendlyMessage);
    },
  });

  // Update intake form mutation
  const updateIntakeFormMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateIntakeForm(id, data),
    onSuccess: (data, variables) => {
      // Invalidate both specific student intake form and all intake forms queries
      queryClient.invalidateQueries({ queryKey: ['intakeForm', variables.data.studentId] });
      queryClient.invalidateQueries({ queryKey: ['intakeForm'] });
      toast.success('Intake form updated successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to update intake form');
      toast.error(userFriendlyMessage);
    },
  });

  // Complete intake form mutation
  const completeIntakeFormMutation = useMutation({
    mutationFn: (id: string) => apiClient.completeIntakeForm(id),
    onSuccess: (data, variables) => {
      // Invalidate both specific student intake form and all intake forms queries
      if (data && data.studentId) {
        queryClient.invalidateQueries({ queryKey: ['intakeForm', data.studentId] });
      }
      queryClient.invalidateQueries({ queryKey: ['intakeForm'] });
      toast.success('Intake form completed successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to complete intake form');
      toast.error(userFriendlyMessage);
    },
  });

  return {
    // Data
    intakeForm: intakeFormQuery.data,
    
    // Loading states
    isLoading: intakeFormQuery.isLoading,
    
    // Actions
    createIntakeForm: createIntakeFormMutation.mutate,
    updateIntakeForm: updateIntakeFormMutation.mutate,
    completeIntakeForm: completeIntakeFormMutation.mutate,
    
    // Action loading states
    isCreating: createIntakeFormMutation.isPending,
    isUpdating: updateIntakeFormMutation.isPending,
    isCompleting: completeIntakeFormMutation.isPending,
    
    // Refetch
    refetch: intakeFormQuery.refetch,
  };
}

export function useAssessments(studentId?: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  // Get assessments by student
  const assessmentsQuery = useQuery({
    queryKey: ['assessments', studentId],
    queryFn: () => apiClient.getAssessmentsByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Get assessment stats
  const statsQuery = useQuery({
    queryKey: ['assessments', 'stats'],
    queryFn: () => apiClient.getAssessmentStats(),
    staleTime: 5 * 60 * 1000,
  });

  // Get assessment history
  const historyQuery = useQuery({
    queryKey: ['assessments', 'history', studentId],
    queryFn: () => apiClient.getAssessmentHistory(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Create assessment mutation
  const createAssessmentMutation = useMutation({
    mutationFn: (assessmentData: any) => apiClient.createAssessment(assessmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment created successfully!');
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to create assessment');
      toast.error(userFriendlyMessage);
    },
  });

  // Update assessment mutation
  const updateAssessmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateAssessment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment updated successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to update assessment');
      toast.error(userFriendlyMessage);
    },
  });

  return {
    // Data
    assessments: assessmentsQuery.data || [],
    stats: statsQuery.data,
    history: historyQuery.data,
    
    // Loading states
    isLoading: assessmentsQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    
    // Actions
    createAssessment: createAssessmentMutation.mutate,
    updateAssessment: updateAssessmentMutation.mutate,
    
    // Action loading states
    isCreating: createAssessmentMutation.isPending,
    isUpdating: updateAssessmentMutation.isPending,
    
    // Refetch
    refetch: assessmentsQuery.refetch,
    refetchHistory: historyQuery.refetch,
  };
}

export function useIEPGoals(studentId?: string, educatorId?: string) {
  const queryClient = useQueryClient();

  // Get IEP goals by student
  const iepGoalsQuery = useQuery({
    queryKey: ['iepGoals', studentId],
    queryFn: () => apiClient.getIEPGoalsByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Get IEP goals by educator (for all students view)
  const iepGoalsByEducatorQuery = useQuery({
    queryKey: ['iepGoals', 'educator', educatorId],
    queryFn: () => apiClient.getIEPGoalsByEducator(educatorId!),
    enabled: !!educatorId && !studentId, // Only fetch when educatorId is provided and no specific student
    staleTime: 2 * 60 * 1000,
  });

  // Create IEP goal mutation
  const createIEPGoalMutation = useMutation({
    mutationFn: (goalData: any) => apiClient.createIEPGoal(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iepGoals'] });
      toast.success('IEP goal created successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to create IEP goal');
      toast.error(userFriendlyMessage);
    },
  });

  // Update IEP goal mutation
  const updateIEPGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateIEPGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iepGoals'] });
      toast.success('IEP goal updated successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to update IEP goal');
      toast.error(userFriendlyMessage);
    },
  });

  // Update IEP goal progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: ({ goalId, progress, notes, rating }: { 
      goalId: string; 
      progress: number; 
      notes?: string; 
      rating?: string; 
    }) => apiClient.updateIEPGoalProgress(goalId, progress, notes, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iepGoals'] });
      toast.success('Progress updated successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to update progress');
      toast.error(userFriendlyMessage);
    },
  });

  return {
    // Data
    iepGoals: studentId ? (iepGoalsQuery.data || []) : (iepGoalsByEducatorQuery.data || []),
    
    // Loading states
    isLoading: studentId ? iepGoalsQuery.isLoading : iepGoalsByEducatorQuery.isLoading,
    
    // Actions
    createIEPGoal: createIEPGoalMutation.mutate,
    updateIEPGoal: updateIEPGoalMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    
    // Action loading states
    isCreating: createIEPGoalMutation.isPending,
    isUpdating: updateIEPGoalMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    
    // Refetch
    refetch: studentId ? iepGoalsQuery.refetch : iepGoalsByEducatorQuery.refetch,
  };
}

export function useSessionNotes(studentId?: string, page = 1, limit = 10) {
  const queryClient = useQueryClient();

  // Get session notes by student
  const sessionNotesQuery = useQuery({
    queryKey: ['sessionNotes', studentId, page, limit],
    queryFn: () => apiClient.getSessionNotesByStudent(studentId!, page, limit),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Create session note mutation
  const createSessionNoteMutation = useMutation({
    mutationFn: (sessionData: any) => apiClient.createSessionNote(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionNotes'] });
      toast.success('Session note created successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to create session note');
      toast.error(userFriendlyMessage);
    },
  });

  return {
    // Data
    sessionNotes: sessionNotesQuery.data?.data || [],
    pagination: sessionNotesQuery.data?.pagination,
    
    // Loading states
    isLoading: sessionNotesQuery.isLoading,
    
    // Actions
    createSessionNote: createSessionNoteMutation.mutate,
    
    // Action loading states
    isCreating: createSessionNoteMutation.isPending,
    
    // Refetch
    refetch: sessionNotesQuery.refetch,
  };
}

export function useReports(studentId?: string) {
  const queryClient = useQueryClient();

  // Get reports by student
  const reportsQuery = useQuery({
    queryKey: ['reports', studentId],
    queryFn: () => apiClient.getReportsByStudent(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  // Get report by ID
  const getReportById = (reportId: string) => {
    return useQuery({
      queryKey: ['report', reportId],
      queryFn: () => apiClient.getReport(reportId),
      enabled: !!reportId,
      staleTime: 2 * 60 * 1000,
    });
  };

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: (reportData: any) => apiClient.createReport(reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report created successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to create report');
      toast.error(userFriendlyMessage);
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: any }) =>
      apiClient.updateReport(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('Report updated successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to update report');
      toast.error(userFriendlyMessage);
    },
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: ({ reportId, signature }: { reportId: string; signature: string }) =>
      apiClient.submitReport(reportId, signature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('Report submitted successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to submit report');
      toast.error(userFriendlyMessage);
    },
  });

  // Review report mutation (for super special educators)
  const reviewReportMutation = useMutation({
    mutationFn: ({ reportId, action, comments, recommendations }: { 
      reportId: string; 
      action: 'APPROVE' | 'REJECT'; 
      comments?: string; 
      recommendations?: string; 
    }) => apiClient.reviewReport(reportId, action, comments, recommendations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success('Report reviewed successfully!');
    },
    onError: (error: any) => {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to review report');
      toast.error(userFriendlyMessage);
    },
  });

  // Download report as PDF
  const downloadReport = async (reportId: string, fileName?: string) => {
    try {
      const response = await apiClient.downloadReport(reportId);
      
      // Create a blob from the response
      const blob = new Blob([response], { type: 'application/pdf' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `report_${reportId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('Report downloaded successfully!');
    } catch (error: any) {
      const userFriendlyMessage = formatErrorMessage(error, 'Failed to download report');
      toast.error(userFriendlyMessage);
    }
  };

  return {
    // Data
    reports: reportsQuery.data || [],
    
    // Loading states
    isLoading: reportsQuery.isLoading,
    
    // Actions
    createReport: createReportMutation.mutate,
    updateReport: updateReportMutation.mutate,
    submitReport: submitReportMutation.mutate,
    reviewReport: reviewReportMutation.mutate,
    downloadReport,
    getReportById,
    
    // Action loading states
    isCreating: createReportMutation.isPending,
    isUpdating: updateReportMutation.isPending,
    isSubmitting: submitReportMutation.isPending,
    isReviewing: reviewReportMutation.isPending,
    
    // Refetch
    refetch: reportsQuery.refetch,
  };
}

export function useStudentAssessmentSummary(studentId?: string) {
  // Get student assessment summary
  const summaryQuery = useQuery({
    queryKey: ['assessmentSummary', studentId],
    queryFn: () => apiClient.getStudentAssessmentSummary(studentId!),
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
  });

  return {
    // Data
    summary: summaryQuery.data,
    
    // Loading states
    isLoading: summaryQuery.isLoading,
    
    // Error states
    error: summaryQuery.error,
    
    // Refetch
    refetch: summaryQuery.refetch,
  };
}
