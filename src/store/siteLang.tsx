"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SiteLang, langFromPathname, replaceLangInPathname } from "@/lib/lang";

type Ctx = {
  lang: SiteLang;
  /** Switches language by replacing the current URL prefix and preserving query params. */
  setLang: (l: SiteLang) => void;
};

const KEY = "mozi_site_lang_v2"; // kept for remembering the preferred lang

const SiteLangContext = createContext<Ctx | null>(null);

function setCookie(name: string, value: string) {
  try {
    // 365d
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {}
}

export function SiteLangProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const sp = useSearchParams();

  const [lang, setLangState] = useState<SiteLang>(() => langFromPathname(pathname, "ua"));

  // Sync from URL (source of truth)
  useEffect(() => {
    const fromUrl = langFromPathname(pathname, "ua");
    setLangState(fromUrl);
    try {
      localStorage.setItem(KEY, fromUrl);
    } catch {}
    setCookie("mozi_lang", fromUrl);
  }, [pathname]);

  // First load fallback (only matters if user lands on a non-prefixed route before middleware redirect)
  useEffect(() => {
    const p = pathname || "/";
    const hasPrefix = p === "/ua" || p === "/ru" || p.startsWith("/ua/") || p.startsWith("/ru/");
    if (hasPrefix) return;

    try {
      const raw = localStorage.getItem(KEY);
      if (raw === "ua" || raw === "ru") setLangState(raw);
    } catch {}
  }, [pathname]);

  const setLang = useCallback(
    (l: SiteLang) => {
      if (l === lang) return;

      // Preserve query params
      const query = sp?.toString() || "";
      const nextPath = replaceLangInPathname(pathname, l);
      const next = query ? `${nextPath}?${query}` : nextPath;

      setLangState(l);
      try {
        localStorage.setItem(KEY, l);
      } catch {}
      setCookie("mozi_lang", l);

      // Controlled, single navigation
      router.replace(next);
    },
    [lang, pathname, sp, router]
  );

  const ctx = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <SiteLangContext.Provider value={ctx}>{children}</SiteLangContext.Provider>;
}

export function useSiteLang() {
  const ctx = useContext(SiteLangContext);
  if (!ctx) throw new Error("useSiteLang must be used within SiteLangProvider");
  return ctx;
}
