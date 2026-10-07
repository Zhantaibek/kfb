import type { Prisma, SubmissionStatus } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const assignmentRepository = {
  async list(params: {
    skip: number;
    take: number;
    courseId?: string;
    search?: string;
    teacherId?: string;
    enrolledUserId?: string;
  }) {
    const where: Prisma.AssignmentWhereInput = {
      ...(params.courseId ? { courseId: params.courseId } : {}),
      ...(params.teacherId ? { course: { teacherId: params.teacherId } } : {}),
      ...(params.enrolledUserId
        ? { course: { enrollments: { some: { userId: params.enrolledUserId } } } }
        : {}),
      ...(params.search
        ? { title: { contains: params.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true } },
          creator: { include: { profile: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.assignment.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        creator: { include: { profile: true } },
        submissions: {
          include: { student: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  },

  create(data: Prisma.AssignmentCreateInput) {
    return prisma.assignment.create({
      data,
      include: {
        course: { select: { id: true, title: true } },
        creator: { include: { profile: true } },
      },
    });
  },

  update(id: string, data: Prisma.AssignmentUpdateInput) {
    return prisma.assignment.update({
      where: { id },
      data,
      include: {
        course: { select: { id: true, title: true } },
        creator: { include: { profile: true } },
      },
    });
  },

  upsertSubmission(data: {
    assignmentId: string;
    studentId: string;
    textAnswer?: string;
    fileUrl?: string | null;
    linkUrl?: string | null;
    status: SubmissionStatus;
    submittedAt: Date;
  }) {
    return prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: data.assignmentId,
          studentId: data.studentId,
        },
      },
      create: data,
      update: {
        textAnswer: data.textAnswer,
        fileUrl: data.fileUrl,
        linkUrl: data.linkUrl,
        status: data.status,
        submittedAt: data.submittedAt,
      },
      include: { assignment: true, student: { include: { profile: true } } },
    });
  },

  reviewSubmission(
    id: string,
    data: { grade: number; comment?: string; status: SubmissionStatus; reviewedAt: Date },
  ) {
    return prisma.submission.update({
      where: { id },
      data,
      include: { assignment: true, student: { include: { profile: true } } },
    });
  },

  findSubmissionById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: { assignment: { include: { course: true } }, student: true },
    });
  },
};
