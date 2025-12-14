'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { wsClient } from '@/lib/websocketClient';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface NotificationContextType {
    isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
    isConnected: false,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isConnected, setIsConnected] = useState(false);


    useEffect(() => {
        // Get token from localStorage
        const token = localStorage.getItem('token');

        if (!user || !token) {
            wsClient.disconnect();
            setIsConnected(false);
            return;
        }

        // Connect to WebSocket
        const socket = wsClient.connect(token);

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('[NotificationProvider] WebSocket connected');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('[NotificationProvider] WebSocket disconnected');
        });

        // Handle new notifications
        const handleNewNotification = (notification: any) => {
            console.log('[NotificationProvider] New notification received:', notification);

            // Invalidate queries to refetch notifications
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });

            // Show prominent toast notification - using simpler approach for reliability
            toast(
                (t) => (
                    <div className="flex items-start gap-3 max-w-md">
                        <div className="flex-shrink-0">
                            <span className="text-2xl">🔔</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                {notification.message}
                            </p>
                        </div>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>
                ),
                {
                    duration: 8000,
                    position: 'top-right',
                    style: {
                        background: '#fff',
                        color: '#000',
                        border: '2px solid #3b82f6',
                        padding: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        maxWidth: '500px',
                    },
                }
            );
        };

        // Handle notification updates (e.g., marked as read)
        const handleNotificationUpdate = (update: any) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        };

        wsClient.onNewNotification(handleNewNotification);
        wsClient.onNotificationUpdate(handleNotificationUpdate);

        return () => {
            wsClient.offNewNotification(handleNewNotification);
            wsClient.offNotificationUpdate(handleNotificationUpdate);
            wsClient.disconnect();
        };
    }, [user, queryClient]);

    return (
        <NotificationContext.Provider value={{ isConnected }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotificationConnection = () => useContext(NotificationContext);
