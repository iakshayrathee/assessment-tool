import { Response } from 'express';
import { PrismaClient, SkillArea, HomeworkStatus } from '@prisma/client';
import { LessonPlanService } from '../services/LessonPlanService';
import { HomeworkService } from '../services/HomeworkService';
import { LearningMaterialService } from '../services/LearningMaterialService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';

export class LessonPlanHomeworkController {
  private lessonPlanService: LessonPlanService;
  private homeworkService: HomeworkService;
  private learningMaterialService: LearningMaterialService;

  constructor(prisma: PrismaClient) {
    this.lessonPlanService = new LessonPlanService(prisma);
    this.homeworkService = new HomeworkService(prisma);
    this.learningMaterialService = new LearningMaterialService(prisma);
  }

  // Lesson Plan Controllers
  createLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      
      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator profile ID is required', 400);
      }

      const lessonPlan = await this.lessonPlanService.createLessonPlan(specialEducatorId, req.body);
      return ResponseHelper.success(res, lessonPlan, 'Lesson plan created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  getLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const lessonPlan = await this.lessonPlanService.getLessonPlanById(id);
      return ResponseHelper.success(res, lessonPlan);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getLessonPlansByStudent = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { studentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await this.lessonPlanService.getLessonPlansByStudent(studentId, page, limit);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  };

  getLessonPlansByEducator = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const specialEducatorId = req.user?.profileId || (req as any).profileId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const filters: any = {};
      if (req.query.studentId) filters.studentId = req.query.studentId as string;
      if (req.query.skillArea) filters.skillArea = req.query.skillArea as SkillArea;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
      
      const result = await this.lessonPlanService.getLessonPlansByEducator(specialEducatorId, page, limit, filters);
      return ResponseHelper.success(res, result);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  updateLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const lessonPlan = await this.lessonPlanService.updateLessonPlan(id, req.body);
      return ResponseHelper.success(res, lessonPlan, 'Lesson plan updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  deleteLessonPlan = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      await this.lessonPlanService.deleteLessonPlan(id);
      return ResponseHelper.success(res, null, 'Lesson plan deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  };

  // Homework Controllers
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

