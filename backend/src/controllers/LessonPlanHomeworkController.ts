import { Response } from 'express';
import { PrismaClient, SkillArea, HomeworkStatus, Domain, PlanStatus, LessonStatus } from '@prisma/client';
import { LongTermPlanService } from '../services/LongTermPlanService';
import { ShortTermPlanService } from '../services/ShortTermPlanService';
import { WeeklyLessonPlanService } from '../services/WeeklyLessonPlanService';
import { HomeworkService } from '../services/HomeworkService';
import { LearningMaterialService } from '../services/LearningMaterialService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';

export class LessonPlanHomeworkController {
  private longTermPlanService: LongTermPlanService;
  private shortTermPlanService: ShortTermPlanService;
  private weeklyLessonPlanService: WeeklyLessonPlanService;
  private homeworkService: HomeworkService;
  private learningMaterialService: LearningMaterialService;

  constructor(prisma: PrismaClient) {
    this.longTermPlanService = new LongTermPlanService(prisma);
    this.shortTermPlanService = new ShortTermPlanService(prisma);
    this.weeklyLessonPlanService = new WeeklyLessonPlanService(prisma);
    this.homeworkService = new HomeworkService(prisma);
    this.learningMaterialService = new LearningMaterialService(prisma);
  }

  // ========== LONG-TERM PLAN CONTROLLERS ==========

  createLongTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const plan = await this.longTermPlanService.createLongTermPlan(specialEducatorId, req.body);
      return ResponseHelper.success(res, plan, 'Long-term plan created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getLongTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.longTermPlanService.getLongTermPlanById(id);
      return ResponseHelper.success(res, plan);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getLongTermPlanWithHierarchy = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.longTermPlanService.getLongTermPlanWithHierarchy(id);
      return ResponseHelper.success(res, plan);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getLongTermPlansByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.longTermPlanService.getLongTermPlansByStudent(studentId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getLongTermPlansByEducator = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.studentId) filters.studentId = req.query.studentId as string;
      if (req.query.status) filters.status = req.query.status as PlanStatus;
      if (req.query.domain) filters.domain = req.query.domain as Domain;

      const result = await this.longTermPlanService.getLongTermPlansByEducator(specialEducatorId, page, limit, filters);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateLongTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.longTermPlanService.updateLongTermPlan(id, req.body);
      return ResponseHelper.success(res, plan, 'Long-term plan updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteLongTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.longTermPlanService.deleteLongTermPlan(id);
      return ResponseHelper.success(res, null, 'Long-term plan deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // ========== SHORT-TERM PLAN CONTROLLERS ==========

  createShortTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const plan = await this.shortTermPlanService.createShortTermPlan(specialEducatorId, req.body);
      return ResponseHelper.success(res, plan, 'Short-term plan created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getShortTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.shortTermPlanService.getShortTermPlanById(id);
      return ResponseHelper.success(res, plan);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getShortTermPlanWithWeeklyPlans = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.shortTermPlanService.getShortTermPlanWithWeeklyPlans(id);
      return ResponseHelper.success(res, plan);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getShortTermPlansByLongTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { ltpId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.shortTermPlanService.getShortTermPlansByLongTermPlan(ltpId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getShortTermPlansByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.shortTermPlanService.getShortTermPlansByStudent(studentId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getShortTermPlansByEducator = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.studentId) filters.studentId = req.query.studentId as string;
      if (req.query.longTermPlanId) filters.longTermPlanId = req.query.longTermPlanId as string;
      if (req.query.status) filters.status = req.query.status as PlanStatus;

      const result = await this.shortTermPlanService.getShortTermPlansByEducator(specialEducatorId, page, limit, filters);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateShortTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.shortTermPlanService.updateShortTermPlan(id, req.body);
      return ResponseHelper.success(res, plan, 'Short-term plan updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteShortTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.shortTermPlanService.deleteShortTermPlan(id);
      return ResponseHelper.success(res, null, 'Short-term plan deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateShortTermPlanProgress = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.shortTermPlanService.updateProgress(id);
      return ResponseHelper.success(res, plan, 'Progress updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // ========== WEEKLY LESSON PLAN CONTROLLERS ==========

  createWeeklyLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const plan = await this.weeklyLessonPlanService.createWeeklyLessonPlan(specialEducatorId, req.body);
      return ResponseHelper.success(res, plan, 'Weekly lesson plan created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getWeeklyLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.weeklyLessonPlanService.getWeeklyLessonPlanById(id);
      return ResponseHelper.success(res, plan);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getWeeklyLessonPlansByShortTermPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { stpId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.weeklyLessonPlanService.getWeeklyLessonPlansByShortTermPlan(stpId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getWeeklyLessonPlansByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.weeklyLessonPlanService.getWeeklyLessonPlansByStudent(studentId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getWeeklyLessonPlansByEducator = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.studentId) filters.studentId = req.query.studentId as string;
      if (req.query.shortTermPlanId) filters.shortTermPlanId = req.query.shortTermPlanId as string;
      if (req.query.status) filters.status = req.query.status as LessonStatus;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

      const result = await this.weeklyLessonPlanService.getWeeklyLessonPlansByEducator(specialEducatorId, page, limit, filters);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateWeeklyLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const plan = await this.weeklyLessonPlanService.updateWeeklyLessonPlan(id, req.body);
      return ResponseHelper.success(res, plan, 'Weekly lesson plan updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteWeeklyLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.weeklyLessonPlanService.deleteWeeklyLessonPlan(id);
      return ResponseHelper.success(res, null, 'Weekly lesson plan deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeWeeklyLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { actualTime, outcome } = req.body;

      if (!actualTime || !outcome) {
        return ResponseHelper.error(res, 'Actual time and outcome are required', 400);
      }

      const plan = await this.weeklyLessonPlanService.completeWeeklyLessonPlan(id, actualTime, outcome);
      return ResponseHelper.success(res, plan, 'Weekly lesson plan completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // ========== HOMEWORK CONTROLLERS ==========
  createHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;

      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const homework = await this.homeworkService.createHomework(specialEducatorId, req.body);
      return ResponseHelper.success(res, homework, 'Homework assigned successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const homework = await this.homeworkService.getHomeworkById(id);
      return ResponseHelper.success(res, homework);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getHomeworkByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.homeworkService.getHomeworkByStudent(studentId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getHomeworkByParent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const parentId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.homeworkService.getHomeworkByParent(parentId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getHomeworkByEducator = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.studentId) filters.studentId = req.query.studentId as string;
      if (req.query.status) filters.status = req.query.status as HomeworkStatus;
      if (req.query.subject) filters.subject = req.query.subject as SkillArea;

      const result = await this.homeworkService.getHomeworkByEducator(specialEducatorId, page, limit, filters);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const homework = await this.homeworkService.updateHomework(id, req.body);
      return ResponseHelper.success(res, homework, 'Homework updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  submitHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { parentFeedback } = req.body;
      const homework = await this.homeworkService.submitHomework(id, parentFeedback);
      return ResponseHelper.success(res, homework, 'Homework submitted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  reviewHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { educatorFeedback } = req.body;

      if (!educatorFeedback) {
        return ResponseHelper.error(res, 'Educator feedback is required', 400);
      }

      const homework = await this.homeworkService.reviewHomework(id, educatorFeedback);
      return ResponseHelper.success(res, homework, 'Homework reviewed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  completeHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const homework = await this.homeworkService.completeHomework(id);
      return ResponseHelper.success(res, homework, 'Homework completed successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteHomework = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.homeworkService.deleteHomework(id);
      return ResponseHelper.success(res, null, 'Homework deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // File Management Controllers
  uploadHomeworkFiles = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return ResponseHelper.error(res, 'No files provided', 400);
      }

      // Validate file types and sizes
      const { S3Service } = await import('../services/s3Service');
      for (const file of files) {
        if (!S3Service.isValidFileType(file.mimetype)) {
          return ResponseHelper.error(res, `Invalid file type: ${file.originalname}. Only PDF and DOC/DOCX files are allowed.`, 400);
        }
        if (!S3Service.isValidFileSize(file.size)) {
          return ResponseHelper.error(res, `File too large: ${file.originalname}. Maximum size is 10MB.`, 400);
        }
      }

      const homework = await this.homeworkService.uploadHomeworkFiles(id, files);
      return ResponseHelper.success(res, homework, 'Files uploaded successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getHomeworkFiles = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const files = await this.homeworkService.getHomeworkFilesWithSignedUrls(id);
      return ResponseHelper.success(res, { files });
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  deleteHomeworkFile = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id, fileKey } = req.params;

      // Decode the fileKey (it might be URL encoded)
      const decodedFileKey = decodeURIComponent(fileKey);

      const homework = await this.homeworkService.deleteHomeworkFile(id, decodedFileKey);
      return ResponseHelper.success(res, homework, 'File deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // Learning Material Controllers
  createLearningMaterial = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const uploadedBy = req.user?.profileId || (req as any).profileId;
      const data = { ...req.body, uploadedBy };

      const material = await this.learningMaterialService.createLearningMaterial(data);
      return ResponseHelper.success(res, material, 'Learning material created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getLearningMaterial = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const material = await this.learningMaterialService.getLearningMaterialById(id);
      return ResponseHelper.success(res, material);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getAllLearningMaterials = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: any = {};
      if (req.query.subject) filters.subject = req.query.subject as SkillArea;
      if (req.query.grade) filters.grade = parseInt(req.query.grade as string);
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.search) filters.search = req.query.search as string;
      if (req.query.tags) filters.tags = (req.query.tags as string).split(',');
      if (req.query.isPublic !== undefined) filters.isPublic = req.query.isPublic === 'true';

      const result = await this.learningMaterialService.getAllLearningMaterials(page, limit, filters);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getLearningMaterialsBySubjectAndGrade = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { subject, grade } = req.params;
      const materials = await this.learningMaterialService.getLearningMaterialsBySubjectAndGrade(
        subject as SkillArea,
        parseInt(grade)
      );
      return ResponseHelper.success(res, materials);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateLearningMaterial = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const material = await this.learningMaterialService.updateLearningMaterial(id, req.body);
      return ResponseHelper.success(res, material, 'Learning material updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteLearningMaterial = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.learningMaterialService.deleteLearningMaterial(id);
      return ResponseHelper.success(res, null, 'Learning material deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };
}

