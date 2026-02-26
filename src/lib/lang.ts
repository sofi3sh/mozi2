export const SUPPORTED_LANGS = ["ua", "ru"] as const;
export type SiteLang = (typeof SUPPORTED_LANGS)[number];

export function isSiteLang(v: any): v is SiteLang {
  return v === "ua" || v === "ru";
}

function ensureLeadingSlash(p: string) {
  const s = (p || "/").toString();
  return s.startsWith("/") ? s : `/${s}`;
}

/**
 * Returns the detected lang (if pathname is prefixed) and the pathname WITHOUT lang prefix.
 * Examples:
 *  - "/ua" -> { lang: "ua", pathname: "/" }
 *  - "/ru/categories" -> { lang: "ru", pathname: "/categories" }
 *  - "/" -> { lang: null, pathname: "/" }
 */
export function stripLangPrefix(pathname: string): { lang: SiteLang | null; pathname: string } {
  const p = ensureLeadingSlash((pathname || "/").toString());
  if (p === "/ua") return { lang: "ua", pathname: "/" };
  if (p === "/ru") return { lang: "ru", pathname: "/" };
  if (p.startsWith("/ua/")) return { lang: "ua", pathname: p.slice(3) || "/" };
  if (p.startsWith("/ru/")) return { lang: "ru", pathname: p.slice(3) || "/" };
  return { lang: null, pathname: p };
}

export function langFromPathname(pathname: string, fallback: SiteLang = "ua"): SiteLang {
  const { lang } = stripLangPrefix(pathname);
  return lang || fallback;
}

function isExternalHref(href: string) {
  const h = (href || "").toString();
  return (
    h.startsWith("http://") ||
    h.startsWith("https://") ||
    h.startsWith("mailto:") ||
    h.startsWith("tel:") ||
    h.startsWith("#")
  );
}

function isExcludedAbsolutePath(pathname: string) {
  const p = ensureLeadingSlash(pathname);
  return (
    /^\/(api|admin|login|auth|_next)(\/|$)/.test(p) ||
    p === "/robots.txt" ||
    p === "/sitemap.xml" ||
    p.startsWith("/favicon") ||
    p.startsWith("/icons") ||
    p.startsWith("/assets")
  );
}

/**
 * Adds "/{lang}" prefix for internal absolute paths.
 * Keeps external links and excluded system paths intact.
 *
 * Accepts a path with optional query/hash, e.g. "/cart?city=kyiv#top".
 */
export function withLangPrefix(href: string, lang: SiteLang): string {
  const raw = (href || "/").toString();
  if (!raw) return `/${lang}`;
  if (isExternalHref(raw)) return raw;

  // only prefix absolute paths
  if (!raw.startsWith("/")) return raw;

  // excluded paths should never be localized
  const url = new URL(raw, "http://localhost");
  if (isExcludedAbsolutePath(url.pathname)) return raw;

  // already prefixed
  const p = url.pathname;
  if (p === "/ua" || p === "/ru" || p.startsWith("/ua/") || p.startsWith("/ru/")) return raw;

  const base = `/${lang}`;
  const nextPath = p === "/" ? base : `${base}${p}`;

  url.pathname = nextPath;
  // Return only path+search+hash (not the dummy origin)
  return `${url.pathname}${url.search}${url.hash}`;
}

export function replaceLangInPathname(pathname: string, nextLang: SiteLang): string {
  const { pathname: p } = stripLangPrefix(pathname);
  return p === "/" ? `/${nextLang}` : `/${nextLang}${p}`;
}
