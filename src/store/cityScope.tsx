"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import { useSettings } from "@/store/settings";

export type City = {
  id: string;
  name: string;
  nameRu?: string | null;
  photoUrl?: string | null;
};

type Ctx = {
  cities: City[];
  loading: boolean;
  error?: string;

  /** Legacy поля (колись були піддомени). Залишені для сумісності компонентів. */
  hostCityId: string | null;
  subdomainsEnabled: boolean;
  rootDomain: string;

  // Поточне/останнє місто (збережене користувачем)
  currentCityId: string | null;
  lastCityId: string | null;
  setCurrentCityId: (cityId: string | null) => void;

  // aliases (для старих компонентів/логіки)
  selectedCityId: string;
  setSelectedCityId: (cityId: string) => void;

  /**
   * Перемкнути місто в режимі піддоменів (city.rootDomain) за дією користувача.
   * Не викликається автоматично (щоб уникати небажаних редіректів).
   */
  navigateToCitySubdomain: (cityId: string, opts?: { preservePath?: boolean; fallbackPath?: string }) => void;

  addCity: (name: string, opts?: { nameRu?: string }) => Promise<City | null>;
  renameCity: (id: string, name: string, opts?: { nameRu?: string }) => Promise<void>;
  setCityPhoto: (id: string, photoUrl: string | null) => Promise<void>;
  removeCity: (id: string) => Promise<void>;
};

const KEY_CURRENT = "mozi_city_current_v1";
const KEY_LAST = "mozi_city_last_v1";

const CityScopeContext = createContext<Ctx | null>(null);

