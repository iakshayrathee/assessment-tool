import { PrismaClient, LessonPlan, SkillArea } from '@prisma/client';
import { LessonPlanRepository, LessonPlanData } from '../repositories/LessonPlanRepository';

export class LessonPlanService {
  private lessonPlanRepository: LessonPlanRepository;

  constructor(prisma: PrismaClient) {
    this.lessonPlanRepository = new LessonPlanRepository(prisma);
  }

  async createLessonPlan(specialEducatorId: string, data: LessonPlanData): Promise<LessonPlan> {
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }

    if (!data.date) {
      throw new Error('Date is required');
    }

    if (!data.skillArea) {
      throw new Error('Skill area is required');
    }

    if (!data.specificTopic) {
      throw new Error('Specific topic is required');
    }

    if (!data.activityStrategy) {
      throw new Error('Activity/Strategy is required');
    }

    return await this.lessonPlanRepository.create(specialEducatorId, data);
  }

  async getLessonPlanById(id: string): Promise<LessonPlan> {
    const lessonPlan = await this.lessonPlanRepository.findById(id);
    if (!lessonPlan) {
      throw new Error('Lesson plan not found');
    }
    return lessonPlan;
  }

  async getLessonPlansByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ lessonPlans: LessonPlan[]; total: number }> {
    return await this.lessonPlanRepository.findByStudent(studentId, page, limit);
  }

  async getLessonPlansByEducator(
    specialEducatorId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      studentId?: string;
      skillArea?: SkillArea;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ lessonPlans: LessonPlan[]; total: number }> {
    return await this.lessonPlanRepository.findByEducator(specialEducatorId, page, limit, filters);
  }

  async updateLessonPlan(id: string, data: Partial<LessonPlanData>): Promise<LessonPlan> {
    const existingLessonPlan = await this.lessonPlanRepository.findById(id);
    if (!existingLessonPlan) {
      throw new Error('Lesson plan not found');
    }

    return await this.lessonPlanRepository.update(id, data);
  }

  async deleteLessonPlan(id: string): Promise<void> {
    const existingLessonPlan = await this.lessonPlanRepository.findById(id);
    if (!existingLessonPlan) {
      throw new Error('Lesson plan not found');
    }

    await this.lessonPlanRepository.delete(id);
  }
}

