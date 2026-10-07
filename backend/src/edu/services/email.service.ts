import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/errors.js';

function smtpFrom() {
  let from = env.SMTP_FROM.trim();
  if (
    (from.startsWith('"') && from.endsWith('"')) ||
    (from.startsWith("'") && from.endsWith("'"))
  ) {
    from = from.slice(1, -1);
  }
  return from;
}

function createTransport() {
  if (!env.SMTP_HOST) {
    throw new ValidationError('SMTP не настроен. Укажите SMTP_HOST в .env');
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
    tls: env.NODE_ENV === 'production' ? undefined : { rejectUnauthorized: false },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const emailService = {
  isConfigured() {
    return Boolean(env.SMTP_HOST);
  },

  async sendMagicLink(to: string, linkUrl: string, code: string) {
    const transport = createTransport();
    const minutes = env.MAGIC_LINK_TTL_MIN;
    const safeLink = escapeHtml(linkUrl);
    const safeCode = escapeHtml(code);
    const subject = 'Код входа в Учебный центр КФБ';
    const text = [
      'Здравствуйте!',
      '',
      'Ваш код для входа в Учебный центр КФБ:',
      code,
      '',
      `Код действует ${minutes} мин. и используется один раз.`,
      'Можно также открыть ссылку:',
      linkUrl,
      '',
      'Если вы не запрашивали вход — просто проигнорируйте это письмо.',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f7f8;font-family:Segoe UI,Arial,Helvetica,sans-serif;color:#1e2c32">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f8;padding:32px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e1e5e8">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center">
              <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#51adba">Учебный центр КФБ</div>
              <h1 style="margin:16px 0 0;font-size:22px;line-height:1.3;color:#1e2c32">Код для входа</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px;text-align:center;font-size:15px;line-height:1.55;color:#5b6b73">
              Введите этот код на странице входа.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 28px">
              <div style="display:inline-block;letter-spacing:.28em;font-size:32px;font-weight:800;font-family:Consolas,Menlo,monospace;background:#f4f7f8;border:1px solid #e1e5e8;border-radius:12px;padding:14px 22px;color:#1e2c32">
                ${safeCode}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 8px;text-align:center;font-size:13px;color:#8b949a">
              Код действует ${minutes} минут и может быть использован один раз.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 28px 8px">
              <a href="${safeLink}"
                 style="display:inline-block;color:#348191;font-size:13px;font-weight:600">
                Или войти по ссылке
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;font-size:12px;line-height:1.5;color:#9aa4ab;border-top:1px solid #eef2f3">
              Если вы не запрашивали вход, проигнорируйте письмо.<br/>
              Никому не сообщайте код.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    if (env.NODE_ENV !== 'production') {
      console.log(`[email] Login code for ${to}: ${code}`);
      console.log(`[email] Magic link for ${to}: ${linkUrl}`);
    }

    try {
      const from = smtpFrom();
      await transport.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      return { delivered: true as const };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error('[email] send failed:', reason);
      return { delivered: false as const };
    }
  },
};
