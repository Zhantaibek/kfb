"use client";

import { useState } from "react";
import Link from "next/link";
import { PageIntro } from "@/components/Forms";
import { NewsList } from "@/components/NewsList";
import { PublicMain } from "@/components/PublicMain";
import { getIssuer } from "@/data/issuers";
import type { DisclosureEvent } from "@/data/disclosure-news";
import type { ListingDetail } from "@/data/listing-details";
import type { CmsNews } from "@/lib/cms/types";
import ui from "@/app/ui.module.css";
import css from "./disclosure.module.css";

const tabs = ["Дополнительная информация", "Отчетность", "Новости компании"] as const;
const eventsStep = 25;

type Props = {
  slug: string;
  news: CmsNews[];
  listing?: ListingDetail;
  disclosures: DisclosureEvent[];
};

export function IssuerView({ slug, news, listing, disclosures }: Props) {
  const issuer = getIssuer(slug);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Дополнительная информация");
  const [shown, setShown] = useState(eventsStep);
  if (!issuer) return null;

  const info = [
    ["Наименование компании", issuer.name],
    ["Вид деятельности", listing?.activity || issuer.activity],
    ["ФИО руководителя", issuer.director],
    ["Должность руководителя", issuer.position],
    ["Адрес", issuer.address],
    ["Телефон / Факс", issuer.phone],
  ];
  const extra = [
    ["Вид ценных бумаг", listing?.security || issuer.security],
    ["Торговые символы", listing?.symbols ?? ""],
    ["Отрасль", listing?.industry ?? ""],
    ["Дата прохождения листинга", listing?.listedAt ?? ""],
    ["Аудитор", listing?.auditor ?? ""],
    ["Регистратор", listing?.registrar || issuer.registrar],
    ["Маркет-мейкер", listing?.marketMaker ?? ""],
    ["Количество ценных бумаг", issuer.count],
    ["Цена размещения", issuer.price],
    ["Статус профиля", issuer.status],
  ];

  return (
    <PublicMain>
      <PageIntro
        crumb={
          <>
            <Link href="/">Главная</Link> / <Link href="/disclosure">Центр раскрытия информации</Link> / {issuer.name}
          </>
        }
        title={issuer.name}
      />
      <div className={`${ui.tableWrap} ${css.kv}`}>
        <table>
          <tbody>
            {info.map(([label, value]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{value || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={css.tabs}>
        {tabs.map((item) => (
          <button key={item} type="button" data-on={String(tab === item)} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>
      {tab === "Дополнительная информация" ? (
        <div className={`${ui.tableWrap} ${css.kv}`}>
          <table>
            <tbody>
              {extra.map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {tab === "Отчетность" ? (
        <div>
          <h2>Отчетность</h2>
          {listing?.documents.length ? (
            <div className={`${ui.tableWrap} ${css.kv}`}>
              <table>
                <tbody>
                  {listing.documents.map((doc) => (
                    <tr key={doc.url}>
                      <td>{doc.name}</td>
                      <td>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          Открыть
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={css.empty}>Документы этого эмитента пока не опубликованы.</p>
          )}
          <p className={css.empty}>Полный архив файлов публикуется в кабинете эмитента oi.kse.kg.</p>
        </div>
      ) : null}
      {tab === "Новости компании" ? (
        <div>
          {news.length ? <NewsList items={news} /> : null}
          {disclosures.length ? (
            <>
              <h2>Раскрытие существенных фактов</h2>
              <div className={`${ui.tableWrap} ${css.events}`}>
                <table>
                  <tbody>
                    {disclosures.slice(0, shown).map((event) => (
                      <tr key={event.url}>
                        <td>{event.date}</td>
                        <td>
                          <a href={event.url} target="_blank" rel="noreferrer">
                            {event.title}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {shown < disclosures.length ? (
                <button type="button" className={css.more} onClick={() => setShown((value) => value + eventsStep)}>
                  Показать ещё ({disclosures.length - shown})
                </button>
              ) : null}
            </>
          ) : null}
          {!news.length && !disclosures.length ? <p className={css.empty}>Пока нет новостей этой компании.</p> : null}
        </div>
      ) : null}
    </PublicMain>
  );
}
