import { PrismaClient, RiskCategory, ReportPeriodType, StudentStatus, IEPGoalStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

interface SkillAreaMetrics {
    readingReadinessPercent: number;
    writingReadinessPercent: number;
    numeracyReadinessPercent: number;
    attentionEngagementPercent: number;
    processingMemoryPercent: number;
}

interface RiskCategoryCounts {
    highSupportCount: number;
    moderateSupportCount: number;
    onTrackCount: number;
}

export class SchoolReportService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Generate or retrieve cached school snapshot for a period
     * Uses caching to avoid expensive recalculations
     */
    async generateSchoolSnapshot(
        schoolId: string,
        periodType: ReportPeriodType,
        startDate: Date,
        endDate: Date
    ) {
        // Check for existing snapshot
        const existing = await this.prisma.schoolReportSnapshot.findFirst({
            where: {
                schoolId,
                periodType,
                periodStart: startDate,
                periodEnd: endDate
            }
        });

        if (existing) {
            console.log(`Using cached snapshot for school ${schoolId}, period ${periodType}`);
            return existing;
        }


        console.log(`Generating new snapshot for school ${schoolId}, period ${periodType}`);

        // Calculate base metrics first
        const [
            totalEnrolled,
            totalScreened,
            totalSupported,
            gradesCovered,
            riskCategoryCounts,
            skillMetrics,
            totalSessions,
            averageImprovement
        ] = await Promise.all([
            this.getTotalEnrolled(schoolId, endDate),
            this.getTotalScreened(schoolId, startDate, endDate),
            this.getTotalSupported(schoolId, startDate, endDate),
            this.getGradesCovered(schoolId),
            this.calculateRiskCategories(schoolId),
            this.calculateSkillAreaMetrics(schoolId, startDate, endDate),
            this.getTotalSessions(schoolId, startDate, endDate),
            this.calculateAverageImprovement(schoolId, startDate, endDate)
        ]);

        // Calculate dependent metrics (that need totalSupported and totalSessions)
        const [
            progressLevels,
            newStudentsCount,
            timeSavings,
            interventionEvidence
        ] = await Promise.all([
            this.calculateProgressLevels(schoolId, startDate, endDate),
            this.calculateNewStudentsThisMonth(schoolId, startDate, endDate),
            this.calculateTimeSavings(totalSupported, totalSessions),
            this.calculateInterventionEvidence(schoolId, startDate, endDate)
        ]);

        // Get previous period for comparison
        const previousPeriod = await this.getPreviousPeriod(schoolId, periodType, startDate);
        const reductions = previousPeriod
            ? this.calculateReductions(riskCategoryCounts, previousPeriod)
            : { highSupportReduction: null, moderateSupportReduction: null, onTrackIncrease: null };

        // Create snapshot
        const snapshot = await this.prisma.schoolReportSnapshot.create({
            data: {
                schoolId,
                periodType,
                periodStart: startDate,
                periodEnd: endDate,
                totalEnrolled,
                totalScreened,
                totalSupported,
                gradesCovered,
                ...riskCategoryCounts,
                ...reductions,
                ...skillMetrics,
                totalSessions,
                averageImprovement: averageImprovement as any,
                // New metrics
                ...progressLevels,
                newStudentsThisMonth: newStudentsCount,
                ...timeSavings,
                ...interventionEvidence
            }
        });

        return snapshot;
    }

    /**
     * Calculate risk categories for all students in batches
     * Processes 100 students at a time to avoid memory issues
     */
    async calculateRiskCategories(
        schoolId: string,
        batchSize: number = 100
    ): Promise<RiskCategoryCounts> {
        const totalStudents = await this.prisma.student.count({
            where: { schoolId, status: StudentStatus.ACTIVE }
        });

        let highSupportCount = 0;
        let moderateSupportCount = 0;
        let onTrackCount = 0;

        // Process in batches
        for (let skip = 0; skip < totalStudents; skip += batchSize) {
            const students = await this.prisma.student.findMany({
                where: { schoolId, status: StudentStatus.ACTIVE },
                include: {
                    assessments: { orderBy: { createdAt: 'desc' }, take: 1 },
                    readingSkillAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
                    writingSkillAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
                    mathSkillAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
                    iepGoals: { where: { status: 'IN_PROGRESS' } }
                },
                skip,
                take: batchSize
            });

            // Process batch
            for (const student of students) {
                const category = this.determineRiskCategory(student);

                // Update student record
                await this.prisma.student.update({
                    where: { id: student.id },
                    data: {
                        riskCategory: category,
                        lastRiskAssessment: new Date()
                    }
                });

                if (category === RiskCategory.HIGH_SUPPORT) highSupportCount++;
                else if (category === RiskCategory.MODERATE_SUPPORT) moderateSupportCount++;
                else onTrackCount++;
            }

            console.log(`Processed batch ${skip / batchSize + 1} of ${Math.ceil(totalStudents / batchSize)}`);
        }

        return { highSupportCount, moderateSupportCount, onTrackCount };
    }

    /**
     * Determine risk category for a single student
     * Based on symptoms, IEP progress, and assessment levels
     */
    private determineRiskCategory(student: any): RiskCategory {
        // Count symptoms from skill assessments
        const readingSymptoms = this.countSymptoms(student.readingSkillAssessments[0]);
        const writingSymptoms = this.countSymptoms(student.writingSkillAssessments[0]);
        const mathSymptoms = this.countSymptoms(student.mathSkillAssessments[0]);
        const totalSymptoms = readingSymptoms + writingSymptoms + mathSymptoms;

        // Calculate average IEP progress
        const avgProgress = student.iepGoals.length > 0
            ? student.iepGoals.reduce((sum: number, g: any) => sum + g.progressPercent, 0) / student.iepGoals.length
            : 100;

        // Count domains below grade level
        const latestAssessment = student.assessments[0];
        const lowLevels = latestAssessment ? [
            latestAssessment.readingLevel === 'Below Grade Level',
            latestAssessment.writingLevel === 'Below Grade Level',
            latestAssessment.mathLevel === 'Below Grade Level'
        ].filter(Boolean).length : 0;

        // Categorization logic
        if (totalSymptoms >= 30 || avgProgress < 30 || lowLevels >= 2) {
            return RiskCategory.HIGH_SUPPORT;
        } else if (totalSymptoms >= 15 || avgProgress < 60 || lowLevels >= 1) {
            return RiskCategory.MODERATE_SUPPORT;
        } else {
            return RiskCategory.ON_TRACK;
        }
    }

    /**
     * Count boolean symptoms in an assessment
     */
    private countSymptoms(assessment: any): number {
        if (!assessment) return 0;

        let count = 0;
        Object.entries(assessment).forEach(([key, value]) => {
            if (typeof value === 'boolean' && value === true) {
                count++;
            }
        });

        return count;
    }

    /**
     * Calculate skill area metrics using database aggregations
     */
    async calculateSkillAreaMetrics(
        schoolId: string,
        startDate: Date,
        endDate: Date
    ): Promise<SkillAreaMetrics> {
        const students = await this.prisma.student.findMany({
            where: { schoolId, status: StudentStatus.ACTIVE },
            include: {
                readingSkillAssessments: {
                    where: { createdAt: { gte: startDate, lte: endDate } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                writingSkillAssessments: {
                    where: { createdAt: { gte: startDate, lte: endDate } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                mathSkillAssessments: {
                    where: { createdAt: { gte: startDate, lte: endDate } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                assessments: {
                    where: { createdAt: { gte: startDate, lte: endDate } },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const total = students.length || 1; // Avoid division by zero
        let readingNeedSupport = 0;
        let writingNeedSupport = 0;
        let numeracyNeedSupport = 0;
        let attentionNeedSupport = 0;
        let processingNeedSupport = 0;

        for (const student of students) {
            // Reading Readiness (15+ symptoms = needs support)
            if (this.countSymptoms(student.readingSkillAssessments[0]) >= 15) {
                readingNeedSupport++;
            }

            // Writing Readiness (15+ symptoms = needs support)
            if (this.countSymptoms(student.writingSkillAssessments[0]) >= 15) {
                writingNeedSupport++;
            }

            // Numeracy Readiness (15+ symptoms = needs support)
            if (this.countSymptoms(student.mathSkillAssessments[0]) >= 15) {
                numeracyNeedSupport++;
            }

            // Attention & Task Engagement (from assessment)
            const assessment = student.assessments[0];
            if (assessment?.attentionLevel === 'Below Grade Level') {
                attentionNeedSupport++;
            }

            // Processing & Memory (from VP and Motor assessments)
            if (assessment?.vpLevel === 'Below Grade Level' || assessment?.motorLevel === 'Below Grade Level') {
                processingNeedSupport++;
            }
        }

        return {
            readingReadinessPercent: Math.round((readingNeedSupport / total) * 100),
            writingReadinessPercent: Math.round((writingNeedSupport / total) * 100),
            numeracyReadinessPercent: Math.round((numeracyNeedSupport / total) * 100),
            attentionEngagementPercent: Math.round((attentionNeedSupport / total) * 100),
            processingMemoryPercent: Math.round((processingNeedSupport / total) * 100)
        };
    }

    /**
     * Calculate average improvement per domain
     */
    async calculateAverageImprovement(
        schoolId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Record<string, number>> {
        const domains = ['Reading', 'Writing', 'Math', 'Oral Language', 'Spelling'];
        const improvements: Record<string, number> = {};

        for (const domain of domains) {
            const goals = await this.prisma.iEPGoal.findMany({
                where: {
                    student: { schoolId },
                    domain,
                    startDate: { lte: endDate },
                    targetDate: { gte: startDate }
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
                const avgImprovement = goals.reduce((sum, goal) => {
                    const updates = goal.progressUpdates;
                    if (updates.length >= 2) {
                        const firstProgress = updates[0].progress;
                        const lastProgress = updates[updates.length - 1].progress;
                        return sum + (lastProgress - firstProgress);
                    }
                    return sum;
                }, 0) / goals.length;

                improvements[domain] = Math.round(avgImprovement);
            } else {
                improvements[domain] = 0;
            }
        }

        return improvements;
    }

    /**
     * Get total enrolled students
     */
    private async getTotalEnrolled(schoolId: string, endDate: Date): Promise<number> {
        return await this.prisma.student.count({
            where: {
                schoolId,
                registrationDate: { lte: endDate }
            }
        });
    }

    /**
     * Get total screened students (those with at least one assessment)
     */
    private async getTotalScreened(schoolId: string, startDate: Date, endDate: Date): Promise<number> {
        const studentsWithAssessments = await this.prisma.student.findMany({
            where: {
                schoolId,
                assessments: {
                    some: {
                        createdAt: { gte: startDate, lte: endDate }
                    }
                }
            },
            select: { id: true }
        });

        return studentsWithAssessments.length;
    }

    /**
     * Get total supported students (those with active assignments)
     */
    private async getTotalSupported(schoolId: string, startDate: Date, endDate: Date): Promise<number> {
        return await this.prisma.student.count({
            where: {
                schoolId,
                status: StudentStatus.ACTIVE,
                assignments: {
                    some: {
                        isActive: true,
                        assignedDate: { lte: endDate }
                    }
                }
            }
        });
    }

    /**
     * Get all grades covered in the school
     */
    private async getGradesCovered(schoolId: string): Promise<string[]> {
        const students = await this.prisma.student.findMany({
            where: { schoolId },
            select: { grade: true },
            distinct: ['grade']
        });

        return students.map(s => s.grade).sort();
    }

    /**
     * Get total sessions for the period
     */
    private async getTotalSessions(schoolId: string, startDate: Date, endDate: Date): Promise<number> {
        return await this.prisma.sessionNote.count({
            where: {
                student: { schoolId },
                sessionDate: { gte: startDate, lte: endDate }
            }
        });
    }

    /**
     * Get previous period snapshot for comparison
     */
    private async getPreviousPeriod(
        schoolId: string,
        periodType: ReportPeriodType,
        currentStart: Date
    ) {
        let previousStart: Date;
        let previousEnd: Date;

        if (periodType === ReportPeriodType.MONTHLY) {
            previousStart = new Date(currentStart);
            previousStart.setMonth(previousStart.getMonth() - 1);
            previousEnd = new Date(currentStart);
            previousEnd.setDate(previousEnd.getDate() - 1);
        } else if (periodType === ReportPeriodType.QUARTERLY) {
            previousStart = new Date(currentStart);
            previousStart.setMonth(previousStart.getMonth() - 3);
            previousEnd = new Date(currentStart);
            previousEnd.setDate(previousEnd.getDate() - 1);
        } else {
            previousStart = new Date(currentStart);
            previousStart.setFullYear(previousStart.getFullYear() - 1);
            previousEnd = new Date(currentStart);
            previousEnd.setDate(previousEnd.getDate() - 1);
        }

        return await this.prisma.schoolReportSnapshot.findFirst({
            where: {
                schoolId,
                periodType,
                periodStart: previousStart,
                periodEnd: previousEnd
            }
        });
    }

    /**
     * Calculate reductions compared to previous period
     */
    private calculateReductions(
        current: RiskCategoryCounts,
        previous: any
    ): {
        highSupportReduction: number | null;
        moderateSupportReduction: number | null;
        onTrackIncrease: number | null;
    } {
        const total = current.highSupportCount + current.moderateSupportCount + current.onTrackCount;
        const prevTotal = previous.highSupportCount + previous.moderateSupportCount + previous.onTrackCount;

        if (prevTotal === 0) {
            return {
                highSupportReduction: null,
                moderateSupportReduction: null,
                onTrackIncrease: null
            };
        }

        const highSupportReduction = ((previous.highSupportCount / prevTotal) - (current.highSupportCount / total)) * 100;
        const moderateSupportReduction = ((previous.moderateSupportCount / prevTotal) - (current.moderateSupportCount / total)) * 100;
        const onTrackIncrease = ((current.onTrackCount / total) - (previous.onTrackCount / prevTotal)) * 100;

        return {
            highSupportReduction: Math.round(highSupportReduction * 10) / 10,
            moderateSupportReduction: Math.round(moderateSupportReduction * 10) / 10,
            onTrackIncrease: Math.round(onTrackIncrease * 10) / 10
        };
    }

    /**
     * Invalidate cache for a school and period
     */
    async invalidateCache(schoolId: string, periodType?: ReportPeriodType): Promise<void> {
        const where: any = { schoolId };
        if (periodType) {
            where.periodType = periodType;
        }

        await this.prisma.schoolReportSnapshot.deleteMany({ where });
        console.log(`Cache invalidated for school ${schoolId}`);
    }

    /**
     * Calculate student progress levels based on IEP goal progress trends
     */
    async calculateProgressLevels(
        schoolId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        studentsImproving: number;
        studentsStable: number;
        studentsRequiringAttention: number;
    }> {
        const students = await this.prisma.student.findMany({
            where: { schoolId, status: StudentStatus.ACTIVE },
            include: {
                iepGoals: {
                    where: {
                        status: IEPGoalStatus.IN_PROGRESS,
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
                }
            }
        });

        let improving = 0;
        let stable = 0;
        let requiresAttention = 0;

        for (const student of students) {
            if (student.iepGoals.length === 0) {
                stable++;
                continue;
            }

            // Calculate average progress change across all goals
            let totalProgressChange = 0;
            let goalsWithUpdates = 0;

            for (const goal of student.iepGoals) {
                const updates = goal.progressUpdates;
                if (updates.length >= 2) {
                    const firstProgress = updates[0].progress;
                    const lastProgress = updates[updates.length - 1].progress;
                    totalProgressChange += (lastProgress - firstProgress);
                    goalsWithUpdates++;
                }
            }

            if (goalsWithUpdates === 0) {
                stable++;
                continue;
            }

            const avgProgressChange = totalProgressChange / goalsWithUpdates;

            // Categorize based on average progress change
            if (avgProgressChange > 5) {
                improving++;
            } else if (avgProgressChange < -5) {
                requiresAttention++;
            } else {
                stable++;
            }
        }

        return {
            studentsImproving: improving,
            studentsStable: stable,
            studentsRequiringAttention: requiresAttention
        };
    }

    /**
     * Calculate number of new students added in the period
     */
    async calculateNewStudentsThisMonth(
        schoolId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        return await this.prisma.student.count({
            where: {
                schoolId,
                registrationDate: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
    }

    /**
     * Calculate time saved for teachers using the platform
     */
    async calculateTimeSavings(
        totalSupported: number,
        totalSessions: number
    ): Promise<{
        manualObservationTimeSaved: number;
        lessonPlanningTimeSaved: number;
        trackingWorkloadTimeSaved: number;
        differentiationSupportTimeSaved: number;
        totalTimeSaved: number;
    }> {
        // Manual observation time: 25 min saved per student per month
        const manualObservationTimeSaved = Math.round((25 * totalSupported) / 60);

        // Lesson planning: 1.5 hours saved per week = 6 hours per month
        const lessonPlanningTimeSaved = 6;

        // Individual tracking: 13 min saved per student per week = 52 min per month
        const trackingWorkloadTimeSaved = Math.round((13 * totalSupported * 4) / 60);

        // Classroom differentiation: 2 hours saved per week = 8 hours per month
        const differentiationSupportTimeSaved = 8;

        const totalTimeSaved =
            manualObservationTimeSaved +
            lessonPlanningTimeSaved +
            trackingWorkloadTimeSaved +
            differentiationSupportTimeSaved;

        return {
            manualObservationTimeSaved,
            lessonPlanningTimeSaved,
            trackingWorkloadTimeSaved,
            differentiationSupportTimeSaved,
            totalTimeSaved
        };
    }

    /**
     * Calculate evidence of interventions
     */
    async calculateInterventionEvidence(
        schoolId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        individualSupportPlansCreated: number;
        smallGroupInterventions: number;
        classroomStrategyRecommendations: number;
        reviewCyclesCompleted: number;
    }> {
        const [
            supportPlans,
            groupSessions,
            aiReports,
            reviewCycles
        ] = await Promise.all([
            // Individual Support Plans (IEP Goals created)
            this.prisma.iEPGoal.count({
                where: {
                    student: { schoolId },
                    createdAt: { gte: startDate, lte: endDate }
                }
            }),

            // Small-Group Interventions (Session notes in period)
            this.prisma.sessionNote.count({
                where: {
                    student: { schoolId },
                    sessionDate: { gte: startDate, lte: endDate }
                }
            }),

            // Classroom Strategy Recommendations (AI reports generated)
            this.prisma.report.count({
                where: {
                    student: { schoolId },
                    type: 'AI_COMPREHENSIVE',
                    createdAt: { gte: startDate, lte: endDate }
                }
            }),

            // Review Cycles (IEP goals with 2+ progress updates)
            this.countReviewCycles(schoolId, startDate, endDate)
        ]);

        return {
            individualSupportPlansCreated: supportPlans,
            smallGroupInterventions: groupSessions,
            classroomStrategyRecommendations: aiReports,
            reviewCyclesCompleted: reviewCycles
        };
    }

    /**
     * Count IEP goals with at least 2 progress updates (completed review cycles)
     */
    private async countReviewCycles(
        schoolId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const goals = await this.prisma.iEPGoal.findMany({
            where: {
                student: { schoolId },
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

        // Count goals with 2 or more updates
        return goals.filter(goal => goal.progressUpdates.length >= 2).length;
    }

}
