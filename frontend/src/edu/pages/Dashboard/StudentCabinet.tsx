import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import api from '../../services/api';
import type { Assignment, Course } from '../../types';
import { EmptyState, ProgressBar, Skeleton } from '../../components/ui/Card';
import { courseCoverStyle } from '../../components/courses/CourseCard';
import { StudentHero } from '../../components/layout/StudentTopNav';
import { useAuthStore } from '../../store/authStore';
import { formatMoney } from '../../utils';

type MineCourse = Course & {
  progressPercent: number;
  totalLessons?: number;
  lastActivityAt?: string | null;
};

function ruCount(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} ${one}`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

function isRecent(value?: string) {
  if (!value) return false;
  const age = Date.now() - new Date(value).getTime();
  return age < 14 * 24 * 60 * 60 * 1000;
}

export function StudentCabinet() {
  const user = useAuthStore((s) => s.user);
  const [mine, setMine] = useState<MineCourse[]>([]);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const firstName = user?.profile?.firstName || 'коллега';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [enrollments, courses, homework] = await Promise.all([
          api.get('/enrollments/mine'),
          api.get('/courses?status=PUBLISHED&limit=50'),
          api.get('/assignments', { params: { limit: 50 } }),
        ]);
        const enrolled = (
          enrollments.data.data as Array<{
            progressPercent: number;
            totalLessons?: number;
            lastActivityAt?: string | null;
            course?: Course;
          }>
        )
          .map((e) =>
            e.course
              ? {
                  ...e.course,
                  progressPercent: Number(e.progressPercent ?? 0),
                  totalLessons: e.totalLessons,
                  lastActivityAt: e.lastActivityAt,
                }
              : null,
          )
          .filter(Boolean) as MineCourse[];
        const enrolledIds = new Set(enrolled.map((c) => c.id));
        setMine(enrolled);
        setCatalog((courses.data.data as Course[]).filter((c) => !enrolledIds.has(c.id)));
        setAssignments(homework.data.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const openHomework = assignments.filter((a) => {
    const mineIds = new Set(mine.map((c) => c.id));
    return mineIds.has(a.courseId);
  });

  const continueCourse =
    [...mine]
      .filter((c) => c.progressPercent < 100)
      .sort((a, b) => String(b.lastActivityAt ?? '').localeCompare(String(a.lastActivityAt ?? '')))[0] ??
    mine.find((c) => c.progressPercent < 100) ??
    mine[0];

  if (loading) {
    return (
      <div>
        <Skeleton className="h-44 rounded-none" />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <StudentHero />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-700">Обучение</p>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">Привет, {firstName}</h2>
            <p className="mt-1 text-sm text-kse-muted">Продолжайте курс или выберите новую программу.</p>
          </div>
          {openHomework.length > 0 && (
            <Link
              to="/assignments"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800 hover:border-brand-300"
            >
              <FileText size={16} />
              {ruCount(openHomework.length, 'задание', 'задания', 'заданий')} к сдаче
            </Link>
          )}
        </div>

        {continueCourse && (
          <Link
            to={`/courses/${continueCourse.id}`}
            className="mt-8 grid overflow-hidden rounded-3xl border border-kse-border bg-white shadow-[0_16px_40px_-28px_rgba(30,44,50,0.4)] transition hover:border-brand-300 md:grid-cols-[280px_1fr]"
          >
            <div className="h-44 bg-cover bg-center md:h-auto" style={courseCoverStyle(continueCourse)} />
            <div className="flex flex-col justify-center p-5 sm:p-7">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">Продолжить обучение</div>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{continueCourse.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-kse-muted">{continueCourse.description}</p>
              <div className="mt-4 max-w-md">
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-kse-muted">Прогресс</span>
                  <span className="text-brand-700">{Math.round(continueCourse.progressPercent)}%</span>
                </div>
                <ProgressBar value={continueCourse.progressPercent} />
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                {continueCourse.progressPercent > 0 ? 'Продолжить' : 'Начать'}
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        )}

        <section className="mt-10">
          <div className="flex items-end justify-between gap-3">
            <h3 className="font-display text-xl font-bold">Мои курсы</h3>
            <Link to="/courses" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Все курсы
            </Link>
          </div>
          {mine.length === 0 ? (
            <p className="mt-4 text-sm text-kse-muted">Пока нет записей — выберите программу в каталоге ниже.</p>
          ) : (
            <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
              {mine.map((course) => {
                const progress = Math.round(course.progressPercent);
                return (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-kse-border bg-white transition hover:border-brand-300 hover:shadow-sm"
                  >
                    <div className="relative h-36 bg-cover bg-center" style={courseCoverStyle(course)}>
                      {isRecent(course.createdAt) && progress === 0 && (
                        <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Новое
                        </span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h4 className="line-clamp-2 min-h-11 font-display font-bold leading-snug">{course.title}</h4>
                      <p className="mt-1 text-xs text-kse-muted">
                        {course.totalLessons
                          ? ruCount(course.totalLessons, 'урок', 'урока', 'уроков')
                          : course.durationHours
                            ? `${course.durationHours} ч`
                            : 'Курс'}
                      </p>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[11px] font-semibold text-kse-muted">
                          <span>{progress === 100 ? 'Пройден' : 'Прогресс'}</span>
                          <span>{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {catalog.length > 0 && (
          <section className="mt-12">
            <h3 className="font-display text-xl font-bold">Каталог программ</h3>
            <p className="mt-1 text-sm text-kse-muted">Можно записаться или купить — откроется в кабинете.</p>
            <div className="mt-4 divide-y divide-kse-border rounded-2xl border border-kse-border bg-white">
              {catalog.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="flex items-center gap-4 p-3 transition hover:bg-kse-surface/60 sm:p-4"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-cover bg-center" style={courseCoverStyle(course)} />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-display font-bold">{course.title}</h4>
                    <p className="mt-0.5 line-clamp-1 text-sm text-kse-muted">{course.description}</p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <div className="text-sm font-bold text-brand-700">
                      {Number(course.price) <= 0 ? 'Бесплатно' : formatMoney(course.price)}
                    </div>
                    <div className="text-xs text-kse-muted">{course.durationHours ? `${course.durationHours} ч` : 'Программа'}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {mine.length === 0 && catalog.length === 0 && (
          <EmptyState title="Курсов пока нет" description="Когда учебный центр опубликует программы, они появятся здесь" />
        )}
      </div>
    </div>
  );
}
