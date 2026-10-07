import { createHash, randomBytes, randomInt } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors.js';
import { telegramService } from './telegram.service.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const LINK_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex');
}

function generateOtp() {
  return String(randomInt(1000, 9999));
}

export const telegramOtpService = {
  isEnabled() {
    return env.TELEGRAM_2FA_ENABLED;
  },

  canBypass() {
    return env.NODE_ENV !== 'production' && env.TELEGRAM_2FA_BYPASS;
  },

  async createLinkToken(userId: string) {
    if (!telegramService.botUsername()) {
      throw new ValidationError(
        'Telegram-бот не настроен. Укажите TELEGRAM_BOT_USERNAME в .env',
      );
    }

    await prisma.telegramLinkToken.deleteMany({
      where: { userId, usedAt: null },
    });

    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + LINK_TTL_MS);
    await prisma.telegramLinkToken.create({
      data: { userId, token, expiresAt },
    });

    const startPayload = `link_${token}`;
    const url = telegramService.deepLink(startPayload);
    if (!url) {
      throw new ValidationError('Не удалось сформировать ссылку Telegram');
    }

    return { url, expiresAt, token: startPayload };
  },

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true, telegramUsername: true, telegram2faEnabled: true },
    });
    return {
      linked: Boolean(user?.telegramChatId),
      username: user?.telegramUsername ?? null,
      botUsername: telegramService.botUsername() || null,
      featureAvailable: this.isEnabled(),
      twoFactorEnabled: Boolean(user?.telegram2faEnabled),
    };
  },

  async set2fa(userId: string, enabled: boolean) {
    if (!this.isEnabled()) {
      throw new ValidationError('Двухфакторная аутентификация недоступна на сервере');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true, telegram2faEnabled: true },
    });
    if (!user) throw new UnauthorizedError();

    if (enabled && !user.telegramChatId) {
      throw new ValidationError('Сначала привяжите Telegram');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { telegram2faEnabled: enabled },
    });

    return {
      twoFactorEnabled: enabled,
      linked: Boolean(user.telegramChatId),
    };
  },

  async unlink(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: null, telegramUsername: null, telegram2faEnabled: false },
    });
    return { linked: false, twoFactorEnabled: false };
  },

  async handleStartLink(chatId: number, username: string | undefined, startArg: string) {
    if (!startArg.startsWith('link_')) {
      await telegramService.sendMessage(
        chatId,
        'Это бот кодов входа в учебный центр КФБ.\n\nЧтобы привязать аккаунт, откройте ссылку из регистрации или из «Настройки → Telegram» и нажмите Start.',
      );
      return;
    }

    const raw = startArg.slice('link_'.length);
    const link = await prisma.telegramLinkToken.findUnique({ where: { token: raw } });
    if (!link || link.usedAt || link.expiresAt < new Date()) {
      await telegramService.sendMessage(
        chatId,
        'Ссылка для привязки недействительна или истекла. Создайте новую в регистрации или в настройках учебного центра.',
      );
      return;
    }

    const chatIdStr = String(chatId);

    // Временно: один Telegram можно привязать к нескольким аккаунтам
    const user = await prisma.user.update({
      where: { id: link.userId },
      data: {
        telegramChatId: chatIdStr,
        telegramUsername: username ?? null,
        telegram2faEnabled: true,
      },
    });
    await prisma.telegramLinkToken.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    await telegramService.sendMessage(
      chatId,
      `Telegram привязан к <code>${user.email}</code>. Сейчас пришлю код подтверждения.`,
    );
    await this.issueChallenge(user.id, chatIdStr, user.email);
  },

  async getOpenChallenge(userId: string) {
    const challenge = await prisma.telegramOtpChallenge.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });
    if (!challenge) return null;
    return { challengeId: challenge.id, expiresAt: challenge.expiresAt };
  },

  async issueChallenge(userId: string, chatId: string, email?: string) {
    await prisma.telegramOtpChallenge.deleteMany({ where: { userId } });

    const code = generateOtp();
    const challenge = await prisma.telegramOtpChallenge.create({
      data: {
        userId,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    const accountLine = email ? `\nАккаунт: <code>${email}</code>\n` : '';
    const text =
      `<b>Код входа в учебный центр КФБ</b>${accountLine}\n` +
      `<code>${code}</code>\n\n` +
      `4 цифры, действует 5 минут. Никому не сообщайте код.`;

    if (this.canBypass() && !telegramService.isConfigured()) {
      console.info(`[telegram-otp] BYPASS code for user ${userId}: ${code}`);
    } else {
      await telegramService.sendMessage(chatId, text);
      if (this.canBypass()) {
        console.info(`[telegram-otp] code for user ${userId}: ${code}`);
      }
    }

    return { challengeId: challenge.id, expiresAt: challenge.expiresAt };
  },

  async verifyChallenge(challengeId: string, code: string) {
    const challenge = await prisma.telegramOtpChallenge.findUnique({
      where: { id: challengeId },
      include: { user: { include: { profile: true } } },
    });

    if (!challenge) throw new UnauthorizedError('Код не найден. Войдите снова.');
    if (challenge.expiresAt < new Date()) {
      await prisma.telegramOtpChallenge.delete({ where: { id: challengeId } }).catch(() => undefined);
      throw new UnauthorizedError('Код истёк. Войдите снова.');
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      await prisma.telegramOtpChallenge.delete({ where: { id: challengeId } }).catch(() => undefined);
      throw new ForbiddenError('Слишком много попыток. Войдите снова.');
    }

    const ok = hashCode(code.trim()) === challenge.codeHash;
    if (!ok) {
      await prisma.telegramOtpChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });
      throw new ValidationError('Неверный код');
    }

    await prisma.telegramOtpChallenge.delete({ where: { id: challengeId } });
    return challenge.user;
  },
};
