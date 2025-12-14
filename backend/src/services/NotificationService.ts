import { PrismaClient, Notification, NotificationType } from '@prisma/client';
import { NotificationRepository, CreateNotificationData, NotificationFilters } from '../repositories/NotificationRepository';

export class NotificationService {
    private notificationRepository: NotificationRepository;

    constructor(prisma: PrismaClient) {
        this.notificationRepository = new NotificationRepository(prisma);
    }

    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data?: any
    ): Promise<Notification> {
        const notificationData: CreateNotificationData = {
            userId,
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : null,
        };

        const notification = await this.notificationRepository.create(notificationData);

        // WebSocket broadcasting will be handled in the controller/helper
        return notification;
    }

    async createBulkNotifications(
        userIds: string[],
        type: NotificationType,
        title: string,
        message: string,
        data?: any
    ): Promise<number> {
        const notifications: CreateNotificationData[] = userIds.map(userId => ({
            userId,
            type,
            title,
            message,
            data: data ? JSON.stringify(data) : null,
        }));

        return this.notificationRepository.createMany(notifications);
    }

    async getUserNotifications(
        userId: string,
        page: number = 1,
        limit: number = 20,
        filters?: NotificationFilters
    ): Promise<{ notifications: Notification[]; total: number; totalPages: number }> {
        const { notifications, total } = await this.notificationRepository.findByUserId(
            userId,
            page,
            limit,
            filters
        );

        const totalPages = Math.ceil(total / limit);

        return { notifications, total, totalPages };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepository.getUnreadCount(userId);
    }

    async markAsRead(id: string): Promise<Notification> {
        return this.notificationRepository.markAsRead(id);
    }

    async markAllAsRead(userId: string): Promise<number> {
        return this.notificationRepository.markAllAsRead(userId);
    }

    async deleteNotification(id: string): Promise<void> {
        return this.notificationRepository.delete(id);
    }

    async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
        return this.notificationRepository.deleteOldNotifications(daysOld);
    }
}
