import { prisma } from '../config/prisma.js';

const personSelect = {
  id: true,
  email: true,
  role: true,
  profile: true,
} as const;

const conversationInclude = {
  course: { select: { id: true, title: true } },
  student: { select: personSelect },
  teacher: { select: personSelect },
} as const;

export const chatRepository = {
  findById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: conversationInclude,
    });
  },

  findByCourseAndStudent(courseId: string, studentId: string) {
    return prisma.conversation.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
      include: conversationInclude,
    });
  },

  create(data: { courseId: string; studentId: string; teacherId: string }) {
    return prisma.conversation.create({
      data,
      include: conversationInclude,
    });
  },

  listForActor(actorId: string, role: 'STUDENT' | 'TEACHER' | 'ADMIN') {
    const where =
      role === 'STUDENT'
        ? { studentId: actorId }
        : role === 'TEACHER'
          ? { teacherId: actorId }
          : {};

    return prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        ...conversationInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: {
          select: {
            messages: { where: { readAt: null, senderId: { not: actorId } } },
          },
        },
      },
    });
  },

  async listMessages(conversationId: string, afterId?: string) {
    let createdAfter: Date | undefined;
    if (afterId) {
      const prev = await prisma.message.findUnique({ where: { id: afterId } });
      createdAfter = prev?.createdAt;
    }
    return prisma.message.findMany({
      where: {
        conversationId,
        ...(createdAfter ? { createdAt: { gt: createdAfter } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: createdAfter ? 100 : 200,
      include: { sender: { select: personSelect } },
    });
  },

  createMessage(data: { conversationId: string; senderId: string; body: string }) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data,
        include: { sender: { select: personSelect } },
      });
      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      return message;
    });
  },

  markRead(conversationId: string, readerId: string) {
    return prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: readerId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  },

  unreadTotal(actorId: string, role: 'STUDENT' | 'TEACHER' | 'ADMIN') {
    const conversationFilter =
      role === 'STUDENT'
        ? { studentId: actorId }
        : role === 'TEACHER'
          ? { teacherId: actorId }
          : {};

    return prisma.message.count({
      where: {
        senderId: { not: actorId },
        readAt: null,
        conversation: conversationFilter,
      },
    });
  },
};
