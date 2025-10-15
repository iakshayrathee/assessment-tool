import { Router } from 'express';
import { body } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { SchoolController } from '../controllers/SchoolController';
import { UserRole } from '../models';

const router = Router();
const prisma = new PrismaClient();
const schoolController = new SchoolController(prisma);

// Validation middleware
const validateSchoolUpdate = [
  body('name').optional().isString().isLength({ min: 1 }).withMessage('School name must be a non-empty string'),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('principalName').optional().isString()
];

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

// GET /api/schools - Get all schools with pagination and filtering
router.get('/', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER, UserRole.SUPER_SPECIAL_EDUCATOR]),
  schoolController.getSchools.bind(schoolController)
);

// GET /api/schools/:id - Get school by ID
router.get('/:id', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER, UserRole.SUPER_SPECIAL_EDUCATOR, UserRole.SCHOOL_VIEWER]),
  schoolController.getSchoolById.bind(schoolController)
);

// PUT /api/schools/:id - Update school
router.put('/:id', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER]),
  validateSchoolUpdate,
  schoolController.updateSchool.bind(schoolController)
);

// DELETE /api/schools/:id - Delete school
router.delete('/:id', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER]),
  schoolController.deleteSchool.bind(schoolController)
);

// GET /api/schools/:id/students - Get school students
router.get('/:id/students', 
  AuthUtils.requireRole([UserRole.ADMIN, UserRole.CENTER, UserRole.SUPER_SPECIAL_EDUCATOR, UserRole.SCHOOL_VIEWER]),
  schoolController.getSchoolStudents.bind(schoolController)
);

// PATCH /api/schools/:id/activate - Activate school
router.patch('/:id/activate', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  schoolController.activateSchool.bind(schoolController)
);

// PATCH /api/schools/:id/deactivate - Deactivate school
router.patch('/:id/deactivate', 
  AuthUtils.requireRole([UserRole.ADMIN]),
  schoolController.deactivateSchool.bind(schoolController)
);

export default router;
