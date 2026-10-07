import type { Prisma } from '../prisma-client/index.js';
import { prisma } from '../config/prisma.js';

export const lessonRepository = {
  listByCourse(courseId: string) {
    return prisma.lesson.findMany({
      where: { module: { courseId } },
      orderBy: [{ module: { order: 'asc' } }, { order: 'asc' }],
      include: { module: true },
    });
  },

  findById(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      include: { module: { include: { course: true } } },
    });
  },

  create(data: Prisma.LessonCreateInput) {
    return prisma.lesson.create({ data, include: { module: true } });
  },

  update(id: string, data: Prisma.LessonUpdateInput) {
    return prisma.lesson.update({ where: { id }, data, include: { module: true } });
  },

  delete(id: string) {
    return prisma.lesson.delete({ where: { id } });
  },

  createModule(data: Prisma.ModuleCreateInput) {
    return prisma.module.create({
      data,
      include: { lessons: true },
    });
  },

  findModuleById(id: string) {
    return prisma.module.findUnique({
      where: { id },
      include: { course: true, lessons: true },
    });
  },

  updateModule(id: string, data: Prisma.ModuleUpdateInput) {
    return prisma.module.update({
      where: { id },
      data,
      include: { lessons: true },
    });
  },

  deleteModule(id: string) {
    return prisma.module.delete({ where: { id } });
  },

  countByCourse(courseId: string) {
    return prisma.lesson.count({ where: { module: { courseId } } });
  },
};
