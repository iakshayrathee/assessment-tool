import { PrismaClient, StudentStatus, AssessmentStatus, IEPGoalStatus } from '@prisma/client';

interface DashboardStats {
  assignedStudents: number;
  pendingAssessments: number;
  activeIEPGoals: number;
  completedReports: number;
  recentActivities: any[];
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

interface StudentWithProgress {
  id: string;
  fullName: string;
  age: number;
  grade: string;
  status: StudentStatus;
  lastSession?: string;
  progressSummary?: {
    totalGoals: number;
    completedGoals: number;
    averageProgress: number;
  };
  center: {
    centerName: string;
  };
  school?: {
    name: string;
  } | null;
}

export class SpecialEducatorService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get comprehensive dashboard data for special educator
   */
  async getDashboardData(educatorId: string): Promise<DashboardStats> {
    try {
      // Get assigned students count
      const assignedStudentsCount = await this.prisma.studentAssignment.count({
        where: {
          specialEducatorId: educatorId,
          isActive: true
        }
      });

      // Get pending assessments count
      const pendingAssessmentsCount = await this.prisma.assessment.count({
        where: {
          specialEducatorId: educatorId,
          status: {
            in: [AssessmentStatus.PENDING, AssessmentStatus.IN_PROGRESS]
          }
        }
      });

      // Get active IEP goals count
      const activeIEPGoalsCount = await this.prisma.iEPGoal.count({
        where: {
          specialEducatorId: educatorId,
          status: IEPGoalStatus.IN_PROGRESS
        }
      });

      // Get completed reports count (this month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const completedReportsCount = await this.prisma.report.count({
        where: {
          specialEducatorId: educatorId,
          status: AssessmentStatus.COMPLETED,
          submittedAt: {
            gte: startOfMonth
          }
        }
      });

      // Get recent activities
      const recentActivities = await this.getRecentActivities(educatorId, 5);

