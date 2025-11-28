import { PrismaClient, Homework, SkillArea, HomeworkStatus } from '@prisma/client';
import { HomeworkRepository, HomeworkData } from '../repositories/HomeworkRepository';

export class HomeworkService {
  private homeworkRepository: HomeworkRepository;

  constructor(prisma: PrismaClient) {
    this.homeworkRepository = new HomeworkRepository(prisma);
  }

  async createHomework(specialEducatorId: string, data: HomeworkData): Promise<Homework> {
    if (!data.studentId) {
      throw new Error('Student ID is required');
    }

    if (!data.subject) {
      throw new Error('Subject is required');
    }

    if (!data.title) {
      throw new Error('Title is required');
    }

    if (!data.instructions) {
      throw new Error('Instructions are required');
    }

    if (!data.dueDate) {
      throw new Error('Due date is required');
    }

    return await this.homeworkRepository.create(specialEducatorId, data);
  }

  async getHomeworkById(id: string): Promise<Homework> {
    const homework = await this.homeworkRepository.findById(id);
    if (!homework) {
      throw new Error('Homework not found');
    }
    return homework;
  }

  async getHomeworkByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ homework: Homework[]; total: number }> {
    return await this.homeworkRepository.findByStudent(studentId, page, limit);
  }

  async getHomeworkByParent(parentId: string, page: number = 1, limit: number = 20): Promise<{ homework: Homework[]; total: number }> {
    return await this.homeworkRepository.findByParent(parentId, page, limit);
  }

  async getHomeworkByEducator(
    specialEducatorId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      studentId?: string;
      status?: HomeworkStatus;
      subject?: SkillArea;
    }
  ): Promise<{ homework: Homework[]; total: number }> {
    return await this.homeworkRepository.findByEducator(specialEducatorId, page, limit, filters);
  }

  async updateHomework(id: string, data: Partial<HomeworkData & { status?: HomeworkStatus; parentFeedback?: string; educatorFeedback?: string }>): Promise<Homework> {
    const existingHomework = await this.homeworkRepository.findById(id);
    if (!existingHomework) {
      throw new Error('Homework not found');
    }

    return await this.homeworkRepository.update(id, data);
  }

  async submitHomework(id: string, parentFeedback?: string): Promise<Homework> {
    const existingHomework = await this.homeworkRepository.findById(id);
    if (!existingHomework) {
      throw new Error('Homework not found');
    }

    if (existingHomework.status === HomeworkStatus.SUBMITTED || existingHomework.status === HomeworkStatus.REVIEWED || existingHomework.status === HomeworkStatus.COMPLETED) {
      throw new Error('Homework has already been submitted');
    }

    return await this.homeworkRepository.submit(id, parentFeedback);
  }

  async reviewHomework(id: string, educatorFeedback: string): Promise<Homework> {
    const existingHomework = await this.homeworkRepository.findById(id);
    if (!existingHomework) {
      throw new Error('Homework not found');
    }

    if (existingHomework.status !== HomeworkStatus.SUBMITTED) {
      throw new Error('Homework must be submitted before it can be reviewed');
    }

    return await this.homeworkRepository.review(id, educatorFeedback);
  }

  async completeHomework(id: string): Promise<Homework> {
    const existingHomework = await this.homeworkRepository.findById(id);
    if (!existingHomework) {
      throw new Error('Homework not found');
    }

    if (existingHomework.status !== HomeworkStatus.REVIEWED) {
      throw new Error('Homework must be reviewed before it can be completed');
    }

    return await this.homeworkRepository.complete(id);
  }

  async deleteHomework(id: string): Promise<void> {
    const existingHomework = await this.homeworkRepository.findById(id);
    if (!existingHomework) {
      throw new Error('Homework not found');
    }

    await this.homeworkRepository.delete(id);
  }
}

