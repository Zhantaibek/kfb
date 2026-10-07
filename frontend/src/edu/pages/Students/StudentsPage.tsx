import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { User } from '../../types';
import { PageHeader, Card, Avatar, Badge, EmptyState, Skeleton, ProgressBar } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { formatDate, fullName, getErrorMessage, statusLabel } from '../../utils';
import { useAuthStore } from '../../store/authStore';

export function StudentsPage() {
  const user = useAuthStore((s) => s.user);
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? 1);

  // Состояние меняем только когда пришёл ответ: при смене фильтра список остаётся на экране.
  const load = () =>
    api
      .get('/students', {
        params: { search: search || undefined, status: status || undefined, page, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' },
      })
      .then(({ data }) => {
        setItems(data.data);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, [search, status, page]);

  const block = async (id: string) => {
    try {
      await api.post(`/students/${id}/block`);
      toast.success('Статус обновлён');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить студента?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Удалён');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Студенты"
        description={
          user?.role === 'TEACHER'
            ? 'Студенты, которые купили ваши курсы'
            : 'Управление студентами платформы'
        }
      />
      <Card className="mb-4 grid gap-3 p-4 md:grid-cols-3">
        <Input
          placeholder="Поиск по имени или email"
          defaultValue={search}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('search', e.target.value);
            else next.delete('search');
            next.set('page', '1');
            setParams(next);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('status', e.target.value);
            else next.delete('status');
            next.set('page', '1');
            setParams(next);
          }}
        >
          <option value="">Все статусы</option>
          <option value="ACTIVE">Активен</option>
          <option value="BLOCKED">Заблокирован</option>
        </Select>
        <div className="flex items-center text-sm text-slate-500">Всего: {meta.total}</div>
      </Card>

      {loading ? (
        <Skeleton className="h-80" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Студенты не найдены"
          description={
            user?.role === 'TEACHER'
              ? 'Здесь появятся те, кто купит ваш курс'
              : 'Измените фильтры или дождитесь регистраций'
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Студент</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Курсы</th>
                <th className="px-4 py-3 font-medium">Прогресс</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Регистрация</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={fullName(s)} src={s.profile?.avatarUrl} size="sm" />
                      <Link to={`/students/${s.id}`} className="font-medium hover:text-brand-700">
                        {fullName(s)}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.email}</td>
                  <td className="px-4 py-3">{s.coursesCount ?? 0}</td>
                  <td className="px-4 py-3 min-w-36">
                    <div className="mb-1 text-xs text-slate-500">{s.progress ?? 0}%</div>
                    <ProgressBar value={s.progress ?? 0} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'ACTIVE' ? 'green' : 'rose'}>{statusLabel(s.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/students/${s.id}`}>
                        <Button size="sm" variant="secondary">Открыть</Button>
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => block(s.id)}>
                            {s.status === 'BLOCKED' ? 'Разблок.' : 'Блок'}
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => remove(s.id)}>
                            Удалить
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('page', String(page - 1));
                setParams(next);
              }}
            >
              Назад
            </Button>
            <span className="text-sm text-slate-500">
              {page} / {meta.totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= meta.totalPages}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('page', String(page + 1));
                setParams(next);
              }}
            >
              Далее
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export function StudentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [student, setStudent] = useState<User | null>(null);

  useEffect(() => {
    api.get(`/students/${id}`).then((res) => setStudent(res.data.data));
  }, [id]);

  if (!student) return <Skeleton className="h-64" />;

  return (
    <div>
      <PageHeader title={fullName(student)} description={student.email} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={fullName(student)} src={student.profile?.avatarUrl} size="lg" />
            <div className="mt-3 font-semibold">{fullName(student)}</div>
            <div className="text-sm text-slate-500">{student.email}</div>
            <Badge tone={student.status === 'ACTIVE' ? 'green' : 'rose'}>{statusLabel(student.status)}</Badge>
            <p className="mt-4 text-sm text-slate-500">{student.profile?.bio || 'Нет описания'}</p>
          </div>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Курсы студента</h3>
          <div className="space-y-3">
            {(student.enrollments ?? []).map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link to={`/courses/${e.course.id}`} className="font-medium hover:text-brand-700">
                    {e.course.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{e.progressPercent}%</span>
                    {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate(`/messages?courseId=${e.course.id}&studentId=${student.id}`)
                        }
                      >
                        Написать
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar value={e.progressPercent} />
                </div>
              </div>
            ))}
            {(student.enrollments ?? []).length === 0 && (
              <EmptyState title="Нет записей на курсы" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
