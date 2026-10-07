import type {
  CmsIssuer,
  CmsListingEntry,
  CmsNews,
  CmsPage,
  CmsSiteSettings,
  IssuerData,
  PublicContent,
} from "@/lib/cms/types";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const emptySettings: CmsSiteSettings = {
  id: "site",
  tagline: "",
  address: "",
  phones: "",
  emails: "",
  fax: "",
  facebookUrl: "",
  instagramUrl: "",
  telegramUrl: "",
  license: "",
  copyright: "",
  eduUrl: "",
  disclosurePhone: "",
  eduPhone: "",
  i18n: {},
  updatedAt: "",
};

export async function loadPublicContent(): Promise<PublicContent> {
  try {
    return await getPublicContent();
  } catch {
    return { news: [], slides: [], media: [], pages: [], menu: [], hubs: [], management: [], partners: [], sustainableBonds: [], esgReports: [], verifiers: [], gcbParticipants: [], landingSections: [], settings: emptySettings };
  }
}

export async function getPublicContent(): Promise<PublicContent> {
  const response = await fetch(`${apiUrl}/api/public/content`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("CMS API недоступен");
  }
  return (await response.json()) as PublicContent;
}

export async function loadIssuerData(): Promise<IssuerData> {
  try {
    const response = await fetch(`${apiUrl}/api/public/issuers`, { cache: "no-store" });
    if (!response.ok) throw new Error("CMS API недоступен");
    return (await response.json()) as IssuerData;
  } catch {
    return { issuers: [], listing: [] };
  }
}

export function findIssuer(data: IssuerData, slug: string): CmsIssuer | undefined {
  const key = slug.toLowerCase();
  return data.issuers.find((item) => item.slug.toLowerCase() === key);
}

export function findListingBySlug(data: IssuerData, slug: string): CmsListingEntry | undefined {
  const key = slug.toLowerCase();
  return data.listing.find((item) => item.issuerSlug.toLowerCase() === key);
}

export function findNews(content: PublicContent, slug: string): CmsNews | undefined {
  return content.news.find((item) => item.slug === slug);
}

export function findPage(content: PublicContent, slug: string): CmsPage | undefined {
  return findPageByPath(content, `/p/${slug}`) ?? findPageByPath(content, `/${slug}`);
}

export function findPageByPath(content: PublicContent, path: string): CmsPage | undefined {
  const clean = path.startsWith("/") ? path.replace(/\/$/, "") || "/" : `/${path}`;
  return content.pages.find((item) => item.path === clean || item.path === path);
}
