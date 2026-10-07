"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CmsListingDocument } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

/** Word, Excel и архивы браузер не показывает внутри страницы — для них только скачивание. */
function canPreview(url: string) {
  return !/\.(docx?|xlsx?|zip|rar)(\?|#|$)/i.test(url);
}

/** Отчёты бумаги прямо в админке: список слева, документ справа. Закрытие — Esc, крестик или клик по фону. */
export function DocumentViewer({
  title,
  documents,
  startIndex = 0,
  onClose,
}: {
  title: string;
  documents: CmsListingDocument[];
  startIndex?: number;
  onClose: () => void;
}) {
  const files = documents.filter((doc) => doc.url);
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(files.length - 1, 0)));
  const current = files[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // В body, а не внутри контента админки: иначе боковое меню и шапка оказываются поверх окна.
  return createPortal(
    // adminRoot — чтобы в портале были переменные цветов админки (--admin-*).
    <div className={`${css.adminRoot} ${css.viewerBackdrop}`} onClick={onClose}>
      <div
        className={css.viewer}
        role="dialog"
        aria-modal="true"
        aria-label={`Отчётность: ${title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={css.viewerHead}>
          <div>
            <b>{title}</b>
            <span>{current ? current.name || "Без названия" : "Документов нет"}</span>
          </div>
          {current ? (
            <a className={css.ghost} href={current.url} target="_blank" rel="noreferrer">
              В новой вкладке
            </a>
          ) : null}
          <button className={css.ghost} type="button" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>
        <div className={css.viewerBody}>
          <nav className={css.viewerList} aria-label="Документы">
            {files.map((doc, i) => (
              <button key={`${doc.url}-${i}`} type="button" data-on={i === index || undefined} onClick={() => setIndex(i)}>
                {doc.name || "Без названия"}
              </button>
            ))}
          </nav>
          <div className={css.viewerFrame}>
            {!current ? (
              <p className={css.note}>У этой бумаги пока нет загруженных отчётов.</p>
            ) : canPreview(current.url) ? (
              <iframe key={current.url} src={current.url} title={current.name || "Документ"} />
            ) : (
              <div className={css.viewerFallback}>
                <p>Этот формат нельзя показать в браузере.</p>
                <a className={css.primary} href={current.url} download>
                  Скачать файл
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
