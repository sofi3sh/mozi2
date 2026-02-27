"use client";

import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSeo, SeoLang } from "@/store/seo";

const fontMap = {
  sans: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  serif: "ui-sans-serif, Arial, Helvetica, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
};

export default function SeoBottomText({
  cityId,
  pageKey,
  lang = "ua",
}: {
  cityId: string;
  pageKey: string;
  lang?: SeoLang;
}) {
  const { getEntry } = useSeo();
  const entry = getEntry(cityId, pageKey);
  const text = entry ? entry[lang].bottomText : "";
  const st = entry ? entry[lang].bottomTextStyle : null;
  const code = entry ? (entry[lang] as any).bottomCode : null;

  const hasCode = Boolean(code?.enabled) && Boolean((code?.html || "").trim() || (code?.css || "").trim() || (code?.js || "").trim());

  // Hooks must be called unconditionally (same order on every render)
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeH, setIframeH] = useState<number>(0);

  const srcDoc = useMemo(() => {
    if (!hasCode) return "";

    const html = (code?.html || "").toString();
    const css = (code?.css || "").toString();
    const js = (code?.js || "").toString();

    // auto-resize: post height to parent
    const resizeScript = `\n<script>(function(){\n  function post(){\n    try{parent.postMessage({__seoBottom:true,h:document.body.scrollHeight},"*");}catch(e){}\n  }\n  window.addEventListener("load",post);\n  setInterval(post,400);\n})();<\/script>`;

    const userScript = js?.trim() ? `\n<script>${js}<\/script>` : "";

    return `<!doctype html><html><head><meta charset="utf-8" />\n<style>html,body{margin:0;padding:0;}\n${css}\n</style></head><body>${html}${resizeScript}${userScript}</body></html>`;
  }, [hasCode, code]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d: any = e.data;
      if (d && d.__seoBottom && typeof d.h === "number") {
        const next = Math.max(40, Math.min(5000, Math.round(d.h)));
        setIframeH(next);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // After hooks: safe to return early
  if (!hasCode && !text?.trim()) return null;

  const maxWidth = st?.maxWidth ?? 1200;

  return (
    <section style={{ maxWidth, margin: "0 auto", padding: `${st?.paddingY ?? 18}px ${st?.paddingX ?? 22}px 0` }}>
      <div
        style={{
          borderTop: "1px solid rgba(31,41,55,0.10)",
          paddingTop: 14,
          color: st?.color ?? "rgba(31,41,55,0.75)",
          fontWeight: st?.fontWeight ?? 700,
          fontFamily: fontMap[(st?.fontFamily === "serif" || st?.fontFamily === "mono" ? st.fontFamily : "sans")],
          fontSize: st?.fontSize ?? 14,
          lineHeight: st?.lineHeight ?? 1.6,
          textAlign: (st?.align as any) || "left",
          whiteSpace: "pre-wrap",
          background: st?.background || "transparent",
          borderRadius: st?.borderRadius ?? 0,
          padding: st?.background && st.background !== "transparent" ? 14 : 0,
        }}
      >
        {hasCode ? (
          <iframe
            ref={iframeRef}
            title="seo-bottom-code"
            sandbox="allow-scripts"
            style={{ width: "100%", border: "0", height: iframeH ? `${iframeH}px` : "120px", display: "block" }}
            srcDoc={srcDoc}
          />
        ) : (
          text
        )}
      </div>
    </section>
  );
}
