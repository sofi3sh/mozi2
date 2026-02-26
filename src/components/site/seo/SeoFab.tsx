"use client";

import React, { useMemo, useState } from "react";
import useSeoMode from "./useSeoMode";
import SeoDrawer from "./SeoDrawer";
import { SeoLang } from "@/store/seo";

export default function SeoFab({
  cityId,
  pageKey,
  lang = "ua",
  hint,
}: {
  cityId: string;
  pageKey: string;
  lang?: SeoLang;
  hint?: string;
}) {
  const enabled = useSeoMode(); // enabled only after entering via ?seo=1 (persists in this tab)

  const [open, setOpen] = useState(false);

  const label = useMemo(() => (hint ? `SEO • ${hint}` : "SEO"), [hint]);

  if (!enabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: "1px solid rgba(31,41,55,0.12)",
          background: "#111827",
          color: "#fff",
          fontWeight: 950,
          cursor: "pointer",
          boxShadow: "0 16px 34px rgba(17,24,39,0.32)",
          zIndex: 50,
        }}
        aria-label={label}
        title={label}
      >
        SEO
      </button>

      <SeoDrawer open={open} onClose={() => setOpen(false)} cityId={cityId} pageKey={pageKey} lang={lang} />
    </>
  );
}
