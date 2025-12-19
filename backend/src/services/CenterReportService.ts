import { PrismaClient, ReportPeriodType, StudentStatus, IEPGoalStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

interface StudentCoverageStats {
    totalStudentsRegistered: number;
    studentsAssessed: number;
    studentsUnderIntervention: number;
    newStudentsThisPeriod: number;
    activeStudents: number;
    exitedMainstreamed: number;
}

interface AssessmentStats {
    totalAssessmentsConducted: number;
    baselineAssessments: number;
    reviewProgressAssessments: number;
    averageAssessmentTime: number | null;
    assessmentsPerEducator: number | null;
}

interface InterventionStats {
    individualInterventionPlans: number;
    smallGroupInterventions: number;
    totalInterventionSessions: number;
    avgSessionsPerStudent: number | null;
    avgDurationPerSession: number | null;
}

interface ProgressOutcomes {
    readingImprovement: number | null;
    writingImprovement: number | null;
    mathematicsImprovement: number | null;
    attentionBehaviorImprovement: number | null;
}

interface EducatorProductivity {
    activeSpecialEducators: number;
    avgStudentsPerEducator: number | null;
    avgSessionsPerEducator: number | null;
    avgReportsGenerated: number | null;
}

interface ComplianceStats {
    assessmentRecordsAvailable: number | null;
    interventionPlansDocumented: number | null;
    progressReviewsCompleted: number | null;
    parentReportsShared: number | null;
}

export class CenterReportService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Generate or retrieve cached center snapshot for a period
     * Uses caching to avoid expensive recalculations
     */
    async generateCenterSnapshot(
        centerId: string,
        periodType: ReportPeriodType,
        startDate: Date,
        endDate: Date
    ) {
        // Check for existing snapshot
        const existing = await this.prisma.centerReportSnapshot.findFirst({
            where: {
                centerId,
                periodType,
                periodStart: startDate,
                periodEnd: endDate
            }
        });

        if (existing) {
            console.log(`Using cached snapshot for center ${centerId}, period ${periodType}`);
            return existing;
        }

        console.log(`Generating new snapshot for center ${centerId}, period ${periodType}`);

        // Calculate all metrics in parallel
        const [
            coverageStats,
            assessmentStats,
            interventionStats,
            progressOutcomes,
            educatorProductivity,
            complianceStats,
            schoolsAndGrades
        ] = await Promise.all([
            this.calculateStudentCoverageStats(centerId, startDate, endDate),
            this.calculateAssessmentStats(centerId, startDate, endDate),
            this.calculateInterventionStats(centerId, startDate, endDate),
            this.calculateProgressOutcomes(centerId, startDate, endDate),
            this.calculateEducatorProductivity(centerId, startDate, endDate),
            this.calculateComplianceStats(centerId, startDate, endDate),
            this.getSchoolsAndGradesCovered(centerId)
        ]);

        // Create snapshot
        const snapshot = await this.prisma.centerReportSnapshot.create({
            data: {
                centerId,
                periodType,
                periodStart: startDate,
                periodEnd: endDate,
                ...coverageStats,
                ...assessmentStats,
                ...interventionStats,
                ...progressOutcomes,
                ...educatorProductivity,
                ...complianceStats,
                ...schoolsAndGrades
            }
        });

        return snapshot;
    }

    /**
     * Calculate student coverage statistics
     */
    private async calculateStudentCoverageStats(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<StudentCoverageStats> {
        const [
            totalStudentsRegistered,
            studentsAssessed,
            studentsUnderIntervention,
            newStudentsThisPeriod,
            activeStudents,
            exitedMainstreamed
        ] = await Promise.all([
            // Total students registered to this center
            this.prisma.student.count({
                where: { centerId }
            }),

            // Students with at least one assessment in this period
            this.prisma.student.count({
                where: {
                    centerId,
                    assessments: {
                        some: {
                            createdAt: { gte: startDate, lte: endDate }
                        }
                    }
                }
            }),

            // Students with active assignments (under intervention)
            this.prisma.student.count({
                where: {
                    centerId,
                    assignments: {
                        some: {
                            isActive: true
                        }
                    }
                }
            }),

            // New students registered in this period
            this.prisma.student.count({
                where: {
                    centerId,
                    registrationDate: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }),

            // Active students
            this.prisma.student.count({
                where: {
                    centerId,
                    status: StudentStatus.ACTIVE
                }
            }),

            // Exited or mainstreamed students (using INACTIVE status)
            this.prisma.student.count({
                where: {
                    centerId,
                    status: StudentStatus.INACTIVE
                }
            })
        ]);

        return {
            totalStudentsRegistered,
            studentsAssessed,
            studentsUnderIntervention,
            newStudentsThisPeriod,
            activeStudents,
            exitedMainstreamed
        };
    }

    /**
     * Calculate assessment statistics
     */
    private async calculateAssessmentStats(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<AssessmentStats> {
        // Get all assessments in this period
        const assessments = await this.prisma.assessment.findMany({
            where: {
                student: { centerId },
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                id: true,
                assessmentType: true,
                createdAt: true,
                completedAt: true
            }
        });

        const totalAssessmentsConducted = assessments.length;
        const baselineAssessments = assessments.filter(a => a.assessmentType === 'Initial').length;
        const reviewProgressAssessments = assessments.filter(a => a.assessmentType === 'Review').length;

        // Calculate average assessment time (in hours)
        const completedAssessments = assessments.filter(a => a.completedAt);
        const averageAssessmentTime = completedAssessments.length > 0
            ? completedAssessments.reduce((sum, a) => {
                const duration = (new Date(a.completedAt!).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
                return sum + duration;
            }, 0) / completedAssessments.length
            : null;

        // Get active educators count
        const activeEducators = await this.prisma.centerAssignment.count({
            where: {
                centerId,
                isActive: true,
                specialEducatorId: { not: null }
            }
        });

        const assessmentsPerEducator = activeEducators > 0
            ? totalAssessmentsConducted / activeEducators
            : null;

        return {
            totalAssessmentsConducted,
            baselineAssessments,
            reviewProgressAssessments,
            averageAssessmentTime: averageAssessmentTime ? Math.round(averageAssessmentTime * 10) / 10 : null,
            assessmentsPerEducator: assessmentsPerEducator ? Math.round(assessmentsPerEducator * 10) / 10 : null
        };
    }

    /**
     * Calculate intervention statistics
     */
    private async calculateInterventionStats(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<InterventionStats> {
        const [
            individualInterventionPlans,
            sessionNotes,
            studentsUnderIntervention
        ] = await Promise.all([
            // Count IEP goals created in this period
            this.prisma.iEPGoal.count({
                where: {
                    student: { centerId },
                    createdAt: { gte: startDate, lte: endDate }
                }
            }),

            // Get all session notes in this period
            this.prisma.sessionNote.findMany({
                where: {
                    student: { centerId },
                    sessionDate: { gte: startDate, lte: endDate }
                },
                select: {
                    id: true,
                    duration: true
                }
            }),

            // Count students with active assignments
            this.prisma.student.count({
                where: {
                    centerId,
                    assignments: {
                        some: {
                            isActive: true
                        }
                    }
                }
            })
        ]);

        const smallGroupInterventions = sessionNotes.length;
        const totalInterventionSessions = sessionNotes.length;

        const avgSessionsPerStudent = studentsUnderIntervention > 0
            ? totalInterventionSessions / studentsUnderIntervention
            : null;

        // Calculate average duration if duration field exists
        const sessionsWithDuration = sessionNotes.filter(s => s.duration);
        const avgDurationPerSession = sessionsWithDuration.length > 0
            ? sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / sessionsWithDuration.length
            : null;

        return {
            individualInterventionPlans,
            smallGroupInterventions,
            totalInterventionSessions,
            avgSessionsPerStudent: avgSessionsPerStudent ? Math.round(avgSessionsPerStudent * 10) / 10 : null,
            avgDurationPerSession: avgDurationPerSession ? Math.round(avgDurationPerSession * 10) / 10 : null
        };
    }

    /**
     * Calculate progress and outcome statistics by domain
     */
    private async calculateProgressOutcomes(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<ProgressOutcomes> {
        const domains = [
            { name: 'Reading', field: 'readingImprovement' },
            { name: 'Writing', field: 'writingImprovement' },
            { name: 'Mathematics', field: 'mathematicsImprovement' },
            { name: 'Attention & Behaviour', field: 'attentionBehaviorImprovement' }
        ];

        const improvements: any = {};

        for (const domain of domains) {
            const goals = await this.prisma.iEPGoal.findMany({
                where: {
                    student: { centerId },
                    domain: domain.name,
                    startDate: { lte: endDate }
                },
                include: {
                    progressUpdates: {
                        where: {
                            updateDate: { gte: startDate, lte: endDate }
                        },
                        orderBy: { updateDate: 'asc' }
                    }
                }
            });

            if (goals.length > 0) {
                let totalImprovement = 0;
                let goalsWithUpdates = 0;

                for (const goal of goals) {
                    const updates = goal.progressUpdates;
                    if (updates.length >= 2) {
                        const firstProgress = updates[0].progress;
                        const lastProgress = updates[updates.length - 1].progress;
                        totalImprovement += (lastProgress - firstProgress);
                        goalsWithUpdates++;
                    }
                }

                improvements[domain.field] = goalsWithUpdates > 0
                    ? Math.round((totalImprovement / goalsWithUpdates) * 10) / 10
                    : null;
            } else {
                improvements[domain.field] = null;
            }
        }

        return improvements as ProgressOutcomes;
    }

    /**
     * Calculate educator productivity metrics
     */
    private async calculateEducatorProductivity(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<EducatorProductivity> {
        const [
            activeSpecialEducators,
            totalStudents,
            totalSessions,
            totalReports
        ] = await Promise.all([
            // Count active special educators
            this.prisma.centerAssignment.count({
                where: {
                    centerId,
                    isActive: true,
                    specialEducatorId: { not: null }
                }
            }),

            // Count total students
            this.prisma.student.count({
                where: { centerId }
            }),

            // Count total sessions in period
            this.prisma.sessionNote.count({
                where: {
                    student: { centerId },
                    sessionDate: { gte: startDate, lte: endDate }
                }
            }),

            // Count reports generated in period
            this.prisma.report.count({
                where: {
                    student: { centerId },
                    createdAt: { gte: startDate, lte: endDate }
                }
            })
        ]);

        const avgStudentsPerEducator = activeSpecialEducators > 0
            ? totalStudents / activeSpecialEducators
            : null;

        const avgSessionsPerEducator = activeSpecialEducators > 0
            ? totalSessions / activeSpecialEducators
            : null;

        const avgReportsGenerated = activeSpecialEducators > 0
            ? totalReports / activeSpecialEducators
            : null;

        return {
            activeSpecialEducators,
            avgStudentsPerEducator: avgStudentsPerEducator ? Math.round(avgStudentsPerEducator * 10) / 10 : null,
            avgSessionsPerEducator: avgSessionsPerEducator ? Math.round(avgSessionsPerEducator * 10) / 10 : null,
            avgReportsGenerated: avgReportsGenerated ? Math.round(avgReportsGenerated * 10) / 10 : null
        };
    }

    /**
     * Calculate compliance and documentation statistics
     */
    private async calculateComplianceStats(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<ComplianceStats> {
        const [
            totalStudents,
            studentsWithAssessments,
            studentsUnderIntervention,
            studentsWithIEPGoals,
            totalIEPGoals,
            iepGoalsWithUpdates,
            totalReports,
            reportsSharedWithParents
        ] = await Promise.all([
            // Total students
            this.prisma.student.count({
                where: { centerId }
            }),

            // Students with at least one assessment
            this.prisma.student.count({
                where: {
                    centerId,
                    assessments: {
                        some: {}
                    }
                }
            }),

            // Students under intervention
            this.prisma.student.count({
                where: {
                    centerId,
                    assignments: {
                        some: {
                            isActive: true
                        }
                    }
                }
            }),

            // Students with IEP goals
            this.prisma.student.count({
                where: {
                    centerId,
                    iepGoals: {
                        some: {}
                    }
                }
            }),

            // Total IEP goals
            this.prisma.iEPGoal.count({
                where: {
                    student: { centerId }
                }
            }),

            // IEP goals with 2+ progress updates
            this.countIEPGoalsWithMultipleUpdates(centerId, startDate, endDate),

            // Total reports
            this.prisma.report.count({
                where: {
                    student: { centerId }
                }
            }),

            // Reports shared with parents (assuming there's a field for this)
            // For now, we'll count reports with status COMPLETED
            this.prisma.report.count({
                where: {
                    student: { centerId },
                    status: 'COMPLETED'
                }
            })
        ]);

        const assessmentRecordsAvailable = totalStudents > 0
            ? (studentsWithAssessments / totalStudents) * 100
            : null;

        const interventionPlansDocumented = studentsUnderIntervention > 0
            ? (studentsWithIEPGoals / studentsUnderIntervention) * 100
            : null;

        const progressReviewsCompleted = totalIEPGoals > 0
            ? (iepGoalsWithUpdates / totalIEPGoals) * 100
            : null;

        const parentReportsShared = totalReports > 0
            ? (reportsSharedWithParents / totalReports) * 100
            : null;

        return {
            assessmentRecordsAvailable: assessmentRecordsAvailable ? Math.round(assessmentRecordsAvailable * 10) / 10 : null,
            interventionPlansDocumented: interventionPlansDocumented ? Math.round(interventionPlansDocumented * 10) / 10 : null,
            progressReviewsCompleted: progressReviewsCompleted ? Math.round(progressReviewsCompleted * 10) / 10 : null,
            parentReportsShared: parentReportsShared ? Math.round(parentReportsShared * 10) / 10 : null
        };
    }

    /**
     * Count IEP goals with at least 2 progress updates
     */
    private async countIEPGoalsWithMultipleUpdates(
        centerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const goals = await this.prisma.iEPGoal.findMany({
            where: {
                student: { centerId },
                progressUpdates: {
                    some: {
                        updateDate: { gte: startDate, lte: endDate }
                    }
                }
            },
            include: {
                progressUpdates: {
                    where: {
                        updateDate: { gte: startDate, lte: endDate }
                    }
                }
            }
        });

        return goals.filter(goal => goal.progressUpdates.length >= 2).length;
    }

    /**
     * Get schools and grades covered by this center
     */
    private async getSchoolsAndGradesCovered(centerId: string): Promise<{
        schoolsCovered: string[];
        gradesCovered: string[];
    }> {
        const [schools, students] = await Promise.all([
            // Get unique schools
            this.prisma.school.findMany({
                where: { centerId },
                select: { name: true }
            }),

            // Get unique grades
            this.prisma.student.findMany({
                where: { centerId },
                select: { grade: true },
                distinct: ['grade']
            })
        ]);

        return {
            schoolsCovered: schools.map(s => s.name),
            gradesCovered: students.map(s => s.grade).sort()
        };
    }

    /**
     * Invalidate cache for a center and period
     */
    async invalidateCache(centerId: string, periodType?: ReportPeriodType): Promise<void> {
        const where: any = { centerId };
        if (periodType) {
            where.periodType = periodType;
        }

        await this.prisma.centerReportSnapshot.deleteMany({ where });
        console.log(`Cache invalidated for center ${centerId}`);
    }
}
