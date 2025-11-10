import { Router } from 'express';
import { SuperSpecialEducatorController } from '../controllers/SuperSpecialEducatorController';
import { AuthUtils } from '../utils/auth';
import { UserRole } from '../models';

const router = Router();
const superSpecialEducatorController = new SuperSpecialEducatorController();

// Apply authentication and role-based access to all routes
router.use(AuthUtils.authenticateToken);
router.use(AuthUtils.requireRole([UserRole.SUPER_SPECIAL_EDUCATOR]));

/**
 * @route GET /api/super-special-educators/dashboard
 * @desc Get Super Special Educator dashboard data
 * @access Private (Super Special Educator only)
 */
router.get('/dashboard', superSpecialEducatorController.getDashboard);

/**
 * @route GET /api/super-special-educators/profile
 * @desc Get Super Special Educator profile
 * @access Private (Super Special Educator only)
 */
router.get('/profile', superSpecialEducatorController.getProfile);

/**
 * @route PUT /api/super-special-educators/profile
 * @desc Update Super Special Educator profile
 * @access Private (Super Special Educator only)
 */
router.put('/profile', superSpecialEducatorController.updateProfile);

/**
 * @route GET /api/super-special-educators/centers
 * @desc Get assigned centers with pagination
 * @access Private (Super Special Educator only)
 */
router.get('/centers', superSpecialEducatorController.getAssignedCenters);

/**
 * @route GET /api/super-special-educators/educators
 * @desc Get assigned Special Educators with pagination
 * @access Private (Super Special Educator only)
 */
router.get('/educators', superSpecialEducatorController.getAssignedEducators);

/**
 * @route GET /api/super-special-educators/students
 * @desc Get students under supervision with pagination
 * @access Private (Super Special Educator only)
 */
router.get('/students', superSpecialEducatorController.getStudentsUnderSupervision);

/**
 * @route GET /api/super-special-educators/reviews/pending
 * @desc Get reports pending review
 * @access Private (Super Special Educator only)
 */
router.get('/reviews/pending', superSpecialEducatorController.getPendingReviews);

/**
 * @route POST /api/super-special-educators/reviews/:reportId
 * @desc Review and approve/reject a report
 * @access Private (Super Special Educator only)
 */
router.post('/reviews/:reportId', superSpecialEducatorController.reviewReport);

/**
 * @route GET /api/super-special-educators/flagged-cases
 * @desc Get flagged cases (students with issues)
 * @access Private (Super Special Educator only)
 */
router.get('/flagged-cases', superSpecialEducatorController.getFlaggedCases);

/**
 * @route POST /api/super-special-educators/training-logs
 * @desc Create training log entry
 * @access Private (Super Special Educator only)
 */
router.post('/training-logs', superSpecialEducatorController.createTrainingLog);

/**
 * @route GET /api/super-special-educators/training-logs
 * @desc Get training logs with pagination
 * @access Private (Super Special Educator only)
 */
router.get('/training-logs', superSpecialEducatorController.getTrainingLogs);

/**
 * @route GET /api/super-special-educators/analytics/cross-center
 * @desc Get cross-center comparison data
 * @access Private (Super Special Educator only)
 */
router.get('/analytics/cross-center', superSpecialEducatorController.getCrossCenterComparison);

/**
 * @route GET /api/super-special-educators/analytics/performance
 * @desc Get performance analytics
 * @access Private (Super Special Educator only)
 */
router.get('/analytics/performance', superSpecialEducatorController.getPerformanceAnalytics);

/**
 * @route GET /api/super-special-educators/activities
 * @desc Get recent activities across supervised entities
 * @access Private (Super Special Educator only)
 */
router.get('/activities', superSpecialEducatorController.getRecentActivities);

/**
 * @route POST /api/super-special-educators/special-educators
 * @desc Create a new Special Educator
 * @access Private (Super Special Educator only)
 */
router.post('/special-educators', superSpecialEducatorController.createSpecialEducator);

export default router;
