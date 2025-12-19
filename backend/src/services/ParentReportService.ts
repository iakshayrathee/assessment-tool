import { PrismaClient, ReportPeriodType } from '@prisma/client';

export class ParentReportService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Generate parent report snapshot
     */
    async generateParentSnapshot(
        studentId: string,
        parentId: string,
        periodType: ReportPeriodType,
        startDate: Date,
        endDate: Date
    ) {
        // Check if snapshot already exists for this period
        const existingSnapshot = await this.prisma.parentReportSnapshot.findFirst({
            where: {
                studentId,
                periodType,
                periodStart: startDate,
                periodEnd: endDate
            }
        });

        if (existingSnapshot) {
            console.log('Using existing parent report snapshot');
            return existingSnapshot;
        }

        console.log('Generating new parent report snapshot...');

        // Calculate all metrics in parallel
        const [
            studentInfo,
            assessmentSummary,
            progressTracking,
            attendanceStats,
            interventionPlan
        ] = await Promise.all([
            this.calculateStudentInfo(studentId),
            this.calculateAssessmentSummary(studentId, startDate, endDate),
            this.calculateProgressTracking(studentId, startDate, endDate),
            this.calculateAttendanceStats(studentId, startDate, endDate),
            this.calculateInterventionPlan(studentId)
        ]);

        // Create snapshot
        const snapshot = await this.prisma.parentReportSnapshot.create({
            data: {
                studentId,
                parentId,
                periodType,
                periodStart: startDate,
                periodEnd: endDate,
                ...studentInfo,
                ...assessmentSummary,
                ...progressTracking,
                ...attendanceStats,
                ...interventionPlan,
                parentFriendlySummary: this.generateParentFriendlySummary(interventionPlan),
                nextReviewDate: this.calculateNextReviewDate(periodType, endDate)
            }
        });

        return snapshot;
    }

    /**
     * Calculate student basic information
     */
    private async calculateStudentInfo(studentId: string) {
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            include: {
                assignments: {
                    include: {
                        specialEducator: {
                            select: {
                                fullName: true
                            }
                        }
                    },
                    take: 1,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!student) {
            throw new Error('Student not found');
        }

        return {
            studentName: student.fullName,
            studentGrade: student.grade,
            studentAge: student.age,
            enrollmentDate: student.registrationDate,
            assignedEducatorName: student.assignments[0]?.specialEducator?.fullName || null
        };
    }

    /**
     * Calculate assessment summary - simplified to avoid non-existent fields
     */
    private async calculateAssessmentSummary(studentId: string, startDate: Date, endDate: Date) {
        // Count total assessments in period
        const assessments = await this.prisma.assessment.findMany({
            where: {
                studentId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: 'COMPLETED'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const totalAssessments = assessments.length;
        const latestAssessment = assessments[0];

        // Get student's risk category
        const student = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: { riskCategory: true }
        });

        return {
            totalAssessments,
            latestAssessmentDate: latestAssessment?.createdAt || null,
            latestAssessmentScore: null, // Assessment model doesn't have a single score field
            riskLevel: student?.riskCategory || null,
            assessmentProgress: totalAssessments > 0
                ? `${totalAssessments} assessment${totalAssessments > 1 ? 's' : ''} completed during this period`
                : 'No assessments completed yet'
        };
    }

    /**
     * Calculate progress tracking from IEP goals - using actual schema fields
     */
    private async calculateProgressTracking(studentId: string, startDate: Date, endDate: Date) {
        // Get IEP goals with their progress updates
        const iepGoals = await this.prisma.iEPGoal.findMany({
            where: {
                studentId,
                createdAt: {
                    lte: endDate
                }
            },
            include: {
                progressUpdates: {
                    where: {
                        updateDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    orderBy: {
                        updateDate: 'desc'
                    }
                }
            }
        });

        // Calculate progress by domain
        const domainProgress: Record<string, number[]> = {
            READING: [],
            WRITING: [],
            MATHEMATICS: [],
            ATTENTION: []
        };

        iepGoals.forEach(goal => {
            const latestUpdate = goal.progressUpdates[0];
            if (latestUpdate && goal.domain) {
                const domain = goal.domain.toUpperCase();
                if (domainProgress[domain]) {
                    domainProgress[domain].push(latestUpdate.progress);
                }
            }
        });

        // Calculate average progress for each domain
        const calculateAverage = (values: number[]) =>
            values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

        // Calculate overall goal completion
        const allProgress = Object.values(domainProgress).flat();
        const overallGoalCompletion = calculateAverage(allProgress);

        return {
            readingProgress: calculateAverage(domainProgress.READING),
            writingProgress: calculateAverage(domainProgress.WRITING),
            mathProgress: calculateAverage(domainProgress.MATHEMATICS),
            attentionProgress: calculateAverage(domainProgress.ATTENTION),
            overallGoalCompletion
        };
    }

    /**
     * Calculate attendance statistics from session notes
     */
    private async calculateAttendanceStats(studentId: string, startDate: Date, endDate: Date) {
        const sessions = await this.prisma.sessionNote.findMany({
            where: {
                studentId,
                sessionDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                sessionDate: 'desc'
            }
        });

        const totalSessionsScheduled = sessions.length;
        // Assume all sessions in DB are attended (no attendance field in schema)
        const sessionsAttended = sessions.length;
        const participationRate = totalSessionsScheduled > 0
            ? (sessionsAttended / totalSessionsScheduled) * 100
            : null;

        return {
            totalSessionsScheduled,
            sessionsAttended,
            participationRate,
            lastSessionDate: sessions[0]?.sessionDate || null
        };
    }

    /**
     * Calculate intervention plan from LongTermPlan and ShortTermPlan created by educators
     */
    private async calculateInterventionPlan(studentId: string) {
        // Get the most recent active Long-Term Plan with its goals and short-term plans
        const longTermPlan = await this.prisma.longTermPlan.findFirst({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            include: {
                goals: {
                    where: {
                        isAchieved: false
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
                shortTermPlans: {
                    where: {
                        status: 'ACTIVE'
                    },
                    include: {
                        subGoals: {
                            where: {
                                isAchieved: false
                            },
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        startDate: 'desc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Also get weekly lesson plans as they contain intervention strategies
        const weeklyPlans = await this.prisma.weeklyLessonPlan.findMany({
            where: {
                studentId,
                status: 'PLANNED'
            },
            orderBy: {
                sessionDate: 'desc'
            },
            take: 10 // Get recent 10 plans
        });

        if (!longTermPlan) {
            // No intervention plan created yet - return empty data
            return {
                focusReading: false,
                focusWriting: false,
                focusMathematics: false,
                focusAttention: false,
                focusConfidence: false,
                shortTermGoals: null,
                longTermGoals: null,
                readingStrategy: null,
                writingStrategy: null,
                mathematicsStrategy: null,
                attentionStrategy: null,
                confidenceStrategy: null,
                educatorNotes: null
            };
        }

        // Extract focus areas from LongTermPlan.domains array
        const domains = longTermPlan.domains || [];
        const focusAreas = {
            focusReading: domains.includes('READING'),
            focusWriting: domains.includes('WRITING'),
            focusMathematics: domains.includes('MATH'),
            focusAttention: domains.includes('COGNITIVE'),
            focusConfidence: domains.includes('BEHAVIOURAL')
        };

        // Extract long-term goals from LongTermGoal model
        const longTermGoalsText = longTermPlan.goals
            .map(goal => `${goal.domain}: ${goal.goalStatement}`)
            .join('\n\n');

        // Extract short-term goals from ShortTermSubGoal model
        const shortTermGoalsText = longTermPlan.shortTermPlans
            .flatMap(stp =>
                stp.subGoals.map(subGoal => subGoal.goalStatement)
            )
            .join('\n\n');

        // Extract intervention strategies from ShortTermPlan.interventionStrategy arrays
        const strategiesByDomain: Record<string, Set<string>> = {
            READING: new Set(),
            WRITING: new Set(),
            MATH: new Set(),
            COGNITIVE: new Set(),
            MOTOR: new Set(),
            BEHAVIOURAL: new Set(),
            ORAL_LANGUAGE: new Set(),
            SPELLING: new Set()
        };

        // Get strategies from ShortTermPlans
        longTermPlan.shortTermPlans.forEach(stp => {
            // Get the domain from the linked goal statement
            const linkedGoal = longTermPlan.goals.find(g =>
                stp.linkedGoalStatement && stp.linkedGoalStatement.includes(g.goalStatement)
            );

            if (linkedGoal && stp.interventionStrategy) {
                const domain = linkedGoal.domain;
                if (strategiesByDomain[domain]) {
                    stp.interventionStrategy.forEach(strategy => {
                        strategiesByDomain[domain].add(strategy);
                    });
                }
            }
        });

        // Also extract strategies from WeeklyLessonPlans
        weeklyPlans.forEach(plan => {
            // Add areas of remediation and resources as strategies
            if (plan.areasOfRemediation) {
                plan.areasOfRemediation.forEach(area => {
                    // Try to match to domains
                    if (area.toLowerCase().includes('read')) {
                        strategiesByDomain.READING.add(area);
                    } else if (area.toLowerCase().includes('writ')) {
                        strategiesByDomain.WRITING.add(area);
                    } else if (area.toLowerCase().includes('math')) {
                        strategiesByDomain.MATHEMATICS.add(area);
                    }
                });
            }
            if (plan.resourcesUsed) {
                // Add resources to all active domains
                domains.forEach(domain => {
                    if (strategiesByDomain[domain]) {
                        plan.resourcesUsed.forEach(resource => {
                            strategiesByDomain[domain].add(resource);
                        });
                    }
                });
            }
            if (plan.motivationStrategy) {
                // Add motivation strategy to all domains
                domains.forEach(domain => {
                    if (strategiesByDomain[domain]) {
                        strategiesByDomain[domain].add(plan.motivationStrategy!);
                    }
                });
            }
        });

        // Convert sets to comma-separated strings
        const createStrategyText = (strategies: Set<string>) => {
            if (strategies.size === 0) return null;
            return Array.from(strategies).join(', ');
        };

        // Map domain-specific strategies to the report fields
        const readingStrategies = new Set([
            ...strategiesByDomain.READING,
            ...strategiesByDomain.ORAL_LANGUAGE
        ]);
        const writingStrategies = new Set([
            ...strategiesByDomain.WRITING,
            ...strategiesByDomain.SPELLING
        ]);

        return {
            ...focusAreas,
            shortTermGoals: shortTermGoalsText || null,
            longTermGoals: longTermGoalsText || null,
            readingStrategy: createStrategyText(readingStrategies),
            writingStrategy: createStrategyText(writingStrategies),
            mathematicsStrategy: createStrategyText(strategiesByDomain.MATH),
            attentionStrategy: createStrategyText(strategiesByDomain.COGNITIVE),
            confidenceStrategy: createStrategyText(strategiesByDomain.BEHAVIOURAL),
            educatorNotes: longTermPlan.challengeAreas?.join(', ') || null
        };
    }

    /**
     * Generate parent-friendly summary
     */
    private generateParentFriendlySummary(interventionPlan: any): string {
        const focusCount = [
            interventionPlan.focusReading,
            interventionPlan.focusWriting,
            interventionPlan.focusMathematics,
            interventionPlan.focusAttention,
            interventionPlan.focusConfidence
        ].filter(Boolean).length;

        if (focusCount === 0) {
            return 'Your child is making good progress. We will continue to monitor and support their learning journey.';
        }

        return `Your child is receiving targeted support in ${focusCount} key area${focusCount > 1 ? 's' : ''}. We are working together to help them achieve their learning goals through personalized strategies and regular progress monitoring.`;
    }

    /**
     * Calculate next review date based on period type
     */
    private calculateNextReviewDate(periodType: ReportPeriodType, currentEndDate: Date): Date {
        const nextReview = new Date(currentEndDate);

        switch (periodType) {
            case 'MONTHLY':
                nextReview.setMonth(nextReview.getMonth() + 1);
                break;
            case 'QUARTERLY':
                nextReview.setMonth(nextReview.getMonth() + 3);
                break;
            case 'YEARLY':
                nextReview.setFullYear(nextReview.getFullYear() + 1);
                break;
        }

        return nextReview;
    }

    /**
     * List parent snapshots with pagination
     */
    async listParentSnapshots(
        studentId: string,
        parentId: string,
        params: {
            page?: number;
            limit?: number;
            periodType?: ReportPeriodType;
        }
    ) {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            studentId,
            parentId
        };

        if (params.periodType) {
            where.periodType = params.periodType;
        }

        const [snapshots, total] = await Promise.all([
            this.prisma.parentReportSnapshot.findMany({
                where,
                orderBy: {
                    periodStart: 'desc'
                },
                skip,
                take: limit
            }),
            this.prisma.parentReportSnapshot.count({ where })
        ]);

        return {
            data: snapshots,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
