import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  QrCode,
  Receipt,
  ShieldCheck,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Course, Payment } from '../../types';
import { Button } from '../ui/Button';
import { cn, formatMoney, getErrorMessage } from '../../utils';

type PayMethod = 'CARD' | 'QR';
type Step = 'checkout' | 'processing' | 'success' | 'failed';

interface MockPaymentModalProps {
  course: Pick<Course, 'id' | 'title' | 'price' | 'coverUrl'>;
  open: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function formatCardNumber(value: string) {
  return digitsOnly(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

function detectBrand(num: string): 'visa' | 'mastercard' | 'mir' | 'unknown' {
  const d = digitsOnly(num);
  if (d.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'mastercard';
  if (d.startsWith('2') || d.startsWith('220')) return 'mir';
  return 'unknown';
}

function BrandMark({ brand }: { brand: ReturnType<typeof detectBrand> }) {
  if (brand === 'visa') {
    return (
      <span className="rounded bg-[#1A1F71] px-2 py-0.5 text-[10px] font-black italic tracking-tight text-white">
        VISA
      </span>
    );
  }
  if (brand === 'mastercard') {
    return (
      <span className="relative flex h-5 w-8 items-center justify-center">
        <span className="absolute left-0 h-4 w-4 rounded-full bg-[#EB001B]" />
        <span className="absolute right-0 h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
      </span>
    );
  }
  if (brand === 'mir') {
    return (
      <span className="rounded bg-gradient-to-r from-[#0D4CD3] to-[#00A0E3] px-1.5 py-0.5 text-[9px] font-bold text-white">
        МИР
      </span>
    );
  }
  return <CreditCard size={16} className="text-white/70" />;
}

const PROCESS_STEPS = [
  'Подключение к платёжному шлюзу…',
  'Проверка карты банком-эмитентом…',
  'Авторизация суммы…',
  'Подтверждение транзакции…',
];

const QR_PROCESS_STEPS = [
  'Ожидание подтверждения из банка…',
  'Проверка QR-платежа…',
  'Зачисление средств…',
  'Открытие доступа к курсу…',
];

function formatTimer(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Закрытая модалка ничего не рисует; при каждом открытии форма монтируется заново — со свежими значениями. */
export function MockPaymentModal(props: MockPaymentModalProps) {
  if (!props.open) return null;
  return <PaymentCheckout {...props} />;
}

function PaymentCheckout({ course, open, onClose, onSuccess }: MockPaymentModalProps) {
  const [method, setMethod] = useState<PayMethod>('CARD');
  const [step, setStep] = useState<Step>('checkout');
  const [processMsg, setProcessMsg] = useState(PROCESS_STEPS[0]);
  const [email, setEmail] = useState('student@edu.local');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [holder, setHolder] = useState('TEST USER');
  const [saveCard, setSaveCard] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [txId] = useState(() => `txn_${Math.random().toString(36).slice(2, 12)}`);
  const [qrSeconds, setQrSeconds] = useState(10 * 60);

  const amount = Number(course.price);
  const fee = Math.round(amount * 0.02);
  const total = amount;
  const brand = detectBrand(cardNumber);
  const last4 = digitsOnly(cardNumber).slice(-4);

  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        v: 1,
        merchant: 'EduCRM',
        courseId: course.id,
        title: course.title,
        amount: total,
        currency: 'KGS',
        tx: txId || 'pending',
      }),
    [course.id, course.title, total, txId],
  );

  const receiptNo = useMemo(
    () => (payment?.id ? `RCP-${payment.id.slice(-8).toUpperCase()}` : txId),
    [payment, txId],
  );

  useEffect(() => {
    if (!open || method !== 'QR' || step !== 'checkout') return;
    const id = window.setInterval(() => {
      setQrSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, method, step]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('checkout-open');
    return () => document.body.classList.remove('checkout-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'processing') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, step]);


  const validate = () => {
    if (!email.includes('@')) {
      toast.error('Укажите email для чека');
      return false;
    }
    if (method === 'CARD') {
      if (digitsOnly(cardNumber).length < 16) {
        toast.error('Введите полный номер карты');
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        toast.error('Срок действия: ММ/ГГ');
        return false;
      }
      const [mm] = expiry.split('/').map(Number);
      if (mm < 1 || mm > 12) {
        toast.error('Некорректный месяц');
        return false;
      }
      if (digitsOnly(cvc).length < 3) {
        toast.error('Введите CVC / CVV');
        return false;
      }
      if (!holder.trim()) {
        toast.error('Укажите имя на карте');
        return false;
      }
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    setStep('processing');
    const steps = method === 'QR' ? QR_PROCESS_STEPS : PROCESS_STEPS;
    let i = 0;
    setProcessMsg(steps[0]);
    const timer = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1);
      setProcessMsg(steps[i]);
    }, 700);

    await new Promise((r) => setTimeout(r, 2800));
    clearInterval(timer);

    const apiMethod = method === 'QR' ? 'QR' : 'CARD';

    try {
      const { data } = await api.post('/payments', {
        courseId: course.id,
        paymentMethod: apiMethod,
        cardLast4: method === 'CARD' ? last4 || undefined : undefined,
      });
      const result = data.data as Payment;
      setPayment(result);
      if (result.status === 'PAID') {
        setStep('success');
        onSuccess(result);
      } else {
        setStep('failed');
      }
    } catch (e) {
      setStep('failed');
      toast.error(getErrorMessage(e));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-[#061014]/40"
        disabled={step === 'processing'}
        onClick={() => step !== 'processing' && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-kse-border bg-panel shadow-[0_32px_80px_-20px_rgba(10,20,24,0.55)] animate-fade-up sm:max-h-[90vh] sm:rounded-3xl dark:border-border-dark dark:bg-panel-dark"
      >
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-kse-border px-4 py-3 sm:px-5 dark:border-border-dark">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm">
              <Lock size={14} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">EduCRM Checkout</div>
              <div className="flex items-center gap-1.5 text-[11px] text-kse-muted">
                <ShieldCheck size={11} className="text-brand-500" />
                Защищённое соединение · демо-режим
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={step === 'processing'}
            onClick={onClose}
            className="rounded-xl p-2 text-kse-gray transition hover:bg-kse-surface disabled:opacity-40 dark:hover:bg-border-dark"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === 'checkout' && (
            <div className="grid lg:grid-cols-[1.05fr_1.2fr]">
              {/* Order summary */}
              <aside className="border-b border-kse-border bg-gradient-to-b from-brand-50/90 via-kse-surface/50 to-panel p-5 sm:p-6 lg:border-b-0 lg:border-r dark:border-border-dark dark:from-brand-900/25 dark:via-panel-dark dark:to-panel-dark">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
                  Ваш заказ
                </p>
                <div className="mt-4 flex gap-3">
                  {course.coverUrl ? (
                    <img
                      src={course.coverUrl}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover shadow-md ring-1 ring-black/5"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-md">
                      <Receipt size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold leading-snug tracking-tight">{course.title}</div>
                    <div className="mt-1 text-xs text-kse-muted">Онлайн-курс · бессрочный доступ</div>
                  </div>
                </div>

                <div className="mt-6 space-y-2.5 text-sm">
                  <div className="flex justify-between text-kse-muted">
                    <span>Стоимость курса</span>
                    <span className="font-medium text-ink dark:text-white">{formatMoney(amount)}</span>
                  </div>
                  <div className="flex justify-between text-kse-muted">
                    <span>Комиссия шлюза</span>
                    <span className="font-medium text-emerald-600">0 сом</span>
                  </div>
                  <div className="flex justify-between text-xs text-kse-gray">
                    <span>Расчётная комиссия (~2%)</span>
                    <span className="line-through">{formatMoney(fee)}</span>
                  </div>
                  <div className="border-t border-dashed border-kse-border pt-3 dark:border-border-dark">
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-medium">Итого к оплате</span>
                      <span className="font-display text-2xl font-extrabold tracking-tight text-brand-600">
                        {formatMoney(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 hidden rounded-2xl border border-brand-100 bg-white/70 p-3 text-xs text-kse-muted lg:block dark:border-brand-800 dark:bg-panel-dark/60">
                  <div className="font-semibold text-ink dark:text-white">Подсказка</div>
                  <div className="mt-1.5 space-y-1 text-[11px]">
                    <div>
                      Карта · успех <span className="font-mono text-brand-700">…4242</span>, отказ{' '}
                      <span className="font-mono text-rose-600">…0000</span>
                    </div>
                    <div>QR · отсканируйте код и нажмите «Я оплатил»</div>
                  </div>
                </div>
              </aside>

              {/* Payment form */}
              <div className="p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kse-muted">
                  Способ оплаты
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'CARD' as const, label: 'Карта', icon: CreditCard },
                      { id: 'QR' as const, label: 'QR-код', icon: QrCode },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMethod(m.id);
                        if (m.id === 'QR') setQrSeconds(10 * 60);
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-xs font-semibold transition',
                        method === m.id
                          ? 'border-brand-400 bg-brand-50 text-brand-700 shadow-[0_0_0_3px_rgba(81,173,186,0.2)] dark:bg-brand-800/35 dark:text-brand-200'
                          : 'border-kse-border text-kse-muted hover:border-brand-200 hover:bg-kse-surface dark:border-border-dark',
                      )}
                    >
                      <m.icon size={18} />
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 space-y-3.5">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium">Email для чека</span>
                    <div className="relative">
                      <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kse-gray" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full rounded-xl border border-kse-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark"
                        placeholder="you@email.com"
                      />
                    </div>
                  </label>

                  {method === 'CARD' && (
                    <>
                      {/* Live card */}
                      <div className="checkout-card relative overflow-hidden rounded-kse bg-gradient-to-br from-[#0e3339] via-[#1a6d7a] to-[#4eacb9] p-5 text-white shadow-lg">
                        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                        <div className="pointer-events-none absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-brand-300/20 blur-2xl" />
                        <div className="relative flex items-start justify-between">
                          <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-400/80 opacity-90 shadow-inner" />
                          <BrandMark brand={brand} />
                        </div>
                        <div className="relative mt-7 font-mono text-[1.15rem] tracking-[0.18em] sm:text-xl">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>
                        <div className="relative mt-5 flex justify-between text-[11px] uppercase tracking-wider text-white/80">
                          <div>
                            <div className="opacity-60">Владелец</div>
                            <div className="mt-0.5 font-semibold tracking-wide text-white">
                              {holder || 'YOUR NAME'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="opacity-60">Срок</div>
                            <div className="mt-0.5 font-semibold tracking-wide text-white">
                              {expiry || 'MM/YY'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium">Номер карты</span>
                        <div className="relative">
                          <input
                            inputMode="numeric"
                            autoComplete="cc-number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            placeholder="ACCT-000015"
                            className="h-11 w-full rounded-xl border border-kse-border bg-white px-3 pr-16 font-mono text-sm tracking-wider outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2">
                            <BrandMark brand={brand} />
                          </span>
                        </div>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="block space-y-1.5">
                          <span className="text-sm font-medium">Срок</span>
                          <input
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={expiry}
                            onChange={(e) => {
                              const d = digitsOnly(e.target.value).slice(0, 4);
                              setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                            }}
                            placeholder="MM/YY"
                            className="h-11 w-full rounded-xl border border-kse-border bg-white px-3 font-mono text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark"
                          />
                        </label>
                        <label className="block space-y-1.5">
                          <span className="text-sm font-medium">CVC</span>
                          <input
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cvc}
                            onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
                            placeholder="123"
                            className="h-11 w-full rounded-xl border border-kse-border bg-white px-3 font-mono text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark"
                          />
                        </label>
                      </div>

                      <label className="block space-y-1.5">
                        <span className="text-sm font-medium">Имя на карте</span>
                        <input
                          autoComplete="cc-name"
                          value={holder}
                          onChange={(e) => setHolder(e.target.value.toUpperCase())}
                          placeholder="IVAN IVANOV"
                          className="h-11 w-full rounded-xl border border-kse-border bg-white px-3 text-sm uppercase outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark"
                        />
                      </label>

                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-kse-muted">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="h-4 w-4 rounded border-kse-border text-brand-500 focus:ring-brand-400"
                        />
                        Сохранить карту для следующих покупок
                      </label>
                    </>
                  )}

                  {method === 'QR' && (
                    <div className="rounded-2xl border border-kse-border bg-kse-surface/50 p-4 dark:border-border-dark dark:bg-border-dark/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Smartphone size={16} className="text-brand-500" />
                          Оплата по QR
                        </div>
                        <div
                          className={cn(
                            'rounded-lg px-2 py-1 font-mono text-xs font-semibold',
                            qrSeconds < 60
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                              : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
                          )}
                        >
                          {formatTimer(qrSeconds)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col items-center">
                        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-kse-border">
                          <QRCodeSVG
                            value={qrPayload}
                            size={180}
                            level="M"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor="#102428"
                          />
                        </div>
                        <div className="mt-3 text-center">
                          <div className="font-display text-xl font-extrabold text-brand-600">
                            {formatMoney(total)}
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-kse-gray">{txId}</div>
                        </div>
                      </div>

                      <ol className="mt-4 space-y-2 text-xs leading-relaxed text-kse-muted">
                        <li className="flex gap-2">
                          <span className="font-mono font-bold text-brand-500">1</span>
                          Откройте приложение банка или кошелька
                        </li>
                        <li className="flex gap-2">
                          <span className="font-mono font-bold text-brand-500">2</span>
                          Отсканируйте QR-код и подтвердите сумму
                        </li>
                        <li className="flex gap-2">
                          <span className="font-mono font-bold text-brand-500">3</span>
                          Нажмите «Я оплатил» — система проверит платёж
                        </li>
                      </ol>

                      {qrSeconds === 0 && (
                        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/30">
                          Срок QR истёк. Выберите способ снова, чтобы обновить код.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  className="mt-6 w-full"
                  size="lg"
                  onClick={submit}
                  disabled={method === 'QR' && qrSeconds === 0}
                >
                  {method === 'QR' ? (
                    <>
                      <QrCode size={16} />
                      Я оплатил — проверить
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Оплатить {formatMoney(total)}
                    </>
                  )}
                </Button>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-kse-gray">
                  <span className="inline-flex items-center gap-1">
                    <Lock size={10} /> TLS 1.3
                  </span>
                  <span>PCI DSS mock</span>
                  <span>3-D Secure</span>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-500" />
                <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-brand-500" />
              </div>
              <div className="mt-6 font-display text-xl font-bold tracking-tight">Обработка платежа</div>
              <p className="mt-2 max-w-xs text-sm text-kse-muted">{processMsg}</p>
              <div className="mt-6 w-full max-w-xs">
                <div className="h-1.5 overflow-hidden rounded-full bg-kse-border dark:bg-border-dark">
                  <div className="checkout-progress h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
                </div>
              </div>
              <p className="mt-4 font-mono text-[11px] text-kse-gray">{txId}</p>
            </div>
          )}

          {step === 'success' && (
            <div className="px-5 py-8 sm:px-8">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60 dark:bg-emerald-950/50 dark:ring-emerald-950/30">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">Оплата прошла успешно</h2>
                <p className="mt-2 text-sm text-kse-muted">
                  Чек отправлен на <span className="font-medium text-ink dark:text-white">{email}</span>
                </p>
              </div>

              <div className="mx-auto mt-7 max-w-md overflow-hidden rounded-2xl border border-kse-border bg-kse-surface/40 dark:border-border-dark dark:bg-border-dark/30">
                <div className="border-b border-dashed border-kse-border bg-panel px-4 py-3 dark:border-border-dark dark:bg-panel-dark">
                  <div className="flex items-center justify-between text-xs text-kse-muted">
                    <span className="inline-flex items-center gap-1 font-semibold text-ink dark:text-white">
                      <Receipt size={14} /> Электронный чек
                    </span>
                    <span className="font-mono">{receiptNo}</span>
                  </div>
                </div>
                <div className="space-y-2.5 px-4 py-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-kse-muted">Курс</span>
                    <span className="max-w-[60%] text-right font-medium">{course.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kse-muted">Способ</span>
                    <span className="font-medium">
                      {method === 'CARD' ? `Карта ·••• ${last4}` : 'QR-код'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kse-muted">Дата</span>
                    <span className="font-medium">{new Date().toLocaleString('ru-RU')}</span>
                  </div>
                  <div className="flex justify-between border-t border-kse-border pt-3 dark:border-border-dark">
                    <span className="font-semibold">Списано</span>
                    <span className="font-display text-lg font-extrabold text-brand-600">
                      {formatMoney(payment?.amount ?? total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={onClose}>
                  Перейти к курсу
                </Button>
                <Button className="flex-1" variant="secondary" onClick={onClose}>
                  Закрыть
                </Button>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="px-5 py-10 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 ring-8 ring-rose-50/50 dark:bg-rose-950/40 dark:ring-rose-950/20">
                <XCircle className="h-9 w-9 text-rose-500" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">Платёж отклонён</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-kse-muted">
                Банк-эмитент отклонил операцию. Код:{' '}
                <span className="font-mono font-semibold text-rose-600">05 — Do not honor</span>
              </p>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-left text-xs text-kse-muted dark:border-rose-900/40 dark:bg-rose-950/20">
                Попробуйте карту <code className="font-mono text-brand-700">4242 4242 4242 4242</code> или другой
                способ оплаты. Карты с окончанием <code className="font-mono text-rose-600">0000</code> всегда
                отклоняются в демо.
              </div>
              <div className="mx-auto mt-6 flex max-w-sm flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => {
                    setStep('checkout');
                    setCardNumber('4242 4242 4242 4242');
                  }}
                >
                  <ChevronLeft size={16} />
                  Изменить данные
                </Button>
                <Button className="flex-1" onClick={submit}>
                  Повторить оплату
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
