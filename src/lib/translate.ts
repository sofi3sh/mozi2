import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type Lang = "ua" | "ru";

export function isSiteApiRequest(req: Request): boolean {
  const v = (req.headers.get("x-mozi-app") || "").toLowerCase();
  return v === "site";
}

function parseCookie(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(";").map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    const v = decodeURIComponent(p.slice(i + 1).trim());
    out[k] = v;
  }
  return out;
}

export function getRequestLang(req: Request): Lang {
  const headerLang = (req.headers.get("x-mozi-lang") || "").toLowerCase();
  if (headerLang === "ru" || headerLang === "ua") return headerLang as Lang;

  const cookies = parseCookie(req.headers.get("cookie"));
  const c = (cookies["mozi_lang"] || "").toLowerCase();
  return c === "ru" ? "ru" : "ua";
}

function normalizeText(text: string) {
  return (text || "").toString().trim();
}

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

type Provider = "openai" | "deepl";

function providerReady(provider: Provider): boolean {
  if (provider === "deepl") return Boolean(process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY);
  return Boolean(process.env.OPENAI_API_KEY);
}

function providerFromEnv(): Provider {
  const v = (process.env.TRANSLATE_PROVIDER || process.env.MOZI_TRANSLATE_PROVIDER || "openai").toLowerCase();
  return v === "deepl" ? "deepl" : "openai";
}

async function deeplTranslateMany(texts: string[]): Promise<string[]> {
  const key = process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY;
  if (!key) throw new Error("DEEPL_API_KEY missing");
  const endpoint = process.env.DEEPL_API_URL || (key.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate");

  const body = new URLSearchParams();
  for (const t of texts) body.append("text", t);
  body.set("source_lang", "UK");
  body.set("target_lang", "RU");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "DeepL translate failed");
  }

  const list = Array.isArray(data?.translations) ? data.translations : [];
  return list.map((x: any) => (x?.text ?? "").toString());
}

async function openaiTranslateMany(texts: string[]): Promise<string[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const model = process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";

  const payload = {
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are a translation engine. Translate from Ukrainian to Russian. Preserve punctuation, numbers, and formatting. Return ONLY a valid JSON array of strings in the same order.",
      },
      { role: "user", content: JSON.stringify(texts) },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new Error(data?.error?.message || "OpenAI translate failed");
  }

  const raw = (data?.choices?.[0]?.message?.content ?? "").toString().trim();
  // Try strict JSON first
  try {
    const arr = JSON.parse(raw);
    // JSON.parse returns `any` - type the callback to satisfy noImplicitAny.
    if (Array.isArray(arr)) return arr.map((x: any) => (x ?? "").toString());
  } catch {
    // try to extract json array
  }

  const m = raw.match(/\[[\s\S]*\]/);
  if (m) {
    const arr = JSON.parse(m[0]);
    if (Array.isArray(arr)) return arr.map((x: any) => (x ?? "").toString());
  }

  throw new Error("OpenAI returned non-JSON translation");
}

async function providerTranslateMany(texts: string[]) {
  const provider = providerFromEnv();

  // If keys are not configured, never hard-fail the whole site.
  // Return originals and log a clear server-side message.
  if (!providerReady(provider)) {
    console.error(
      `[translate] ${provider} not configured. Set OPENAI_API_KEY (or DEEPL_API_KEY) to enable UA→RU translation.`
    );
    return { provider, model: "disabled", out: texts };
  }

  try {
    if (provider === "deepl") return { provider, model: "deepl", out: await deeplTranslateMany(texts) };
    const model = process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini";
    return { provider, model, out: await openaiTranslateMany(texts) };
  } catch (e) {
    // Network / provider / JSON formatting issues should not crash the site.
    console.error("[translate] provider error:", e);
    return { provider, model: "error", out: texts };
  }
}

/**
 * Cached translation UA -> RU for a list of strings.
 * Returns strings in the same order.
 */
export async function translateUaToRuCached(texts: string[]): Promise<string[]> {
  const input = texts.map((t) => (t ?? "").toString());
  if (!input.length) return [];

  // Keep mapping to original indices
  const normalized = input.map(normalizeText);
  const hashes = normalized.map((t) => sha256(`ua:ru:${t}`));

  // Fetch cached translations
  type CacheRow = { hash: string; translatedText: string };
  let cached: CacheRow[] = [];
  let cacheAvailable = true;
  try {
    cached = (await (prisma as any).translationCache.findMany({
      where: { hash: { in: hashes } },
      select: { hash: true, translatedText: true },
    })) as CacheRow[];
  } catch (e) {
    // Common in fresh deployments if the TranslationCache table wasn't migrated yet.
    cacheAvailable = false;
    console.error(
      "[translate] TranslationCache table is not available (did you run prisma migrate/db push?). Falling back without DB cache.",
      e
    );
  }
  const map = new Map<string, string>(cached.map((c: CacheRow) => [c.hash, c.translatedText]));

  const missing: { idx: number; text: string; hash: string }[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const t = normalized[i];
    const h = hashes[i];
    if (!t) continue;
    if (!map.has(h)) missing.push({ idx: i, text: t, hash: h });
  }

  // Translate missing in batches
  const BATCH = 30;
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const textsToTranslate = batch.map((b) => b.text);
    const { provider, model, out } = await providerTranslateMany(textsToTranslate);

    // Save (best-effort)
    if (cacheAvailable) {
      const rows = batch.map((b, j) => ({
        sourceLang: "ua",
        targetLang: "ru",
        hash: b.hash,
        sourceText: b.text,
        translatedText: (out[j] ?? "").toString(),
        provider,
        model,
      }));
      try {
        await (prisma as any).translationCache.createMany({ data: rows, skipDuplicates: true });
      } catch (e) {
        // If cache writes fail, still serve the translated content.
        console.error("[translate] cache write error:", e);
      }
    }

    // update in-memory map
    for (let j = 0; j < batch.length; j++) {
      map.set(batch[j].hash, (out[j] ?? "").toString());
    }
  }

  // Produce output in original order, fallback to original if blank
  return input.map((orig, i) => {
    const t = normalized[i];
    if (!t) return orig;
    const tr = map.get(hashes[i]);
    return tr && tr.trim() ? tr : orig;
  });
}

export async function translateFieldUaToRu(value: string): Promise<string> {
  const [one] = await translateUaToRuCached([value]);
  return one ?? value;
}
