import { PrismaClient } from '@prisma/client';

export interface ParentDashboardData {
  overview: {
    totalChildren: number;
    activeGoals: number;
    achievedGoals: number;
    totalReports: number;
    openConcerns: number;
  };
  children: any[];
  recentConcerns: any[];
  recentDocuments: any[];
}

export interface CreateConcernData {
  studentId?: string;
  title: string;
  description: string;
  category?: string;
  priority?: string;
}

export interface UpdateParentProfileData {
  fullName?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
}

export interface CreateDocumentData {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  category?: string;
  description?: string;
}

export class ParentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive dashboard data for a parent
   */
  async getDashboardData(parentUserId: string): Promise<ParentDashboardData> {
    const parent = await this.prisma.user.findFirst({
      where: {
        id: parentUserId,
        role: 'PARENT'
      },
      include: {
        parentProfile: {
          include: {
            children: {
              include: {
                assignments: {
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
                center: {
                  select: {
                    centerName: true,
                    phone: true
                  }
                },
                school: {
                  select: {
                    name: true,
                    phone: true
                  }
                },
                reports: {
                  where: {
                    status: 'COMPLETED'
                  },
                  orderBy: {
                    createdAt: 'desc'
                  },
                  take: 5,
                  select: {
                    id: true,
                    type: true,
                    title: true,
                    createdAt: true
                  }
                },
                iepGoals: {
                  where: {
                    status: {
                      in: ['IN_PROGRESS', 'ACHIEVED']
                    }
                  },
                  select: {
                    id: true,
                    domain: true,
                    goalStatement: true,
                    status: true,
                    progressPercent: true,
                    targetDate: true
                  }
                }
              }
            },
            concerns: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            },
            documents: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            }
          }
        }
      }
    });

    if (!parent) {
      throw new Error('Parent not found');
    }

    // Calculate statistics
    const children = parent.parentProfile?.children || [];
    const totalChildren = children.length;
    const activeGoals = children.reduce((acc, child) => 
      acc + child.iepGoals.filter(goal => goal.status === 'IN_PROGRESS').length, 0
    );
    const achievedGoals = children.reduce((acc, child) => 
      acc + child.iepGoals.filter(goal => goal.status === 'ACHIEVED').length, 0
    );
    const totalReports = children.reduce((acc, child) => acc + child.reports.length, 0);
    const openConcerns = parent.parentProfile?.concerns.filter(c => c.status === 'Open').length || 0;

    return {
      overview: {
        totalChildren,
        activeGoals,
        achievedGoals,
        totalReports,
        openConcerns
      },
      children: children.map(child => ({
        id: child.id,
        fullName: child.fullName,
        age: child.age,
        grade: child.grade,
        status: child.status,
        center: child.center?.centerName,
        school: child.school?.name,
        assignedEducator: child.assignments[0]?.specialEducator?.fullName,
        educatorPhone: child.assignments[0]?.specialEducator?.phone,
        recentReports: child.reports,
        activeGoals: child.iepGoals.filter(goal => goal.status === 'IN_PROGRESS'),
        progressSummary: {
          totalGoals: child.iepGoals.length,
          inProgress: child.iepGoals.filter(goal => goal.status === 'IN_PROGRESS').length,
          achieved: child.iepGoals.filter(goal => goal.status === 'ACHIEVED').length,
          averageProgress: child.iepGoals.length > 0 
            ? Math.round(child.iepGoals.reduce((acc, goal) => acc + goal.progressPercent, 0) / child.iepGoals.length)
            : 0
        }
      })),
      recentConcerns: parent.parentProfile?.concerns || [],
      recentDocuments: parent.parentProfile?.documents || []
    };
  }

  /**
   * Get parent profile by user ID
   */
  async getParentProfile(parentUserId: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    return parentProfile;
  }

  /**
   * Submit a new concern
   */
  async createConcern(parentUserId: string, concernData: CreateConcernData) {
    // Verify parent profile exists
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    // If studentId provided, verify parent has access to this student
    if (concernData.studentId) {
      const student = await this.prisma.student.findFirst({
        where: {
          id: concernData.studentId,
          parentId: parentProfile.id
        }
      });

      if (!student) {
        throw new Error('Access denied to this student');
      }
    }

    return await this.prisma.parentConcern.create({
      data: {
        parentId: parentProfile.id,
        studentId: concernData.studentId,
        title: concernData.title,
        description: concernData.description,
        category: concernData.category || 'General',
        priority: concernData.priority || 'Medium'
      }
    });
  }

  /**
   * Get paginated concerns for a parent
   */
  async getConcerns(parentUserId: string, page: number = 1, limit: number = 10, status?: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    const where: any = {
      parentId: parentProfile.id
    };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [concerns, total] = await Promise.all([
      this.prisma.parentConcern.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.parentConcern.count({ where })
    ]);

    return {
      data: concerns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create a new document record
   */
  async createDocument(parentUserId: string, documentData: CreateDocumentData) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    return await this.prisma.parentDocument.create({
      data: {
        parentId: parentProfile.id,
        fileName: documentData.fileName,
        filePath: documentData.filePath,
        fileType: documentData.fileType,
        fileSize: documentData.fileSize,
        category: documentData.category || 'General',
        description: documentData.description
      }
    });
  }

  /**
   * Get paginated documents for a parent
   */
  async getDocuments(parentUserId: string, page: number = 1, limit: number = 10, category?: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    const where: any = {
      parentId: parentProfile.id
    };

    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      this.prisma.parentDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.parentDocument.count({ where })
    ]);

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get child reports (for parent access)
   */
  async getChildReports(parentUserId: string, childId: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    // Verify parent has access to this child
    const child = await this.prisma.student.findFirst({
      where: {
        id: childId,
        parentId: parentProfile.id
      }
    });

    if (!child) {
      throw new Error('Access denied to this child');
    }

    return await this.prisma.report.findMany({
      where: {
        studentId: childId,
        status: 'COMPLETED' // Only show completed reports to parents
      },
      include: {
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get child IEP goals (for parent access)
   */
  async getChildIEPGoals(parentUserId: string, childId: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    // Verify parent has access to this child
    const child = await this.prisma.student.findFirst({
      where: {
        id: childId,
        parentId: parentProfile.id
      }
    });

    if (!child) {
      throw new Error('Access denied to this child');
    }

    return await this.prisma.iEPGoal.findMany({
      where: {
        studentId: childId
      },
      include: {
        progressUpdates: {
          orderBy: { updateDate: 'desc' },
          take: 5
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update parent profile
   */
  async updateProfile(parentUserId: string, profileData: UpdateParentProfileData) {
    const updatedParent = await this.prisma.user.update({
      where: { id: parentUserId },
      data: {
        parentProfile: {
          update: {
            fullName: profileData.fullName || undefined,
            phone: profileData.phone || undefined,
            address: profileData.address || undefined,
            emergencyContact: profileData.emergencyContact || undefined
          }
        }
      },
      include: {
        parentProfile: true
      }
    });

    // Remove password from response
    const { password, ...parentWithoutPassword } = updatedParent;
    return parentWithoutPassword;
  }

  /**
   * Get detailed child information
   */
  async getChildDetails(parentUserId: string, childId: string) {
    const parentProfile = await this.prisma.parentProfile.findUnique({
      where: { userId: parentUserId }
    });

    if (!parentProfile) {
      throw new Error('Parent profile not found');
    }

    // Verify parent has access to this child
    const child = await this.prisma.student.findFirst({
      where: {
        id: childId,
        parentId: parentProfile.id
      },
      include: {
        center: {
          select: {
            centerName: true,
            phone: true,
            email: true,
            address: true
          }
        },
        school: {
          select: {
            name: true,
            phone: true,
            email: true,
            address: true
          }
        },
        assignments: {
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
        iepGoals: {
          include: {
            progressUpdates: {
              orderBy: { updateDate: 'desc' },
              take: 3
            }
          }
        },
        reports: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        sessionNotes: {
          orderBy: { sessionDate: 'desc' },
          take: 5,
          include: {
            specialEducator: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    });

    if (!child) {
      throw new Error('Access denied to this child');
    }

    return child;
  }
}