      return {
        assignedStudents: assignedStudentsCount,
        pendingAssessments: pendingAssessmentsCount,
        activeIEPGoals: activeIEPGoalsCount,
        completedReports: completedReportsCount,
        recentActivities
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw new Error('Failed to get dashboard data');
    }
  }

  /**
   * Get special educator profile
   */
  async getProfile(userId: string) {
    try {
      const profile = await this.prisma.specialEducatorProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              email: true,
              isActive: true,
              createdAt: true,
              lastLogin: true
            }
          },
          centerAssignments: {
            where: { isActive: true },
            include: {
              center: {
                select: {
                  centerName: true,
                  address: true
                }
              }
            }
          }
        }
      });

      if (!profile) {
        throw new Error('Special educator profile not found');
      }

      return profile;
    } catch (error) {
      console.error('Error getting educator profile:', error);
      throw new Error('Failed to get educator profile');
    }
  }

  /**
   * Update special educator profile
   */
  async updateProfile(userId: string, profileData: any) {
    try {
      const updatedProfile = await this.prisma.specialEducatorProfile.update({
        where: { userId },
        data: {
          fullName: profileData.fullName,
          phone: profileData.phone,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
          gender: profileData.gender,
          address: profileData.address,
          primaryLanguage: profileData.primaryLanguage,
          secondaryLanguages: profileData.secondaryLanguages || [],
          highestQualification: profileData.highestQualification,
          fieldOfStudy: profileData.fieldOfStudy,
          institutionName: profileData.institutionName,
          yearOfGraduation: profileData.yearOfGraduation,
          rciCertified: profileData.rciCertified,
          rciValidityDate: profileData.rciValidityDate ? new Date(profileData.rciValidityDate) : undefined,
          specialEdQualification: profileData.specialEdQualification,
          specializationAreas: profileData.specializationAreas || [],
          additionalCertifications: profileData.additionalCertifications || [],
          yearsOfExperience: profileData.yearsOfExperience,
          experienceTypes: profileData.experienceTypes || [],
          maxGroupSize: profileData.maxGroupSize,
          totalYearsOfExperience: profileData.totalYearsOfExperience,
          currentWorkLocations: profileData.currentWorkLocations || [],
          ldTypesHandled: profileData.ldTypesHandled || [],
          gradeLevelsServed: profileData.gradeLevelsServed || [],
          assessmentTools: profileData.assessmentTools,
          assistiveTechProficiency: profileData.assistiveTechProficiency || [],
          areasOfInterest: profileData.areasOfInterest || [],
          consentToShare: profileData.consentToShare,
          agreementToPolicies: profileData.agreementToPolicies,
          personalStatement: profileData.personalStatement
        },
        include: {
          user: {
            select: {
              email: true,
              isActive: true
            }
          }
        }
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error updating educator profile:', error);
      throw new Error('Failed to update educator profile');
    }
  }

  /**
   * Get assigned students with pagination and search
   */
  async getAssignedStudents(
    educatorId: string,
    params: PaginationParams
  ): Promise<{ students: StudentWithProgress[]; pagination: any }> {
    try {
      // console.log('🎯 getAssignedStudents called with:', { educatorId, params });

      const { page, limit, search, status } = params;
      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        assignments: {
          some: {
            specialEducatorId: educatorId,
            isActive: true
          }
        }
      };

      // console.log('🔍 Where clause for student query:', JSON.stringify(whereClause, null, 2));

      if (search) {
        whereClause.fullName = {
          contains: search,
          mode: 'insensitive'
        };
      }

      if (status) {
        whereClause.status = status as StudentStatus;
      }

      // Get students with progress data
      const students = await this.prisma.student.findMany({
        where: whereClause,
        include: {
          center: {
            select: {
              centerName: true
            }
          },
          school: {
            select: {
              name: true
            }
          },
          iepGoals: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              status: true,
              progressPercent: true
            }
          },
          sessionNotes: {
            where: {
              specialEducatorId: educatorId
            },
            orderBy: {
              sessionDate: 'desc'
            },
            take: 1,
            select: {
              sessionDate: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          fullName: 'asc'
        }
      });

      // console.log('🔍 Raw students found:', students.length);
      // console.log('🔍 Student IDs found:', students.map(s => ({ id: s.id, name: s.fullName })));

      // Calculate progress summary for each student
      const studentsWithProgress: StudentWithProgress[] = students.map(student => {
        const totalGoals = student.iepGoals.length;
        const completedGoals = student.iepGoals.filter(goal => goal.status === IEPGoalStatus.ACHIEVED).length;
        const averageProgress = totalGoals > 0
          ? Math.round(student.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0) / totalGoals)
          : 0;

        return {
          id: student.id,
          fullName: student.fullName,
          age: student.age,
          grade: student.grade,
          status: student.status,
          lastSession: student.sessionNotes[0]?.sessionDate.toISOString(),
          progressSummary: {
            totalGoals,
            completedGoals,
            averageProgress
          },
          center: student.center,
          school: student.school
        };
      });

      // Get total count for pagination
      const totalCount = await this.prisma.student.count({
        where: whereClause
      });

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      };

      return { students: studentsWithProgress, pagination };
    } catch (error) {
      console.error('Error getting assigned students:', error);
      throw new Error('Failed to get assigned students');
    }
  }

  /**
   * Get detailed student information
   */
  async getStudentDetails(educatorId: string, studentId: string) {
    try {
      // Verify educator has access to this student
      const assignment = await this.prisma.studentAssignment.findFirst({
        where: {
          studentId,
          specialEducatorId: educatorId,
          isActive: true
        }
      });

      if (!assignment) {
        throw new Error('Student not assigned to this educator');
      }

      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          center: true,
          school: true,
          parent: {
            select: {
              fullName: true,
              phone: true
            }
          },
          intakeForms: {
            where: {
              specialEducatorId: educatorId
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          assessments: {
            where: {
              specialEducatorId: educatorId
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          iepGoals: {
            where: {
              specialEducatorId: educatorId
            },
            include: {
              progressUpdates: {
                orderBy: {
                  updateDate: 'desc'
                },
                take: 1
              }
            }
          },
          sessionNotes: {
            where: {
              specialEducatorId: educatorId
            },
            orderBy: {
              sessionDate: 'desc'
            },
            take: 5
          },
          reports: {
            where: {
              specialEducatorId: educatorId
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      return student;
    } catch (error) {
      console.error('Error getting student details:', error);
      throw new Error('Failed to get student details');
    }
  }

  /**
   * Get recent activities for the educator
   */
  async getRecentActivities(educatorId: string, limit: number = 10) {
    try {
      const activities = [];

      // Recent assessments
      const recentAssessments = await this.prisma.assessment.findMany({
        where: {
          specialEducatorId: educatorId
        },
        include: {
          student: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 3
      });

      activities.push(...recentAssessments.map(assessment => ({
        id: assessment.id,
        type: 'assessment',
        title: `${assessment.assessmentType} Assessment ${assessment.status === AssessmentStatus.COMPLETED ? 'Completed' : 'Updated'}`,
        studentName: assessment.student.fullName,
        date: assessment.updatedAt.toISOString(),
        status: assessment.status.toLowerCase()
      })));

      // Recent IEP goal updates
      const recentIEPUpdates = await this.prisma.iEPProgress.findMany({
        where: {
          goal: {
            specialEducatorId: educatorId
          }
        },
        include: {
          goal: {
            include: {
              student: {
                select: {
                  fullName: true
                }
              }
            }
          }
        },
        orderBy: {
          updateDate: 'desc'
        },
        take: 3
      });

      activities.push(...recentIEPUpdates.map(update => ({
        id: update.id,
        type: 'iep_goal',
        title: `${update.goal.domain} Goal Progress Updated`,
        studentName: update.goal.student.fullName,
        date: update.updateDate.toISOString(),
        status: 'in_progress'
      })));

      // Recent session notes
      const recentSessionNotes = await this.prisma.sessionNote.findMany({
        where: {
          specialEducatorId: educatorId
        },
        include: {
          student: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      });

      activities.push(...recentSessionNotes.map(note => ({
        id: note.id,
        type: 'session_note',
        title: 'Session Notes Added',
        studentName: note.student.fullName,
        date: note.createdAt.toISOString(),
        status: 'completed'
      })));

      // Sort all activities by date and limit
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw new Error('Failed to get recent activities');
    }
  }

  /**
   * Get educator statistics
   */
  async getStatistics(educatorId: string) {
    try {
      const stats = await this.getDashboardData(educatorId);

      // Additional statistics
      const totalSessionsThisMonth = await this.prisma.sessionNote.count({
        where: {
          specialEducatorId: educatorId,
          sessionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      });

      const completedAssessments = await this.prisma.assessment.count({
        where: {
          specialEducatorId: educatorId,
          status: AssessmentStatus.COMPLETED
        }
      });

      return {
        ...stats,
        totalSessionsThisMonth,
        completedAssessments
      };
    } catch (error) {
      console.error('Error getting educator statistics:', error);
      throw new Error('Failed to get educator statistics');
    }
  }

  /**
   * Get today's schedule (mock implementation - would need scheduling system)
   */
  async getTodaysSchedule(educatorId: string) {
    try {
      // This is a mock implementation
      // In a real system, you would have a scheduling/calendar system
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get students with recent session notes to simulate scheduled sessions
      const recentStudents = await this.prisma.student.findMany({
        where: {
          assignments: {
            some: {
              specialEducatorId: educatorId,
              isActive: true
            }
          }
        },
        include: {
          sessionNotes: {
            where: {
              specialEducatorId: educatorId,
              sessionDate: {
                gte: today,
                lt: tomorrow
              }
            }
          }
        },
        take: 3
      });

      // Mock schedule data
      const schedule = [
        {
          id: '1',
          type: 'assessment',
          title: `Assessment Session - ${recentStudents[0]?.fullName || 'Student'}`,
          description: 'Reading and Writing Assessment',
          time: '10:00 AM',
          duration: '45 minutes',
          studentId: recentStudents[0]?.id
        },
        {
          id: '2',
          type: 'iep_review',
          title: `IEP Review - ${recentStudents[1]?.fullName || 'Student'}`,
          description: 'Quarterly progress review',
          time: '2:00 PM',
          duration: '30 minutes',
          studentId: recentStudents[1]?.id
        },
        {
          id: '3',
          type: 'parent_meeting',
          title: `Parent Meeting - ${recentStudents[2]?.fullName || 'Student'} Family`,
          description: 'Discuss progress and next steps',
          time: '4:00 PM',
          duration: '60 minutes',
          studentId: recentStudents[2]?.id
        }
      ];

      return schedule;
    } catch (error) {
      console.error('Error getting today\'s schedule:', error);
      throw new Error('Failed to get today\'s schedule');
    }
  }

  /**
   * Create session note
   */
  async createSessionNote(sessionNoteData: any) {
    try {
      const sessionNote = await this.prisma.sessionNote.create({
        data: {
          studentId: sessionNoteData.studentId,
          specialEducatorId: sessionNoteData.specialEducatorId,
          sessionDate: new Date(sessionNoteData.sessionDate),
          duration: sessionNoteData.duration,
          activities: sessionNoteData.activities,
          observations: sessionNoteData.observations,
          progress: sessionNoteData.progress,
          nextSteps: sessionNoteData.nextSteps
        },
        include: {
          student: {
            select: {
              fullName: true
            }
          }
        }
      });

      return sessionNote;
    } catch (error) {
      console.error('Error creating session note:', error);
      throw new Error('Failed to create session note');
    }
  }

  /**
   * Get session notes for a student
   */
  async getSessionNotes(
    educatorId: string,
    studentId: string,
    params: { page: number; limit: number }
  ) {
    try {
      const { page, limit } = params;
      const skip = (page - 1) * limit;

      // Verify educator has access to this student
      const assignment = await this.prisma.studentAssignment.findFirst({
        where: {
          studentId,
          specialEducatorId: educatorId,
          isActive: true
        }
      });

      if (!assignment) {
        throw new Error('Student not assigned to this educator');
      }

      const sessionNotes = await this.prisma.sessionNote.findMany({
        where: {
          studentId,
          specialEducatorId: educatorId
        },
        include: {
          student: {
            select: {
              fullName: true
            }
          }
        },
        orderBy: {
          sessionDate: 'desc'
        },
        skip,
        take: limit
      });

      const totalCount = await this.prisma.sessionNote.count({
        where: {
          studentId,
          specialEducatorId: educatorId
        }
      });

      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      };

      return { sessionNotes, pagination };
    } catch (error) {
      console.error('Error getting session notes:', error);
      throw new Error('Failed to get session notes');
    }
  }
}
