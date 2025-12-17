import { Response } from 'express';
import { PrismaClient, ReportPeriodType } from '@prisma/client';
import { AuthenticatedRequest } from '../utils/auth';
import { SchoolReportService } from '../services/SchoolReportService';
import { SchoolAIReportService } from '../services/SchoolAIReportService';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();
const schoolReportService = new SchoolReportService(prisma);
const schoolAIReportService = new SchoolAIReportService();

export class SchoolReportController {
    /**
     * Get overview report with AI-generated narrative
     */
    static async getOverviewReport(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { snapshotId, periodType = 'MONTHLY', startDate, endDate } = req.query;

            // Get school viewer profile
            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId },
                include: { school: true }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            let snapshot;

            // If snapshotId is provided, fetch that specific snapshot
            if (snapshotId) {
                snapshot = await prisma.schoolReportSnapshot.findFirst({
                    where: {
                        id: snapshotId as string,
                        schoolId: profile.schoolId
                    }
                });

                if (!snapshot) {
                    throw new AppError('Snapshot not found', 404);
                }
            } else {
                // Otherwise, generate or retrieve snapshot based on period
                const start = startDate ? new Date(startDate as string) : getDefaultStartDate(periodType as ReportPeriodType);
                const end = endDate ? new Date(endDate as string) : new Date();

                snapshot = await schoolReportService.generateSchoolSnapshot(
                    profile.schoolId,
                    periodType as ReportPeriodType,
                    start,
                    end
                );
            }

            // OPTIMIZED: Generate ALL AI narratives in a single API call if any are missing
            if (!snapshot.executiveSummary || !snapshot.coverageNarrative ||
                !snapshot.impactNarrative || !snapshot.recommendations) {

                console.log('Generating all AI narratives in single API call...');
                const narratives = await schoolAIReportService.generateAllNarratives(
                    snapshot as any,
                    { name: profile.school.name, principalName: profile.school.principalName || undefined }
                );

                // Update snapshot with all narratives at once
                await prisma.schoolReportSnapshot.update({
                    where: { id: snapshot.id },
                    data: {
                        executiveSummary: narratives.executiveSummary,
                        coverageNarrative: narratives.coverageNarrative,
                        impactNarrative: narratives.impactNarrative,
                        recommendations: narratives.recommendations
                    }
                });

                snapshot.executiveSummary = narratives.executiveSummary;
                snapshot.coverageNarrative = narratives.coverageNarrative;
                snapshot.impactNarrative = narratives.impactNarrative;
                snapshot.recommendations = narratives.recommendations;
            }

