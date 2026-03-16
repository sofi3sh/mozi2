"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import SeoBottomText from "@/components/site/seo/SeoBottomText";
import SeoFab from "@/components/site/seo/SeoFab";
import { useCityScope } from "@/store/cityScope";
import { useVenues } from "@/store/venues";
import { useCatalog } from "@/store/catalog";
import { useSettings } from "@/store/settings";
import { ArrowRightIcon, ClockIcon, StarIcon } from "@/components/site/SiteIcons";
import { categoryCover, cityHeroBg, venueCover } from "@/lib/site/siteMedia";
import { slugify } from "@/lib/slugify";
import { openStatus } from "@/lib/site/openStatus";

function clamp2(text: string) {
  return (
    <div
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
}

function seeded(n: string) {
  // deterministic pseudo-random from string
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

export default function SiteCategories() {
  const { lang } = useSiteLang();
  const { t } = useSiteT();
  const router = useRouter();
  const sp = useSearchParams();
  const seoEnabled = sp.get("seo") === "1";
  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();
  const { getByCity } = useVenues();
  const { venueTypes } = useCatalog();
  const { global } = useSettings();

  const qsCity = sp.get("city") ?? "";
  const qsVenueTypes = sp.get("venueTypes") ?? "";
  const qsVenueType = sp.get("venueType") ?? "";

  // Якщо місто визначене піддоменом — пріоритетно беремо його
  const cityId = hostCityId || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  const initialVenueTypeId = useMemo(() => {
    const fromMulti = qsVenueTypes.split(",").map((x) => x.trim()).filter(Boolean)[0] || "";
    return (qsVenueType || fromMulti || "").trim();
  }, [qsVenueType, qsVenueTypes]);

  const [selectedVenueTypeId, setSelectedVenueTypeId] = useState<string>(initialVenueTypeId);

  useEffect(() => {
    setSelectedVenueTypeId(initialVenueTypeId);
  }, [initialVenueTypeId]);

  // Не зберігаємо місто автоматично при завантаженні сторінки.
  // Збереження відбувається лише при явному виборі користувача.

  const cityVenues = useMemo(() => (cityId ? getByCity(cityId) : []), [getByCity, cityId]);

  // Build venue types list for current city from venues. "Категорії" = "Типи закладів".
  const cityVenueTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of cityVenues) {
      for (const id of (v.venueTypeIds || []) as string[]) {
        counts.set(id, (counts.get(id) || 0) + 1);
      }
    }

    const list = Array.from(counts.entries())
      .map(([id, count]) => {
        const item = venueTypes.find((x) => x.id === id);
        return item ? { id, name: item.name as string, count } : null;
      })
      .filter(Boolean) as Array<{ id: string; name: string; count: number }>;

    list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "uk"));
    return list.slice(0, 9);
  }, [cityVenues, venueTypes]);

  const venuesBySelectedVenueType = useMemo(() => {
    if (!selectedVenueTypeId) return cityVenues;
    return cityVenues.filter((v) => (v.venueTypeIds || []).includes(selectedVenueTypeId));
  }, [selectedVenueTypeId, cityVenues]);

  const selectedVenueTypeName = useMemo(
    () => (cityVenueTypes.find((x) => x.id === selectedVenueTypeId)?.name || ""),
    [cityVenueTypes, selectedVenueTypeId]
  );

  const recommended = useMemo(() => {
    const list = [...venuesBySelectedVenueType];
    list.sort((a, b) => venueRating(b.id) - venueRating(a.id));
    return list.slice(0, 6);
  }, [venuesBySelectedVenueType]);

  function onSelectCity(id: string) {
    if (!id) return;
    setCurrentCityId(id);

    // Якщо увімкнені піддомени — setCurrentCityId зробить редірект.
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;

    router.push(`/${lang}/categories`);
  }

  function onPickVenueType(id: string) {
    // При натисканні відкриваємо сторінку "Заклади" з уже обраним типом закладу.
    const next = selectedVenueTypeId === id ? "" : id;
    const segments: string[] = [];
    if (!subdomainsEnabled && cityId) segments.push(`city-${cityId}`);
    if (next) {
      const vt = venueTypes.find((x) => (x as any).id === next);
      const token = vt ? slugify((vt as any).name as string) : "";
      if (token) segments.push(`venueTypes-${token}`);
    }
    const hashValue = segments.join("-");
    const basePath = `/${lang}/venues`;
    const url = hashValue ? `${basePath}#${hashValue}` : basePath;
    router.push(url);
  }

  if (!city) {
    return (
      <div>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />
        <main className="sitePage">
          <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: "-0.03em" }}>{t('choose_city')}</div>
          <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 700 }}>
            {t('choose_city_hint')}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href={`/${lang}/categories`} style={{ textDecoration: "underline" }}>{t('back_home')}</Link>
          </div>
        </main>
        <SeoBottomText lang={lang} cityId={cityId || "global"} pageKey="categories" />
      <SiteFooter />
      </div>
    );
  }

  return (
    <div>
<SeoFab lang={lang} cityId={cityId || "global"} pageKey="categories" hint={t("categories")} />
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />

      {/* Hero  height: 310, */}
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
            <Link href={`/${lang}/categories`} style={{ textDecoration: "none", opacity: 0.85 }}>{t('home')}</Link>
            <span style={{ opacity: 0.5 }}> / </span>
            <span style={{ opacity: 0.95 }}>{city.name}</span>
          </div>

          <div
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
            {city.name}
          </div>

          <div style={{ marginTop: 12, fontSize: 16, opacity: 0.72, fontWeight: 700 }}>
            {lang === "ru"
              ? "Выберите тип заведения, чтобы открыть список заведений."
              : "Оберіть тип закладу, щоб відкрити список закладів."}
          </div>
        </div>
      </section>

      {/* Categories section */}
      <section style={{ borderBottom: "1px solid rgba(31,41,55,0.08)" }}>
        <div className="sitePage" style={{ paddingTop: 34 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 14, flexWrap: "wrap" }}>
            <div
              style={{
                fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(28px, 6vw, 44px)",
                letterSpacing: "-0.02em",
              }}
            >
              {t('categories')}
            </div>

            <Link
              href={`/${lang}/venues`}
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
              {t('all_venues')} <ArrowRightIcon size={16} />
            </Link>
          </div>

          <div className="siteGrid3" style={{ marginTop: 18 }}>
            {cityVenueTypes.slice(0, 6).map((c) => {
              const active = selectedVenueTypeId === c.id;
              const customBg = (global as any)?.siteCategoryPhotos?.[c.id] || (global as any)?.siteCategoryPhotos?.[c.name];
              const bg = customBg || categoryCover(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPickVenueType(c.id)}
                  style={{
                    border: active ? "2px solid rgba(230,162,74,0.75)" : "1px solid rgba(31,41,55,0.10)",
                    outline: "none",
                    padding: 0,
                    borderRadius: 22,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "#fff",
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                    boxShadow: active ? "0 18px 40px rgba(31,41,55,0.12)" : "0 14px 34px rgba(31,41,55,0.10)",
                    transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
                    height: "clamp(136px, 32vw, 170px)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "100%",
                      position: "relative",
                      backgroundImage: `url(${bg})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(17,24,39,0.10) 0%, rgba(17,24,39,0.45) 55%, rgba(17,24,39,0.80) 100%)",
                      }}
                      aria-hidden
                    />

                    <div style={{ position: "absolute", left: 16, right: 16, bottom: 14, textAlign: "left" }}>
                      <div
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          fontWeight: 950,
                          color: "rgba(255,255,255,0.82)",
                        }}
                      >
                        Тип закладу
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
                          fontWeight: 900,
                          fontSize: "clamp(22px, 6vw, 30px)",
                          lineHeight: 1.05,
                          color: "#fff",
                          textShadow: "0 10px 28px rgba(0,0,0,0.35)",
                        }}
                      >
                        {c.name}
                      </div>
                      <div style={{ marginTop: 6, fontWeight: 850, color: "rgba(255,255,255,0.86)", display: "inline-flex", gap: 8, alignItems: "center" }}>
                        Переглянути заклади <span aria-hidden style={{ fontWeight: 950 }}>→</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected chip */}
          {selectedVenueTypeId ? (
            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 900, opacity: 0.7 }}>Обрано:</span>
              <span
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.70)",
                  border: "1px solid rgba(31,41,55,0.10)",
                  fontWeight: 950,
                }}
              >
                {cityVenueTypes.find((x) => x.id === selectedVenueTypeId)?.name || selectedVenueTypeId}
              </span>
              <button
                type="button"
                onClick={() => onPickVenueType(selectedVenueTypeId)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.70)",
                  border: "1px solid rgba(31,41,55,0.10)",
                  fontWeight: 900,
                  cursor: "pointer",
                  opacity: 0.85,
                }}
              >{t('reset')}</button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Recommended */}
      <section>
        <div className="sitePage" style={{ paddingTop: 34 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
                  fontWeight: 900,
                  fontSize: 46,
                  letterSpacing: "-0.02em",
                  textTransform: "lowercase",
                }}
              >
                {t('recommended')}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.68, fontWeight: 800 }}>{t('by_rating')}</div>
            </div>

            <div
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(31,41,55,0.10)",
                background: "rgba(255,255,255,0.65)",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 950,
                letterSpacing: "0.06em",
              }}
            >
              <span style={{ color: "#e6a24a", display: "grid", placeItems: "center" }}>
                <StarIcon size={16} />
              </span>
              {t('top')}
            </div>
          </div>

          <div className="siteGrid3" style={{ marginTop: 18 }}>
            {recommended.map((v) => {
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
                    <div style={{ position: "absolute", left: 16, top: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
<span
  style={{
    padding: "8px 12px",
    borderRadius: 999,
    background: st.isOpen ? "rgba(34,197,94,0.18)" : "rgba(148,163,184,0.30)",
    color: st.isOpen ? "rgba(21,128,61,1)" : "rgba(71,85,105,1)",
    border: "1px solid rgba(31,41,55,0.10)",
    fontWeight: 950,
    fontSize: 12,
  }}
>
  {st.label}
</span>

                      {selectedVenueTypeName ? (
                        <span
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.88)",
                            border: "1px solid rgba(31,41,55,0.10)",
                            fontWeight: 950,
                            fontSize: 12,
                          }}
                        >
                          {selectedVenueTypeName}
                        </span>
                      ) : null}
                      <span
                        style={{
                          padding: "8px 12px",
                          borderRadius: 999,
                          background: "#e6a24a",
                          color: "#111827",
                          border: "1px solid rgba(230,162,74,0.55)",
                          fontWeight: 950,
                          fontSize: 12,
                        }}
                      >
                        Популярный
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
                    <div style={{ fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: "-0.01em" }}>
                      {v.name}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 14, opacity: 0.72, fontWeight: 700 }}>
                      {clamp2(v.description || "Опис буде додано пізніше.")}
                    </div>

                    <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.75, fontWeight: 800 }}>
                        <span style={{ color: "#e6a24a", display: "grid", placeItems: "center" }}>
                          <ClockIcon size={16} />
                        </span>
                        {seoEnabled && !st.isOpen ? `Зачинено • ${st.rangeText || "—"}` : `~${eta} хв.`}
                      </div>
                      <div style={{ opacity: 0.62, fontWeight: 800 }}>{city.name}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {!recommended.length ? (
            <div style={{ marginTop: 18, opacity: 0.72, fontWeight: 800 }}>
              {lang === "ru"
                ? "Нет заведений по выбранному типу. Попробуйте другой."
                : "Немає закладів за обраним типом. Спробуйте інший."}
            </div>
          ) : null}
        </div>
      </section>

      <SeoBottomText lang={lang} cityId={cityId || "global"} pageKey="categories" />
      <SiteFooter />

      <style jsx>{`
        @media (max-width: 980px) {
          section > div { padding-left: 18px; padding-right: 18px; }
        }
        @media (max-width: 900px) {
          .grid3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

