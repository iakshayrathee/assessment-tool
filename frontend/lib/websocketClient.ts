import { io, Socket } from 'socket.io-client';

class WebSocketClient {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(token: string) {
        if (this.socket?.connected) {
            return this.socket;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const baseUrl = apiUrl.replace('/api', '');

        this.socket = io(baseUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error);
            this.reconnectAttempts++;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onNewNotification(callback: (notification: any) => void) {
        this.socket?.on('notification:new', callback);
    }

    onNotificationUpdate(callback: (update: any) => void) {
        this.socket?.on('notification:update', callback);
    }

    offNewNotification(callback: (notification: any) => void) {
        this.socket?.off('notification:new', callback);
    }

    offNotificationUpdate(callback: (update: any) => void) {
        this.socket?.off('notification:update', callback);
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const wsClient = new WebSocketClient();
