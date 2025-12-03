import { PrismaClient, UserRole, AssessmentStatus, StudentStatus } from '@prisma/client';
import { AuthUtils } from '../utils/auth';

export class AdminService {
  constructor(private prisma: PrismaClient) { }

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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialEducatorProfile: true,
        superSpecialEducatorProfile: true,
        centerProfile: true
      }
    });
    if (!user) throw new Error('User not found');

    return await this.prisma.$transaction(async (tx) => {
      // If user is a center user, handle all students and related data first
      if (user.centerProfile) {
        const centerId = user.centerProfile.id;

        // First, handle all students associated with this center
        // We need to delete or reassign students before deleting the center
        await tx.studentAssignment.deleteMany({
          where: {
            student: {
              centerId: centerId
            }
          }
        });

        // Delete all assessments for students in this center
        await tx.assessment.deleteMany({
          where: {
            student: {
              centerId: centerId
            }
          }
        });

        // Delete all intake forms for students in this center
        await tx.intakeForm.deleteMany({
          where: {
            student: {
              centerId: centerId
            }
          }
        });

        // Delete all IEP goals for students in this center
        await tx.iEPGoal.deleteMany({
          where: {
            student: {
              centerId: centerId
            }
          }
        });

        // Delete all session notes for students in this center
        await tx.sessionNote.deleteMany({
          where: {
            student: {
              centerId: centerId
            }
          }
        });

        // Delete all reports for students in this center
        await tx.report.deleteMany({
          where: {
            student: {
              centerId: centerId
            }
          }
        });

        // Delete all students associated with this center
        await tx.student.deleteMany({
          where: { centerId: centerId }
        });

        // Delete all schools associated with this center
        await tx.school.deleteMany({
          where: { centerId: centerId }
        });

        // Delete all center assignments
        await tx.centerAssignment.deleteMany({
          where: { centerId: centerId }
        });
      }

      // If user is a special educator, handle all related data
      if (user.specialEducatorProfile) {
        const specialEducatorId = user.specialEducatorProfile.id;

        // Delete all assessments created by this educator
        await tx.assessment.deleteMany({
          where: { specialEducatorId }
        });

        // Delete all intake forms created by this educator
        await tx.intakeForm.deleteMany({
          where: { specialEducatorId }
        });

        // Delete all IEP goals created by this educator
        await tx.iEPGoal.deleteMany({
          where: { specialEducatorId }
        });

        // Delete all session notes created by this educator
        await tx.sessionNote.deleteMany({
          where: { specialEducatorId }
        });

        // Delete all reports created by this educator
        await tx.report.deleteMany({
          where: { specialEducatorId }
        });

        // Delete student assignments
        await tx.studentAssignment.deleteMany({
          where: { specialEducatorId }
        });

        // Delete center assignments
        await tx.centerAssignment.deleteMany({
          where: { specialEducatorId }
        });
      }

      // If user is a super special educator, remove their center assignments and reports
      if (user.superSpecialEducatorProfile) {
        const superSpecialEducatorId = user.superSpecialEducatorProfile.id;

        // Delete center assignments
        await tx.centerAssignment.deleteMany({
          where: { superSpecialEducatorId }
        });

        // Delete reports reviewed by this super special educator
        await tx.report.deleteMany({
          where: { superSpecialEducatorId }
        });
      }

      // Delete the user (profiles will be deleted due to CASCADE)
      await tx.user.delete({ where: { id: userId } });
    });
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
  private convertDateFields(data: any): any {
    const converted = { ...data };

    // Convert date string fields to Date objects
    const dateFields = ['dateOfBirth', 'rciValidityDate', 'startDate', 'targetDate', 'sessionDate', 'registrationDate'];

    dateFields.forEach(field => {
      if (converted[field] && typeof converted[field] === 'string') {
        // Convert date string to Date object
        converted[field] = new Date(converted[field]);
      }
    });

    return converted;
  }

  private async createRoleProfile(tx: any, userId: string, role: UserRole, profileData: any) {
    const convertedData = this.convertDateFields(profileData);

    switch (role) {
      case UserRole.ADMIN:
        await tx.adminProfile.create({
          data: { userId, ...convertedData }
        });
        break;
      case UserRole.SPECIAL_EDUCATOR:
        await tx.specialEducatorProfile.create({
          data: { userId, ...convertedData }
        });
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        await tx.superSpecialEducatorProfile.create({
          data: { userId, ...convertedData }
        });
        break;
      case UserRole.CENTER:
        // For center profiles, handle fullName field mapping
        const centerProfileData = { ...convertedData };

        // If fullName is provided but centerName is not, use fullName as centerName
        if (centerProfileData.fullName && !centerProfileData.centerName) {
          centerProfileData.centerName = centerProfileData.fullName;
        }

        // Always remove fullName as it's not a valid field for CenterProfile
        delete centerProfileData.fullName;

        await tx.centerProfile.create({
          data: { userId, ...centerProfileData }
        });
        break;
      case UserRole.PARENT:
        await tx.parentProfile.create({
          data: { userId, ...convertedData }
        });
        break;
      case UserRole.SCHOOL_VIEWER:
        // Handle school name - create school if it doesn't exist
        let schoolViewerData = { ...convertedData };
        if (convertedData.schoolName && !convertedData.schoolId) {
          // Try to find existing school by name
          let school = await tx.school.findFirst({
            where: { name: convertedData.schoolName }
          });

          // If school doesn't exist, create a new one
          if (!school) {
            // Get a default center ID if available, but make center optional
            const defaultCenter = await tx.centerProfile.findFirst();

            // Create school with all available details
            const schoolData: any = {
              name: convertedData.schoolName,
              address: convertedData.schoolAddress,
              phone: convertedData.schoolPhone,
              email: convertedData.schoolEmail,
              principalName: convertedData.schoolPrincipalName,
              centerId: convertedData.centerId // Only if explicitly provided
            };

            // Do NOT automatically assign centerId - keep schools unlinked by default
            // Schools should only be linked to centers when explicitly specified

            school = await tx.school.create({
              data: schoolData
            });
          }

          schoolViewerData.schoolId = school.id;
          delete schoolViewerData.schoolName;
        }
        await tx.schoolViewerProfile.create({
          data: { userId, ...schoolViewerData }
        });
        break;
    }
  }

  private async updateRoleProfile(tx: any, userId: string, role: UserRole, profileData: any) {
    const convertedData = this.convertDateFields(profileData);

    switch (role) {
      case UserRole.ADMIN:
        await tx.adminProfile.update({
          where: { userId },
          data: convertedData
        });
        break;
      case UserRole.SPECIAL_EDUCATOR:
        await tx.specialEducatorProfile.update({
          where: { userId },
          data: convertedData
        });
        break;
      case UserRole.SUPER_SPECIAL_EDUCATOR:
        await tx.superSpecialEducatorProfile.update({
          where: { userId },
          data: convertedData
        });
        break;
      case UserRole.CENTER:
        await tx.centerProfile.update({
          where: { userId },
          data: convertedData
        });
        break;
      case UserRole.PARENT:
        await tx.parentProfile.update({
          where: { userId },
          data: convertedData
        });
        break;
      case UserRole.SCHOOL_VIEWER:
        // Handle school name - create school if it doesn't exist
        let schoolViewerData = { ...convertedData };
        if (convertedData.schoolName && !convertedData.schoolId) {
          // Try to find existing school by name
          let school = await tx.school.findFirst({
            where: { name: convertedData.schoolName }
          });

          // If school doesn't exist, create a new one
          if (!school) {
            // Get a default center ID if available, but make center optional
            const defaultCenter = await tx.centerProfile.findFirst();

            // Create school with optional center association
            const schoolData: any = {
              name: convertedData.schoolName
            };

            // Only include centerId if a default center exists
            if (defaultCenter) {
              schoolData.centerId = defaultCenter.id;
            }

            school = await tx.school.create({
              data: schoolData
            });
          }

          schoolViewerData.schoolId = school.id;
          delete schoolViewerData.schoolName;
        }
        await tx.schoolViewerProfile.update({
          where: { userId },
          data: schoolViewerData
        });
        break;
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

    // Prepare data object, only include centerId if provided
    const data: any = {
      name,
      address,
      phone,
      email,
      principalName
    };

    // Only include centerId if it's provided and not empty
    if (centerId && centerId.trim() !== '') {
      data.centerId = centerId;
    }

    return await this.prisma.school.create({
      data,
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

    // First, get the educator's profile ID based on their user ID
    let profileId: string;
    if (educatorType === 'SPECIAL_EDUCATOR') {
      const profile = await this.prisma.specialEducatorProfile.findUnique({
        where: { userId: educatorId }
      });
      if (!profile) {
        throw new Error('Special educator profile not found');
      }
      profileId = profile.id;
    } else {
      const profile = await this.prisma.superSpecialEducatorProfile.findUnique({
        where: { userId: educatorId }
      });
      if (!profile) {
        throw new Error('Super special educator profile not found');
      }
      profileId = profile.id;
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.centerAssignment.findFirst({
      where: {
        centerId,
        OR: [
          { specialEducatorId: profileId },
          { superSpecialEducatorId: profileId }
        ]
      }
    });

    if (existingAssignment) {
      throw new Error('Educator is already assigned to this center');
    }

    const assignmentFields: any = { centerId };
    if (educatorType === 'SPECIAL_EDUCATOR') {
      assignmentFields.specialEducatorId = profileId;
    } else {
      assignmentFields.superSpecialEducatorId = profileId;
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

  async removeEducatorFromCenter(assignmentId: string, user?: any) {
    // First get the assignment to check permissions
    const assignment = await this.prisma.centerAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        center: true
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // If user is a CENTER, verify they can only unlink educators from their own center
    if (user && user.role === 'CENTER') {
      // Get the center profile for the current user
      const centerProfile = await this.prisma.centerProfile.findUnique({
        where: { userId: user.userId }
      });

      if (!centerProfile) {
        throw new Error('Center profile not found');
      }

      // Check if the assignment belongs to the center
      if (assignment.centerId !== centerProfile.id) {
        throw new Error('Insufficient permissions: You can only unlink educators from your own center');
      }
    }

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
    const skip = (page - 1) * limit;
    
    const where: any = {
      status: 'PENDING'
    };
    
    if (type && type !== 'all') {
      where.type = type;
    }

    const [approvals, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          requestedBy: {
            select: {
              id: true,
              email: true,
              role: true,
              adminProfile: true,
              centerProfile: true,
              specialEducatorProfile: true,
              superSpecialEducatorProfile: true,
              parentProfile: true,
              schoolViewerProfile: true
            }
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              role: true
            }
          },
          approvedBy: {
            select: {
              id: true,
              email: true
            }
          },
          rejectedBy: {
            select: {
              id: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.approvalRequest.count({ where })
    ]);

    return {
      approvals,
      total
    };
  }

  async approveRequest(requestId: string, adminId: string, comments?: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request is not in pending status');
    }

    // Process the approval based on request type
    switch (request.type) {
      case 'USER_CREATION':
        await this.processUserCreationApproval(request, adminId, comments);
        break;
      case 'ROLE_ASSIGNMENT':
        await this.processRoleAssignmentApproval(request, adminId, comments);
        break;
      default:
        throw new Error('Unsupported approval type');
    }

    // Update the approval request status
    return await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedById: adminId,
        approvedAt: new Date(),
        comments: comments || null
      },
      include: {
        requestedBy: true,
        targetUser: true,
        approvedBy: true
      }
    });
  }

  async rejectRequest(requestId: string, adminId: string, reason?: string) {
    const request = await this.prisma.approvalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Request is not in pending status');
    }

    return await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedById: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason || null
      },
      include: {
        requestedBy: true,
        targetUser: true,
        rejectedBy: true
      }
    });
  }

  private async processUserCreationApproval(request: any, adminId: string, comments?: string) {
    const requestData = request.requestedData as any;
    
    // Create the user account
    const user = await this.prisma.user.create({
      data: {
        email: requestData.email,
        password: requestData.password,
        role: requestData.role,
        isActive: true
      }
    });

    // Create the appropriate profile based on role
    if (requestData.profileData) {
      await this.createRoleProfileWithoutTx(user.id, requestData.role, requestData.profileData);
    }
  }

  private async processRoleAssignmentApproval(request: any, adminId: string, comments?: string) {
    if (!request.targetUserId) {
      throw new Error('Target user ID is required for role assignment');
    }

    const requestData = request.requestedData as any;
    
    // Update user role
    await this.prisma.user.update({
      where: { id: request.targetUserId },
      data: {
        role: requestData.role
      }
    });

    // Update or create profile if profile data is provided
    if (requestData.profileData) {
      await this.updateRoleProfileWithoutTx(request.targetUserId, requestData.role, requestData.profileData);
    }
  }

  private async createRoleProfileWithoutTx(userId: string, role: string, profileData: any) {
    switch (role) {
      case 'ADMIN':
        await this.prisma.adminProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case 'SPECIAL_EDUCATOR':
        await this.prisma.specialEducatorProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case 'SUPER_SPECIAL_EDUCATOR':
        await this.prisma.superSpecialEducatorProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case 'CENTER':
        await this.prisma.centerProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case 'PARENT':
        await this.prisma.parentProfile.create({
          data: { userId, ...profileData }
        });
        break;
      case 'SCHOOL_VIEWER':
        await this.prisma.schoolViewerProfile.create({
          data: { userId, ...profileData }
        });
        break;
    }
  }

  private async updateRoleProfileWithoutTx(userId: string, role: string, profileData: any) {
    switch (role) {
      case 'ADMIN':
        await this.prisma.adminProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      case 'SPECIAL_EDUCATOR':
        await this.prisma.specialEducatorProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      case 'SUPER_SPECIAL_EDUCATOR':
        await this.prisma.superSpecialEducatorProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      case 'CENTER':
        await this.prisma.centerProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      case 'PARENT':
        await this.prisma.parentProfile.update({
          where: { userId },
          data: profileData
        });
        break;
      case 'SCHOOL_VIEWER':
        await this.prisma.schoolViewerProfile.update({
          where: { userId },
          data: profileData
        });
        break;
    }
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
