"use client";

import { useCallback, useEffect, useState } from "react";
import type { CmsStore, CmsUser } from "@/lib/cms/types";

export type AdminStore = Omit<CmsStore, "users"> & { users: Omit<CmsUser, "password">[] };

export async function adminJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }),
      ...init?.headers,
    },
  });
  const data = (await response.json()) as T & { error?: string };
  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("unauthorized");
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

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
  }, [reload]);

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
