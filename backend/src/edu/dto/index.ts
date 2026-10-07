import type { Role, UserStatus } from '../prisma-client/index.js';

export interface UserDto {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface CourseDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  teacherId: string;
  categoryId: string;
}
