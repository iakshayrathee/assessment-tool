import { PrismaClient, IEPDocument, IEPSubjectSection, IEPLongTermGoal, IEPShortTermGoal, IEPWeeklyEvaluation, IEPWeeklyActivity, IEPSubject, BehavioralAttentionLevel, BehavioralSittingTolerance, BehavioralTaskCompletion } from '@prisma/client';
import { IEPDocumentData, IEPSubjectSectionData, IEPLongTermGoalData, IEPShortTermGoalData, IEPWeeklyEvaluationData, IEPWeeklyActivityData, IEPDocumentWithRelations } from '../models/IEPModels';

export class IEPRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new IEP document
  async createIEPDocument(specialEducatorId: string, iepData: IEPDocumentData): Promise<IEPDocument> {
    return this.prisma.iEPDocument.create({
      data: {
        title: iepData.title,
        studentId: iepData.studentId,
        specialEducatorId,
        durationMonths: iepData.durationMonths,
        startDate: iepData.startDate,
        endDate: iepData.endDate,
        subjectSections: {
          create: iepData.subjectSections?.map(section => ({
            subject: section.subject,
            presentLevelReceptive: section.presentLevelReceptive,
            presentLevelExpressive: section.presentLevelExpressive,
            longTermGoals: {
              create: section.longTermGoals?.map(goal => ({
                goalNumber: goal.goalNumber,
                description: goal.description,
                durationMonths: goal.durationMonths
              })) || []
            },
            shortTermGoals: {
              create: section.shortTermGoals?.map(goal => ({
                goalNumber: goal.goalNumber,
                description: goal.description,
                teacherAssistance: goal.teacherAssistance,
                targetDate: goal.targetDate
              })) || []
            }
          })) || []
        }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            age: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        },
        subjectSections: {
          include: {
            longTermGoals: true,
            shortTermGoals: true
          }
        },
        weeklyEvaluations: {
          include: {
            activities: true
          }
        }
      }
    });
  }

  // Find IEP document by ID with all relations
  async findIEPDocumentById(id: string): Promise<IEPDocumentWithRelations | null> {
    return this.prisma.iEPDocument.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            age: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        },
        subjectSections: {
          include: {
            longTermGoals: true,
            shortTermGoals: true
          }
        },
        weeklyEvaluations: {
          include: {
            activities: true
          }
        }
      }
    });
  }

  // Find IEP documents by student ID
  async findIEPDocumentsByStudent(studentId: string): Promise<IEPDocumentWithRelations[]> {
    return this.prisma.iEPDocument.findMany({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            age: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        },
        subjectSections: {
          include: {
            longTermGoals: true,
            shortTermGoals: true
          }
        },
        weeklyEvaluations: {
          include: {
            activities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Find IEP documents by educator ID
  async findIEPDocumentsByEducator(educatorId: string): Promise<IEPDocumentWithRelations[]> {
    return this.prisma.iEPDocument.findMany({
      where: { specialEducatorId: educatorId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            age: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        },
        subjectSections: {
          include: {
            longTermGoals: true,
            shortTermGoals: true
          }
        },
        weeklyEvaluations: {
          include: {
            activities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Update IEP document
  async updateIEPDocument(id: string, updates: any): Promise<IEPDocument> {
    return this.prisma.iEPDocument.update({
      where: { id },
      data: updates,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            dateOfBirth: true,
            age: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        },
        subjectSections: {
          include: {
            longTermGoals: true,
            shortTermGoals: true
          }
        },
        weeklyEvaluations: {
          include: {
            activities: true
          }
        }
      }
    });
  }

  // Add subject section to IEP document
  async addSubjectSection(iepDocumentId: string, sectionData: IEPSubjectSectionData): Promise<IEPSubjectSection> {
    return this.prisma.iEPSubjectSection.create({
      data: {
        iepDocumentId,
        subject: sectionData.subject,
        presentLevelReceptive: sectionData.presentLevelReceptive,
        presentLevelExpressive: sectionData.presentLevelExpressive,
        longTermGoals: {
          create: sectionData.longTermGoals?.map(goal => ({
            goalNumber: goal.goalNumber,
            description: goal.description,
            durationMonths: goal.durationMonths
          })) || []
        },
        shortTermGoals: {
          create: sectionData.shortTermGoals?.map(goal => ({
            goalNumber: goal.goalNumber,
            description: goal.description,
            teacherAssistance: goal.teacherAssistance,
            targetDate: goal.targetDate
          })) || []
        }
      },
      include: {
        longTermGoals: true,
        shortTermGoals: true
      }
    });
  }

  // Add long-term goal to subject section
  async addLongTermGoal(subjectSectionId: string, goalData: IEPLongTermGoalData): Promise<IEPLongTermGoal> {
    return this.prisma.iEPLongTermGoal.create({
      data: {
        subjectSectionId,
        goalNumber: goalData.goalNumber,
        description: goalData.description,
        durationMonths: goalData.durationMonths
      }
    });
  }

  // Add short-term goal to subject section
  async addShortTermGoal(subjectSectionId: string, goalData: IEPShortTermGoalData): Promise<IEPShortTermGoal> {
    return this.prisma.iEPShortTermGoal.create({
      data: {
        subjectSectionId,
        goalNumber: goalData.goalNumber,
        description: goalData.description,
        teacherAssistance: goalData.teacherAssistance,
        targetDate: goalData.targetDate
      }
    });
  }

  // Add weekly evaluation to IEP document
  async addWeeklyEvaluation(iepDocumentId: string, evaluationData: IEPWeeklyEvaluationData): Promise<IEPWeeklyEvaluation> {
    return this.prisma.iEPWeeklyEvaluation.create({
      data: {
        iepDocumentId,
        weekNumber: evaluationData.weekNumber,
        startDate: evaluationData.startDate,
        endDate: evaluationData.endDate,
        strategies: evaluationData.strategies,
        observations: evaluationData.observations,
        activities: {
          create: evaluationData.activities?.map(activity => ({
            subject: activity.subject,
            activity: activity.activity,
            analysis: activity.analysis,
            assessment: activity.assessment,
            attentionLevel: activity.attentionLevel,
            sittingTolerance: activity.sittingTolerance,
            taskCompletion: activity.taskCompletion
          })) || []
        }
      },
      include: {
        activities: true
      }
    });
  }

  // Add activity to weekly evaluation
  async addWeeklyActivity(weeklyEvaluationId: string, activityData: IEPWeeklyActivityData): Promise<IEPWeeklyActivity> {
    return this.prisma.iEPWeeklyActivity.create({
      data: {
        weeklyEvaluationId,
        subject: activityData.subject,
        activity: activityData.activity,
        analysis: activityData.analysis,
        assessment: activityData.assessment,
        attentionLevel: activityData.attentionLevel,
        sittingTolerance: activityData.sittingTolerance,
        taskCompletion: activityData.taskCompletion
      }
    });
  }

  // Delete IEP document
  async deleteIEPDocument(id: string): Promise<void> {
    await this.prisma.iEPDocument.delete({
      where: { id }
    });
  }

  // Find weekly evaluation by ID
  async findWeeklyEvaluationById(id: string): Promise<IEPWeeklyEvaluation | null> {
    return this.prisma.iEPWeeklyEvaluation.findUnique({
      where: { id },
      include: {
        activities: true
      }
    });
  }

  // Find subject section by ID
  async findSubjectSectionById(id: string): Promise<IEPSubjectSection | null> {
    return this.prisma.iEPSubjectSection.findUnique({
      where: { id },
      include: {
        longTermGoals: true,
        shortTermGoals: true
      }
    });
  }
}