"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

export type SeoLang = "ua" | "ru";

export type BottomTextStyle = {
  fontSize: number;
  fontFamily: "sans" | "serif" | "mono";
  fontWeight: number;
  lineHeight: number;
  color: string;
  background: string;
  align: "left" | "center" | "right";
  maxWidth: number;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
};

export type BottomCode = {
  enabled: boolean;
  html: string;
  css: string;
  js: string;
};

export type SeoFields = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonical: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  bottomText: string;
  bottomTextStyle: BottomTextStyle;
  bottomCode: BottomCode;
};

export type SeoEntry = {
  cityId: string; // "global" allowed
  pageKey: string; // e.g. "home", "categories", "venues", "venue:smak"
  ua: SeoFields;
  ru: SeoFields;
  updatedAt: number;
};

type SeoCtx = {
  entries: SeoEntry[];
  getEntry: (cityId: string, pageKey: string) => SeoEntry | undefined;
  upsert: (entry: Omit<SeoEntry, "updatedAt">) => void;
  refresh: () => Promise<void>;
};

const SeoContext = createContext<SeoCtx | null>(null);

function emptyFields(): SeoFields {
  return {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    canonical: "",
    robotsIndex: true,
    robotsFollow: true,
    bottomText: "",
    bottomTextStyle: {
      fontSize: 14,
      fontFamily: "sans",
      fontWeight: 700,
      lineHeight: 1.6,
      color: "rgba(31,41,55,0.75)",
      background: "transparent",
      align: "left",
      maxWidth: 1200,
      paddingX: 22,
      paddingY: 18,
      borderRadius: 0,
    },
    bottomCode: {
      enabled: false,
      html: "",
      css: "",
      js: "",
    },
  };
}

function normalizeFields(f: any): SeoFields {
  const base = emptyFields();
  const rawStyle: any = (f || {}).bottomStyle ?? {};
  const rawCodeFromStyle: any = rawStyle && typeof rawStyle === "object" ? rawStyle.code : undefined;
  return {
    ...base,
    ...(f || {}),
    bottomTextStyle: { ...base.bottomTextStyle, ...((f || {}).bottomTextStyle || {}) },
    bottomCode: { ...base.bottomCode, ...((f || {}).bottomCode || (f || {}).code || rawCodeFromStyle || {}) },
  };
}

function normalizeEntry(e: any): SeoEntry | null {
  if (!e || typeof e !== "object") return null;
  if (typeof e.cityId !== "string" || typeof e.pageKey !== "string") return null;
  return {
    cityId: e.cityId,
    pageKey: e.pageKey,
    ua: normalizeFields(e.ua),
    ru: normalizeFields(e.ru),
    updatedAt: typeof e.updatedAt === "number" ? e.updatedAt : Date.now(),
  };
}

export function SeoProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<SeoEntry[]>([]);

  async function refresh() {
    try {
      const data = await api<{ entries: any[] }>("/api/seo/all");
      const norm = (Array.isArray(data.entries) ? data.entries : []).map(normalizeEntry).filter(Boolean) as SeoEntry[];
      setEntries(norm);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const ctx = useMemo<SeoCtx>(() => {
    return {
      entries,
      refresh,
      getEntry: (cityId, pageKey) => entries.find((e) => e.cityId === cityId && e.pageKey === pageKey),
      upsert: (entry) => {
        setEntries((prev) => {
          const updatedAt = Date.now();
          const full: SeoEntry = { ...entry, updatedAt };
          const idx = prev.findIndex((e) => e.cityId === entry.cityId && e.pageKey === entry.pageKey);
          if (idx === -1) return [full, ...prev];
          const next = [...prev];
          next[idx] = full;
          return next;
        });

        api("/api/seo", { method: "POST", body: JSON.stringify(entry) })
          .then(() => refresh())
          .catch(() => {});
      },
    };
  }, [entries]);

  return <SeoContext.Provider value={ctx}>{children}</SeoContext.Provider>;
}

export function useSeo() {
  const ctx = useContext(SeoContext);
  if (!ctx) throw new Error("useSeo must be used within SeoProvider");
  return ctx;
}

export function makeEmptyEntry(cityId: string, pageKey: string): Omit<SeoEntry, "updatedAt"> {
  return {
    cityId,
    pageKey,
    ua: emptyFields(),
    ru: emptyFields(),
  };
}
