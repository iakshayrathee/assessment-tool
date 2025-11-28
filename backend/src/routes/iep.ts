import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { IEPController } from '../controllers/IEPController';
import { AuthUtils } from '../utils/auth';
import { attachProfileId } from '../middleware/profileMiddleware';

const router = Router();
const prisma = new PrismaClient();
const iepController = new IEPController(prisma);

// Apply authentication middleware to all routes
router.use(AuthUtils.authenticateToken);

// Apply profile middleware to attach profile ID
router.use(attachProfileId);

// Helper function to verify JWT token
const verifyToken = (token: string) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.verify(token, JWT_SECRET) as any;
};

// Helper function for auth check
const requireAuth = (req: Request) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Access token required');
  }
  
  try {
    return verifyToken(token);
  } catch {
    throw new Error('Invalid or expired token');
  }
};

// Helper function for educator role check
const requireEducatorRoles = (decoded: any) => {
  const educatorRoles = [UserRole.SPECIAL_EDUCATOR, UserRole.SUPER_SPECIAL_EDUCATOR];
  if (!educatorRoles.includes(decoded.role)) {
    throw new Error('Insufficient permissions');
  }
};

// Helper function for admin/super educator role check
const requireAdminOrSuperEducator = (decoded: any) => {
  if (![UserRole.ADMIN, UserRole.SUPER_SPECIAL_EDUCATOR].includes(decoded.role)) {
    throw new Error('Insufficient permissions');
  }
};

// Create IEP document
router.post('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.createIEPDocument(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Get IEP document by ID
router.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    await iepController.getIEPDocument(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Get IEP documents by student
router.get('/students/:studentId/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    await iepController.getIEPDocumentsByStudent(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Get IEP documents by educator
router.get('/educators/:educatorId/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    await iepController.getIEPDocumentsByEducator(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Update IEP document
router.put('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.updateIEPDocument(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Delete IEP document
router.delete('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.deleteIEPDocument(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Add subject section to IEP document
router.post('/documents/:iepDocumentId/subject-sections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.addSubjectSection(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Add long-term goal to subject section
router.post('/subject-sections/:subjectSectionId/long-term-goals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.addLongTermGoal(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Add short-term goal to subject section
router.post('/subject-sections/:subjectSectionId/short-term-goals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.addShortTermGoal(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Add weekly evaluation to IEP document
router.post('/documents/:iepDocumentId/weekly-evaluations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.addWeeklyEvaluation(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Add activity to weekly evaluation
router.post('/weekly-evaluations/:weeklyEvaluationId/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    await iepController.addWeeklyActivity(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Get weekly evaluation by ID
router.get('/weekly-evaluations/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    await iepController.getWeeklyEvaluation(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// Get subject section by ID
router.get('/subject-sections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    await iepController.getSubjectSection(req, res);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

export default router;