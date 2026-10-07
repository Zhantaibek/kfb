import { createHash, randomBytes, randomInt } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { emailService } from './email.service.js';

const TTL_MS = () => env.MAGIC_LINK_TTL_MIN * 60 * 1000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

function buildVerifyUrl(rawToken: string) {
  const base = env.APP_URL.replace(/\/$/, '');
  return `${base}/auth/verify?token=${encodeURIComponent(rawToken)}`;
}

export const magicLinkService = {
  async sendForUser(userId: string, email: string) {
    await prisma.magicLinkToken.deleteMany({
      where: { userId, usedAt: null },
    });

    const rawToken = randomBytes(32).toString('hex');
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + TTL_MS());

    await prisma.magicLinkToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        codeHash: hashToken(otp),
        expiresAt,
      },
    });

    const linkUrl = buildVerifyUrl(rawToken);
    const sent = await emailService.sendMagicLink(email, linkUrl, otp);

    return {
      message: sent.delivered
        ? 'Проверьте почту — мы отправили код для входа'
        : 'Не удалось отправить письмо',
      expiresAt,
      delivered: sent.delivered,
    };
  },

  async verify(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const record = await prisma.magicLinkToken.findUnique({
      where: { tokenHash },
      include: {
        user: { include: { profile: true } },
      },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedError('Ссылка недействительна или истекла');
    }

    if (record.user.status === 'BLOCKED') {
      throw new UnauthorizedError('Account is blocked');
    }

    await prisma.magicLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return record.user;
  },

  async verifyOtp(email: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
    if (!user || user.status === 'BLOCKED') {
      throw new UnauthorizedError('Неверный код');
    }

    const record = await prisma.magicLinkToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        codeHash: hashToken(code.trim()),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new ValidationError('Код неверный или истёк');
    }

    await prisma.magicLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return user;
  },
};
