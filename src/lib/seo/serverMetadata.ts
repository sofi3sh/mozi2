import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { stripLangPrefix, type SiteLang } from "@/lib/lang";
import { prisma } from "@/lib/prisma";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

function normalizeHost(raw: string): { host: string; hostname: string } {
  const host = (raw || "").split(",")[0].trim();
  const hostname = host.split(":")[0].trim().toLowerCase();
  return { host, hostname };
}

function safeUrl(originFallback: string, path: string) {
  try {
    return new URL(path, originFallback);
  } catch {
    return new URL(originFallback);
  }
}

function stripTrailingSlashes(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length <= 1) return "/";
  return pathname.replace(/\/+$/, "");
}

function computeCanonical({
  origin,
  pathname,
  searchParams,
}: {
  origin: string;
  pathname: string;
  searchParams?: SearchParams;
}) {
  const url = safeUrl(origin, stripTrailingSlashes(pathname || "/"));
  url.hash = "";

  const dropPrefixes = ["utm_"];
  const dropExact = new Set(["gclid", "fbclid", "yclid", "_gl", "seo"]);

  // Only keep query params that represent distinct landing pages.
  const allow = new Set<string>();
  const pNoLang = stripLangPrefix(url.pathname).pathname;
  if (pNoLang === "/categories") allow.add("city");
  if (pNoLang === "/venues") {
    allow.add("city");
    allow.add("cat");
  }
// For all other routes: no query params in canonical.
  if (!allow.size) {
    url.search = "";
    return url.toString();
  }

  const sp = searchParams || {};
  for (const key of Object.keys(sp)) {
    const k = String(key);
    const lower = k.toLowerCase();
    const val = first(sp[key]);
    if (!val) continue;

    if (dropExact.has(lower) || dropPrefixes.some((p) => lower.startsWith(p))) continue;
    if (!allow.has(lower)) continue;

    url.searchParams.set(k, val);
  }

  return url.toString();
}


function normalizeCanonical(raw: string, origin: string) {
  const s = (raw || "").toString().trim();
  if (!s) return "";
  if (s.startsWith("/")) return safeUrl(origin, s).toString();
  return s;
}

export const getGlobalSettings = unstable_cache(
  async () => {
    const row = await prisma.setting.findUnique({
      where: { scope_cityId_key: { scope: "global", cityId: "global", key: "global" } },
      select: { value: true },
    });
    const value = (row?.value || {}) as any;
    return value;
  },
  ["mozi:global_settings_v1"],
  { revalidate: 60 }
);

function getLangFromRequest(): SiteLang {
  // 1) explicit cookie (set by middleware / client)
  try {
    const c = cookies();
    const v = (c.get("mozi_lang")?.value || "").toString();
    if (v === "ua" || v === "ru") return v;
  } catch {}

  // 2) Accept-Language
  try {
    const h = headers();
    const al = (h.get("accept-language") || "").toLowerCase();
    if (al.includes("ru")) return "ru";
  } catch {}

  return "ua";
}
async function detectHostCityId(hostname: string): Promise<string | null> {
  try {
    const global = await getGlobalSettings();
    const sub = (global?.subdomains || {}) as any;
    const enabled = Boolean(sub?.enabled);
    const rootDomainRaw = String(sub?.rootDomain || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*/, "");
    const rootDomain = rootDomainRaw.split(":")[0].toLowerCase();

    if (!enabled || !rootDomain) return null;
    if (!hostname.endsWith(rootDomain)) return null;

    const prefix = hostname.slice(0, hostname.length - rootDomain.length).replace(/\.$/, "");
    if (!prefix) return null;

    // We only accept a single label like "lviv" in "lviv.rootDomain"
    if (prefix.includes(".")) return null;

    const reservedRaw = Array.isArray(sub?.reserved) ? sub.reserved : ["www", "admin", "api", "static"];
    const reserved = new Set(reservedRaw.map((x: any) => String(x || "").trim().toLowerCase()).filter(Boolean));
    if (reserved.has(prefix)) return null;

    return prefix;
  } catch {
    return null;
  }
}

