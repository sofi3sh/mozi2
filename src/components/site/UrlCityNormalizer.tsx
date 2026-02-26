"use client";

import { useEffect } from "react";
import { useCityScope } from "@/store/cityScope";

/**
 * Normalizes legacy URLs that use ?city=... into subdomain URLs:
 * - https://www.mozi.com.ua/categories?city=kyiv -> https://kyiv.mozi.com.ua/categories
 * - https://kyiv.mozi.com.ua/categories?city=lviv -> https://lviv.mozi.com.ua/categories
 * Also removes accidental www for city subdomains:
 * - https://www.kyiv.mozi.com.ua/... -> https://kyiv.mozi.com.ua/...
 */
export default function UrlCityNormalizer() {
  const { cities, subdomainsEnabled, rootDomain } = useCityScope();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!subdomainsEnabled) return;
    const root = (rootDomain || "").toString().trim().toLowerCase();
    if (!root) return;

    const url = new URL(window.location.href);
    const host = url.hostname.toLowerCase();

    // helper: strip leading www.
    const stripWww = (h: string) => (h.startsWith("www.") ? h.slice(4) : h);

    const cleanHost = stripWww(host);

    // If on www.<city>.<root>, remove www
    if (host !== cleanHost && cleanHost.endsWith("." + root)) {
      url.hostname = cleanHost;
      // also drop legacy city query
      url.searchParams.delete("city");
      window.location.replace(url.toString());
      return;
    }

    const qsCity = (url.searchParams.get("city") || "").toLowerCase().trim();
    if (!qsCity) return;

    // Only redirect if city exists in list (to avoid redirect loops on garbage values)
    const exists = cities.some((c) => (c.id || "").toLowerCase() === qsCity);
    if (!exists) {
      // Just remove the parameter to keep URLs clean
      url.searchParams.delete("city");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    // Build target city host without www (as per requirement)
    const targetHost = `${qsCity}.${root}`;

    // Replace hostname and remove `city` param
    url.hostname = targetHost;
    url.searchParams.delete("city");

    // Preserve path + other params (e.g., venueTypes)
    window.location.replace(url.toString());
  }, [cities, subdomainsEnabled, rootDomain]);

  return null;
}
