import jwt from 'jsonwebtoken';
import type { Role } from '../prisma-client/index.js';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/auth.js';
import { UnauthorizedError } from './errors.js';

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { email: user.email, role: user.role },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions,
  );
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
