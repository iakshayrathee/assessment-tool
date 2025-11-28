import { PrismaClient, LearningMaterial, SkillArea } from '@prisma/client';

export interface LearningMaterialData {
  title: string;
  subject: SkillArea;
  grade: number;
  category?: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  tags?: string[];
  isPublic?: boolean;
  uploadedBy?: string;
}

export class LearningMaterialRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: LearningMaterialData): Promise<LearningMaterial> {
    return this.prisma.learningMaterial.create({
      data: {
        title: data.title,
        subject: data.subject,
        grade: data.grade,
        category: data.category,
        description: data.description,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        tags: data.tags || [],
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  async findById(id: string): Promise<LearningMaterial | null> {
    return this.prisma.learningMaterial.findUnique({
      where: { id },
    });
  }

  async findAll(page: number = 1, limit: number = 20, filters?: {
    subject?: SkillArea;
    grade?: number;
    category?: string;
    search?: string;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<{ materials: LearningMaterial[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (filters?.subject) {
      where.subject = filters.subject;
    }
    
    if (filters?.grade) {
      where.grade = filters.grade;
    }
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }
    
    const [materials, total] = await Promise.all([
      this.prisma.learningMaterial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.learningMaterial.count({
        where,
      }),
    ]);

    return { materials, total };
  }

  async findBySubjectAndGrade(subject: SkillArea, grade: number): Promise<LearningMaterial[]> {
    return this.prisma.learningMaterial.findMany({
      where: {
        subject,
        grade,
        isPublic: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<LearningMaterialData>): Promise<LearningMaterial> {
    return this.prisma.learningMaterial.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.learningMaterial.delete({
      where: { id },
    });
  }

  async searchByTags(tags: string[], page: number = 1, limit: number = 20): Promise<{ materials: LearningMaterial[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where = {
      tags: {
        hasSome: tags,
      },
      isPublic: true,
    };
    
    const [materials, total] = await Promise.all([
      this.prisma.learningMaterial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.learningMaterial.count({
        where,
      }),
    ]);

    return { materials, total };
  }
}

