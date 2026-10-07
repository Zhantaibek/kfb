import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, ImageIcon, Lock, PlayCircle, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { Course, Lesson } from '../../types';
import {
  formatMoney,
  fullName,
  getErrorMessage,
  statusLabel,
  cn,
  resolveMediaUrl,
} from '../../utils';
import { Card, Badge, ProgressBar, Skeleton, Avatar } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { MockPaymentModal } from '../../components/payments/MockPaymentModal';
import { CourseVideoPlayer } from '../../components/courses/CourseVideoPlayer';
import { useAuthStore } from '../../store/authStore';
import { useStudentContentProtection } from '../../hooks/useStudentContentProtection';
import { StudentHero } from '../../components/layout/StudentTopNav';

function flattenLessons(course: Course): Lesson[] {
  return (course.modules ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => m.lessons.slice().sort((a, b) => a.order - b.order));
}

function lessonImages(lesson: Lesson) {
  if (lesson.imageUrls?.length) return lesson.imageUrls;
  if (lesson.contentType === 'IMAGE' && lesson.fileUrl) return [lesson.fileUrl];
  return [];
}

function lessonVideos(lesson: Lesson) {
  const urls = [...(lesson.videoUrls ?? [])];
  for (const extra of [lesson.videoUrl, lesson.linkUrl]) {
    if (extra && !urls.includes(extra)) urls.unshift(extra);
  }
  if (!urls.length && lesson.contentType === 'VIDEO' && lesson.fileUrl && !lessonImages(lesson).includes(lesson.fileUrl)) {
    urls.push(lesson.fileUrl);
  }
  return urls;
}

function hasVideo(lesson: Lesson) {
  return lessonVideos(lesson).length > 0;
}