async function getSeoRow(cityId: string, pageKey: string, lang: "ua" | "ru") {
  // Preferred: SeoEntry table
  try {
    const row = await prisma.seoEntry.findUnique({
      where: { cityId_pageKey_lang: { cityId, pageKey, lang } },
    });
    if (row) return row as any;
  } catch {
    // ignore and fallback to settings
  }

  // Fallback: Setting(key="seoEntries") (works even if SeoEntry table isn't migrated)
  try {
    const scope = cityId === "global" ? "global" : "city";
    const cityKey = cityId === "global" ? "global" : cityId;
    const s = await prisma.setting.findUnique({
      where: { scope_cityId_key: { scope, cityId: cityKey, key: "seoEntries" } },
    });

    const val: any = s?.value;
    if (!val || typeof val !== "object") return null;

    const payload: any = val?.[pageKey];
    if (!payload || typeof payload !== "object") return null;

    const fields: any = payload?.[lang];
    if (!fields || typeof fields !== "object") return null;

    return {
      cityId,
      pageKey,
      lang,
      metaTitle: fields.metaTitle ?? "",
      metaDescription: fields.metaDescription ?? "",
      metaKeywords: fields.metaKeywords ?? "",
      ogTitle: fields.ogTitle ?? "",
      ogDescription: fields.ogDescription ?? "",
      ogImage: fields.ogImage ?? "",
      canonical: fields.canonical ?? "",
      robotsIndex: fields.robotsIndex ?? true,
      robotsFollow: fields.robotsFollow ?? true,
      bottomText: fields.bottomText ?? "",
      bottomStyle: (fields.bottomTextStyle ?? fields.bottomStyle ?? {}) as any,
      updatedAt: new Date(Number(payload?.updatedAt) || Date.now()),
      createdAt: new Date(Number(payload?.updatedAt) || Date.now()),
      id: "settings_fallback",
    } as any;
  } catch {
    return null;
  }
}

function keywordsToList(raw: any): string[] | undefined {
  const s = String(raw || "").trim();
  if (!s) return undefined;
  const parts = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

export async function buildPageMetadata({
  pageKey,
  pathname,
  searchParams,
  cityId: explicitCityId,
  defaults,
  lang: explicitLang,
}: {
  pageKey: string;
  pathname: string;
  searchParams?: SearchParams;
  cityId?: string | null;
  defaults?: { title?: string; description?: string };
  lang?: SiteLang;
}): Promise<Metadata> {
  const h = headers();
  const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = (h.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  const { host, hostname } = normalizeHost(hostHeader);

  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  const origin = host ? `${proto}://${host}` : envBase || "https://localhost:3000";

  const lang: SiteLang = explicitLang || getLangFromRequest();

  const hostCityId = hostname ? await detectHostCityId(hostname) : null;

  const qsCity = first(searchParams?.city);
  const cookieCity = (() => {
    try {
      return (cookies().get("mozi_city")?.value || "").toString();
    } catch {
      return "";
    }
  })();

  const cityId = (explicitCityId || hostCityId || qsCity || cookieCity || "").toString().trim() || "global";

  const global = await getGlobalSettings();
  const brandName = String(global?.brandName || "mozi");

  const row = (await getSeoRow(cityId, pageKey, lang)) || (cityId !== "global" ? await getSeoRow("global", pageKey, lang) : null);

  const title = (row?.metaTitle || defaults?.title || `${brandName}`).toString().trim();
  const description = (row?.metaDescription || defaults?.description || "").toString().trim();
  const canonical = normalizeCanonical(String(row?.canonical || ""), origin) || computeCanonical({ origin, pathname, searchParams });

  const pathNoLang = stripLangPrefix(pathname || "/").pathname;
  const localize = (l: SiteLang) => (pathNoLang === "/" ? `/${l}` : `/${l}${pathNoLang}`);
  const uaUrl = computeCanonical({ origin, pathname: localize("ua"), searchParams });
  const ruUrl = computeCanonical({ origin, pathname: localize("ru"), searchParams });

  const ogLocale = lang === "ru" ? "ru_UA" : "uk_UA";
  const ogAlternate = lang === "ru" ? ["uk_UA"] : ["ru_UA"];


  const robotsIndex = row?.robotsIndex ?? true;
  const robotsFollow = row?.robotsFollow ?? true;

  const ogTitle = (row?.ogTitle || title).toString().trim();
  const ogDescription = (row?.ogDescription || description).toString().trim();
  const ogImage = (row?.ogImage || "").toString().trim();

  const md: Metadata = {
    metadataBase: new URL(origin),
    title: title || undefined,
    description: description || undefined,
    keywords: keywordsToList(row?.metaKeywords),
    robots: { index: Boolean(robotsIndex), follow: Boolean(robotsFollow) },
    alternates: { canonical, languages: { "uk-UA": uaUrl, "ru-UA": ruUrl, "x-default": uaUrl } },
    openGraph: {
      type: "website",
      locale: ogLocale,
      alternateLocale: ogAlternate,
      siteName: brandName,
      title: ogTitle || undefined,
      description: ogDescription || undefined,
      url: canonical,
      images: ogImage ? [ogImage] : undefined,
    },
  };

  return md;
}
