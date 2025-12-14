import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: string;
}

interface JWTPayload {
    userId: string;
    role: string;
}

class WebSocketManager {
    private io: SocketIOServer;
    private userSockets: Map<string, Set<string>>; // userId -> Set of socket IDs

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
            },
        });
        this.userSockets = new Map();
        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        // JWT authentication middleware
        this.io.use((socket: AuthenticatedSocket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`[WebSocket] User connected: ${socket.userId}`);

            // Track user's socket connections
            if (socket.userId) {
                if (!this.userSockets.has(socket.userId)) {
                    this.userSockets.set(socket.userId, new Set());
                }
                this.userSockets.get(socket.userId)!.add(socket.id);
            }

            // Handle disconnection
            socket.on('disconnect', () => {
                console.log(`[WebSocket] User disconnected: ${socket.userId}`);
                if (socket.userId) {
                    const userSocketSet = this.userSockets.get(socket.userId);
                    if (userSocketSet) {
                        userSocketSet.delete(socket.id);
                        if (userSocketSet.size === 0) {
                            this.userSockets.delete(socket.userId);
                        }
                    }
                }
            });

            // Handle mark as read event
            socket.on('notification:markAsRead', (notificationId: string) => {
                // This will be handled by the API, but we can acknowledge
                socket.emit('notification:marked', { notificationId });
            });
        });
    }

    // Send notification to specific user
    public sendNotificationToUser(userId: string, notification: any) {
        const userSocketIds = this.userSockets.get(userId);
        if (userSocketIds && userSocketIds.size > 0) {
            userSocketIds.forEach((socketId) => {
                this.io.to(socketId).emit('notification:new', notification);
            });
            console.log(`[WebSocket] Sent notification to user ${userId} (${userSocketIds.size} connections)`);
        } else {
            console.log(`[WebSocket] User ${userId} not connected, notification saved to DB only`);
        }
    }

    // Send notification to multiple users
    public sendNotificationToUsers(userIds: string[], notification: any) {
        userIds.forEach((userId) => {
            this.sendNotificationToUser(userId, notification);
        });
    }

    // Broadcast notification update (e.g., marked as read)
    public sendNotificationUpdate(userId: string, update: any) {
        const userSocketIds = this.userSockets.get(userId);
        if (userSocketIds && userSocketIds.size > 0) {
            userSocketIds.forEach((socketId) => {
                this.io.to(socketId).emit('notification:update', update);
            });
        }
    }

    public getIO() {
        return this.io;
    }

    public getConnectedUsersCount(): number {
        return this.userSockets.size;
    }
}

export let wsManager: WebSocketManager | null = null;

export function initializeWebSocket(httpServer: HTTPServer): WebSocketManager {
    wsManager = new WebSocketManager(httpServer);
    console.log('[WebSocket] Server initialized');
    return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
    return wsManager;
}