export function CourseDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  useStudentContentProtection(user?.role === 'STUDENT');

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
    progress?: Array<{ lessonId: string; completed: boolean }>;
  } | null>(null);

  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoDraft, setVideoDraft] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [pendingVideos, setPendingVideos] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Курс, затем прогресс; 404 по прогрессу значит «не записан» (у преподавателя — всегда).
  const load = () =>
    api.get(`/courses/${id}`).then(({ data }) => {
      setCourse(data.data);
      return api.get(`/courses/${id}/progress`).then(
        (prog) => {
          setProgress(prog.data.data);
          setEnrolled(true);
        },
        () => {
          setProgress(null);
          setEnrolled(false);
        },
      );
    });

  useEffect(() => {
    void load();
  }, [id]);

  if (!course) return <Skeleton className="h-96" />;

  const canManage = user?.role === 'ADMIN' || (user?.role === 'TEACHER' && course.teacherId === user.id);
  const contentLocked = user?.role === 'STUDENT' && Boolean(course.locked || !enrolled);
  const lessons = flattenLessons(course);
  const selectedVideo = selectedVideoId
    ? (lessons.find((v) => v.id === selectedVideoId) ?? null)
    : (lessons[0] ?? null);
  const selectedIndex = selectedVideo ? lessons.findIndex((l) => l.id === selectedVideo.id) : -1;
  const prevLesson = selectedIndex > 0 ? lessons[selectedIndex - 1] : null;
  const nextLesson = selectedIndex >= 0 && selectedIndex < lessons.length - 1 ? lessons[selectedIndex + 1] : null;
  const modules = (course.modules ?? []).slice().sort((a, b) => a.order - b.order);
  const completedSet = new Set(
    (progress?.progress ?? []).filter((p) => p.completed).map((p) => p.lessonId),
  );
  const price = Number(course.price);
  const isFree = price <= 0;

  const resetVideoForm = () => {
    setEditingVideoId(null);
    setVideoTitle('');
    setVideoDescription('');
    setVideoDraft('');
    setVideoUrls([]);
    setPendingVideos([]);
    setImageUrls([]);
  };

  const uploadFile = async (file: File) => {
    const body = new FormData();
    body.append('file', file);
    const { data } = await api.post('/media/upload', body);
    return String(data.data.url);
  };

  const addPhotoFiles = async (files: File[]) => {
    const usable = files.filter((file) => {
      const name = file.name.toLowerCase();
      if (name.endsWith('.heic') || name.endsWith('.heif') || file.type.includes('heic') || file.type.includes('heif')) {
        toast.error(`«${file.name}»: сохраните как JPG или PNG`);
        return false;
      }
      return true;
    });
    if (!usable.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of usable) {
        uploaded.push(await uploadFile(file));
      }
      setImageUrls((list) => [...list, ...uploaded]);
      toast.success(uploaded.length === 1 ? 'Фото загружено' : `Загружено фото: ${uploaded.length}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const saveVideo = async () => {
    if (!videoTitle.trim()) {
      toast.error('Укажите название урока');
      return;
    }

    let videos = [...videoUrls];
    if (videoDraft.trim()) videos.push(videoDraft.trim());

    const photos = [...imageUrls];
    if (pendingVideos.length) {
      setUploading(true);
      try {
        for (const file of pendingVideos) {
          videos.push(await uploadFile(file));
        }
      } catch (e) {
        toast.error(getErrorMessage(e));
        return;
      } finally {
        setUploading(false);
      }
    }

    videos = videos.filter((url, i, arr) => url && arr.indexOf(url) === i);

    if (videos.length === 0 && photos.length === 0 && !editingVideoId) {
      toast.error('Добавьте видео или фото');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: videoTitle.trim(),
        description: videoDescription.trim() || undefined,
        ...(videos.length ? { videoUrls: videos } : { videoUrls: [] }),
        imageUrls: photos,
      };
      if (editingVideoId) {
        await api.patch(`/lessons/${editingVideoId}/video`, payload);
        toast.success('Урок обновлён');
      } else {
        await api.post(`/courses/${id}/videos`, payload);
        toast.success('Урок добавлен');
      }
      resetVideoForm();
      void load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const startEditVideo = (video: Lesson) => {
    setEditingVideoId(video.id);
    setVideoTitle(video.title);
    setVideoDescription(video.content ?? '');
    setVideoDraft('');
    setVideoUrls(lessonVideos(video));
    setPendingVideos([]);
    setImageUrls(lessonImages(video));
    setSelectedVideoId(video.id);
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Удалить это видео?')) return;
    try {
      await api.delete(`/lessons/${videoId}`);
      if (editingVideoId === videoId) resetVideoForm();
      if (selectedVideoId === videoId) setSelectedVideoId(null);
      toast.success('Видео удалено');
      void load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const completeVideo = async (videoId: string, silent = false) => {
    if (user?.role !== 'STUDENT' || !enrolled || completedSet.has(videoId)) return;
    try {
      const { data } = await api.post(`/courses/${id}/progress/complete`, { lessonId: videoId });
      setProgress(data.data);
      if (data.data.progressPercent >= 100 && !silent) {
        toast.success('Курс завершён');
      }
    } catch {
      // ignore silent failures
    }
  };

  const selectVideo = (videoId: string) => {
    if (selectedVideo?.id && selectedVideo.id !== videoId) {
      void completeVideo(selectedVideo.id, true);
    }
    setSelectedVideoId(videoId);
  };

  const enroll = async () => {
    try {
      await api.post('/enrollments', { courseId: id });
      toast.success('Вы записались на курс');
      void load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const publish = async () => {
    try {
      await api.patch(`/courses/${id}`, {
        status: course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
      });
      toast.success('Статус обновлён');
      void load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const deleteCourse = async () => {
    if (!confirm(`Удалить курс «${course.title}»? Это действие нельзя отменить.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Курс удалён');
      navigate('/courses');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const heroBg = course.coverUrl
    ? `linear-gradient(105deg,rgba(21,36,40,.88) 0%,rgba(52,129,145,.55) 55%,rgba(81,173,186,.35) 100%), url(${course.coverUrl})`
    : 'linear-gradient(120deg,#0e3339 0%,#1a6d7a 40%,#4eacb9 100%)';

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className={isStudent ? undefined : 'mx-auto w-full max-w-6xl'}>
      {isStudent && <StudentHero />}
      <div className={isStudent ? 'mx-auto w-full max-w-6xl px-4 py-8 sm:px-6' : undefined}>
      {isStudent && (
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{course.title}</h1>
            <span className="rounded-full bg-kse-surface px-2.5 py-0.5 text-xs font-medium text-kse-muted">
              {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(course.createdAt))}
            </span>
          </div>
          <div className="mt-4 inline-flex gap-6 rounded-2xl border border-kse-border px-5 py-3 text-sm">
            <div>
              <div className="text-xs text-kse-muted">уроков</div>
              <div className="font-display text-xl font-bold">{lessons.length}</div>
            </div>
            <div>
              <div className="text-xs text-kse-muted">заданий</div>
              <div className="font-display text-xl font-bold">{course._count?.assignments ?? 0}</div>
            </div>
          </div>
          {course.description && <p className="mt-4 max-w-2xl text-sm text-kse-muted">{course.description}</p>}
          {!enrolled && (
            <div className="mt-5">
              {isFree ? (
                <Button onClick={() => void enroll()}>Записаться бесплатно</Button>
              ) : (
                <Button onClick={() => setPayOpen(true)}>Купить · {formatMoney(course.price)}</Button>
              )}
            </div>
          )}
        </div>
      )}
      {!isStudent && (
      <div
        className="relative mb-6 overflow-hidden rounded-3xl border border-kse-border bg-cover bg-center dark:border-border-dark"
        style={{ backgroundImage: heroBg }}
      >
        <div className="relative px-6 py-8 text-white sm:px-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge tone="teal">{statusLabel(course.status)}</Badge>
            {enrolled && <Badge tone="green">Вы записаны</Badge>}
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/85">
            <div className="flex items-center gap-2">
              <Avatar name={fullName(course.teacher)} src={course.teacher?.profile?.avatarUrl} size="sm" />
              {fullName(course.teacher)}
            </div>
            <span>{lessons.length} {lessons.length === 1 ? 'урок' : 'уроков'}</span>
            {enrolled && progress ? (
              <span className="rounded-lg bg-white/15 px-2.5 py-1 font-semibold backdrop-blur">
                Прогресс {progress.progressPercent}%
              </span>
            ) : (
              <span className="rounded-lg bg-white/15 px-2.5 py-1 font-semibold backdrop-blur">
                {isFree ? 'Бесплатно' : formatMoney(course.price)}
              </span>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {canManage && (
              <>
                <Button variant="secondary" onClick={() => void publish()}>
                  {course.status === 'PUBLISHED' ? 'Снять с публикации' : 'Опубликовать'}
                </Button>
                <Button
                  variant="danger"
                  disabled={deleting}
                  onClick={() => void deleteCourse()}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? 'Удаление…' : 'Удалить курс'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {enrolled && progress && (
        <Card className="mb-6 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Прогресс курса</span>
            <span className="font-bold text-brand-600">{progress.progressPercent}%</span>
          </div>
          <ProgressBar value={progress.progressPercent} />
          <div className="mt-2 text-xs text-kse-muted">
            {progress.completedLessons} из {progress.totalLessons} уроков пройдено
          </div>
        </Card>
      )}

      {canManage && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 font-semibold">{editingVideoId ? 'Редактировать урок' : 'Добавить урок'}</h2>
          <div className="grid gap-4">
            <Input
              label="Название"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Например: Введение в курс"
            />
            <Textarea
              label="Описание"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Кратко о чём урок"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Видео</label>
              <div className="space-y-2">
                {videoUrls.map((url) => (
                  <div key={url} className="flex items-center gap-2 rounded-xl bg-kse-surface px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{url}</span>
                    <button
                      type="button"
                      className="text-kse-muted hover:text-rose-600"
                      onClick={() => setVideoUrls((list) => list.filter((item) => item !== url))}
                      aria-label="Убрать видео"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {pendingVideos.map((file) => (
                  <div key={file.name + file.size} className="truncate rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">
                    {file.name}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ссылка YouTube или на файл"
                    value={videoDraft}
                    onChange={(e) => setVideoDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = videoDraft.trim();
                        if (!next) return;
                        setVideoUrls((list) => [...list, next]);
                        setVideoDraft('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const next = videoDraft.trim();
                      if (!next) return;
                      setVideoUrls((list) => [...list, next]);
                      setVideoDraft('');
                    }}
                  >
                    Добавить ссылку
                  </Button>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => {
                    setPendingVideos((list) => [...list, ...Array.from(e.target.files ?? [])]);
                    e.currentTarget.value = '';
                  }}
                  className="block w-full text-sm text-kse-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Фотографии</label>
              <p className="mb-2 text-xs text-kse-muted">JPG, PNG, WEBP или GIF. После выбора фото сразу загружается на сервер.</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.currentTarget.value = '';
                  if (files.length) void addPhotoFiles(files);
                }}
                className="block w-full text-sm text-kse-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700"
              />
              {imageUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {imageUrls.map((url) => (
                    <div key={url} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-kse-border">
                      <img src={resolveMediaUrl(url)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                        onClick={() => setImageUrls((list) => list.filter((item) => item !== url))}
                        aria-label="Убрать фото"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void saveVideo()} disabled={saving || uploading}>
                {uploading ? 'Загрузка…' : saving ? 'Сохранение…' : editingVideoId ? 'Сохранить урок' : 'Добавить урок'}
              </Button>
              {editingVideoId && (
                <Button variant="secondary" onClick={resetVideoForm}>
                  Отмена
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {contentLocked ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <Lock size={40} className="text-kse-muted" />
          <div>
            <h3 className="font-semibold">Контент закрыт</h3>
            <p className="mt-1 text-sm text-kse-muted">
              {isFree ? 'Запишитесь на курс, чтобы смотреть видео' : 'Купите курс, чтобы открыть доступ к видео'}
            </p>
          </div>
          {user?.role === 'STUDENT' && (
            isFree ? (
              <Button onClick={() => void enroll()}>Записаться бесплатно</Button>
            ) : (
              <Button onClick={() => setPayOpen(true)}>Купить · {formatMoney(price)}</Button>
            )
          )}
        </Card>
      ) : lessons.length === 0 ? (
        <Card className="p-8 text-center text-sm text-kse-muted">
          {canManage ? 'Добавьте первый урок с помощью формы выше' : 'В этом курсе пока нет уроков'}
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {selectedVideo && (
              <Fragment key={selectedVideo.id}>
                {hasVideo(selectedVideo) && (
                  <div className="space-y-4">
                    {lessonVideos(selectedVideo).map((src, index) => (
                      <CourseVideoPlayer
                        key={`${selectedVideo.id}-${index}-${src}`}
                        lesson={selectedVideo}
                        src={src}
                        protect={user?.role === 'STUDENT'}
                      />
                    ))}
                  </div>
                )}
                {lessonImages(selectedVideo).length > 0 && (
                  <div className={cn('grid gap-3 sm:grid-cols-2', hasVideo(selectedVideo) && 'mt-4')}>
                    {lessonImages(selectedVideo).map((url, index) => (
                      <img
                        key={`${selectedVideo.id}-img-${index}-${url}`}
                        src={resolveMediaUrl(url)}
                        alt=""
                        className="w-full rounded-2xl object-cover ring-1 ring-kse-border"
                      />
                    ))}
                  </div>
                )}
                {!hasVideo(selectedVideo) && lessonImages(selectedVideo).length === 0 && (
                  <Card className="p-6">
                    <p className="text-sm leading-relaxed text-kse-muted">Текстовый урок</p>
                  </Card>
                )}
                <div className="mt-4">
                  <h2 className="text-xl font-semibold">{selectedVideo.title}</h2>
                  {selectedVideo.content && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-kse-muted">{selectedVideo.content}</p>
                  )}
                </div>
                {user?.role === 'STUDENT' && enrolled && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="secondary"
                      disabled={!prevLesson}
                      onClick={() => prevLesson && selectVideo(prevLesson.id)}
                    >
                      <ChevronLeft size={16} />
                      Предыдущий
                    </Button>
                    <Link to="/assignments" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                      К заданиям курса
                    </Link>
                    <Button
                      disabled={!nextLesson}
                      onClick={() => {
                        if (selectedVideo) void completeVideo(selectedVideo.id, true);
                        if (nextLesson) selectVideo(nextLesson.id);
                      }}
                    >
                      Следующий урок
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </Fragment>
            )}
          </div>

          <Card className="h-fit p-3">
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-kse-muted">
              Программа · {lessons.length}
            </div>
            <div className="space-y-3">
              {(modules.length ? modules : [{ id: 'all', title: 'Уроки', order: 1, lessons }]).map((mod) => (
                <div key={mod.id}>
                  {modules.length > 0 && (
                    <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-kse-gray">
                      {mod.title}
                    </div>
                  )}
                  <div className="space-y-1">
                    {(mod.lessons ?? []).slice().sort((a, b) => a.order - b.order).map((video, i) => {
                const active = video.id === selectedVideo?.id;
                const done = completedSet.has(video.id);
                return (
                  <div key={video.id} className="group flex items-stretch gap-1">
                    <button
                      type="button"
                      onClick={() => selectVideo(video.id)}
                      className={cn(
                        'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm transition',
                        active
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-800/35 dark:text-brand-200'
                          : 'hover:bg-kse-surface dark:hover:bg-border-dark/50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                          done ? 'bg-emerald-100 text-emerald-700' : 'bg-kse-surface text-kse-muted',
                        )}
                      >
                        {done ? <CheckCircle2 size={14} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 font-medium">{video.title}</span>
                        {video.durationMin > 0 && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-kse-muted">
                            <Clock3 size={11} /> {video.durationMin} мин
                          </span>
                        )}
                      </span>
                      {active && (
                        lessonImages(video).length && !hasVideo(video) ? (
                          <ImageIcon size={16} className="shrink-0 text-brand-500" />
                        ) : (
                          <PlayCircle size={16} className="shrink-0 text-brand-500" />
                        )
                      )}
                    </button>
                    {canManage && (
                      <div className="flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-600 hover:bg-brand-50"
                          onClick={() => startEditVideo(video)}
                        >
                          Изм.
                        </button>
                        <button
                          type="button"
                          className="rounded-lg px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
                          onClick={() => void deleteVideo(video.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <MockPaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        course={{
          id: course.id,
          title: course.title,
          price: course.price,
          coverUrl: course.coverUrl,
        }}
        onSuccess={() => {
          setPayOpen(false);
          void load();
        }}
      />
      </div>
    </div>
  );
}