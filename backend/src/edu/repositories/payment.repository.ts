import type { PaymentMethod, PaymentStatus, Prisma } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const paymentRepository = {
  async list(params: {
    skip: number;
    take: number;
    status?: PaymentStatus;
    search?: string;
  }) {
    const where: Prisma.PaymentWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { user: { email: { contains: params.search, mode: 'insensitive' } } },
              { course: { title: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return { items, total };
  },

  create(data: {
    userId: string;
    courseId: string;
    amount: number;
    status: PaymentStatus;
    paymentMethod: PaymentMethod;
    paidAt?: Date | null;
  }) {
    return prisma.payment.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        amount: data.amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt,
      },
      include: {
        user: { include: { profile: true } },
        course: { select: { id: true, title: true } },
      },
    });
  },

  recent(limit = 5) {
    return prisma.payment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { include: { profile: true } },
        course: { select: { id: true, title: true } },
      },
    });
  },

  totalRevenue() {
    return prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });
  },

  listByUser(userId: string, params: { skip: number; take: number; status?: PaymentStatus }) {
    const where: Prisma.PaymentWhereInput = {
      userId,
      ...(params.status ? { status: params.status } : {}),
    };
    return Promise.all([
      prisma.payment.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true, coverUrl: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]).then(([items, total]) => ({ items, total }));
  },

  findPaidByUserAndCourse(userId: string, courseId: string) {
    return prisma.payment.findFirst({
      where: { userId, courseId, status: 'PAID' },
    });
  },
};
