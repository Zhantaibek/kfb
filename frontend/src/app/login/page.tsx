import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";
import { PageIntro } from "@/components/Forms";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Вход в кабинет" };

export default function LoginPage() {
  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Кабинет
          </>
        }
        title="Вход"
        lead="Личный кабинет. Вход через PostgreSQL, сессия в HttpOnly-cookie."
      />
      <LoginForm />
    </PublicMain>
  );
}
