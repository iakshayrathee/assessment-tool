import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ParentController } from '../controllers/ParentController';
import { AuthUtils } from '../utils/auth';
import { ValidationRules } from '../utils/validation';
import { UserRole } from '../models';

const router = Router();
const prisma = new PrismaClient();
const parentController = new ParentController(prisma);

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

// GET /api/parents/dashboard - Get parent dashboard data
router.get('/dashboard', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  parentController.getParentDashboard.bind(parentController)
);

// POST /api/parents/concerns - Submit parent concern
router.post('/concerns', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.createParentConcern(),
  parentController.submitConcern.bind(parentController)
);

// GET /api/parents/concerns - Get parent concerns
router.get('/concerns', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.validatePagination(),
  parentController.getConcerns.bind(parentController)
);

// POST /api/parents/documents - Upload parent document
router.post('/documents', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.uploadDocument(),
  parentController.uploadDocument.bind(parentController)
);

// GET /api/parents/documents - Get parent documents
router.get('/documents', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.validatePagination(),
  parentController.getDocuments.bind(parentController)
);

// GET /api/parents/children/:childId/reports - Get child reports
router.get('/children/:childId/reports', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.validateId(),
  parentController.getChildReports.bind(parentController)
);

// GET /api/parents/children/:childId/iep-goals - Get child IEP goals
router.get('/children/:childId/iep-goals', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.validateId(),
  parentController.getChildIEPGoals.bind(parentController)
);

// PUT /api/parents/profile - Update parent profile
router.put('/profile', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.updateParentProfile(),
  parentController.updateProfile.bind(parentController)
);

// GET /api/parents/children/:childId - Get child details
router.get('/children/:childId', 
  AuthUtils.requireAnyRole(UserRole.PARENT),
  ValidationRules.validateId(),
  parentController.getChildDetails.bind(parentController)
);

export default router;
