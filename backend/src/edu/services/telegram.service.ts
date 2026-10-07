import { env } from '../config/env.js';

const TELEGRAM_API = 'https://api.telegram.org';

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string; username?: string; first_name?: string };
    from?: { id: number; username?: string; first_name?: string };
  };
};

export const telegramService = {
  isConfigured() {
    return Boolean(env.TELEGRAM_BOT_TOKEN);
  },

  botUsername() {
    return env.TELEGRAM_BOT_USERNAME.replace(/^@/, '');
  },

  async sendMessage(chatId: string | number, text: string) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      console.info('[telegram] BOT_TOKEN missing — message not sent:\n', text);
      return { ok: false as const, skipped: true as const };
    }

    const res = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      console.error('[telegram] sendMessage failed:', data.description);
      return { ok: false as const, skipped: false as const, error: data.description };
    }
    return { ok: true as const, skipped: false as const };
  },

  deepLink(startPayload: string) {
    const username = this.botUsername();
    if (!username) return null;
    return `https://t.me/${username}?start=${encodeURIComponent(startPayload)}`;
  },

  verifyWebhookSecret(headerValue: string | undefined) {
    if (!env.TELEGRAM_WEBHOOK_SECRET) return true;
    return headerValue === env.TELEGRAM_WEBHOOK_SECRET;
  },

  async deleteWebhook() {
    if (!env.TELEGRAM_BOT_TOKEN) return;
    await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`);
  },

  async getUpdates(offset: number) {
    if (!env.TELEGRAM_BOT_TOKEN) return [] as TelegramUpdate[];
    const res = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offset, timeout: 25, allowed_updates: ['message'] }),
    });
    const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[] };
    return data.ok ? (data.result ?? []) : [];
  },
};