            res.json({
                success: true,
                data: {
                    snapshot,
                    school: profile.school
                }
            });

        } catch (error) {
            console.error('Get overview report error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get overview report'
            });
        }
    }

    /**
     * Get assessment coverage report with AI narrative
     */
    static async getAssessmentCoverageReport(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { snapshotId, periodType = 'MONTHLY', startDate, endDate } = req.query;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId },
                include: { school: true }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            let snapshot;

            // If snapshotId is provided, fetch that specific snapshot
            if (snapshotId) {
                snapshot = await prisma.schoolReportSnapshot.findFirst({
                    where: {
                        id: snapshotId as string,
                        schoolId: profile.schoolId
                    }
                });

                if (!snapshot) {
                    throw new AppError('Snapshot not found', 404);
                }
            } else {
                const start = startDate ? new Date(startDate as string) : getDefaultStartDate(periodType as ReportPeriodType);
                const end = endDate ? new Date(endDate as string) : new Date();

                snapshot = await schoolReportService.generateSchoolSnapshot(
                    profile.schoolId,
                    periodType as ReportPeriodType,
                    start,
                    end
                );
            }

            // Generate ALL narratives if any are missing (single API call)
            if (!snapshot.executiveSummary || !snapshot.coverageNarrative ||
                !snapshot.impactNarrative || !snapshot.recommendations) {

                const narratives = await schoolAIReportService.generateAllNarratives(
                    snapshot as any,
                    { name: profile.school.name, principalName: profile.school.principalName || undefined }
                );

                await prisma.schoolReportSnapshot.update({
                    where: { id: snapshot.id },
                    data: {
                        executiveSummary: narratives.executiveSummary,
                        coverageNarrative: narratives.coverageNarrative,
                        impactNarrative: narratives.impactNarrative,
                        recommendations: narratives.recommendations
                    }
                });

                snapshot.executiveSummary = narratives.executiveSummary;
                snapshot.coverageNarrative = narratives.coverageNarrative;
                snapshot.impactNarrative = narratives.impactNarrative;
                snapshot.recommendations = narratives.recommendations;
            }

            res.json({
                success: true,
                data: {
                    snapshot,
                    school: profile.school
                }
            });

        } catch (error) {
            console.error('Get coverage report error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get coverage report'
            });
        }
    }

    /**
     * Get school impact report with AI narrative
     */
    static async getSchoolImpactReport(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { snapshotId, periodType = 'MONTHLY', startDate, endDate } = req.query;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId },
                include: { school: true }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            let snapshot;

            // If snapshotId is provided, fetch that specific snapshot
            if (snapshotId) {
                snapshot = await prisma.schoolReportSnapshot.findFirst({
                    where: {
                        id: snapshotId as string,
                        schoolId: profile.schoolId
                    }
                });

                if (!snapshot) {
                    throw new AppError('Snapshot not found', 404);
                }
            } else {
                const start = startDate ? new Date(startDate as string) : getDefaultStartDate(periodType as ReportPeriodType);
                const end = endDate ? new Date(endDate as string) : new Date();

                snapshot = await schoolReportService.generateSchoolSnapshot(
                    profile.schoolId,
                    periodType as ReportPeriodType,
                    start,
                    end
                );
            }

            // Generate ALL narratives if any are missing (single API call)
            if (!snapshot.executiveSummary || !snapshot.coverageNarrative ||
                !snapshot.impactNarrative || !snapshot.recommendations) {

                const narratives = await schoolAIReportService.generateAllNarratives(
                    snapshot as any,
                    { name: profile.school.name, principalName: profile.school.principalName || undefined }
                );

                await prisma.schoolReportSnapshot.update({
                    where: { id: snapshot.id },
                    data: {
                        executiveSummary: narratives.executiveSummary,
                        coverageNarrative: narratives.coverageNarrative,
                        impactNarrative: narratives.impactNarrative,
                        recommendations: narratives.recommendations
                    }
                });

                snapshot.executiveSummary = narratives.executiveSummary;
                snapshot.coverageNarrative = narratives.coverageNarrative;
                snapshot.impactNarrative = narratives.impactNarrative;
                snapshot.recommendations = narratives.recommendations;
            }

            res.json({
                success: true,
                data: {
                    snapshot,
                    school: profile.school
                }
            });

        } catch (error) {
            console.error('Get impact report error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get impact report'
            });
        }
    }

    /**
     * Get deep assessment for a specific student (Report 2)
     */
    static async getStudentDeepAssessment(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { studentId } = req.params;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            // Verify student belongs to this school
            const student = await prisma.student.findFirst({
                where: {
                    id: studentId,
                    schoolId: profile.schoolId
                }
            });

            if (!student) {
                throw new AppError('Student not found or access denied', 404);
            }

            // Get latest AI comprehensive report for this student
            const report = await prisma.report.findFirst({
                where: {
                    studentId,
                    type: 'AI_COMPREHENSIVE'
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            grade: true,
                            dateOfBirth: true
                        }
                    },
                    specialEducator: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                }
            });

            res.json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error('Get student deep assessment error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get student assessment'
            });
        }
    }

    /**
     * Generate new snapshot (force refresh)
     */
    static async generateSnapshot(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { periodType = 'MONTHLY', startDate, endDate } = req.body;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            const start = startDate ? new Date(startDate) : getDefaultStartDate(periodType);
            const end = endDate ? new Date(endDate) : new Date();

            // Invalidate cache first
            await schoolReportService.invalidateCache(profile.schoolId, periodType);

            // Generate new snapshot
            const snapshot = await schoolReportService.generateSchoolSnapshot(
                profile.schoolId,
                periodType,
                start,
                end
            );

            res.json({
                success: true,
                message: 'Snapshot generated successfully',
                data: snapshot
            });

        } catch (error) {
            console.error('Generate snapshot error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to generate snapshot'
            });
        }
    }

    /**
     * Generate AI narratives for existing snapshot
     */
    static async generateAINarrative(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { snapshotId, narrativeType } = req.body;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId },
                include: { school: true }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            const snapshot = await prisma.schoolReportSnapshot.findFirst({
                where: {
                    id: snapshotId,
                    schoolId: profile.schoolId
                }
            });

            if (!snapshot) {
                throw new AppError('Snapshot not found', 404);
            }

            let narrative: string;

            switch (narrativeType) {
                case 'overview':
                    narrative = await schoolAIReportService.generateSchoolOverviewNarrative(
                        snapshot as any,
                        { name: profile.school.name, principalName: profile.school.principalName || undefined }
                    );
                    await prisma.schoolReportSnapshot.update({
                        where: { id: snapshotId },
                        data: { executiveSummary: narrative }
                    });
                    break;

                case 'coverage':
                    narrative = await schoolAIReportService.generateAssessmentCoverageNarrative(
                        snapshot as any,
                        {}
                    );
                    await prisma.schoolReportSnapshot.update({
                        where: { id: snapshotId },
                        data: { coverageNarrative: narrative }
                    });
                    break;

                case 'impact':
                    narrative = await schoolAIReportService.generateSchoolImpactNarrative(
                        snapshot as any,
                        { name: profile.school.name }
                    );
                    await prisma.schoolReportSnapshot.update({
                        where: { id: snapshotId },
                        data: { impactNarrative: narrative }
                    });
                    break;

                case 'recommendations':
                    narrative = await schoolAIReportService.generateRecommendations(
                        snapshot as any,
                        {}
                    );
                    await prisma.schoolReportSnapshot.update({
                        where: { id: snapshotId },
                        data: { recommendations: narrative }
                    });
                    break;

                default:
                    throw new AppError('Invalid narrative type', 400);
            }

            res.json({
                success: true,
                message: 'AI narrative generated successfully',
                data: { narrative }
            });

        } catch (error) {
            console.error('Generate AI narrative error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to generate AI narrative'
            });
        }
    }
    /**
     * List all snapshots for the school viewer's school
     */
    static async listSnapshots(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { page = 1, limit = 20, periodType } = req.query;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            // Build where clause
            const where: any = { schoolId: profile.schoolId };
            if (periodType) {
                where.periodType = periodType as ReportPeriodType;
            }

            // Get total count
            const total = await prisma.schoolReportSnapshot.count({ where });

            // Get paginated snapshots
            const snapshots = await prisma.schoolReportSnapshot.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit)
            });

            res.json({
                success: true,
                data: snapshots,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            });

        } catch (error) {
            console.error('List snapshots error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to list snapshots'
            });
        }
    }

    /**
     * Get complete report data for all dashboards in a single call
     * OPTIMIZED: Returns all data needed for all tabs at once
     */
    static async getCompleteReportData(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { snapshotId, periodType = 'MONTHLY', startDate, endDate } = req.query;

            // Get school viewer profile
            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId },
                include: { school: true }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            let snapshot;

            // If snapshotId is provided, fetch that specific snapshot
            if (snapshotId) {
                snapshot = await prisma.schoolReportSnapshot.findFirst({
                    where: {
                        id: snapshotId as string,
                        schoolId: profile.schoolId
                    }
                });

                if (!snapshot) {
                    throw new AppError('Snapshot not found', 404);
                }
            } else {
                // Otherwise, generate or retrieve snapshot based on period
                const start = startDate ? new Date(startDate as string) : getDefaultStartDate(periodType as ReportPeriodType);
                const end = endDate ? new Date(endDate as string) : new Date();

                snapshot = await schoolReportService.generateSchoolSnapshot(
                    profile.schoolId,
                    periodType as ReportPeriodType,
                    start,
                    end
                );
            }

            // Generate ALL AI narratives if any are missing (single API call)
            if (!snapshot.executiveSummary || !snapshot.coverageNarrative ||
                !snapshot.impactNarrative || !snapshot.recommendations) {

                const narratives = await schoolAIReportService.generateAllNarratives(
                    snapshot as any,
                    { name: profile.school.name, principalName: profile.school.principalName || undefined }
                );

                await prisma.schoolReportSnapshot.update({
                    where: { id: snapshot.id },
                    data: {
                        executiveSummary: narratives.executiveSummary,
                        coverageNarrative: narratives.coverageNarrative,
                        impactNarrative: narratives.impactNarrative,
                        recommendations: narratives.recommendations
                    }
                });

                snapshot.executiveSummary = narratives.executiveSummary;
                snapshot.coverageNarrative = narratives.coverageNarrative;
                snapshot.impactNarrative = narratives.impactNarrative;
                snapshot.recommendations = narratives.recommendations;
            }

            // Return complete data for all dashboards
            res.json({
                success: true,
                data: {
                    snapshot,
                    school: profile.school,
                    // Structured data for easy consumption
                    overview: {
                        totalStudentsUnderSupport: snapshot.totalSupported,
                        newStudentsThisMonth: snapshot.newStudentsThisMonth,
                        studentsBySeverity: {
                            high: snapshot.highSupportCount,
                            moderate: snapshot.moderateSupportCount,
                            onTrack: snapshot.onTrackCount
                        },
                        studentsByProgressLevel: {
                            improving: snapshot.studentsImproving,
                            stable: snapshot.studentsStable,
                            requiresAttention: snapshot.studentsRequiringAttention
                        },
                        studentsByGrade: snapshot.gradesCovered,
                        totalSessionsThisMonth: snapshot.totalSessions
                    },
                    assessment: {
                        reachAndCoverage: {
                            totalEnrolled: snapshot.totalEnrolled,
                            totalScreened: snapshot.totalScreened,
                            totalSupported: snapshot.totalSupported,
                            gradesCovered: snapshot.gradesCovered
                        },
                        riskCategoryTrends: {
                            highSupportReduction: snapshot.highSupportReduction,
                            moderateSupportReduction: snapshot.moderateSupportReduction,
                            onTrackIncrease: snapshot.onTrackIncrease
                        },
                        skillAreaMetrics: {
                            readingReadiness: snapshot.readingReadinessPercent,
                            writingReadiness: snapshot.writingReadinessPercent,
                            numeracyReadiness: snapshot.numeracyReadinessPercent,
                            attentionEngagement: snapshot.attentionEngagementPercent,
                            processingMemory: snapshot.processingMemoryPercent
                        },
                        narrative: snapshot.coverageNarrative
                    },
                    impact: {
                        studentsSupported: snapshot.totalSupported,
                        averageImprovementByDomain: snapshot.averageImprovement,
                        riskLevelReduction: {
                            highSupportReduction: snapshot.highSupportReduction,
                            moderateSupportReduction: snapshot.moderateSupportReduction,
                            onTrackIncrease: snapshot.onTrackIncrease
                        },
                        timeSaved: {
                            manualObservationTimeSaved: snapshot.manualObservationTimeSaved,
                            lessonPlanningTimeSaved: snapshot.lessonPlanningTimeSaved,
                            trackingWorkloadTimeSaved: snapshot.trackingWorkloadTimeSaved,
                            differentiationSupportTimeSaved: snapshot.differentiationSupportTimeSaved,
                            totalTimeSaved: snapshot.totalTimeSaved
                        },
                        interventionEvidence: {
                            individualSupportPlansCreated: snapshot.individualSupportPlansCreated,
                            smallGroupInterventions: snapshot.smallGroupInterventions,
                            classroomStrategyRecommendations: snapshot.classroomStrategyRecommendations,
                            reviewCyclesCompleted: snapshot.reviewCyclesCompleted
                        },
                        narrative: snapshot.impactNarrative
                    },
                    narratives: {
                        executiveSummary: snapshot.executiveSummary,
                        recommendations: snapshot.recommendations
                    }
                }
            });

        } catch (error) {
            console.error('Get complete report data error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get report data'
            });
        }
    }

    /**
     * Get list of targeted students for deep assessment
     */
    static async getTargetedStudents(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { riskLevel } = req.query;

            const profile = await prisma.schoolViewerProfile.findUnique({
                where: { userId }
            });

            if (!profile) {
                throw new AppError('School viewer profile not found', 404);
            }

            // Build where clause
            const where: any = {
                schoolId: profile.schoolId,
                status: 'ACTIVE'
            };

            if (riskLevel) {
                where.riskCategory = riskLevel;
            } else {
                // Default: only HIGH_SUPPORT and MODERATE_SUPPORT
                where.riskCategory = {
                    in: ['HIGH_SUPPORT', 'MODERATE_SUPPORT']
                };
            }

            // Get students with their latest report
            const students = await prisma.student.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    grade: true,
                    riskCategory: true,
                    reports: {
                        where: { type: 'AI_COMPREHENSIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: { fullName: 'asc' }
            });

            // Format response
            const formattedStudents = students.map(student => ({
                id: student.id,
                name: student.fullName,
                grade: student.grade,
                riskCategory: student.riskCategory,
                latestReportId: student.reports[0]?.id || null,
                latestReportDate: student.reports[0]?.createdAt || null
            }));

            res.json({
                success: true,
                data: formattedStudents
            });

        } catch (error) {
            console.error('Get targeted students error:', error);
            res.status(error instanceof AppError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get targeted students'
            });
        }
    }
}

/**
 * Helper function to get default start date based on period type
 */
function getDefaultStartDate(periodType: ReportPeriodType): Date {
    const now = new Date();

    if (periodType === ReportPeriodType.MONTHLY) {
        return new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (periodType === ReportPeriodType.QUARTERLY) {
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
    } else {
        return new Date(now.getFullYear(), 0, 1);
    }
}
