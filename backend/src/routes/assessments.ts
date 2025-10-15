import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AssessmentController } from '../controllers/AssessmentController';
import { AuthUtils } from '../utils/auth';
import { attachProfileId } from '../middleware/profileMiddleware';

const router = Router();
const prisma = new PrismaClient();
const assessmentController = new AssessmentController(prisma);

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

// INTAKE FORM ROUTES

// Helper function to filter out empty values for draft saves
const filterEmptyValues = (obj: any) => {
  const filtered: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      filtered[key] = value;
    }
  }
  return filtered;
};

// POST /intake - Create intake form
export const createIntakeForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }

    // Check if intake form already exists for this student
    const existingIntake = await prisma.intakeForm.findFirst({
      where: { studentId }
    });

    if (existingIntake) {
      return res.status(400).json({ 
        success: false, 
        error: 'Intake form already exists for this student. Use update endpoint instead.' 
      });
    }

    // Extract only valid IntakeForm fields from request body
    const {
      // Socio Demographic Data
      address,
      familyIncome,
      familyType,
      digitalResourcesAtHome,
      dailyDigitalUse,
      enjoysSchool,
      studyAssistant,
      externalAcademicSupport,
      enjoysReading,
      dailyParentChildTime,
      childType,
      
      // Family History
      fatherName,
      motherName,
      guardianName,
      
      // Prenatal, Natal & Delivery
      pregnancyNormal,
      medicationsDuringPregnancy,
      medicationsDuringPregnancyDetails,
      miscarriagesAbortions,
      fullTermOrPremature,
      deliveryType,
      
      // Post Natal Factors
      breastFed,
      infantJaundice,
      incubation,
      immunizationDone,
      consanguineousMarriage,
      birthCry,
      delayInNeckStanding,
      delayInNeckStandingDetails,
      ageOfWalking,
      ageOfTwoWordSpeech,
      
      // Medical History
      healthConcerns,
      epilepticHistory,
      onMedication,
      medicationDetails,
      asthmaWheezing,
      wearsGlasses,
      visionTestDone,
      hearingTestDone,
      
      // Educational History
      attendedPreschool,
      repeatedGrades,
      whichGradeRepeated,
      dominantWritingHand,
      strugglesInLanguages
    } = req.body;

    // Get the special educator profile ID from the user ID
    const specialEducatorProfile = await prisma.specialEducatorProfile.findUnique({
      where: { userId: decoded.userId }
    });

    if (!specialEducatorProfile) {
      return res.status(403).json({ 
        success: false, 
        error: 'Special educator profile not found' 
      });
    }

    // Build the data object with only non-empty values for draft saves
    const baseData = {
      studentId,
      specialEducatorId: specialEducatorProfile.id,
      status: 'PENDING'
    };

    const formData = {
      // Socio Demographic Data
      address,
      familyIncome,
      familyType,
      digitalResourcesAtHome,
      dailyDigitalUse,
      enjoysSchool,
      studyAssistant,
      externalAcademicSupport,
      enjoysReading,
      dailyParentChildTime,
      childType,
      
      // Family History
      fatherName,
      motherName,
      guardianName,
      
      // Prenatal, Natal & Delivery
      pregnancyNormal,
      medicationsDuringPregnancy,
      medicationsDuringPregnancyDetails,
      miscarriagesAbortions,
      fullTermOrPremature,
      deliveryType,
      
      // Post Natal Factors
      breastFed,
      infantJaundice,
      incubation,
      immunizationDone,
      consanguineousMarriage,
      birthCry,
      delayInNeckStanding,
      delayInNeckStandingDetails,
      ageOfWalking,
      ageOfTwoWordSpeech,
      
      // Medical History
      healthConcerns,
      epilepticHistory,
      onMedication,
      medicationDetails,
      asthmaWheezing,
      wearsGlasses,
      visionTestDone,
      hearingTestDone,
      
      // Educational History
      attendedPreschool,
      repeatedGrades,
      whichGradeRepeated,
      dominantWritingHand,
      strugglesInLanguages
    };

    // Filter out empty values for draft saves
    const filteredFormData = filterEmptyValues(formData);
    const intakeFormData = { ...baseData, ...filteredFormData };

    const intakeForm = await prisma.intakeForm.create({
      data: intakeFormData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });

    res.json({ success: true, data: intakeForm });
  } catch (error: any) {
    console.error('Error creating intake form:', error);
    if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ success: false, error: error.message });
    }
    if (error.message === 'Insufficient permissions') {
      return res.status(403).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to create intake form' });
  }
};

