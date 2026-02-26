"use client";

import { useEffect } from "react";
import { useSeo, SeoLang } from "@/store/seo";

function setMeta(name: string, content: string) {
  if (!content) return;
  const head = document.head;
  let el = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setProperty(property: string, content: string) {
  if (!content) return;
  const head = document.head;
  let el = head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  if (!href) return;
  const head = document.head;
  let el = head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function normalizeCanonical(raw: string) {
  if (!raw) return "";
  // allow relative canonical from admin ("/categories")
  if (raw.startsWith("/")) {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
    return `${base}${raw}`;
  }
  return raw;
}

function computeCanonicalFromLocation() {
  if (typeof window === "undefined") return "";

  const base = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
  const url = new URL(window.location.pathname + window.location.search, base);
  url.hash = "";

  // drop tracking/debug params
  const dropPrefixes = ["utm_"];
  const dropExact = new Set(["gclid", "fbclid", "yclid", "_gl", "seo"]);
  for (const k of Array.from(url.searchParams.keys())) {
    const lower = k.toLowerCase();
    if (dropExact.has(lower) || dropPrefixes.some((p) => lower.startsWith(p))) url.searchParams.delete(k);
  }

  const path = url.pathname;

  // Keep only the params that represent a real landing page.
  // Everything else creates duplicate URLs.
  const keep = new Set<string>();
  if (path === "/categories") {
    keep.add("city");
  }
  if (path === "/venues") {
    keep.add("city");
    keep.add("cat");
  }
  if (path.startsWith("/city/")) {
    // no query params for venue menu pages
  }

  for (const k of Array.from(url.searchParams.keys())) {
    if (!keep.has(k)) url.searchParams.delete(k);
  }

  // avoid trailing slash duplicates
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export default function SeoApply({
  cityId,
  pageKey,
  lang = "ua",
  defaults,
}: {
  cityId: string;
  pageKey: string;
  lang?: SeoLang;
  defaults?: { title?: string; description?: string };
}) {
  const { getEntry } = useSeo();
  const entry = getEntry(cityId, pageKey);

  useEffect(() => {
    const fields = entry ? entry[lang] : null;

    const title = fields?.metaTitle || defaults?.title || "";
    const desc = fields?.metaDescription || defaults?.description || "";
    const keywords = fields?.metaKeywords || "";
    const ogTitle = fields?.ogTitle || title;
    const ogDesc = fields?.ogDescription || desc;
    const ogImage = fields?.ogImage || "";
    const canonical = normalizeCanonical(fields?.canonical || "") || computeCanonicalFromLocation();
    const robotsIndex = fields?.robotsIndex ?? true;
    const robotsFollow = fields?.robotsFollow ?? true;

    if (title) document.title = title;
    setMeta("description", desc);
    setMeta("keywords", keywords);
    setMeta("robots", `${robotsIndex ? "index" : "noindex"},${robotsFollow ? "follow" : "nofollow"}`);

    setProperty("og:title", ogTitle);
    setProperty("og:description", ogDesc);
    setProperty("og:image", ogImage);
    setProperty("og:url", canonical);

    setLink("canonical", canonical);
  }, [entry, lang, defaults, cityId, pageKey]);

  return null;
}
