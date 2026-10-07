import bcrypt from 'bcryptjs';
import type { Role } from '../prisma-client/index.js';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors.js';
import { signToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { magicLinkService } from './magic-link.service.js';
import { emailService } from './email.service.js';

function sanitizeUser(user: {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  profile?: unknown;
  passwordHash?: string;
  [key: string]: unknown;
}) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

function issueToken(user: {
  id: string;
  email: string;
  role: Role;
  status: string;
  createdAt: Date;
  profile?: unknown;
  passwordHash?: string;
}) {
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return { user: sanitizeUser(user), token };
}

export const authService = {
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'STUDENT';
  }) {
    const email = input.email.toLowerCase();
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await userRepository.create({
      email,
      passwordHash,
      role: 'STUDENT',
      firstName: input.firstName,
      lastName: input.lastName,
    });

    if (!emailService.isConfigured()) {
      throw new ConflictError('Отправка email не настроена на сервере');
    }

    return magicLinkService.sendForUser(user.id, user.email);
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (user.status === 'BLOCKED') throw new UnauthorizedError('Account is blocked');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    return issueToken(user);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ValidationError('Неверный текущий пароль');

    if (currentPassword === newPassword) {
      throw new ValidationError('Новый пароль должен отличаться от текущего');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.update(userId, { passwordHash });
    return { message: 'Пароль обновлён' };
  },

  async requestMagicLink(email: string) {
    if (!emailService.isConfigured()) {
      throw new ConflictError('Отправка email не настроена на сервере');
    }

    const user = await userRepository.findByEmail(email.toLowerCase());
    const generic = {
      message: 'Если аккаунт существует, мы отправили код для входа',
    };

    if (!user || user.status === 'BLOCKED') {
      return generic;
    }

    const sent = await magicLinkService.sendForUser(user.id, user.email);
    return {
      ...generic,
      delivered: sent.delivered,
    };
  },

  async verifyMagicLink(token: string) {
    const user = await magicLinkService.verify(token);
    return issueToken(user);
  },

  async verifyEmailOtp(email: string, code: string) {
    const user = await magicLinkService.verifyOtp(email, code);
    return issueToken(user);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new UnauthorizedError();
    return sanitizeUser(user);
  },
};