export function CityScopeProvider({ children }: { children: React.ReactNode }) {
  const { global } = useSettings();
  const [cities, setCities] = useState<City[]>([]);
  const [currentCityId, setCurrentCityIdState] = useState<string | null>(null);
  const [lastCityId, setLastCityIdState] = useState<string | null>(null);

  function normalizeRootDomain(raw: any) {
    return (raw ?? "")
      .toString()
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*/, "")
      .replace(/^\./, "")
      .toLowerCase();
  }

  function splitHostPort(host: string) {
    const m = host.match(/^([^:]+)(?::(\d+))?$/);
    return { host: (m?.[1] ?? host).toLowerCase(), port: m?.[2] ?? "" };
  }

  const subdomainsEnabled = !!global?.subdomains?.enabled;
  const rootDomainRaw = normalizeRootDomain(global?.subdomains?.rootDomain);
  const { host: rootHost, port: rootPort } = splitHostPort(rootDomainRaw);
  const rootDomain = rootPort ? `${rootHost}:${rootPort}` : rootHost;
  const reserved = useMemo(() => {
    const base = Array.isArray(global?.subdomains?.reserved) ? global.subdomains.reserved : ["www", "admin", "api", "static"];
    return new Set(base.map((s: any) => (s ?? "").toString().trim().toLowerCase()).filter(Boolean));
  }, [global?.subdomains?.reserved]);

  // NOTE: City switching is handled without client-side redirects.

  const [hostCityId, setHostCityId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const setCookieCity = useCallback(
    (id: string | null) => {
      try {
        if (typeof document === "undefined") return;
        const maxAge = 60 * 60 * 24 * 365;
        const base = `mozi_city=${encodeURIComponent(id ?? "")}; path=/; max-age=${maxAge}; samesite=lax`;
        // For localhost we avoid setting Domain.
        if (subdomainsEnabled && rootHost && rootHost.includes(".") && !rootHost.includes("localhost") && !rootHost.startsWith("127.")) {
          document.cookie = `${base}; domain=.${rootHost}`;
        } else {
          document.cookie = base;
        }
      } catch {
        // ignore
      }
    },
    [subdomainsEnabled, rootHost]
  );

  const setCurrentCityId = useCallback(
    (cityId: string | null) => {
    const id = (cityId ?? "").toString().trim();

    setCurrentCityIdState(id || null);
    if (id) setLastCityIdState(id);

    // зберігаємо вибір
    try {
      if (typeof window !== "undefined") {
        if (id) {
          localStorage.setItem(KEY_CURRENT, id);
          localStorage.setItem(KEY_LAST, id);
        } else {
          localStorage.removeItem(KEY_CURRENT);
        }
      }
    } catch {
      // ignore
    }

    setCookieCity(id || null);

    // IMPORTANT:
    // Ми НЕ робимо редірект тут автоматично.
    // Перемикання піддомену відбувається лише у відповідь на дію користувача
    // через navigateToCitySubdomain().
    },
    [setCookieCity]
  );

  const navigateToCitySubdomain = useCallback(
    (cityId: string, opts?: { preservePath?: boolean; fallbackPath?: string }) => {
      const id = (cityId ?? "").toString().trim();
      if (!id) return;
      if (!subdomainsEnabled || !rootHost) return;
      if (typeof window === "undefined") return;

      // Першим ділом — зберегти вибір (cookie/localStorage)
      setCurrentCityId(id);

      const preservePath = opts?.preservePath !== false;
      const fallbackPath = opts?.fallbackPath || "/venues";

      const url = new URL(window.location.href);
      const currentPath = url.pathname || "/";

      // Дозволяємо зберегти шлях тільки для "публічних" сторінок.
      // Для нестандартних роутів — краще перекинути на /venues.
      const allowedPrefixes = [
        "/",
        "/ua",
        "/ru",
        "/venues",
        "/categories",
        "/cart",
        "/checkout",
        "/about",
        "/contacts",
        "/policy",
        "/terms",
      ];
      const isAllowed = allowedPrefixes.some((p) => currentPath === p || currentPath.startsWith(p + "/"));

      // В режимі піддоменів ?city не використовується
      url.searchParams.delete("city");

      // Перемикаємо host на піддомен міста
      url.hostname = `${id}.${rootHost}`;
      if (rootPort) url.port = rootPort;

      if (!preservePath || !isAllowed) {
        url.pathname = fallbackPath;
      }

      // Це єдиний момент, де редірект потрібен і очікуваний (дія користувача).
      window.location.assign(url.toString());
    },
    [rootHost, rootPort, setCurrentCityId, subdomainsEnabled]
  );

  // aliases
  const setSelectedCityId = useCallback((cityId: string) => setCurrentCityId(cityId), [setCurrentCityId]);

  const readCookieCity = useCallback((): string | null => {
    try {
      if (typeof document === "undefined") return null;
      const m = document.cookie.match(/(?:^|;\s*)mozi_city=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    } catch {
      return null;
    }
  }, []);

  // initial hydration (localStorage/cookie) — hostCityId will override later if present.
  useEffect(() => {
    try {
      const cookie = readCookieCity();
      const cur = typeof window !== "undefined" ? localStorage.getItem(KEY_CURRENT) : null;
      const last = typeof window !== "undefined" ? localStorage.getItem(KEY_LAST) : null;

      const pickCur = cookie || cur;
      const pickLast = cookie || last;

      if (pickCur) setCurrentCityIdState(pickCur);
      if (pickLast) setLastCityIdState(pickLast);
    } catch {
      // ignore
    }
  }, [readCookieCity]);

  // Resolve city from hostname when subdomains enabled.
  // NOTE: hostname (subdomain) is the source of truth; don't "validate" it against stored lastCity.
  useEffect(() => {
    if (!subdomainsEnabled || !rootHost) {
      setHostCityId(null);
      return;
    }
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname.toLowerCase();
    const root = rootHost.toLowerCase();
    if (hostname === root || hostname === `www.${root}`) {
      setHostCityId(null);
      return;
    }
    if (!hostname.endsWith(`.${root}`)) {
      setHostCityId(null);
      return;
    }
    const sub = hostname.slice(0, -(root.length + 1));
    if (!sub || sub.includes(".")) {
      setHostCityId(null);
      return;
    }
    const slug = sub.toLowerCase();
    if (reserved.has(slug)) {
      setHostCityId(null);
      return;
    }
    setHostCityId(slug);
  }, [subdomainsEnabled, rootHost, reserved]);

  // Host city is the source of truth in subdomain mode. It must override any stored values.
  useEffect(() => {
    if (!hostCityId) return;
    setCurrentCityIdState(hostCityId);
    setLastCityIdState(hostCityId);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(KEY_CURRENT, hostCityId);
        localStorage.setItem(KEY_LAST, hostCityId);
      }
    } catch {
      // ignore
    }
    setCookieCity(hostCityId);
  }, [hostCityId, setCookieCity]);

  const refreshCities = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const data = await api<{ cities: City[] }>("/api/cities");
      const list = Array.isArray(data.cities) ? data.cities : [];
      setCities(list);

      // нормалізуємо збережені значення
      let storedCur: string | null = null;
      let storedLast: string | null = null;
      try {
        const cookie = readCookieCity();
        const cur = typeof window !== "undefined" ? localStorage.getItem(KEY_CURRENT) : null;
        const last = typeof window !== "undefined" ? localStorage.getItem(KEY_LAST) : null;
        storedCur = cookie || cur;
        storedLast = cookie || last;
      } catch {
        // ignore
      }

      const validCur = storedCur && list.some((c) => c.id === storedCur) ? storedCur : null;
      const validLast = storedLast && list.some((c) => c.id === storedLast) ? storedLast : null;

      // якщо cookie/LS містять неіснуюче місто — чистимо cookie (щоб не "залипало")
      if (storedCur && !validCur) setCookieCity(null);

      // IMPORTANT: We avoid client-side redirects for city/subdomain switching.
      // If you want canonical subdomain URLs for SEO, implement it with server-side
      // redirects/rewrite (NGINX/Cloudflare/Next middleware), not via window.location.

      // If hostCityId exists (subdomain mode) it will override via effect.
      setCurrentCityIdState(validCur);
      setLastCityIdState(validLast);
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося завантажити міста");
    } finally {
      setLoading(false);
    }
  }, [readCookieCity, setCookieCity]);

  useEffect(() => {
    void refreshCities();
  }, [refreshCities]);

  const value = useMemo<Ctx>(
    () => ({
      cities,
      loading,
      error,

      hostCityId,
      subdomainsEnabled,
      rootDomain,

      currentCityId,
      lastCityId,
      setCurrentCityId,

      selectedCityId: currentCityId ?? "",
      setSelectedCityId,

      navigateToCitySubdomain,

      addCity: async (name: string, opts?: { nameRu?: string }) => {
        const nm = name.trim();
        if (nm.length < 2) return null;
        const res = await api<{ city: City }>("/api/cities", {
          method: "POST",
          body: JSON.stringify({ name: nm, nameRu: (opts?.nameRu ?? "").toString() }),
        });
        setCities((prev) => [...prev, res.city].sort((a, b) => a.name.localeCompare(b.name, "uk")));
        if (!currentCityId) setCurrentCityId(res.city.id);
        return res.city;
      },
      renameCity: async (id: string, name: string, opts?: { nameRu?: string }) => {
        const nm = name.trim();
        if (nm.length < 2) return;
        const res = await api<{ city: City }>(`/api/cities/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: nm, nameRu: (opts?.nameRu ?? "").toString() }),
        });
        setCities((prev) => prev.map((c) => (c.id === id ? res.city : c)).sort((a, b) => a.name.localeCompare(b.name, "uk")));
      },
      setCityPhoto: async (id: string, photoUrl: string | null) => {
        const res = await api<{ city: City }>(`/api/cities/${id}`, { method: "PATCH", body: JSON.stringify({ photoUrl }) });
        setCities((prev) => prev.map((c) => (c.id === id ? res.city : c)).sort((a, b) => a.name.localeCompare(b.name, "uk")));
      },
      removeCity: async (id: string) => {
        await api(`/api/cities/${id}`, { method: "DELETE" });

        setCities((prev) => {
          const nextList = prev.filter((c) => c.id !== id);

          // якщо видалили поточне/останнє — очищуємо
          setCurrentCityIdState((cur) => (cur === id ? null : cur));
          setLastCityIdState((last) => (last === id ? null : last));

          try {
            if (typeof window !== "undefined") {
              const cur = localStorage.getItem(KEY_CURRENT);
              const last = localStorage.getItem(KEY_LAST);
              if (cur === id) localStorage.removeItem(KEY_CURRENT);
              if (last === id) localStorage.removeItem(KEY_LAST);
            }
          } catch {
            // ignore
          }

          try {
            const cookie = readCookieCity();
            if (cookie === id) setCookieCity(null);
          } catch {
            // ignore
          }

          return nextList;
        });
      },
    }),
    [
      cities,
      loading,
      error,
      hostCityId,
      subdomainsEnabled,
      rootDomain,
      currentCityId,
      lastCityId,
      setCurrentCityId,
      setSelectedCityId,
      navigateToCitySubdomain,
      readCookieCity,
      setCookieCity,
    ]
  );

  return <CityScopeContext.Provider value={value}>{children}</CityScopeContext.Provider>;
}

export function useCityScope() {
  const ctx = useContext(CityScopeContext);
  if (!ctx) throw new Error("useCityScope must be used within CityScopeProvider");
  return ctx;
}
