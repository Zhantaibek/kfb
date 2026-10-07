import type { PaymentMethod, PaymentStatus } from '../prisma-client/index.js';
import { NotFoundError } from '../utils/errors.js';
import { parsePagination } from '../utils/helpers.js';
import { courseRepository } from '../repositories/course.repository.js';
import { enrollmentRepository } from '../repositories/enrollment.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';
import { prisma } from '../config/prisma.js';
import type { AuthUser } from '../types/auth.js';

export const paymentService = {
  async list(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });
    const { items, total } = await paymentRepository.list({
      skip,
      take: limit,
      status: query.status as PaymentStatus | undefined,
      search: query.search as string | undefined,
    });
    return { data: items, meta: { page, limit, total } };
  },

  async listMine(userId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });
    const { items, total } = await paymentRepository.listByUser(userId, {
      skip,
      take: limit,
      status: query.status as PaymentStatus | undefined,
    });
    return { data: items, meta: { page, limit, total } };
  },

  /**
   * Mock payment gateway: always creates a Payment record.
   * Fail if simulateFail=true or cardLast4 ends with "0000".
   * On success — auto-enrolls the student.
   */
  async createMock(
    userId: string,
    input: {
      courseId: string;
      paymentMethod?: PaymentMethod;
      simulateFail?: boolean;
      cardLast4?: string;
    },
  ) {
    const course = await courseRepository.findById(input.courseId);
    if (!course) throw new NotFoundError('Course');

    const fail =
      input.simulateFail === true ||
      (typeof input.cardLast4 === 'string' && input.cardLast4.endsWith('0000'));

    const payment = await paymentRepository.create({
      userId,
      courseId: input.courseId,
      amount: Number(course.price),
      status: fail ? 'FAILED' : 'PAID',
      paymentMethod: input.paymentMethod ?? 'MOCK',
      paidAt: fail ? null : new Date(),
    });

    if (fail) {
      await notificationRepository.create({
        userId,
        type: 'SYSTEM',
        title: 'Оплата не прошла',
        message: `Не удалось оплатить курс «${course.title}». Попробуйте другую карту (mock).`,
        meta: { paymentId: payment.id, courseId: course.id },
      });
      return payment;
    }

    const existing = await enrollmentRepository.findByUserAndCourse(userId, input.courseId);
    if (!existing) {
      const totalLessons = await lessonRepository.countByCourse(input.courseId);
      await enrollmentRepository.create({ userId, courseId: input.courseId, totalLessons });
    }

    await notificationRepository.create({
      userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Оплата успешна',
      message: `Оплата курса «${course.title}» прошла успешно (mock)`,
      meta: { paymentId: payment.id, courseId: course.id },
    });

    return payment;
  },
};

export const notificationService = {
  async list(userId: string) {
    const [items, unreadCount] = await Promise.all([
      notificationRepository.listByUser(userId),
      notificationRepository.unreadCount(userId),
    ]);
    return { items, unreadCount };
  },

  async markRead(id: string, userId: string) {
    await notificationRepository.markRead(id, userId);
    return { id, isRead: true };
  },

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
    return { success: true };
  },
};

export const analyticsService = {
  async dashboard(actor?: AuthUser) {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const teacherId = actor?.role === 'TEACHER' ? actor.id : undefined;
    const studentWhere = teacherId
      ? { role: 'STUDENT' as const, enrollments: { some: { course: { teacherId } } } }
      : { role: 'STUDENT' as const };
    const courseWhere = teacherId ? { teacherId } : {};
    const paymentWhere = {
      status: 'PAID' as const,
      ...(teacherId ? { course: { teacherId } } : {}),
    };

    const [
      students,
      teachers,
      courses,
      activeCourses,
      archivedCourses,
      revenue,
      newUsers,
      recentUsers,
      recentPayments,
      popularCourses,
      registrations,
      sales,
    ] = await Promise.all([
      prisma.user.count({ where: studentWhere }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.course.count({ where: courseWhere }),
      prisma.course.count({ where: { ...courseWhere, status: 'PUBLISHED' } }),
      prisma.course.count({ where: { ...courseWhere, status: 'ARCHIVED' } }),
      prisma.payment.aggregate({ where: paymentWhere, _sum: { amount: true } }),
      prisma.user.count({
        where: { ...studentWhere, createdAt: { gte: monthAgo } },
      }),
      prisma.user.findMany({
        where: teacherId ? studentWhere : {},
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      prisma.payment.findMany({
        where: paymentWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.course.findMany({
        where: courseWhere,
        take: 5,
        orderBy: { enrollments: { _count: 'desc' } },
        include: {
          category: true,
          _count: { select: { enrollments: true } },
        },
      }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
               COUNT(*)::bigint as count
        FROM "User"
        WHERE role = 'STUDENT' AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1
      `,
      prisma.$queryRaw<{ month: string; total: number }[]>`
        SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
               COALESCE(SUM(amount), 0)::float as total
        FROM "Payment"
        WHERE status = 'PAID' AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1
      `,
    ]);

    const activity = await prisma.enrollment.findMany({
      take: 8,
      orderBy: { lastActivityAt: 'desc' },
      where: {
        lastActivityAt: { not: null },
        ...(teacherId ? { course: { teacherId } } : {}),
      },
      include: {
        user: { include: { profile: true } },
        course: { select: { title: true } },
      },
    });

    return {
      stats: {
        students,
        teachers,
        courses,
        activeCourses,
        completedCourses: archivedCourses,
        revenue: Number(revenue._sum.amount ?? 0),
        newUsersMonth: newUsers,
      },
      registrationChart: registrations.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      salesChart: sales.map((s) => ({
        month: s.month,
        total: Number(s.total),
      })),
      popularCourses,
      recentUsers: recentUsers.map(({ passwordHash: _, ...u }) => u),
      recentPayments,
      activity,
    };
  },

  async students() {
    const byMonth = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
             COUNT(*)::bigint as count
      FROM "User"
      WHERE role = 'STUDENT'
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `;
    return byMonth.map((r) => ({ month: r.month, count: Number(r.count) })).reverse();
  },

  async courses() {
    const byStatus = await prisma.course.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return byStatus.map((s) => ({ status: s.status, count: s._count._all }));
  },

  async revenue() {
    const rows = await prisma.$queryRaw<{ month: string; total: number }[]>`
      SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
             COALESCE(SUM(amount), 0)::float as total
      FROM "Payment"
      WHERE status = 'PAID'
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `;
    return rows.map((r) => ({ month: r.month, total: Number(r.total) })).reverse();
  },
};
