'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnreadCount, useNotifications, useMarkAsRead } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export function NotificationDropdown() {
    const router = useRouter();
    const { data: unreadData } = useUnreadCount();
    const { data: notificationsData } = useNotifications(1, 5, { isRead: false });
    const markAsRead = useMarkAsRead();

    const unreadCount = unreadData?.count || 0;
    const notifications = notificationsData?.data || [];

    const handleNotificationClick = (notificationId: string) => {
        markAsRead.mutate(notificationId);
        router.push(`/${getUserRole()}/notifications`);
    };

    const getUserRole = () => {
        if (typeof window !== 'undefined') {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const roleMap: Record<string, string> = {
                'ADMIN': 'admin',
                'SUPER_SPECIAL_EDUCATOR': 'super-special-educator',
                'SPECIAL_EDUCATOR': 'educator',
                'CENTER': 'center',
                'PARENT': 'parent',
                'SCHOOL_VIEWER': 'school-viewer'
            };
            return roleMap[user.role] || 'educator';
        }
        return 'educator';
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        notifications.map((notification: any) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="cursor-pointer p-3 flex flex-col items-start gap-1"
                                onClick={() => handleNotificationClick(notification.id)}
                            >
                                <div className="font-medium text-sm">{notification.title}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                    {notification.message}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer justify-center"
                    onClick={() => router.push(`/${getUserRole()}/notifications`)}
                >
                    View All Notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
