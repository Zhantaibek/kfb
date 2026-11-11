/// <reference types="react/canary" />
import { ViewTransition, type CSSProperties, type ReactNode } from "react";

// Типы переходов: соседняя концепция справа/слева и открытие концепции из каталога (стили — motion.css).
const motion = {
  "kc-forward": "kc-forward",
  "kc-back": "kc-back",
  "kc-open": "kc-open",
  default: "none",
};

/**
 * Обёртка страницы макета: анимация входа/выхода при переходах между концепциями
 * и полоса прогресса прокрутки в фирменном цвете концепции.
 */
export function ConceptPage({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <ViewTransition enter={motion} exit={motion} default="none">
      <div style={{ "--kc-accent": accent } as CSSProperties}>
        <span className="kc-progress" aria-hidden="true" />
        {children}
      </div>
    </ViewTransition>
  );
}

/**
 * Заголовок, слова которого выезжают снизу по очереди (вместе с data-intro="words" на родителе).
 * from — номер первого слова, если заголовок разбит на несколько строк.
 */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  return text.split(" ").map((word, i) => (
    <span key={i}>
      {i > 0 ? " " : null}
      <span className="kc-w">
        <span style={{ "--kc-wi": from + i } as CSSProperties}>{word}</span>
      </span>
    </span>
  ));
}
