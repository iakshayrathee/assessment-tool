import { PrismaClient, WeeklyLessonPlan, LessonStatus } from '@prisma/client';

export interface WeeklyLessonPlanData {
    shortTermPlanId?: string;
    studentId: string;
    weekNumber: number;
    sessionDate: Date | string;
    topics: string;
    areasOfRemediation: string[];
    averageTime?: number;
    actualTime?: number;
    motivationStrategy?: string;
    resourcesUsed: string[];
    outcome?: string;
    status?: LessonStatus;
}

export class WeeklyLessonPlanRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(specialEducatorId: string, data: WeeklyLessonPlanData): Promise<WeeklyLessonPlan> {
        return this.prisma.weeklyLessonPlan.create({
            data: {
                specialEducatorId,
                shortTermPlanId: data.shortTermPlanId,
                studentId: data.studentId,
                weekNumber: data.weekNumber,
                sessionDate: new Date(data.sessionDate),
                topics: data.topics,
                areasOfRemediation: data.areasOfRemediation,
                averageTime: data.averageTime,
                actualTime: data.actualTime,
                motivationStrategy: data.motivationStrategy,
                resourcesUsed: data.resourcesUsed,
                outcome: data.outcome,
                status: data.status || 'PLANNED',
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
                shortTermPlan: {
                    select: {
                        id: true,
                        stpGoal: true,
                        longTermPlanId: true,
                    },
                },
            },
        });
    }

    async findById(id: string): Promise<WeeklyLessonPlan | null> {
        return this.prisma.weeklyLessonPlan.findUnique({
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
                shortTermPlan: {
                    select: {
                        id: true,
                        stpGoal: true,
                        longTermPlanId: true,
                        longTermPlan: {
                            select: {
                                id: true,
                                goals: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findByShortTermPlan(shortTermPlanId: string, page: number = 1, limit: number = 20): Promise<{ plans: WeeklyLessonPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            this.prisma.weeklyLessonPlan.findMany({
                where: { shortTermPlanId },
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
                },
                orderBy: { sessionDate: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.weeklyLessonPlan.count({
                where: { shortTermPlanId },
            }),
        ]);

        return { plans, total };
    }

    async findByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ plans: WeeklyLessonPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const [plans, total] = await Promise.all([
            this.prisma.weeklyLessonPlan.findMany({
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
                    shortTermPlan: {
                        select: {
                            id: true,
                            stpGoal: true,
                        },
                    },
                },
                orderBy: { sessionDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.weeklyLessonPlan.count({
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
            shortTermPlanId?: string;
            status?: LessonStatus;
            dateFrom?: Date;
            dateTo?: Date;
        }
    ): Promise<{ plans: WeeklyLessonPlan[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: any = { specialEducatorId };

        if (filters?.studentId) {
            where.studentId = filters.studentId;
        }

        if (filters?.shortTermPlanId) {
            where.shortTermPlanId = filters.shortTermPlanId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.dateFrom || filters?.dateTo) {
            where.sessionDate = {};
            if (filters.dateFrom) {
                where.sessionDate.gte = filters.dateFrom;
            }
            if (filters.dateTo) {
                where.sessionDate.lte = filters.dateTo;
            }
        }

        const [plans, total] = await Promise.all([
            this.prisma.weeklyLessonPlan.findMany({
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
                    shortTermPlan: {
                        select: {
                            id: true,
                            stpGoal: true,
                        },
                    },
                },
                orderBy: { sessionDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.weeklyLessonPlan.count({
                where,
            }),
        ]);

        return { plans, total };
    }

    async update(id: string, data: Partial<WeeklyLessonPlanData>): Promise<WeeklyLessonPlan> {
        const updateData: any = { ...data };

        if (data.sessionDate) {
            updateData.sessionDate = new Date(data.sessionDate);
        }

        return this.prisma.weeklyLessonPlan.update({
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
                shortTermPlan: {
                    select: {
                        id: true,
                        stpGoal: true,
                    },
                },
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.weeklyLessonPlan.delete({
            where: { id },
        });
    }

    async getNextWeekNumber(shortTermPlanId: string): Promise<number> {
        const lastPlan = await this.prisma.weeklyLessonPlan.findFirst({
            where: { shortTermPlanId },
            orderBy: { weekNumber: 'desc' },
            select: { weekNumber: true },
        });

        return lastPlan ? lastPlan.weekNumber + 1 : 1;
    }
}
