"use client";

import { useMemo } from "react";
import { useSiteLang } from "@/store/siteLang";
import { t, type Key, type Params } from "./site";

export function useSiteT() {
  const { lang } = useSiteLang();
  const fn = useMemo(() => (key: Key, params?: Params) => t(lang, key, params), [lang]);
  return { t: fn, lang };
}
