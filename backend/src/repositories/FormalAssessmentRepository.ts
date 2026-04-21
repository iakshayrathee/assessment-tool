import { PrismaClient, FormalAssessment, AssessmentStatus } from '@prisma/client';

export interface FormalAssessmentData {
  studentId: string;
  assessmentType: string;
  referralReason?: string;
  referralDate: Date | string;
  referredBy: string;
  conductedBy?: string;
  credentials?: string;
  clinicName?: string;
  assessmentDate?: Date | string;
  keyFindings?: string;
  diagnosis?: string;
  recommendations?: string;
  uploadedFiles?: string[];
}

export class FormalAssessmentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(specialEducatorId: string, data: FormalAssessmentData): Promise<FormalAssessment> {
    return this.prisma.formalAssessment.create({
      data: {
        specialEducatorId,
        studentId: data.studentId,
        assessmentType: data.assessmentType,
        referralReason: data.referralReason,
        referralDate: new Date(data.referralDate),
        referredBy: data.referredBy,
        conductedBy: data.conductedBy,
        credentials: data.credentials,
        clinicName: data.clinicName,
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
        keyFindings: data.keyFindings,
        diagnosis: data.diagnosis,
        recommendations: data.recommendations,
        uploadedFiles: data.uploadedFiles || [],
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

  async findById(id: string): Promise<FormalAssessment | null> {
    console.log('DEBUG: Looking for formal assessment with ID:', id);
    console.log('DEBUG: ID length:', id.length);
    console.log('DEBUG: ID type:', typeof id);
    
    const result = await this.prisma.formalAssessment.findUnique({
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
    
    console.log('DEBUG: Found assessment:', !!result);
    if (result) {
      console.log('DEBUG: Assessment ID matches:', result.id === id);
      console.log('DEBUG: Result ID:', result.id);
    }
    
    return result;
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

