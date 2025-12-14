import { PrismaClient, Notification, NotificationType, Prisma } from '@prisma/client';

export interface CreateNotificationData {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: string | null;
}

export interface NotificationFilters {
    type?: NotificationType;
    isRead?: boolean;
    startDate?: Date;
    endDate?: Date;
}

export class NotificationRepository {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async create(data: CreateNotificationData): Promise<Notification> {
        return this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data,
            },
        });
    }

    async createMany(notifications: CreateNotificationData[]): Promise<number> {
        const result = await this.prisma.notification.createMany({
            data: notifications,
        });
        return result.count;
    }

    async findById(id: string): Promise<Notification | null> {
        return this.prisma.notification.findUnique({
            where: { id },
        });
    }

    async findByUserId(
        userId: string,
        page: number = 1,
        limit: number = 20,
        filters?: NotificationFilters
    ): Promise<{ notifications: Notification[]; total: number }> {
        const skip = (page - 1) * limit;

        const where: Prisma.NotificationWhereInput = {
            userId,
        };

        if (filters?.type) {
            where.type = filters.type;
        }

        if (filters?.isRead !== undefined) {
            where.isRead = filters.isRead;
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where }),
        ]);

        return { notifications, total };
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }

    async markAsRead(id: string): Promise<Notification> {
        return this.prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId: string): Promise<number> {
        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return result.count;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.notification.delete({
            where: { id },
        });
    }

    async deleteOldNotifications(daysOld: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                isRead: true,
            },
        });

        return result.count;
    }
}
