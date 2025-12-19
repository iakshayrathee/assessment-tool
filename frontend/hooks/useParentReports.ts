import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Types
export interface ParentReportSnapshot {
    id: string;
    studentId: string;
    parentId: string;
    periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    periodStart: string;
    periodEnd: string;

    // Student Information
    studentName: string;
    studentGrade: string;
    studentAge: number;
    enrollmentDate: string;
    assignedEducatorName: string | null;

    // Assessment Summary
    totalAssessments: number;
    latestAssessmentDate: string | null;
    latestAssessmentScore: number | null;
    riskLevel: string | null;
    assessmentProgress: string | null;

    // Progress Tracking
    readingProgress: number | null;
    writingProgress: number | null;
    mathProgress: number | null;
    attentionProgress: number | null;
    overallGoalCompletion: number | null;

    // Attendance
    totalSessionsScheduled: number;
    sessionsAttended: number;
    participationRate: number | null;
    lastSessionDate: string | null;

    // Intervention Plan
    focusReading: boolean;
    focusWriting: boolean;
    focusMathematics: boolean;
    focusAttention: boolean;
    focusConfidence: boolean;
    shortTermGoals: string | null;
    longTermGoals: string | null;
    readingStrategy: string | null;
    writingStrategy: string | null;
    mathematicsStrategy: string | null;
    attentionStrategy: string | null;
    confidenceStrategy: string | null;
    educatorNotes: string | null;
    parentFriendlySummary: string | null;
    nextReviewDate: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface CompleteParentReportData {
    snapshot: ParentReportSnapshot;
    student: {
        id: string;
        fullName: string;
        grade: string;
        age: number;
        centerName?: string;
        schoolName?: string;
    };
    studentInfo: {
        studentName: string;
        studentGrade: string;
        studentAge: number;
        enrollmentDate: string;
        assignedEducatorName: string | null;
    };
    assessmentSummary: {
        totalAssessments: number;
        latestAssessmentDate: string | null;
        latestAssessmentScore: number | null;
        riskLevel: string | null;
        assessmentProgress: string | null;
    };
    progressTracking: {
        readingProgress: number | null;
        writingProgress: number | null;
        mathProgress: number | null;
        attentionProgress: number | null;
        overallGoalCompletion: number | null;
    };
    attendance: {
        totalSessionsScheduled: number;
        sessionsAttended: number;
        participationRate: number | null;
        lastSessionDate: string | null;
    };
    interventionPlan: {
        focusAreas: {
            reading: boolean;
            writing: boolean;
            mathematics: boolean;
            attention: boolean;
            confidence: boolean;
        };
        goals: {
            shortTerm: string | null;
            longTerm: string | null;
        };
        strategies: {
            reading: string | null;
            writing: string | null;
            mathematics: string | null;
            attention: string | null;
            confidence: string | null;
        };
        educatorNotes: string | null;
        parentFriendlySummary: string | null;
        nextReviewDate: string | null;
    };
}

/**
 * Hook to fetch parent report snapshots for a student
 */
export function useParentSnapshots(
    studentId?: string,
    params?: {
        page?: number;
        limit?: number;
        periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    }
) {
    return useQuery({
        queryKey: ['parent-reports', 'snapshots', studentId, params],
        queryFn: async () => {
            if (!studentId) throw new Error('Student ID is required');
            return await apiClient.listParentSnapshots(studentId, params);
        },
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to generate a new parent report snapshot
 */
export function useGenerateParentSnapshot(studentId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
            startDate?: string;
            endDate?: string;
        }) => {
            if (!studentId) throw new Error('Student ID is required');
            return await apiClient.generateParentSnapshot(studentId, params);
        },
        onSuccess: () => {
            // Invalidate snapshots list
            queryClient.invalidateQueries({ queryKey: ['parent-reports', 'snapshots', studentId] });
            queryClient.invalidateQueries({ queryKey: ['parent-reports', 'complete', studentId] });
        },
    });
}

/**
 * Hook to fetch complete parent report data
 */
export function useCompleteParentReportData(
    studentId?: string,
    params?: {
        snapshotId?: string;
        periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        startDate?: string;
        endDate?: string;
    }
) {
    return useQuery({
        queryKey: ['parent-reports', 'complete', studentId, params],
        queryFn: async () => {
            if (!studentId) throw new Error('Student ID is required');
            return await apiClient.getCompleteParentReportData(studentId, params);
        },
        enabled: !!studentId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch a specific parent report snapshot by ID
 */
export function useParentSnapshot(studentId?: string, snapshotId?: string) {
    return useQuery({
        queryKey: ['parent-reports', 'snapshot', snapshotId],
        queryFn: async () => {
            if (!studentId || !snapshotId) throw new Error('Student ID and Snapshot ID are required');
            return await apiClient.getCompleteParentReportData(studentId, { snapshotId });
        },
        enabled: !!studentId && !!snapshotId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}
