import { PrismaClient, Homework, SkillArea, HomeworkStatus } from '@prisma/client';

export interface HomeworkData {
  studentId: string;
  parentId?: string;
  subject: SkillArea;
  title: string;
  instructions: string;
  attachedFiles?: string[];
  dueDate: Date | string;
  additionalNotes?: string;
  estimatedTime?: number;
  skillTargeted?: string;
}

export class HomeworkRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(specialEducatorId: string, data: HomeworkData): Promise<Homework> {
    // Get student with parent information
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      select: {
        parentId: true,
        fullName: true,
        parent: {
          include: {
            user: true
          }
        }
      },
    });

    const parentId = data.parentId || student?.parentId || undefined;

    // Create homework
    const homework = await this.prisma.homework.create({
      data: {
        specialEducatorId,
        studentId: data.studentId,
        parentId,
        subject: data.subject,
        title: data.title,
        instructions: data.instructions,
        attachedFiles: data.attachedFiles || [],
        dueDate: new Date(data.dueDate),
        additionalNotes: data.additionalNotes,
        estimatedTime: data.estimatedTime,
        skillTargeted: data.skillTargeted,
        status: HomeworkStatus.ASSIGNED,
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Send notification to parent if parent exists
    if (student?.parent?.user) {
      await this.prisma.notification.create({
        data: {
          userId: student.parent.user.id,
          type: 'HOMEWORK_ASSIGNED',
          title: 'New Homework Assigned',
          message: `New ${data.subject.toLowerCase()} homework "${data.title}" has been assigned to ${student.fullName}. Due date: ${new Date(data.dueDate).toLocaleDateString()}`,
          data: JSON.stringify({
            homeworkId: homework.id,
            studentId: data.studentId,
            subject: data.subject,
            dueDate: data.dueDate
          })
        }
      });
    }

    return homework;
  }

  async findById(id: string): Promise<Homework | null> {
    return this.prisma.homework.findUnique({
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findByStudent(studentId: string, page: number = 1, limit: number = 20): Promise<{ homework: Homework[]; total: number }> {
    const skip = (page - 1) * limit;

    const [homework, total] = await Promise.all([
      this.prisma.homework.findMany({
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
          parent: {
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
      this.prisma.homework.count({
        where: { studentId },
      }),
    ]);

    return { homework, total };
  }

  async findByParent(parentId: string, page: number = 1, limit: number = 20): Promise<{ homework: Homework[]; total: number }> {
    const skip = (page - 1) * limit;

    const [homework, total] = await Promise.all([
      this.prisma.homework.findMany({
        where: { parentId },
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
          parent: {
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
      this.prisma.homework.count({
        where: { parentId },
      }),
    ]);

    return { homework, total };
  }

  async findByEducator(specialEducatorId: string, page: number = 1, limit: number = 20, filters?: {
    studentId?: string;
    status?: HomeworkStatus;
    subject?: SkillArea;
  }): Promise<{ homework: Homework[]; total: number }> {
    const skip = (page - 1) * limit;

    const where: any = { specialEducatorId };

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.subject) {
      where.subject = filters.subject;
    }

    const [homework, total] = await Promise.all([
      this.prisma.homework.findMany({
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
          parent: {
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
      this.prisma.homework.count({
        where,
      }),
    ]);

    return { homework, total };
  }

  async update(id: string, data: Partial<HomeworkData & { status?: HomeworkStatus; parentFeedback?: string; educatorFeedback?: string }>): Promise<Homework> {
    const updateData: any = { ...data };

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    return this.prisma.homework.update({
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async submit(id: string, parentFeedback?: string): Promise<Homework> {
    const homework = await this.prisma.homework.update({
      where: { id },
      data: {
        status: HomeworkStatus.SUBMITTED,
        submittedAt: new Date(),
        parentFeedback,
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
          include: {
            user: true
          }
        },
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Notify educator when homework is submitted
    if (homework.specialEducator?.user) {
      await this.prisma.notification.create({
        data: {
          userId: homework.specialEducator.user.id,
          type: 'HOMEWORK_SUBMITTED',
          title: 'Homework Submitted',
          message: `${homework.student.fullName} has submitted homework: "${homework.title}"`,
          data: JSON.stringify({
            homeworkId: homework.id,
            studentId: homework.studentId
          })
        }
      });
    }

    return homework;
  }

  async review(id: string, educatorFeedback: string): Promise<Homework> {
    return this.prisma.homework.update({
      where: { id },
      data: {
        status: HomeworkStatus.REVIEWED,
        educatorFeedback,
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async complete(id: string): Promise<Homework> {
    return this.prisma.homework.update({
      where: { id },
      data: {
        status: HomeworkStatus.COMPLETED,
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.homework.delete({
      where: { id },
    });
  }

  /**
   * Add files to homework's attachedFiles array
   */
  async addFiles(id: string, fileKeys: string[]): Promise<Homework> {
    const homework = await this.findById(id);
    if (!homework) {
      throw new Error('Homework not found');
    }

    const updatedFiles = [...homework.attachedFiles, ...fileKeys];

    return this.prisma.homework.update({
      where: { id },
      data: {
        attachedFiles: updatedFiles,
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Remove a file from homework's attachedFiles array
   */
  async removeFile(id: string, fileKey: string): Promise<Homework> {
    const homework = await this.findById(id);
    if (!homework) {
      throw new Error('Homework not found');
    }

    const updatedFiles = homework.attachedFiles.filter((key) => key !== fileKey);

    return this.prisma.homework.update({
      where: { id },
      data: {
        attachedFiles: updatedFiles,
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
        parent: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
}

