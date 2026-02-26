"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const KEY = "demo_seo_mode_v1";
const TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function readStored(): { enabled: boolean; setAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.setAt !== "number") return null;
    if (Date.now() - parsed.setAt > TTL_MS) return null;
    return { enabled: true, setAt: parsed.setAt };
  } catch {
    return null;
  }
}

function writeStored() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ enabled: true, setAt: Date.now() }));
  } catch {}
}

export function clearSeoMode() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

export default function useSeoMode() {
  const sp = useSearchParams();
  const fromQuery = sp.get("seo") === "1";

  useEffect(() => {
    if (fromQuery) writeStored();
  }, [fromQuery]);

  const enabled = useMemo(() => {
    if (fromQuery) return true;
    const stored = readStored();
    return !!stored?.enabled;
  }, [fromQuery]);

  return enabled;
}
