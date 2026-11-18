export type NewsKind = "exchange" | "company" | "urgent";

export type NewsItem = {
  slug: string;
  date: string;
  tag: string;
  kind: NewsKind;
  issuerSlug?: string;
  title: string;
  excerpt: string;
  body: string[];
};


/**
 * Начальные новости для чистой базы. Демо-новости убраны: настоящие новости — в архиве старого сайта
 * (scripts/import-legacy-news.ts) и добавляются сотрудниками в админке.
 */
export const news: NewsItem[] = [];
