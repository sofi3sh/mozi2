import ua from "./site.ua.json";
import ru from "./site.ru.json";

export type Lang = "ua" | "ru";

export type Params = Record<string, string | number>;

const dict = { ua, ru } as const;

export type Key = keyof typeof ua;

export function t(lang: Lang, key: Key, params?: Params) {
  const raw = (dict as any)[lang]?.[key] ?? (dict as any).ua?.[key] ?? (key as string);
  if (!params) return raw as string;
  return String(raw).replace(/\{(\w+)\}/g, (_, k) => String((params as any)[k] ?? `{${k}}`));
}
