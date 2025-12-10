import { PrismaClient, ShortTermPlan, PlanStatus } from '@prisma/client';

export interface ShortTermPlanData {
    longTermPlanId: string;
    studentId: string;
    linkedLongTermGoalId?: string;
    linkedGoalStatement: string;
    startDate: Date | string;
    endDate: Date | string;
    durationWeeks: number;
    stpGoal: string;
    interventionStrategy: string[];
    weeklyProbes?: boolean;
    targetAccuracy?: number;
    promptReduction?: boolean;
    subGoals: {
        goalStatement: string;
        order: number;
    }[];
}

export class ShortTermPlanRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(specialEducatorId: string, data: ShortTermPlanData): Promise<ShortTermPlan> {
        return this.prisma.shortTermPlan.create({
            data: {
                specialEducatorId,
                longTermPlanId: data.longTermPlanId,
                studentId: data.studentId,
                linkedLongTermGoalId: data.linkedLongTermGoalId,
                linkedGoalStatement: data.linkedGoalStatement,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                durationWeeks: data.durationWeeks,
                stpGoal: data.stpGoal,
                interventionStrategy: data.interventionStrategy,
                weeklyProbes: data.weeklyProbes ?? true,
                targetAccuracy: data.targetAccuracy || 80,
                promptReduction: data.promptReduction ?? true,
                status: 'ACTIVE',
                progressPercentage: 0,
                subGoals: {
                    create: data.subGoals.map(goal => ({
                        goalStatement: goal.goalStatement,
                        order: goal.order,
                    })),
                },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        grade: true,
                        age: true,
                    },
                },
                specialEducator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                longTermPlan: {
                    select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                    },
                },
                subGoals: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    async findById(id: string): Promise<ShortTermPlan | null> {
        return this.prisma.shortTermPlan.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        grade: true,
                        age: true,
                    },
                },
                specialEducator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                longTermPlan: {
                    select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                        goals: true,
                    },
                },
                subGoals: {
                    orderBy: { order: 'asc' },
                },
                weeklyLessonPlans: {
                    select: {
                        id: true,
                        weekNumber: true,
                        sessionDate: true,
                        topics: true,
                        status: true,
                    },
                    orderBy: { sessionDate: 'asc' },
                },
            },
        });
    }

    async findByLongTermPlan(longTermPlanId: string, page: number = 1, limit: number = 20): Promise<{ plans: ShortTermPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            this.prisma.shortTermPlan.findMany({
                where: { longTermPlanId },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            grade: true,
                            age: true,
                        },
                    },
                    specialEducator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    subGoals: {
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: {
                            weeklyLessonPlans: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.shortTermPlan.count({
                where: { longTermPlanId },
            }),
        ]);

        return { plans, total };
    }

    async findByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ plans: ShortTermPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            this.prisma.shortTermPlan.findMany({
                where: { studentId },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            grade: true,
                            age: true,
                        },
                    },
                    specialEducator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    longTermPlan: {
                        select: {
                            id: true,
                            startDate: true,
                            endDate: true,
                        },
                    },
                    subGoals: {
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: {
                            weeklyLessonPlans: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.shortTermPlan.count({
                where: { studentId },
            }),
        ]);

        return { plans, total };
    }

    async findByEducator(
        specialEducatorId: string,
        page: number = 1,
        limit: number = 20,
        filters?: {
            studentId?: string;
            longTermPlanId?: string;
            status?: PlanStatus;
        }
    ): Promise<{ plans: ShortTermPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: any = { specialEducatorId };

        if (filters?.studentId) {
            where.studentId = filters.studentId;
        }

        if (filters?.longTermPlanId) {
            where.longTermPlanId = filters.longTermPlanId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        const [plans, total] = await Promise.all([
            this.prisma.shortTermPlan.findMany({
                where,
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            grade: true,
                            age: true,
                        },
                    },
                    specialEducator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    longTermPlan: {
                        select: {
                            id: true,
                            startDate: true,
                            endDate: true,
                        },
                    },
                    subGoals: {
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: {
                            weeklyLessonPlans: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.shortTermPlan.count({
                where,
            }),
        ]);

        return { plans, total };
    }

    async update(id: string, data: Partial<ShortTermPlanData>): Promise<ShortTermPlan> {
        const updateData: any = { ...data };

        if (data.startDate) {
            updateData.startDate = new Date(data.startDate);
        }

        if (data.endDate) {
            updateData.endDate = new Date(data.endDate);
        }

        // Handle sub-goals update separately if provided
        if (data.subGoals) {
            // Delete existing sub-goals and create new ones
            await this.prisma.shortTermSubGoal.deleteMany({
                where: { shortTermPlanId: id },
            });

            updateData.subGoals = {
                create: data.subGoals.map((goal: any) => ({
                    goalStatement: goal.goalStatement,
                    order: goal.order,
                    isAchieved: goal.isAchieved || false,
                    achievedDate: goal.achievedDate ? new Date(goal.achievedDate) : null,
                })),
            };
        }

        const updated = await this.prisma.shortTermPlan.update({
            where: { id },
            data: updateData,
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        grade: true,
                        age: true,
                    },
                },
                specialEducator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                longTermPlan: {
                    select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                    },
                },
                subGoals: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        // Recalculate progress if sub-goals were updated
        if (data.subGoals) {
            return await this.updateProgress(id);
        }

        return updated;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.shortTermPlan.delete({
            where: { id },
        });
    }

    async getWithWeeklyPlans(id: string): Promise<any> {
        return this.prisma.shortTermPlan.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        grade: true,
                        age: true,
                    },
                },
                specialEducator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                longTermPlan: {
                    select: {
                        id: true,
                        startDate: true,
                        endDate: true,
                        goals: true,
                    },
                },
                subGoals: {
                    orderBy: { order: 'asc' },
                },
                weeklyLessonPlans: {
                    orderBy: { sessionDate: 'asc' },
                },
            },
        });
    }

    async updateProgress(id: string): Promise<ShortTermPlan> {
        // Calculate progress based on achieved sub-goals
        const plan = await this.prisma.shortTermPlan.findUnique({
            where: { id },
            include: {
                subGoals: true,
            },
        });

        if (!plan) {
            throw new Error('Short-term plan not found');
        }

        const totalGoals = plan.subGoals.length;
        const achievedGoals = plan.subGoals.filter(g => g.isAchieved).length;
        const progressPercentage = totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0;

        return this.prisma.shortTermPlan.update({
            where: { id },
            data: { progressPercentage },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        grade: true,
                        age: true,
                    },
                },
                specialEducator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                subGoals: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }
}