// PUT /intake/:id - Update intake form
export const updateIntakeForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID is required' });
    }

    // Check if intake form exists
    const existingIntake = await prisma.intakeForm.findUnique({
      where: { id }
    });

    if (!existingIntake) {
      return res.status(404).json({ 
        success: false, 
        error: 'Intake form not found' 
      });
    }

    // Extract only valid IntakeForm fields from request body
    const {
      studentId,
      status,
      address,
      // Family Information
      fatherName,
      motherName,
      guardianName,
      familyIncome,
      familyType,
      digitalResourcesAtHome,
      dailyDigitalUse,
      enjoysSchool,
      studyAssistant,
      externalAcademicSupport,
      enjoysReading,
      dailyParentChildTime,
      childType,
      
      // Pre Natal Factors
      pregnancyNormal,
      medicationsDuringPregnancy,
      medicationsDuringPregnancyDetails,
      miscarriagesAbortions,
      fullTermOrPremature,
      deliveryType,
      
      // Post Natal Factors
      breastFed,
      infantJaundice,
      incubation,
      immunizationDone,
      consanguineousMarriage,
      birthCry,
      delayInNeckStanding,
      delayInNeckStandingDetails,
      ageOfWalking,
      ageOfTwoWordSpeech,
      
      // Medical History
      healthConcerns,
      epilepticHistory,
      onMedication,
      medicationDetails,
      asthmaWheezing,
      wearsGlasses,
      visionTestDone,
      hearingTestDone,
      
      // Educational History
      attendedPreschool,
      repeatedGrades,
      whichGradeRepeated,
      dominantWritingHand,
      strugglesInLanguages
    } = req.body;

    // Build update data object
    const formData = {
      studentId,
      status,
      address,
      fatherName,
      motherName,
      guardianName,
      familyIncome,
      familyType,
      digitalResourcesAtHome,
      dailyDigitalUse,
      enjoysSchool,
      studyAssistant,
      externalAcademicSupport,
      enjoysReading,
      dailyParentChildTime,
      childType,
      pregnancyNormal,
      medicationsDuringPregnancy,
      medicationsDuringPregnancyDetails,
      miscarriagesAbortions,
      fullTermOrPremature,
      deliveryType,
      breastFed,
      infantJaundice,
      incubation,
      immunizationDone,
      consanguineousMarriage,
      birthCry,
      delayInNeckStanding,
      delayInNeckStandingDetails,
      ageOfWalking,
      ageOfTwoWordSpeech,
      healthConcerns,
      epilepticHistory,
      onMedication,
      medicationDetails,
      asthmaWheezing,
      wearsGlasses,
      visionTestDone,
      hearingTestDone,
      attendedPreschool,
      repeatedGrades,
      whichGradeRepeated,
      dominantWritingHand,
      strugglesInLanguages
    };

    // Filter out empty values for draft saves
    const filteredFormData = filterEmptyValues(formData);

    const intakeForm = await prisma.intakeForm.update({
      where: { id },
      data: filteredFormData,
      include: {
        student: true,
        specialEducator: {
          include: {
            user: true
          }
        }
      }
    });

    res.json({ success: true, data: intakeForm });
  } catch (error: any) {
    console.error('Error updating intake form:', error);
    if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ success: false, error: error.message });
    }
    if (error.message === 'Insufficient permissions') {
      return res.status(403).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to update intake form' });
  }
};

// POST /intake/:id/complete - Complete intake form
export const completeIntakeForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID is required' });
    }

    const intakeForm = await prisma.intakeForm.update({
      where: { id },
      data: {
        status: 'COMPLETED'
      }
    });

    res.json({ success: true, data: intakeForm });
  } catch (error: any) {
    if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ success: false, error: error.message });
    }
    if (error.message === 'Insufficient permissions') {
      return res.status(403).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// GET /intake/:id - Get intake form by ID
export const getIntakeFormById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID is required' });
    }

    const intakeForm = await prisma.intakeForm.findUnique({
      where: { id },
      include: {
        student: true,
        specialEducator: true
      }
    });

    if (!intakeForm) {
      return res.status(404).json({ success: false, error: 'Intake form not found' });
    }

    res.json({ success: true, data: intakeForm });
  } catch (error: any) {
    if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// GET /intake/student/:studentId - Get intake form by student
export const getIntakeFormByStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }

    const intakeForm = await prisma.intakeForm.findFirst({
      where: { studentId },
      include: {
        student: true,
        specialEducator: true
      }
    });

    res.json({ success: true, data: intakeForm });
  } catch (error: any) {
    if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// Simple placeholder functions for remaining endpoints (to be implemented)
export const getAssessmentStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    const stats = await prisma.assessment.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    res.json({ success: true, data: stats });
  } catch (error: any) {
    if (error.message === 'Access token required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// GET /api/assessments/student/:studentId - Get assessments by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const assessments = await prisma.assessment.findMany({
      where: { studentId },
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
            fullName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Get assessments by student error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessments'
    });
  }
});

