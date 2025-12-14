import { Router } from 'express';
import { SpecialEducatorController } from '../controllers/SpecialEducatorController';
import { AuthUtils, AuthenticatedRequest } from '../utils/auth';
import { UserRole } from '../models';
import { attachProfileId } from '../middleware/profileMiddleware';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const specialEducatorController = new SpecialEducatorController();

// Apply authentication middleware to all routes
router.use(AuthUtils.authenticateToken);

// Apply profile middleware to attach profile ID
router.use(attachProfileId);

// Apply authorization middleware for special educator role
router.use(AuthUtils.requireRole([UserRole.SPECIAL_EDUCATOR]));

/**
 * @route GET /api/special-educators/dashboard
 * @desc Get special educator dashboard data
 * @access Private (Special Educator only)
 */
router.get('/dashboard', specialEducatorController.getDashboard.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/profile
 * @desc Get special educator profile
 * @access Private (Special Educator only)
 */
router.get('/profile', specialEducatorController.getProfile.bind(specialEducatorController));

/**
 * @route PUT /api/special-educators/profile
 * @desc Update special educator profile
 * @access Private (Special Educator only)
 */
router.put('/profile', specialEducatorController.updateProfile.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/students
 * @desc Get assigned students with pagination and search
 * @access Private (Special Educator only)
 */
router.get('/students', specialEducatorController.getAssignedStudents.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/students/:studentId
 * @desc Get detailed student information
 * @access Private (Special Educator only)
 */
router.get('/students/:studentId', specialEducatorController.getStudentDetails.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/activities
 * @desc Get recent activities
 * @access Private (Special Educator only)
 */
router.get('/activities', specialEducatorController.getRecentActivities.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/statistics
 * @desc Get educator statistics
 * @access Private (Special Educator only)
 */
router.get('/statistics', specialEducatorController.getStatistics.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/schedule/today
 * @desc Get today's schedule
 * @access Private (Special Educator only)
 */
router.get('/schedule/today', specialEducatorController.getTodaysSchedule.bind(specialEducatorController));

/**
 * @route POST /api/special-educators/session-notes
 * @desc Create a new session note
 * @access Private (Special Educator only)
 */
router.post('/session-notes', specialEducatorController.createSessionNote.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/students/:studentId/session-notes
 * @desc Get session notes for a specific student
 * @access Private (Special Educator only)
 */
router.get('/students/:studentId/session-notes', specialEducatorController.getSessionNotes.bind(specialEducatorController));

// Document Management Routes
import { upload, handleMulterError } from '../middleware/upload';

/**
 * @route POST /api/special-educators/documents/upload
 * @desc Upload documents to educator's S3 folder
 * @access Private (Special Educator only)
 */
router.post('/documents/upload', upload.array('files', 10), handleMulterError, specialEducatorController.uploadDocuments.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/documents
 * @desc Get all documents for the educator
 * @access Private (Special Educator only)
 */
router.get('/documents', specialEducatorController.getDocuments.bind(specialEducatorController));

/**
 * @route DELETE /api/special-educators/documents/:fileKey
 * @desc Delete a document from educator's S3 folder
 * @access Private (Special Educator only)
 */
router.delete('/documents/:fileKey', specialEducatorController.deleteDocument.bind(specialEducatorController));

/**
 * @route GET /api/special-educators/check-token
 * @desc Check the token and return the user profile
 * @access Private (Special Educator only)
 */
router.get('/check-token', (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      authenticated: true,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
