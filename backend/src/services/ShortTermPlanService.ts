import { PrismaClient, ShortTermPlan, PlanStatus } from '@prisma/client';
import { ShortTermPlanRepository, ShortTermPlanData } from '../repositories/ShortTermPlanRepository';

export class ShortTermPlanService {
    private repository: ShortTermPlanRepository;

    constructor(prisma: PrismaClient) {
        this.repository = new ShortTermPlanRepository(prisma);
    }

    async createShortTermPlan(specialEducatorId: string, data: ShortTermPlanData): Promise<ShortTermPlan> {
        // Validation
        if (!data.longTermPlanId) {
            throw new Error('Long-term plan ID is required');
        }

        if (!data.studentId) {
            throw new Error('Student ID is required');
        }

        if (!data.linkedGoalStatement) {
            throw new Error('Linked goal statement is required');
        }

        if (!data.startDate || !data.endDate) {
            throw new Error('Start date and end date are required');
        }

        if (!data.durationWeeks || data.durationWeeks < 4 || data.durationWeeks > 8) {
            throw new Error('Duration must be between 4 and 8 weeks');
        }

        if (!data.stpGoal) {
            throw new Error('STP goal is required');
        }

        if (!data.subGoals || data.subGoals.length === 0) {
            throw new Error('At least one sub-goal is required');
        }

        if (!data.interventionStrategy || data.interventionStrategy.length === 0) {
            throw new Error('At least one intervention strategy is required');
        }

        // Validate date range
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }

        return await this.repository.create(specialEducatorId, data);
    }

    async getShortTermPlanById(id: string): Promise<ShortTermPlan> {
        const plan = await this.repository.findById(id);
        if (!plan) {
            throw new Error('Short-term plan not found');
        }
        return plan;
    }

    async getShortTermPlansByLongTermPlan(longTermPlanId: string, page: number = 1, limit: number = 20): Promise<{ plans: ShortTermPlan[]; total: number }> {
        return await this.repository.findByLongTermPlan(longTermPlanId, page, limit);
    }

    async getShortTermPlansByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ plans: ShortTermPlan[]; total: number }> {
        return await this.repository.findByStudent(studentId, page, limit);
    }

    async getShortTermPlansByEducator(
        specialEducatorId: string,
        page: number = 1,
        limit: number = 20,
        filters?: {
            studentId?: string;
            longTermPlanId?: string;
            status?: PlanStatus;
        }
    ): Promise<{ plans: ShortTermPlan[]; total: number }> {
        return await this.repository.findByEducator(specialEducatorId, page, limit, filters);
    }

    async updateShortTermPlan(id: string, data: Partial<ShortTermPlanData>): Promise<ShortTermPlan> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Short-term plan not found');
        }

        // Validate duration if provided
        if (data.durationWeeks && (data.durationWeeks < 4 || data.durationWeeks > 8)) {
            throw new Error('Duration must be between 4 and 8 weeks');
        }

        // Validate date range if both dates provided
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);

            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }
        }

        return await this.repository.update(id, data);
    }

    async deleteShortTermPlan(id: string): Promise<void> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Short-term plan not found');
        }

        await this.repository.delete(id);
    }

    async getShortTermPlanWithWeeklyPlans(id: string): Promise<any> {
        const plan = await this.repository.getWithWeeklyPlans(id);
        if (!plan) {
            throw new Error('Short-term plan not found');
        }
        return plan;
    }

    async updateProgress(id: string): Promise<ShortTermPlan> {
        return await this.repository.updateProgress(id);
    }

    async markSubGoalAsAchieved(planId: string, subGoalId: string): Promise<ShortTermPlan> {
        const plan = await this.repository.findById(planId);
        if (!plan) {
            throw new Error('Short-term plan not found');
        }

        // This would require a separate method in the repository to update sub-goals
        // For now, we'll just update the progress
        return await this.repository.updateProgress(planId);
    }
}
