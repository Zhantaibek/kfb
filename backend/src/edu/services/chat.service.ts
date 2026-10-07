import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors.js';
import { chatRepository } from '../repositories/chat.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { enrollmentRepository } from '../repositories/enrollment.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { prisma } from '../config/prisma.js';
import type { AuthUser } from '../types/auth.js';

function assertParticipant(
  conversation: { studentId: string; teacherId: string },
  actor: AuthUser,
) {
  if (actor.role === 'ADMIN') return;
  if (actor.role === 'STUDENT' && conversation.studentId === actor.id) return;
  if (actor.role === 'TEACHER' && conversation.teacherId === actor.id) return;
  throw new ForbiddenError();
}

export const chatService = {
  async list(actor: AuthUser) {
    const items = await chatRepository.listForActor(actor.id, actor.role);
    const unreadTotal = await chatRepository.unreadTotal(actor.id, actor.role);
    return {
      items: items.map(({ messages, _count, ...rest }) => ({
        ...rest,
        lastMessage: messages[0] ?? null,
        unreadCount: _count.messages,
      })),
      unreadTotal,
    };
  },

  async contacts(actor: AuthUser) {
    if (actor.role === 'STUDENT') {
      const enrollments = await enrollmentRepository.listByUser(actor.id);
      return enrollments.map((e) => ({
        courseId: e.course.id,
        courseTitle: e.course.title,
        peer: e.course.teacher,
      }));
    }

    if (actor.role === 'TEACHER') {
      const enrollments = await prisma.enrollment.findMany({
        where: { course: { teacherId: actor.id } },
        include: {
          course: { select: { id: true, title: true } },
          user: { select: { id: true, email: true, role: true, profile: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return enrollments.map((e) => ({
        courseId: e.course.id,
        courseTitle: e.course.title,
        peer: e.user,
      }));
    }

    const enrollments = await prisma.enrollment.findMany({
      include: {
        course: { select: { id: true, title: true, teacher: { select: { id: true, email: true, role: true, profile: true } } } },
        user: { select: { id: true, email: true, role: true, profile: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return enrollments.map((e) => ({
      courseId: e.course.id,
      courseTitle: e.course.title,
      peer: e.user,
      teacher: e.course.teacher,
    }));
  },

  async open(actor: AuthUser, input: { courseId: string; studentId?: string }) {
    const course = await courseRepository.findById(input.courseId);
    if (!course) throw new NotFoundError('Course');

    let studentId = input.studentId;
    if (actor.role === 'STUDENT') {
      studentId = actor.id;
      const enrollment = await enrollmentRepository.findByUserAndCourse(actor.id, input.courseId);
      if (!enrollment) throw new ForbiddenError('Сначала купите или запишитесь на курс');
    } else if (actor.role === 'TEACHER') {
      if (course.teacherId !== actor.id) throw new ForbiddenError();
      if (!studentId) throw new ValidationError('Укажите студента');
      const enrollment = await enrollmentRepository.findByUserAndCourse(studentId, input.courseId);
      if (!enrollment) throw new ForbiddenError('Студент не записан на ваш курс');
    } else {
      if (!studentId) throw new ValidationError('Укажите студента');
    }

    const existing = await chatRepository.findByCourseAndStudent(input.courseId, studentId!);
    if (existing) return existing;

    return chatRepository.create({
      courseId: input.courseId,
      studentId: studentId!,
      teacherId: course.teacherId,
    });
  },

  async get(id: string, actor: AuthUser) {
    const conversation = await chatRepository.findById(id);
    if (!conversation) throw new NotFoundError('Conversation');
    assertParticipant(conversation, actor);
    const messages = await chatRepository.listMessages(id);
    await chatRepository.markRead(id, actor.id);
    return { ...conversation, messages };
  },

  async listMessages(id: string, actor: AuthUser, after?: string) {
    const conversation = await chatRepository.findById(id);
    if (!conversation) throw new NotFoundError('Conversation');
    assertParticipant(conversation, actor);
    const messages = await chatRepository.listMessages(id, after);
    await chatRepository.markRead(id, actor.id);
    return messages;
  },

  async send(id: string, actor: AuthUser, body: string) {
    const conversation = await chatRepository.findById(id);
    if (!conversation) throw new NotFoundError('Conversation');
    assertParticipant(conversation, actor);

    const message = await chatRepository.createMessage({
      conversationId: id,
      senderId: actor.id,
      body: body.trim(),
    });

    const recipientId =
      actor.id === conversation.studentId ? conversation.teacherId : conversation.studentId;

    await notificationRepository.create({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: 'Новое сообщение',
      message: `Сообщение по курсу «${conversation.course.title}»`,
      meta: { conversationId: id, courseId: conversation.courseId },
    });

    return message;
  },

  async markRead(id: string, actor: AuthUser) {
    const conversation = await chatRepository.findById(id);
    if (!conversation) throw new NotFoundError('Conversation');
    assertParticipant(conversation, actor);
    await chatRepository.markRead(id, actor.id);
    return { ok: true };
  },
};
