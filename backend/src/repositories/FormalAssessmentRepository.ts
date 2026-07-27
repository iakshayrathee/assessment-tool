import { PrismaClient, FormalAssessment, AssessmentStatus } from '@prisma/client';

export interface FormalAssessmentData {
  studentId: string;
  // Simplified form fields (new)
  summary?: string;
  uploadedFiles?: string[];
  // Legacy / full-form fields (kept for backward compatibility)
  assessmentType?: string;
  referralReason?: string;
  referralDate?: Date | string;
  referredBy?: string;
  conductedBy?: string;
  credentials?: string;
  clinicName?: string;
  assessmentDate?: Date | string;
  keyFindings?: string;
  diagnosis?: string;
  recommendations?: string;
}

export class FormalAssessmentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(specialEducatorId: string, data: FormalAssessmentData): Promise<FormalAssessment> {
    // Note: assessmentType, referralDate, referredBy were made nullable via migration.
    // Cast to `any` until `prisma generate` reflects the updated schema.
    const createData: any = {
      specialEducatorId,
      studentId: data.studentId,
      summary: data.summary,
      assessmentType: data.assessmentType,
      referralReason: data.referralReason,
      referralDate: data.referralDate ? new Date(data.referralDate) : null,
      referredBy: data.referredBy,
      conductedBy: data.conductedBy,
      credentials: data.credentials,
      clinicName: data.clinicName,
      assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
      keyFindings: data.keyFindings,
      diagnosis: data.diagnosis,
      recommendations: data.recommendations,
      uploadedFiles: data.uploadedFiles || [],
    };

    return this.prisma.formalAssessment.create({
      data: createData,
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

  async findById(id: string): Promise<FormalAssessment | null> {
    return this.prisma.formalAssessment.findUnique({
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

  async findByStudent(studentId: string): Promise<FormalAssessment[]> {
    return this.prisma.formalAssessment.findMany({
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ assessments: FormalAssessment[]; total: number }> {
    const skip = (page - 1) * limit;

    const [assessments, total] = await Promise.all([
      this.prisma.formalAssessment.findMany({
        where: { specialEducatorId },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.formalAssessment.count({
        where: { specialEducatorId },
      }),
    ]);

    return { assessments, total };
  }

  async update(id: string, data: Partial<FormalAssessmentData>): Promise<FormalAssessment> {
    const updateData: any = { ...data };

    if (data.referralDate) {
      updateData.referralDate = new Date(data.referralDate);
    }

    if (data.assessmentDate) {
      updateData.assessmentDate = new Date(data.assessmentDate);
    }

    // Remove undefined values
    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    return this.prisma.formalAssessment.update({
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

  async complete(id: string): Promise<FormalAssessment> {
    return this.prisma.formalAssessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date(),
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

  async delete(id: string): Promise<void> {
    await this.prisma.formalAssessment.delete({
      where: { id },
    });
  }
}
