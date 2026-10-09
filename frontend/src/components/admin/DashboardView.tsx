"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminStore } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

export function DashboardView() {
  const { store } = useAdminStore();
  const news = store?.news.length ?? "…";
  const media = store?.media.length ?? "…";
  const requests = store ? store.requests.filter((item) => item.status === "new").length : "…";
  // Просмотры за сегодня — из сводки посещений (в общем хранилище только последние 300 записей).
  const [visits, setVisits] = useState<number | string>("…");
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/analytics/summary", { credentials: "include" })
      .then((response) => (response.ok ? (response.json() as Promise<{ today: number }>) : null))
      .then((data) => {
        if (!cancelled && data) setVisits(data.today);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className={css.cards}>
        <article className={css.card}>
          <small>Новости</small>
          <b>{news}</b>
        </article>
        <article className={css.card}>
          <small>Фото</small>
          <b>{media}</b>
        </article>
        <article className={css.card}>
          <small>Новые заявки</small>
          <b>{requests}</b>
        </article>
        <Link className={css.card} href="/admin/visits">
          <small>Посещения сегодня</small>
          <b>{visits}</b>
        </Link>
      </div>
      <div className={css.quick}>
        <Link href="/admin/news">
          <b>Новости</b>
          <small>Добавить публикацию и фото</small>
        </Link>
        <Link href="/admin/media">
          <b>Медиа</b>
          <small>Загрузить изображения</small>
        </Link>
        <Link href="/admin/settings">
          <b>Подвал и контакты</b>
          <small>Телефоны, адрес, соцсети</small>
        </Link>
        <Link href="/admin/hubs">
          <b>Главная</b>
          <small>Карточки на главной</small>
        </Link>
        <Link href="/admin/requests">
          <b>Заявки</b>
          <small>Обращения с сайта</small>
        </Link>
      </div>
    </>
  );
}

export function ApiDocs() {
  return <iframe className={css.swagger} src="http://localhost:4000/docs/" title="Swagger UI" />;
}
