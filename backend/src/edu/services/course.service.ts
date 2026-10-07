import type { CourseLevel, CourseStatus } from '../prisma-client/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { parsePagination, slugify } from '../utils/helpers.js';
import { courseRepository } from '../repositories/course.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { enrollmentRepository } from '../repositories/enrollment.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import type { AuthUser } from '../types/auth.js';

function lockCourseContent<T extends { modules?: Array<{ lessons: Array<Record<string, unknown>> }> }>(
  course: T,
) {
  return {
    ...course,
    locked: true as const,
    modules: (course.modules ?? []).map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        content: null,
        videoUrl: null,
        fileUrl: null,
        linkUrl: null,
      })),
    })),
  };
}

export const courseService = {
  async list(query: Record<string, unknown>, actor?: AuthUser) {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });

    let teacherId = query.teacherId as string | undefined;
    if (actor?.role === 'TEACHER' && !teacherId) {
      teacherId = actor.id;
    }

    let status = query.status as CourseStatus | undefined;
    if (actor?.role === 'STUDENT' && !status) {
      status = 'PUBLISHED';
    }

    const { items, total } = await courseRepository.list({
      skip,
      take: limit,
      search: query.search as string | undefined,
      status,
      categoryId: query.categoryId as string | undefined,
      teacherId,
      level: query.level as CourseLevel | undefined,
      sortBy: query.sortBy as string | undefined,
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
    });

    return { data: items, meta: { page, limit, total } };
  },

  async getById(id: string, actor?: AuthUser) {
    const course = await courseRepository.findById(id);
    if (!course) throw new NotFoundError('Course');

    if (!actor || actor.role === 'ADMIN') {
      return { ...course, locked: false as const };
    }
    if (actor.role === 'TEACHER') {
      if (course.teacherId !== actor.id) return lockCourseContent(course);
      return { ...course, locked: false as const };
    }

    const enrollment = await enrollmentRepository.findByUserAndCourse(actor.id, id);
    if (enrollment) return { ...course, locked: false as const };
    return lockCourseContent(course);
  },

  async create(
    input: {
      title: string;
      description: string;
      coverUrl?: string | null;
      categoryId: string;
      level?: CourseLevel;
      durationHours?: number;
      price: number;
      teacherId?: string;
      status?: CourseStatus;
    },
    actor: AuthUser,
  ) {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) throw new NotFoundError('Category');

    const teacherId = actor.role === 'ADMIN' && input.teacherId ? input.teacherId : actor.id;
    if (actor.role === 'STUDENT') throw new ForbiddenError();

    let slug = slugify(input.title);
    const existing = await courseRepository.findBySlug(slug);
    if (existing) slug = `${slug}-${Date.now()}`;

    return courseRepository.create({
      title: input.title,
      slug,
      description: input.description,
      coverUrl: input.coverUrl ?? null,
      level: input.level ?? 'BEGINNER',
      durationHours: input.durationHours ?? 0,
      price: input.price,
      status: input.status ?? 'DRAFT',
      teacher: { connect: { id: teacherId } },
      category: { connect: { id: input.categoryId } },
      modules: {
        create: {
          title: 'Видео',
          order: 1,
        },
      },
    });
  },

  async ensureDefaultModule(courseId: string) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    const existing = course.modules[0];
    if (existing) return existing;

    return lessonRepository.createModule({
      title: 'Видео',
      order: 1,
      course: { connect: { id: courseId } },
    });
  },

  async addVideo(
    courseId: string,
    input: {
      title: string;
      description?: string;
      videoUrl?: string;
      videoUrls?: string[];
      imageUrls?: string[];
      order?: number;
    },
    actor: AuthUser,
  ) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    if (actor.role === 'TEACHER' && course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }

    const module = await this.ensureDefaultModule(courseId);
    const videoCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
    const imageUrls = input.imageUrls?.filter(Boolean) ?? [];
    const videoUrls = [
      ...(input.videoUrls ?? []),
      ...(input.videoUrl ? [input.videoUrl] : []),
    ].filter((url, i, arr) => url && arr.indexOf(url) === i);

    return lessonRepository.create({
      title: input.title,
      contentType: videoUrls.length ? 'VIDEO' : 'IMAGE',
      content: input.description ?? null,
      videoUrl: videoUrls[0] ?? null,
      fileUrl: imageUrls[0] ?? null,
      linkUrl: null,
      videoUrls,
      imageUrls,
      durationMin: 0,
      order: input.order ?? videoCount + 1,
      module: { connect: { id: module.id } },
    });
  },

  async updateVideo(
    id: string,
    input: {
      title?: string;
      description?: string;
      videoUrl?: string | null;
      videoUrls?: string[];
      imageUrls?: string[];
      order?: number;
    },
    actor: AuthUser,
  ) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) throw new NotFoundError('Lesson');
    if (actor.role === 'TEACHER' && lesson.module.course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.content = input.description;
    if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl;
    if (input.videoUrls !== undefined) {
      data.videoUrls = input.videoUrls;
      data.videoUrl = input.videoUrls[0] ?? null;
    }
    if (input.order !== undefined) data.order = input.order;
    if (input.imageUrls !== undefined) {
      data.imageUrls = input.imageUrls;
      data.fileUrl = input.imageUrls[0] ?? null;
    }
    const nextVideos =
      input.videoUrls ??
      (input.videoUrl !== undefined ? [input.videoUrl].filter(Boolean) : lesson.videoUrls?.length ? lesson.videoUrls : [lesson.videoUrl].filter(Boolean));
    const nextImages = input.imageUrls ?? lesson.imageUrls;
    data.contentType = nextVideos.length ? 'VIDEO' : nextImages.length ? 'IMAGE' : lesson.contentType;

    return lessonRepository.update(id, data);
  },

  async update(id: string, input: Record<string, unknown>, actor: AuthUser) {
    const course = await courseRepository.findById(id);
    if (!course) throw new NotFoundError('Course');
    if (actor.role === 'TEACHER' && course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    if (actor.role === 'STUDENT') throw new ForbiddenError();

    const data: Record<string, unknown> = { ...input };
    if (input.title) {
      let slug = slugify(String(input.title));
      const existing = await courseRepository.findBySlug(slug);
      if (existing && existing.id !== id) slug = `${slug}-${Date.now()}`;
      data.slug = slug;
    }
    if (input.categoryId) {
      data.category = { connect: { id: input.categoryId } };
      delete data.categoryId;
    }
    if (input.teacherId && actor.role === 'ADMIN') {
      data.teacher = { connect: { id: input.teacherId } };
      delete data.teacherId;
    } else {
      delete data.teacherId;
    }

    return courseRepository.update(id, data);
  },

  async remove(id: string, actor: AuthUser) {
    const course = await courseRepository.findById(id);
    if (!course) throw new NotFoundError('Course');
    if (actor.role === 'TEACHER' && course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    await courseRepository.delete(id);
    return { id };
  },

  async addModule(courseId: string, title: string, order: number | undefined, actor: AuthUser) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    if (actor.role === 'TEACHER' && course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }

    const nextOrder = order ?? course.modules.length + 1;
    return lessonRepository.createModule({
      title,
      order: nextOrder,
      course: { connect: { id: courseId } },
    });
  },

  async updateModule(id: string, input: { title?: string; order?: number }, actor: AuthUser) {
    const module = await lessonRepository.findModuleById(id);
    if (!module) throw new NotFoundError('Module');
    if (actor.role === 'TEACHER' && module.course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    return lessonRepository.updateModule(id, input);
  },

  async deleteModule(id: string, actor: AuthUser) {
    const module = await lessonRepository.findModuleById(id);
    if (!module) throw new NotFoundError('Module');
    if (actor.role === 'TEACHER' && module.course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    await lessonRepository.deleteModule(id);
    return { id };
  },

  async addLesson(
    courseId: string,
    input: {
      moduleId: string;
      title: string;
      contentType?: 'VIDEO' | 'TEXT' | 'PDF' | 'LINK' | 'ASSIGNMENT' | 'IMAGE';
      content?: string;
      videoUrl?: string | null;
      fileUrl?: string | null;
      linkUrl?: string | null;
      videoUrls?: string[];
      imageUrls?: string[];
      durationMin?: number;
      order?: number;
    },
    actor: AuthUser,
  ) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    if (actor.role === 'TEACHER' && course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }

    const module = course.modules.find((m) => m.id === input.moduleId);
    if (!module) throw new NotFoundError('Module');

    return lessonRepository.create({
      title: input.title,
      contentType: input.contentType ?? 'TEXT',
      content: input.content,
      videoUrl: input.videoUrl,
      fileUrl: input.fileUrl,
      linkUrl: input.linkUrl,
      videoUrls: input.videoUrls ?? [],
      imageUrls: input.imageUrls ?? [],
      durationMin: input.durationMin ?? 0,
      order: input.order ?? module.lessons.length + 1,
      module: { connect: { id: input.moduleId } },
    });
  },

  async updateLesson(id: string, input: Record<string, unknown>, actor: AuthUser) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) throw new NotFoundError('Lesson');
    if (actor.role === 'TEACHER' && lesson.module.course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    return lessonRepository.update(id, input);
  },

  async deleteLesson(id: string, actor: AuthUser) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) throw new NotFoundError('Lesson');
    if (actor.role === 'TEACHER' && lesson.module.course.teacherId !== actor.id) {
      throw new ForbiddenError();
    }
    await lessonRepository.delete(id);
    return { id };
  },

  async listLessons(courseId: string, actor?: AuthUser) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course');
    if (actor?.role === 'ADMIN' || (actor?.role === 'TEACHER' && course.teacherId === actor.id)) {
      return lessonRepository.listByCourse(courseId);
    }
    if (actor) {
      const enrollment = await enrollmentRepository.findByUserAndCourse(actor.id, courseId);
      if (enrollment) return lessonRepository.listByCourse(courseId);
    }
    throw new ForbiddenError('Сначала купите курс, чтобы открыть уроки');
  },
};
