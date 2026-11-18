import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { longDate, num, pct } from "./data";
import { ext, marketTabs, typeName, type FeedItem, type loadFullHome } from "./full-home";
import { Tabs } from "./Tabs";

/**
 * Общие блоки данных главной для «полных» макетов (варианты 69+). Разметка одна, оформление —
 * из CSS-модуля варианта (prop css). Нужные классы: delta, rows, table, left, muted, list, leaders,
 * feed, partners, partner, partnerLogo + классы Tabs (tabs, tabsHead, tabList, tabPanel).
 */
type Full = Awaited<ReturnType<typeof loadFullHome>>;
type Css = Readonly<Record<string, string>>;

export function Delta({ value, css }: { value: number; css: Css }) {
  return (
    <span className={css.delta} data-dir={value > 0 ? "up" : value < 0 ? "down" : undefined}>
      {pct(value)}
    </span>
  );
}

/** Итоги торгов последней сессии. */
export function TradingRows({ f, css }: { f: Full; css: Css }) {
  const { data } = f;
  return (
    <dl className={css.rows}>
      {data.tradingRows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>
            {num(row.value, 4)} <Delta value={row.change} css={css} />
          </dd>
        </div>
      ))}
      <div>
        <dt>Индекс KSE</dt>
        <dd>
          {num(data.index.value, 2)} <Delta value={data.index.change} css={css} />
        </dd>
      </div>
      <div>
        <dt>Капитализация</dt>
        <dd>{num(data.index.capitalization, 1)} млрд</dd>
      </div>
      <div>
        <dt>Сделок за сессию</dt>
        <dd>{num(data.volume.trades)}</dd>
      </div>
    </dl>
  );
}

/** Рынки по вкладкам: все / акции / облигации / драгметаллы. */
export function MarketTabs({ f, css, limit = 6 }: { f: Full; css: Css; limit?: number }) {
  return (
    <Tabs
      label="Рынки"
      css={css}
      tabs={marketTabs.map((t) => {
        const rows = f.priced.filter((item) => (t.types as readonly string[]).includes(item.type)).slice(0, limit);
        return {
          label: t.label,
          content: rows.length ? (
            <table className={css.table}>
              <thead>
                <tr>
                  <th scope="col">Инструмент</th>
                  <th scope="col">Цена</th>
                  <th scope="col">Объём, тыс.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.ticker}>
                    <th scope="row">
                      <Link href={item.href}>
                        <b>{item.ticker}</b> <small>{item.description || typeName[item.type]}</small>
                      </Link>
                    </th>
                    <td>{num(item.price, 2)}</td>
                    <td>{item.volume ? num(item.volume, 2) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={css.muted}>В этой секции сделок в сессии не было.</p>
          ),
        };
      })}
    />
  );
}

/** Сделки последней сессии. */
export function Trades({ f, css, limit = 6 }: { f: Full; css: Css; limit?: number }) {
  const trades = f.market.lastTrades.slice(0, limit);
  if (!trades.length) return <p className={css.muted}>Сделок в последней сессии не было.</p>;
  return (
    <ul className={css.list}>
      {trades.map((t) => (
        <li key={`${t.ticker}-${t.price}`}>
          <b>{t.ticker}</b>
          <span>{t.name}</span>
          <em>{num(t.price, 2)} сом</em>
        </li>
      ))}
    </ul>
  );
}

/** Лидеры недели полосами + итоги недели. */
export function Leaders({ f, css }: { f: Full; css: Css }) {
  return (
    <>
      <ol className={css.leaders}>
        {f.data.leaders.map((row) => (
          <li key={row.ticker}>
            <span>
              <b>{row.ticker}</b>
              <em>{num(row.volume, 2)}</em>
            </span>
            <i style={{ "--w": `${(row.volume / f.maxLeader) * 100}%` } as CSSProperties} aria-hidden="true" />
          </li>
        ))}
      </ol>
      <dl className={css.rows}>
        <div>
          <dt>Итого за неделю</dt>
          <dd>{num(f.market.weekTotal.volume, 2)}</dd>
        </div>
        <div>
          <dt>Сделок</dt>
          <dd>{num(f.market.weekTotal.deals)}</dd>
        </div>
        <div>
          <dt>Бумаг с объёмом</dt>
          <dd>{num(f.market.weekTotal.papers)}</dd>
        </div>
      </dl>
    </>
  );
}

/** Таблица котировок. */
export function QuotesTable({ f, css, limit = 12 }: { f: Full; css: Css; limit?: number }) {
  return (
    <table className={css.table}>
      <thead>
        <tr>
          <th scope="col">Тикер</th>
          <th scope="col">Бумага</th>
          <th scope="col">Цена</th>
          <th scope="col">Вид</th>
          <th scope="col">Объём, тыс.</th>
        </tr>
      </thead>
      <tbody>
        {f.data.instruments.slice(0, limit).map((item) => (
          <tr key={item.ticker}>
            <th scope="row">
              <Link href={item.href}>
                <b>{item.ticker}</b>
              </Link>
            </th>
            <td className={css.left}>{item.issuer || item.name}</td>
            <td>{item.price ? num(item.price, 2) : "—"}</td>
            <td>{item.description || typeName[item.type]}</td>
            <td>{item.volume ? num(item.volume, 2) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Лента новостей списком. */
export function Feed({ items, css, limit = 6 }: { items: FeedItem[]; css: Css; limit?: number }) {
  if (!items.length) return <p className={css.muted}>Пока нет публикаций.</p>;
  return (
    <ol className={css.feed}>
      {items.slice(0, limit).map((item) => (
        <li key={item.key}>
          <Link href={item.href} {...ext(item.external)}>
            <small>
              {longDate(item.date)}
              {item.company ? ` · ${item.company}` : ""}
            </small>
            <b>{item.title}</b>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Новости биржи / компаний во вкладках. */
export function NewsTabs({ f, css, limit = 6, moreClass }: { f: Full; css: Css; limit?: number; moreClass?: string }) {
  return (
    <Tabs
      label="Новости"
      css={css}
      tabs={[
        {
          label: "Новости биржи",
          content: <Feed items={f.exchangeFeed} css={css} limit={limit} />,
          aside: (
            <Link href="/news" className={moreClass}>
              Все новости →
            </Link>
          ),
        },
        {
          label: "Новости компаний",
          content: <Feed items={f.companyFeed} css={css} limit={limit} />,
          aside: (
            <Link href="/disclosure" className={moreClass}>
              Все сообщения →
            </Link>
          ),
        },
      ]}
    />
  );
}

/** Партнёры карточками с логотипом. */
export function Partners({ f, css, limit = 8 }: { f: Full; css: Css; limit?: number }) {
  return (
    <div className={css.partners}>
      {f.data.partners.slice(0, limit).map((p) => (
        <Link key={p.slug} href={`/about/partners/${p.slug}`} className={css.partner} title={p.name}>
          <span className={css.partnerLogo}>{p.logo ? <Image src={p.logo} alt={p.mark} fill sizes="160px" unoptimized /> : <b>{p.mark}</b>}</span>
          <b>{p.mark}</b>
          <small>{p.caption}</small>
          <span>{p.lead}</span>
          {p.site ? <em>{p.site.replace(/^https?:\/\//, "").replace(/\/$/, "")}</em> : null}
        </Link>
      ))}
    </div>
  );
}
