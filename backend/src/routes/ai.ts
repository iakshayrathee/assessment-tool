/**
 * AI Agent Routes
 * 
 * Exposes all AI agent capabilities through REST endpoints.
 * These endpoints proxy to the Python AI backend via aiBackendProxy.
 * All responses are AI_DRAFT — editable by the educator before finalizing.
 */

import { Router, Request, Response } from 'express';
import { AuthUtils, AuthenticatedRequest } from '../utils/auth';
import aiBackendProxy from '../services/aiBackendProxy';
import { attachProfileId } from '../middleware/profileMiddleware';

const router = Router();

// Apply authentication to all routes
router.use(AuthUtils.authenticateToken);
// Resolve User.id → role-specific profile ID (e.g. SpecialEducatorProfile.id)
router.use(attachProfileId);

// ── Assessment Intelligence Agent ────────────────────────────────────────────

/**
 * GET /api/ai/assessment/:studentId
 * Analyze a student's assessments — returns symptom analysis, severity scores,
 * domain profile, risk classification, differential indicators, and recommendations.
 */
router.get('/assessment/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const assessmentType = (req.query.type as string) || 'ALL';

    const result = await aiBackendProxy.analyzeAssessment(studentId, assessmentType);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Assessment analysis error:', error.message);
    res.status(error.message?.includes('Connection refused') ? 503 : 500).json({
      success: false,
      error: error.message || 'AI assessment analysis failed',
      aiUnavailable: error.message?.includes('Connection refused'),
    });
  }
});

// ── IEP & Goal Planning Agent ────────────────────────────────────────────────

/**
 * POST /api/ai/iep/:studentId
 * Generate AI-suggested IEP goals, LTP, STPs, and WLPs.
 * Optionally accepts assessment_analysis in the body for better results.
 */
router.post('/iep/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { assessment_analysis } = req.body || {};

    const result = await aiBackendProxy.generateIEP(studentId, assessment_analysis);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI IEP generation error:', error.message);
    res.status(error.message?.includes('Connection refused') ? 503 : 500).json({
      success: false,
      error: error.message || 'AI IEP generation failed',
      aiUnavailable: error.message?.includes('Connection refused'),
    });
  }
});

/**
 * POST /api/ai/iep/:studentId/save
 * Save an AI-generated plan (LTP + STPs + WLPs) to the database as DRAFT records.
 * This bridges the AI output to the lesson-plans-new page.
 */
router.post('/iep/:studentId/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const educatorId = (req as any).user?.profileId || (req as any).user?.id;
    const { generated_ltp, generated_stps = [], generated_wlps = [] } = req.body || {};

    if (!generated_ltp) {
      return res.status(400).json({ success: false, error: 'generated_ltp is required' });
    }
    if (!educatorId) {
      return res.status(401).json({ success: false, error: 'Educator ID not found in auth context' });
    }

    // Dynamically import services (avoids circular deps at top of file)
    const { PrismaClient } = await import('@prisma/client');
    const { LongTermPlanService } = await import('../services/LongTermPlanService');
    const { ShortTermPlanService } = await import('../services/ShortTermPlanService');
    const { WeeklyLessonPlanService } = await import('../services/WeeklyLessonPlanService');

    const prisma = new PrismaClient();
    const ltpService = new LongTermPlanService(prisma);
    const stpService = new ShortTermPlanService(prisma);
    const wlpService = new WeeklyLessonPlanService(prisma);

    // Build the LTP payload — map AI field names to Prisma field names
    const ltp = generated_ltp;
    const today = new Date();
    const durationMonths = ltp.duration_months || 6;
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const ltpPayload = {
      studentId,
      specialEducatorId: educatorId,
      diagnosis: ltp.diagnosis || null,
      learningStrengths: ltp.learning_strengths || [],
      challengeAreas: ltp.challenge_areas || [],
      startDate: today,
      endDate,
      durationMonths,
      domains: (ltp.domains || []).slice(0, 9),      // DB enum constraint
      reviewCycle: 'MONTHLY' as any,
      status: 'DRAFT' as any,
      goals: (ltp.goals || []).map((g: any, i: number) => ({
        goalStatement: g.goal_statement || g.goalStatement || '',
        domain: (g.domain || 'READING').toUpperCase(),
        targetAccuracy: g.target_accuracy ?? g.targetAccuracy ?? 80,
        order: g.order ?? i + 1,
      })),
      nextReviewDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // Default 1 month
    };

    const createdLTP = await ltpService.createLongTermPlan(educatorId, ltpPayload as any);
    const ltpId = createdLTP.id;

    // Create STPs linked to the LTP
    const createdSTPs: any[] = [];
    for (const stp of generated_stps) {
      const stpStart = new Date();
      const stpEnd = new Date();
      stpEnd.setDate(stpEnd.getDate() + (stp.duration_weeks || 6) * 7);

      const stpPayload = {
        longTermPlanId: ltpId,
        studentId,
        linkedGoalStatement: stp.stp_goal || stp.linked_goal_domain || '',
        startDate: stpStart,
        endDate: stpEnd,
        durationWeeks: stp.duration_weeks || 6,
        stpGoal: stp.stp_goal || '',
        interventionStrategy: stp.intervention_strategy || [],
        targetAccuracy: stp.target_accuracy ?? 80,
        status: 'DRAFT' as any,
        subGoals: (stp.sub_goals || []).map((sg: any, i: number) => ({
          goalStatement: sg.goal_statement || '',
          order: sg.order ?? i + 1,
          isAchieved: false,
        })),
      };

      try {
        const createdSTP = await stpService.createShortTermPlan(educatorId, stpPayload as any);
        createdSTPs.push(createdSTP);
      } catch (stpErr: any) {
        console.warn('Could not create STP:', stpErr.message);
      }
    }

    // Create WLPs — link to first STP if available
    const firstStpId = createdSTPs[0]?.id || null;
    const createdWLPs: any[] = [];

    for (const wlp of generated_wlps) {
      const wlpPayload = {
        shortTermPlanId: firstStpId,
        studentId,
        weekNumber: wlp.week_number || 1,
        sessionDate: new Date(),
        topics: wlp.topics || '',
        areasOfRemediation: wlp.areas_of_remediation || [],
        averageTime: wlp.average_time || 45,
        motivationStrategy: wlp.motivation_strategy || null,
        resourcesUsed: wlp.resources_used || [],
        status: 'PLANNED' as any,
      };

      try {
        const createdWLP = await wlpService.createWeeklyLessonPlan(educatorId, wlpPayload as any);
        createdWLPs.push(createdWLP);
      } catch (wlpErr: any) {
        console.warn('Could not create WLP:', wlpErr.message);
      }
    }

    await prisma.$disconnect();

    return res.json({
      success: true,
      data: {
        ltp: createdLTP,
        stps: createdSTPs,
        wlps: createdWLPs,
        message: `AI plan saved: 1 LTP, ${createdSTPs.length} STPs, ${createdWLPs.length} WLPs created as DRAFT`,
      },
    });
  } catch (error: any) {
    console.error('AI plan save error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save AI plan to database',
    });
  }
});


