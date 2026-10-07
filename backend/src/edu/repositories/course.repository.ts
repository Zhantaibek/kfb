import type { CourseLevel, CourseStatus, Prisma } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const courseRepository = {
  findById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        teacher: { include: { profile: true } },
        category: true,
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
        _count: { select: { enrollments: true, assignments: true, reviews: true } },
      },
    });
  },

  findBySlug(slug: string) {
    return prisma.course.findUnique({ where: { slug } });
  },

  async list(params: {
    skip: number;
    take: number;
    search?: string;
    status?: CourseStatus;
    categoryId?: string;
    teacherId?: string;
    level?: CourseLevel;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: Prisma.CourseWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.teacherId ? { teacherId: params.teacherId } : {}),
      ...(params.level ? { level: params.level } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.CourseOrderByWithRelationInput =
      params.sortBy === 'price'
        ? { price: params.sortOrder ?? 'asc' }
        : params.sortBy === 'rating'
          ? { rating: params.sortOrder ?? 'desc' }
          : params.sortBy === 'title'
            ? { title: params.sortOrder ?? 'asc' }
            : { createdAt: params.sortOrder ?? 'desc' };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: {
          teacher: { include: { profile: true } },
          category: true,
          _count: { select: { enrollments: true, reviews: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return { items, total };
  },

  create(data: Prisma.CourseCreateInput) {
    return prisma.course.create({
      data,
      include: {
        teacher: { include: { profile: true } },
        category: true,
        _count: { select: { enrollments: true } },
      },
    });
  },

  update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({
      where: { id },
      data,
      include: {
        teacher: { include: { profile: true } },
        category: true,
        _count: { select: { enrollments: true } },
      },
    });
  },

  delete(id: string) {
    return prisma.course.delete({ where: { id } });
  },
};
