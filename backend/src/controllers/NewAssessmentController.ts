import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NewAssessmentService } from '../services/NewAssessmentService';
import { AssessmentService } from '../services/AssessmentService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';

export class NewAssessmentController {
  private assessmentService: NewAssessmentService;
  private intakeFormService: AssessmentService;

  constructor(prisma: PrismaClient) {
    this.assessmentService = new NewAssessmentService(prisma);
    this.intakeFormService = new AssessmentService(prisma);
  }

  // Formal Assessment Controllers
  createFormalAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const assessment = await this.assessmentService.createFormalAssessment(specialEducatorId, req.body);
      return ResponseHelper.success(res, assessment, 'Formal assessment created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getFormalAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.getFormalAssessmentById(id);
      return ResponseHelper.success(res, assessment);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getFormalAssessmentsByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const assessments = await this.assessmentService.getFormalAssessmentsByStudent(studentId);
      return ResponseHelper.success(res, assessments);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getFormalAssessmentsByEducator = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.assessmentService.getFormalAssessmentsByEducator(specialEducatorId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateFormalAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.updateFormalAssessment(id, req.body);
      return ResponseHelper.success(res, assessment, 'Formal assessment updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeFormalAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.completeFormalAssessment(id);
      return ResponseHelper.success(res, assessment, 'Formal assessment completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteFormalAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.assessmentService.deleteFormalAssessment(id);
      return ResponseHelper.success(res, null, 'Formal assessment deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // Reading Skill Assessment Controllers
  createReadingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const assessment = await this.assessmentService.createReadingAssessment(specialEducatorId, req.body);
      return ResponseHelper.success(res, assessment, 'Reading assessment created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getReadingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.getReadingAssessmentById(id);
      return ResponseHelper.success(res, assessment);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getReadingAssessmentsByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const assessments = await this.assessmentService.getReadingAssessmentsByStudent(studentId);
      return ResponseHelper.success(res, assessments);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  updateReadingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.updateReadingAssessment(id, req.body);
      return ResponseHelper.success(res, assessment, 'Reading assessment updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeReadingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.completeReadingAssessment(id);
      return ResponseHelper.success(res, assessment, 'Reading assessment completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // Writing Skill Assessment Controllers
  createWritingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const assessment = await this.assessmentService.createWritingAssessment(specialEducatorId, req.body);
      return ResponseHelper.success(res, assessment, 'Writing assessment created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getWritingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.getWritingAssessmentById(id);
      return ResponseHelper.success(res, assessment);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getWritingAssessmentsByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const assessments = await this.assessmentService.getWritingAssessmentsByStudent(studentId);
      return ResponseHelper.success(res, assessments);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  updateWritingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.updateWritingAssessment(id, req.body);
      return ResponseHelper.success(res, assessment, 'Writing assessment updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeWritingAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.completeWritingAssessment(id);
      return ResponseHelper.success(res, assessment, 'Writing assessment completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // Math Skill Assessment Controllers
  createMathAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const assessment = await this.assessmentService.createMathAssessment(specialEducatorId, req.body);
      return ResponseHelper.success(res, assessment, 'Math assessment created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getMathAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.getMathAssessmentById(id);
      return ResponseHelper.success(res, assessment);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getMathAssessmentsByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const assessments = await this.assessmentService.getMathAssessmentsByStudent(studentId);
      return ResponseHelper.success(res, assessments);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  updateMathAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.updateMathAssessment(id, req.body);
      return ResponseHelper.success(res, assessment, 'Math assessment updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeMathAssessment = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const assessment = await this.assessmentService.completeMathAssessment(id);
      return ResponseHelper.success(res, assessment, 'Math assessment completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // Intake Form Controllers
  createIntakeForm = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const intakeForm = await this.intakeFormService.createIntakeForm(specialEducatorId, req.body);
      return ResponseHelper.success(res, intakeForm, 'Intake form created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateIntakeForm = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const intakeForm = await this.intakeFormService.updateIntakeForm(id, req.body);
      return ResponseHelper.success(res, intakeForm, 'Intake form updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeIntakeForm = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const intakeForm = await this.intakeFormService.completeIntakeForm(id);
      return ResponseHelper.success(res, intakeForm, 'Intake form completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getIntakeFormByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const intakeForm = await this.intakeFormService.getIntakeFormByStudent(studentId);
      return ResponseHelper.success(res, intakeForm);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getIntakeFormById = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const intakeForm = await this.intakeFormService.getIntakeFormById(id);
      return ResponseHelper.success(res, intakeForm);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };
}

