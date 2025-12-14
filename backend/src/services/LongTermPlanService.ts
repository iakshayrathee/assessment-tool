import { PrismaClient, LongTermPlan, Domain, ReviewCycle, PlanStatus } from '@prisma/client';
import { LongTermPlanRepository, LongTermPlanData } from '../repositories/LongTermPlanRepository';

export class LongTermPlanService {
    private repository: LongTermPlanRepository;

    constructor(prisma: PrismaClient) {
        this.repository = new LongTermPlanRepository(prisma);
    }

    async createLongTermPlan(specialEducatorId: string, data: LongTermPlanData): Promise<LongTermPlan> {
        // Validation
        if (!data.studentId) {
            throw new Error('Student ID is required');
        }

        if (!data.startDate || !data.endDate) {
            throw new Error('Start date and end date are required');
        }

        if (!data.durationMonths || data.durationMonths < 6 || data.durationMonths > 12) {
            throw new Error('Duration must be between 6 and 12 months');
        }

        if (!data.goals || data.goals.length < 1 || data.goals.length > 5) {
            throw new Error('Long-term plan must have between 1 and 5 goals');
        }

        if (!data.domains || data.domains.length === 0) {
            throw new Error('At least one domain must be selected');
        }

        // Validate date range
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);

        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }

        // Calculate next review date if not provided
        if (!data.nextReviewDate) {
            const reviewCycle = data.reviewCycle || 'QUARTERLY';
            const nextReview = new Date(startDate);

            switch (reviewCycle) {
                case 'MONTHLY':
                    nextReview.setMonth(nextReview.getMonth() + 1);
                    break;
                case 'QUARTERLY':
                    nextReview.setMonth(nextReview.getMonth() + 3);
                    break;
                case 'BIANNUAL':
                    nextReview.setMonth(nextReview.getMonth() + 6);
                    break;
            }

            data.nextReviewDate = nextReview;
        }

        return await this.repository.create(specialEducatorId, data);
    }

    async getLongTermPlanById(id: string): Promise<LongTermPlan> {
        const plan = await this.repository.findById(id);
        if (!plan) {
            throw new Error('Long-term plan not found');
        }
        return plan;
    }

    async getLongTermPlansByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ plans: LongTermPlan[]; total: number }> {
        return await this.repository.findByStudent(studentId, page, limit);
    }

    async getLongTermPlansByEducator(
        specialEducatorId: string,
        page: number = 1,
        limit: number = 20,
        filters?: {
            studentId?: string;
            status?: PlanStatus;
            domain?: Domain;
        }
    ): Promise<{ plans: LongTermPlan[]; total: number }> {
        return await this.repository.findByEducator(specialEducatorId, page, limit, filters);
    }

    async updateLongTermPlan(id: string, data: Partial<LongTermPlanData>): Promise<LongTermPlan> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Long-term plan not found');
        }

        // Validate duration if provided
        if (data.durationMonths && (data.durationMonths < 6 || data.durationMonths > 12)) {
            throw new Error('Duration must be between 6 and 12 months');
        }

        // Validate goals if provided
        if (data.goals && (data.goals.length < 1 || data.goals.length > 5)) {
            throw new Error('Long-term plan must have between 1 and 5 goals');
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

    async deleteLongTermPlan(id: string): Promise<void> {
        const existingPlan = await this.repository.findById(id);
        if (!existingPlan) {
            throw new Error('Long-term plan not found');
        }

        await this.repository.delete(id);
    }

    async getLongTermPlanWithHierarchy(id: string): Promise<any> {
        const plan = await this.repository.getWithHierarchy(id);
        if (!plan) {
            throw new Error('Long-term plan not found');
        }
        return plan;
    }

    async updateReviewDate(id: string): Promise<LongTermPlan> {
        const plan = await this.repository.findById(id);
        if (!plan) {
            throw new Error('Long-term plan not found');
        }

        const now = new Date();
        const nextReview = new Date(now);

        switch (plan.reviewCycle) {
            case 'MONTHLY':
                nextReview.setMonth(nextReview.getMonth() + 1);
                break;
            case 'QUARTERLY':
                nextReview.setMonth(nextReview.getMonth() + 3);
                break;
            case 'BIANNUAL':
                nextReview.setMonth(nextReview.getMonth() + 6);
                break;
        }

        return await this.repository.update(id, {
            lastReviewDate: now,
            nextReviewDate: nextReview,
        } as any);
    }
}
