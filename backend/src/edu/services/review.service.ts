import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';
import { courseRepository } from '../repositories/course.repository.js';
import { enrollmentRepository } from '../repositories/enrollment.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { reviewRepository } from '../repositories/review.repository.js';
import type { AuthUser } from '../types/auth.js';

function isCourseCompleted(enrollment: { progressPercent: number; completedAt: Date | null }) {
  return Boolean(enrollment.completedAt) || enrollment.progressPercent >= 100;
}

async function refreshCourseRating(courseId: string) {
  const stats = await reviewRepository.averageRating(courseId);
  const rating = Math.round((stats._avg.rating ?? 0) * 10) / 10;
  await courseRepository.update(courseId, { rating });
  return { rating, reviewsCount: stats._count };
}

export const reviewService = {
  async list(courseId: string, actor?: AuthUser) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');

    const items = await reviewRepository.listByCourse(courseId);
    const myReview = actor
      ? items.find((review) => review.userId === actor.id) ?? null
      : null;

    let canReview = false;
    if (actor?.role === 'STUDENT' && !myReview) {
      const enrollment = await enrollmentRepository.findByUserAndCourse(actor.id, courseId);
      canReview = Boolean(enrollment && isCourseCompleted(enrollment));
    }

    return {
      items,
      myReview,
      canReview,
      averageRating: course.rating,
      reviewsCount: items.length,
    };
  },

  async create(
    courseId: string,
    actor: AuthUser,
    input: { rating: number; comment: string },
  ) {
    if (actor.role !== 'STUDENT') {
      throw new ForbiddenError('Оценку и комментарий может оставить только студент');
    }

    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');

    const enrollment = await enrollmentRepository.findByUserAndCourse(actor.id, courseId);
    if (!enrollment) {
      throw new ForbiddenError('Сначала купите или запишитесь на курс');
    }
    if (!isCourseCompleted(enrollment)) {
      throw new ForbiddenError('Оценка и комментарий доступны после прохождения всего курса');
    }

    const existing = await reviewRepository.findByUserAndCourse(actor.id, courseId);
    if (existing) {
      throw new ConflictError('Отзыв по этому курсу уже оставлен');
    }

    const review = await reviewRepository.create({
      userId: actor.id,
      courseId,
      rating: input.rating,
      comment: input.comment.trim(),
    });

    const stats = await refreshCourseRating(courseId);

    await notificationRepository.create({
      userId: course.teacherId,
      type: 'NEW_COMMENT',
      title: 'Новый отзыв',
      message: `Студент оценил курс «${course.title}» на ${input.rating}/5`,
      meta: { courseId, reviewId: review.id },
    });

    return { ...review, courseRating: stats.rating, reviewsCount: stats.reviewsCount };
  },
};
