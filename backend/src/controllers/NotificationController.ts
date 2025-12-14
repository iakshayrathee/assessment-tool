import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { NotificationService } from '../services/NotificationService';
import { getWebSocketManager } from '../utils/websocket';

const prisma = new PrismaClient();
const notificationService = new NotificationService(prisma);

export class NotificationController {
    /**
     * Get user's notifications with pagination and filtering
     * GET /api/notifications?page=1&limit=20&type=HOMEWORK_ASSIGNED&isRead=false
     */
    async getNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const filters: any = {};

            if (req.query.type) {
                filters.type = req.query.type as NotificationType;
            }

            if (req.query.isRead !== undefined) {
                filters.isRead = req.query.isRead === 'true';
            }

            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate as string);
            }

            const result = await notificationService.getUserNotifications(
                userId,
                page,
                limit,
                filters
            );

            res.json({
                success: true,
                data: result.notifications,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: result.totalPages,
                },
            });
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: error.message,
            });
        }
    }

    /**
     * Get unread notification count
     * GET /api/notifications/unread-count
     */
    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const count = await notificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count },
            });
        } catch (error: any) {
            console.error('Error fetching unread count:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch unread count',
                error: error.message,
            });
        }
    }

    /**
     * Get single notification by ID
     * GET /api/notifications/:id
     */
    async getNotificationById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const notification = await prisma.notification.findUnique({
                where: { id },
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found',
                });
            }

            // Verify the notification belongs to the user
            const userId = (req as any).user.userId;
            if (notification.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized access to notification',
                });
            }

            res.json({
                success: true,
                data: notification,
            });
        } catch (error: any) {
            console.error('Error fetching notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notification',
                error: error.message,
            });
        }
    }

    /**
     * Mark notification as read
     * PUT /api/notifications/:id/read
     */
    async markAsRead(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.userId;

            // Verify the notification belongs to the user
            const notification = await prisma.notification.findUnique({
                where: { id },
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found',
                });
            }

            if (notification.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized access to notification',
                });
            }

            const updatedNotification = await notificationService.markAsRead(id);

            // Broadcast update via WebSocket
            const wsManager = getWebSocketManager();
            if (wsManager) {
                wsManager.sendNotificationUpdate(userId, {
                    id: updatedNotification.id,
                    isRead: true,
                    readAt: updatedNotification.readAt,
                });
            }

            res.json({
                success: true,
                data: updatedNotification,
                message: 'Notification marked as read',
            });
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: error.message,
            });
        }
    }

    /**
     * Mark all notifications as read
     * PUT /api/notifications/mark-all-read
     */
    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.userId;
            const count = await notificationService.markAllAsRead(userId);

            // Broadcast update via WebSocket
            const wsManager = getWebSocketManager();
            if (wsManager) {
                wsManager.sendNotificationUpdate(userId, {
                    action: 'mark_all_read',
                    count,
                });
            }

            res.json({
                success: true,
                data: { count },
                message: `${count} notifications marked as read`,
            });
        } catch (error: any) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: error.message,
            });
        }
    }

    /**
     * Delete notification
     * DELETE /api/notifications/:id
     */
    async deleteNotification(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.userId;

            // Verify the notification belongs to the user
            const notification = await prisma.notification.findUnique({
                where: { id },
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found',
                });
            }

            if (notification.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized access to notification',
                });
            }

            await notificationService.deleteNotification(id);

            res.json({
                success: true,
                message: 'Notification deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message,
            });
        }
    }
}

export const notificationController = new NotificationController();
