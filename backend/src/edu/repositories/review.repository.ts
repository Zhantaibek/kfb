import { prisma } from '../config/prisma.js';

const reviewInclude = {
  user: { include: { profile: true } },
} as const;

export const reviewRepository = {
  listByCourse(courseId: string) {
    return prisma.courseReview.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: reviewInclude,
    });
  },

  findByUserAndCourse(userId: string, courseId: string) {
    return prisma.courseReview.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: reviewInclude,
    });
  },

  create(data: { userId: string; courseId: string; rating: number; comment: string }) {
    return prisma.courseReview.create({
      data,
      include: reviewInclude,
    });
  },

  averageRating(courseId: string) {
    return prisma.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: true,
    });
  },
};
