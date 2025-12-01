import { PrismaClient, Assessment, AssessmentStatus, IntakeForm, IEPGoal, IEPGoalStatus, SessionNote, Report, ReportType } from '@prisma/client';
import { AssessmentData, IntakeFormData, IEPGoalData, SessionNoteData, ReportData } from '../models';

export class AssessmentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Intake Form methods
  async createIntakeForm(specialEducatorId: string, intakeData: IntakeFormData): Promise<IntakeForm> {
    return this.prisma.intakeForm.create({
      data: {
        ...intakeData,
        specialEducatorId,
        status: AssessmentStatus.IN_PROGRESS
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async updateIntakeForm(id: string, intakeData: Partial<IntakeFormData>): Promise<IntakeForm> {
    return this.prisma.intakeForm.update({
      where: { id },
      data: intakeData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async completeIntakeForm(id: string): Promise<IntakeForm> {
    return this.prisma.intakeForm.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date()
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findIntakeFormByStudent(studentId: string): Promise<IntakeForm | null> {
    return this.prisma.intakeForm.findFirst({
      where: { studentId },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findIntakeFormById(id: string): Promise<IntakeForm | null> {
    return this.prisma.intakeForm.findUnique({
      where: { id },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findIntakeFormsByStudent(studentId: string): Promise<IntakeForm[]> {
    return this.prisma.intakeForm.findMany({
      where: { studentId },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Center methods
  async findCenterByName(centerName: string): Promise<any> {
    return this.prisma.centerProfile.findFirst({
      where: { centerName }
    });
  }

  // Student methods
  async updateStudent(studentId: string, studentData: any): Promise<any> {
    // Convert string values to appropriate types for Prisma
    const processedData = { ...studentData };
    
    // Convert numeric fields
    if (processedData.age !== undefined) {
      processedData.age = parseInt(processedData.age, 10);
    }
    
    // Convert date fields
    if (processedData.dateOfBirth !== undefined && typeof processedData.dateOfBirth === 'string') {
      processedData.dateOfBirth = new Date(processedData.dateOfBirth);
    }
    
    // Convert enum fields
    if (processedData.gender !== undefined && typeof processedData.gender === 'string') {
      processedData.gender = processedData.gender.toUpperCase();
    }
    
    if (processedData.status !== undefined && typeof processedData.status === 'string') {
      processedData.status = processedData.status.toUpperCase();
    }
    
    return this.prisma.student.update({
      where: { id: studentId },
      data: processedData
    });
  }

  // Assessment methods
  async createAssessment(specialEducatorId: string, assessmentData: AssessmentData): Promise<Assessment> {
    return this.prisma.assessment.create({
      data: {
        ...assessmentData,
        specialEducatorId,
        status: AssessmentStatus.IN_PROGRESS
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async updateAssessment(id: string, assessmentData: Partial<AssessmentData>): Promise<Assessment> {
    return this.prisma.assessment.update({
      where: { id },
      data: assessmentData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async completeAssessment(id: string): Promise<Assessment> {
    return this.prisma.assessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        completedAt: new Date()
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findAssessmentById(id: string): Promise<Assessment | null> {
    return this.prisma.assessment.findUnique({
      where: { id },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findAssessmentsByStudent(studentId: string): Promise<Assessment[]> {
    return this.prisma.assessment.findMany({
      where: { studentId },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAssessmentsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ assessments: Assessment[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [assessments, total] = await Promise.all([
      this.prisma.assessment.findMany({
        where: { specialEducatorId },
        skip,
        take: limit,
        include: {
          student: true,
          specialEducator: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.assessment.count({ where: { specialEducatorId } })
    ]);

    return { assessments, total };
  }

  // Helper method to convert date fields from strings to Date objects
  private convertDateFields(data: any): any {
    const convertedData = { ...data };
    
    // Convert sessionDate if it exists and is a string
    if (convertedData.sessionDate && typeof convertedData.sessionDate === 'string') {
      convertedData.sessionDate = new Date(convertedData.sessionDate);
    }
    
    // Convert other date fields that might be present
    const dateFields = ['startDate', 'targetDate', 'registrationDate'];
    dateFields.forEach(field => {
      if (convertedData[field] && typeof convertedData[field] === 'string') {
        convertedData[field] = new Date(convertedData[field]);
      }
    });
    
    return convertedData;
  }

  // IEP Goal methods
  async createIEPGoal(specialEducatorId: string, goalData: IEPGoalData): Promise<IEPGoal> {
    const convertedData = this.convertDateFields(goalData);
    
    return this.prisma.iEPGoal.create({
      data: {
        ...convertedData,
        specialEducatorId,
        status: IEPGoalStatus.NOT_STARTED
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        progressUpdates: {
          orderBy: { updateDate: 'desc' }
        }
      }
    });
  }

  async updateIEPGoal(id: string, goalData: Partial<IEPGoalData & { progressPercent?: number; status?: IEPGoalStatus; notes?: string }>): Promise<IEPGoal> {
    const convertedData = this.convertDateFields(goalData);
    
    return this.prisma.iEPGoal.update({
      where: { id },
      data: convertedData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        progressUpdates: {
          orderBy: { updateDate: 'desc' }
        }
      }
    });
  }

  async addIEPProgress(goalId: string, progress: number, notes?: string, rating?: string): Promise<void> {
    await this.prisma.iEPProgress.create({
      data: {
        goalId,
        progress,
        notes,
        rating
      }
    });

    // Update the goal's progress percentage
    await this.prisma.iEPGoal.update({
      where: { id: goalId },
      data: { 
        progressPercent: progress,
        status: progress >= 100 ? IEPGoalStatus.ACHIEVED : 
                progress > 0 ? IEPGoalStatus.IN_PROGRESS : 
                IEPGoalStatus.NOT_STARTED
      }
    });
  }

  async findIEPGoalById(id: string): Promise<IEPGoal | null> {
    return this.prisma.iEPGoal.findUnique({
      where: { id },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        progressUpdates: {
          orderBy: { updateDate: 'desc' }
        }
      }
    });
  }

  async findIEPGoalsByStudent(studentId: string, page: number = 1, limit: number = 10, filters?: {
    domain?: string;
    status?: IEPGoalStatus;
    search?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    targetDateFrom?: Date;
    targetDateTo?: Date;
  }): Promise<{ iepGoals: IEPGoal[], total: number }> {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      studentId,
      status: { not: IEPGoalStatus.DISCONTINUED }
    };

    // Apply filters
    if (filters?.domain) {
      whereClause.domain = filters.domain;
    }
    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.search) {
      whereClause.OR = [
        { goalStatement: { contains: filters.search, mode: 'insensitive' } },
        { strategy: { contains: filters.search, mode: 'insensitive' } },
        { expectedOutcome: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters?.startDateFrom || filters?.startDateTo) {
      whereClause.startDate = {};
      if (filters.startDateFrom) whereClause.startDate.gte = filters.startDateFrom;
      if (filters.startDateTo) whereClause.startDate.lte = filters.startDateTo;
    }
    if (filters?.targetDateFrom || filters?.targetDateTo) {
      whereClause.targetDate = {};
      if (filters.targetDateFrom) whereClause.targetDate.gte = filters.targetDateFrom;
      if (filters.targetDateTo) whereClause.targetDate.lte = filters.targetDateTo;
    }

    const [iepGoals, total] = await Promise.all([
      this.prisma.iEPGoal.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          student: true,
          specialEducator: {
            include: {
              user: true
            }
          },
          progressUpdates: {
            orderBy: { updateDate: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.iEPGoal.count({ where: whereClause })
    ]);

    return { iepGoals, total };
  }

  async findIEPGoalsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10, filters?: {
    studentId?: string;
    domain?: string;
    status?: IEPGoalStatus;
    search?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    targetDateFrom?: Date;
    targetDateTo?: Date;
  }): Promise<{ iepGoals: IEPGoal[], total: number }> {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      specialEducatorId,
      status: { not: IEPGoalStatus.DISCONTINUED }
    };

    // Apply filters
    if (filters?.studentId) {
      whereClause.studentId = filters.studentId;
    }
    if (filters?.domain) {
      whereClause.domain = filters.domain;
    }
    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.search) {
      whereClause.OR = [
        { goalStatement: { contains: filters.search, mode: 'insensitive' } },
        { strategy: { contains: filters.search, mode: 'insensitive' } },
        { expectedOutcome: { contains: filters.search, mode: 'insensitive' } },
        { student: { fullName: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }
    if (filters?.startDateFrom || filters?.startDateTo) {
      whereClause.startDate = {};
      if (filters.startDateFrom) whereClause.startDate.gte = filters.startDateFrom;
      if (filters.startDateTo) whereClause.startDate.lte = filters.startDateTo;
    }
    if (filters?.targetDateFrom || filters?.targetDateTo) {
      whereClause.targetDate = {};
      if (filters.targetDateFrom) whereClause.targetDate.gte = filters.targetDateFrom;
      if (filters.targetDateTo) whereClause.targetDate.lte = filters.targetDateTo;
    }

    const [iepGoals, total] = await Promise.all([
      this.prisma.iEPGoal.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          student: true,
          specialEducator: {
            include: {
              user: true
            }
          },
          progressUpdates: {
            orderBy: { updateDate: 'desc' },
            take: 3
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.iEPGoal.count({ where: whereClause })
    ]);

    return { iepGoals, total };
  }

  // Session Note methods
  async createSessionNote(specialEducatorId: string, sessionData: SessionNoteData): Promise<SessionNote> {
    const convertedData = this.convertDateFields(sessionData);
    
    return this.prisma.sessionNote.create({
      data: {
        ...convertedData,
        specialEducatorId
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async updateSessionNote(id: string, sessionData: Partial<SessionNoteData>): Promise<SessionNote> {
    const convertedData = this.convertDateFields(sessionData);
    
    return this.prisma.sessionNote.update({
      where: { id },
      data: convertedData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findSessionNoteById(id: string): Promise<SessionNote | null> {
    return this.prisma.sessionNote.findUnique({
      where: { id },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findSessionNotesByStudent(studentId: string, page: number = 1, limit: number = 10): Promise<{ sessionNotes: SessionNote[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [sessionNotes, total] = await Promise.all([
      this.prisma.sessionNote.findMany({
        where: { studentId },
        skip,
        take: limit,
        include: {
          student: true,
          specialEducator: {
            include: {
              user: true
            }
          }
        },
        orderBy: { sessionDate: 'desc' }
      }),
      this.prisma.sessionNote.count({ where: { studentId } })
    ]);

    return { sessionNotes, total };
  }

  async findSessionNotesByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ sessionNotes: SessionNote[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [sessionNotes, total] = await Promise.all([
      this.prisma.sessionNote.findMany({
        where: { specialEducatorId },
        skip,
        take: limit,
        include: {
          student: true,
          specialEducator: {
            include: {
              user: true
            }
          }
        },
        orderBy: { sessionDate: 'desc' }
      }),
      this.prisma.sessionNote.count({ where: { specialEducatorId } })
    ]);

    return { sessionNotes, total };
  }

  // Report methods
  async createReport(specialEducatorId: string, reportData: ReportData): Promise<Report> {
    return this.prisma.report.create({
      data: {
        ...reportData,
        specialEducatorId,
        status: AssessmentStatus.PENDING
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        superSpecialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async updateReport(id: string, reportData: Partial<ReportData>): Promise<Report> {
    return this.prisma.report.update({
      where: { id },
      data: reportData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        superSpecialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async submitReport(id: string, educatorSignature: string): Promise<Report> {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: AssessmentStatus.COMPLETED,
        educatorSignature,
        submittedAt: new Date()
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        superSpecialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async reviewReport(id: string, superSpecialEducatorId: string): Promise<Report> {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: AssessmentStatus.REVIEWED,
        superSpecialEducatorId,
        reviewedAt: new Date()
      },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        superSpecialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findReportById(id: string): Promise<Report | null> {
    return this.prisma.report.findUnique({
      where: { id },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        superSpecialEducator: {
          include: {
            user: true
          }
        }
      }
    });
  }

  async findReportsByStudent(studentId: string): Promise<Report[]> {
    return this.prisma.report.findMany({
      where: { studentId },
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        },
        superSpecialEducator: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findReportsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ reports: Report[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { specialEducatorId },
        skip,
        take: limit,
        include: {
          student: true,
          specialEducator: {
            include: {
              user: true
            }
          },
          superSpecialEducator: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.report.count({ where: { specialEducatorId } })
    ]);

    return { reports, total };
  }

  async findPendingReports(superSpecialEducatorId?: string): Promise<Report[]> {
    const whereClause: any = {
      status: AssessmentStatus.COMPLETED
    };

    if (superSpecialEducatorId) {
      // Find reports from educators under this super special educator's centers
      whereClause.specialEducator = {
        centerAssignments: {
          some: {
            center: {
              assignments: {
                some: {
                  superSpecialEducatorId,
                  isActive: true
                }
              }
            }
          }
        }
      };
    }

    return this.prisma.report.findMany({
      where: whereClause,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });
  }

  // Statistics methods
  async getAssessmentStats(specialEducatorId?: string, centerId?: string): Promise<{
    totalIntakeForms: number;
    completedIntakeForms: number;
    totalAssessments: number;
    completedAssessments: number;
    totalIEPGoals: number;
    achievedIEPGoals: number;
    inProgressIEPGoals: number;
    totalSessionNotes: number;
    totalReports: number;
    pendingReports: number;
    reviewedReports: number;
  }> {
    const whereClause: any = {};
    if (specialEducatorId) {
      whereClause.specialEducatorId = specialEducatorId;
    }
    if (centerId) {
      whereClause.student = { centerId };
    }

    const [
      totalIntakeForms,
      completedIntakeForms,
      totalAssessments,
      completedAssessments,
      totalIEPGoals,
      achievedIEPGoals,
      inProgressIEPGoals,
      totalSessionNotes,
      totalReports,
      pendingReports,
      reviewedReports
    ] = await Promise.all([
      this.prisma.intakeForm.count({ where: whereClause }),
      this.prisma.intakeForm.count({ where: { ...whereClause, status: AssessmentStatus.COMPLETED } }),
      this.prisma.assessment.count({ where: whereClause }),
      this.prisma.assessment.count({ where: { ...whereClause, status: AssessmentStatus.COMPLETED } }),
      this.prisma.iEPGoal.count({ where: { ...whereClause, status: { not: IEPGoalStatus.DISCONTINUED } } }),
      this.prisma.iEPGoal.count({ where: { ...whereClause, status: IEPGoalStatus.ACHIEVED } }),
      this.prisma.iEPGoal.count({ where: { ...whereClause, status: IEPGoalStatus.IN_PROGRESS } }),
      this.prisma.sessionNote.count({ where: whereClause }),
      this.prisma.report.count({ where: whereClause }),
      this.prisma.report.count({ where: { ...whereClause, status: AssessmentStatus.PENDING } }),
      this.prisma.report.count({ where: { ...whereClause, status: AssessmentStatus.REVIEWED } })
    ]);

    return {
      totalIntakeForms,
      completedIntakeForms,
      totalAssessments,
      completedAssessments,
      totalIEPGoals,
      achievedIEPGoals,
      inProgressIEPGoals,
      totalSessionNotes,
      totalReports,
      pendingReports,
      reviewedReports
    };
  }
}
