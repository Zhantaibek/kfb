import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Wallet, Users } from 'lucide-react';
import api from '../../services/api';
import type { DashboardData, Payment } from '../../types';
import { Card, PageHeader, Skeleton } from '../../components/ui/Card';
import { formatDate, formatMoney, fullName } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../utils';
import { useStudentContentProtection } from '../../hooks/useStudentContentProtection';
import { StudentCabinet } from './StudentCabinet';

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof BookOpen;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        'p-5',
        accent &&
          'border-brand-200 bg-gradient-to-br from-brand-50/90 to-panel dark:from-brand-900/40 dark:to-panel-dark dark:border-brand-800',
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-kse-muted">{label}</div>
          <div className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</div>
        </div>
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-800/40 dark:text-brand-300">
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}

function RecentPayments({ items }: { items: Payment[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-kse-muted">Пока нет оплат</p>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 border-b border-kse-border/60 pb-3 last:border-0 last:pb-0 dark:border-border-dark"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{p.course?.title ?? 'Курс'}</div>
            <div className="text-xs text-kse-muted">
              {fullName(p.user)} · {formatDate(p.createdAt)}
            </div>
          </div>
          <div className="shrink-0 text-sm font-bold text-brand-700 dark:text-brand-300">
            {formatMoney(p.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';
  useStudentContentProtection(isStudent);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isStudent) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/analytics/dashboard');
        setData(res.data.data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user, isStudent]);

  if (isStudent) {
    return <StudentCabinet />;
  }

  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const stats = isAdmin
    ? [
        { label: 'Доход', value: formatMoney(data.stats.revenue), icon: Wallet, accent: true },
        { label: 'Студенты', value: data.stats.students, icon: Users },
        { label: 'Курсы', value: data.stats.courses, icon: BookOpen },
      ]
    : [
        { label: 'Студенты', value: data.stats.students, icon: Users, accent: true },
        { label: 'Мои курсы', value: data.stats.courses, icon: BookOpen },
        { label: 'Опубликовано', value: data.stats.activeCourses, icon: Sparkles },
      ];

  return (
    <div>
      <PageHeader title="Обзор" description={`Здравствуйте, ${fullName(user)}`} />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h3 className="mb-4 font-semibold tracking-tight">Последние оплаты</h3>
        <RecentPayments items={data.recentPayments} />
      </Card>
    </div>
  );
}
