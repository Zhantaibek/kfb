"use client";

import Link from "next/link";
import { AdminEditButton } from "@/components/AdminEditButton";
import { LoginForm } from "@/components/LoginForm";
import { useTr } from "@/lib/use-tr";
import styles from "@/app/login/login.module.css";

export function CabinetEntry() {
  const tr = useTr();

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link className={styles.back} href="/">
          ← {tr("Назад")}
        </Link>
        <AdminEditButton />
      </div>

      <div className={styles.card}>
        <aside className={styles.welcome}>
          <img src="/brand/kse-mark.png" alt="" />
          <h2>{tr("Добро пожаловать")}</h2>
          <p>{tr("Личный кабинет. Учётную запись создаёт администратор биржи.")}</p>
        </aside>

        <div className={styles.formSide}>
          <h2>{tr("Вход")}</h2>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