// GET /api/assessments/iep-goals/student/:studentId - Get IEP goals by student
router.get('/iep-goals/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const iepGoals = await prisma.iEPGoal.findMany({
      where: { studentId },
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
            fullName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        },
        progressUpdates: {
          orderBy: { updateDate: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: iepGoals
    });
  } catch (error) {
    console.error('Get IEP goals by student error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IEP goals'
    });
  }
});

// GET /api/assessments/session-notes/student/:studentId - Get session notes by student
router.get('/session-notes/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const [sessionNotes, total] = await Promise.all([
      prisma.sessionNote.findMany({
        where: { studentId },
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
              fullName: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        },
        orderBy: { sessionDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.sessionNote.count({
        where: { studentId }
      })
    ]);

    res.json({
      success: true,
      data: sessionNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get session notes by student error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session notes'
    });
  }
});

// GET /api/assessments/reports/student/:studentId - Get reports by student
router.get('/reports/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const reports = await prisma.report.findMany({
      where: { studentId },
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
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Get reports by student error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

// Assessment route wrappers with authentication
const createAssessmentWithAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    // Get the special educator profile ID from the user ID
    const specialEducatorProfile = await prisma.specialEducatorProfile.findUnique({
      where: { userId: decoded.userId }
    });

    if (!specialEducatorProfile) {
      return res.status(403).json({ 
        success: false, 
        error: 'Special educator profile not found' 
      });
    }
    
    // Add user info to request for controller with the correct specialEducatorId
    (req as any).user = { userId: specialEducatorProfile.id };
    
    return await assessmentController.createAssessment(req as any, res);
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

const updateAssessmentWithAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    // Get the special educator profile ID from the user ID
    const specialEducatorProfile = await prisma.specialEducatorProfile.findUnique({
      where: { userId: decoded.userId }
    });

    if (!specialEducatorProfile) {
      return res.status(403).json({ 
        success: false, 
        error: 'Special educator profile not found' 
      });
    }
    
    // Add user info to request for controller with the correct specialEducatorId
    (req as any).user = { userId: specialEducatorProfile.id };
    
    return await assessmentController.updateAssessment(req as any, res);
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

const getAssessmentsByStudentWithAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    return await assessmentController.getAssessmentsByStudent(req as any, res);
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

const getAssessmentHistoryWithAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decoded = requireAuth(req);
    requireEducatorRoles(decoded);
    
    return await assessmentController.getAssessmentHistory(req as any, res);
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

// Setup routes
router.post('/intake', createIntakeForm);
router.put('/intake/:id', updateIntakeForm);
router.post('/intake/:id/complete', completeIntakeForm);
router.get('/intake/:id', getIntakeFormById);
router.get('/intake/student/:studentId', getIntakeFormByStudent);

// IEP Goals routes
router.post('/iep-goals', async (req, res) => {
  try {
    const result = await assessmentController.createIEPGoal(req, res);
    return result;
  } catch (error) {
    console.error('Create IEP goal route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create IEP goal'
    });
  }
});

router.put('/iep-goals/:id', async (req, res) => {
  try {
    const result = await assessmentController.updateIEPGoal(req, res);
    return result;
  } catch (error) {
    console.error('Update IEP goal route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update IEP goal'
    });
  }
});

router.post('/iep-goals/:goalId/progress', async (req, res) => {
  try {
    const result = await assessmentController.updateIEPGoalProgress(req, res);
    return result;
  } catch (error) {
    console.error('Update IEP goal progress route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update IEP goal progress'
    });
  }
});

router.get('/iep-goals/:id', async (req, res) => {
  try {
    const result = await assessmentController.getIEPGoalById(req, res);
    return result;
  } catch (error) {
    console.error('Get IEP goal by ID route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IEP goal'
    });
  }
});

router.delete('/iep-goals/:id', async (req, res) => {
  try {
    const result = await assessmentController.discontinueIEPGoal(req, res);
    return result;
  } catch (error) {
    console.error('Discontinue IEP goal route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discontinue IEP goal'
    });
  }
});

// Get IEP goals for all students assigned to an educator
router.get('/iep-goals/educator/:educatorId', async (req, res) => {
  try {
    const result = await assessmentController.getIEPGoalsByEducator(req, res);
    return result;
  } catch (error) {
    console.error('Get IEP goals by educator route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IEP goals for educator'
    });
  }
});

router.post('/', createAssessmentWithAuth);
router.put('/:id', updateAssessmentWithAuth);
router.get('/student/:studentId', getAssessmentsByStudentWithAuth);
router.get('/history/:studentId', getAssessmentHistoryWithAuth);
router.get('/stats', getAssessmentStats);

export default router;
