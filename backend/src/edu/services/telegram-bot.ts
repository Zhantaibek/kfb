import { telegramOtpService } from './telegram-otp.service.js';
import { telegramService, type TelegramUpdate } from './telegram.service.js';
import { env } from '../config/env.js';

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const text = message?.text?.trim() ?? '';
  const chatId = message?.chat?.id;

  if (chatId && text.startsWith('/start')) {
    const arg = text.split(/\s+/)[1] ?? '';
    await telegramOtpService.handleStartLink(
      chatId,
      message?.from?.username ?? message?.chat?.username,
      arg,
    );
    return;
  }

  if (chatId && text) {
    await telegramService.sendMessage(
      chatId,
      'Этот бот присылает коды входа. Привяжите аккаунт через регистрацию или «Настройки → Telegram».',
    );
  }
}

export async function startTelegramPolling() {
  if (!telegramService.isConfigured()) {
    console.warn('[telegram] polling skipped: TELEGRAM_BOT_TOKEN is empty');
    return;
  }

  await telegramService.deleteWebhook();
  console.log('[telegram] polling started (no public tunnel needed)');

  let offset = 0;
  const loop = async () => {
    while (true) {
      try {
        const updates = await telegramService.getUpdates(offset);
        for (const update of updates) {
          offset = update.update_id + 1;
          try {
            await handleTelegramUpdate(update);
          } catch (err) {
            console.error('[telegram] update failed:', err);
          }
        }
      } catch (err) {
        console.error('[telegram] getUpdates failed:', err);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  };

  void loop();
}

export function shouldUseTelegramPolling() {
  if (!env.TELEGRAM_BOT_TOKEN) return false;
  if (process.env.TELEGRAM_POLLING === 'false' || process.env.TELEGRAM_POLLING === '0') return false;
  if (process.env.TELEGRAM_POLLING === 'true' || process.env.TELEGRAM_POLLING === '1') return true;
  return env.NODE_ENV !== 'production';
}
