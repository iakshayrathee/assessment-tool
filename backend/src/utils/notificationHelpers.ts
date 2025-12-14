import { NotificationType } from '@prisma/client';
import { getWebSocketManager } from './websocket';

/**
 * Helper function to create a notification for a single user
 * This is a convenience wrapper that can be used throughout the codebase
 */
export async function createNotificationForUser(
    prisma: any,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
): Promise<void> {
    console.log(`[NotificationHelper] Creating notification for user ${userId}:`, { type, title });

    // Create notification in database
    const notification = await prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : null,
        },
    });

    console.log(`[NotificationHelper] Notification created in DB:`, notification.id);

    // Broadcast via WebSocket if available
    const wsManager = getWebSocketManager();
    console.log(`[NotificationHelper] WebSocket manager available:`, !!wsManager);

    if (wsManager) {
        const payload = {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            createdAt: notification.createdAt,
            isRead: false,
        };
        console.log(`[NotificationHelper] Broadcasting notification to user ${userId}:`, payload);
        wsManager.sendNotificationToUser(userId, payload);
    } else {
        console.warn(`[NotificationHelper] WebSocket manager not available, notification not broadcast`);
    }
}

/**
 * Helper function to create notifications for multiple users
 */
export async function createNotificationForMultipleUsers(
    prisma: any,
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: any
): Promise<void> {
    // Create notifications in database
    const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
    }));

    await prisma.notification.createMany({
        data: notifications,
    });

    // Broadcast via WebSocket if available
    const wsManager = getWebSocketManager();
    if (wsManager) {
        const notificationPayload = {
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : null,
            createdAt: new Date(),
            isRead: false,
        };

        userIds.forEach(userId => {
            wsManager.sendNotificationToUser(userId, {
                ...notificationPayload,
                userId,
            });
        });
    }
}

/**
 * Get notification icon name based on type
 */
export function getNotificationIcon(type: NotificationType): string {
    const iconMap: Record<NotificationType, string> = {
        STUDENT_ASSIGNED: 'user-plus',
        STUDENT_UNASSIGNED: 'user-minus',
        ASSESSMENT_CREATED: 'clipboard-list',
        ASSESSMENT_COMPLETED: 'clipboard-check',
        ASSESSMENT_REVIEWED: 'clipboard-check',
        IEP_GOAL_CREATED: 'target',
        IEP_GOAL_UPDATED: 'target',
        IEP_GOAL_ACHIEVED: 'trophy',
        HOMEWORK_ASSIGNED: 'book-open',
        HOMEWORK_SUBMITTED: 'book-check',
        HOMEWORK_REVIEWED: 'book-check',
        REPORT_SUBMITTED: 'file-text',
        REPORT_APPROVED: 'file-check',
        REPORT_REJECTED: 'file-x',
        CONCERN_SUBMITTED: 'alert-circle',
        CONCERN_RESPONDED: 'message-circle',
        LESSON_PLAN_CREATED: 'calendar',
        LESSON_PLAN_UPDATED: 'calendar',
        DOCUMENT_UPLOADED: 'file-up',
        ACCOUNT_CREATED: 'user-check',
        ROLE_CHANGED: 'shield',
    };

    return iconMap[type] || 'bell';
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
    const colorMap: Record<NotificationType, string> = {
        STUDENT_ASSIGNED: 'blue',
        STUDENT_UNASSIGNED: 'gray',
        ASSESSMENT_CREATED: 'purple',
        ASSESSMENT_COMPLETED: 'green',
        ASSESSMENT_REVIEWED: 'green',
        IEP_GOAL_CREATED: 'indigo',
        IEP_GOAL_UPDATED: 'indigo',
        IEP_GOAL_ACHIEVED: 'yellow',
        HOMEWORK_ASSIGNED: 'orange',
        HOMEWORK_SUBMITTED: 'green',
        HOMEWORK_REVIEWED: 'green',
        REPORT_SUBMITTED: 'blue',
        REPORT_APPROVED: 'green',
        REPORT_REJECTED: 'red',
        CONCERN_SUBMITTED: 'red',
        CONCERN_RESPONDED: 'green',
        LESSON_PLAN_CREATED: 'teal',
        LESSON_PLAN_UPDATED: 'teal',
        DOCUMENT_UPLOADED: 'cyan',
        ACCOUNT_CREATED: 'green',
        ROLE_CHANGED: 'purple',
    };

    return colorMap[type] || 'gray';
}
