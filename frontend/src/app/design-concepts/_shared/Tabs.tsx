"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = { label: string; content: ReactNode; aside?: ReactNode };

/** Классы вкладок из CSS-модуля концепции: tabs, tabsHead, tabList, tabPanel. */
type TabClasses = Readonly<Record<string, string>>;

/**
 * Вкладки по WAI-ARIA: ←/→, Home/End переключают вкладку, Tab уходит в содержимое.
 * aside — элемент справа от вкладок (например, ссылка «Все новости»), свой для каждой вкладки.
 * css — CSS-модуль концепции: вкладки общие, оформление у каждой концепции своё.
 */
export function Tabs({ label, tabs, css }: { label: string; tabs: Tab[]; css: TabClasses }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  function onKey(event: KeyboardEvent<HTMLDivElement>) {
    const last = tabs.length - 1;
    const keys: Record<string, number> = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last };
    if (!(event.key in keys)) return;
    event.preventDefault();
    setActive(keys[event.key]);
    refs.current[keys[event.key]]?.focus();
  }

  return (
    <div className={css.tabs}>
      <div className={css.tabsHead}>
        <div role="tablist" aria-label={label} className={css.tabList} onKeyDown={onKey}>
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              ref={(node) => {
                refs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-controls={`${id}-panel-${i}`}
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {tabs[active]?.aside}
      </div>
      {tabs.map((tab, i) => (
        <div key={tab.label} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={i !== active} className={css.tabPanel}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
