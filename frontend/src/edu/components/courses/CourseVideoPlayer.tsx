import { useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import type { Lesson } from '../../types';
import { cn, resolveMediaUrl, youtubeEmbedUrl } from '../../utils';

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function NativePlayer({
  src,
  title,
  protect,
}: {
  src: string;
  title: string;
  protect?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const revealControls = () => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2200);
  };

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.src = resolveMediaUrl(src);
    el.load();
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setControlsVisible(true);
  }, [src]);

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      await el.play();
      setPlaying(true);
      revealControls();
    } else {
      el.pause();
      setPlaying(false);
      setControlsVisible(true);
    }
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={shellRef}
      className="relative aspect-video overflow-hidden rounded-2xl bg-[#0c1619] ring-1 ring-white/10"
      onMouseMove={revealControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={resolveMediaUrl(src)}
        playsInline
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture={Boolean(protect)}
        onContextMenu={protect ? (e) => e.preventDefault() : undefined}
        onClick={() => void togglePlay()}
        onTimeUpdate={() => setCurrent(videoRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setControlsVisible(true);
        }}
      />

      {!playing && (
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-[#0c1619]/75 via-transparent to-[#0c1619]/25"
          aria-label="Смотреть"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:scale-105">
            <Play size={28} className="ml-1" fill="currentColor" />
          </span>
        </button>
      )}

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-10 transition',
          controlsVisible || !playing ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <div className="mb-2 truncate text-xs font-medium text-white/80">{title}</div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={current}
          className="lesson-player-range mb-2.5 w-full"
          onChange={(e) => {
            const t = Number(e.target.value);
            if (videoRef.current) videoRef.current.currentTime = t;
            setCurrent(t);
            revealControls();
          }}
          style={{ '--progress': `${progress}%` } as React.CSSProperties}
        />
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg p-1.5 text-white/90 hover:bg-white/10" onClick={() => void togglePlay()}>
            {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/90 hover:bg-white/10"
            onClick={() => {
              const el = videoRef.current;
              if (!el) return;
              el.muted = !el.muted;
              setMuted(el.muted);
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="ml-1 text-[11px] tabular-nums text-white/70">
            {formatTime(current)} / {formatTime(duration)}
          </span>
          <button
            type="button"
            className="ml-auto rounded-lg p-1.5 text-white/90 hover:bg-white/10"
            onClick={() => {
              const shell = shellRef.current;
              if (!shell) return;
              if (document.fullscreenElement) void document.exitFullscreen();
              else void shell.requestFullscreen();
            }}
          >
            <Maximize size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CourseVideoPlayer({
  lesson,
  src: srcOverride,
  protect,
}: {
  lesson: Lesson;
  src?: string;
  protect?: boolean;
}) {
  const src = srcOverride || lesson.videoUrl || lesson.fileUrl || lesson.linkUrl || '';
  const yt = youtubeEmbedUrl(src);

  if (yt) {
    return (
      <div className="overflow-hidden rounded-2xl bg-[#0c1619] ring-1 ring-white/10">
        <div className="aspect-video">
          <iframe
            key={yt}
            title={lesson.title}
            src={yt}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-kse-surface text-sm text-kse-muted">
        Видео не загружено
      </div>
    );
  }

  return <NativePlayer src={src} title={lesson.title} protect={protect} />;
}
