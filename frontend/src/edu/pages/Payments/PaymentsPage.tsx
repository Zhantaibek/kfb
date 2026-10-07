import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Payment } from '../../types';
import { PageHeader, Card, Badge, EmptyState, Skeleton } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { formatDate, formatMoney, fullName, statusLabel } from '../../utils';
import { useAuthStore } from '../../store/authStore';

const methodLabel: Record<string, string> = {
  QR: 'QR-код',
  MOCK: 'Mock',
  PAYPAL: 'PayPal',
  BANK_TRANSFER: 'Перевод',
  CARD: 'Карта',
};

export function PaymentsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Payment[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    // Раздел открыт только админу и студенту (см. маршруты); при смене фильтра прежний список виден до ответа.
    if (!isAdmin && !isStudent) return;
    const endpoint = isAdmin ? '/payments' : '/payments/mine';
    api
      .get(endpoint, {
        params: {
          status: status || undefined,
          search: isAdmin ? search || undefined : undefined,
          limit: 50,
        },
      })
      .then((res) => setItems(res.data.data))
      .catch(() => toast.error('Не удалось загрузить оплаты'))
      .finally(() => setLoading(false));
  }, [status, search, user, isAdmin, isStudent]);

  const summary = useMemo(() => {
    const paid = items.filter((p) => p.status === 'PAID');
    const failed = items.filter((p) => p.status === 'FAILED');
    const revenue = paid.reduce((sum, p) => sum + Number(p.amount), 0);
    return { paid: paid.length, failed: failed.length, revenue };
  }, [items]);

  return (
    <div className={isStudent ? 'mx-auto max-w-6xl px-4 py-8 sm:px-6' : undefined}>
      <PageHeader
        title={isStudent ? 'Заказы и прогресс' : 'Оплаты'}
        description={
          isStudent
            ? 'Информация о ваших оплатах и доступе к курсам'
            : 'Транзакции и статусы платежей'
        }
      />

      {!loading && items.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <Card className="border-brand-200 bg-gradient-to-br from-brand-50/80 to-panel p-4 dark:border-brand-800 dark:from-brand-900/30 dark:to-panel-dark">
            <div className="text-xs font-medium text-kse-muted">Успешные</div>
            <div className="mt-1 font-display text-2xl font-bold">{summary.paid}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-kse-muted">Сумма (PAID)</div>
            <div className="mt-1 font-display text-2xl font-bold text-brand-700 dark:text-brand-300">
              {formatMoney(summary.revenue)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs font-medium text-kse-muted">Отклонённые</div>
            <div className="mt-1 font-display text-2xl font-bold text-rose-600">{summary.failed}</div>
          </Card>
        </div>
      )}

      <Card className={`mb-4 grid gap-3 p-3 ${isAdmin ? 'md:grid-cols-2' : ''}`}>
        {isAdmin && (
          <Input placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
        )}
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="PENDING">Ожидает</option>
          <option value="PAID">Оплачен</option>
          <option value="FAILED">Ошибка</option>
          <option value="REFUNDED">Возврат</option>
        </Select>
      </Card>
      {loading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Платежей нет"
          description={isStudent ? 'Откройте курс и нажмите «Купить» для mock-оплаты' : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-kse-surface/90 backdrop-blur dark:bg-border-dark/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-kse-muted">
                  {isAdmin && <th className="px-4 py-3">Студент</th>}
                  <th className="px-4 py-3">Курс</th>
                  <th className="px-4 py-3">Сумма</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Способ</th>
                  <th className="px-4 py-3">Дата</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-kse-border/70 transition hover:bg-brand-50/40 dark:border-border-dark dark:hover:bg-brand-900/20"
                  >
                    {isAdmin && <td className="px-4 py-3 font-medium">{fullName(p.user)}</td>}
                    <td className="px-4 py-3">{p.course?.title}</td>
                    <td
                      className={`px-4 py-3 font-bold tabular-nums ${
                        p.status === 'PAID'
                          ? 'text-brand-700 dark:text-brand-300'
                          : p.status === 'FAILED'
                            ? 'text-rose-600'
                            : ''
                      }`}
                    >
                      {formatMoney(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.status === 'PAID' ? 'green' : p.status === 'FAILED' ? 'rose' : 'amber'}>
                        {statusLabel(p.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-kse-muted">{methodLabel[p.paymentMethod] ?? p.paymentMethod}</td>
                    <td className="px-4 py-3 text-kse-muted">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
