import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getGlobalSettings } from "@/lib/seo/serverMetadata";
import type { SiteLang } from "@/lib/lang";

const SUPPORTED: SiteLang[] = ["ua", "ru"];

function normalizeHost(raw: string): { host: string; hostname: string } {
  const host = (raw || "").split(",")[0].trim();
  const hostname = host.split(":")[0].trim().toLowerCase();
  return { host, hostname };
}

function siteBaseFromRequest() {
  const h = headers();
  const hostHeader = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = (h.get("x-forwarded-proto") || "https").split(",")[0].trim() || "https";
  const { host } = normalizeHost(hostHeader);

  const envBase = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  if (host) return `${proto}://${host}`;
  return envBase || "http://localhost:3000";
}

async function detectHostCityId(hostname: string): Promise<string | null> {
  try {
    const global = await getGlobalSettings();
    const sub = (global?.subdomains || {}) as any;
    const enabled = Boolean(sub?.enabled);
    const rootDomainRaw = String(sub?.rootDomain || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*/, "");
    const rootDomain = rootDomainRaw.split(":")[0].toLowerCase();

    if (!enabled || !rootDomain) return null;
    if (!hostname.endsWith(rootDomain)) return null;

    const prefix = hostname.slice(0, hostname.length - rootDomain.length).replace(/\.$/, "");
    if (!prefix) return null;
    if (prefix.includes(".")) return null;

    const reservedRaw = Array.isArray(sub?.reserved) ? sub.reserved : ["www", "admin", "api", "static"];
    const reserved = new Set(reservedRaw.map((x: any) => String(x || "").trim().toLowerCase()).filter(Boolean));
    if (reserved.has(prefix)) return null;

    return prefix;
  } catch {
    return null;
  }
}

function localizePath(pathNoLang: string, lang: SiteLang) {
  const p = (pathNoLang || "/").toString();
  if (p === "/") return `/${lang}`;
  return `/${lang}${p.startsWith("/") ? p : `/${p}`}`;
}

function alternates(base: string, pathNoLang: string) {
  const ua = `${base}${localizePath(pathNoLang, "ua")}`;
  const ru = `${base}${localizePath(pathNoLang, "ru")}`;
  return { languages: { "uk-UA": ua, "ru-UA": ru, "x-default": ua } as any };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBaseFromRequest().replace(/\/$/, "");
  const now = new Date();

  const hostHeader = headers().get("x-forwarded-host") || headers().get("host") || "";
  const { hostname } = normalizeHost(hostHeader);
  const hostCityId = hostname ? await detectHostCityId(hostname) : null;

  // Cities & venues
  const citiesAll = await prisma.city.findMany({ select: { id: true, updatedAt: true } });
  const venuesAll = await prisma.venue.findMany({ select: { cityId: true, slug: true, updatedAt: true } });

  const cities = hostCityId ? citiesAll.filter((c) => c.id === hostCityId) : citiesAll;
  const venues = hostCityId ? venuesAll.filter((v) => v.cityId === hostCityId) : venuesAll;

  // Global pages (CMS)
  const global = await prisma.setting.findUnique({
    where: { scope_cityId_key: { scope: "global", cityId: "global", key: "global" } },
    select: { value: true, updatedAt: true },
  });
  const pages: any[] = (global?.value as any)?.pages || [];

  const staticPagesNoLang = ["/", "/categories", "/venues", "/about", "/contacts", "/terms"];

  const items: MetadataRoute.Sitemap = [];

  // Static pages (UA+RU)
  for (const p of staticPagesNoLang) {
    for (const lang of SUPPORTED) {
      const url = `${base}${localizePath(p, lang)}`;
      items.push({
        url,
        lastModified: now,
        changeFrequency: "daily",
        priority: p === "/" ? 1 : 0.7,
        alternates: alternates(base, p),
      } as any);
    }
  }

  // City-specific list pages (for deployments без піддоменів) — без query (?city=...),
  // щоб уникати "брудних" URL у sitemap.
  for (const c of cities) {
    for (const lang of SUPPORTED) {
      items.push({
        url: `${base}${localizePath("/categories", lang)}`,
        lastModified: c.updatedAt || now,
        changeFrequency: "daily",
        priority: 0.8,
        alternates: alternates(base, "/categories"),
      } as any);

      items.push({
        url: `${base}${localizePath("/venues", lang)}`,
        lastModified: c.updatedAt || now,
        changeFrequency: "daily",
        priority: 0.8,
        alternates: alternates(base, "/venues"),
      } as any);
    }
  }

  // Venue menu pages
  for (const v of venues) {
    const p = `/city/${encodeURIComponent(v.cityId)}/${encodeURIComponent(v.slug)}`;
    for (const lang of SUPPORTED) {
      items.push({
        url: `${base}${localizePath(p, lang)}`,
        lastModified: v.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.85,
        alternates: alternates(base, p),
      } as any);
    }
  }

  // CMS pages (/p/[slug]) - exclude pretty routes already listed
  for (const p of pages) {
    const slug = (p?.slug || "").toString().trim();
    if (!slug) continue;
    if (["about", "contacts", "terms"].includes(slug)) continue;

    const path = `/p/${encodeURIComponent(slug)}`;
    for (const lang of SUPPORTED) {
      items.push({
        url: `${base}${localizePath(path, lang)}`,
        lastModified: global?.updatedAt || now,
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: alternates(base, path),
      } as any);
    }
  }

  return items;
}
