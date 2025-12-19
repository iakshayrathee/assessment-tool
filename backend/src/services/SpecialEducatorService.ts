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

  /**
   * Get comprehensive analytics dashboard data
   */
  async getAnalyticsDashboard(educatorId: string) {
    try {
      // Get basic dashboard stats
      const basicStats = await this.getDashboardData(educatorId);

      // Get all assigned students with detailed info
      const students = await this.prisma.student.findMany({
        where: {
          assignments: {
            some: {
              specialEducatorId: educatorId,
              isActive: true
            }
          }
        },
        include: {
          iepGoals: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              status: true,
              progressPercent: true,
              domain: true
            }
          },
          assessments: {
            where: {
              specialEducatorId: educatorId,
              status: AssessmentStatus.COMPLETED
            },
            select: {
              id: true,
              readingLevel: true,
              writingLevel: true,
              mathLevel: true,
              completedAt: true
            },
            orderBy: {
              completedAt: 'desc'
            },
            take: 1
          },
          sessionNotes: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              sessionDate: true
            },
            orderBy: {
              sessionDate: 'desc'
            },
            take: 1
          },
          homework: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      // Calculate performance distribution
      const performanceDistribution = {
        highPerformers: 0,
        onTrack: 0,
        needsSupport: 0
      };

      // Calculate domain-wise average progress
      const domainProgress: any = {
        READING: { total: 0, count: 0 },
        WRITING: { total: 0, count: 0 },
        MATH: { total: 0, count: 0 }
      };

      // Calculate average student progress
      let totalProgress = 0;
      let studentCount = 0;

      students.forEach(student => {
        const goals = student.iepGoals;
        if (goals.length > 0) {
          const avgProgress = goals.reduce((sum, goal) => sum + goal.progressPercent, 0) / goals.length;
          totalProgress += avgProgress;
          studentCount++;

          // Categorize performance
          if (avgProgress >= 75) {
            performanceDistribution.highPerformers++;
          } else if (avgProgress >= 50) {
            performanceDistribution.onTrack++;
          } else {
            performanceDistribution.needsSupport++;
          }

          // Domain-wise progress
          goals.forEach(goal => {
            const domain = goal.domain as string;
            if (domainProgress[domain]) {
              domainProgress[domain].total += goal.progressPercent;
              domainProgress[domain].count++;
            }
          });
        }
      });

      const averageStudentProgress = studentCount > 0 ? Math.round(totalProgress / studentCount) : 0;

      // Calculate domain averages
      const domainAverages = {
        reading: domainProgress.READING.count > 0
          ? Math.round(domainProgress.READING.total / domainProgress.READING.count)
          : 0,
        writing: domainProgress.WRITING.count > 0
          ? Math.round(domainProgress.WRITING.total / domainProgress.WRITING.count)
          : 0,
        math: domainProgress.MATH.count > 0
          ? Math.round(domainProgress.MATH.total / domainProgress.MATH.count)
          : 0
      };

      // Get upcoming sessions (sessions scheduled for next 7 days)
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcomingSessions = await this.prisma.sessionNote.count({
        where: {
          specialEducatorId: educatorId,
          sessionDate: {
            gte: today,
            lte: nextWeek
          }
        }
      });

      // Get pending tasks count
      const pendingHomework = await this.prisma.homework.count({
        where: {
          specialEducatorId: educatorId,
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS']
          }
        }
      });

      const pendingTasks = basicStats.pendingAssessments + pendingHomework;

      return {
        ...basicStats,
        averageStudentProgress,
        upcomingSessions,
        pendingTasks,
        performanceDistribution,
        domainAverages,
        totalStudents: students.length
      };
    } catch (error) {
      console.error('Error getting analytics dashboard:', error);
      throw new Error('Failed to get analytics dashboard');
    }
  }

  /**
   * Get detailed analytics for a specific student
   */
  async getStudentAnalytics(educatorId: string, studentId: string) {
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

      // Get student with comprehensive data
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          assessments: {
            where: {
              specialEducatorId: educatorId,
              status: AssessmentStatus.COMPLETED
            },
            select: {
              id: true,
              readingLevel: true,
              writingLevel: true,
              mathLevel: true,
              completedAt: true,
              createdAt: true
            },
            orderBy: {
              completedAt: 'desc'
            }
          },
          iepGoals: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              domain: true,
              goalStatement: true,
              status: true,
              progressPercent: true,
              targetDate: true,
              createdAt: true
            }
          },
          sessionNotes: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              sessionDate: true,
              duration: true,
              progress: true
            },
            orderBy: {
              sessionDate: 'desc'
            },
            take: 10
          },
          homework: {
            where: {
              specialEducatorId: educatorId
            },
            select: {
              id: true,
              status: true,
              dueDate: true,
              submittedAt: true
            }
          }
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Calculate IEP goal progress
      const totalGoals = student.iepGoals.length;
      const completedGoals = student.iepGoals.filter(goal => goal.status === IEPGoalStatus.ACHIEVED).length;
      const inProgressGoals = student.iepGoals.filter(goal => goal.status === IEPGoalStatus.IN_PROGRESS).length;
      const averageGoalProgress = totalGoals > 0
        ? Math.round(student.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0) / totalGoals)
        : 0;

      // Calculate homework completion rate
      const totalHomework = student.homework.length;
      const completedHomework = student.homework.filter(hw =>
        hw.status === 'COMPLETED' || hw.status === 'REVIEWED'
      ).length;
      const homeworkCompletionRate = totalHomework > 0
        ? Math.round((completedHomework / totalHomework) * 100)
        : 0;

      // Get domain-specific performance from latest assessment
      const latestAssessment = student.assessments[0];
      const domainPerformance = {
        reading: latestAssessment?.readingLevel || 'N/A',
        writing: latestAssessment?.writingLevel || 'N/A',
        math: latestAssessment?.mathLevel || 'N/A'
      };

      // Calculate progress trend (comparing last 3 months of IEP progress)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const recentGoals = student.iepGoals.filter(goal =>
        new Date(goal.createdAt) >= threeMonthsAgo
      );

      let progressTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (recentGoals.length > 0) {
        const recentAvgProgress = recentGoals.reduce((sum, goal) => sum + goal.progressPercent, 0) / recentGoals.length;
        if (recentAvgProgress > averageGoalProgress + 10) {
          progressTrend = 'improving';
        } else if (recentAvgProgress < averageGoalProgress - 10) {
          progressTrend = 'declining';
        }
      }

      // Session attendance
      const totalSessions = student.sessionNotes.length;
      const lastSession = student.sessionNotes[0]?.sessionDate;

      // Assessment history for charts (last 5 assessments)
      const assessmentHistory = student.assessments.slice(0, 5).reverse().map(assessment => ({
        date: assessment.completedAt,
        reading: assessment.readingLevel,
        writing: assessment.writingLevel,
        math: assessment.mathLevel
      }));

      // IEP goal progress over time (for chart)
      const goalProgressOverTime = student.iepGoals.map(goal => ({
        domain: goal.domain,
        goalStatement: goal.goalStatement,
        progress: goal.progressPercent,
        status: goal.status,
        targetDate: goal.targetDate
      }));

      return {
        studentId: student.id,
        fullName: student.fullName,
        age: student.age,
        grade: student.grade,
        status: student.status,
        overallProgress: averageGoalProgress,
        iepGoals: {
          total: totalGoals,
          completed: completedGoals,
          inProgress: inProgressGoals,
          averageProgress: averageGoalProgress
        },
        assessments: {
          total: student.assessments.length,
          latest: latestAssessment,
          history: assessmentHistory
        },
        sessions: {
          total: totalSessions,
          lastSession: lastSession
        },
        homework: {
          total: totalHomework,
          completed: completedHomework,
          completionRate: homeworkCompletionRate
        },
        domainPerformance,
        progressTrend,
        goalProgressOverTime,
        recentActivities: student.sessionNotes.slice(0, 5).map(note => ({
          type: 'session',
          date: note.sessionDate,
          duration: note.duration,
          progress: note.progress
        }))
      };
    } catch (error) {
      console.error('Error getting student analytics:', error);
      throw new Error('Failed to get student analytics');
    }
  }

  /**
   * Get progress trends over time
   */
  async getProgressTrends(educatorId: string, period: 'week' | 'month' | 'quarter' = 'month') {
    try {
      const now = new Date();
      let startDate = new Date();

      // Calculate start date based on period
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
      }

      // Get IEP progress updates over time
      const iepProgress = await this.prisma.iEPProgress.findMany({
        where: {
          goal: {
            specialEducatorId: educatorId
          },
          updateDate: {
            gte: startDate
          }
        },
        include: {
          goal: {
            select: {
              domain: true,
              student: {
                select: {
                  fullName: true
                }
              }
            }
          }
        },
        orderBy: {
          updateDate: 'asc'
        }
      });

      // Get assessment completion trends
      const assessments = await this.prisma.assessment.findMany({
        where: {
          specialEducatorId: educatorId,
          completedAt: {
            gte: startDate
          },
          status: AssessmentStatus.COMPLETED
        },
        select: {
          completedAt: true,
          readingLevel: true,
          writingLevel: true,
          mathLevel: true
        },
        orderBy: {
          completedAt: 'asc'
        }
      });

      // Get session frequency
      const sessions = await this.prisma.sessionNote.findMany({
        where: {
          specialEducatorId: educatorId,
          sessionDate: {
            gte: startDate
          }
        },
        select: {
          sessionDate: true,
          duration: true
        },
        orderBy: {
          sessionDate: 'asc'
        }
      });

      // Group data by week/month for charting
      const progressByPeriod: any = {};
      const assessmentsByPeriod: any = {};
      const sessionsByPeriod: any = {};

      // Helper function to get period key
      const getPeriodKey = (date: Date) => {
        if (period === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return weekStart.toISOString().split('T')[0];
        } else {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      };

      // Aggregate IEP progress
      iepProgress.forEach(progress => {
        const key = getPeriodKey(new Date(progress.updateDate));
        if (!progressByPeriod[key]) {
          progressByPeriod[key] = { total: 0, count: 0 };
        }
        progressByPeriod[key].total += progress.progress;
        progressByPeriod[key].count++;
      });

      // Aggregate assessments
      assessments.forEach(assessment => {
        const key = getPeriodKey(new Date(assessment.completedAt!));
        if (!assessmentsByPeriod[key]) {
          assessmentsByPeriod[key] = 0;
        }
        assessmentsByPeriod[key]++;
      });

      // Aggregate sessions
      sessions.forEach(session => {
        const key = getPeriodKey(new Date(session.sessionDate));
        if (!sessionsByPeriod[key]) {
          sessionsByPeriod[key] = { count: 0, totalDuration: 0 };
        }
        sessionsByPeriod[key].count++;
        sessionsByPeriod[key].totalDuration += session.duration || 0;
      });

      // Format data for charts
      const trendData = Object.keys(progressByPeriod).sort().map(key => ({
        period: key,
        averageProgress: progressByPeriod[key].count > 0
          ? Math.round(progressByPeriod[key].total / progressByPeriod[key].count)
          : 0,
        assessmentsCompleted: assessmentsByPeriod[key] || 0,
        sessionsCount: sessionsByPeriod[key]?.count || 0,
        totalSessionDuration: sessionsByPeriod[key]?.totalDuration || 0
      }));

      return {
        period,
        startDate,
        endDate: now,
        trendData,
        summary: {
          totalProgressUpdates: iepProgress.length,
          totalAssessments: assessments.length,
          totalSessions: sessions.length
        }
      };
    } catch (error) {
      console.error('Error getting progress trends:', error);
      throw new Error('Failed to get progress trends');
    }
  }
}
