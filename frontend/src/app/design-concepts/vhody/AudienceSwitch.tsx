"use client";

import { useEffect, useState, type ReactNode } from "react";
import css from "./vhody.module.css";

export type Audience = "investor" | "company";

const doors: { id: Audience; who: string; want: string }[] = [
  { id: "investor", who: "Инвесторам", want: "Котировки, торги и государственные ценные бумаги. Как купить первые бумаги." },
  { id: "company", who: "Эмитентам", want: "Привлечение капитала, листинг акций и облигаций, раскрытие информации." },
];

/**
 * Две «двери» первого экрана. Выбор ставит data-audience на обёртку страницы — CSS показывает блоки
 * с data-for этой аудитории — и пишет #investor / #company в адрес, чтобы ссылкой можно было поделиться.
 * Без JS по умолчанию открыта страница инвестора.
 */
export function AudienceSwitch({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<Audience>("investor");

  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === "investor" || hash === "company") setAudience(hash);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const choose = (id: Audience) => {
    setAudience(id);
    window.history.replaceState(null, "", `#${id}`);
    document.getElementById("vh-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={css.switchRoot} data-audience={audience}>
      <div className={css.doors} role="group" aria-label="Кто вы">
        {doors.map((door) => (
          <button key={door.id} type="button" className={css.door} data-door={door.id} aria-pressed={audience === door.id} onClick={() => choose(door.id)}>
            <span className={css.doorWho}>{door.who}</span>
            <span className={css.doorWant}>{door.want}</span>
            <span className={css.doorGo} aria-hidden="true">
              {audience === door.id ? "Раздел открыт ниже" : "Перейти в раздел →"}
            </span>
          </button>
        ))}
      </div>
      <div id="vh-content" className={css.content}>
        {children}
      </div>
    </div>
  );
}
