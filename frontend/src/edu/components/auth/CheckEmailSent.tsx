import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Inbox, Mail } from 'lucide-react';
import { Button } from '../ui/Button';

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain || !local) return email;
  if (local.length <= 2) return `${local[0] ?? ''}••@${domain}`;
  return `${local.slice(0, 2)}•••@${domain}`;
}

function mailAppHref(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (domain.includes('gmail') || domain.includes('googlemail')) {
    return 'https://mail.google.com/mail/u/0/#inbox';
  }
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return 'https://outlook.live.com/mail/0/inbox';
  }
  if (domain.includes('yahoo')) {
    return 'https://mail.yahoo.com/';
  }
  if (domain.endsWith('.kg') || domain.includes('mail.ru') || domain.includes('yandex')) {
    return domain.includes('yandex') ? 'https://mail.yandex.ru/' : 'https://e.mail.ru/inbox';
  }
  return null;
}

export function CheckEmailSent({
  email,
  title = 'Код из письма',
  description,
  onVerifyCode,
  onResend,
  onChangeEmail,
  resending,
}: {
  email: string;
  title?: string;
  description?: ReactNode;
  onVerifyCode: (code: string) => Promise<void>;
  onResend: () => Promise<void> | void;
  onChangeEmail: () => void;
  resending?: boolean;
}) {
  const [cooldown, setCooldown] = useState(60);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const mailHref = mailAppHref(email);

  // Сменили email — заново отсчёт и пустой код (прямо в рендере, без лишнего прохода эффекта).
  const [codeFor, setCodeFor] = useState(email);
  if (codeFor !== email) {
    setCodeFor(email);
    setCooldown(60);
    setCode('');
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    await onResend();
    setCooldown(60);
  };

  const handleVerify = async (event?: FormEvent) => {
    event?.preventDefault();
    const digits = code.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6 || verifying) return;
    setVerifying(true);
    try {
      await onVerifyCode(digits);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Inbox size={28} />
      </div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-kse-muted dark:text-kse-gray">
        {description ?? (
          <>
            Код отправлен на{' '}
            <span className="font-semibold text-ink dark:text-white">{maskEmail(email)}</span>
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-kse-muted">
        Откройте письмо и введите 6 цифр. Если письма нет — проверьте «Спам».
      </p>

      <form className="mt-6 space-y-3" onSubmit={(e) => void handleVerify(e)}>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="______"
          className="w-full rounded-xl border border-kse-line bg-white px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em] text-ink outline-none focus:border-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          aria-label="Код из письма"
        />
        <Button className="w-full" size="lg" disabled={verifying || code.length !== 6}>
          {verifying ? 'Проверяем…' : 'Войти'}
        </Button>
      </form>

      <div className="mt-5 flex flex-col gap-3">
        {mailHref && (
          <a
            href={mailHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-kse-muted hover:text-brand-600"
          >
            <Mail size={16} />
            Открыть почту
          </a>
        )}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={cooldown > 0 || resending}
          onClick={() => void handleResend()}
        >
          {resending
            ? 'Отправка…'
            : cooldown > 0
              ? `Отправить снова через ${cooldown} с`
              : 'Отправить код снова'}
        </Button>

        <button
          type="button"
          className="w-full text-sm font-medium text-kse-muted transition hover:text-brand-600"
          onClick={onChangeEmail}
        >
          Указать другой email
        </button>
      </div>
    </div>
  );
}
