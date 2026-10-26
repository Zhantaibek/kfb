"use client";

import Link from "next/link";

/**
 * Сбой в корневом layout: своя страница целиком (стили сайта сюда не попадают), цвета — по теме ОС.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          colorScheme: "light dark",
        }}
      >
        <title>Сайт временно недоступен — Кыргызская фондовая биржа</title>
        <main style={{ maxWidth: 520, display: "grid", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>Сайт временно недоступен</h1>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Произошёл сбой. Попробуйте обновить страницу через минуту.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => retry()} style={{ padding: "10px 18px", fontSize: 15, cursor: "pointer" }}>
              Повторить
            </button>
            <Link href="/" style={{ padding: "10px 4px", fontSize: 15 }}>
              На главную
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
