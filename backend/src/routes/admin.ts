import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminController } from '../controllers/AdminController';
import { AuthUtils } from '../utils/auth';
import { UserRole } from '../models';

const router = Router();
const prisma = new PrismaClient();
const adminController = new AdminController(prisma);

// Apply authentication and admin role check to all routes
router.use(AuthUtils.authenticateToken);
router.use(AuthUtils.requireRole([UserRole.ADMIN]));

// Dashboard routes
router.get('/dashboard/overview', adminController.getDashboardOverview.bind(adminController));

// User management routes
router.get('/users', adminController.getAllUsers.bind(adminController));
router.post('/users', adminController.createUser.bind(adminController));
router.put('/users/:userId', adminController.updateUser.bind(adminController));
router.delete('/users/:userId', adminController.deleteUser.bind(adminController));
router.patch('/users/:userId/activate', adminController.activateUser.bind(adminController));
router.patch('/users/:userId/deactivate', adminController.deactivateUser.bind(adminController));

// Center management routes
router.get('/centers', adminController.getAllCenters.bind(adminController));
router.post('/centers', adminController.createCenter.bind(adminController));
router.put('/centers/:centerId', adminController.updateCenter.bind(adminController));
router.delete('/centers/:centerId', adminController.deleteCenter.bind(adminController));

// School management routes
router.get('/schools', adminController.getAllSchools.bind(adminController));
router.post('/schools', adminController.createSchool.bind(adminController));
router.put('/schools/:schoolId', adminController.updateSchool.bind(adminController));
router.delete('/schools/:schoolId', adminController.deleteSchool.bind(adminController));

// Role assignment routes
router.post('/assignments/educator-to-center', adminController.assignEducatorToCenter.bind(adminController));
router.delete('/assignments/educator-to-center/:assignmentId', adminController.removeEducatorFromCenter.bind(adminController));
router.post('/assignments/student-to-educator', adminController.assignStudentToEducator.bind(adminController));

// Approval system routes
router.get('/approvals', adminController.getPendingApprovals.bind(adminController));
router.patch('/approvals/:requestId/approve', adminController.approveRequest.bind(adminController));
router.patch('/approvals/:requestId/reject', adminController.rejectRequest.bind(adminController));

// Student management routes
router.get('/students', adminController.getAllStudents.bind(adminController));
router.get('/students/:studentId', adminController.getStudentDetails.bind(adminController));

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
