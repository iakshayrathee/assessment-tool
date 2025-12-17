import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface SchoolReportSnapshot {
    id: string;
    schoolId: string;
    periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    periodStart: string;
    periodEnd: string;
    totalEnrolled: number;
    totalScreened: number;
    totalSupported: number;
    gradesCovered: string[];
    highSupportCount: number;
    moderateSupportCount: number;
    onTrackCount: number;
    highSupportReduction: number | null;
    moderateSupportReduction: number | null;
    onTrackIncrease: number | null;
    readingReadinessPercent: number | null;
    writingReadinessPercent: number | null;
    numeracyReadinessPercent: number | null;
    attentionEngagementPercent: number | null;
    processingMemoryPercent: number | null;
    totalSessions: number;
    averageImprovement: Record<string, number> | null;
    executiveSummary: string | null;
    coverageNarrative: string | null;
    impactNarrative: string | null;
    recommendations: string | null;
    createdAt: string;
    updatedAt: string;
}

interface SchoolReportOptions {
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate?: string;
    endDate?: string;
}

/**
 * Hook to fetch school overview report by snapshot ID
 */
export function useSchoolOverviewReport(snapshotId: string | null) {
    return useQuery({
        queryKey: ['school-reports', 'overview', snapshotId],
        queryFn: async () => {
            if (!snapshotId) return null;
            return await apiClient.getSchoolOverviewReport({ snapshotId });
        },
        enabled: !!snapshotId
    });
}

/**
 * Hook to fetch assessment coverage report by snapshot ID
 */
export function useAssessmentCoverageReport(snapshotId: string | null) {
    return useQuery({
        queryKey: ['school-reports', 'coverage', snapshotId],
        queryFn: async () => {
            if (!snapshotId) return null;
            return await apiClient.getAssessmentCoverageReport({ snapshotId });
        },
        enabled: !!snapshotId
    });
}

/**
 * Hook to fetch school impact report by snapshot ID
 */
export function useSchoolImpactReport(snapshotId: string | null) {
    return useQuery({
        queryKey: ['school-reports', 'impact', snapshotId],
        queryFn: async () => {
            if (!snapshotId) return null;
            return await apiClient.getSchoolImpactReport({ snapshotId });
        },
        enabled: !!snapshotId
    });
}

/**
 * Hook to list all snapshots
 */
export function useSchoolSnapshots(params?: { page?: number; limit?: number; periodType?: string }) {
    return useQuery({
        queryKey: ['school-reports', 'snapshots', params],
        queryFn: async () => {
            return await apiClient.listSchoolSnapshots(params);
        }
    });
}

/**
 * Hook to fetch student deep assessment
 */
export function useStudentDeepAssessment(studentId: string | null) {
    return useQuery({
        queryKey: ['school-reports', 'student-deep', studentId],
        queryFn: async () => {
            if (!studentId) return null;
            return await apiClient.getStudentDeepAssessment(studentId);
        },
        enabled: !!studentId
    });
}

/**
 * Hook to generate snapshot
 */
export function useGenerateSnapshot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (options: SchoolReportOptions) => {
            return await apiClient.generateSchoolSnapshot(options);
        },
        onSuccess: () => {
            // Invalidate all school report queries
            queryClient.invalidateQueries({ queryKey: ['school-reports'] });
        }
    });
}

/**
 * Hook to generate AI narrative
 */
export function useGenerateAINarrative() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { snapshotId: string; narrativeType: 'overview' | 'coverage' | 'impact' | 'recommendations' }) => {
            return await apiClient.generateSchoolAINarrative(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-reports'] });
        }
    });
}

/**
 * Hook to fetch complete report data for all dashboards (OPTIMIZED - single API call)
 */
export function useCompleteReportData(params?: {
    snapshotId?: string | null;
    periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    startDate?: string;
    endDate?: string;
}) {
    return useQuery({
        queryKey: ['school-reports', 'complete-data', params],
        queryFn: async () => {
            return await apiClient.getCompleteReportData(params);
        },
        enabled: !!(params?.snapshotId || params?.periodType),
        staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnReconnect: false, // Don't refetch on reconnect
        refetchOnMount: false // Don't refetch on component mount if data exists
    });
}

/**
 * Hook to fetch targeted students for deep assessment
 */
export function useTargetedStudents(riskLevel?: 'HIGH_SUPPORT' | 'MODERATE_SUPPORT' | 'ON_TRACK') {
    return useQuery({
        queryKey: ['school-reports', 'targeted-students', riskLevel],
        queryFn: async () => {
            return await apiClient.getTargetedStudents(riskLevel);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false
    });
}

