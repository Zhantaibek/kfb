"use client";

import { useAdminStore } from "@/lib/cms/client";
import type { CmsMedia } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

export function MediaManager() {
  const { store, error, busy, mutate, upload } = useAdminStore();

  async function remove(item: CmsMedia) {
    if (!window.confirm(`Удалить «${item.name}»? Файл пропадёт из медиатеки и с баннеров, где он выбран.`)) return;
    try {
      await mutate("delete", "media", undefined, item.id);
    } catch {
      // сообщение уже в error
    }
  }

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Медиа / фото</h1>
      <p className={css.lead}>
        Склад изображений. Само по себе фото на сайте не видно — прикрепите его в слайдер, блок главной или новость.
      </p>
      <div className={css.toolbar}>
        <label className={css.primary} style={{ display: "inline-flex", alignItems: "center" }}>
          + Загрузить фото
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            disabled={busy}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) await upload(file);
            }}
          />
        </label>
      </div>
      {error ? <p className={css.error}>{error}</p> : null}
      <div className={css.mediaGrid}>
        {(store?.media ?? []).map((item) => (
          <article className={css.mediaCard} key={item.id}>
            <img src={item.url} alt={item.name} />
            <div>
              <b>{item.name}</b>
              <button className={css.danger} type="button" disabled={busy} onClick={() => void remove(item)}>
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
