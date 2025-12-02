import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminController } from '../controllers/AdminController';
import { AuthUtils } from '../utils/auth';
import { UserRole } from '../models';

const router = Router();
const prisma = new PrismaClient();
const adminController = new AdminController(prisma);

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

// Dashboard routes
router.get('/dashboard/overview', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getDashboardOverview.bind(adminController)
);

// User management routes
router.get('/users', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getAllUsers.bind(adminController)
);
router.post('/users', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.createUser.bind(adminController)
);
router.put('/users/:userId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.updateUser.bind(adminController)
);
router.delete('/users/:userId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.deleteUser.bind(adminController)
);
router.patch('/users/:userId/activate', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.activateUser.bind(adminController)
);
router.patch('/users/:userId/deactivate', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.deactivateUser.bind(adminController)
);

// Center management routes
router.get('/centers', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getAllCenters.bind(adminController)
);
router.post('/centers', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.createCenter.bind(adminController)
);
router.put('/centers/:centerId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.updateCenter.bind(adminController)
);
router.delete('/centers/:centerId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.deleteCenter.bind(adminController)
);

// School management routes
router.get('/schools', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getAllSchools.bind(adminController)
);
router.post('/schools', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.createSchool.bind(adminController)
);
router.put('/schools/:schoolId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.updateSchool.bind(adminController)
);
router.delete('/schools/:schoolId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.deleteSchool.bind(adminController)
);

// Role assignment routes
router.post('/assignments/educator-to-center', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.assignEducatorToCenter.bind(adminController)
);
router.delete('/assignments/educator-to-center/:assignmentId', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER]),
  adminController.removeEducatorFromCenter.bind(adminController)
);
// Student-to-educator assignment - allow both ADMIN and CENTER roles
router.post('/assignments/student-to-educator', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER]),
  adminController.assignStudentToEducator.bind(adminController)
);

// Approval system routes
router.get('/approvals', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getPendingApprovals.bind(adminController)
);
router.patch('/approvals/:requestId/approve', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.approveRequest.bind(adminController)
);
router.patch('/approvals/:requestId/reject', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.rejectRequest.bind(adminController)
);

// Student management routes
router.get('/students', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getAllStudents.bind(adminController)
);
router.get('/students/:studentId', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  adminController.getStudentDetails.bind(adminController)
);

// Reports and analytics routes
router.get('/reports', adminController.getAllReports.bind(adminController));
router.get('/analytics', adminController.getSystemAnalytics.bind(adminController));

// Audit logs routes
router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

// Global search routes
router.get('/search', adminController.globalSearch.bind(adminController));

// System configuration routes
router.get('/config', adminController.getSystemConfig.bind(adminController));
router.put('/config', adminController.updateSystemConfig.bind(adminController));

// Data export routes
router.post('/export', adminController.exportData.bind(adminController));

export default router;
