import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AssessmentService } from '../services/AssessmentService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';
import { UserRole } from '../models';

export class AssessmentController {
  private assessmentService: AssessmentService;

  constructor(prisma: PrismaClient) {
    this.assessmentService = new AssessmentService(prisma);
  }

  // Intake Form Controllers
  async createIntakeForm(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const intakeForm = await this.assessmentService.createIntakeForm(req.user!.userId, req.body);
      return ResponseHelper.success(res, intakeForm, 'Intake form created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateIntakeForm(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const intakeForm = await this.assessmentService.updateIntakeForm(req.params.id, req.body);
      return ResponseHelper.success(res, intakeForm, 'Intake form updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async completeIntakeForm(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const intakeForm = await this.assessmentService.completeIntakeForm(req.params.id);
      return ResponseHelper.success(res, intakeForm, 'Intake form completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getIntakeFormById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const intakeForm = await this.assessmentService.getIntakeFormById(req.params.id);
      return ResponseHelper.success(res, intakeForm);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async getIntakeFormByStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const intakeForm = await this.assessmentService.getIntakeFormByStudent(req.params.studentId);
      return ResponseHelper.success(res, intakeForm);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  // Assessment Controllers
  async createAssessment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assessment = await this.assessmentService.createAssessment(req.user!.userId, req.body);
      return ResponseHelper.success(res, assessment, 'Assessment created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateAssessment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assessment = await this.assessmentService.updateAssessment(req.params.id, req.body);
      return ResponseHelper.success(res, assessment, 'Assessment updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async completeAssessment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assessment = await this.assessmentService.completeAssessment(req.params.id);
      return ResponseHelper.success(res, assessment, 'Assessment completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getAssessmentById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assessment = await this.assessmentService.getAssessmentById(req.params.id);
      return ResponseHelper.success(res, assessment);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async getAssessmentsByStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assessments = await this.assessmentService.getAssessmentsByStudent(req.params.studentId);
      return ResponseHelper.success(res, assessments);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getAssessmentsByEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.assessmentService.getAssessmentsByEducator(req.params.educatorId, page, limit);
      return ResponseHelper.paginated(res, result.assessments, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // IEP Goal Controllers
  async createIEPGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      // Use profileId (special educator profile ID) instead of userId
      if (!req.user!.profileId) {
        return ResponseHelper.error(res, 'Special educator profile not found', 400);
      }

      const iepGoal = await this.assessmentService.createIEPGoal(req.user!.profileId, req.body);
      return ResponseHelper.success(res, iepGoal, 'IEP goal created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateIEPGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const iepGoal = await this.assessmentService.updateIEPGoal(req.params.id, req.body);
      return ResponseHelper.success(res, iepGoal, 'IEP goal updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateIEPGoalProgress(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { progress, notes, rating } = req.body;
      await this.assessmentService.updateIEPGoalProgress(req.params.goalId, progress, notes, rating);
      return ResponseHelper.success(res, null, 'IEP goal progress updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getIEPGoalById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const iepGoal = await this.assessmentService.getIEPGoalById(req.params.id);
      return ResponseHelper.success(res, iepGoal);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async getIEPGoalsByStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const iepGoals = await this.assessmentService.getIEPGoalsByStudent(req.params.studentId);
      return ResponseHelper.success(res, iepGoals);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getIEPGoalsByEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const iepGoals = await this.assessmentService.getIEPGoalsByEducator(req.params.educatorId);
      return ResponseHelper.success(res, iepGoals);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async discontinueIEPGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { reason } = req.body;
      const iepGoal = await this.assessmentService.discontinueIEPGoal(req.params.id, reason);
      return ResponseHelper.success(res, iepGoal, 'IEP goal discontinued successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Session Note Controllers
  async createSessionNote(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const sessionNote = await this.assessmentService.createSessionNote(req.user!.userId, req.body);
      return ResponseHelper.success(res, sessionNote, 'Session note created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateSessionNote(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const sessionNote = await this.assessmentService.updateSessionNote(req.params.id, req.body);
      return ResponseHelper.success(res, sessionNote, 'Session note updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getSessionNoteById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const sessionNote = await this.assessmentService.getSessionNoteById(req.params.id);
      return ResponseHelper.success(res, sessionNote);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async getSessionNotesByStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.assessmentService.getSessionNotesByStudent(req.params.studentId, page, limit);
      return ResponseHelper.paginated(res, result.sessionNotes, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getSessionNotesByEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.assessmentService.getSessionNotesByEducator(req.params.educatorId, page, limit);
      return ResponseHelper.paginated(res, result.sessionNotes, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Report Controllers
  async createReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const report = await this.assessmentService.createReport(req.user!.userId, req.body);
      return ResponseHelper.success(res, report, 'Report created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const report = await this.assessmentService.updateReport(req.params.id, req.body);
      return ResponseHelper.success(res, report, 'Report updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async submitReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { signature } = req.body;
      if (!signature) {
        return ResponseHelper.error(res, 'Signature is required', 400);
      }

      const report = await this.assessmentService.submitReport(req.params.id, signature);
      return ResponseHelper.success(res, report, 'Report submitted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async reviewReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const report = await this.assessmentService.reviewReport(req.params.id, req.user!.userId);
      return ResponseHelper.success(res, report, 'Report reviewed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getReportById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const report = await this.assessmentService.getReportById(req.params.id);
      return ResponseHelper.success(res, report);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async getReportsByStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const reports = await this.assessmentService.getReportsByStudent(req.params.studentId);
      return ResponseHelper.success(res, reports);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getReportsByEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.assessmentService.getReportsByEducator(req.params.educatorId, page, limit);
      return ResponseHelper.paginated(res, result.reports, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getPendingReports(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const superSpecialEducatorId = req.user!.role === UserRole.SUPER_SPECIAL_EDUCATOR ? req.user!.userId : undefined;
      const reports = await this.assessmentService.getPendingReports(superSpecialEducatorId);
      return ResponseHelper.success(res, reports);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Statistics and Analytics
  async getAssessmentStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const specialEducatorId = req.user!.role === UserRole.SPECIAL_EDUCATOR ? req.user!.userId : undefined;
      const centerId = req.query.centerId as string;
      
      const stats = await this.assessmentService.getAssessmentStats(specialEducatorId, centerId);
      return ResponseHelper.success(res, stats);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getStudentAssessmentSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const summary = await this.assessmentService.getStudentAssessmentSummary(req.params.studentId);
      return ResponseHelper.success(res, summary);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async generateAssessmentReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { reportType } = req.body;
      if (!reportType) {
        return ResponseHelper.error(res, 'Report type is required', 400);
      }

      const reportContent = await this.assessmentService.generateAssessmentReport(req.params.studentId, reportType);
      return ResponseHelper.success(res, { content: reportContent }, 'Report generated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getAssessmentHistory(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      if (!studentId) {
        return ResponseHelper.error(res, 'Student ID is required', 400);
      }

      const history = await this.assessmentService.getAssessmentHistory(studentId);
      return ResponseHelper.success(res, history, 'Assessment history retrieved successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }
}
