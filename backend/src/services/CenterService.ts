import { PrismaClient, UserRole, StudentStatus } from '@prisma/client';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';

export class CenterService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get center dashboard data with comprehensive statistics
   */
  async getCenterDashboard(centerId: string, requestingUserId: string, requestingUserRole: UserRole) {
    // Verify access permissions
    if (requestingUserRole === UserRole.CENTER) {
      const centerUser = await this.prisma.user.findFirst({
        where: { id: requestingUserId, role: UserRole.CENTER },
        include: { centerProfile: true }
      });
      
      if (!centerUser || centerUser.centerProfile?.id !== centerId) {
        throw new UnauthorizedError('Access denied to this center');
      }
    }

    const center = await this.prisma.centerProfile.findUnique({
      where: { id: centerId },
      include: {
        user: {
          select: { id: true, email: true, isActive: true }
        },
        schools: {
          include: {
            students: {
              select: { id: true, status: true }
            }
          }
        },
        students: {
          include: {
            assignments: {
              where: { isActive: true },
              include: {
                specialEducator: {
                  select: { id: true, fullName: true }
                }
              }
            },
            reports: {
              select: { id: true, type: true, status: true, createdAt: true }
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
                yearsOfExperience: true,
                specializationAreas: true
              }
            },
            superSpecialEducator: {
              select: {
                id: true,
                fullName: true,
                yearsOfExperience: true,
                specializationAreas: true
              }
            }
          }
        }
      }
    });

    if (!center) {
      throw new NotFoundError('Center not found');
    }

    // Calculate comprehensive statistics
    const totalStudents = center.students.length;
    const activeStudents = center.students.filter(s => s.status === StudentStatus.ACTIVE).length;
    const totalSchools = center.schools.length;
    
    const assignedEducators = new Set(
      center.assignments
        .filter(a => a.specialEducator)
        .map(a => a.specialEducator!.id)
    ).size;
    
    const assignedSuperEducators = new Set(
      center.assignments
        .filter(a => a.superSpecialEducator)
        .map(a => a.superSpecialEducator!.id)
    ).size;

    // Students without assignments
    const unassignedStudents = center.students.filter(s => 
      s.assignments.length === 0 && s.status === StudentStatus.ACTIVE
    ).length;

    // Recent activities
    const recentStudents = center.students
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(student => ({
        id: student.id,
        fullName: student.fullName,
        createdAt: student.createdAt,
        status: student.status,
        hasAssignment: student.assignments.length > 0,
        assignedEducator: student.assignments[0]?.specialEducator?.fullName || null
      }));

    // Pending reports
    const pendingReports = center.students.reduce((acc, student) => {
      const pending = student.reports.filter(r => r.status === 'PENDING').length;
      return acc + pending;
    }, 0);

    return {
      overview: {
        totalStudents,
        activeStudents,
        totalSchools,
        assignedEducators,
        assignedSuperEducators,
        unassignedStudents,
        pendingReports
      },
      recentStudents,
      schools: center.schools.map(school => ({
        id: school.id,
        name: school.name,
        address: school.address,
        phone: school.phone,
        principalName: school.principalName,
        studentCount: school.students.length,
        activeStudentCount: school.students.filter(s => s.status === StudentStatus.ACTIVE).length
      })),
      educators: center.assignments.map(assignment => ({
        id: assignment.id,
        type: assignment.specialEducator ? 'Special Educator' : 'Super Special Educator',
        name: assignment.specialEducator?.fullName || assignment.superSpecialEducator?.fullName,
        educatorId: assignment.specialEducator?.id || assignment.superSpecialEducator?.id,
        experience: assignment.specialEducator?.yearsOfExperience || assignment.superSpecialEducator?.yearsOfExperience,
        specializations: assignment.specialEducator?.specializationAreas || assignment.superSpecialEducator?.specializationAreas,
        assignedDate: assignment.assignedDate,
        isActive: assignment.isActive
      }))
    };
  }

  /**
   * Get all students for a center with filtering and pagination
   */
  async getCenterStudents(
    centerId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: StudentStatus;
      schoolId?: string;
      hasAssignment?: boolean;
    } = {}
  ) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      schoolId,
      hasAssignment
    } = options;

    const skip = (page - 1) * limit;
    const where: any = { centerId };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { grade: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          school: {
            select: { id: true, name: true }
          },
          parent: {
            include: {
              user: {
                select: { id: true, email: true }
              }
            }
          },
          assignments: {
            where: { isActive: true },
            include: {
              specialEducator: {
                select: { id: true, fullName: true }
              }
            }
          },
          reports: {
            select: { id: true, type: true, status: true }
          },
          assessments: {
            select: { id: true, status: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.student.count({ where })
    ]);

    // Filter by assignment status if specified
    let filteredStudents = students;
    if (hasAssignment !== undefined) {
      filteredStudents = students.filter(student => 
        hasAssignment ? student.assignments.length > 0 : student.assignments.length === 0
      );
    }

    return {
      students: filteredStudents.map((student: any) => ({
        ...student,
        hasAssignment: student.assignments.length > 0,
        assignedEducator: student.assignments[0]?.specialEducator || null,
        pendingReports: student.reports.filter((r: any) => r.status === 'PENDING').length,
        completedAssessments: student.assessments.filter((a: any) => a.status === 'COMPLETED').length,
        // Additional computed fields for better frontend experience
        totalReports: student.reports.length,
        totalAssessments: student.assessments.length,
        lastReportDate: student.reports[0]?.createdAt || null,
        lastAssessmentDate: student.assessments[0]?.createdAt || null,
        overallProgress: student.iepGoals?.length > 0 
          ? Math.round(student.iepGoals.reduce((sum: number, goal: any) => sum + goal.progressPercent, 0) / student.iepGoals.length)
          : 0
      })),
      pagination: {
        page,
        limit,
        total: hasAssignment !== undefined ? filteredStudents.length : total,
        totalPages: Math.ceil((hasAssignment !== undefined ? filteredStudents.length : total) / limit)
      }
    };
  }

  /**
   * Get all schools linked to a center
   */
  async getCenterSchools(centerId: string) {
    const schools = await this.prisma.school.findMany({
      where: { centerId },
      include: {
        students: {
          select: {
            id: true,
            fullName: true,
            status: true,
            grade: true
          }
        },
        viewers: {
          include: {
            user: {
              select: { id: true, email: true, isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return schools.map(school => ({
      ...school,
      studentCount: school.students.length,
      activeStudentCount: school.students.filter(s => s.status === StudentStatus.ACTIVE).length,
      viewerCount: school.viewers.length
    }));
  }

  /**
   * Get all educators assigned to a center
   */
  async getCenterEducators(centerId: string, options?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 50, search } = options || {};
    const skip = (page - 1) * limit;

    // Build where clause for search - only for special educators
    const searchWhere = search ? {
      OR: [
        {
          specialEducator: {
            fullName: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        },
        {
          specialEducator: {
            user: {
              email: {
                contains: search,
                mode: 'insensitive' as const
              }
            }
          }
        }
      ]
    } : {};

    const whereClause = {
      centerId,
      isActive: true,
      specialEducatorId: { not: null }, // Only get assignments with special educators
      ...searchWhere
    };

    const [assignments, total] = await Promise.all([
      this.prisma.centerAssignment.findMany({
        where: whereClause,
        include: {
          specialEducator: {
            include: {
              user: {
                select: { id: true, email: true, isActive: true, lastLogin: true }
              },
              assignedStudents: {
                where: { isActive: true },
                include: {
                  student: {
                    select: { 
                      id: true, 
                      fullName: true, 
                      status: true,
                      grade: true,
                      school: {
                        select: {
                          id: true,
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { assignedDate: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.centerAssignment.count({
        where: whereClause
      })
    ]);

    const educators = assignments.map(assignment => {
      const educator = assignment.specialEducator!; // We know it exists due to our filter

      // Get unique schools from assigned students
      const assignedStudents = educator.assignedStudents || [];
      const schools = Array.from(new Set(
        assignedStudents
          .map(as => as.student.school)
          .filter(school => school)
          .map(school => ({ id: school!.id, name: school!.name }))
      ));

      return {
        assignmentId: assignment.id,
        educatorId: educator.id,
        type: 'Special Educator',
        fullName: educator.fullName,
        email: educator.user.email,
        phone: educator.phone,
        yearsOfExperience: educator.yearsOfExperience,
        specializationAreas: educator.specializationAreas,
        isActive: educator.user.isActive,
        lastLogin: educator.user.lastLogin,
        assignedDate: assignment.assignedDate,
        assignedStudentCount: assignedStudents.length,
        assignedStudents: assignedStudents.map(as => ({
          id: as.student.id,
          fullName: as.student.fullName,
          status: as.student.status,
          grade: as.student.grade,
          schoolName: as.student.school?.name || 'Unknown School'
        })),
        assignedSchools: schools
      };
    });

    return {
      educators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new school and link it to the center
   */
  async createSchool(centerId: string, schoolData: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    principalName?: string;
  }) {
    // Verify center exists
    const center = await this.prisma.centerProfile.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      throw new NotFoundError('Center not found');
    }

    // Check if school name already exists for this center
    const existingSchool = await this.prisma.school.findFirst({
      where: {
        centerId,
        name: schoolData.name
      }
    });

    if (existingSchool) {
      throw new ValidationError('School with this name already exists in the center');
    }

    const school = await this.prisma.school.create({
      data: {
        ...schoolData,
        centerId
      },
      include: {
        students: {
          select: { id: true }
        }
      }
    });

    return school;
  }

  /**
   * Assign an educator to the center
   */
  async assignEducator(
    centerId: string,
    educatorId: string,
    educatorType: 'SPECIAL_EDUCATOR' | 'SUPER_SPECIAL_EDUCATOR'
  ) {
    // Verify center exists
    const center = await this.prisma.centerProfile.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      throw new NotFoundError('Center not found');
    }

    // Verify educator exists and has correct role
    const expectedRole = educatorType === 'SPECIAL_EDUCATOR' 
      ? UserRole.SPECIAL_EDUCATOR 
      : UserRole.SUPER_SPECIAL_EDUCATOR;

    const educator = await this.prisma.user.findFirst({
      where: {
        id: educatorId,
        role: expectedRole,
        isActive: true
      }
    });

    if (!educator) {
      throw new NotFoundError('Educator not found or inactive');
    }

    // Check if already assigned
    const existingAssignment = await this.prisma.centerAssignment.findFirst({
      where: {
        centerId,
        ...(educatorType === 'SPECIAL_EDUCATOR' 
          ? { specialEducatorId: educatorId }
          : { superSpecialEducatorId: educatorId }
        ),
        isActive: true
      }
    });

    if (existingAssignment) {
      throw new ValidationError('Educator is already assigned to this center');
    }

    const assignmentData: any = {
      centerId
    };

    if (educatorType === 'SPECIAL_EDUCATOR') {
      assignmentData.specialEducatorId = educatorId;
    } else {
      assignmentData.superSpecialEducatorId = educatorId;
    }

    const assignment = await this.prisma.centerAssignment.create({
      data: assignmentData,
      include: {
        specialEducator: {
          select: {
            id: true,
            fullName: true,
            yearsOfExperience: true
          }
        },
        superSpecialEducator: {
          select: {
            id: true,
            fullName: true,
            yearsOfExperience: true
          }
        }
      }
    });

    return assignment;
  }

  /**
   * Remove educator assignment from center
   */
  async removeEducatorAssignment(centerId: string, assignmentId: string) {
    const assignment = await this.prisma.centerAssignment.findFirst({
      where: {
        id: assignmentId,
        centerId,
        isActive: true
      }
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    await this.prisma.centerAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false }
    });

    return { success: true };
  }

  /**
   * Get center reports and compliance status
   */
  async getCenterReports(centerId: string, options: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  } = {}) {
    const { page = 1, limit = 10, type, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      student: { centerId }
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          student: {
            select: { id: true, fullName: true, grade: true }
          },
          specialEducator: {
            select: { id: true, fullName: true }
          },
          superSpecialEducator: {
            select: { id: true, fullName: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.report.count({ where })
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get compliance monitoring data
  async getCenterCompliance(centerId: string) {
    // Try to find center by id first, then by userId if not found
    let center = await this.prisma.centerProfile.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      center = await this.prisma.centerProfile.findUnique({
        where: { userId: centerId }
      });
    }

    if (!center) {
      throw new NotFoundError('Center not found');
    }

    // Get compliance metrics
    const [
      totalStudents,
      studentsWithReports,
      overdueReports,
      completedReports,
      pendingAssessments,
      expiredIEPs
    ] = await Promise.all([
      // Total students
      this.prisma.student.count({
        where: { centerId: center.id }
      }),
      
      // Students with at least one report
      this.prisma.student.count({
        where: {
          centerId: center.id,
          reports: {
            some: {}
          }
        }
      }),
      
      // Overdue reports (created more than 30 days ago and still pending)
      this.prisma.report.count({
        where: {
          student: { centerId: center.id },
          status: 'PENDING' as any,
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Completed reports in last 30 days
      this.prisma.report.count({
        where: {
          student: { centerId: center.id },
          status: 'COMPLETED' as any,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Pending assessments
      this.prisma.assessment.count({
        where: {
          student: { centerId: center.id },
          status: 'PENDING'
        }
      }),
      
      // Expired IEPs (target date passed)
      this.prisma.iEPGoal.count({
        where: {
          student: { centerId: center.id },
          targetDate: {
            lt: new Date()
          },
          status: {
            not: 'ACHIEVED'
          }
        }
      })
    ]);

    const complianceRate = totalStudents > 0 ? Math.round((studentsWithReports / totalStudents) * 100) : 0;
    const reportCompletionRate = (completedReports + overdueReports) > 0 ? 
      Math.round((completedReports / (completedReports + overdueReports)) * 100) : 0;

    return {
      totalStudents,
      studentsWithReports,
      complianceRate,
      overdueReports,
      completedReports,
      reportCompletionRate,
      pendingAssessments,
      expiredIEPs,
      alerts: [
        ...(overdueReports > 0 ? [`${overdueReports} overdue reports need attention`] : []),
        ...(pendingAssessments > 0 ? [`${pendingAssessments} assessments pending completion`] : []),
        ...(expiredIEPs > 0 ? [`${expiredIEPs} IEP goals have passed their target date`] : [])
      ]
    };
  }

  // Get overdue reports
  async getCenterOverdueReports(centerId: string, options: {
    page: number;
    limit: number;
  }) {
    // Try to find center by id first, then by userId if not found
    let center = await this.prisma.centerProfile.findUnique({
      where: { id: centerId }
    });

    if (!center) {
      center = await this.prisma.centerProfile.findUnique({
        where: { userId: centerId }
      });
    }

    if (!center) {
      throw new NotFoundError('Center not found');
    }

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where = {
      student: { centerId: center.id },
      status: 'PENDING' as any,
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      }
    };

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
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' } // Oldest first
      }),
      this.prisma.report.count({ where })
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAvailableEducators(options: {
    page: number;
    limit: number;
  }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Get special educators that are NOT assigned to any center
    const [educators, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: 'SPECIAL_EDUCATOR',
          isActive: true,
          specialEducatorProfile: {
            centerAssignments: {
              none: {
                isActive: true
              }
            }
          }
        },
        include: {
          specialEducatorProfile: {
            include: {
              centerAssignments: {
                where: {
                  isActive: true
                },
                include: {
                  center: {
                    select: {
                      id: true,
                      centerName: true,
                      address: true
                    }
                  }
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({
        where: {
          role: 'SPECIAL_EDUCATOR',
          isActive: true,
          specialEducatorProfile: {
            centerAssignments: {
              none: {
                isActive: true
              }
            }
          }
        }
      })
    ]);

    // Transform the data to include assignment status
    const transformedEducators = educators.map(educator => ({
      id: educator.id,
      email: educator.email,
      fullName: educator.specialEducatorProfile?.fullName || '',
      phoneNumber: educator.specialEducatorProfile?.phone || '',
      isActive: educator.isActive,
      createdAt: educator.createdAt,
      specialEducatorProfile: educator.specialEducatorProfile ? {
        id: educator.specialEducatorProfile.id,
        specialization: educator.specialEducatorProfile.specializationAreas,
        experience: educator.specialEducatorProfile.yearsOfExperience,
        qualifications: educator.specialEducatorProfile.highestQualification,
        bio: educator.specialEducatorProfile.personalStatement,
        assignedCenters: educator.specialEducatorProfile.centerAssignments?.map(assignment => ({
          id: assignment.center.id,
          name: assignment.center.centerName,
          address: assignment.center.address,
          assignedAt: assignment.createdAt
        })) || [],
        isAssigned: false // These educators are guaranteed to be unassigned
      } : null
    }));

    return {
      educators: transformedEducators,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get cities and centers data for work locations dropdown
  async getCitiesAndCenters() {
    // Get all active centers with their addresses
    const centers = await this.prisma.centerProfile.findMany({
      where: {
        user: {
          isActive: true
        }
      },
      select: {
        id: true,
        centerName: true,
        address: true
      },
      orderBy: {
        centerName: 'asc'
      }
    });

    // Extract cities from addresses
    const cities = new Set<string>();
    const centersByCity: Record<string, Array<{id: string, name: string}>> = {};

    centers.forEach(center => {
      if (center.address) {
        // Simple city extraction - assume city is the last part of address before state/country
        const addressParts = center.address.split(',').map(part => part.trim());
        const city = addressParts[addressParts.length - 2] || center.address; // Second last part is usually city
        
        if (city) {
          cities.add(city);
          
          if (!centersByCity[city]) {
            centersByCity[city] = [];
          }
          
          centersByCity[city].push({
            id: center.id,
            name: center.centerName
          });
        }
      }
    });

    // Convert to sorted arrays
    const sortedCities = Array.from(cities).sort();
    
    // Sort centers within each city
    Object.keys(centersByCity).forEach(city => {
      centersByCity[city].sort((a, b) => a.name.localeCompare(b.name));
    });

    return {
      cities: sortedCities,
      centersByCity
    };
  }

  // Get all special educators (both assigned and unassigned)
  async getAllSpecialEducators(options: {
    page: number;
    limit: number;
    search?: string;
    centerId?: string; // Optional: filter educators not assigned to this center
  }) {
    const { page, limit, search, centerId } = options;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {
      role: 'SPECIAL_EDUCATOR',
      isActive: true,
      specialEducatorProfile: {
        isNot: null
      }
    };

    if (search) {
      where.OR = [
        {
          specialEducatorProfile: {
            fullName: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive' as const
          }
        },
        {
          specialEducatorProfile: {
            specializationAreas: {
              hasSome: [search]
            }
          }
        }
      ];
    }

    // Get all special educators with their assignment counts
    const [educators, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          specialEducatorProfile: {
            include: {
              centerAssignments: {
                where: {
                  isActive: true
                },
                include: {
                  center: {
                    select: {
                      id: true,
                      centerName: true,
                      address: true,
                      schools: {
                        select: {
                          id: true
                        }
                      },
                      students: {
                        where: {
                          status: 'ACTIVE'
                        },
                        select: {
                          id: true
                        }
                      }
                    }
                  }
                }
              },
              // Get student assignments count
              assignedStudents: {
                where: {
                  isActive: true
                },
                select: {
                  id: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({
        where
      })
    ]);

    // Transform the data to include assignment status and counts
    const transformedEducators = educators.map(educator => {
      const centerAssignments = educator.specialEducatorProfile?.centerAssignments || [];
      const studentAssignments = educator.specialEducatorProfile?.assignedStudents || [];
      
      // Calculate counts
      const centerCount = centerAssignments.length;
      const studentCount = studentAssignments.length;
      
      // Calculate unique school count from all assigned centers
      const schoolCount = new Set(
        centerAssignments.flatMap(assignment => 
          assignment.center.schools.map(school => school.id)
        )
      ).size;

      return {
        id: educator.id,
        email: educator.email,
        fullName: educator.specialEducatorProfile?.fullName || '',
        phoneNumber: educator.specialEducatorProfile?.phone || '',
        yearsOfExperience: educator.specialEducatorProfile?.yearsOfExperience || 0,
        specializationAreas: educator.specialEducatorProfile?.specializationAreas || [],
        isActive: educator.isActive,
        createdAt: educator.createdAt,
        assignedCenters: centerAssignments.map(assignment => ({
          id: assignment.center.id,
          name: assignment.center.centerName,
          address: assignment.center.address,
          assignedAt: assignment.createdAt
        })) || [],
        isAssigned: centerCount > 0,
        isAssignedToCurrentCenter: centerId 
          ? centerAssignments.some(assignment => 
              assignment.center.id === centerId && assignment.isActive
            )
          : false,
        // Add counts
        centerCount,
        schoolCount,
        studentCount
      };
    });

    // Filter out educators already assigned to the current center if centerId is provided
    const filteredEducators = centerId
      ? transformedEducators.filter(educator => !educator.isAssignedToCurrentCenter)
      : transformedEducators;

    return {
      educators: filteredEducators,
      pagination: {
        page,
        limit,
        total: filteredEducators.length === transformedEducators.length ? total : filteredEducators.length,
        pages: Math.ceil((filteredEducators.length === transformedEducators.length ? total : filteredEducators.length) / limit)
      }
    };
  }

  /**
   * Get unlinked schools (schools not associated with any center)
   */
  async getUnlinkedSchools(options?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 50, search } = options || {};
    const skip = (page - 1) * limit;

    // Build where clause for unlinked schools
    const where: any = {
      OR: [
        { centerId: null },
        { centerId: '' }
      ]
    };

    // Add search filter if provided
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { address: { contains: search, mode: 'insensitive' as const } },
        { principalName: { contains: search, mode: 'insensitive' as const } }
      ];
    }

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        include: {
          students: {
            select: {
              id: true,
              fullName: true,
              status: true,
              grade: true
            }
          },
          viewers: {
            include: {
              user: {
                select: { id: true, email: true, isActive: true }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      this.prisma.school.count({ where })
    ]);

    return {
      data: schools.map(school => ({
        ...school,
        studentCount: school.students.length,
        activeStudentCount: school.students.filter(s => s.status === 'ACTIVE').length,
        viewerCount: school.viewers.length
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
