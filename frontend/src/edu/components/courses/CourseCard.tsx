import { Link } from 'react-router-dom';
import { Clock3, Star, Users } from 'lucide-react';
import type { Course } from '../../types';
import { Card, Badge, ProgressBar } from '../ui/Card';
import { formatMoney, statusLabel } from '../../utils';

export function courseCoverStyle(course: Course) {
  const url = course.coverUrl || '';
  if (url) {
    return {
      backgroundImage: `linear-gradient(180deg,rgba(30,44,50,.15),rgba(30,44,50,.55)), url(${url})`,
    };
  }
  return {
    backgroundImage:
      'linear-gradient(135deg, rgba(78,172,185,.95) 0%, rgba(26,109,122,.9) 45%, rgba(14,51,57,.95) 100%)',
  };
}

export function CourseCard({
  course,
  badge,
  progressPercent,
  hidePrice,
  cta,
}: {
  course: Course;
  badge?: { label: string; tone?: 'teal' | 'green' | 'amber' | 'rose' | 'slate' };
  /** Если задан — курс куплен: прогресс под обложкой, без цены */
  progressPercent?: number;
  hidePrice?: boolean;
  cta?: string;
}) {
  const owned = hidePrice || progressPercent !== undefined;
  const progress = Math.max(0, Math.min(100, Number(progressPercent ?? 0)));

  return (
    <Link to={`/courses/${course.id}`} className="group">
      <Card className="overflow-hidden transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[var(--glow)]">
        <div className="relative h-44 bg-cover bg-center" style={courseCoverStyle(course)}>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-3">
            <div className="flex flex-wrap gap-1.5">
              {badge ? <Badge tone={badge.tone ?? 'green'}>{badge.label}</Badge> : null}
              <Badge>{statusLabel(course.level)}</Badge>
            </div>
            {!owned && (
              <span className="rounded-lg bg-panel/95 px-2 py-1 text-xs font-bold text-brand-700 backdrop-blur dark:bg-panel-dark/90 dark:text-brand-200">
                {Number(course.price) <= 0 ? 'Бесплатно' : formatMoney(course.price)}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          {owned && (
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold">
                <span className="text-kse-muted dark:text-kse-gray">Прогресс</span>
                <span className="tabular-nums text-brand-700 dark:text-brand-200">{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}
          <h3 className="line-clamp-1 font-semibold tracking-tight group-hover:text-brand-600">
            {course.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-kse-muted">{course.description}</p>
          <div className="mt-4 flex items-center gap-3 text-xs font-medium text-kse-muted">
            <span className="inline-flex items-center gap-1">
              <Users size={13} /> {course._count?.enrollments ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star size={13} className="text-amber-500" /> {Number(course.rating).toFixed(1)}
              {course._count?.reviews ? ` (${course._count.reviews})` : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} /> {course.durationHours} ч
            </span>
          </div>
          {cta && (
            <div className="mt-4 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
              {cta} →
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
