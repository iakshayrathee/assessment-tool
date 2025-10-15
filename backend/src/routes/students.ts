import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { StudentController } from '../controllers/StudentController';
import { AuthUtils } from '../utils/auth';
import { ValidationRules } from '../utils/validation';
import { UserRole } from '../models';
import { attachProfileId } from '../middleware/profileMiddleware';

const router = Router();
const prisma = new PrismaClient();
const studentController = new StudentController(prisma);

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

// Apply profile middleware to attach profile ID
router.use(attachProfileId);

// POST /api/students - Create new student
router.post('/', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER, UserRole.SPECIAL_EDUCATOR),
  ValidationRules.createStudent(),
  studentController.createStudent.bind(studentController)
);

// GET /api/students - Get students with pagination and filters
router.get('/', 
  ValidationRules.validatePagination(),
  studentController.getStudents.bind(studentController)
);

// GET /api/students/stats - Get student statistics
router.get('/stats', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR, UserRole.CENTER),
  studentController.getStudentStats.bind(studentController)
);

// GET /api/students/:id - Get student by ID
router.get('/:id', 
  ValidationRules.validateId(),
  studentController.getStudentById.bind(studentController)
);

// PUT /api/students/:id - Update student
router.put('/:id', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER, UserRole.SPECIAL_EDUCATOR),
  ValidationRules.updateStudent(),
  studentController.updateStudent.bind(studentController)
);

// DELETE /api/students/:id - Delete student
router.delete('/:id', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER),
  ValidationRules.validateId(),
  studentController.deleteStudent.bind(studentController)
);

// PUT /api/students/:id/status - Update student status
router.put('/:id/status', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER, UserRole.SPECIAL_EDUCATOR),
  ValidationRules.validateId(),
  studentController.updateStudentStatus.bind(studentController)
);

// POST /api/students/:id/assign - Assign student to special educator
router.post('/:id/assign', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER, UserRole.SUPER_SPECIAL_EDUCATOR),
  ValidationRules.validateId(),
  studentController.assignStudentToEducator.bind(studentController)
);

// POST /api/students/:id/unassign - Unassign student from special educator
router.post('/:id/unassign', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER, UserRole.SUPER_SPECIAL_EDUCATOR),
  ValidationRules.validateId(),
  studentController.unassignStudentFromEducator.bind(studentController)
);

// GET /api/students/:id/dashboard - Get student dashboard data
router.get('/:id/dashboard', 
  ValidationRules.validateId(),
  studentController.getStudentDashboard.bind(studentController)
);

// GET /api/students/:id/progress - Get student progress data
router.get('/:id/progress', 
  ValidationRules.validateId(),
  studentController.getStudentProgress.bind(studentController)
);

// POST /api/students/bulk-assign - Bulk assign students to educator
router.post('/bulk-assign', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER, UserRole.SUPER_SPECIAL_EDUCATOR),
  studentController.bulkAssignStudents.bind(studentController)
);

// POST /api/students/bulk-status - Bulk update student status
router.post('/bulk-status', 
  AuthUtils.requireAnyRole(UserRole.ADMIN, UserRole.CENTER),
  studentController.bulkUpdateStudentStatus.bind(studentController)
);

export default router;
