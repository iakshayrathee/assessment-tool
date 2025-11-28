import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../utils/auth';
import { UserRole } from '../models';
import { AIReportController } from '../controllers/AIReportController';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);

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

    // Add mock data for different report types
    let reportData: any = { ...report };

    if (report.type === 'ASSESSMENT') {
      reportData.assessmentData = {
        domains: [
          { name: 'Reading', score: 75, maxScore: 100, percentage: 75 },
          { name: 'Writing', score: 68, maxScore: 100, percentage: 68 },
          { name: 'Math', score: 82, maxScore: 100, percentage: 82 },
          { name: 'Visual Perception', score: 70, maxScore: 100, percentage: 70 },
          { name: 'Motor Skills', score: 85, maxScore: 100, percentage: 85 },
          { name: 'Attention', score: 65, maxScore: 100, percentage: 65 }
        ],
        overallScore: 74,
        recommendations: [
          'Focus on reading comprehension exercises',
          'Implement visual learning aids',
          'Provide structured attention training'
        ]
      };
    } else if (report.type === 'IEP') {
      reportData.iepData = {
        goals: [
          {
            id: '1',
            goal: 'Improve reading fluency by 20 words per minute',
            progressPercent: 65,
            status: 'IN_PROGRESS',
            targetDate: '2024-06-30'
          },
          {
            id: '2',
            goal: 'Complete math problems with 80% accuracy',
            progressPercent: 45,
            status: 'IN_PROGRESS',
            targetDate: '2024-07-15'
          }
        ],
        accommodations: [
          'Extended time for tests',
          'Preferential seating',
          'Use of assistive technology'
        ],
        modifications: [
          'Reduced homework assignments',
          'Alternative assessment methods',
          'Simplified instructions'
        ]
      };
    } else if (report.type === 'PROGRESS') {
      reportData.progressData = {
        period: 'Q2 2024',
        achievements: [
          'Improved reading comprehension by 15%',
          'Successfully completed all math assignments',
          'Demonstrated better attention span in class'
        ],
        challenges: [
          'Still struggles with complex word problems',
          'Needs more support with writing tasks'
        ],
        nextSteps: [
          'Continue reading intervention program',
          'Implement additional math support',
          'Schedule parent conference'
        ],
        parentFeedback: 'We have noticed significant improvement in homework completion and overall confidence.'
      };
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report'
    });
  }
});

// GET /api/reports/:id/download - Download report as PDF
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
