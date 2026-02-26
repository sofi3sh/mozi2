"use client";

import React, { useMemo } from "react";
import { useSettings } from "@/store/settings";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import SiteStaticPage from "@/features/site/SiteStaticPage";

function looksLikeHtml(s: string) {
  return /<\s*[a-z][\s\S]*>/i.test(s);
}

export default function SiteManagedPage({
  slug,
  titleKey,
}: {
  slug: string;
  /** fallback i18n title key */
  titleKey?: any;
}) {
  const { global } = useSettings();
  const { lang } = useSiteLang();
  const { t } = useSiteT();

  const page = useMemo(() => (global.pages || []).find((p) => p.slug === slug) ?? null, [global.pages, slug]);

  const title =
    (page?.title as any)?.[lang] ||
    page?.title?.ua ||
    (titleKey ? t(titleKey) : slug);

  const content = ((page?.content as any)?.[lang] || page?.content?.ua || "").trim();
  const html = content && looksLikeHtml(content);

  const body = content ? (
    html ? (
      <div
        style={{ whiteSpace: "normal", fontWeight: 650, opacity: 0.95, lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    ) : (
      <div style={{ whiteSpace: "pre-wrap", fontWeight: 650, opacity: 0.95, lineHeight: 1.75 }}>{content}</div>
    )
  ) : (
    <div style={{ whiteSpace: "pre-wrap", fontWeight: 650, opacity: 0.85, lineHeight: 1.75 }}>
      Контент цієї сторінки можна заповнити в адмінці: Загальні → Сторінки.
    </div>
  );

  return (
    <SiteStaticPage pageKey={slug} title={title}>
      {body}
    </SiteStaticPage>
  );
}
