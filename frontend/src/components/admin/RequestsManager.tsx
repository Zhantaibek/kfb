"use client";

import { useAdminStore } from "@/lib/cms/client";
import css from "@/app/admin/admin.module.css";

export function RequestsManager() {
  const { store, error, mutate } = useAdminStore();

  return (
    <>
      <p className={css.kicker}>CMS · КФБ</p>
      <h1>Заявки</h1>
      <p className={css.lead}>Сообщения с форм сайта: контакты, листинг, ГЦБ и обучение.</p>
      {error ? <p className={css.error}>{error}</p> : null}
      <div className={css.table}>
        <table>
          <thead>
            <tr>
              <th>Статус</th>
              <th>Источник</th>
              <th>Данные</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {(store?.requests ?? []).map((item) => (
              <tr key={item.id}>
                <td>
                  <span className={css.status} data-on={item.status}>
                    {item.status}
                  </span>
                </td>
                <td>{item.source}</td>
                <td className={css.wrap}>
                  {Object.entries(item.payload).map(([key, value]) => (
                    <div key={key}>
                      <b>{key}:</b> {value}
                    </div>
                  ))}
                </td>
                <td>{item.createdAt.replace("T", " ").slice(0, 16)}</td>
                <td>
                  <div className={css.rowActions}>
                    {item.status === "new" ? (
                      <button className={css.ghost} type="button" onClick={() => void mutate("update", "requests", { ...item, status: "done" }, item.id)}>
                        Закрыть
                      </button>
                    ) : null}
                    <button className={css.danger} type="button" onClick={() => void mutate("delete", "requests", undefined, item.id)}>
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
