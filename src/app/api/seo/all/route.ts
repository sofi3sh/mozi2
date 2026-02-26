import { prisma } from "@/lib/prisma";
import { json } from "../../_util";

export const runtime = "nodejs";

function emptyFields() {
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
      color: "rgba(31,41,55,0.92)",
      background: "transparent",
      align: "left",
      maxWidth: 900,
      paddingX: 16,
      paddingY: 12,
      borderRadius: 12,
    },
    bottomCode: {
      enabled: false,
      html: "",
      css: "",
      js: "",
    },
  };
}

function normalizeFields(f: any) {
  const base = emptyFields();
  const rawStyle = ((f || {}).bottomStyle ?? {}) as any;
  const rawCodeFromStyle = rawStyle && typeof rawStyle === "object" ? (rawStyle as any).code : undefined;
  const { code: _drop, ...styleOnly } = (rawStyle || {}) as any;
  return {
    ...base,
    ...(f || {}),
    bottomTextStyle: { ...base.bottomTextStyle, ...((f || {}).bottomTextStyle || styleOnly || {}) },
    bottomCode: { ...base.bottomCode, ...((f || {}).bottomCode || (f || {}).code || rawCodeFromStyle || {}) },
  };
}

function rowToFields(r: any) {
  const base = emptyFields();
  const rawStyle = ((r || {}).bottomStyle ?? {}) as any;
  const { code: rawCode, ...styleOnly } = rawStyle || {};
  return {
    ...base,
    metaTitle: r.metaTitle ?? "",
    metaDescription: r.metaDescription ?? "",
    metaKeywords: r.metaKeywords ?? "",
    ogTitle: r.ogTitle ?? "",
    ogDescription: r.ogDescription ?? "",
    ogImage: r.ogImage ?? "",
    canonical: r.canonical ?? "",
    robotsIndex: r.robotsIndex ?? true,
    robotsFollow: r.robotsFollow ?? true,
    bottomText: r.bottomText ?? "",
    bottomTextStyle: { ...base.bottomTextStyle, ...(styleOnly as any) },
    bottomCode: { ...base.bottomCode, ...((rawCode ?? {}) as any) },
  };
}

function addEntry(map: Map<string, any>, cityId: string, pageKey: string, ua: any, ru: any, updatedAt: number) {
  const key = `${cityId}::${pageKey}`;
  const exist = map.get(key);
  if (!exist || (exist.updatedAt ?? 0) < updatedAt) {
    map.set(key, {
      cityId,
      pageKey,
      ua: normalizeFields(ua),
      ru: normalizeFields(ru),
      updatedAt,
    });
  }
}

export async function GET() {
  const map = new Map<string, any>();

  // 1) Preferred source: SeoEntry table
  try {
    const rows = await prisma.seoEntry.findMany({ orderBy: { updatedAt: "desc" } });

    for (const r of rows) {
      const key = `${r.cityId}::${r.pageKey}`;
      const entry = map.get(key) ?? {
        cityId: r.cityId,
        pageKey: r.pageKey,
        ua: emptyFields(),
        ru: emptyFields(),
        updatedAt: 0,
      };
      const fields = rowToFields(r);
      if (r.lang === "ua") entry.ua = fields;
      if (r.lang === "ru") entry.ru = fields;
      entry.updatedAt = Math.max(entry.updatedAt, new Date(r.updatedAt).getTime());
      map.set(key, entry);
    }
  } catch {
    // ignore and fallback to settings below
  }

  // 2) Fallback / mirror: Setting(key="seoEntries") per city/global
  try {
    const settings = await prisma.setting.findMany({
      where: { key: "seoEntries" },
      orderBy: { updatedAt: "desc" },
    });

    for (const s of settings) {
      const cityId = s.scope === "global" ? "global" : String(s.cityId || "");
      if (!cityId) continue;

      const val: any = s.value;
      if (!val || typeof val !== "object") continue;

      for (const [pageKey, payload] of Object.entries(val)) {
        if (!pageKey || !payload || typeof payload !== "object") continue;
        const ua = (payload as any).ua ?? {};
        const ru = (payload as any).ru ?? {};
        const updatedAt = Number((payload as any).updatedAt) || new Date(s.updatedAt).getTime();
        addEntry(map, cityId, String(pageKey), ua, ru, updatedAt);
      }
    }
  } catch {
    // ignore
  }

  return json({ entries: Array.from(map.values()) });
}