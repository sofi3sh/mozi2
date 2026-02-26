"use client";

import React, { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import SeoFab from "@/components/site/seo/SeoFab";
import SeoBottomText from "@/components/site/seo/SeoBottomText";
import { useCityScope } from "@/store/cityScope";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";

export default function SiteStaticPage({
  pageKey,
  title,
  titleKey,
  children,
}: {
  pageKey: string;
  title?: string;
  titleKey?: any;
  children?: React.ReactNode;
}) {
  const sp = useSearchParams();
  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();
  const { lang } = useSiteLang();
  const { t } = useSiteT();

  const qsCity = sp.get("city") ?? "";
  // Якщо місто визначене піддоменом — пріоритетно беремо його
  const cityId = hostCityId || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  // Не зберігаємо місто автоматично при завантаженні сторінки.

  const displayTitle = titleKey ? t(titleKey) : (title || "");

  return (
    <div>
      <SiteHeader
        cities={cities}
        selectedCityId={cityId}
        onSelectCity={(id) => {
          if (!id) return;
          setCurrentCityId(id);
          // В режимі піддоменів setCurrentCityId зробить редірект.
          if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;
        }}
      />

      <main className="sitePageNarrow">
        <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: "-0.03em", fontFamily: "ui-serif, Georgia, Times New Roman, serif" }}>
          {displayTitle}
        </div>
        <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 750, lineHeight: 1.7 }}>
          {children ?? t('page_content_hint')}
        </div>
      </main>
<SeoBottomText lang={lang} cityId={cityId || "global"} pageKey={pageKey} />
      <SeoFab lang={lang} cityId={cityId || "global"} pageKey={pageKey} hint={displayTitle} />
      <SiteFooter />
    </div>
  );
}
