import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../utils/auth';
import { ParentService } from '../services/ParentService';
import { ParentReportService } from '../services/ParentReportService';
import { ReportPeriodType } from '@prisma/client';

export class ParentController {
  private parentService: ParentService;
  private parentReportService: ParentReportService;

  constructor(private prisma: PrismaClient) {
    this.parentService = new ParentService(prisma);
    this.parentReportService = new ParentReportService(prisma);
  }

  // Get parent dashboard data
  async getParentDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.role === 'PARENT' ? req.user.id : req.params.id;

      const dashboardData = await this.parentService.getDashboardData(parentId);

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      console.error('Get parent dashboard error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch parent dashboard'
      });
    }
  }

  // Submit parent concern
  async submitConcern(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { studentId, title, description, category, priority } = req.body;

      const concern = await this.parentService.createConcern(parentId, {
        studentId,
        title,
        description,
        category,
        priority
      });

      res.status(201).json({
        success: true,
        data: concern,
        message: 'Concern submitted successfully'
      });
    } catch (error: any) {
      console.error('Submit concern error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit concern'
      });
    }
  }

  // Get parent concerns
  async getConcerns(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await this.parentService.getConcerns(parentId, page, limit, status);

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get concerns error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch concerns'
      });
    }
  }

  // Upload parent document
  async uploadDocument(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { fileName, filePath, fileType, fileSize, category, description } = req.body;

      const document = await this.parentService.createDocument(parentId, {
        fileName,
        filePath,
        fileType,
        fileSize,
        category,
        description
      });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully'
      });
    } catch (error: any) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload document'
      });
    }
  }

  // Get parent documents
  async getDocuments(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;

      const result = await this.parentService.getDocuments(parentId, page, limit, category);

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Get documents error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch documents'
      });
    }
  }

  // Get child reports (for parent)
  async getChildReports(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { childId } = req.params;
      const reports = await this.parentService.getChildReports(parentId, childId);

      res.json({
        success: true,
        data: reports
      });
    } catch (error: any) {
      console.error('Get child reports error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child reports'
      });
    }
  }

  // Get child IEP goals (for parent)
  async getChildIEPGoals(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { childId } = req.params;
      const iepGoals = await this.parentService.getChildIEPGoals(parentId, childId);

      res.json({
        success: true,
        data: iepGoals
      });
    } catch (error: any) {
      console.error('Get child IEP goals error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child IEP goals'
      });
    }
  }

  // Update parent profile
  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { fullName, phone, address, emergencyContact } = req.body;

      const updatedParent = await this.parentService.updateProfile(parentId, {
        fullName,
        phone,
        address,
        emergencyContact
      });

      res.json({
        success: true,
        data: updatedParent,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Update parent profile error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  // Get child details (for parent)
  async getChildDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.user?.userId;
      if (!parentId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { childId } = req.params;
      const childDetails = await this.parentService.getChildDetails(parentId, childId);

      res.json({
        success: true,
        data: childDetails
      });
    } catch (error: any) {
      console.error('Get child details error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch child details'
      });
    }
  }

  // Generate parent report snapshot
  async generateParentSnapshot(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get parent profile ID
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId }
      });

      if (!parentProfile) {
        return res.status(404).json({
          success: false,
          error: 'Parent profile not found'
        });
      }

      const { studentId } = req.params;
      const { periodType, startDate, endDate } = req.body;

      // Verify parent owns this student
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          parentId: parentProfile.id
        }
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Student not found or not your child'
        });
      }

      // Calculate default dates if not provided
      const period = periodType || 'MONTHLY';
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : this.getDefaultStartDate(period, end);

      const snapshot = await this.parentReportService.generateParentSnapshot(
        studentId,
        parentProfile.id,
        period as ReportPeriodType,
        start,
        end
      );

      res.json({
        success: true,
        data: snapshot,
        message: 'Report generated successfully'
      });
    } catch (error: any) {
      console.error('Generate parent snapshot error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate report'
      });
    }
  }

  // List parent report snapshots
  async listParentSnapshots(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get parent profile ID
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId }
      });

      if (!parentProfile) {
        return res.status(404).json({
          success: false,
          error: 'Parent profile not found'
        });
      }

      const { studentId } = req.params;

      // Verify parent owns this student
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          parentId: parentProfile.id
        }
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Student not found or not your child'
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const periodType = req.query.periodType as ReportPeriodType;

      const result = await this.parentReportService.listParentSnapshots(
        studentId,
        parentProfile.id,
        { page, limit, periodType }
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('List parent snapshots error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch report snapshots'
      });
    }
  }

  // Get complete parent report data
  async getCompleteParentReportData(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      // Get parent profile ID
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId }
      });

      if (!parentProfile) {
        return res.status(404).json({
          success: false,
          error: 'Parent profile not found'
        });
      }

      const { studentId } = req.params;

      // Verify parent owns this student
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          parentId: parentProfile.id
        },
        include: {
          center: true,
          school: true
        }
      });

      if (!student) {
        return res.status(403).json({
          success: false,
          error: 'Access denied: Student not found or not your child'
        });
      }

      const snapshotId = req.query.snapshotId as string;
      const periodType = (req.query.periodType as ReportPeriodType) || 'MONTHLY';
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      let snapshot;

      if (snapshotId) {
        // Fetch specific snapshot
        snapshot = await this.prisma.parentReportSnapshot.findFirst({
          where: {
            id: snapshotId,
            studentId,
            parentId: parentProfile.id
          }
        });
      } else {
        // Generate or fetch latest snapshot
        const end = endDate || new Date();
        const start = startDate || this.getDefaultStartDate(periodType, end);

        snapshot = await this.parentReportService.generateParentSnapshot(
          studentId,
          parentProfile.id,
          periodType,
          start,
          end
        );
      }

      if (!snapshot) {
        return res.status(404).json({
          success: false,
          error: 'Report snapshot not found'
        });
      }

      // Structure response data
      const responseData = {
        snapshot,
        student: {
          id: student.id,
          fullName: student.fullName,
          grade: student.grade,
          age: student.age,
          centerName: student.center?.centerName,
          schoolName: student.school?.name
        },
        studentInfo: {
          studentName: snapshot.studentName,
          studentGrade: snapshot.studentGrade,
          studentAge: snapshot.studentAge,
          enrollmentDate: snapshot.enrollmentDate,
          assignedEducatorName: snapshot.assignedEducatorName
        },
        assessmentSummary: {
          totalAssessments: snapshot.totalAssessments,
          latestAssessmentDate: snapshot.latestAssessmentDate,
          latestAssessmentScore: snapshot.latestAssessmentScore,
          riskLevel: snapshot.riskLevel,
          assessmentProgress: snapshot.assessmentProgress
        },
        progressTracking: {
          readingProgress: snapshot.readingProgress,
          writingProgress: snapshot.writingProgress,
          mathProgress: snapshot.mathProgress,
          attentionProgress: snapshot.attentionProgress,
          overallGoalCompletion: snapshot.overallGoalCompletion
        },
        attendance: {
          totalSessionsScheduled: snapshot.totalSessionsScheduled,
          sessionsAttended: snapshot.sessionsAttended,
          participationRate: snapshot.participationRate,
          lastSessionDate: snapshot.lastSessionDate
        },
        interventionPlan: {
          focusAreas: {
            reading: snapshot.focusReading,
            writing: snapshot.focusWriting,
            mathematics: snapshot.focusMathematics,
            attention: snapshot.focusAttention,
            confidence: snapshot.focusConfidence
          },
          goals: {
            shortTerm: snapshot.shortTermGoals,
            longTerm: snapshot.longTermGoals
          },
          strategies: {
            reading: snapshot.readingStrategy,
            writing: snapshot.writingStrategy,
            mathematics: snapshot.mathematicsStrategy,
            attention: snapshot.attentionStrategy,
            confidence: snapshot.confidenceStrategy
          },
          educatorNotes: snapshot.educatorNotes,
          parentFriendlySummary: snapshot.parentFriendlySummary,
          nextReviewDate: snapshot.nextReviewDate
        }
      };

      res.json({
        success: true,
        data: responseData
      });
    } catch (error: any) {
      console.error('Get complete parent report data error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch complete report data'
      });
    }
  }

  // Helper: Calculate default start date based on period type
  private getDefaultStartDate(periodType: string, endDate: Date): Date {
    const start = new Date(endDate);

    switch (periodType) {
      case 'MONTHLY':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'QUARTERLY':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'YEARLY':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }

    return start;
  }
}
