"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteT } from "@/i18n/useSiteT";
import { ArrowUpIcon } from "@/components/site/SiteIcons";
import { useSettings } from "@/store/settings";
import { useSiteLang } from "@/store/siteLang";

export default function SiteFooter() {
  const { t } = useSiteT();
  const { lang } = useSiteLang();
  const { global } = useSettings();
  const [showTop, setShowTop] = useState(false);

  const footerPages = (global.pages || [])
    .filter((p) => p.showInFooter)
    .slice()
    .sort((a, b) => (a.footerOrder ?? 0) - (b.footerOrder ?? 0));

  const termsPage = footerPages.find((p) => p.slug === "terms") ?? null;

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <footer
        className="siteFooter"
      >
        <div className="siteContainer siteFooterGrid">
          <div className="siteFooterLeft" style={{ display: "flex", gap: 18, fontWeight: 900, flexWrap: "wrap" }}>
            {footerPages.map((p) => {
              const base = `/${lang}`;
              const href = p.slug === "about" ? `${base}/about` : p.slug === "contacts" ? `${base}/contacts` : p.slug === "terms" ? `${base}/terms` : `${base}/p/${p.slug}`;
              const label = (p.title as any)?.[lang] || p.title?.ua || p.slug;
              return (
                <Link key={p.id} href={href} style={{ whiteSpace: "nowrap" }}>
                  {label}
                </Link>
              );
            })}
          </div>

          <div style={{ justifySelf: "center", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 900, opacity: 0.9, flexWrap: "wrap", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>🍴</span>
              <span style={{ textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 12, opacity: 0.85 }}>
                {global.brandName || "mozi"}
              </span>

              {termsPage ? (
                <Link href={`/${lang}/terms`} style={{ textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 950 }}>
                  {(termsPage.title as any)?.[lang] || termsPage.title?.ua || t("terms")}
                </Link>
              ) : null}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>© 2026 {global.brandName || "mozi"}. {t('rights')}</div>
          </div>

          <div className="siteFooterRight" style={{ justifySelf: "end" }} />
        </div>
      </footer>

      <button
        type="button"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          width: 52,
          height: 52,
          borderRadius: 999,
          border: "1px solid rgba(31,41,55,0.10)",
          background: "#e6a24a",
          color: "#111827",
          display: showTop ? "grid" : "none",
          placeItems: "center",
          cursor: "pointer",
          boxShadow: "0 14px 34px rgba(31,41,55,0.12)",
        }}
      >
        <ArrowUpIcon size={18} />
      </button>
    </>
  );
}
