import { Request, Response } from 'express';

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: any;
}
import { PrismaClient } from '@prisma/client';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import aiBackendProxy from '../services/aiBackendProxy';

const prisma = new PrismaClient();
const assessmentRepo = new AssessmentRepository(prisma);

export class AIReportController {
  static async generateAIReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { studentId } = req.params;
      const { reportType } = req.body; // 'ASSESSMENT' or 'LESSON_PLAN'

      const user = req.user;

      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }

      // Validate report type
      const validReportTypes = ['ASSESSMENT', 'LESSON_PLAN'];
      const selectedReportType = reportType && validReportTypes.includes(reportType) ? reportType : 'ASSESSMENT';

      // Resolve specialEducatorId: attachProfileId middleware sets req.user.profileId to
      // SpecialEducatorProfile.id. Fall back to a userId-based lookup for legacy tokens.
      let specialEducatorId: string | undefined = user?.profileId;
      if (!specialEducatorId) {
        const userId = user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Educator authentication required' });
        }
        const educator = await prisma.specialEducatorProfile.findFirst({ where: { userId } });
        if (!educator) {
          console.error('No special educator profile found for user:', userId);
          return res.status(403).json({ error: 'Special educator profile not found' });
        }
        specialEducatorId = educator.id;
      }

      console.log('Generating AI report via Python agent — type:', selectedReportType, 'educator:', specialEducatorId);

      // Invoke the Python AI backend report agent
      const aiResponse = await aiBackendProxy.generateReport(selectedReportType, studentId, specialEducatorId);
      const finalReport = aiResponse.final_report || {};

      // Map agent output to DB Report shape
      const reportData = {
        studentId,
        type: (finalReport.type || selectedReportType) as any,
        title: finalReport.title || `${selectedReportType} Report`,
        content: finalReport.content || '',
        summary: finalReport.summary || null,
        recommendations: finalReport.recommendations || null,
      };

      const savedReport = await assessmentRepo.createReport(specialEducatorId, reportData);

      res.status(201).json({
        success: true,
        message: 'AI report generated successfully',
        report: savedReport,
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
      const { reportType } = req.query; // 'ASSESSMENT' or 'LESSON_PLAN'

      const user = req.user;

      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }

      // Validate report type
      const validReportTypes = ['ASSESSMENT', 'LESSON_PLAN'];
      const selectedReportType = reportType && validReportTypes.includes(reportType as string) ? reportType as 'ASSESSMENT' | 'LESSON_PLAN' : 'ASSESSMENT';

      // Resolve specialEducatorId (same pattern as generateAIReport)
      let specialEducatorId: string | undefined = user?.profileId;
      if (!specialEducatorId) {
        const userId = user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Educator authentication required' });
        }
        const educator = await prisma.specialEducatorProfile.findFirst({ where: { userId } });
        if (!educator) {
          return res.status(403).json({ error: 'Special educator profile not found' });
        }
        specialEducatorId = educator.id;
      }

      // Invoke the Python AI backend report agent (preview — no DB save)
      const aiResponse = await aiBackendProxy.generateReport(selectedReportType, studentId, specialEducatorId);

      res.status(200).json({
        success: true,
        report: aiResponse.final_report || aiResponse,
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