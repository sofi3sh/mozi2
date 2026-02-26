import { NextResponse } from "next/server";
import { deeplTranslateText } from "@/lib/deepl";

export const runtime = "nodejs";

type Body = {
  text?: string;
  sourceLang?: "ua" | "ru" | "en";
  targetLang?: "ua" | "ru" | "en";
};

function mapLang(l?: string): "UK" | "RU" | "EN" {
  if (l === "ru") return "RU";
  if (l === "en") return "EN";
  return "UK";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const text = String(body.text ?? "");
    if (!text.trim()) return NextResponse.json({ text: "" });

    const target = mapLang(body.targetLang);
    const source = body.sourceLang ? mapLang(body.sourceLang) : undefined;

    const out = await deeplTranslateText({
      text,
      targetLang: target,
      sourceLang: source,
      preserveFormatting: true,
    });

    return NextResponse.json({ text: out });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
