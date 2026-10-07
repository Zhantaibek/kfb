import bcrypt from 'bcryptjs';
import type { Role, UserStatus } from '../prisma-client/index.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { parsePagination } from '../utils/helpers.js';
import { userRepository } from '../repositories/user.repository.js';
import type { AuthUser } from '../types/auth.js';

export const userService = {
  async listStudents(query: Record<string, unknown>, actor: AuthUser) {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });
    const enrolledInTeacherId = actor.role === 'TEACHER' ? actor.id : undefined;
    const { items, total } = await userRepository.list({
      skip,
      take: limit,
      search: query.search as string | undefined,
      role: 'STUDENT',
      status: query.status as UserStatus | undefined,
      sortBy: query.sortBy as string | undefined,
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
      enrolledInTeacherId,
    });

    const data = items.map((u) => {
      const avgProgress =
        u.enrollments.length > 0
          ? u.enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / u.enrollments.length
          : 0;
      const { passwordHash: _, enrollments, ...rest } = u;
      return {
        ...rest,
        coursesCount: enrolledInTeacherId ? enrollments.length : u._count.enrollments,
        progress: Math.round(avgProgress * 10) / 10,
      };
    });

    return { data, meta: { page, limit, total } };
  },

  async listTeachers(query: Record<string, unknown>) {
    const { page, limit, skip } = parsePagination(query as { page?: string; limit?: string });
    const { items, total } = await userRepository.list({
      skip,
      take: limit,
      search: query.search as string | undefined,
      role: 'TEACHER',
      status: query.status as UserStatus | undefined,
      sortBy: query.sortBy as string | undefined,
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
    });

    const data = items.map((u) => {
      const { passwordHash: _, enrollments, ...rest } = u;
      return { ...rest, coursesCount: u._count.taughtCourses };
    });

    return { data, meta: { page, limit, total } };
  },

  async getById(id: string, actor?: AuthUser) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    if (actor?.role === 'TEACHER') {
      const mine = user.enrollments.some((e) => e.course.teacherId === actor.id);
      if (!mine && user.id !== actor.id) throw new ForbiddenError();
    }
    const { passwordHash: _, ...rest } = user;
    if (actor?.role === 'TEACHER' && user.role === 'STUDENT') {
      return {
        ...rest,
        enrollments: user.enrollments.filter((e) => e.course.teacherId === actor.id),
      };
    }
    return rest;
  },

  async create(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
    });
    const { passwordHash: _, ...rest } = user;
    return rest;
  },

  async update(id: string, input: Record<string, unknown>, actor: AuthUser) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');

    if (actor.role !== 'ADMIN' && actor.id !== id) {
      throw new ForbiddenError();
    }

    if (actor.role !== 'ADMIN') {
      delete input.status;
      delete input.role;
    }

    // Только админ может назначать роль TEACHER / ADMIN
    if (input.role !== undefined && actor.role !== 'ADMIN') {
      throw new ForbiddenError('Только администратор может менять роль');
    }

    const profileData: Record<string, unknown> = {};
    if (input.firstName !== undefined) profileData.firstName = input.firstName;
    if (input.lastName !== undefined) profileData.lastName = input.lastName;
    if (input.bio !== undefined) profileData.bio = input.bio;
    if (input.phone !== undefined) profileData.phone = input.phone;
    if (input.avatarUrl !== undefined) profileData.avatarUrl = input.avatarUrl;

    if (Object.keys(profileData).length) {
      await userRepository.updateProfile(id, profileData);
    }

    const userData: Record<string, unknown> = {};
    if (input.status !== undefined) userData.status = input.status;
    if (input.role !== undefined) userData.role = input.role;

    if (Object.keys(userData).length) {
      await userRepository.update(id, userData);
    }

    return this.getById(id, actor);
  },

  async remove(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    await userRepository.delete(id);
    return { id };
  },

  async block(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User');
    const updated = await userRepository.update(id, {
      status: user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED',
    });
    const { passwordHash: _, ...rest } = updated;
    return rest;
  },
};