// ── Lesson Plan Agent ────────────────────────────────────────────────────────

/**
 * GET /api/ai/lesson-plan/:studentId
 * Get AI-suggested lesson plan for a specific week.
 */
router.get('/lesson-plan/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const weekNumber = parseInt(req.query.week as string) || 1;

    const result = await aiBackendProxy.suggestLessonPlan(studentId, weekNumber);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Lesson plan suggestion error:', error.message);
    res.status(error.message?.includes('Connection refused') ? 503 : 500).json({
      success: false,
      error: error.message || 'AI lesson plan suggestion failed',
      aiUnavailable: error.message?.includes('Connection refused'),
    });
  }
});

// ── Risk & Progress Agent ────────────────────────────────────────────────────

/**
 * GET /api/ai/risk/student/:studentId
 * Analyze risk and progress for a single student.
 */
router.get('/risk/student/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    const result = await aiBackendProxy.analyzeRisk('STUDENT', studentId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Risk analysis error:', error.message);
    res.status(error.message?.includes('Connection refused') ? 503 : 500).json({
      success: false,
      error: error.message || 'AI risk analysis failed',
      aiUnavailable: error.message?.includes('Connection refused'),
    });
  }
});

/**
 * GET /api/ai/risk/school/:schoolId
 * Analyze risk distribution across a school.
 */
router.get('/risk/school/:schoolId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { schoolId } = req.params;

    const result = await aiBackendProxy.analyzeRisk('SCHOOL', schoolId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI School risk analysis error:', error.message);
    res.status(error.message?.includes('Connection refused') ? 503 : 500).json({
      success: false,
      error: error.message || 'AI school risk analysis failed',
      aiUnavailable: error.message?.includes('Connection refused'),
    });
  }
});

// ── Educator Intelligence Agent ──────────────────────────────────────────────

/**
 * GET /api/ai/educator/insights
 * Get AI-powered insights for the currently authenticated educator.
 */
router.get('/educator/insights', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const educatorProfileId = (req as any).user?.profileId || (req as any).user?.id;

    if (!educatorProfileId) {
      return res.status(400).json({
        success: false,
        error: 'Educator profile ID not found in authentication context',
      });
    }

    const result = await aiBackendProxy.getEducatorInsights(educatorProfileId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('AI Educator insights error:', error.message);
    res.status(error.message?.includes('Connection refused') ? 503 : 500).json({
      success: false,
      error: error.message || 'AI educator insights failed',
      aiUnavailable: error.message?.includes('Connection refused'),
    });
  }
});

// ── AI Backend Health Check ──────────────────────────────────────────────────

/**
 * GET /api/ai/health
 * Check if the AI backend is running and responsive.
 */
router.get('/health', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await aiBackendProxy.healthCheck();
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      error: 'AI backend is not available',
      aiUnavailable: true,
    });
  }
});

/**
 * POST /api/ai/risk/:studentId/save
 * Persist an AI risk assessment to the Student profile.
 */
router.post('/risk/:studentId/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const { riskLevel } = req.body || {};

    if (!riskLevel) {
      return res.status(400).json({ success: false, error: 'riskLevel is required' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Mapping AI risk levels to DB enum if needed
    // (High Support -> AT_RISK, etc. based on schema enum RiskCategory)
    let dbRiskLevel: any = riskLevel;
    if (riskLevel === 'HIGH_SUPPORT') dbRiskLevel = 'AT_RISK';
    if (riskLevel === 'MODERATE_SUPPORT') dbRiskLevel = 'MONITORING'; // Mapping to available enum
    if (riskLevel === 'ON_TRACK') dbRiskLevel = 'ON_TRACK';

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        riskCategory: dbRiskLevel,
        lastRiskAssessment: new Date(),
      },
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: updatedStudent,
      message: `Risk level updated to ${dbRiskLevel}`,
    });
  } catch (error: any) {
    console.error('AI risk save error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save risk assessment',
    });
  }
});

export default router;
