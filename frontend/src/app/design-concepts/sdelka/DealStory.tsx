"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import css from "./sdelka.module.css";

export type Step = {
  node: number;
  kicker: string;
  title: string;
  text: string;
  card: { label: string; value: string; note: string; href: string };
};

// Участники сделки на схеме (координаты в системе 400×520).
const nodes = [
  { label: "Инвестор", x: 200, y: 50 },
  { label: "Брокер", x: 330, y: 170 },
  { label: "Биржа", x: 200, y: 280 },
  { label: "Депозитарий", x: 70, y: 380 },
  { label: "Компания", x: 200, y: 470 },
];
const path = nodes.map((n, i) => `${i ? "L" : "M"}${n.x} ${n.y}`).join(" ");

/**
 * Рассказ при прокрутке: слева закреплённая схема участников, справа шаги. Активный шаг — тот, что в середине
 * экрана; на схеме подсвечивается его участник, «заявка» переезжает к нему, под схемой меняется карточка с данными.
 */
export function DealStory({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const step = steps[active];
  const token = nodes[step.node];

  return (
    <div className={css.story}>
      <div className={css.stage} aria-hidden="true">
        <div className={css.stageInner}>
          <svg viewBox="0 0 400 520" className={css.diagram}>
            <path d={path} className={css.route} />
            {nodes.map((n, i) => (
              <g key={n.label} className={css.node} data-on={i === step.node || undefined} data-done={i < step.node || undefined}>
                <circle cx={n.x} cy={n.y} r="30" />
                <text x={n.x} y={n.y + 52}>
                  {n.label}
                </text>
              </g>
            ))}
            {/* «Заявка» едет к активному участнику. */}
            <circle className={css.token} r="10" style={{ transform: `translate(${token.x}px, ${token.y}px)` }} />
          </svg>
          <div className={css.stageCard} key={active}>
            <small>{step.card.label}</small>
            <b>{step.card.value}</b>
            <span>{step.card.note}</span>
          </div>
          <ol className={css.progress}>
            {steps.map((s, i) => (
              <li key={s.title} data-on={i === active || undefined} data-done={i < active || undefined} />
            ))}
          </ol>
        </div>
      </div>

      <ol className={css.steps}>
        {steps.map((s, i) => (
          <li
            key={s.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            data-on={i === active || undefined}
            className={css.step}
          >
            <p className={css.kicker}>{s.kicker}</p>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {/* На телефоне схемы нет — у каждого шага своя карточка. */}
            <Link href={s.card.href} className={css.inlineCard}>
              <small>{s.card.label}</small>
              <b>{s.card.value}</b>
              <span>{s.card.note}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
