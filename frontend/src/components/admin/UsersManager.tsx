"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/cms/client";
import type { UserRole } from "@/lib/cms/types";
import css from "@/app/admin/admin.module.css";

export function UsersManager() {
  const { store, error, busy, mutate } = useAdminStore();
  const [editing, setEditing] = useState<{ id?: string; name: string; email: string; role: UserRole; password: string } | null>(null);

  async function save() {
    if (!editing?.email || !editing.name) return;
    if (editing.id) await mutate("update", "users", editing, editing.id);
    else await mutate("create", "users", editing);
    setEditing(null);
  }

  return (
    <>
      <p className={css.kicker}>Система</p>
      <h1>Пользователи</h1>
      <p className={css.lead}>Учётные записи CMS и кабинета. Пароли хранятся в PostgreSQL в виде bcrypt-хеша.</p>
      <div className={css.toolbar}>
        <button className={css.primary} type="button" onClick={() => setEditing({ name: "", email: "", role: "editor", password: "" })}>
          + Добавить пользователя
        </button>
      </div>
      {error ? <p className={css.error}>{error}</p> : null}
      {editing ? (
        <form
          className={css.form}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className={css.fields}>
            <label className={css.field}>
              <span>Имя</span>
              <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required />
            </label>
            <label className={css.field}>
              <span>E-mail</span>
              <input type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} required />
            </label>
            <label className={css.field}>
              <span>Роль</span>
              <select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value as UserRole })}>
                <option value="admin">admin</option>
                <option value="editor">editor</option>
                <option value="investor">investor</option>
                <option value="issuer">issuer</option>
              </select>
            </label>
            <label className={css.field}>
              <span>Пароль</span>
              <input type="text" value={editing.password} onChange={(event) => setEditing({ ...editing, password: event.target.value })} placeholder={editing.id ? "без изменения" : ""} />
            </label>
          </div>
          <div className={css.rowActions}>
            <button className={css.primary} disabled={busy} type="submit">
              Сохранить
            </button>
            <button className={css.ghost} type="button" onClick={() => setEditing(null)}>
              Отмена
            </button>
          </div>
        </form>
      ) : null}
      <div className={css.table}>
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>E-mail</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {(store?.users ?? []).map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.role}</td>
                <td>
                  <div className={css.rowActions}>
                    <button className={css.ghost} type="button" onClick={() => setEditing({ ...item, password: "" })}>
                      Изменить
                    </button>
                    <button className={css.danger} type="button" onClick={() => void mutate("delete", "users", undefined, item.id)}>
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
