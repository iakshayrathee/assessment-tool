import { PrismaClient, StudentStatus, ReportType, IEPGoalStatus, AssessmentStatus } from '@prisma/client';
import { PaginatedResponse } from '../models';

const prisma = new PrismaClient();

export class SuperSpecialEducatorService {
  /**
   * Get dashboard data for Super Special Educator
   */
  async getDashboardData(userId: string) {
    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId },
      include: {
        assignedCenters: {
          include: {
            center: {
              include: {
                students: true,
                schools: true
              }
            }
          }
        }
      }
    });

    if (!profile) {
      throw new Error('Super Special Educator profile not found');
    }

    // Get assigned centers count
    const centersCount = profile.assignedCenters.length;

    // Get total students under supervision
    const totalStudents = profile.assignedCenters.reduce((sum, assignment) => 
      sum + assignment.center.students.length, 0
    );

    // Get educators under supervision
    const educatorsUnderSupervision = await prisma.centerAssignment.count({
      where: {
        centerId: {
          in: profile.assignedCenters.map(a => a.centerId)
        },
        specialEducatorId: { not: null }
      }
    });

    // Get pending reviews
    const pendingReviews = await prisma.report.count({
      where: {
        status: 'PENDING',
        student: {
          centerId: {
            in: profile.assignedCenters.map(a => a.centerId)
          }
        }
      }
    });

    // Get flagged cases (students with low progress)
    const flaggedCases = await prisma.student.count({
      where: {
        centerId: {
          in: profile.assignedCenters.map(a => a.centerId)
        },
        iepGoals: {
          some: {
            progressPercent: { lt: 30 },
            status: 'IN_PROGRESS'
          }
        }
      }
    });

    return {
      profile,
      stats: {
        centersCount,
        totalStudents,
        educatorsUnderSupervision,
        pendingReviews,
        flaggedCases
      }
    };
  }

  /**
   * Get Super Special Educator profile
   */
  async getProfile(userId: string) {
    return await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            isActive: true,
            lastLogin: true
          }
        },
        assignedCenters: {
          include: {
            center: true
          }
        }
      }
    });
  }

  /**
   * Update Super Special Educator profile
   */
  async updateProfile(userId: string, profileData: any) {
    return await prisma.superSpecialEducatorProfile.update({
      where: { userId },
      data: profileData
    });
  }

  /**
   * Get assigned centers with pagination
   */
  async getAssignedCenters(userId: string, params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const where = {
      superSpecialEducatorId: profile.id,
      ...(search && {
        center: {
          centerName: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      })
    };

    const [assignments, total] = await Promise.all([
      prisma.centerAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          center: {
            include: {
              students: true,
              schools: true,
              assignments: {
                where: { specialEducatorId: { not: null } },
                include: {
                  specialEducator: true
                }
              }
            }
          }
        },
        orderBy: { assignedDate: 'desc' }
      }),
      prisma.centerAssignment.count({ where })
    ]);

    return {
      success: true,
      data: assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get assigned educators with pagination
   */
  async getAssignedEducators(userId: string, params: {
    page: number;
    limit: number;
    search?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page, limit, search, centerId } = params;
    const skip = (page - 1) * limit;

    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get center IDs assigned to this Super Special Educator
    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    const where = {
      specialEducatorId: { not: null },
      centerId: {
        in: centerId ? [centerId] : centerIds.map(c => c.centerId)
      },
      ...(search && {
        specialEducator: {
          fullName: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      })
    };

    const [assignments, total] = await Promise.all([
      prisma.centerAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          specialEducator: {
            include: {
              assignedStudents: {
                include: {
                  student: true
                }
              }
            }
          },
          center: true
        },
        orderBy: { assignedDate: 'desc' }
      }),
      prisma.centerAssignment.count({ where })
    ]);

    return {
      success: true,
      data: assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get students under supervision
   */
  async getStudentsUnderSupervision(userId: string, params: {
    page: number;
    limit: number;
    search?: string;
    centerId?: string;
    educatorId?: string;
    status?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page, limit, search, centerId, educatorId, status } = params;
    const skip = (page - 1) * limit;

    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get center IDs assigned to this Super Special Educator
    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    const where = {
      centerId: {
        in: centerId ? [centerId] : centerIds.map(c => c.centerId)
      },
      ...(search && {
        fullName: {
          contains: search,
          mode: 'insensitive' as const
        }
      }),
      ...(status && { status: status as StudentStatus }),
      ...(educatorId && {
        assignments: {
          some: {
            specialEducatorId: educatorId
          }
        }
      })
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          center: true,
          school: true,
          parent: true,
          assignments: {
            include: {
              specialEducator: true
            }
          },
          assessments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          iepGoals: {
            where: { status: 'IN_PROGRESS' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where })
    ]);

    return {
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get reports pending review
   */
  async getPendingReviews(userId: string, params: {
    page: number;
    limit: number;
    type?: string;
    priority?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page, limit, type, priority } = params;
    const skip = (page - 1) * limit;

    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    const where = {
      status: AssessmentStatus.PENDING,
      student: {
        centerId: {
          in: centerIds.map(c => c.centerId)
        }
      },
      ...(type && { type: type as ReportType })
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              center: true,
              parent: true
            }
          },
          specialEducator: true
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.report.count({ where })
    ]);

    return {
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Review a report
   */
  async reviewReport(
    userId: string,
    reportId: string,
    action: 'APPROVE' | 'REJECT',
    comments?: string,
    recommendations?: string
  ) {
    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    return await prisma.report.update({
      where: { id: reportId },
      data: {
        status: action === 'APPROVE' ? 'REVIEWED' : 'PENDING',
        reviewedAt: new Date(),
        superSpecialEducatorId: profile.id,
        ...(comments && { summary: comments }),
        ...(recommendations && { recommendations })
      }
    });
  }

  /**
   * Get flagged cases
   */
  async getFlaggedCases(userId: string, params: {
    page: number;
    limit: number;
    severity?: string;
    centerId?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page, limit, severity, centerId } = params;
    const skip = (page - 1) * limit;

    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    // Students with low progress or overdue goals
    const where = {
      centerId: {
        in: centerId ? [centerId] : centerIds.map(c => c.centerId)
      },
      OR: [
        {
          iepGoals: {
            some: {
              progressPercent: { lt: 30 },
              status: IEPGoalStatus.IN_PROGRESS,
              targetDate: { lt: new Date() }
            }
          }
        },
        {
          assessments: {
            some: {
              status: AssessmentStatus.PENDING,
              createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          }
        }
      ]
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          center: true,
          assignments: {
            include: {
              specialEducator: true
            }
          },
          iepGoals: {
            where: {
              OR: [
                { progressPercent: { lt: 30 } },
                { targetDate: { lt: new Date() } }
              ]
            }
          },
          assessments: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'asc' }
      }),
      prisma.student.count({ where })
    ]);

    return {
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create training log
   */
  async createTrainingLog(userId: string, logData: any) {
    // For now, we'll use audit logs to track training interactions
    return await prisma.auditLog.create({
      data: {
        userId,
        action: 'TRAINING_LOG',
        resource: 'SpecialEducator',
        resourceId: logData.educatorId,
        details: JSON.stringify(logData)
      }
    });
  }

  /**
   * Get training logs
   */
  async getTrainingLogs(userId: string, params: {
    page: number;
    limit: number;
    educatorId?: string;
  }): Promise<PaginatedResponse<any>> {
    const { page, limit, educatorId } = params;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      action: 'TRAINING_LOG',
      ...(educatorId && { resourceId: educatorId })
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get cross-center comparison data
   */
  async getCrossCenterComparison(userId: string, period: string, metrics?: string[]) {
    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    // Get comparison data for each center
    const centers = await prisma.centerProfile.findMany({
      where: {
        id: { in: centerIds.map(c => c.centerId) }
      },
      include: {
        students: true,
        assignments: {
          where: { specialEducatorId: { not: null } }
        }
      }
    });

    // Calculate metrics for each center
    const comparisonData = await Promise.all(
      centers.map(async (center) => {
        const completedReports = await prisma.report.count({
          where: {
            student: { centerId: center.id },
            status: 'REVIEWED'
          }
        });

        const totalReports = await prisma.report.count({
          where: {
            student: { centerId: center.id }
          }
        });

        const avgProgress = await prisma.iEPGoal.aggregate({
          where: {
            student: { centerId: center.id }
          },
          _avg: {
            progressPercent: true
          }
        });

        return {
          center: center,
          metrics: {
            totalStudents: center.students.length,
            totalEducators: center.assignments.length,
            completionRate: totalReports > 0 ? (completedReports / totalReports) * 100 : 0,
            avgProgress: avgProgress._avg.progressPercent || 0
          }
        };
      })
    );

    return comparisonData;
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(userId: string, period: string, centerId?: string) {
    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    const targetCenterIds = centerId ? [centerId] : centerIds.map(c => c.centerId);

    // Calculate date range based on period
    const now = new Date();
    const startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const [
      totalStudents,
      completedAssessments,
      pendingReports,
      avgGoalProgress
    ] = await Promise.all([
      prisma.student.count({
        where: { centerId: { in: targetCenterIds } }
      }),
      prisma.assessment.count({
        where: {
          student: { centerId: { in: targetCenterIds } },
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        }
      }),
      prisma.report.count({
        where: {
          student: { centerId: { in: targetCenterIds } },
          status: 'PENDING'
        }
      }),
      prisma.iEPGoal.aggregate({
        where: {
          student: { centerId: { in: targetCenterIds } },
          updatedAt: { gte: startDate }
        },
        _avg: {
          progressPercent: true
        }
      })
    ]);

    return {
      period,
      metrics: {
        totalStudents,
        completedAssessments,
        pendingReports,
        avgGoalProgress: avgGoalProgress._avg.progressPercent || 0
      }
    };
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(userId: string, limit: number, type?: string) {
    const profile = await prisma.superSpecialEducatorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    const centerIds = await prisma.centerAssignment.findMany({
      where: { superSpecialEducatorId: profile.id },
      select: { centerId: true }
    });

    // Get recent activities from audit logs
    const activities = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId }, // Activities by this Super Special Educator
          {
            // Activities in supervised centers
            resource: 'Student',
            resourceId: {
              in: await prisma.student.findMany({
                where: { centerId: { in: centerIds.map(c => c.centerId) } },
                select: { id: true }
              }).then(students => students.map(s => s.id))
            }
          }
        ],
        ...(type && { action: type })
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            specialEducatorProfile: {
              select: { fullName: true }
            },
            superSpecialEducatorProfile: {
              select: { fullName: true }
            }
          }
        }
      }
    });

    return activities;
  }
}
