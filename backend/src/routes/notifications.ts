import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { AuthUtils } from '../utils/auth';

const router = Router();

// All routes require authentication
router.use(AuthUtils.authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with pagination and filtering
 * @access  Private
 */
router.get('/', (req, res) => notificationController.getNotifications(req, res));

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req, res));

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private
 */
router.get('/:id', (req, res) => notificationController.getNotificationById(req, res));

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', (req, res) => notificationController.markAsRead(req, res));

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/mark-all-read', (req, res) => notificationController.markAllAsRead(req, res));

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', (req, res) => notificationController.deleteNotification(req, res));

export default router;
