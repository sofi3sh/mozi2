import "server-only";

type DeepLTarget = "RU" | "UK" | "EN";
type DeepLSource = "RU" | "UK" | "EN";

function getDeepLKey() {
  // IMPORTANT: keep key server-side only
  return process.env.DEEPL_API_KEY || process.env.DeepL_Api || "";
}

export async function deeplTranslateText(args: {
  text: string;
  targetLang: DeepLTarget;
  sourceLang?: DeepLSource;
  preserveFormatting?: boolean;
}): Promise<string> {
  const key = getDeepLKey();
  if (!key) throw new Error("DEEPL_API_KEY is not set");

  const text = String(args.text ?? "");
  if (!text.trim()) return "";

  const isFree = key.trim().endsWith(":fx");
  const endpoint = isFree ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";

  const body = new URLSearchParams();
  body.append("auth_key", key);
  body.append("text", text);
  body.append("target_lang", args.targetLang);
  if (args.sourceLang) body.append("source_lang", args.sourceLang);
  if (args.preserveFormatting) body.append("preserve_formatting", "1");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    // ensure no caching between users
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`DeepL error ${res.status}: ${msg || res.statusText}`);
  }

  const data = (await res.json()) as any;
  const out = data?.translations?.[0]?.text;
  return typeof out === "string" ? out : "";
}
