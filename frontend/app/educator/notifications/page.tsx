'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotifications';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPageProps {
    title?: string;
    description?: string;
}

function NotificationPage({
    title = 'Notifications',
    description = 'Stay updated with all your important notifications'
}: NotificationPageProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [page, setPage] = useState(1);

    const filters = activeTab === 'unread' ? { isRead: false } : {};
    const { data, isLoading } = useNotifications(page, 20, filters);
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const notifications = data?.data || [];
    const pagination = data?.pagination;

    const getNotificationColor = (type: string) => {
        const colorMap: Record<string, string> = {
            HOMEWORK_ASSIGNED: 'bg-warning/10 text-foreground',
            HOMEWORK_SUBMITTED: 'bg-success/10 text-foreground',
            ASSESSMENT_CREATED: 'bg-info/10 text-foreground',
            ASSESSMENT_COMPLETED: 'bg-success/10 text-foreground',
            IEP_GOAL_CREATED: 'bg-indigo-100 text-indigo-800',
            IEP_GOAL_ACHIEVED: 'bg-warning/10 text-foreground',
            REPORT_SUBMITTED: 'bg-primary/10 text-primary',
            REPORT_APPROVED: 'bg-success/10 text-foreground',
            CONCERN_SUBMITTED: 'bg-destructive/10 text-foreground',
            CONCERN_RESPONDED: 'bg-success/10 text-foreground',
        };
        return colorMap[type] || 'bg-muted text-foreground';
    };

    return (
        <PageWrapper
            title={title}
            description={description}
            breadcrumbs={[{ label: 'Educator' }, { label: 'Notifications' }]}
            actions={
                notifications.some((n: any) => !n.isRead) ? (
                    <Button onClick={() => markAllAsRead.mutate()} variant="outline" size="sm">
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark All as Read
                    </Button>
                ) : undefined
            }
        >

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">All Notifications</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No notifications</p>
                                <p className="text-sm text-muted-foreground">
                                    {activeTab === 'unread' ? "You're all caught up!" : "You don't have any notifications yet"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {notifications.map((notification: any) => (
                                <Card
                                    key={notification.id}
                                    className={`transition-all hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-primary/10/50' : ''}`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                                <Bell className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {notification.type.replace(/_/g, ' ')}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {!notification.isRead && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => markAsRead.mutate(notification.id)}
                                                                title="Mark as read"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteNotification.mutate(notification.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </PageWrapper>
    );
}

export default NotificationPage;
