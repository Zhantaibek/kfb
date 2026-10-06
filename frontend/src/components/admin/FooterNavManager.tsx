"use client";

import { PrimaryNavManager } from "@/components/admin/PrimaryNavManager";
import { useAdminStore } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

/** Ссылки подвала: колонки (группа «footer»), кнопки баннера и ссылки с иконкой документа. */
export function FooterNavManager() {
  const { store, error, busy, mutate, setError } = useAdminStore();
  const menu = store?.menu ?? [];
  const shared = { busy, mutate, setError };
  const columns = menu.filter((item) => item.group === "footer" && !item.parentId).sort((a, b) => a.order - b.order);

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Ссылки подвала</h1>
      <p className={css.lead}>
        Колонки, кнопки и ссылки внизу сайта. Меняются отдельно от бургер-меню, каждый пункт сохраняется сразу. Телефоны, адрес и
        копирайт — в разделе «Контакты и подвал».
      </p>
      {error ? <p className={css.error}>{error}</p> : null}

      <PrimaryNavManager
        {...shared}
        items={columns}
        group="footer"
        title="Колонки подвала"
        note="Заголовки колонок со ссылками. Ссылки каждой колонки — ниже."
        addLabel="+ колонка"
        emptyText="Колонок нет — в подвале показываются первые группы бургер-меню."
        withHref={false}
        removeText={(item) => `Удалить колонку «${item.label}» вместе со всеми её ссылками?`}
      />

      {columns.map((column) => (
        <PrimaryNavManager
          {...shared}
          key={column.id}
          items={menu.filter((item) => item.group === "footer" && item.parentId === column.id)}
          group="footer"
          parentId={column.id}
          title={`Колонка «${column.label}»`}
          note="Ссылки под заголовком колонки."
          emptyText="В колонке пока нет ссылок."
          removeText={(item) => `Убрать «${item.label}» из подвала? Сама страница останется.`}
        />
      ))}

      <PrimaryNavManager
        {...shared}
        items={menu.filter((item) => item.group === "footer-buttons")}
        group="footer-buttons"
        title="Кнопки в баннере"
        note="Крупные кнопки под ноутбуком с котировками: первая — с иконкой графика, вторая — с конвертом."
        addLabel="+ кнопка"
        emptyText="Кнопок нет — блок кнопок в подвале скрыт."
        removeText={(item) => `Убрать кнопку «${item.label}» из подвала?`}
      />

      <PrimaryNavManager
        {...shared}
        items={menu.filter((item) => item.group === "footer-links")}
        group="footer-links"
        title="Ссылки с иконкой документа"
        note="Рядом с телефонами: «Правила и тарифы», «Раскрытие» и т.п."
        emptyText="Ссылок нет — этот блок в подвале скрыт."
        removeText={(item) => `Убрать «${item.label}» из подвала?`}
      />
    </>
  );
}
