import { Request, Response } from 'express';

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: any;
}
import { PrismaClient } from '@prisma/client';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { LessonPlanRepository } from '../repositories/LessonPlanRepository';
import { IEPRepository } from '../repositories/IepRepository';
import { SkillAssessmentRepository } from '../repositories/SkillAssessmentRepository';
import { AIReportService } from '../services/AIReportService';

const prisma = new PrismaClient();
const assessmentRepo = new AssessmentRepository(prisma);
const lessonPlanRepo = new LessonPlanRepository(prisma);
const iepRepo = new IEPRepository(prisma);
const skillAssessmentRepo = new SkillAssessmentRepository(prisma);
const aiReportService = new AIReportService(assessmentRepo, lessonPlanRepo, iepRepo, skillAssessmentRepo);

export class AIReportController {
  static async generateAIReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      // Extract userId from authenticated user
      const user = req.user;
      const userId = user?.profileId || user?.id;

      console.log('Generate AI Report - User:', user);
      console.log('Generate AI Report - User ID:', userId);

      if (!userId) {
        console.error('No user ID found in request');
        return res.status(401).json({ error: 'Educator authentication required' });
      }

      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }

      // Fetch the actual SpecialEducatorProfile ID from the user
      const educator = await prisma.specialEducatorProfile.findFirst({
        where: { userId }
      });

      if (!educator) {
        console.error('No special educator profile found for user:', userId);
        return res.status(403).json({ error: 'Special educator profile not found' });
      }

      const specialEducatorId = educator.id;
      console.log('Special Educator ID:', specialEducatorId);

      // Generate comprehensive AI report
      const aiReport = await aiReportService.generateComprehensiveReport(studentId, specialEducatorId);

      // Save the generated report to database
      const savedReport = await assessmentRepo.createReport(specialEducatorId, aiReport);

      res.status(201).json({
        success: true,
        message: 'AI report generated successfully',
        report: savedReport
      });

    } catch (error) {
      console.error('AI Report Controller Error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to generate AI report'
      });
    }
  }

  static async previewAIReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      // Extract userId from authenticated user
      const user = req.user;
      const userId = user?.profileId || user?.id;

      console.log('Preview AI Report - User:', user);
      console.log('Preview AI Report - User ID:', userId);

      if (!userId) {
        console.error('No user ID found in request');
        return res.status(401).json({ error: 'Educator authentication required' });
      }

      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }

      // Fetch the actual SpecialEducatorProfile ID from the user
      const educator = await prisma.specialEducatorProfile.findFirst({
        where: { userId }
      });

      if (!educator) {
        console.error('No special educator profile found for user:', userId);
        return res.status(403).json({ error: 'Special educator profile not found' });
      }

      const specialEducatorId = educator.id;
      console.log('Special Educator ID:', specialEducatorId);

      // Generate report without saving to database
      const aiReport = await aiReportService.generateComprehensiveReport(studentId, specialEducatorId);

      res.status(200).json({
        success: true,
        report: aiReport
      });

    } catch (error) {
      console.error('AI Report Preview Error:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message || 'Failed to preview AI report'
      });
    }
  }
}