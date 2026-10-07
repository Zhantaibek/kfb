import type { Metadata } from "next";
import { EduMount } from "./EduMount";

export const metadata: Metadata = { title: "Учебный центр" };

/** Учебный центр КФБ: одна Next-страница, дальше маршруты ведёт React Router внутри приложения. */
export default function EducationAppPage() {
  return <EduMount />;
}
