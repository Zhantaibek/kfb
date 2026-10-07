import type { Prisma } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const enrollmentRepository = {
  findByUserAndCourse(userId: string, courseId: string) {
    return prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { progress: true, course: true },
    });
  },

  create(data: { userId: string; courseId: string; totalLessons: number }) {
    return prisma.enrollment.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        totalLessons: data.totalLessons,
        lastActivityAt: new Date(),
      },
      include: { course: true },
    });
  },

  update(id: string, data: Prisma.EnrollmentUpdateInput) {
    return prisma.enrollment.update({
      where: { id },
      data,
      include: { progress: true, course: true },
    });
  },

  listByUser(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            teacher: { include: { profile: true } },
            category: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  upsertProgress(enrollmentId: string, lessonId: string) {
    return prisma.progress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    });
  },

  countCompleted(enrollmentId: string) {
    return prisma.progress.count({
      where: { enrollmentId, completed: true },
    });
  },
};
