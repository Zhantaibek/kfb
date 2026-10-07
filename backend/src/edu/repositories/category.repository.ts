import { prisma } from '../config/prisma.js';
import type { Prisma } from '../prisma-client/index.js';

export const categoryRepository = {
  list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { courses: true } } },
    });
  },

  findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } },
    });
  },

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
