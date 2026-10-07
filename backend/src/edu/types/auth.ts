import type { Role } from '../prisma-client/index.js';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
