import { PrismaClient, Student, StudentStatus } from '@prisma/client';
import { StudentData } from '../models';
import { DateHelper } from '../utils/helpers';

export class StudentRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Getter to access prisma instance
  get prismaClient(): PrismaClient {
    return this.prisma;
  }

  async create(studentData: StudentData): Promise<Student> {
    // Ensure dateOfBirth is a proper Date object
    const dateOfBirth = typeof studentData.dateOfBirth === 'string' 
      ? new Date(studentData.dateOfBirth) 
      : studentData.dateOfBirth;
    
    const age = DateHelper.calculateAge(dateOfBirth);
    
    // Extract only the fields that belong to the Student model
    const {
      parentName,
      parentPhone,
      parentEmail,
      parentAddress,
      emergencyContact,
      relationship,
      specialEducatorId,
      previousSchool,
      medicalConditions,
      specialNeeds,
      learningConcerns,
      parentExpectations,
      status,
      centerId,
      schoolId,
      parentId,
      ...studentFields
    } = studentData;
    
    // Prepare the data object with foreign key fields
    const createData: any = {
      ...studentFields,
      dateOfBirth, // Use the properly converted Date object
      age,
      // Set foreign key fields directly
      centerId: centerId,
      parentId: parentId || null,
      schoolId: (schoolId && schoolId.length > 10) ? schoolId : null
    };

    // Explicitly remove any parent object that might have been included
    delete createData.parent;
    
    console.log('🔍 StudentRepository createData:', JSON.stringify(createData, null, 2));

    return this.prisma.student.create({
      data: createData,
      include: {
        center: true,
        school: true,
        parent: true,
        assignments: {
          include: {
            specialEducator: true
          }
        }
      }
    });
  }

  async findById(id: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        center: true,
        school: true,
        parent: true,
        assignments: {
          where: { isActive: true },
          include: {
            specialEducator: {
              include: {
                user: true
              }
            }
          }
        },
        intakeForms: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        iepGoals: {
          where: { status: { not: 'DISCONTINUED' } },
          orderBy: { createdAt: 'desc' }
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  async update(id: string, studentData: Partial<StudentData>): Promise<Student> {
    const updateData: any = { ...studentData };
    
    if (studentData.dateOfBirth) {
      // Ensure dateOfBirth is a proper Date object
      const dateOfBirth = typeof studentData.dateOfBirth === 'string' 
        ? new Date(studentData.dateOfBirth) 
        : studentData.dateOfBirth;
      
      updateData.dateOfBirth = dateOfBirth;
      updateData.age = DateHelper.calculateAge(dateOfBirth);
    }

    return this.prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        center: true,
        school: true,
        parent: true,
        assignments: {
          include: {
            specialEducator: true
          }
        }
      }
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.student.delete({
      where: { id }
    });
  }

  async updateStatus(id: string, status: StudentStatus): Promise<Student> {
    return this.prisma.student.update({
      where: { id },
      data: { status },
      include: {
        center: true,
        school: true,
        parent: true
      }
    });
  }

  async findByCenter(centerId: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { centerId },
        skip,
        take: limit,
        include: {
          center: {
            select: { id: true, centerName: true }
          },
          school: {
            select: { id: true, name: true }
          },
          parent: {
            select: { id: true, fullName: true, phone: true }
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
              }
            }
          },
          // Include reports and assessments for computed fields
          reports: {
            select: { 
              id: true, 
              type: true, 
              status: true, 
              createdAt: true 
            },
            orderBy: { createdAt: 'desc' }
          },
          assessments: {
            select: { 
              id: true, 
              status: true, 
              createdAt: true 
            },
            orderBy: { createdAt: 'desc' }
          },
          // Include IEP goals for progress tracking
          iepGoals: {
            select: {
              id: true,
              status: true,
              progressPercent: true,
              domain: true,
              targetDate: true
            },
            where: { status: { not: 'DISCONTINUED' } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.student.count({ where: { centerId } })
    ]);

    return { students, total };
  }

  async findBySchool(schoolId: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where: { schoolId },
        skip,
        take: limit,
        include: {
          center: true,
          school: true,
          parent: true,
          assignments: {
            where: { isActive: true },
            include: {
              specialEducator: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.student.count({ where: { schoolId } })
    ]);

    return { students, total };
  }

  async findByParent(parentId: string): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: { parentId },
      include: {
        center: true,
        school: true,
        assignments: {
          where: { isActive: true },
          include: {
            specialEducator: {
              include: {
                user: true
              }
            }
          }
        },
        intakeForms: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        iepGoals: {
          where: { status: { not: 'DISCONTINUED' } },
          orderBy: { createdAt: 'desc' }
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findBySpecialEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    const skip = (page - 1) * limit;
    
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where: {
          assignments: {
            some: {
              specialEducatorId,
              isActive: true
            }
          }
        },
        skip,
        take: limit,
        include: {
          center: true,
          school: true,
          parent: true,
          assignments: {
            where: { 
              specialEducatorId,
              isActive: true 
            },
            include: {
              specialEducator: {
                include: {
                  user: true
                }
              }
            }
          },
          intakeForms: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          assessments: {
            where: { specialEducatorId },
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          iepGoals: {
            where: { 
              specialEducatorId,
              status: { not: 'DISCONTINUED' }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.student.count({
        where: {
          assignments: {
            some: {
              specialEducatorId,
              isActive: true
            }
          }
        }
      })
    ]);

    return { students, total };
  }

  async assignToSpecialEducator(studentId: string, specialEducatorId: string): Promise<void> {
    // Deactivate existing assignments
    await this.prisma.studentAssignment.updateMany({
      where: { studentId },
      data: { isActive: false }
    });

    // Create new assignment
    await this.prisma.studentAssignment.create({
      data: {
        studentId,
        specialEducatorId,
        isActive: true
      }
    });
  }

  async unassignFromSpecialEducator(studentId: string, specialEducatorId: string): Promise<void> {
    await this.prisma.studentAssignment.updateMany({
      where: {
        studentId,
        specialEducatorId
      },
      data: { isActive: false }
    });
  }

  async search(query: string, centerId?: string, schoolId?: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    const skip = (page - 1) * limit;
    
    const whereClause: any = {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { grade: { contains: query, mode: 'insensitive' } },
        { motherTongue: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (centerId) {
      whereClause.centerId = centerId;
    }

    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          center: true,
          school: true,
          parent: true,
          assignments: {
            where: { isActive: true },
            include: {
              specialEducator: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.student.count({ where: whereClause })
    ]);

    return { students, total };
  }

  async getStudentStats(centerId?: string, schoolId?: string): Promise<{
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    graduatedStudents: number;
    transferredStudents: number;
    studentsWithAssignments: number;
    studentsWithoutAssignments: number;
  }> {
    const whereClause: any = {};
    if (centerId) whereClause.centerId = centerId;
    if (schoolId) whereClause.schoolId = schoolId;

    const [
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      transferredStudents,
      studentsWithAssignments,
      studentsWithoutAssignments
    ] = await Promise.all([
      this.prisma.student.count({ where: whereClause }),
      this.prisma.student.count({ where: { ...whereClause, status: StudentStatus.ACTIVE } }),
      this.prisma.student.count({ where: { ...whereClause, status: StudentStatus.INACTIVE } }),
      this.prisma.student.count({ where: { ...whereClause, status: StudentStatus.GRADUATED } }),
      this.prisma.student.count({ where: { ...whereClause, status: StudentStatus.TRANSFERRED } }),
      this.prisma.student.count({
        where: {
          ...whereClause,
          assignments: {
            some: { isActive: true }
          }
        }
      }),
      this.prisma.student.count({
        where: {
          ...whereClause,
          assignments: {
            none: { isActive: true }
          }
        }
      })
    ]);

    return {
      totalStudents,
      activeStudents,
      inactiveStudents,
      graduatedStudents,
      transferredStudents,
      studentsWithAssignments,
      studentsWithoutAssignments
    };
  }
}
