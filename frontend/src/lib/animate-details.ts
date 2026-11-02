/**
 * Плавное раскрытие и сворачивание разделов на <details> (меню, руководство, облигации, участники ГЦБ).
 *
 * Браузер прячет содержимое <details> мгновенно, поэтому клик по <summary> перехватываем:
 * - открытие: высота растёт от заголовка до полной, содержимое проявляется и чуть съезжает вниз на место;
 * - закрытие: то же в обратную сторону, и только после окончания анимации снимаем open.
 * Повторный клик во время анимации разворачивает её с текущей высоты — без скачков.
 * Кто выбрал в системе «уменьшить движение» — без изменения высоты, только короткое проявление.
 * Используется через onClick={toggleDetails} на <summary>; пока раздел закрывается, у него есть атрибут data-closing.
 */

const OPEN_MS = 380;
const CLOSE_MS = 300;
const HEIGHT_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
const CONTENT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

type Phase = "opening" | "closing";
const phases = new WeakMap<HTMLDetailsElement, Phase>();

/** Всё, что внутри раздела, кроме заголовка. */
function contentOf(details: HTMLDetailsElement) {
  return [...details.children].filter((child): child is HTMLElement => child instanceof HTMLElement && child.tagName !== "SUMMARY");
}

function stopAnimations(details: HTMLDetailsElement) {
  details.getAnimations().forEach((animation) => animation.cancel());
  contentOf(details).forEach((child) => child.getAnimations().forEach((animation) => animation.cancel()));
}

/** Высота раздела в закрытом виде (только заголовок с рамками и отступами). */
function closedHeight(details: HTMLDetailsElement) {
  const wasOpen = details.open;
  details.open = false;
  const height = details.offsetHeight;
  details.open = wasOpen;
  return height;
}

/** Пункты списка проявляются по очереди (меню), крупный блок — целиком. */
function animateContent(details: HTMLDetailsElement, opening: boolean) {
  const items = contentOf(details);
  const stagger = items.length > 2 ? 22 : 0;
  items.forEach((item, index) => {
    item.animate(
      opening
        ? [
            { opacity: 0, transform: "translateY(-8px)" },
            { opacity: 1, transform: "none" },
          ]
        : [
            { opacity: 1, transform: "none" },
            { opacity: 0, transform: "translateY(-6px)" },
          ],
      opening
        ? { duration: 320, delay: 60 + Math.min(index, 8) * stagger, easing: CONTENT_EASING, fill: "backwards" }
        : { duration: 180, easing: "ease-in", fill: "forwards" },
    );
  });
}

function finish(details: HTMLDetailsElement) {
  phases.delete(details);
  details.style.overflow = "";
  delete details.dataset.closing;
}

export function toggleDetails(event: React.MouseEvent<HTMLElement>) {
  const details = event.currentTarget.parentElement;
  if (!(details instanceof HTMLDetailsElement)) return;
  event.preventDefault();

  const phase = phases.get(details);
  const opening = phase === "closing" || (!phase && !details.open);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Текущая высота — с учётом идущей анимации, чтобы развернуть её без скачка.
  const from = details.offsetHeight;
  stopAnimations(details);

  if (reduce) {
    finish(details);
    details.open = opening;
    if (opening) contentOf(details).forEach((item) => item.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: "ease-out" }));
    return;
  }

  details.style.overflow = "hidden";
  if (opening) {
    details.open = true;
    const to = details.offsetHeight;
    phases.set(details, "opening");
    animateContent(details, true);
    const animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: OPEN_MS, easing: HEIGHT_EASING });
    animation.onfinish = () => finish(details);
    return;
  }

  const to = closedHeight(details);
  phases.set(details, "closing");
  // По data-closing стрелки и плюсы в CSS переходят в «закрыто» сразу, а не в конце анимации.
  details.dataset.closing = "";
  animateContent(details, false);
  const animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: CLOSE_MS, easing: HEIGHT_EASING });
  animation.onfinish = () => {
    details.open = false;
    stopAnimations(details);
    finish(details);
  };
}
