import Link from "next/link";
import type { Metadata } from "next";
import { NewsList } from "@/components/NewsList";
import { PageIntro } from "@/components/Forms";
import { isGeneralNews } from "@/lib/cms/types";
import { loadPublicContent } from "@/lib/cms/public";
import { PublicMain } from "@/components/PublicMain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Новости" };

export default async function NewsPage() {
  const items = (await loadPublicContent()).news.filter(isGeneralNews);

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / Новости
          </>
        }
        title="Пресс-центр"
        lead="Новости биржи и срочные объявления. Сообщения эмитентов публикуются на страницах компаний."
      />
      <NewsList items={items} />
    </PublicMain>
  );
}
