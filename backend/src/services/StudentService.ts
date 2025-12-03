import { PrismaClient, Student, StudentStatus } from '@prisma/client';
import { StudentRepository } from '../repositories/StudentRepository';
import { StudentData } from '../models';
import bcrypt from 'bcryptjs';

// Enhanced student type with included relations
interface EnhancedStudent extends Student {
  school?: { id: string; name: string } | null;
  parent: { id: string; fullName: string; phone: string | null };
  assignments: Array<{
    specialEducator: {
      id: string;
      fullName: string;
      yearsOfExperience: number | null;
      specializationAreas: string[];
    };
  }>;
  reports: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: Date;
  }>;
  assessments: Array<{
    id: string;
    status: string;
    createdAt: Date;
  }>;
  iepGoals?: Array<{
    id: string;
    status: string;
    progressPercent: number;
    domain: string;
    targetDate: Date;
  }>;
}

export class StudentService {
  private studentRepository: StudentRepository;

  constructor(prisma: PrismaClient) {
    this.studentRepository = new StudentRepository(prisma);
  }

  async createStudent(studentData: StudentData): Promise<Student> {
    // Validate required fields
    if (!studentData.fullName || !studentData.dateOfBirth || !studentData.centerId) {
      throw new Error('Missing required fields: fullName, dateOfBirth, centerId');
    }

    // Validate that the center exists
    const centerExists = await this.studentRepository.prismaClient.centerProfile.findUnique({
      where: { id: studentData.centerId }
    });

    if (!centerExists) {
      throw new Error(`Center with ID ${studentData.centerId} not found`);
    }

    // Validate date of birth is not in the future
    if (new Date(studentData.dateOfBirth) > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    let parentId = studentData.parentId;

    // If parentId is not provided and parent information is available, create a new parent
    if (!parentId && studentData.parentName && studentData.parentPhone) {
      // Require parent password - no fallback to temporary password
      if (!studentData.parentPassword) {
        throw new Error('Parent password is required when creating a new parent account');
      }
      
      // Hash the provided password
      const hashedPassword = await bcrypt.hash(studentData.parentPassword, 12);

      // Determine the email to use
      const parentEmail = studentData.parentEmail || `parent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@temp.com`;

      // Check if a user with this email already exists
      const existingUser = await this.studentRepository.prismaClient.user.findUnique({
        where: { email: parentEmail }
      });

      if (existingUser) {
        throw new Error(`A user with email ${parentEmail} already exists. Please use a different email address.`);
      }

      // Create parent user and profile
      const parentProfile = await this.studentRepository.prismaClient.parentProfile.create({
        data: {
          fullName: studentData.parentName,
          phone: studentData.parentPhone,
          address: studentData.address || '', // Use student address or default empty
          emergencyContact: studentData.parentPhone, // Use phone as emergency contact
          relationship: 'Parent', // Default relationship
          user: {
            create: {
              email: parentEmail,
              password: hashedPassword, // Hashed temporary password - parent should reset
              role: 'PARENT',
              isActive: true
            }
          }
        }
      });

      parentId = parentProfile.id;
    }

    // Create student with the parentId (can be null if no parent info provided)
    // Remove parent-specific fields since they're only used for parent account creation
    const { address, parentPassword, parentName, parentPhone, parentEmail, relationship, ...studentDataWithoutParentFields } = studentData;
    const finalStudentData: StudentData = {
      ...studentDataWithoutParentFields,
      parentId: parentId || null
    };

    return await this.studentRepository.create(finalStudentData);
  }

  async getStudentsBySchoolViewer(userId: string, page: number = 1, limit: number = 10) {
    const schoolViewerProfile = await this.studentRepository.prismaClient.schoolViewerProfile.findUnique({
      where: { userId }
    });

    if (!schoolViewerProfile) {
      throw new Error('School Viewer profile not found');
    }

    return await this.getStudentsBySchool(schoolViewerProfile.schoolId, page, limit);
  }

  async getSchoolViewerProfile(userId: string) {
    return await this.studentRepository.prismaClient.schoolViewerProfile.findUnique({
      where: { userId }
    });
  }

  async getStudentById(id: string): Promise<Student> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new Error('Student not found');
    }
    return student;
  }

  async updateStudent(id: string, studentData: Partial<StudentData>): Promise<Student> {
    // Check if student exists
    const existingStudent = await this.studentRepository.findById(id);
    if (!existingStudent) {
      throw new Error('Student not found');
    }

    // Validate date of birth if provided
    if (studentData.dateOfBirth && new Date(studentData.dateOfBirth) > new Date()) {
      throw new Error('Date of birth cannot be in the future');
    }

    // Handle parent creation/update if parent details are provided
    let parentId = existingStudent.parentId;
    
    if (studentData.parentName && studentData.parentPhone) {
      // Check if we need to create a new parent or update existing
      if (!parentId) {
        // Create new parent account
        if (!studentData.parentPassword) {
          throw new Error('Parent password is required when creating a new parent account');
        }
        
        const hashedPassword = await bcrypt.hash(studentData.parentPassword, 12);
        const parentEmail = studentData.parentEmail || `parent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@temp.com`;
        
        // Check if email already exists
        const existingUser = await this.studentRepository.prismaClient.user.findUnique({
          where: { email: parentEmail }
        });
        if (existingUser) {
          throw new Error(`A user with email ${parentEmail} already exists. Please use a different email address.`);
        }
        
        // Create parent profile with user account
        const parentProfile = await this.studentRepository.prismaClient.parentProfile.create({
          data: {
            fullName: studentData.parentName,
            phone: studentData.parentPhone,
            address: studentData.address || '',
            emergencyContact: studentData.parentPhone,
            relationship: 'Parent',
            user: {
              create: {
                email: parentEmail,
                password: hashedPassword,
                role: 'PARENT',
                isActive: true
              }
            }
          }
        });
        parentId = parentProfile.id;
        
        // Update student data with new parent ID
        studentData.parentId = parentId;
      } else {
        // Update existing parent profile
        await this.studentRepository.prismaClient.parentProfile.update({
          where: { id: parentId },
          data: {
            fullName: studentData.parentName,
            phone: studentData.parentPhone,
            address: studentData.address || undefined,
            emergencyContact: studentData.emergencyContact || studentData.parentPhone || undefined
          }
        });
        
        // If parent email is provided and different from current, update user email
        if (studentData.parentEmail) {
          const parentProfile = await this.studentRepository.prismaClient.parentProfile.findUnique({
            where: { id: parentId },
            include: { user: true }
          });
          
          if (parentProfile && parentProfile.user.email !== studentData.parentEmail) {
            // Check if new email already exists
            const existingUser = await this.studentRepository.prismaClient.user.findUnique({
              where: { email: studentData.parentEmail }
            });
            if (existingUser) {
              throw new Error(`A user with email ${studentData.parentEmail} already exists. Please use a different email address.`);
            }
            
            await this.studentRepository.prismaClient.user.update({
              where: { id: parentProfile.userId },
              data: { email: studentData.parentEmail }
            });
          }
        }
      }
    }

    return await this.studentRepository.update(id, studentData);
  }

  async deleteStudent(id: string): Promise<void> {
    // Check if student exists
    const existingStudent = await this.studentRepository.findById(id);
    if (!existingStudent) {
      throw new Error('Student not found');
    }

    await this.studentRepository.delete(id);
  }

  async updateStudentStatus(id: string, status: StudentStatus): Promise<Student> {
    // Check if student exists
    const existingStudent = await this.studentRepository.findById(id);
    if (!existingStudent) {
      throw new Error('Student not found');
    }

    return await this.studentRepository.updateStatus(id, status);
  }

  async getStudentsByCenter(centerId: string, page: number = 1, limit: number = 10): Promise<{ students: any[], total: number }> {
    const result = await this.studentRepository.findByCenter(centerId, page, limit);

    // Transform students to include computed fields that frontend expects
    const transformedStudents = result.students.map((student: any) => ({
      id: student.id,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth,
      age: student.age,
      gender: student.gender,
      grade: student.grade,
      status: student.status,
      registrationDate: student.createdAt,
      school: student.school ? {
        id: student.school.id,
        name: student.school.name
      } : null,
      parent: {
        id: student.parent.id,
        fullName: student.parent.fullName,
        phone: student.parent.phone || ''
      },
      hasAssignment: student.assignments && student.assignments.length > 0,
      assignedEducator: student.assignments?.[0]?.specialEducator ? {
        id: student.assignments[0].specialEducator.id,
        fullName: student.assignments[0].specialEducator.fullName
      } : null,
      // Computed fields that frontend needs
      pendingReports: student.reports?.filter((r: any) => r.status === 'PENDING').length || 0,
      completedAssessments: student.assessments?.filter((a: any) => a.status === 'COMPLETED').length || 0,
      totalReports: student.reports?.length || 0,
      totalAssessments: student.assessments?.length || 0,
      lastAssessmentDate: student.assessments?.[0]?.createdAt || null,
      lastReportDate: student.reports?.[0]?.createdAt || null
    }));

    return {
      students: transformedStudents,
      total: result.total
    };
  }

  async getStudentsBySchool(schoolId: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    return await this.studentRepository.findBySchool(schoolId, page, limit);
  }

  async getStudentsByParent(parentId: string): Promise<Student[]> {
    return await this.studentRepository.findByParent(parentId);
  }

  async getStudentsBySpecialEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    return await this.studentRepository.findBySpecialEducator(specialEducatorId, page, limit);
  }



  async unassignStudentFromEducator(studentId: string, specialEducatorId: string): Promise<void> {
    // Check if student exists
    const student = await this.studentRepository.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    await this.studentRepository.unassignFromSpecialEducator(studentId, specialEducatorId);
  }

  async searchStudents(query: string, centerId?: string, schoolId?: string, page: number = 1, limit: number = 10): Promise<{ students: Student[], total: number }> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    return await this.studentRepository.search(query.trim(), centerId, schoolId, page, limit);
  }

  async getStudentStats(centerId?: string, schoolId?: string): Promise<any> {
    return await this.studentRepository.getStudentStats(centerId, schoolId);
  }

  async getStudentDashboardData(studentId: string): Promise<{
    student: any;
    iepDocuments: any[];
    assessments: any[];
    lessonPlans: any[];
    reports: any[];
    activeIEPGoals: any[];
    recentSessionNotes: any[];
    upcomingGoalDeadlines: any[];
  }> {
    const student: any = await this.getStudentById(studentId);

    // Get all IEP documents for the student
    const iepDocuments = await this.studentRepository.prismaClient.iEPDocument.findMany({
      where: { studentId },
      include: {
        subjectSections: {
          orderBy: { createdAt: 'desc' }
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

    // Get all assessments for the student
    const assessments = await this.studentRepository.prismaClient.assessment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    // Get all lesson plans for the student
    const lessonPlans = await this.studentRepository.prismaClient.lessonPlan.findMany({
      where: { studentId },
      include: {
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Get all reports for the student
    const reports = await this.studentRepository.prismaClient.report.findMany({
      where: { studentId },
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

    // Get active IEP goals
    const activeIEPGoals = student.iepGoals?.filter((goal: any) =>
      goal.status === 'IN_PROGRESS' || goal.status === 'NOT_STARTED'
    ) || [];

    // Get recent session notes (last 5)
    const recentSessionNotes = student.sessionNotes?.slice(0, 5) || [];

    // Get upcoming goal deadlines (goals due within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingGoalDeadlines = activeIEPGoals.filter((goal: any) =>
      new Date(goal.targetDate) <= thirtyDaysFromNow
    ).sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    return {
      student,
      iepDocuments,
      assessments,
      lessonPlans,
      reports,
      activeIEPGoals,
      recentSessionNotes,
      upcomingGoalDeadlines
    };
  }

  async getStudentProgress(studentId: string): Promise<{
    overallProgress: number;
    domainProgress: { [domain: string]: number };
    goalAchievements: any[];
    progressTrend: any[];
  }> {
    const student: any = await this.getStudentById(studentId);

    if (!student.iepGoals || student.iepGoals.length === 0) {
      return {
        overallProgress: 0,
        domainProgress: {},
        goalAchievements: [],
        progressTrend: []
      };
    }

    // Calculate overall progress
    const totalProgress = student.iepGoals.reduce((sum: number, goal: any) => sum + goal.progressPercent, 0);
    const overallProgress = Math.round(totalProgress / student.iepGoals.length);

    // Calculate domain-wise progress
    const domainProgress: { [domain: string]: number } = {};
    const domainGoals: { [domain: string]: any[] } = {};

    student.iepGoals.forEach((goal: any) => {
      if (!domainGoals[goal.domain]) {
        domainGoals[goal.domain] = [];
      }
      domainGoals[goal.domain].push(goal);
    });

    Object.keys(domainGoals).forEach(domain => {
      const goals = domainGoals[domain];
      const domainTotal = goals.reduce((sum: number, goal: any) => sum + goal.progressPercent, 0);
      domainProgress[domain] = Math.round(domainTotal / goals.length);
    });

    // Get goal achievements (completed goals)
    const goalAchievements = student.iepGoals
      .filter((goal: any) => goal.status === 'ACHIEVED')
      .map((goal: any) => ({
        id: goal.id,
        domain: goal.domain,
        goalStatement: goal.goalStatement,
        achievedDate: goal.updatedAt
      }));

    // Calculate progress trend (simplified - would need more complex logic for real trends)
    const progressTrend = student.iepGoals.map((goal: any) => ({
      goalId: goal.id,
      domain: goal.domain,
      currentProgress: goal.progressPercent,
      trend: goal.progressPercent > 50 ? 'improving' : 'needs_attention'
    }));

    return {
      overallProgress,
      domainProgress,
      goalAchievements,
      progressTrend
    };
  }

  async bulkAssignStudents(studentIds: string[], specialEducatorId: string): Promise<void> {
    // Validate all students exist
    for (const studentId of studentIds) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }
    }

    // Assign all students
    for (const studentId of studentIds) {
      await this.studentRepository.assignToSpecialEducator(studentId, specialEducatorId);
    }
  }

  async bulkUpdateStudentStatus(studentIds: string[], status: StudentStatus): Promise<void> {
    // Validate all students exist
    for (const studentId of studentIds) {
      const student = await this.studentRepository.findById(studentId);
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }
    }

    // Update all student statuses
    for (const studentId of studentIds) {
      await this.studentRepository.updateStatus(studentId, status);
    }
  }

  async getEducatorProfile(userId: string) {
    return await this.studentRepository.prismaClient.specialEducatorProfile.findUnique({
      where: { userId },
      include: {
        centerAssignments: {
          where: { isActive: true },
          select: { centerId: true }
        }
      }
    });
  }

  async getCenterProfile(userId: string) {
    return await this.studentRepository.prismaClient.centerProfile.findUnique({
      where: { userId }
    });
  }

  async assignStudentToEducator(studentId: string, specialEducatorId: string): Promise<void> {
    console.log('🎯 assignStudentToEducator called with:', { studentId, specialEducatorId });

    // Validate that student exists
    const student = await this.studentRepository.prismaClient.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Validate that special educator exists
    const specialEducator = await this.studentRepository.prismaClient.specialEducatorProfile.findUnique({
      where: { id: specialEducatorId }
    });

    if (!specialEducator) {
      throw new Error(`Special educator with ID ${specialEducatorId} not found`);
    }

    console.log('✅ Student and educator validation passed');

    // Check if assignment already exists
    const existingAssignment = await this.studentRepository.prismaClient.studentAssignment.findUnique({
      where: {
        studentId_specialEducatorId: {
          studentId,
          specialEducatorId
        }
      }
    });

    console.log('🔍 Existing assignment check:', existingAssignment);

    if (existingAssignment) {
      // If assignment exists but is inactive, reactivate it
      if (!existingAssignment.isActive) {
        console.log('🔄 Reactivating existing assignment');
        await this.studentRepository.prismaClient.studentAssignment.update({
          where: { id: existingAssignment.id },
          data: { isActive: true }
        });
      } else {
        console.log('✅ Assignment already exists and is active');
      }
      return;
    }

    // Create new assignment
    console.log('🆕 Creating new assignment');
    const newAssignment = await this.studentRepository.prismaClient.studentAssignment.create({
      data: {
        studentId,
        specialEducatorId,
        isActive: true
      }
    });
    console.log('✅ New assignment created:', newAssignment);
  }
}
