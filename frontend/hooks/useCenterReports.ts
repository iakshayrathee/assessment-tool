import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Types
export interface CenterReportSnapshot {
    id: string;
    centerId: string;
    periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    periodStart: string;
    periodEnd: string;

    // Student Coverage
    totalStudentsRegistered: number;
    studentsAssessed: number;
    studentsUnderIntervention: number;
    newStudentsThisPeriod: number;
    activeStudents: number;
    exitedMainstreamed: number;

    // Assessment Statistics
    totalAssessmentsConducted: number;
    baselineAssessments: number;
    reviewProgressAssessments: number;
    averageAssessmentTime: number | null;
    assessmentsPerEducator: number | null;

    // Intervention Statistics
    individualInterventionPlans: number;
    smallGroupInterventions: number;
    totalInterventionSessions: number;
    avgSessionsPerStudent: number | null;
    avgDurationPerSession: number | null;

    // Progress & Outcomes
    readingImprovement: number | null;
    writingImprovement: number | null;
    mathematicsImprovement: number | null;
    attentionBehaviorImprovement: number | null;

    // Educator Productivity
    activeSpecialEducators: number;
    avgStudentsPerEducator: number | null;
    avgSessionsPerEducator: number | null;
    avgReportsGenerated: number | null;

    // Compliance
    assessmentRecordsAvailable: number | null;
    interventionPlansDocumented: number | null;
    progressReviewsCompleted: number | null;
    parentReportsShared: number | null;

    // Coverage
    schoolsCovered: string[];
    gradesCovered: string[];

    // AI Narratives
    executiveSummary: string | null;
    recommendations: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface CompleteCenterReportData {
    snapshot: CenterReportSnapshot;
    center: {
        id: string;
        centerName: string;
        address: string | null;
        contactPerson: string | null;
    };
    coverage: {
        totalStudentsRegistered: number;
        studentsAssessed: number;
        studentsUnderIntervention: number;
        newStudentsThisPeriod: number;
        activeStudents: number;
        exitedMainstreamed: number;
    };
    assessments: {
        totalAssessmentsConducted: number;
        baselineAssessments: number;
        reviewProgressAssessments: number;
        averageAssessmentTime: number | null;
        assessmentsPerEducator: number | null;
    };
    interventions: {
        individualInterventionPlans: number;
        smallGroupInterventions: number;
        totalInterventionSessions: number;
        avgSessionsPerStudent: number | null;
        avgDurationPerSession: number | null;
    };
    progress: {
        readingImprovement: number | null;
        writingImprovement: number | null;
        mathematicsImprovement: number | null;
        attentionBehaviorImprovement: number | null;
    };
    productivity: {
        activeSpecialEducators: number;
        avgStudentsPerEducator: number | null;
        avgSessionsPerEducator: number | null;
        avgReportsGenerated: number | null;
    };
    compliance: {
        assessmentRecordsAvailable: number | null;
        interventionPlansDocumented: number | null;
        progressReviewsCompleted: number | null;
        parentReportsShared: number | null;
    };
}

/**
 * Hook to list center report snapshots with pagination
 */
export function useCenterSnapshots(
    centerId?: string,
    params?: {
        page?: number;
        limit?: number;
        periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    }
) {
    return useQuery({
        queryKey: ['center-reports', 'snapshots', centerId, params],
        queryFn: async () => {
            if (!centerId) throw new Error('Center ID is required');
            return await apiClient.listCenterSnapshots(centerId, params);
        },
        enabled: !!centerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to generate a new center report snapshot
 */
export function useGenerateCenterSnapshot(centerId?: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
            startDate?: Date;
            endDate?: Date;
        }) => {
            if (!centerId) throw new Error('Center ID is required');
            return await apiClient.generateCenterSnapshot(centerId, params);
        },
        onSuccess: () => {
            // Invalidate snapshots list
            queryClient.invalidateQueries({ queryKey: ['center-reports', 'snapshots', centerId] });
            // Invalidate complete report data
            queryClient.invalidateQueries({ queryKey: ['center-reports', 'complete', centerId] });
        },
    });
}

/**
 * Hook to get complete center report data (optimized single call)
 */
export function useCompleteCenterReportData(
    centerId?: string,
    params?: {
        snapshotId?: string;
        periodType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
        startDate?: Date;
        endDate?: Date;
    }
) {
    return useQuery({
        queryKey: ['center-reports', 'complete', centerId, params],
        queryFn: async () => {
            if (!centerId) throw new Error('Center ID is required');
            return await apiClient.getCompleteCenterReportData(centerId, params);
        },
        enabled: !!centerId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to get a specific snapshot by ID
 */
export function useCenterSnapshot(centerId?: string, snapshotId?: string) {
    return useQuery({
        queryKey: ['center-reports', 'snapshot', centerId, snapshotId],
        queryFn: async () => {
            if (!centerId || !snapshotId) throw new Error('Center ID and Snapshot ID are required');
            const response = await apiClient.listCenterSnapshots(centerId, { page: 1, limit: 1 });
            return response.data.find((s: CenterReportSnapshot) => s.id === snapshotId);
        },
        enabled: !!centerId && !!snapshotId,
        staleTime: 10 * 60 * 1000, // 10 minutes (snapshots don't change)
    });
}
