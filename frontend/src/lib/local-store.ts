"use client";

import { useSyncExternalStore } from "react";

/** Своё событие: localStorage сам оповещает только другие вкладки, а нам нужно и текущую. */
const CHANGE_EVENT = "kse-local-storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Значение из localStorage как внешнее хранилище React: на сервере и при гидратации — null,
 * сразу после неё — сохранённое значение. Без setState в эффекте и без расхождения разметки.
 */
export function useStoredString(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Приватный режим или запрет хранилища — значение просто не запомнится.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
