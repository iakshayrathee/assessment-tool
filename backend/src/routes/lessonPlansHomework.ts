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

// ========== LONG-TERM PLANS ==========
router.post('/long-term', controller.createLongTermPlan);
router.get('/long-term/:id', controller.getLongTermPlan);
router.get('/long-term/:id/hierarchy', controller.getLongTermPlanWithHierarchy);
router.get('/long-term/student/:studentId', controller.getLongTermPlansByStudent);
router.get('/long-term/educator/me', controller.getLongTermPlansByEducator);
router.put('/long-term/:id', controller.updateLongTermPlan);
router.delete('/long-term/:id', controller.deleteLongTermPlan);

// ========== SHORT-TERM PLANS ==========
router.post('/short-term', controller.createShortTermPlan);
router.get('/short-term/:id', controller.getShortTermPlan);
router.get('/short-term/:id/with-weekly', controller.getShortTermPlanWithWeeklyPlans);
router.get('/short-term/long-term/:ltpId', controller.getShortTermPlansByLongTermPlan);
router.get('/short-term/student/:studentId', controller.getShortTermPlansByStudent);
router.get('/short-term/educator/me', controller.getShortTermPlansByEducator);
router.put('/short-term/:id', controller.updateShortTermPlan);
router.put('/short-term/:id/progress', controller.updateShortTermPlanProgress);
router.delete('/short-term/:id', controller.deleteShortTermPlan);

// ========== WEEKLY LESSON PLANS ==========
router.post('/weekly', controller.createWeeklyLessonPlan);
router.get('/weekly/:id', controller.getWeeklyLessonPlan);
router.get('/weekly/short-term/:stpId', controller.getWeeklyLessonPlansByShortTermPlan);
router.get('/weekly/student/:studentId', controller.getWeeklyLessonPlansByStudent);
router.get('/weekly/educator/me', controller.getWeeklyLessonPlansByEducator);
router.put('/weekly/:id', controller.updateWeeklyLessonPlan);
router.put('/weekly/:id/complete', controller.completeWeeklyLessonPlan);
router.delete('/weekly/:id', controller.deleteWeeklyLessonPlan);

// ========== HOMEWORK ==========
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

// Homework File Management
import { upload, handleMulterError } from '../middleware/upload';
router.post('/homework/:id/upload', upload.array('files', 5), handleMulterError, controller.uploadHomeworkFiles);
router.get('/homework/:id/files', controller.getHomeworkFiles);
router.delete('/homework/:id/files/:fileKey', controller.deleteHomeworkFile);

// Learning Materials
router.post('/materials', controller.createLearningMaterial);
router.get('/materials/:id', controller.getLearningMaterial);
router.get('/materials', controller.getAllLearningMaterials);
router.get('/materials/:subject/:grade', controller.getLearningMaterialsBySubjectAndGrade);
router.put('/materials/:id', controller.updateLearningMaterial);
router.delete('/materials/:id', controller.deleteLearningMaterial);

export default router;

