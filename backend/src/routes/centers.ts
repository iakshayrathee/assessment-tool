import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CenterController } from '../controllers/CenterController';
import { AuthUtils } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();
const centerController = new CenterController(prisma);

// Apply authentication middleware to all routes
router.use(AuthUtils.authenticateToken);

// Center CRUD routes
router.get('/', centerController.getCenters.bind(centerController));
router.get('/dashboard', centerController.getCenterDashboard.bind(centerController));
router.get('/available-educators', centerController.getAvailableEducators.bind(centerController));
router.get('/:id', centerController.getCenterById.bind(centerController));
router.post('/', centerController.createCenter.bind(centerController));
router.put('/:id', centerController.updateCenter.bind(centerController));

// Center-specific management routes
router.post('/:id/schools', centerController.linkSchool.bind(centerController));
router.post('/:id/assign-educator', centerController.assignEducator.bind(centerController));
router.get('/:id/students', centerController.getCenterStudents.bind(centerController));
router.get('/:id/schools', centerController.getCenterSchools.bind(centerController));
router.get('/:id/educators', centerController.getCenterEducators.bind(centerController));
router.delete('/:id/assignments/:assignmentId', centerController.removeEducatorAssignment.bind(centerController));
router.get('/:id/reports', centerController.getCenterReports.bind(centerController));
router.get('/:id/compliance', centerController.getCenterCompliance.bind(centerController));
router.get('/:id/overdue-reports', centerController.getCenterOverdueReports.bind(centerController));

export default router;
