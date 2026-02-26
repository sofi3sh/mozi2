"use client";

import { useSearchParams } from "next/navigation";

export default function SearchParamsBridge() {
  const sp = useSearchParams();

  // приклад: щось читаєш/синхронізуєш
  // const city = sp.get("city");
  // ... setCity(city) ...

  return null; // це “місток”, UI не рендерить
}