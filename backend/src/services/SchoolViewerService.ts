import { PrismaClient, StudentStatus, AssessmentStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

export class SchoolViewerService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get School Viewer profile by user ID
   */
  async getSchoolViewerProfile(userId: string) {
    const profile = await this.prisma.schoolViewerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            lastLogin: true
          }
        },
        school: {
          include: {
            center: {
              select: {
                id: true,
                centerName: true,
                address: true,
                phone: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!profile) {
      throw new AppError('School Viewer profile not found', 404);
    }

    return profile;
  }

  /**
   * Get dashboard data for School Viewer
   */
  async getDashboardData(userId: string) {
    const profile = await this.getSchoolViewerProfile(userId);
    const schoolId = profile.schoolId;

    // Get student counts by status
    const studentStats = await this.prisma.student.groupBy({
      by: ['status'],
      where: { schoolId },
      _count: { id: true }
    });

    const totalStudents = await this.prisma.student.count({
      where: { schoolId }
    });

    // Get recent assessments
    const recentAssessments = await this.prisma.assessment.findMany({
      where: {
        student: { schoolId }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Get recent reports
    const recentReports = await this.prisma.report.findMany({
      where: {
        student: { schoolId }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Get IEP goals progress summary
    const iepGoalsStats = await this.prisma.iEPGoal.groupBy({
      by: ['status'],
      where: {
        student: { schoolId }
      },
      _count: { id: true }
    });

    // Get session notes count for current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const sessionNotesThisMonth = await this.prisma.sessionNote.count({
      where: {
        student: { schoolId },
        createdAt: { gte: currentMonth }
      }
    });

    // Get assigned educators
    const assignedEducators = await this.prisma.studentAssignment.findMany({
      where: {
        student: { schoolId },
        isActive: true
      },
      include: {
        specialEducator: {
          select: {
            id: true,
            fullName: true,
            phone: true
          }
        }
      },
      distinct: ['specialEducatorId']
    });

    return {
      school: profile.school,
      stats: {
        totalStudents,
        studentsByStatus: studentStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        iepGoalsByStatus: iepGoalsStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        sessionNotesThisMonth
      },
      recentAssessments,
      recentReports,
      assignedEducators: assignedEducators.map(a => a.specialEducator)
    };
  }

  /**
   * Get students for School Viewer with filtering and pagination
   */
  async getStudents(userId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: StudentStatus;
    grade?: string;
  } = {}) {
    const profile = await this.getSchoolViewerProfile(userId);
    const schoolId = profile.schoolId;

    const {
      page = 1,
      limit = 10,
      search,
      status,
      grade
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {
      schoolId
    };

    if (search) {
      where.fullName = {
        contains: search,
        mode: 'insensitive'
      };
    }

    if (status) {
      where.status = status;
    }

    if (grade) {
      where.grade = grade;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          },
          assignments: {
            where: { isActive: true },
            include: {
              specialEducator: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true
                }
              }
            }
          },
          assessments: {
            select: {
              id: true,
              status: true,
              assessmentType: true,
              completedAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          reports: {
            select: {
              id: true,
              type: true,
              status: true,
              submittedAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          iepGoals: {
            select: {
              id: true,
              status: true,
              progressPercent: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { registrationDate: 'desc' }
      }),
      this.prisma.student.count({ where })
    ]);

    return {
      students: students.map(student => ({
        ...student,
        latestAssessment: student.assessments[0] || null,
        latestReport: student.reports[0] || null,
        iepProgress: student.iepGoals.length > 0 
          ? Math.round(student.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0) / student.iepGoals.length)
          : 0,
        activeGoalsCount: student.iepGoals.filter(goal => goal.status === 'IN_PROGRESS').length
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get student details for School Viewer
   */
  async getStudentDetails(userId: string, studentId: string) {
    const profile = await this.getSchoolViewerProfile(userId);
    const schoolId = profile.schoolId;

    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId // Ensure School Viewer can only access students from their school
      },
      include: {
        parent: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            address: true,
            emergencyContact: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        assignments: {
          where: { isActive: true },
          include: {
            specialEducator: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                specialEdQualification: true,
                yearsOfExperience: true
              }
            }
          }
        },
        assessments: {
          include: {
            specialEducator: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        reports: {
          include: {
            specialEducator: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        iepGoals: {
          include: {
            progressUpdates: {
              orderBy: { updateDate: 'desc' },
              take: 3
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        sessionNotes: {
          include: {
            specialEducator: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: { sessionDate: 'desc' },
          take: 10
        }
      }
    });

    if (!student) {
      throw new AppError('Student not found or access denied', 404);
    }

    return student;
  }

  /**
   * Get reports for School Viewer
   */
  async getReports(userId: string, options: {
    page?: number;
    limit?: number;
    type?: string;
    status?: AssessmentStatus;
    studentId?: string;
  } = {}) {
    const profile = await this.getSchoolViewerProfile(userId);
    const schoolId = profile.schoolId;

    const {
      page = 1,
      limit = 10,
      type,
      status,
      studentId
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {
      student: { schoolId }
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              grade: true
            }
          },
          specialEducator: {
            select: {
              id: true,
              fullName: true
            }
          },
          superSpecialEducator: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.report.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get report details for School Viewer
   */
  async getReportDetails(userId: string, reportId: string) {
    const profile = await this.getSchoolViewerProfile(userId);
    const schoolId = profile.schoolId;

    const report = await this.prisma.report.findFirst({
      where: {
        id: reportId,
        student: { schoolId } // Ensure School Viewer can only access reports from their school
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            grade: true,
            gender: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
            specialEdQualification: true
          }
        },
        superSpecialEducator: {
          select: {
            id: true,
            fullName: true,
            specialEdQualification: true
          }
        }
      }
    });

    if (!report) {
      throw new AppError('Report not found or access denied', 404);
    }

    return report;
  }

  /**
   * Get activity timeline for School Viewer dashboard
   */
  async getActivityTimeline(userId: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    const profile = await this.getSchoolViewerProfile(userId);
    const schoolId = profile.schoolId;

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Get recent session notes as activities
    const sessionNotes = await this.prisma.sessionNote.findMany({
      where: {
        student: { schoolId }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { sessionDate: 'desc' }
    });

    // Transform to activity format
    const activities = sessionNotes.map(note => ({
      id: note.id,
      type: 'session',
      title: `Session with ${note.student.fullName}`,
      description: note.activities,
      date: note.sessionDate,
      student: note.student,
      educator: note.specialEducator
    }));

    return {
      activities,
      pagination: {
        page,
        limit,
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    };
  }

  /**
   * Update School Viewer profile
   */
  async updateProfile(userId: string, data: {
    fullName?: string;
    position?: string;
    phone?: string;
  }) {
    const profile = await this.prisma.schoolViewerProfile.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    });

    return profile;
  }
}
