import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Assignment, Course, Submission } from '../../types';
import { PageHeader, Card, Badge, EmptyState, Skeleton } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { formatDate, fullName, getErrorMessage, statusLabel } from '../../utils';
import { useAuthStore } from '../../store/authStore';

export function AssignmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const createForm = useForm({
    defaultValues: { courseId: '', title: '', description: '', deadline: '', materialUrl: '' },
  });
  const submitForm = useForm({ defaultValues: { textAnswer: '', linkUrl: '' } });
  const reviewForm = useForm({ defaultValues: { grade: 90, comment: '' } });

  const load = () => {
    // Состояние меняем только когда пришёл ответ: при перезагрузке список остаётся на экране.
    return Promise.all([api.get('/assignments', { params: { limit: 50 } }), api.get('/courses', { params: { limit: 50 } })])
      .then(([a, c]) => {
        setItems(a.data.data);
        setCourses(c.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  const openAssignment = async (id: string) => {
    const { data } = await api.get(`/assignments/${id}`);
    setSelected(data.data);
  };

  const create = async (values: { courseId: string; title: string; description: string; deadline: string; materialUrl: string }) => {
    try {
      await api.post('/assignments', {
        ...values,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
        materialUrl: values.materialUrl || null,
      });
      toast.success('Задание создано');
      createForm.reset();
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const submit = async (values: { textAnswer: string; linkUrl: string }) => {
    if (!selected) return;
    try {
      await api.post(`/assignments/${selected.id}/submit`, {
        textAnswer: values.textAnswer,
        linkUrl: values.linkUrl || null,
      });
      toast.success('Работа отправлена');
      openAssignment(selected.id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const review = async (submission: Submission, values: { grade: number; comment: string }) => {
    try {
      await api.post(`/assignments/submissions/${submission.id}/review`, values);
      toast.success('Проверено');
      if (selected) openAssignment(selected.id);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className={user?.role === 'STUDENT' ? 'mx-auto max-w-6xl px-4 py-8 sm:px-6' : undefined}>
      <PageHeader
        title={user?.role === 'STUDENT' ? 'Задания' : 'Задания'}
        description={
          user?.role === 'STUDENT'
            ? 'Домашние работы по вашим курсам — сдайте ответ и дождитесь проверки'
            : 'Создание и проверка работ'
        }
      />

      {user?.role !== 'STUDENT' && (
        <Card className="mb-6 p-5">
          <h3 className="mb-4 font-semibold">Новое задание</h3>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={createForm.handleSubmit(create)}>
            <Select label="Курс" {...createForm.register('courseId')}>
              <option value="">Выберите курс</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </Select>
            <Input label="Дедлайн" type="datetime-local" {...createForm.register('deadline')} />
            <Input label="Название" {...createForm.register('title')} />
            <Input label="Материал URL" {...createForm.register('materialUrl')} />
            <div className="md:col-span-2">
              <Textarea label="Описание" {...createForm.register('description')} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Создать</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  const courseId = createForm.getValues('courseId');
                  const title = createForm.getValues('title');
                  const courseTitle = courses.find((c) => c.id === courseId)?.title ?? '';
                  try {
                    const { data } = await api.post('/assignments/generate', {
                      topic: title,
                      program: courseTitle,
                    });
                    createForm.setValue('title', data.data.title);
                    createForm.setValue('description', data.data.description);
                    toast.success('Черновик подставлен — поправьте и создайте');
                  } catch (e) {
                    toast.error(getErrorMessage(e));
                  }
                }}
              >
                Собрать черновик
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Список заданий</h3>
          {loading ? (
            <Skeleton className="h-40" />
          ) : items.length === 0 ? (
            <EmptyState title="Заданий пока нет" />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openAssignment(item.id)}
                  className="w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-brand-300 dark:border-slate-800"
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.course?.title} · дедлайн {formatDate(item.deadline)} · {item._count?.submissions ?? 0} сдач
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          {!selected ? (
            <EmptyState title="Выберите задание" description="Откройте карточку слева для деталей" />
          ) : (
            <div>
              <h3 className="text-lg font-semibold">{selected.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{selected.description}</p>
              <div className="mt-3 text-xs text-slate-400">Дедлайн: {formatDate(selected.deadline)}</div>

              {user?.role === 'STUDENT' && (
                <form className="mt-5 space-y-3" onSubmit={submitForm.handleSubmit(submit)}>
                  <Textarea label="Ответ" {...submitForm.register('textAnswer')} />
                  <Input label="Ссылка" {...submitForm.register('linkUrl')} />
                  <Button type="submit">Отправить</Button>
                </form>
              )}

              {user?.role !== 'STUDENT' && (
                <div className="mt-5 space-y-3">
                  <h4 className="font-medium">Сдачи</h4>
                  {(selected.submissions ?? []).map((s) => (
                    <div key={s.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{fullName(s.student)}</span>
                        <Badge tone={s.status === 'REVIEWED' ? 'green' : s.status === 'LATE' ? 'rose' : 'amber'}>
                          {statusLabel(s.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{s.textAnswer || '—'}</p>
                      {s.linkUrl && <a className="text-xs text-brand-700" href={s.linkUrl} target="_blank" rel="noreferrer">{s.linkUrl}</a>}
                      {s.status !== 'REVIEWED' && (
                        <form
                          className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
                          onSubmit={reviewForm.handleSubmit((values) => review(s, values))}
                        >
                          <Input type="number" placeholder="Оценка" {...reviewForm.register('grade', { valueAsNumber: true })} />
                          <Input placeholder="Комментарий" {...reviewForm.register('comment')} />
                          <Button type="submit" size="sm">Оценить</Button>
                        </form>
                      )}
                      {s.status === 'REVIEWED' && (
                        <div className="mt-2 text-sm">Оценка: {s.grade}. {s.comment}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
