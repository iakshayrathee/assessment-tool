import { PrismaClient, UserRole, AssessmentStatus, StudentStatus } from '@prisma/client';
import { AuthUtils } from '../utils/auth';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  // Dashboard Overview
  async getDashboardOverview() {
    const [
      totalUsers,
      totalCenters,
      totalSchools,
      totalStudents,
      totalReports,
      activeUsers,
      pendingApprovals,
      recentActivity
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.centerProfile.count(),
      this.prisma.school.count(),
      this.prisma.student.count(),
      this.prisma.report.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.getPendingApprovalsCount(),
      this.getRecentActivity(10)
    ]);

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    return {
      overview: {
        totalUsers,
        totalCenters,
        totalSchools,
        totalStudents,
        totalReports,
        activeUsers,
        pendingApprovals: pendingApprovals.total
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      recentActivity
    };
  }

  // User Management
  async getAllUsers(page: number, limit: number, role?: UserRole, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (role) where.role = role;
    if (status) where.isActive = status === 'active';
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { adminProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        { specialEducatorProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        { superSpecialEducatorProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        { centerProfile: { centerName: { contains: search, mode: 'insensitive' } } },
        { parentProfile: { fullName: { contains: search, mode: 'insensitive' } } },
        { schoolViewerProfile: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          adminProfile: true,
          specialEducatorProfile: true,
          superSpecialEducatorProfile: true,
          centerProfile: true,
          parentProfile: true,
          schoolViewerProfile: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return { users, total };
  }

  async createUser(userData: any) {
    const { email, password, role, profileData } = userData;
    
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await AuthUtils.hashPassword(password);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role }
      });

      // Create role-specific profile
      await this.createRoleProfile(tx, user.id, role, profileData);

      return await tx.user.findUnique({
        where: { id: user.id },
        include: {
          adminProfile: true,
          specialEducatorProfile: true,
          superSpecialEducatorProfile: true,
          centerProfile: true,
          parentProfile: true,
          schoolViewerProfile: true
        }
      });
    });
  }

  async updateUser(userId: string, userData: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    return await this.prisma.$transaction(async (tx) => {
      if (userData.email || userData.isActive !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            email: userData.email,
            isActive: userData.isActive
          }
        });
      }

      if (userData.profileData) {
        await this.updateRoleProfile(tx, userId, user.role, userData.profileData);
      }

      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          adminProfile: true,
          specialEducatorProfile: true,
          superSpecialEducatorProfile: true,
          centerProfile: true,
          parentProfile: true,
          schoolViewerProfile: true
        }
      });
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    await this.prisma.user.delete({ where: { id: userId } });
  }

  async activateUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });
  }

  async deactivateUser(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });
  }

  // Center Management
  async getAllCenters(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { centerName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [centers, total] = await Promise.all([
      this.prisma.centerProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: true,
          schools: true,
          students: { select: { id: true } },
          assignments: {
            include: {
              specialEducator: { include: { user: true } },
              superSpecialEducator: { include: { user: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.centerProfile.count({ where })
    ]);

    return { centers, total };
  }

  async createCenter(centerData: any) {
    const { email, password, centerName, address, phone, contactPerson, operatingHours, description } = centerData;
    
    const hashedPassword = await AuthUtils.hashPassword(password);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, role: UserRole.CENTER }
      });

      return await tx.centerProfile.create({
        data: {
          userId: user.id,
          centerName,
          address,
          phone,
          email,
          contactPerson,
          operatingHours,
          description
        },
        include: { user: true }
      });
    });
  }

  async updateCenter(centerId: string, centerData: any) {
    return await this.prisma.centerProfile.update({
      where: { id: centerId },
      data: centerData,
      include: { user: true, schools: true }
    });
  }

  async deleteCenter(centerId: string) {
    const center = await this.prisma.centerProfile.findUnique({
      where: { id: centerId },
      include: { user: true }
    });
    
    if (!center) throw new Error('Center not found');

    await this.prisma.user.delete({ where: { id: center.userId } });
  }

  // Helper methods for role profiles
  private async createRoleProfile(tx: any, userId: string, role: UserRole, profileData: any) {
    switch (role) {
      case UserRole.ADMIN:
        await tx.adminProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case UserRole.SPECIAL_EDUCATOR:
        await tx.specialEducatorProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        await tx.superSpecialEducatorProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case UserRole.CENTER:
        await tx.centerProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case UserRole.PARENT:
        await tx.parentProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case UserRole.SCHOOL_VIEWER:
        await tx.schoolViewerProfile.create({
          data: { userId, ...profileData }
        });
        break;
    }
  }

  private async updateRoleProfile(tx: any, userId: string, role: UserRole, profileData: any) {
    switch (role) {
      case UserRole.ADMIN:
        await tx.adminProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      case UserRole.SPECIAL_EDUCATOR:
        await tx.specialEducatorProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      // Add other cases as needed
    }
  }

  private async getPendingApprovalsCount() {
    // This would be implemented based on your approval system
    // For now, returning mock data
    return { total: 5 };
  }

  private async getRecentActivity(limit: number) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      user: log.user.email,
      timestamp: log.createdAt,
      details: log.details
    }));
  }

  // School Management
  async getAllSchools(page: number, limit: number, search?: string, centerId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (centerId) where.centerId = centerId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { principalName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip,
        take: limit,
        include: {
          center: true,
          students: { select: { id: true } },
          viewers: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.school.count({ where })
    ]);

    return { schools, total };
  }

  async createSchool(schoolData: any) {
    const { name, address, phone, email, principalName, centerId } = schoolData;
    
    return await this.prisma.school.create({
      data: {
        name,
        address,
        phone,
        email,
        principalName,
        centerId
      },
      include: { center: true }
    });
  }

  async updateSchool(schoolId: string, schoolData: any) {
    return await this.prisma.school.update({
      where: { id: schoolId },
      data: schoolData,
      include: { center: true, students: true }
    });
  }

  async deleteSchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { students: true }
    });
    
    if (!school) throw new Error('School not found');
    
    if (school.students.length > 0) {
      throw new Error('Cannot delete school with enrolled students');
    }

    await this.prisma.school.delete({ where: { id: schoolId } });
  }

  // Student Management
  async getAllStudents(page: number, limit: number, search?: string, centerId?: string, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (centerId) where.centerId = centerId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { grade: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          center: true,
          school: true,
          parent: { include: { user: true } },
          assignments: {
            include: {
              specialEducator: { include: { user: true } }
            }
          },
          reports: { select: { id: true, type: true, status: true } },
          assessments: { select: { id: true, status: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.student.count({ where })
    ]);

    return { students, total };
  }

  async getStudentDetails(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        center: true,
        school: true,
        parent: { include: { user: true } },
        assignments: {
          include: {
            specialEducator: { include: { user: true } }
          }
        },
        intakeForms: true,
        assessments: {
          include: {
            specialEducator: { include: { user: true } }
          }
        },
        iepGoals: {
          include: {
            progressUpdates: true,
            specialEducator: { include: { user: true } }
          }
        },
        reports: {
          include: {
            specialEducator: { include: { user: true } },
            superSpecialEducator: { include: { user: true } }
          }
        },
        sessionNotes: {
          include: {
            specialEducator: { include: { user: true } }
          }
        },
        documents: true
      }
    });

    if (!student) throw new Error('Student not found');
    return student;
  }

  // Reports and Analytics
  async getAllReports(page: number, limit: number, type?: string, status?: string, centerId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (centerId) {
      where.student = { centerId };
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: { include: { center: true } },
          specialEducator: { include: { user: true } },
          superSpecialEducator: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.report.count({ where })
    ]);

    return { reports, total };
  }

  async getSystemAnalytics(period: string = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [
      userGrowth,
      studentGrowth,
      assessmentStats,
      iepStats,
      reportStats,
      centerStats
    ] = await Promise.all([
      // User growth
      this.prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true }
      }),
      // Student growth
      this.prisma.student.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true }
      }),
      // Assessment statistics
      this.prisma.assessment.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      // IEP Goal statistics
      this.prisma.iEPGoal.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      // Report statistics
      this.prisma.report.groupBy({
        by: ['type', 'status'],
        _count: { id: true }
      }),
      // Center performance
      this.prisma.centerProfile.findMany({
        include: {
          students: { select: { id: true } },
          assignments: { select: { id: true } },
          schools: { select: { id: true } }
        }
      })
    ]);

    return {
      period,
      startDate,
      endDate: now,
      userGrowth: this.processTimeSeriesData(userGrowth),
      studentGrowth: this.processTimeSeriesData(studentGrowth),
      assessmentStats: this.processGroupedData(assessmentStats),
      iepStats: this.processGroupedData(iepStats),
      reportStats: this.processReportStats(reportStats),
      centerPerformance: this.processCenterStats(centerStats)
    };
  }

  // Audit Logs
  async getAuditLogs(
    page: number, 
    limit: number, 
    action?: string, 
    userId?: string, 
    resource?: string,
    startDate?: string,
    endDate?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }

  async createAuditLog(userId: string, action: string, resource: string, resourceId?: string, details?: any, ipAddress?: string, userAgent?: string) {
    return await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      }
    });
  }

  // Role Assignments
  async assignEducatorToCenter(assignmentData: any) {
    const { centerId, educatorId, educatorType } = assignmentData;
    
    // Check if assignment already exists
    const existingAssignment = await this.prisma.centerAssignment.findFirst({
      where: {
        centerId,
        OR: [
          { specialEducatorId: educatorId },
          { superSpecialEducatorId: educatorId }
        ]
      }
    });

    if (existingAssignment) {
      throw new Error('Educator is already assigned to this center');
    }

    const assignmentFields: any = { centerId };
    if (educatorType === 'SPECIAL_EDUCATOR') {
      assignmentFields.specialEducatorId = educatorId;
    } else {
      assignmentFields.superSpecialEducatorId = educatorId;
    }

    return await this.prisma.centerAssignment.create({
      data: assignmentFields,
      include: {
        center: true,
        specialEducator: { include: { user: true } },
        superSpecialEducator: { include: { user: true } }
      }
    });
  }

  async removeEducatorFromCenter(assignmentId: string) {
    await this.prisma.centerAssignment.delete({
      where: { id: assignmentId }
    });
  }

  async assignStudentToEducator(assignmentData: any) {
    const { studentId, specialEducatorId } = assignmentData;
    
    // Check if assignment already exists
    const existingAssignment = await this.prisma.studentAssignment.findUnique({
      where: {
        studentId_specialEducatorId: {
          studentId,
          specialEducatorId
        }
      }
    });

    if (existingAssignment) {
      throw new Error('Student is already assigned to this educator');
    }

    return await this.prisma.studentAssignment.create({
      data: { studentId, specialEducatorId },
      include: {
        student: true,
        specialEducator: { include: { user: true } }
      }
    });
  }

  // Approval System
  async getPendingApprovals(page: number, limit: number, type?: string) {
    // This would be implemented based on your approval system
    // For now, returning mock data structure
    const mockApprovals = [
      {
        id: '1',
        type: 'USER_CREATION',
        title: 'New Special Educator Registration',
        requestedBy: 'Mumbai Learning Center',
        createdAt: new Date(),
        status: 'PENDING'
      }
    ];

    return {
      approvals: mockApprovals.slice((page - 1) * limit, page * limit),
      total: mockApprovals.length
    };
  }

  async approveRequest(requestId: string, adminId: string, comments?: string) {
    // Implementation depends on your approval system design
    throw new Error('Approval system not yet implemented');
  }

  async rejectRequest(requestId: string, adminId: string, reason?: string) {
    // Implementation depends on your approval system design
    throw new Error('Approval system not yet implemented');
  }

  // System Configuration
  async getSystemConfig() {
    // This would fetch system configuration from database or config files
    return {
      platform: {
        name: 'Knowled',
        version: '1.0.0',
        maintenance: false
      },
      features: {
        assessmentDomains: ['Reading', 'Writing', 'Math', 'Visual Perception', 'Motor Skills', 'Attention'],
        gradeList: ['Pre-K', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
        syllabusList: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE'],
        reportTypes: ['INTAKE', 'ASSESSMENT', 'IEP', 'PROGRESS']
      },
      security: {
        passwordMinLength: 6,
        sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxLoginAttempts: 5
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false
      }
    };
  }

  async updateSystemConfig(configData: any) {
    // This would update system configuration
    // Implementation depends on how you store configuration
    return configData;
  }

  // Data Export
  async exportData(type: string, format: string, filters?: any) {
    // This would generate export files
    const exportId = `export_${Date.now()}`;
    
    return {
      exportId,
      type,
      format,
      status: 'PROCESSING',
      downloadUrl: null,
      createdAt: new Date()
    };
  }

  // Global Search
  async globalSearch(query: string, type?: string) {
    const results: any = {
      users: [],
      centers: [],
      schools: [],
      students: []
    };

    if (!type || type === 'users') {
      results.users = await this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { adminProfile: { fullName: { contains: query, mode: 'insensitive' } } },
            { specialEducatorProfile: { fullName: { contains: query, mode: 'insensitive' } } },
            { superSpecialEducatorProfile: { fullName: { contains: query, mode: 'insensitive' } } },
            { centerProfile: { centerName: { contains: query, mode: 'insensitive' } } },
            { parentProfile: { fullName: { contains: query, mode: 'insensitive' } } },
            { schoolViewerProfile: { fullName: { contains: query, mode: 'insensitive' } } }
          ]
        },
        take: 5,
        include: {
          adminProfile: true,
          specialEducatorProfile: true,
          superSpecialEducatorProfile: true,
          centerProfile: true,
          parentProfile: true,
          schoolViewerProfile: true
        }
      });
    }

    if (!type || type === 'centers') {
      results.centers = await this.prisma.centerProfile.findMany({
        where: {
          OR: [
            { centerName: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { contactPerson: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        include: { user: true }
      });
    }

    if (!type || type === 'schools') {
      results.schools = await this.prisma.school.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { principalName: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        include: { center: true }
      });
    }

    if (!type || type === 'students') {
      results.students = await this.prisma.student.findMany({
        where: {
          fullName: { contains: query, mode: 'insensitive' }
        },
        take: 5,
        include: { center: true, school: true, parent: { include: { user: true } } }
      });
    }

    return results;
  }

  // Helper methods for analytics
  private processTimeSeriesData(data: any[]) {
    // Group by date and sum counts
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + item._count.id;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  private processGroupedData(data: any[]) {
    return data.reduce((acc, item) => {
      const key = Object.keys(item).find(k => k !== '_count');
      if (key) {
        acc[item[key]] = item._count[Object.keys(item._count)[0]];
      }
      return acc;
    }, {});
  }

  private processReportStats(data: any[]) {
    return data.reduce((acc, item) => {
      const key = `${item.type}_${item.status}`;
      acc[key] = item._count.id;
      return acc;
    }, {});
  }

  private processCenterStats(centers: any[]) {
    return centers.map(center => ({
      id: center.id,
      name: center.centerName,
      studentsCount: center.students.length,
      educatorsCount: center.assignments.length,
      schoolsCount: center.schools.length
    }));
  }
}
