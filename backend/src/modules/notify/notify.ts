import nodemailer from "nodemailer";

/**
 * Уведомление сотрудникам о новой заявке с сайта. Каналы включаются переменными окружения (.env):
 *   почта    — SMTP_URL (smtps://user:pass@smtp.example.kg:465) и REQUEST_NOTIFY_EMAIL (через запятую);
 *              отправитель — SMTP_FROM, по умолчанию первый адрес получателя;
 *   Telegram — TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 * Ничего не задано — заявка только сохраняется в базе и видна в админке («Заявки»).
 * Сбой доставки не мешает посетителю: заявка уже сохранена, ошибка пишется в лог.
 */

function requestText(source: string, payload: Record<string, string>) {
  const lines = Object.entries(payload)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value}`);
  return [`Новая заявка с сайта KSE — ${source}`, "", ...lines, "", "Все заявки: админ-панель → Заявки"].join("\n");
}

async function sendEmail(subject: string, text: string) {
  const smtpUrl = process.env.SMTP_URL?.trim();
  const to = process.env.REQUEST_NOTIFY_EMAIL?.trim();
  if (!smtpUrl || !to) return;
  const from = process.env.SMTP_FROM?.trim() || to.split(",")[0].trim();
  await nodemailer.createTransport(smtpUrl).sendMail({ from, to, subject, text });
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Telegram ответил ${response.status}`);
}

export async function notifyNewRequest(source: string, payload: Record<string, string>) {
  const text = requestText(source, payload);
  const [email, telegram] = await Promise.allSettled([sendEmail(`Заявка с сайта KSE — ${source}`, text), sendTelegram(text)]);
  if (email.status === "rejected") console.warn("Уведомление о заявке по почте не доставлено:", String(email.reason));
  if (telegram.status === "rejected") console.warn("Уведомление о заявке в Telegram не доставлено:", String(telegram.reason));
}
