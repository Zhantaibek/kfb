import { useEffect } from 'react';

/**
 * Best-effort защита для студентов на страницах курсов:
 * — нельзя копировать / выделять / ПКМ
 * — попытка перехватить PrintScreen и очистить буфер
 * — блокировка getDisplayMedia (запись экрана из браузера)
 *
 * Полностью запретить PrintScreen / OBS / Snipping Tool из веб-страницы нельзя.
 */
export function useStudentContentProtection(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const block = (e: Event) => {
      e.preventDefault();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        void navigator.clipboard?.writeText('').catch(() => undefined);
        return;
      }
      // Частые шорткаты скриншотов (срабатывают не везде — ОС часто перехватывает раньше)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['s', 'S', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        void navigator.clipboard?.writeText('').catch(() => undefined);
      }
    };

    const mediaDevices = navigator.mediaDevices;
    const originalGetDisplayMedia = mediaDevices?.getDisplayMedia?.bind(mediaDevices);
    if (mediaDevices && originalGetDisplayMedia !== undefined) {
      mediaDevices.getDisplayMedia = () =>
        Promise.reject(
          new DOMException('Запись экрана на страницах курсов отключена', 'NotAllowedError'),
        );
    }

    document.documentElement.classList.add('student-course-protect');
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('keyup', onKeyUp, true);
    document.addEventListener('copy', block, true);
    document.addEventListener('cut', block, true);
    document.addEventListener('contextmenu', block, true);
    document.addEventListener('dragstart', block, true);

    return () => {
      document.documentElement.classList.remove('student-course-protect');
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('keyup', onKeyUp, true);
      document.removeEventListener('copy', block, true);
      document.removeEventListener('cut', block, true);
      document.removeEventListener('contextmenu', block, true);
      document.removeEventListener('dragstart', block, true);
      if (mediaDevices && originalGetDisplayMedia) {
        mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [enabled]);
}
