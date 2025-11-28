import { PrismaClient, LessonPlan, SkillArea, MotivationLevel } from '@prisma/client';

export interface LessonPlanData {
  studentId: string;
  date: Date | string;
  skillArea: SkillArea;
  specificTopic: string;
  areasOfRemediation: string[];
  activityStrategy: string;
  resourcesUsed: string[];
  expectedTime?: number;
  actualTimeTaken?: number;
  motivationLevel?: MotivationLevel;
  outcome?: string;
  nextStep?: string;
}

export class LessonPlanRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(specialEducatorId: string, data: LessonPlanData): Promise<LessonPlan> {
    return this.prisma.lessonPlan.create({
      data: {
        specialEducatorId,
        studentId: data.studentId,
        date: new Date(data.date),
        skillArea: data.skillArea,
        specificTopic: data.specificTopic,
        areasOfRemediation: data.areasOfRemediation,
        activityStrategy: data.activityStrategy,
        resourcesUsed: data.resourcesUsed,
        expectedTime: data.expectedTime,
        actualTimeTaken: data.actualTimeTaken,
        motivationLevel: data.motivationLevel,
        outcome: data.outcome,
        nextStep: data.nextStep,
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
      },
    });
  }

  async findById(id: string): Promise<LessonPlan | null> {
    return this.prisma.lessonPlan.findUnique({
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
      },
    });
  }

  async findByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ lessonPlans: LessonPlan[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [lessonPlans, total] = await Promise.all([
      this.prisma.lessonPlan.findMany({
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
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lessonPlan.count({
        where: { studentId },
      }),
    ]);

    return { lessonPlans, total };
  }

  async findByEducator(specialEducatorId: string, page: number = 1, limit: number = 20, filters?: {
    studentId?: string;
    skillArea?: SkillArea;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ lessonPlans: LessonPlan[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = { specialEducatorId };
    
    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }
    
    if (filters?.skillArea) {
      where.skillArea = filters.skillArea;
    }
    
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }
    
    const [lessonPlans, total] = await Promise.all([
      this.prisma.lessonPlan.findMany({
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
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lessonPlan.count({
        where,
      }),
    ]);

    return { lessonPlans, total };
  }

  async update(id: string, data: Partial<LessonPlanData>): Promise<LessonPlan> {
    const updateData: any = { ...data };
    
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    return this.prisma.lessonPlan.update({
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
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.lessonPlan.delete({
      where: { id },
    });
  }
}

