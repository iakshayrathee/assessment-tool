import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { attachProfileId } from '../middleware/profileMiddleware';
import { LessonPlanHomeworkController } from '../controllers/LessonPlanHomeworkController';

const router = Router();
const prisma = new PrismaClient();
const controller = new LessonPlanHomeworkController(prisma);

// Apply authentication middleware
router.use(AuthUtils.authenticateToken);
router.use(attachProfileId);

// Lesson Plans
router.post('/lesson-plans', controller.createLessonPlan);
router.get('/lesson-plans/:id', controller.getLessonPlan);
router.get('/lesson-plans/student/:studentId', controller.getLessonPlansByStudent);
router.get('/lesson-plans/educator/me', controller.getLessonPlansByEducator);
router.put('/lesson-plans/:id', controller.updateLessonPlan);
router.delete('/lesson-plans/:id', controller.deleteLessonPlan);

// Homework
router.post('/homework', controller.createHomework);
router.get('/homework/:id', controller.getHomework);
router.get('/homework/student/:studentId', controller.getHomeworkByStudent);
router.get('/homework/parent/me', controller.getHomeworkByParent);
router.get('/homework/educator/me', controller.getHomeworkByEducator);
router.put('/homework/:id', controller.updateHomework);
router.put('/homework/:id/submit', controller.submitHomework);
router.put('/homework/:id/review', controller.reviewHomework);
router.put('/homework/:id/complete', controller.completeHomework);
router.delete('/homework/:id', controller.deleteHomework);

// Learning Materials
router.post('/materials', controller.createLearningMaterial);
router.get('/materials/:id', controller.getLearningMaterial);
router.get('/materials', controller.getAllLearningMaterials);
router.get('/materials/:subject/:grade', controller.getLearningMaterialsBySubjectAndGrade);
router.put('/materials/:id', controller.updateLearningMaterial);
router.delete('/materials/:id', controller.deleteLearningMaterial);

export default router;

