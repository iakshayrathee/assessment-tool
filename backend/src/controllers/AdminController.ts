import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';
import { AdminService } from '../services/AdminService';

export class AdminController {
  private adminService: AdminService;

  constructor(prisma: PrismaClient) {
    this.adminService = new AdminService(prisma);
  }

  // Dashboard Overview
  async getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // Debug logging for auth token and request details
      const authHeader = req.headers['authorization'];
      const token = authHeader?.split(' ')[1]; // Get token without 'Bearer' prefix
      
    
      
      const overview = await this.adminService.getDashboardOverview();
      
      
      return ResponseHelper.success(res, overview);
    } catch (error: any) {
      console.error('Error in getDashboardOverview:', error);
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  // User Management
  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as UserRole;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await this.adminService.getAllUsers(page, limit, role, search, status);
      return ResponseHelper.paginated(res, result.users, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const user = await this.adminService.createUser(req.body);
      return ResponseHelper.success(res, user, 'User created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const { userId } = req.params;
      const user = await this.adminService.updateUser(userId, req.body);
      return ResponseHelper.success(res, user, 'User updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      await this.adminService.deleteUser(userId);
      return ResponseHelper.success(res, null, 'User deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async activateUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      await this.adminService.activateUser(userId);
      return ResponseHelper.success(res, null, 'User activated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async deactivateUser(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      await this.adminService.deactivateUser(userId);
      return ResponseHelper.success(res, null, 'User deactivated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Center Management
  async getAllCenters(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await this.adminService.getAllCenters(page, limit, search);
      return ResponseHelper.paginated(res, result.centers, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async createCenter(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const center = await this.adminService.createCenter(req.body);
      return ResponseHelper.success(res, center, 'Center created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateCenter(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { centerId } = req.params;
      const center = await this.adminService.updateCenter(centerId, req.body);
      return ResponseHelper.success(res, center, 'Center updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async deleteCenter(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { centerId } = req.params;
      await this.adminService.deleteCenter(centerId);
      return ResponseHelper.success(res, null, 'Center deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // School Management
  async getAllSchools(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const centerId = req.query.centerId as string;

      const result = await this.adminService.getAllSchools(page, limit, search, centerId);
      return ResponseHelper.paginated(res, result.schools, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async createSchool(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const school = await this.adminService.createSchool(req.body);
      return ResponseHelper.success(res, school, 'School created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateSchool(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { schoolId } = req.params;
      const school = await this.adminService.updateSchool(schoolId, req.body);
      return ResponseHelper.success(res, school, 'School updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async deleteSchool(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { schoolId } = req.params;
      await this.adminService.deleteSchool(schoolId);
      return ResponseHelper.success(res, null, 'School deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Role Assignments
  async assignEducatorToCenter(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assignment = await this.adminService.assignEducatorToCenter(req.body);
      return ResponseHelper.success(res, assignment, 'Educator assigned to center successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async removeEducatorFromCenter(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { assignmentId } = req.params;
      await this.adminService.removeEducatorFromCenter(assignmentId);
      return ResponseHelper.success(res, null, 'Educator removed from center successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async assignStudentToEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const assignment = await this.adminService.assignStudentToEducator(req.body);
      return ResponseHelper.success(res, assignment, 'Student assigned to educator successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Approval System
  async getPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;

      const result = await this.adminService.getPendingApprovals(page, limit, type);
      return ResponseHelper.paginated(res, result.approvals, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async approveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { requestId } = req.params;
      const { comments } = req.body;
      
      await this.adminService.approveRequest(requestId, req.user!.userId, comments);
      return ResponseHelper.success(res, null, 'Request approved successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async rejectRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      
      await this.adminService.rejectRequest(requestId, req.user!.userId, reason);
      return ResponseHelper.success(res, null, 'Request rejected successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Student Management
  async getAllStudents(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const centerId = req.query.centerId as string;
      const status = req.query.status as string;

      const result = await this.adminService.getAllStudents(page, limit, search, centerId, status);
      return ResponseHelper.paginated(res, result.students, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async getStudentDetails(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { studentId } = req.params;
      const student = await this.adminService.getStudentDetails(studentId);
      return ResponseHelper.success(res, student);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  // Reports and Analytics
  async getAllReports(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const status = req.query.status as string;
      const centerId = req.query.centerId as string;

      const result = await this.adminService.getAllReports(page, limit, type, status, centerId);
      return ResponseHelper.paginated(res, result.reports, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async getSystemAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const period = req.query.period as string || 'month';
      const analytics = await this.adminService.getSystemAnalytics(period);
      return ResponseHelper.success(res, analytics);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  // Audit Logs
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const action = req.query.action as string;
      const userId = req.query.userId as string;
      const resource = req.query.resource as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const result = await this.adminService.getAuditLogs(
        page, limit, action, userId, resource, startDate, endDate
      );
      return ResponseHelper.paginated(res, result.logs, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  // Global Search
  async globalSearch(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { query } = req.query;
      const { type } = req.query;
      
      if (!query || (query as string).trim().length < 2) {
        return ResponseHelper.error(res, 'Search query must be at least 2 characters long', 400);
      }

      const results = await this.adminService.globalSearch(query as string, type as string);
      return ResponseHelper.success(res, results);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  // System Configuration
  async getSystemConfig(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const config = await this.adminService.getSystemConfig();
      return ResponseHelper.success(res, config);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }

  async updateSystemConfig(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const config = await this.adminService.updateSystemConfig(req.body);
      return ResponseHelper.success(res, config, 'System configuration updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  // Data Export
  async exportData(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { type, format, filters } = req.body;
      const exportResult = await this.adminService.exportData(type, format, filters);
      return ResponseHelper.success(res, exportResult, 'Data export initiated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 500);
    }
  }
}
