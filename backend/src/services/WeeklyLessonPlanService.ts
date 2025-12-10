import { PrismaClient, WeeklyLessonPlan, LessonStatus } from '@prisma/client';
import { WeeklyLessonPlanRepository, WeeklyLessonPlanData } from '../repositories/WeeklyLessonPlanRepository';

export class WeeklyLessonPlanService {
    private repository: WeeklyLessonPlanRepository;

    constructor(prisma: PrismaClient) {
        this.repository = new WeeklyLessonPlanRepository(prisma);
    }

    async createWeeklyLessonPlan(specialEducatorId: string, data: WeeklyLessonPlanData): Promise<WeeklyLessonPlan> {
        // Validation
        if (!data.studentId) {
            throw new Error('Student ID is required');
        }

        if (!data.sessionDate) {
            throw new Error('Session date is required');
        }

        if (!data.topics) {
            throw new Error('Topics are required');
        }

        if (!data.areasOfRemediation || data.areasOfRemediation.length === 0) {
            throw new Error('At least one area of remediation is required');
        }

        if (!data.resourcesUsed || data.resourcesUsed.length === 0) {
            throw new Error('At least one resource is required');
        }

        // Auto-generate week number if linked to STP
        if (data.shortTermPlanId && !data.weekNumber) {
            data.weekNumber = await this.repository.getNextWeekNumber(data.shortTermPlanId);
        } else if (!data.weekNumber) {
            data.weekNumber = 1; // Default for standalone plans
        }

        return await this.repository.create(specialEducatorId, data);
    }

    async getWeeklyLessonPlanById(id: string): Promise<WeeklyLessonPlan> {
        const plan = await this.repository.findById(id);
        if (!plan) {
            throw new Error('Weekly lesson plan not found');
        }
        return plan;
    }

    async getWeeklyLessonPlansByShortTermPlan(shortTermPlanId: string, page: number = 1, limit: number = 20): Promise<{ plans: WeeklyLessonPlan[]; total: number }> {
        return await this.repository.findByShortTermPlan(shortTermPlanId, page, limit);
    }

    async getWeeklyLessonPlansByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ plans: WeeklyLessonPlan[]; total: number }> {
        return await this.repository.findByStudent(studentId, page, limit);
    }

    async getWeeklyLessonPlansByEducator(
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
        return await this.repository.findByEducator(specialEducatorId, page, limit, filters);
    }

    async updateWeeklyLessonPlan(id: string, data: Partial<WeeklyLessonPlanData>): Promise<WeeklyLessonPlan> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Weekly lesson plan not found');
        }

        return await this.repository.update(id, data);
    }

    async deleteWeeklyLessonPlan(id: string): Promise<void> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Weekly lesson plan not found');
        }

        await this.repository.delete(id);
    }

    async completeWeeklyLessonPlan(id: string, actualTime: number, outcome: string): Promise<WeeklyLessonPlan> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Weekly lesson plan not found');
        }

        return await this.repository.update(id, {
            actualTime,
            outcome,
            status: 'COMPLETED',
        } as any);
    }

    async markAsInProgress(id: string): Promise<WeeklyLessonPlan> {
        return await this.repository.update(id, {
            status: 'IN_PROGRESS',
        } as any);
    }

    async cancelWeeklyLessonPlan(id: string): Promise<WeeklyLessonPlan> {
        return await this.repository.update(id, {
            status: 'CANCELLED',
        } as any);
    }
}
