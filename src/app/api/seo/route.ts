import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../_util";

export const runtime = "nodejs";

type Lang = "ua" | "ru";

function normalizeFields(f: any) {
  return {
    metaTitle: (f?.metaTitle ?? "").toString(),
    metaDescription: (f?.metaDescription ?? "").toString(),
    metaKeywords: (f?.metaKeywords ?? "").toString(),
    ogTitle: (f?.ogTitle ?? "").toString(),
    ogDescription: (f?.ogDescription ?? "").toString(),
    ogImage: (f?.ogImage ?? "").toString(),
    canonical: (f?.canonical ?? "").toString(),
    robotsIndex: Boolean(f?.robotsIndex ?? true),
    robotsFollow: Boolean(f?.robotsFollow ?? true),
    bottomText: (f?.bottomText ?? "").toString(),
    bottomTextStyle: (f?.bottomTextStyle ?? f?.bottomStyle ?? {}) as any,
    bottomCode: (f?.bottomCode ?? f?.code ?? {}) as any,
  };
}

function rowFromFields(cityId: string, pageKey: string, lang: Lang, fields: any) {
  return {
    cityId,
    pageKey,
    lang,
    metaTitle: fields.metaTitle,
    metaDescription: fields.metaDescription,
    metaKeywords: fields.metaKeywords,
    ogTitle: fields.ogTitle,
    ogDescription: fields.ogDescription,
    ogImage: fields.ogImage,
    canonical: fields.canonical,
    robotsIndex: fields.robotsIndex,
    robotsFollow: fields.robotsFollow,
    bottomText: fields.bottomText,
    bottomStyle: { ...(fields.bottomTextStyle ?? {}), code: fields.bottomCode ?? {} },
  };
}

async function upsertToSettings(cityId: string, pageKey: string, ua: any, ru: any) {
  const scope = cityId === "global" ? "global" : "city";
  const cityKey = cityId === "global" ? "global" : cityId;
  const key = "seoEntries";

  const existing = await prisma.setting.findUnique({
    where: { scope_cityId_key: { scope, cityId: cityKey, key } },
  });

  const base: any = existing?.value && typeof existing.value === "object" ? (existing.value as any) : {};
  const next = {
    ...base,
    [pageKey]: { ua, ru, updatedAt: Date.now() },
  };

  await prisma.setting.upsert({
    where: { scope_cityId_key: { scope, cityId: cityKey, key } },
    update: { value: next },
    create: { scope, cityId: cityKey, key, value: next },
  });

  return true;
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const cityId = (body?.cityId ?? "").toString();
  const pageKey = (body?.pageKey ?? "").toString();
  if (!cityId || !pageKey) return badRequest("cityId/pageKey обовʼязкові");

  const uaFields = normalizeFields(body?.ua ?? {});
  const ruFields = normalizeFields(body?.ru ?? {});

  let storedInDb = false;
  let storedInSettings = false;
  let dbError: string | null = null;

  // 1) Try DB SeoEntry (preferred)
  try {
    const rows = [
      rowFromFields(cityId, pageKey, "ua", uaFields),
      rowFromFields(cityId, pageKey, "ru", ruFields),
    ];

    for (const r of rows) {
      await prisma.seoEntry.upsert({
        where: { cityId_pageKey_lang: { cityId: r.cityId, pageKey: r.pageKey, lang: r.lang } },
        update: { ...r },
        create: { ...r },
      });
    }
    storedInDb = true;
  } catch (e: any) {
    dbError = e?.message ? String(e.message) : "DB error";
  }

  // 2) Always mirror to Settings as a safe fallback (works even if SeoEntry table isn't migrated)
  try {
    storedInSettings = await upsertToSettings(cityId, pageKey, uaFields, ruFields);
  } catch {
    storedInSettings = false;
  }

  return json({ ok: true, storedInDb, storedInSettings, dbError });
}
