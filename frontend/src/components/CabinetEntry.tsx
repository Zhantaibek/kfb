"use client";

import Image from "next/image";
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
          <Image src="/brand/kse-mark.png" alt="" width={160} height={152} />
          <h2>{tr("Добро пожаловать")}</h2>
          <p>{tr("Вход в панель управления сайтом. Учётную запись создаёт администратор биржи.")}</p>
        </aside>

        <div className={styles.formSide}>
          <h1>{tr("Вход")}</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
