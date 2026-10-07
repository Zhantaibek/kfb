"use client";

import { useAdminStore } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

/** Журнал аудита. Посещения — отдельная страница со статистикой (VisitsManager). */
export function LogManager() {
  const { store, error } = useAdminStore();
  const audit = store?.audit ?? [];

  return (
    <>
      <p className={css.kicker}>Система</p>
      <h1>Журнал аудита</h1>
      <p className={css.lead}>Кто создал, изменил или удалил записи CMS.</p>
      {error ? <p className={css.error}>{error}</p> : null}
      <div className={css.table}>
        <table>
          <thead>
            <tr>
              <th>Действие</th>
              <th>Сущность</th>
              <th>Деталь</th>
              <th>Кто</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((item) => (
              <tr key={item.id}>
                <td>{item.action}</td>
                <td>{item.entity}</td>
                <td className={css.wrap}>{item.detail}</td>
                <td>{item.actor}</td>
                <td>{item.at.replace("T", " ").slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
