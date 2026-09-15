"use client";

import Link from "next/link";
import { useAdminStore } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

export function DashboardView() {
  const { store } = useAdminStore();
  const news = store?.news.length ?? "…";
  const media = store?.media.length ?? "…";
  const requests = store ? store.requests.filter((item) => item.status === "new").length : "…";
  const visits = store?.visits.length ?? "…";

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
        <article className={css.card}>
          <small>Посещения</small>
          <b>{visits}</b>
        </article>
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
          <b>Контакты</b>
          <small>Телефоны и подвал</small>
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
