import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { parsePagination } from '../utils/helpers.js';
import { prisma } from '../config/prisma.js';
import { assignmentRepository } from '../repositories/assignment.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { enrollmentRepository } from '../repositories/enrollment.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import type { AuthUser } from '../types/auth.js';

export const assignmentService = {
  async list(query: Record<string, unknown>, actor: AuthUser) {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });
    const { items, total } = await assignmentRepository.list({
      skip,
      take: limit,
      courseId: query.courseId as string | undefined,
      search: query.search as string | undefined,
      teacherId: actor.role === 'TEACHER' ? actor.id : undefined,
      enrolledUserId: actor.role === 'STUDENT' ? actor.id : undefined,
    });
    return { data: items, meta: { page, limit, total } };
  },

  async getById(id: string, actor: AuthUser) {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) throw new NotFoundError('Assignment');

    if (actor.role === 'TEACHER' && assignment.course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    if (actor.role === 'STUDENT') {
      const enrollment = await enrollmentRepository.findByUserAndCourse(actor.id, assignment.courseId);
      if (!enrollment) throw new ForbiddenError('Сначала купите курс, чтобы открыть задания');
      return {
        ...assignment,
        submissions: assignment.submissions.filter((s) => s.studentId === actor.id),
      };
    }

    return assignment;
  },

  async create(
    input: {
      courseId: string;
      title: string;
      description: string;
      deadline?: string | null;
      materialUrl?: string | null;
    },
    actor: AuthUser,
  ) {
    const course = await courseRepository.findById(input.courseId);
    if (!course) throw new NotFoundError('Course');
    if (actor.role === 'TEACHER' && course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }

    const assignment = await assignmentRepository.create({
      title: input.title,
      description: input.description,
      deadline: input.deadline ? new Date(input.deadline) : null,
      materialUrl: input.materialUrl,
      course: { connect: { id: input.courseId } },
      creator: { connect: { id: actor.id } },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: course.id },
      select: { userId: true },
    });

    await Promise.all(
      enrollments.map((enrollment) =>
        notificationRepository.create({
          userId: enrollment.userId,
          type: 'NEW_ASSIGNMENT',
          title: 'Новое задание',
          message: `Новое задание «${assignment.title}» по курсу «${course.title}»`,
          meta: { assignmentId: assignment.id, courseId: course.id },
        }),
      ),
    );

    return assignment;
  },

  async update(id: string, input: Record<string, unknown>, actor: AuthUser) {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) throw new NotFoundError('Assignment');
    if (actor.role === 'TEACHER' && assignment.creatorId !== actor.id) {
      throw new ForbiddenError();
    }

    return assignmentRepository.update(id, {
      ...input,
      ...(input.deadline !== undefined
        ? { deadline: input.deadline ? new Date(String(input.deadline)) : null }
        : {}),
    });
  },

  async submit(
    id: string,
    studentId: string,
    input: { textAnswer?: string; fileUrl?: string | null; linkUrl?: string | null },
  ) {
    const assignment = await assignmentRepository.findById(id);
    if (!assignment) throw new NotFoundError('Assignment');

    const enrollment = await enrollmentRepository.findByUserAndCourse(studentId, assignment.courseId);
    if (!enrollment) throw new ForbiddenError('Сначала купите курс, чтобы сдавать задания');

    const now = new Date();
    const isLate = assignment.deadline ? now > assignment.deadline : false;

    const submission = await assignmentRepository.upsertSubmission({
      assignmentId: id,
      studentId,
      textAnswer: input.textAnswer,
      fileUrl: input.fileUrl,
      linkUrl: input.linkUrl,
      status: isLate ? 'LATE' : 'SUBMITTED',
      submittedAt: now,
    });

    await notificationRepository.create({
      userId: assignment.creatorId,
      type: 'NEW_COMMENT',
      title: 'Сдача задания',
      message: `Студент отправил работу по заданию «${assignment.title}»`,
      meta: { assignmentId: id, submissionId: submission.id },
    });

    return submission;
  },

  async review(
    submissionId: string,
    input: { grade: number; comment?: string },
    actor: AuthUser,
  ) {
    const submission = await assignmentRepository.findSubmissionById(submissionId);
    if (!submission) throw new NotFoundError('Submission');

    if (
      actor.role === 'TEACHER' &&
      submission.assignment.course.teacherId !== actor.id
    ) {
      throw new ForbiddenError();
    }

    const reviewed = await assignmentRepository.reviewSubmission(submissionId, {
      grade: input.grade,
      comment: input.comment,
      status: 'REVIEWED',
      reviewedAt: new Date(),
    });

    await notificationRepository.create({
      userId: submission.studentId,
      type: 'ASSIGNMENT_REVIEWED',
      title: 'Задание проверено',
      message: `Ваше задание «${submission.assignment.title}» проверено. Оценка: ${input.grade}`,
      meta: { submissionId, grade: input.grade },
    });

    return reviewed;
  },
};
