import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { AuthShell } from '../../components/auth/AuthShell';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils';

export function MagicLinkVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const verifyMagicLink = useAuthStore((s) => s.verifyMagicLink);
  const token = params.get('token') ?? '';
  // Нет токена в ссылке — ошибка известна сразу, проверять нечего.
  const [error, setError] = useState<string | null>(
    token ? null : 'В ссылке нет токена. Запросите новую ссылку для входа.',
  );
  const [loading, setLoading] = useState(Boolean(token));
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        await verifyMagicLink(token);
        if (cancelled) return;
        setDone(true);
        setLoading(false);
        window.setTimeout(() => navigate('/dashboard', { replace: true }), 700);
      } catch (e) {
        if (cancelled) return;
        const msg = getErrorMessage(e);
        setError(
          /истек|истёк|expired|недействительн/i.test(msg)
            ? 'Ссылка устарела или уже была использована. Запросите новую — это займёт несколько секунд.'
            : msg,
        );
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, verifyMagicLink, navigate]);

  return (
    <AuthShell>
      <div className="text-center">
        {loading && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-brand-600" size={36} />
            <h1 className="font-display text-xl font-bold text-ink dark:text-white">Входим…</h1>
            <p className="mt-2 text-sm text-kse-muted">Подтверждаем ссылку из письма</p>
          </>
        )}

        {!loading && done && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={40} />
            <h1 className="font-display text-xl font-bold text-ink dark:text-white">Готово</h1>
            <p className="mt-2 text-sm text-kse-muted">Открываем учебный центр…</p>
          </>
        )}

        {!loading && !done && (
          <>
            <ShieldAlert className="mx-auto mb-4 text-amber-500" size={40} />
            <h1 className="font-display text-xl font-bold text-ink dark:text-white">
              Не удалось войти
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-kse-muted">
              {error ?? 'Ссылка недействительна'}
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Получить новую ссылку
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
