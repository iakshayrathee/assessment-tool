import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { UserRole } from '../models';
import { AIReportController } from '../controllers/AIReportController';
import { attachProfileId } from '../middleware/profileMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);
// Resolve User.id → role-specific profile ID (e.g. SpecialEducatorProfile.id)
router.use(attachProfileId);

// GET /api/reports - Get reports by student ID (query param)
router.get('/', async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    const reports = await prisma.report.findMany({
      where: { studentId: studentId as string },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

// GET /api/reports/educator - Get report coverage summary for all students
// assigned to the authenticated special educator.
router.get('/educator', async (req: any, res) => {
  try {
    const educatorId = req.user?.profileId;
    if (!educatorId) {
      return res.status(401).json({ success: false, error: 'Educator profile not found' });
    }

    const assignments = await prisma.studentAssignment.findMany({
      where: { specialEducatorId: educatorId, isActive: true },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            reports: {
              where: { type: { in: ['ASSESSMENT', 'LESSON_PLAN'] } },
              select: { id: true, type: true, status: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    const roster = assignments.map(({ student }) => {
      const reports = student.reports;
      const latestReport = reports[0];
      return {
        studentId: student.id,
        studentName: student.fullName,
        grade: student.grade,
        reportCount: reports.length,
        latestReportAt: latestReport?.createdAt || null,
        latestReportType: latestReport?.type || null,
        hasAssessmentReport: reports.some((r) => r.type === 'ASSESSMENT'),
        hasLessonPlanReport: reports.some((r) => r.type === 'LESSON_PLAN'),
        pendingCount: reports.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length,
        completedCount: reports.filter((r) => r.status === 'COMPLETED').length,
        reviewedCount: reports.filter((r) => r.status === 'REVIEWED').length,
      };
    });

    res.json({ success: true, data: roster });
  } catch (error) {
    console.error('Get educator report roster error:', error);
    res.status(500).json({ success: false, error: 'Failed to get educator report roster' });
  }
});

// GET /api/reports/:id - Get report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            grade: true,
            age: true,
            dateOfBirth: true,
            school: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        specialEducator: {
          select: {
            id: true,
            fullName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        superSpecialEducator: {
          select: {
            id: true,
            fullName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report'
    });
  }
});

// PUT /api/reports/:id - Update report content/title/summary
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, type } = req.body;

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    if (existing.status === 'REVIEWED') {
      return res.status(400).json({ success: false, error: 'Cannot update a reviewed report' });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(type !== undefined && { type }),
        updatedAt: new Date(),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ success: false, error: 'Failed to update report' });
  }
});

// GET /api/reports/:id/download - DEPRECATED: returns a placeholder response.
// PDF generation is handled client-side via html2pdf.js in the frontend.
// Do not add consumers of this endpoint.
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            fullName: true,
            grade: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // For now, return a mock PDF response
    // In a real implementation, you would generate a PDF using libraries like puppeteer or pdfkit
    const mockPdfContent = `Mock PDF content for ${report.type} report for ${report.student.fullName}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.type}_${report.student.fullName}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(Buffer.from(mockPdfContent));
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report'
    });
  }
});

// POST /api/reports/ai/generate/:studentId - Generate AI-powered comprehensive report
router.post('/ai/generate/:studentId', AuthUtils.requireRole([UserRole.SPECIAL_EDUCATOR, UserRole.SUPER_SPECIAL_EDUCATOR]), AIReportController.generateAIReport);

// GET /api/reports/ai/preview/:studentId - Preview AI report without saving
router.get('/ai/preview/:studentId', AuthUtils.requireRole([UserRole.SPECIAL_EDUCATOR, UserRole.SUPER_SPECIAL_EDUCATOR]), AIReportController.previewAIReport);

export default router;
