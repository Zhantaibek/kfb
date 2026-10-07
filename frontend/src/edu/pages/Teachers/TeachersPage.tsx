import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '../../utils/zodResolver';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { User } from '../../types';
import { PageHeader, Card, Avatar, Badge, EmptyState, Skeleton } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import { formatDate, fullName, getErrorMessage, statusLabel } from '../../utils';

const createSchema = z.object({
  firstName: z.string().min(1, 'Укажите имя'),
  lastName: z.string().min(1, 'Укажите фамилию'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type CreateForm = z.infer<typeof createSchema>;

export function TeachersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  // Состояние меняем только когда пришёл ответ: при поиске список остаётся на экране.
  const load = () =>
    api
      .get('/teachers', { params: { search: search || undefined, limit: 50 } })
      .then(({ data }) => setItems(data.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, [search]);

  const onCreate = async (values: CreateForm) => {
    try {
      await api.post('/teachers', values);
      toast.success('Преподаватель добавлен');
      form.reset();
      setFormOpen(false);
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Преподаватели"
        description="Добавлять преподавателей может только администратор"
        actions={
          <Button type="button" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? 'Скрыть форму' : 'Добавить преподавателя'}
          </Button>
        }
      />

      {formOpen && (
        <Card className="mb-4 p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-ink dark:text-white">
            Новый преподаватель
          </h2>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onCreate)}>
            <Input label="Имя" error={form.formState.errors.firstName?.message} {...form.register('firstName')} />
            <Input label="Фамилия" error={form.formState.errors.lastName?.message} {...form.register('lastName')} />
            <div className="sm:col-span-2">
              <Input
                label="Email"
                type="email"
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
            </div>
            <div className="sm:col-span-2">
              <PasswordInput
                label="Пароль"
                error={form.formState.errors.password?.message}
                {...form.register('password')}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Создание…' : 'Создать'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="mb-4 p-4">
        <Input
          placeholder="Поиск преподавателя"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>
      {loading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <EmptyState title="Преподаватели не найдены" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={fullName(t)} src={t.profile?.avatarUrl} />
                <div className="min-w-0">
                  <div className="font-semibold">{fullName(t)}</div>
                  <div className="text-sm text-slate-500">{t.email}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge tone="teal">{t.coursesCount ?? 0} курсов</Badge>
                    <Badge tone={t.status === 'ACTIVE' ? 'green' : 'rose'}>{statusLabel(t.status)}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-500">{t.profile?.bio || '—'}</p>
                  <div className="mt-3 text-xs text-slate-400">С {formatDate(t.createdAt)}</div>
                  <Link to={`/courses?teacherId=${t.id}`} className="mt-3 inline-block text-sm text-brand-700">
                    Курсы преподавателя →
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
