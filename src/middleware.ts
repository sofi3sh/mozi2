import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "mozi_session"; // якщо у вас інша назва — заміни тут
const LANG_COOKIE = "mozi_lang";
const CITY_COOKIE = "mozi_city";
const SUPPORTED_LANGS = new Set(["ua", "ru"]);

// Canonical domain (root) WITHOUT subdomain, e.g. "mozi.com".
// We keep city subdomains intact (e.g. "kyiv.mozi.com"), but normalize www -> root.
const CANONICAL_ROOT = (process.env.NEXT_PUBLIC_CANONICAL_DOMAIN || "").toString().trim().toLowerCase();
const DEFAULT_CITY = (process.env.NEXT_PUBLIC_DEFAULT_CITY || "kyiv").toString().trim().toLowerCase();

function splitHostPort(host: string) {
  const m = host.match(/^([^:]+)(?::(\d+))?$/);
  return { host: (m?.[1] ?? host).toLowerCase(), port: m?.[2] ?? "" };
}

function getPublicOrigin(req: NextRequest) {
  const xfProto = req.headers.get("x-forwarded-proto");
  const xfHost = req.headers.get("x-forwarded-host");
  const host = xfHost || req.headers.get("host") || "";

  const proto = xfProto || (host.includes("localhost") ? "http" : "https");
  const fromHeaders = host ? `${proto}://${host}` : "";

  const envOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const nextOrigin = req.nextUrl.origin;
  const nextLooksLocal = nextOrigin.includes("localhost") || nextOrigin.includes("127.0.0.1");

  return (nextLooksLocal ? (envOrigin || fromHeaders) : nextOrigin) || envOrigin || fromHeaders;
}

function detectLang(req: NextRequest): "ua" | "ru" {
  const cookie = (req.cookies.get(LANG_COOKIE)?.value || "").toString();
  if (cookie === "ua" || cookie === "ru") return cookie;

  const al = (req.headers.get("accept-language") || "").toLowerCase();
  if (al.includes("ru")) return "ru";

  return "ua";
}

function isI18nExcludedPath(pathname: string) {
  // Exclude public/static files (e.g. /brand-photo.png) so Next Image optimizer
  // can fetch them without our i18n rewrite.
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    isFile ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/favicon")
  );
}

function isCityRedirectExcludedPath(pathname: string) {
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    isFile ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/favicon")
  );
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // If user lands on /ua/admin/... or /ru/admin/... (e.g. via copied link),
  // normalize to /admin/... because admin routes are not localized.
  {
    const m = path.match(/^\/(ua|ru)\/(admin|api|login|auth)(\/.*)?$/i);
    if (m) {
      const tail = (m[3] || "").toString();
      const origin = getPublicOrigin(req);
      const url = new URL(`/${m[2].toLowerCase()}${tail}`, origin);
      url.search = req.nextUrl.search;
      return NextResponse.redirect(url, 302);
    }
  }

  // --- Canonical host normalization (minimal redirects) ---
  // - www.<root>  -> <root>
  // - keep <city>.<root> as-is
  // - do nothing on localhost
  {
    const hostRaw = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toString();
    const host = hostRaw.toLowerCase();
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    if (!isLocal && CANONICAL_ROOT) {
      const { host: hostOnly, port } = splitHostPort(host);
      const www = `www.${CANONICAL_ROOT}`;
      const isRoot = hostOnly === CANONICAL_ROOT;
      const isWwwRoot = hostOnly === www;
      const isSubdomain = hostOnly.endsWith(`.${CANONICAL_ROOT}`) && !isRoot && !isWwwRoot;

      if (isWwwRoot) {
        const url = req.nextUrl.clone();
        url.host = port ? `${CANONICAL_ROOT}:${port}` : CANONICAL_ROOT;
        return NextResponse.redirect(url, 301);
      }

      // If host is neither root nor a subdomain of root, normalize to root.
      // (Avoids duplicate hosts for SEO.)
      if (!isRoot && !isSubdomain) {
        const url = req.nextUrl.clone();
        url.host = port ? `${CANONICAL_ROOT}:${port}` : CANONICAL_ROOT;
        return NextResponse.redirect(url, 301);
      }

      // --- City subdomain enforcement (root -> <city>.root) ---
      // Це дозволяє "спокійно" перемикатися між містами: місто = піддомен.
      // Робимо редірект тільки з root-домену (не чіпаємо city.root).
      if (isRoot && !isCityRedirectExcludedPath(path)) {
        const cookieCity = (req.cookies.get(CITY_COOKIE)?.value || "").toString().trim().toLowerCase();
        const city = cookieCity || DEFAULT_CITY;
        if (city && city !== "www" && city !== "admin" && city !== "api") {
          const url = req.nextUrl.clone();
          const nextHost = `${city}.${CANONICAL_ROOT}`;
          url.host = port ? `${nextHost}:${port}` : nextHost;
          return NextResponse.redirect(url, 302);
        }
      }
    }
  }

  // Pass current URL parts to Server Components (for html lang, etc.)
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-mozi-pathname", req.nextUrl.pathname);
  reqHeaders.set("x-mozi-search", req.nextUrl.search);

  // --- Auth protection (admin + mutating api) ---
  const needsAdmin = path.startsWith("/admin");
  const needsUpload = path.startsWith("/api/uploads");
  const needsMutatingApi =
  path.startsWith("/api/") &&
  ["POST", "PATCH", "PUT", "DELETE"].includes(req.method.toUpperCase()) &&
  !path.startsWith("/api/auth/") &&
  !path.startsWith("/api/checkout");

  const session = req.cookies.get(SESSION_COOKIE)?.value;

  if ((needsAdmin || needsUpload || needsMutatingApi) && !session) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = getPublicOrigin(req);
    const next = req.nextUrl.pathname + req.nextUrl.search;

    const url = new URL("/login", origin);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // якщо вже залогінений — не пускаємо на /login
  if (path === "/login" && session) {
    const origin = getPublicOrigin(req);
    return NextResponse.redirect(new URL("/admin", origin));
  }

  // --- i18n routing for public pages ---
  if (!isI18nExcludedPath(path)) {
    const seg = (path.split("/")[1] || "").toLowerCase();
    const hasLang = SUPPORTED_LANGS.has(seg);

    // Keep cookie synced when user is already on /ua or /ru.
    if (hasLang) {
      const res = NextResponse.next({ request: { headers: reqHeaders } });
      res.cookies.set(LANG_COOKIE, seg, { path: "/", sameSite: "lax" });
      return res;
    }

    // No redirects for public i18n. We REWRITE internally to /{lang}/...
    // Canonical + hreflang are handled in <Head />.
    const lang = detectLang(req);
    const origin = getPublicOrigin(req);
    const nextPath = path === "/" ? `/${lang}` : `/${lang}${path}`;
    const url = new URL(nextPath + req.nextUrl.search, origin);
    const res = NextResponse.rewrite(url, { request: { headers: reqHeaders } });
    res.cookies.set(LANG_COOKIE, lang, { path: "/", sameSite: "lax" });
    return res;
  }

  return NextResponse.next({ request: { headers: reqHeaders } });
}

// Apply middleware to all routes except static assets.
export const config = {
  // Also exclude common public assets (png/jpg/svg/webp/css/js/etc.) to avoid
  // rewriting static files to /ua/... and breaking Next Image optimizer.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|txt|xml)$).*)",
  ],
};
