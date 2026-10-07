import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '../../utils/zodResolver';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Category, Course } from '../../types';
import { PageHeader, Card, EmptyState, Skeleton } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { getErrorMessage } from '../../utils';
import { useAuthStore } from '../../store/authStore';
import { useStudentContentProtection } from '../../hooks/useStudentContentProtection';
import { CourseCard } from '../../components/courses/CourseCard';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

type FormValues = z.infer<typeof schema>;

export function CoursesPage() {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'STUDENT';
  useStudentContentProtection(isStudent);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Array<Course & { progressPercent: number }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const categoryId = params.get('categoryId') ?? '';
  const teacherId = params.get('teacherId') ?? '';
  const page = Number(params.get('page') ?? 1);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'DRAFT', price: 0 },
  });

  type PageData = {
    items: Course[];
    myCourses: Array<Course & { progressPercent: number }>;
    categories: Category[];
    meta: { page: number; totalPages: number; total: number };
  };

  /** Только запрос — без изменения состояния, чтобы обновлять его в одном месте, когда пришёл ответ. */
  const fetchPage = async (): Promise<PageData> => {
    if (isStudent) {
      const [enrollRes, catsRes] = await Promise.all([api.get('/enrollments/mine'), api.get('/categories')]);
      const enrolled = (enrollRes.data.data ?? [])
        .map((e: { course: Course; progressPercent?: number }) =>
          e.course ? { ...e.course, progressPercent: Number(e.progressPercent ?? 0) } : null,
        )
        .filter(Boolean) as Array<Course & { progressPercent: number }>;
      return {
        items: [],
        myCourses: enrolled,
        categories: catsRes.data.data,
        meta: { page: 1, totalPages: 1, total: enrolled.length },
      };
    }
    const [coursesRes, catsRes] = await Promise.all([
      api.get('/courses', {
        params: {
          search: search || undefined,
          status: status || undefined,
          categoryId: categoryId || undefined,
          teacherId: teacherId || undefined,
          page,
          limit: 9,
        },
      }),
      api.get('/categories'),
    ]);
    return { items: coursesRes.data.data, myCourses: [], categories: catsRes.data.data, meta: coursesRes.data.meta };
  };

  // При смене фильтра прежний список остаётся на экране, пока не придёт новый.
  const load = () =>
    fetchPage()
      .then((data) => {
        setItems(data.items);
        setMyCourses(data.myCourses);
        setCategories(data.categories);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
  }, [search, status, categoryId, teacherId, page, isStudent]);

  const filteredMyCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myCourses.filter((c) => {
      if (categoryId && c.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [myCourses, search, categoryId]);

  const activeMyCourses = useMemo(
    () => filteredMyCourses.filter((c) => c.progressPercent < 100),
    [filteredMyCourses],
  );
  const completedMyCourses = useMemo(
    () => filteredMyCourses.filter((c) => c.progressPercent >= 100),
    [filteredMyCourses],
  );

  const onCreate = async (values: FormValues) => {
    try {
      const { data } = await api.post('/courses', {
        ...values,
        level: 'BEGINNER',
        durationHours: 0,
        coverUrl: values.coverUrl || undefined,
      });
      toast.success('Курс создан');
      setShowForm(false);
      navigate(`/courses/${data.data.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className={isStudent ? 'mx-auto max-w-6xl px-4 py-8 sm:px-6' : undefined}>
      <PageHeader
        title={isStudent ? 'Мои курсы' : 'Курсы'}
        description={
          isStudent
            ? 'Купленные и бесплатные программы, на которые вы записаны'
            : 'Каталог и управление учебными программами'
        }
        actions={
          user?.role !== 'STUDENT' ? (
            <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Закрыть' : 'Создать курс'}</Button>
          ) : undefined
        }
      />

      <Card className="mb-5 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-2">
        <div className="min-w-0 flex-1">
          <Input
            placeholder={isStudent ? 'Поиск по моим курсам…' : 'Поиск курсов…'}
            defaultValue={search}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set('search', e.target.value);
              else next.delete('search');
              next.set('page', '1');
              setParams(next);
            }}
          />
        </div>
        {!isStudent && (
          <Select
            className="sm:w-40"
            value={status}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set('status', e.target.value);
              else next.delete('status');
              setParams(next);
            }}
          >
            <option value="">Все статусы</option>
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликован</option>
            <option value="ARCHIVED">Архив</option>
          </Select>
        )}
        <Select
          className="sm:w-44"
          value={categoryId}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('categoryId', e.target.value);
            else next.delete('categoryId');
            setParams(next);
          }}
        >
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div className="shrink-0 px-2 text-sm font-medium text-kse-muted">
          {isStudent ? `${filteredMyCourses.length} курсов` : `${meta.total} найдено`}
        </div>
      </Card>

      {showForm && (
        <Card className="mb-6 p-5 animate-fade-up">
          <h3 className="mb-4 font-semibold tracking-tight">Новый курс</h3>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onCreate)}>
            <Input label="Название" {...form.register('title')} error={form.formState.errors.title?.message} />
            <Select label="Категория" {...form.register('categoryId')}>
              <option value="">Выберите</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <Textarea label="Описание" {...form.register('description')} />
            </div>
            <Input label="Цена (сом)" type="number" {...form.register('price')} />
            <Select label="Статус" {...form.register('status')}>
              <option value="DRAFT">Черновик</option>
              <option value="PUBLISHED">Опубликован</option>
            </Select>
            <div className="md:col-span-2">
              <Input label="URL обложки" {...form.register('coverUrl')} />
            </div>
            <Button type="submit">Сохранить</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : isStudent ? (
        filteredMyCourses.length === 0 ? (
          <EmptyState
            title="Пока нет купленных курсов"
            description="На главной кабинета выберите программу и запишитесь"
          />
        ) : (
          <div className="space-y-8">
            {activeMyCourses.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {activeMyCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    badge={{ label: 'Мой курс', tone: 'green' }}
                    progressPercent={course.progressPercent}
                    cta={course.progressPercent >= 100 ? 'Открыть' : 'Продолжить'}
                  />
                ))}
              </div>
            )}
            {completedMyCourses.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-medium text-kse-muted">Завершённые</h2>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {completedMyCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      badge={{ label: 'Завершён', tone: 'slate' }}
                      progressPercent={course.progressPercent}
                      cta="Открыть"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : items.length === 0 ? (
        <EmptyState title="Курсы не найдены" description="Измените фильтры или создайте новый курс" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {!isStudent && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
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
          <span className="text-sm font-medium text-kse-muted">
            {page} / {Math.max(meta.totalPages, 1)}
          </span>
          <Button
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
      )}
    </div>
  );
}
