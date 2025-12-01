import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { attachProfileId } from '../middleware/profileMiddleware';
import { NewAssessmentController } from '../controllers/NewAssessmentController';

const router = Router();
const prisma = new PrismaClient();
const controller = new NewAssessmentController(prisma);

// Apply authentication middleware
router.use(AuthUtils.authenticateToken);
router.use(attachProfileId);

// Formal Assessments
router.post('/formal', controller.createFormalAssessment);
router.get('/formal/:id', controller.getFormalAssessment);
router.get('/formal/student/:studentId', controller.getFormalAssessmentsByStudent);
router.get('/formal/educator/me', controller.getFormalAssessmentsByEducator);
router.put('/formal/:id', controller.updateFormalAssessment);
router.put('/formal/:id/complete', controller.completeFormalAssessment);
router.delete('/formal/:id', controller.deleteFormalAssessment);

// Reading Skill Assessments
router.post('/skill/reading', controller.createReadingAssessment);
router.get('/skill/reading/:id', controller.getReadingAssessment);
router.get('/skill/reading/student/:studentId', controller.getReadingAssessmentsByStudent);
router.put('/skill/reading/:id', controller.updateReadingAssessment);
router.put('/skill/reading/:id/complete', controller.completeReadingAssessment);

// Writing Skill Assessments
router.post('/skill/writing', controller.createWritingAssessment);
router.get('/skill/writing/:id', controller.getWritingAssessment);
router.get('/skill/writing/student/:studentId', controller.getWritingAssessmentsByStudent);
router.put('/skill/writing/:id', controller.updateWritingAssessment);
router.put('/skill/writing/:id/complete', controller.completeWritingAssessment);

// Math Skill Assessments
router.post('/skill/math', controller.createMathAssessment);
router.get('/skill/math/:id', controller.getMathAssessment);
router.get('/skill/math/student/:studentId', controller.getMathAssessmentsByStudent);
router.put('/skill/math/:id', controller.updateMathAssessment);
router.put('/skill/math/:id/complete', controller.completeMathAssessment);

// Intake Forms
router.post('/intake', controller.createIntakeForm);
router.get('/intake/:id', controller.getIntakeFormById);
router.get('/intake/student/:studentId', controller.getIntakeFormByStudent);
router.put('/intake/:id', controller.updateIntakeForm);
router.put('/intake/:id/complete', controller.completeIntakeForm);

export default router;

