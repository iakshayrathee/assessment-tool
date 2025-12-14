import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    data: string | null;
    createdAt: string;
    readAt: string | null;
}

export interface NotificationFilters {
    type?: string;
    isRead?: boolean;
    startDate?: string;
    endDate?: string;
}

/**
 * Hook to fetch notifications with pagination and filtering
 */
export function useNotifications(
    page: number = 1,
    limit: number = 20,
    filters?: NotificationFilters
) {
    return useQuery({
        queryKey: ['notifications', page, limit, filters],
        queryFn: () => apiClient.getNotifications({ page, limit, ...filters }),
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: ['unreadCount'],
        queryFn: () => apiClient.getUnreadNotificationCount(),
        staleTime: 10000, // 10 seconds
        refetchInterval: 30000, // Refetch every 30 seconds as fallback
    });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.markNotificationAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to mark notification as read');
        },
    });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => apiClient.markAllNotificationsAsRead(),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
            toast.success(`${data.count} notifications marked as read`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to mark all as read');
        },
    });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => apiClient.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
            toast.success('Notification deleted');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete notification');
        },
    });
}
