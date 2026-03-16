"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import SeoBottomText from "@/components/site/seo/SeoBottomText";
import SeoFab from "@/components/site/seo/SeoFab";
import { useCityScope } from "@/store/cityScope";
import { useVenues } from "@/store/venues";
import { useCatalog } from "@/store/catalog";
import { ArrowRightIcon, ClockIcon, StarIcon } from "@/components/site/SiteIcons";
import { cityHeroBg, venueCover } from "@/lib/site/siteMedia";
import { slugify } from "@/lib/slugify";
import { openStatus } from "@/lib/site/openStatus";

type Props = { categorySlug: string };

function seeded(n: string) {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return h / 2 ** 32;
}

function venueRating(id: string) {
  const r = 4.2 + seeded(id) * 0.8;
  return Math.round(r * 10) / 10;
}

function venueEta(id: string) {
  const r = 35 + Math.floor(seeded("eta:" + id) * 30);
  return r;
}

export default function SiteCategoryType({ categorySlug }: Props) {
  const { lang } = useSiteLang();
  const { t } = useSiteT();
  const sp = useSearchParams();
  const seoEnabled = sp.get("seo") === "1";
  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();
  const { getByCity } = useVenues();
  const { venueTypes } = useCatalog();

  const qsCity = sp.get("city") ?? "";

  const cityId = hostCityId || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  const venueType = useMemo(() => {
    const target = (categorySlug || "").trim().toLowerCase();
    if (!target) return null;
    for (const vt of venueTypes) {
      const name = String(vt.name || "");
      const s = slugify(name);
      if (s === target) return vt;
    }
    return null;
  }, [venueTypes, categorySlug]);

  const cityVenues = useMemo(() => (cityId ? getByCity(cityId) : []), [getByCity, cityId]);

  const venuesOfType = useMemo(() => {
    if (!venueType) return [];
    const id = venueType.id as string;
    return cityVenues.filter((v) => (v.venueTypeIds || []).includes(id));
  }, [cityVenues, venueType]);

  function onSelectCity(id: string) {
    if (!id) return;
    setCurrentCityId(id);
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;
    // без редіректу на інший маршрут — перезавантажимо сторінку категорії з новим містом
    const qs = new URLSearchParams();
    qs.set("city", id);
    window.location.search = `?${qs.toString()}`;
  }

  if (!city || !venueType) {
    return (
      <div>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />
        <main className="sitePage">
          <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: "-0.03em" }}>
            {t("not_found_venue")}
          </div>
          <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 700 }}>
            {t("choose_city_hint")}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href={`/${lang}/categories`} style={{ textDecoration: "underline" }}>
              {t("back_home")}
            </Link>
          </div>
        </main>
        <SeoBottomText
          lang={lang}
          cityId={cityId || "global"}
          pageKey={`category:${categorySlug}`}
        />
        <SiteFooter />
      </div>
    );
  }

  return (
    <div>
      <SeoFab
        lang={lang}
        cityId="global"
        pageKey={`category:${categorySlug}`}
        hint={venueType.name as string}
      />
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />

      {/* Hero */}
      <section
        style={{
          height: "clamp(190px, 24vw, 280px)",
          borderBottom: "1px solid rgba(31,41,55,0.08)",
          backgroundImage: `url(${city.photoUrl?.trim() ? city.photoUrl : cityHeroBg(city.name)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="sitePage">
          <div style={{ fontSize: 14, opacity: 0.7, fontWeight: 800 }}>
            <Link href={`/${lang}/categories`} style={{ textDecoration: "none", opacity: 0.85 }}>
              {t("home")}
            </Link>
            <span style={{ opacity: 0.5 }}> / </span>
            <Link href={`/${lang}/categories`} style={{ textDecoration: "none", opacity: 0.85 }}>
              {city.name}
            </Link>
            <span style={{ opacity: 0.5 }}> / </span>
            <span style={{ opacity: 0.95 }}>{venueType.name as string}</span>
          </div>

          <h1
            style={{
              marginTop: 18,
              fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: "clamp(40px, 7.5vw, 70px)",
              lineHeight: 1.0,
              color: "#111827",
            }}
          >
            {venueType.name as string}
          </h1>

          <div style={{ marginTop: 12, fontSize: 16, opacity: 0.72, fontWeight: 700 }}>
            {lang === "ru"
              ? "Заведения цієї категорії у вибраному місті."
              : "Заклади цієї категорії у вибраному місті."}
          </div>
        </div>
      </section>

      {/* Venues of this category */}
      <section>
        <div className="sitePage" style={{ paddingTop: 34 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
                  fontWeight: 900,
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                }}
              >
                {lang === "ru" ? "Заведения" : "Заклади"}: {venueType.name as string}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.68, fontWeight: 800 }}>
                {city.name}
              </div>
            </div>

            <Link
              href={`/${lang}/venues/city-${encodeURIComponent(cityId)}-venueTypes-${encodeURIComponent(
                slugify(String(venueType.name || ""))
              )}`}
              style={{
                color: "#e6a24a",
                fontWeight: 950,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                display: "inline-flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              {t("all_venues")} <ArrowRightIcon size={16} />
            </Link>
          </div>

          <div className="siteGrid3" style={{ marginTop: 18 }}>
            {venuesOfType.map((v) => {
              const rating = venueRating(v.id);
              const eta = Number((v as any).deliveryMinutes ?? 50) || 50;
              const cover = v.photoUrl?.trim() ? v.photoUrl : venueCover(v.name);
              const st = openStatus(v.schedule);
              return (
                <Link
                  key={v.id}
                  href={`/${lang}/city/${encodeURIComponent(cityId)}/${encodeURIComponent(v.slug)}`}
                  style={{
                    borderRadius: 22,
                    overflow: "hidden",
                    border: "1px solid rgba(31,41,55,0.10)",
                    background: "#fff",
                    boxShadow: "0 14px 34px rgba(31,41,55,0.10)",
                    textDecoration: "none",
                    display: "block",
                    filter: st.isOpen ? "none" : "grayscale(1)",
                    opacity: st.isOpen ? 1 : 0.72,
                  }}
                >
                  <div
                    style={{
                      height: 240,
                      backgroundImage: `url(${cover})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 16,
                        top: 14,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          background: st.isOpen
                            ? "rgba(34,197,94,0.18)"
                            : "rgba(148,163,184,0.30)",
                          color: st.isOpen
                            ? "rgba(21,128,61,1)"
                            : "rgba(71,85,105,1)",
                          border: "1px solid rgba(31,41,55,0.10)",
                          fontWeight: 950,
                          fontSize: 12,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        right: 16,
                        top: 14,
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.90)",
                        border: "1px solid rgba(31,41,55,0.10)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 950,
                      }}
                    >
                      <span style={{ color: "#e6a24a" }}>
                        <StarIcon size={16} />
                      </span>
                      {rating}
                    </div>
                  </div>

                  <div style={{ padding: "18px 18px 16px" }}>
                    <div
                      style={{
                        fontFamily:
                          "ui-sans-serif, Arial, Helvetica, sans-serif",
                        fontWeight: 900,
                        fontSize: 28,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {v.name}
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 14,
                        opacity: 0.72,
                        fontWeight: 700,
                      }}
                    >
                      {v.description || "Опис буде додано пізніше."}
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          opacity: 0.75,
                          fontWeight: 800,
                        }}
                      >
                        <span
                          style={{
                            color: "#e6a24a",
                            display: "grid",
                            placeItems: "center",
                          }}
                        >
                          <ClockIcon size={16} />
                        </span>
                        {seoEnabled && !st.isOpen
                          ? `Зачинено • ${st.rangeText || "—"}`
                          : `~${eta} хв.`}
                      </div>
                      <div style={{ opacity: 0.62, fontWeight: 800 }}>
                        {city.name}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!venuesOfType.length ? (
            <div style={{ marginTop: 18, opacity: 0.72, fontWeight: 800 }}>
              {lang === "ru"
                ? "Нет заведений по этой категории."
                : "Немає закладів за цією категорією."}
            </div>
          ) : null}
        </div>
      </section>

      <SeoBottomText
        lang={lang}
        cityId="global"
        pageKey={`category:${categorySlug}`}
      />
      <SiteFooter />
    </div>
  );
}

