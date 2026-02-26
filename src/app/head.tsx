import { headers } from "next/headers";

function normalizeBase(raw: string) {
  return (raw || "").toString().trim().replace(/\/$/, "");
}

function getPublicBase(h: Headers) {
  const env = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL || "");
  const canonicalRoot = (process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "").toString().trim().toLowerCase();

  const xfProto = h.get("x-forwarded-proto");
  const xfHost = h.get("x-forwarded-host");
  const host = (xfHost || h.get("host") || "").toString();

  const proto = (xfProto || (host.includes("localhost") ? "http" : "https")).toString();
  const fromHeaders = host ? `${proto}://${host}` : "";

  const looksLocal = fromHeaders.includes("localhost") || fromHeaders.includes("127.0.0.1");

  // In production we prefer the real request host (important for subdomains),
  // BUT normalize www -> root when a canonical root is configured.
  if (fromHeaders && !looksLocal) {
    try {
      const u = new URL(fromHeaders);
      const host = u.host.toLowerCase();
      const www = canonicalRoot ? `www.${canonicalRoot}` : "";
      if (canonicalRoot && host === www) {
        u.host = canonicalRoot;
        return normalizeBase(u.toString());
      }
    } catch {
      // ignore
    }
    return normalizeBase(fromHeaders);
  }
  // Fallback (useful for local/proxy setups)
  if (env) return env;
  return normalizeBase(fromHeaders);
}

function isSubdomainHost(base: string, h: Headers) {
  try {
    const host = (h.get("x-forwarded-host") || h.get("host") || "").toString().toLowerCase();
    const env = (process.env.NEXT_PUBLIC_SITE_URL || "").toString().trim();
    const envHost = env ? new URL(env).host.toLowerCase() : "";
    const root = envHost.replace(/^www\./, "");
    if (!host || !root) return false;
    if (host === root || host === `www.${root}`) return false;
    return host.endsWith(`.${root}`);
  } catch {
    return false;
  }
}

function cleanCanonical(pathname: string, search: string, base: string, isSubdomain: boolean) {
  const url = new URL(`${pathname}${search || ""}`, base || "http://localhost:3000");
  url.hash = "";

  // Ensure canonical uses explicit language prefix.
  // If user is on "/" (or any non-prefixed route), canonical becomes "/ua" by default.
  const seg = (url.pathname.split("/")[1] || "").toLowerCase();
  const hasLang = seg === "ua" || seg === "ru";
  if (!hasLang) {
    url.pathname = url.pathname === "/" ? "/ua" : `/ua${url.pathname}`;
  }

  // drop tracking/debug params
  const dropPrefixes = ["utm_"];
  const dropExact = new Set(["gclid", "fbclid", "yclid", "_gl", "seo"]);

  for (const k of Array.from(url.searchParams.keys())) {
    const lower = k.toLowerCase();
    if (dropExact.has(lower) || dropPrefixes.some((p) => lower.startsWith(p))) {
      url.searchParams.delete(k);
    }
  }

  const path = url.pathname;
  const keep = new Set<string>();
  // In query-city mode (no subdomains) we keep the city param for list pages.
  if (!isSubdomain) {
    if (path === "/categories") {
      keep.add("city");
    }
    if (path === "/venues") {
      keep.add("city");
      keep.add("cat");
    }
  }
  // For menu pages and everything else: no query params in canonical.

  for (const k of Array.from(url.searchParams.keys())) {
    if (!keep.has(k)) url.searchParams.delete(k);
  }

  // avoid trailing slash duplicates
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");

  return url.toString();
}

export default function Head() {
  const h = headers();
  const base = getPublicBase(h);
  const pathname = h.get("x-mozi-pathname") || "/";
  const search = h.get("x-mozi-search") || "";

  const sub = isSubdomainHost(base, h);
  const canonical = cleanCanonical(pathname, search, base, sub);

  // hreflang alternates (ua/ru) with consistent canonicalization
  const canonUrl = new URL(canonical);
  const seg = (canonUrl.pathname.split("/")[1] || "").toLowerCase();
  const isUa = seg === "ua";
  const isRu = seg === "ru";
  const uaUrl = new URL(canonUrl.toString());
  const ruUrl = new URL(canonUrl.toString());
  if (isUa) {
    ruUrl.pathname = ruUrl.pathname.replace(/^\/ua(\/|$)/, "/ru$1");
  } else if (isRu) {
    uaUrl.pathname = uaUrl.pathname.replace(/^\/ru(\/|$)/, "/ua$1");
  } else {
    // should not happen due to cleanCanonical, but keep safe
    uaUrl.pathname = uaUrl.pathname === "/" ? "/ua" : `/ua${uaUrl.pathname}`;
    ruUrl.pathname = ruUrl.pathname.replace(/^\/ua(\/|$)/, "/ru$1");
  }

  return (
    <>
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="uk" href={uaUrl.toString()} />
      <link rel="alternate" hrefLang="ru" href={ruUrl.toString()} />
      <link rel="alternate" hrefLang="x-default" href={uaUrl.toString()} />
    </>
  );
}
