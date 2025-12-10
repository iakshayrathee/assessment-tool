import { PrismaClient, LongTermPlan, Domain, ReviewCycle, PlanStatus } from '@prisma/client';

export interface LongTermPlanData {
    studentId: string;
    diagnosis?: string;
    suspectedLD?: string;
    learningStrengths: string[];
    challengeAreas: string[];
    startDate: Date | string;
    endDate: Date | string;
    durationMonths: number;
    domains: Domain[];
    reviewCycle?: ReviewCycle;
    nextReviewDate: Date | string;
    goals: {
        goalStatement: string;
        domain: Domain;
        targetAccuracy?: number;
        order: number;
    }[];
}

export class LongTermPlanRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(specialEducatorId: string, data: LongTermPlanData): Promise<LongTermPlan> {
        return this.prisma.longTermPlan.create({
            data: {
                specialEducatorId,
                studentId: data.studentId,
                diagnosis: data.diagnosis,
                suspectedLD: data.suspectedLD,
                learningStrengths: data.learningStrengths,
                challengeAreas: data.challengeAreas,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                durationMonths: data.durationMonths,
                domains: data.domains,
                reviewCycle: data.reviewCycle || 'QUARTERLY',
                nextReviewDate: new Date(data.nextReviewDate),
                status: 'ACTIVE',
                goals: {
                    create: data.goals.map(goal => ({
                        goalStatement: goal.goalStatement,
                        domain: goal.domain,
                        targetAccuracy: goal.targetAccuracy || 80,
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
                goals: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    async findById(id: string): Promise<LongTermPlan | null> {
        return this.prisma.longTermPlan.findUnique({
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
                goals: {
                    orderBy: { order: 'asc' },
                },
                shortTermPlans: {
                    select: {
                        id: true,
                        stpGoal: true,
                        startDate: true,
                        endDate: true,
                        status: true,
                        progressPercentage: true,
                    },
                    orderBy: { startDate: 'desc' },
                },
            },
        });
    }

    async findByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ plans: LongTermPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            this.prisma.longTermPlan.findMany({
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
                    goals: {
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: {
                            shortTermPlans: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.longTermPlan.count({
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
            status?: PlanStatus;
            domain?: Domain;
        }
    ): Promise<{ plans: LongTermPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: any = { specialEducatorId };

        if (filters?.studentId) {
            where.studentId = filters.studentId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.domain) {
            where.domains = {
                has: filters.domain,
            };
        }

        const [plans, total] = await Promise.all([
            this.prisma.longTermPlan.findMany({
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
                    goals: {
                        orderBy: { order: 'asc' },
                    },
                    _count: {
                        select: {
                            shortTermPlans: true,
                        },
                    },
                },
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.longTermPlan.count({
                where,
            }),
        ]);

        return { plans, total };
    }

    async update(id: string, data: Partial<LongTermPlanData>): Promise<LongTermPlan> {
        const updateData: any = { ...data };

        if (data.startDate) {
            updateData.startDate = new Date(data.startDate);
        }

        if (data.endDate) {
            updateData.endDate = new Date(data.endDate);
        }

        if (data.nextReviewDate) {
            updateData.nextReviewDate = new Date(data.nextReviewDate);
        }

        // Handle goals update separately if provided
        if (data.goals) {
            // Delete existing goals and create new ones
            await this.prisma.longTermGoal.deleteMany({
                where: { longTermPlanId: id },
            });

            updateData.goals = {
                create: data.goals.map(goal => ({
                    goalStatement: goal.goalStatement,
                    domain: goal.domain,
                    targetAccuracy: goal.targetAccuracy || 80,
                    order: goal.order,
                })),
            };
        }

        return this.prisma.longTermPlan.update({
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
                goals: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.longTermPlan.delete({
            where: { id },
        });
    }

    async getWithHierarchy(id: string): Promise<any> {
        return this.prisma.longTermPlan.findUnique({
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
                goals: {
                    orderBy: { order: 'asc' },
                },
                shortTermPlans: {
                    include: {
                        subGoals: {
                            orderBy: { order: 'asc' },
                        },
                        weeklyLessonPlans: {
                            orderBy: { sessionDate: 'asc' },
                        },
                    },
                    orderBy: { startDate: 'desc' },
                },
            },
        });
    }
}
