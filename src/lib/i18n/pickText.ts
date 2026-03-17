export function pickText({
  lang,
  ua,
  ru,
}: {
  lang: "ua" | "ru";
  ua: string | null | undefined;
  ru?: string | null | undefined;
}) {
  const a = (ua ?? "").toString();
  const r = (ru ?? "").toString();
  if (lang === "ru" && r.trim()) return r;
  return a;
}

