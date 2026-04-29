import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly notificationService: NotificationService) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) {
      // 将socket添加到用户的房间
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // 用户加入个人房间
      client.join(`user:${userId}`);

      // 发送未读数量
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', unreadCount);

      console.log(`User ${userId} connected with socket ${client.id}`);
    } else {
      // 未认证的连接断开
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    console.log(`Socket ${client.id} disconnected`);
  }

  // 发送通知给特定用户
  async sendNotificationToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification', notification);

    // 更新未读数量
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unread_count', unreadCount);
  }

  // 广播系统公告给所有用户
  async broadcastSystemNotification(notification: Notification) {
    this.server.emit('notification', notification);

    // 更新所有用户的未读数量
    const allUsers = Array.from(this.userSockets.keys());
    for (const userId of allUsers) {
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.server.to(`user:${userId}`).emit('unread_count', unreadCount);
    }
  }

  // 客户端请求刷新未读数量
  @SubscribeMessage('refresh_unread_count')
  async handleRefreshUnreadCount(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) {
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', unreadCount);
    }
  }

  // 获取在线状态
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  // 获取在线用户列表
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
