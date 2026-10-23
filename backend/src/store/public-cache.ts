/**
 * Кеш публичного контента: GET /api/public/content дёргается на каждой странице сайта,
 * поэтому ответ держим 30 секунд. Любая правка в админке или загрузка файла сбрасывает кеш сразу.
 */
const TTL_MS = 30_000;

let cached: { at: number; value: Promise<unknown> } | null = null;

export function cachedPublic<T>(load: () => Promise<T>): Promise<T> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value as Promise<T>;
  const value = load();
  cached = { at: Date.now(), value };
  // Ошибку не кешируем — следующий запрос попробует снова.
  value.catch(() => {
    if (cached?.value === value) cached = null;
  });
  return value;
}

export function invalidatePublicContent() {
  cached = null;
}
