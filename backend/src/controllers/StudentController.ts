import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { StudentService } from '../services/StudentService';
import { AuthenticatedRequest } from '../utils/auth';
import { ResponseHelper } from '../utils/helpers';
import { UserRole } from '../models';

export class StudentController {
  private studentService: StudentService;

  constructor(prisma: PrismaClient) {
    this.studentService = new StudentService(prisma);
  }

  async createStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      // Get centerId from the logged-in educator's center assignment
      let centerId = null;
      if (req.user!.role === UserRole.SPECIAL_EDUCATOR) {
        const educatorProfile = await this.studentService.getEducatorProfile(req.user!.userId);
        if (educatorProfile && educatorProfile.centerAssignments.length > 0) {
          centerId = educatorProfile.centerAssignments[0].centerId;
        }
      } else if (req.user!.role === UserRole.CENTER) {
        // For center users, get centerId from their profile
        const centerProfile = await this.studentService.getCenterProfile(req.user!.userId);
        if (centerProfile) {
          centerId = centerProfile.id;
        }
      }

      if (!centerId) {
        return ResponseHelper.error(res, 'Unable to determine center assignment. Please contact administrator.', 400);
      }

      // Add centerId to the request body
      const studentData = {
        ...req.body,
        centerId
      };

      const student = await this.studentService.createStudent(studentData);
      
      // Debug logging
      console.log('🔍 User info in createStudent:', {
        userId: req.user!.userId,
        role: req.user!.role,
        profileId: req.user!.profileId,
        email: req.user!.email
      });
      
      // If the student was created by a special educator, automatically assign the student to them
      if (req.user!.role === UserRole.SPECIAL_EDUCATOR && req.user!.profileId) {
        console.log('✅ Assigning student to special educator:', {
          studentId: student.id,
          educatorId: req.user!.profileId
        });
        await this.studentService.assignStudentToEducator(student.id, req.user!.profileId);
      } else {
        console.log('❌ Not assigning student - conditions not met:', {
          isSpecialEducator: req.user!.role === UserRole.SPECIAL_EDUCATOR,
          hasProfileId: !!req.user!.profileId
        });
      }
      
      return ResponseHelper.success(res, student, 'Student created successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getStudents(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const centerId = req.query.centerId as string;
      const schoolId = req.query.schoolId as string;
      const search = req.query.search as string;

      let result;

      if (search) {
        result = await this.studentService.searchStudents(search, centerId, schoolId, page, limit);
      } else if (req.user!.role === UserRole.PARENT) {
        // Parents can only see their own children
        const students = await this.studentService.getStudentsByParent(req.user!.userId);
        result = { students, total: students.length };
      } else if (req.user!.role === UserRole.SPECIAL_EDUCATOR) {
        // Special educators see their assigned students
        result = await this.studentService.getStudentsBySpecialEducator(req.user!.userId, page, limit);
      } else if (centerId) {
        result = await this.studentService.getStudentsByCenter(centerId, page, limit);
      } else if (schoolId) {
        result = await this.studentService.getStudentsBySchool(schoolId, page, limit);
      } else {
        // For admin and super special educators, implement center-based filtering
        result = await this.studentService.getStudentsByCenter('', page, limit);
      }

      return ResponseHelper.paginated(res, result.students, page, limit, result.total);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getStudentStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const centerId = req.query.centerId as string;
      const schoolId = req.query.schoolId as string;
      
      const stats = await this.studentService.getStudentStats(centerId, schoolId);
      return ResponseHelper.success(res, stats);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getStudentById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const student = await this.studentService.getStudentById(req.params.id);
      
      // Check access permissions
      if (req.user!.role === UserRole.PARENT) {
        // Parents can only access their own children
        if (student.parentId !== req.user!.userId) {
          return ResponseHelper.error(res, 'Access denied', 403);
        }
      }

      return ResponseHelper.success(res, student);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 404);
    }
  }

  async updateStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const student = await this.studentService.updateStudent(req.params.id, req.body);
      return ResponseHelper.success(res, student, 'Student updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async deleteStudent(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      await this.studentService.deleteStudent(req.params.id);
      return ResponseHelper.success(res, null, 'Student deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async updateStudentStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const { status } = req.body;
      if (!status) {
        return ResponseHelper.error(res, 'Status is required', 400);
      }

      const student = await this.studentService.updateStudentStatus(req.params.id, status);
      return ResponseHelper.success(res, student, 'Student status updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async assignStudentToEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const { specialEducatorId } = req.body;
      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator ID is required', 400);
      }

      await this.studentService.assignStudentToEducator(req.params.id, specialEducatorId);
      return ResponseHelper.success(res, null, 'Student assigned successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async unassignStudentFromEducator(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const { specialEducatorId } = req.body;
      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator ID is required', 400);
      }

      await this.studentService.unassignStudentFromEducator(req.params.id, specialEducatorId);
      return ResponseHelper.success(res, null, 'Student unassigned successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getStudentDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.validationError(res, errors.array(), 400);
      }

      const dashboardData = await this.studentService.getStudentDashboardData(req.params.id);
      
      // Check access permissions
      if (req.user!.role === UserRole.PARENT) {
        if (dashboardData.student.parentId !== req.user!.userId) {
          return ResponseHelper.error(res, 'Access denied', 403);
        }
      }

      return ResponseHelper.success(res, dashboardData);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async getStudentProgress(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.error(res, 'Validation failed', 400);
      }

      const progressData = await this.studentService.getStudentProgress(req.params.id);
      return ResponseHelper.success(res, progressData);
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async bulkAssignStudents(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { studentIds, specialEducatorId } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return ResponseHelper.error(res, 'Student IDs array is required', 400);
      }
      
      if (!specialEducatorId) {
        return ResponseHelper.error(res, 'Special educator ID is required', 400);
      }

      await this.studentService.bulkAssignStudents(studentIds, specialEducatorId);
      return ResponseHelper.success(res, null, 'Students assigned successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }

  async bulkUpdateStudentStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { studentIds, status } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return ResponseHelper.error(res, 'Student IDs array is required', 400);
      }
      
      if (!status) {
        return ResponseHelper.error(res, 'Status is required', 400);
      }

      await this.studentService.bulkUpdateStudentStatus(studentIds, status);
      return ResponseHelper.success(res, null, 'Student statuses updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(res, error.message, 400);
    }
  }
}
