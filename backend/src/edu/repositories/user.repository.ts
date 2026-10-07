import type { Prisma, Role, UserStatus } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        enrollments: {
          include: { course: { select: { id: true, title: true, status: true, teacherId: true } } },
        },
        _count: { select: { enrollments: true, taughtCourses: true } },
      },
    });
  },

  create(data: {
    email: string;
    passwordHash: string;
    role: Role;
    firstName: string;
    lastName: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      },
      include: { profile: true },
    });
  },

  async list(params: {
    skip: number;
    take: number;
    search?: string;
    role?: Role;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    enrolledInTeacherId?: string;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.enrolledInTeacherId
        ? { enrollments: { some: { course: { teacherId: params.enrolledInTeacherId } } } }
        : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { profile: { firstName: { contains: params.search, mode: 'insensitive' } } },
              { profile: { lastName: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput =
      params.sortBy === 'email'
        ? { email: params.sortOrder ?? 'asc' }
        : { createdAt: params.sortOrder ?? 'desc' };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          profile: true,
          _count: { select: { enrollments: true, taughtCourses: true } },
          enrollments: {
            ...(params.enrolledInTeacherId
              ? { where: { course: { teacherId: params.enrolledInTeacherId } } }
              : {}),
            select: { progressPercent: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: { profile: true, _count: { select: { enrollments: true } } },
    });
  },

  updateProfile(userId: string, data: Prisma.ProfileUpdateInput) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
