"use client";

import { useCallback, useEffect, useState } from "react";
import type { CmsStore, CmsUser } from "@/lib/cms/types";

export type AdminStore = Omit<CmsStore, "users"> & { users: Omit<CmsUser, "password">[] };

export async function adminJson<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, {
      credentials: "include",
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }),
        ...init?.headers,
      },
    });
  } catch {
    // Нет сети или сервер недоступен: понятное сообщение вместо «Failed to fetch»; введённое в форме остаётся.
    throw new Error("Нет связи с сервером — изменения не сохранены. Проверьте интернет и повторите.");
  }
  // Прокси при сбое API может вернуть не JSON — тогда общий текст ошибки.
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (response.status === 401) {
    // replace: страница с истекшей сессией не остаётся в истории — «Назад» не вернёт на неё.
    window.location.replace("/admin/login");
    throw new Error("unauthorized");
  }
  if (response.status === 403 && data.error === "mfa_setup_required") {
    // Сотрудник без 2FA при обязательном 2FA — на страницу настройки.
    window.location.replace("/admin/profile");
    throw new Error("mfa_setup_required");
  }
  if (!response.ok) throw new Error(data.error ?? "Ошибка запроса");
  return data;
}

export function useAdminStore() {
  const [store, setStore] = useState<AdminStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const data = await adminJson<AdminStore>("/api/admin/data");
    setStore(data);
  }, []);

  // Первая загрузка: состояние меняем только в колбэках запроса, не в теле эффекта.
  useEffect(() => {
    let cancelled = false;
    adminJson<AdminStore>("/api/admin/data")
      .then((data) => {
        if (!cancelled) setStore(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function mutate(op: "create" | "update" | "delete", collection: string, item?: object, id?: string) {
    setBusy(true);
    setError(null);
    try {
      const payload: { op: string; collection: string; id?: string; item?: object } = { op, collection };
      if (id) payload.id = id;
      if (item) payload.item = item;
      const data = await adminJson<AdminStore>("/api/admin/data", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const media = await adminJson<{ id: string; name: string; url: string }>("/api/admin/upload", {
        method: "POST",
        body,
        headers: {},
      });
      await reload();
      return media;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return { store, error, busy, reload, mutate, upload, setError };
}
