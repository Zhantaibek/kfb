import { ConflictError, NotFoundError } from '../utils/errors.js';
import { calcProgressPercent, slugify } from '../utils/helpers.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { enrollmentRepository } from '../repositories/enrollment.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { paymentRepository } from '../repositories/payment.repository.js';

export const categoryService = {
  list() {
    return categoryRepository.list();
  },

  async create(input: { name: string; description?: string }) {
    const slug = slugify(input.name);
    return categoryRepository.create({
      name: input.name,
      slug,
      description: input.description,
    });
  },

  async update(id: string, input: { name?: string; description?: string }) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    return categoryRepository.update(id, {
      ...input,
      ...(input.name ? { slug: slugify(input.name) } : {}),
    });
  },

  async remove(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    await categoryRepository.delete(id);
    return { id };
  },
};

export const enrollmentService = {
  async enroll(userId: string, courseId: string) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    if (course.status !== 'PUBLISHED') {
      throw new ConflictError('Course is not available for enrollment');
    }

    const existing = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existing) throw new ConflictError('Already enrolled');

    if (Number(course.price) > 0) {
      const paid = await paymentRepository.findPaidByUserAndCourse(userId, courseId);
      if (!paid) {
        throw new ConflictError('Оплатите курс перед записью (mock-оплата на странице курса)');
      }
    }

    const totalLessons = await lessonRepository.countByCourse(courseId);
    const enrollment = await enrollmentRepository.create({ userId, courseId, totalLessons });

    await notificationRepository.create({
      userId: course.teacherId,
      type: 'ENROLLMENT',
      title: 'Новый студент',
      message: `Студент записался на курс «${course.title}»`,
      meta: { courseId, userId },
    });

    return enrollment;
  },

  listMine(userId: string) {
    return enrollmentRepository.listByUser(userId);
  },

  async completeLesson(userId: string, courseId: string, lessonId: string) {
    const enrollment = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) throw new NotFoundError('Enrollment');

    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson || lesson.module.courseId !== courseId) {
      throw new NotFoundError('Lesson');
    }

    await enrollmentRepository.upsertProgress(enrollment.id, lessonId);
    const completedLessons = await enrollmentRepository.countCompleted(enrollment.id);
    const totalLessons = await lessonRepository.countByCourse(courseId);
    const progressPercent = calcProgressPercent(completedLessons, totalLessons);
    const completedAt = progressPercent >= 100 ? new Date() : null;

    const updated = await enrollmentRepository.update(enrollment.id, {
      completedLessons,
      totalLessons,
      progressPercent,
      lastActivityAt: new Date(),
      completedAt,
    });

    if (completedAt) {
      await notificationRepository.create({
        userId,
        type: 'COURSE_COMPLETED',
        title: 'Курс завершён',
        message: `Вы завершили курс «${enrollment.course.title}»`,
        meta: { courseId },
      });
    }

    const estimatedCompletion =
      progressPercent > 0 && progressPercent < 100
        ? Math.ceil((100 - progressPercent) / (progressPercent / Math.max(completedLessons, 1)))
        : progressPercent >= 100
          ? 0
          : null;

    return {
      ...updated,
      estimatedCompletionDays: estimatedCompletion,
    };
  },

  async getProgress(userId: string, courseId: string) {
    const enrollment = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (!enrollment) throw new NotFoundError('Enrollment');
    return enrollment;
  },
};
