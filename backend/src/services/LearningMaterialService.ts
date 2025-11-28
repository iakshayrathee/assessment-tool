import { PrismaClient, LearningMaterial, SkillArea } from '@prisma/client';
import { LearningMaterialRepository, LearningMaterialData } from '../repositories/LearningMaterialRepository';

export class LearningMaterialService {
  private learningMaterialRepository: LearningMaterialRepository;

  constructor(prisma: PrismaClient) {
    this.learningMaterialRepository = new LearningMaterialRepository(prisma);
  }

  async createLearningMaterial(data: LearningMaterialData): Promise<LearningMaterial> {
    if (!data.title) {
      throw new Error('Title is required');
    }

    if (!data.subject) {
      throw new Error('Subject is required');
    }

    if (!data.grade || data.grade < 1 || data.grade > 6) {
      throw new Error('Grade must be between 1 and 6');
    }

    return await this.learningMaterialRepository.create(data);
  }

  async getLearningMaterialById(id: string): Promise<LearningMaterial> {
    const material = await this.learningMaterialRepository.findById(id);
    if (!material) {
      throw new Error('Learning material not found');
    }
    return material;
  }

  async getAllLearningMaterials(
    page: number = 1,
    limit: number = 20,
    filters?: {
      subject?: SkillArea;
      grade?: number;
      category?: string;
      search?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<{ materials: LearningMaterial[]; total: number }> {
    return await this.learningMaterialRepository.findAll(page, limit, filters);
  }

  async getLearningMaterialsBySubjectAndGrade(subject: SkillArea, grade: number): Promise<LearningMaterial[]> {
    if (grade < 1 || grade > 6) {
      throw new Error('Grade must be between 1 and 6');
    }

    return await this.learningMaterialRepository.findBySubjectAndGrade(subject, grade);
  }

  async updateLearningMaterial(id: string, data: Partial<LearningMaterialData>): Promise<LearningMaterial> {
    const existingMaterial = await this.learningMaterialRepository.findById(id);
    if (!existingMaterial) {
      throw new Error('Learning material not found');
    }

    if (data.grade && (data.grade < 1 || data.grade > 6)) {
      throw new Error('Grade must be between 1 and 6');
    }

    return await this.learningMaterialRepository.update(id, data);
  }

  async deleteLearningMaterial(id: string): Promise<void> {
    const existingMaterial = await this.learningMaterialRepository.findById(id);
    if (!existingMaterial) {
      throw new Error('Learning material not found');
    }

    await this.learningMaterialRepository.delete(id);
  }

  async searchByTags(tags: string[], page: number = 1, limit: number = 20): Promise<{ materials: LearningMaterial[]; total: number }> {
    if (!tags || tags.length === 0) {
      throw new Error('At least one tag is required');
    }

    return await this.learningMaterialRepository.searchByTags(tags, page, limit);
  }
}

