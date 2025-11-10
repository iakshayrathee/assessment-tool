import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { SchoolViewerService } from '../services/SchoolViewerService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';

export class SchoolViewerController {
  private schoolViewerService: SchoolViewerService;

  constructor(prisma: PrismaClient) {
    this.schoolViewerService = new SchoolViewerService(prisma);
  }

  /**
   * GET /api/school-viewers/profile - Get School Viewer profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const profile = await this.schoolViewerService.getSchoolViewerProfile(req.user!.userId);
      return ResponseHelper.success(res, profile);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/school-viewers/profile - Update School Viewer profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const { fullName, position, phone } = req.body;
      const profile = await this.schoolViewerService.updateProfile(req.user!.userId, {
        fullName,
        position,
        phone
      });

      return ResponseHelper.success(res, profile);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/school-viewers/dashboard - Get dashboard data
   */
  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const dashboardData = await this.schoolViewerService.getDashboardData(req.user!.userId);
      return ResponseHelper.success(res, dashboardData);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/school-viewers/students - Get students with filtering
   */
  async getStudents(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as any;
      const grade = req.query.grade as string;

      const result = await this.schoolViewerService.getStudents(req.user!.userId, {
        page,
        limit,
        search,
        status,
        grade
      });

      return ResponseHelper.paginated(res, result.students, page, limit, result.pagination.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/school-viewers/students/:id - Get student details
   */
  async getStudentDetails(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const studentId = req.params.id;
      const student = await this.schoolViewerService.getStudentDetails(req.user!.userId, studentId);
      
      return ResponseHelper.success(res, student);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 404);
    }
  }

  /**
   * GET /api/school-viewers/reports - Get reports with filtering
   */
  async getReports(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const status = req.query.status as any;
      const studentId = req.query.studentId as string;

      const result = await this.schoolViewerService.getReports(req.user!.userId, {
        page,
        limit,
        type,
        status,
        studentId
      });

      return ResponseHelper.paginated(res, result.reports, page, limit, result.pagination.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/school-viewers/reports/:id - Get report details
   */
  async getReportDetails(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const reportId = req.params.id;
      const report = await this.schoolViewerService.getReportDetails(req.user!.userId, reportId);
      
      return ResponseHelper.success(res, report);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 404);
    }
  }

  /**
   * GET /api/school-viewers/activity - Get activity timeline
   */
  async getActivityTimeline(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.schoolViewerService.getActivityTimeline(req.user!.userId, {
        page,
        limit
      });

      return ResponseHelper.paginated(res, result.activities, page, limit, result.pagination.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, error.statusCode || 500);
    }
  }
}
