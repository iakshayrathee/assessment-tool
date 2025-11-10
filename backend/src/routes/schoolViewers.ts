import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { SchoolViewerController } from '../controllers/SchoolViewerController';
import { UserRole } from '../models';

const router = Router();
const prisma = new PrismaClient();
const schoolViewerController = new SchoolViewerController(prisma);

// Validation middleware
const validateProfileUpdate = [
  body('fullName').optional().isString().isLength({ min: 1 }).withMessage('Full name must be a non-empty string'),
  body('position').optional().isString(),
  body('phone').optional().isString()
];

const validateStudentQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED']).withMessage('Invalid status'),
  query('grade').optional().isString()
];

const validateReportQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['INTAKE', 'ASSESSMENT', 'IEP', 'PROGRESS']).withMessage('Invalid report type'),
  query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED']).withMessage('Invalid status'),
  query('studentId').optional().isString()
];

const validateId = [
  param('id').isString().isLength({ min: 1 }).withMessage('ID is required')
];

// Apply authentication and role check to all routes
router.use(AuthUtils.authenticateToken);
router.use(AuthUtils.requireRole([UserRole.SCHOOL_VIEWER]));

// Profile routes
router.get('/profile', 
  schoolViewerController.getProfile.bind(schoolViewerController)
);

router.put('/profile', 
  validateProfileUpdate,
  schoolViewerController.updateProfile.bind(schoolViewerController)
);

// Dashboard route
router.get('/dashboard', 
  schoolViewerController.getDashboard.bind(schoolViewerController)
);

// Student routes
router.get('/students', 
  validateStudentQuery,
  schoolViewerController.getStudents.bind(schoolViewerController)
);

router.get('/students/:id', 
  validateId,
  schoolViewerController.getStudentDetails.bind(schoolViewerController)
);

// Report routes
router.get('/reports', 
  validateReportQuery,
  schoolViewerController.getReports.bind(schoolViewerController)
);

router.get('/reports/:id', 
  validateId,
  schoolViewerController.getReportDetails.bind(schoolViewerController)
);

// Activity timeline route
router.get('/activity', 
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  schoolViewerController.getActivityTimeline.bind(schoolViewerController)
);

export default router;
