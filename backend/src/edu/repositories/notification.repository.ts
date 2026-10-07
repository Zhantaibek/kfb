import type { NotificationType, Prisma } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const notificationRepository = {
  listByUser(userId: string, take = 30) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    meta?: Prisma.InputJsonValue;
  }) {
    return prisma.notification.create({ data });
  },

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },
};
