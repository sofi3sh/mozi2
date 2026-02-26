"use client";

import React, { useState } from "react";

type Lang = "ua" | "ru" | "en";

export default function AutoTranslateButtons(props: {
  from: Lang;
  to: Lang;
  getText: () => string;
  setText: (next: string) => void;
  label?: string;
  className?: string;
}) {
  const { from, to, getText, setText, label, className } = props;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>("");

  async function run() {
    try {
      setErr("");
      const text = String(getText() ?? "");
      if (!text.trim()) return;
      setBusy(true);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceLang: from, targetLang: to }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Translate failed");
      setText(String(data?.text || ""));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="ui-btn ui-btnSecondary"
        style={{ padding: "8px 10px", borderRadius: 12, fontWeight: 900 }}
        title="DeepL"
      >
        {busy ? "…" : label || `Перекласти ${from.toUpperCase()}→${to.toUpperCase()}`}
      </button>
      {err ? <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 800 }}>{err}</span> : null}
    </div>
  );
}
