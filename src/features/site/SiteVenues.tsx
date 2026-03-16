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
import { useMenu } from "@/store/menu";
import { useCatalog } from "@/store/catalog";
import { ClockIcon, StarIcon } from "@/components/site/SiteIcons";
import { cityHeroBg, venueCover } from "@/lib/site/siteMedia";
import { openStatus } from "@/lib/site/openStatus";
import { slugify } from "@/lib/slugify";

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

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", gap: 12, alignItems: "center", cursor: "pointer", userSelect: "none" }}>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: checked ? "1px solid rgba(230,162,74,0.85)" : "1px solid rgba(31,41,55,0.22)",
          background: checked ? "rgba(230,162,74,0.22)" : "rgba(255,255,255,0.75)",
          display: "grid",
          placeItems: "center",
        }}
        aria-hidden
      >
        {checked ? (
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(230,162,74,0.95)" }} />
        ) : null}
      </span>
      <span style={{ fontWeight: 750, opacity: 0.88 }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: "none" }} />
    </label>
  );
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default function SiteVenues() {
  const { lang } = useSiteLang();
  const { t } = useSiteT();
  const router = useRouter();
  const sp = useSearchParams();
  const seoEnabled = sp.get("seo") === "1";
  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();
  const { getByCity } = useVenues();
  const { dishes, categories } = useMenu();
  const { venueTypes, cuisineTypes } = useCatalog();
  const [hash, setHash] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => {
      const raw = window.location.hash || "";
      setHash(raw.startsWith("#") ? raw.slice(1) : raw);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const qsCity = sp.get("city") ?? "";
  const qsCat = sp.get("cat") ?? "";
  const qsVenueTypes = sp.get("venueTypes") ?? "";
  const qsCuisines = sp.get("cuisines") ?? "";

  const parsedFromHash = useMemo(() => {
    const raw = (hash || "").trim();
    if (!raw) {
      return {
        cityFromHash: "",
        catFromHash: "",
        venueTypeSlugsFromHash: [] as string[],
        cuisineIdsFromHash: [] as string[],
      };
    }
    const parts = raw.split("-").filter(Boolean);
    let cityFromHash = "";
    let catFromHash = "";
    const venueTypeSlugsFromHash: string[] = [];
    const cuisineIdsFromHash: string[] = [];
    const keys = new Set(["city", "venueTypes", "cuisines", "cat"]);
    let i = 0;
    while (i < parts.length) {
      const key = parts[i++];
      if (key === "city" && i < parts.length) {
        cityFromHash = parts[i++];
        continue;
      }
      if (key === "cat" && i < parts.length) {
        catFromHash = parts[i++];
        continue;
      }
      if (key === "venueTypes") {
        const start = i;
        while (i < parts.length && !keys.has(parts[i])) i++;
        for (let j = start; j < i; j++) {
          const token = parts[j];
          if (!token) continue;
          venueTypeSlugsFromHash.push(token);
        }
        continue;
      }
      if (key === "cuisines") {
        const start = i;
        while (i < parts.length && !keys.has(parts[i])) i++;
        for (let j = start; j < i; j++) {
          const token = parts[j];
          if (!token) continue;
          cuisineIdsFromHash.push(`ct_${token}`);
        }
        continue;
      }
    }
    return { cityFromHash, catFromHash, venueTypeSlugsFromHash, cuisineIdsFromHash };
  }, [hash]);

  const { cityFromHash, catFromHash, venueTypeSlugsFromHash, cuisineIdsFromHash } = parsedFromHash;

  // Якщо місто визначене піддоменом або в hash — пріоритетно беремо його
  const cityId = hostCityId || cityFromHash || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  // Не зберігаємо місто автоматично при завантаженні сторінки.

  const cityVenues = useMemo(() => (cityId ? getByCity(cityId) : []), [getByCity, cityId]);

  // available filters only from current city venues
  const availableVenueTypeIds = useMemo(() => {
    const ids = cityVenues.flatMap((v) => v.venueTypeIds || []);
    return uniq(ids);
  }, [cityVenues]);

  const availableCuisineTypeIds = useMemo(() => {
    const ids = cityVenues.flatMap((v) => v.cuisineTypeIds || []);
    return uniq(ids);
  }, [cityVenues]);

  const venueTypeOptions = useMemo(
    () =>
      availableVenueTypeIds
        .map((id) => venueTypes.find((x) => x.id === id))
        .filter(Boolean)
        .map((x) => ({ id: (x as any).id as string, name: (x as any).name as string }))
        .sort((a, b) => a.name.localeCompare(b.name, "uk")),
    [availableVenueTypeIds, venueTypes]
  );

  const cuisineOptions = useMemo(
    () =>
      availableCuisineTypeIds
        .map((id) => cuisineTypes.find((x) => x.id === id))
        .filter(Boolean)
        .map((x) => ({ id: (x as any).id as string, name: (x as any).name as string }))
        .sort((a, b) => a.name.localeCompare(b.name, "uk")),
    [availableCuisineTypeIds, cuisineTypes]
  );

  const venueTypeSlugToId = useMemo(() => {
    const m = new Map<string, string>();
    for (const vt of venueTypes) {
      const id = (vt as any).id as string;
      const name = (vt as any).name as string;
      const slug = slugify(name);
      if (slug) m.set(slug, id);
    }
    return m;
  }, [venueTypes]);

  const initialVenueTypeIds = useMemo(() => {
    if (venueTypeSlugsFromHash.length) {
      const ids: string[] = [];
      for (const s of venueTypeSlugsFromHash) {
        const id = venueTypeSlugToId.get(s);
        if (id) ids.push(id);
      }
      if (ids.length) return ids;
    }
    return qsVenueTypes.split(",").map((x) => x.trim()).filter(Boolean);
  }, [venueTypeSlugsFromHash, venueTypeSlugToId, qsVenueTypes]);
  const initialCuisineIds = useMemo(
    () =>
      cuisineIdsFromHash.length
        ? cuisineIdsFromHash
        : qsCuisines.split(",").map((x) => x.trim()).filter(Boolean),
    [cuisineIdsFromHash, qsCuisines]
  );
  const initialCat = useMemo(() => (catFromHash || qsCat).trim(), [catFromHash, qsCat]);

  const [draftVenueTypes, setDraftVenueTypes] = useState<string[]>(initialVenueTypeIds);
  const [draftCuisines, setDraftCuisines] = useState<string[]>(initialCuisineIds);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const appliedFiltersCount = useMemo(() => {
    const vt = draftVenueTypes.length || initialVenueTypeIds.length;
    const cu = draftCuisines.length || initialCuisineIds.length;
    const a = vt + cu + (initialCat ? 1 : 0);
    return a;
  }, [draftVenueTypes.length, draftCuisines.length, initialVenueTypeIds.length, initialCuisineIds.length, initialCat]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  useEffect(() => setDraftVenueTypes(initialVenueTypeIds), [initialVenueTypeIds]); // keep in sync
  useEffect(() => setDraftCuisines(initialCuisineIds), [initialCuisineIds]);

  const filteredVenues = useMemo(() => {
    const effectiveVenueTypeIds = draftVenueTypes.length ? draftVenueTypes : initialVenueTypeIds;
    const effectiveCuisineIds = draftCuisines.length ? draftCuisines : initialCuisineIds;

    let list = [...cityVenues];

    // category filter by category name (case-insensitive)
    if (initialCat) {
      const target = initialCat.toLowerCase();
      const catIds = new Set(
        categories
          .filter((c) => c.cityId === cityId && (c.name || "").trim().toLowerCase() === target)
          .map((c) => c.id)
      );
      const venueIds = new Set(
        dishes
          .filter((d) => d.cityId === cityId && catIds.has(d.categoryId))
          .map((d) => d.venueId)
      );
      list = list.filter((v) => venueIds.has(v.id));
    }

    if (effectiveVenueTypeIds.length) {
      const setIds = new Set(effectiveVenueTypeIds);
      list = list.filter((v) => (v.venueTypeIds || []).some((id) => setIds.has(id)));
    }
    if (effectiveCuisineIds.length) {
      const setIds = new Set(effectiveCuisineIds);
      list = list.filter((v) => (v.cuisineTypeIds || []).some((id) => setIds.has(id)));
    }

    // default sorting by rating (demo)
    list.sort((a, b) => venueRating(b.id) - venueRating(a.id));
    return list;
  }, [cityVenues, draftVenueTypes, draftCuisines, initialVenueTypeIds, initialCuisineIds, initialCat, categories, dishes, cityId]);

  function onSelectCity(id: string) {
    if (!id) return;
    setCurrentCityId(id);
    // В режимі піддоменів setCurrentCityId зробить редірект.
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;
    const parts: string[] = [];
    if (id) parts.push(`city-${id}`);
    const hashValue = parts.join("-");
    const basePath = `/${lang}/venues`;
    const url = hashValue ? `${basePath}#${hashValue}` : basePath;
    router.push(url);
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function applyFilters() {
    const segments: string[] = [];
    if (!subdomainsEnabled && cityId) segments.push(`city-${cityId}`);
    if (draftVenueTypes.length) {
      const tokens = draftVenueTypes
        .map((id) => {
          const vt = venueTypes.find((x) => (x as any).id === id);
          return vt ? slugify((vt as any).name as string) : "";
        })
        .filter(Boolean);
      if (tokens.length) segments.push(`venueTypes-${tokens.join("-")}`);
    }
    if (draftCuisines.length) {
      const tokens = draftCuisines.map((id) => id.replace(/^ct_/, "")).filter(Boolean);
      if (tokens.length) segments.push(`cuisines-${tokens.join("-")}`);
    }
    const hashValue = segments.join("-");
    const basePath = `/${lang}/venues`;
    const url = hashValue ? `${basePath}#${hashValue}` : basePath;
    router.push(url);
  }

  function clearFilters() {
    setDraftVenueTypes([]);
    setDraftCuisines([]);
    const segments: string[] = [];
    if (!subdomainsEnabled && cityId) segments.push(`city-${cityId}`);
    const hashValue = segments.join("-");
    const basePath = `/${lang}/venues`;
    const url = hashValue ? `${basePath}#${hashValue}` : basePath;
    router.push(url);
  }

  function tagNameFromIds(ids: string[], dict: { id: string; name: string }[]) {
    const found = dict.find((x) => ids.includes(x.id));
    return found?.name ?? "";
  }

  if (!city) {
    return (
      <>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />
        <main className="sitePage">
          <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: "-0.03em" }}>{t("choose_city")}</div>
          <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 700 }}>{t("choose_city_hint")}</div>
          <div style={{ marginTop: 18 }}>
            <Link href={`/${lang}/categories`} style={{ textDecoration: "underline" }}>
              {t("back_home")}
            </Link>
          </div>
        </main>
        <SeoBottomText lang={lang} cityId={cityId || "global"} pageKey="venues" />
        <SiteFooter />
      </>
    );
  }

  return (
    <div>
<SeoFab lang={lang} cityId={cityId || "global"} pageKey="venues" hint={t("venues")} />
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />

      {/* Hero */}
      <section
        style={{
          borderBottom: "1px solid rgba(31,41,55,0.08)",
          backgroundImage: `url(${cityHeroBg(city.name)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="sitePage" style={{ paddingTop: 44, paddingBottom: 36 }}>
          <div style={{ fontSize: 14, opacity: 0.7, fontWeight: 800 }}>
            <Link href={`/${lang}/categories`} style={{ textDecoration: "none", opacity: 0.85 }}>
              {t('home')}
            </Link>
            <span style={{ opacity: 0.5 }}> / </span>
            <span style={{ opacity: 0.95 }}>{t('venues')}</span>
          </div>

          <div
            style={{
              marginTop: 18,
              fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: "clamp(34px, 7vw, 64px)",
              lineHeight: 1.05,
              color: "#111827",
            }}
          >
            {t('all_venues')} — {city.name}
          </div>

          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
            <div style={{ fontSize: 14, opacity: 0.72, fontWeight: 800 }}>
	              {initialVenueTypeIds.length || initialCuisineIds.length || !!initialCat ? t('shown_by_filters') : t('all_city_venues')}
            </div>
            <div style={{ fontSize: 14, opacity: 0.68, fontWeight: 800 }}>
              {filteredVenues.length} {t('found')}
            </div>
          </div>
        </div>
      </section>

      <main className="sitePage" style={{ paddingTop: 26, paddingBottom: 22 }}>
        {/* Mobile filter trigger */}
        <div className="siteMobileOnly" style={{ marginBottom: 14 }}>
          <button
            type="button"
            className="siteMobileFilterTrigger"
            onClick={() => setFiltersOpen(true)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 950 }}>{t("filters")}</span>
              {appliedFiltersCount ? (
                <span className="siteMobileFilterBadge">{appliedFiltersCount}</span>
              ) : (
                <span style={{ opacity: 0.7, fontWeight: 850, fontSize: 12 }}>{lang === "ru" ? "Не выбрано" : "Не вибрано"}</span>
              )}
            </div>
            <span style={{ fontWeight: 950, opacity: 0.75 }}>{lang === "ru" ? "Открыть" : "Відкрити"}</span>
          </button>
        </div>

        <div className="venuesGrid">
          {/* Filters card (desktop) */}
          <aside
            className="siteDesktopOnly"
            style={{
              borderRadius: 22,
              border: "1px solid rgba(31,41,55,0.10)",
              background: "rgba(255,255,255,0.78)",
              boxShadow: "0 14px 34px rgba(31,41,55,0.10)",
              padding: "22px 20px 18px",
              height: "fit-content",
            }}
          >
            <div style={{ fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: "-0.02em" }}>
              {t('filters')}
            </div>

            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
              {t('venue_types')}
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
              {venueTypeOptions.length ? venueTypeOptions.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={draftVenueTypes.includes(t.id)}
                  label={t.name}
                  onChange={() => setDraftVenueTypes((prev) => toggle(prev, t.id))}
                />
              )) : (
                <div style={{ opacity: 0.7, fontWeight: 750 }}>Немає типів у цьому місті.</div>
              )}
            </div>

            <div style={{ marginTop: 18, fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
              {t('cuisine')}
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
              {cuisineOptions.length ? cuisineOptions.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={draftCuisines.includes(t.id)}
                  label={t.name}
                  onChange={() => setDraftCuisines((prev) => toggle(prev, t.id))}
                />
              )) : (
                <div style={{ opacity: 0.7, fontWeight: 750 }}>Немає кухонь у цьому місті.</div>
              )}
            </div>

            <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
              <button
                type="button"
                onClick={applyFilters}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(230,162,74,0.70)",
                  background: "#e6a24a",
                  color: "#fff",
                  fontWeight: 950,
                  cursor: "pointer",
                  boxShadow: "0 10px 22px rgba(230,162,74,0.25)",
                }}
              >
                {t('apply')}
              </button>
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(31,41,55,0.12)",
                  background: "rgba(255,255,255,0.70)",
                  color: "#111827",
                  fontWeight: 900,
                  cursor: "pointer",
                  opacity: 0.85,
                }}
              >
                {t('reset')}
              </button>
            </div>
          </aside>

          {/* Venue cards */}
          <section className="siteGrid2" style={{ alignContent: "start" }}>
            {filteredVenues.map((v) => {
              const cover = v.photoUrl?.trim() ? v.photoUrl : venueCover(v.name);
              const rating = venueRating(v.id);
              const eta = Number((v as any).deliveryMinutes ?? 50) || 50;
              const st = openStatus(v.schedule as any);

              const tag1 = tagNameFromIds(v.venueTypeIds || [], venueTypeOptions);
              const tag2 = tagNameFromIds(v.cuisineTypeIds || [], cuisineOptions);

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
                      height: "clamp(170px, 44vw, 260px)",
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

                      {tag1 ? (
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
                          {tag1}
                        </span>
                      ) : null}
                      {tag2 ? (
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
                          {tag2}
                        </span>
                      ) : null}
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
                      {v.description || "Опис буде додано пізніше."}
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

            {!filteredVenues.length ? (
              <div style={{ opacity: 0.72, fontWeight: 800 }}>
                Нічого не {t('found')} за фільтрами.
              </div>
            ) : null}
          </section>
        </div>

        {/* Mobile bottom sheet filters */}
        {filtersOpen ? (
          <div className="siteSheetOverlay" role="dialog" aria-modal="true" aria-label={t("filters")} onClick={() => setFiltersOpen(false)}>
            <div className="siteSheet" onClick={(e) => e.stopPropagation()}>
              <div className="siteSheetHeader">
                <div style={{ fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif", fontWeight: 950, fontSize: 22, letterSpacing: "-0.02em" }}>
                  {t("filters")}
                </div>
                <button type="button" className="siteSheetClose" onClick={() => setFiltersOpen(false)} aria-label={lang === "ru" ? "Закрыть" : "Закрити"}>
                  ×
                </button>
              </div>

              <div className="siteSheetBody">
                <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
                  {t("venue_types")}
                </div>
                <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                  {venueTypeOptions.length ? venueTypeOptions.map((t) => (
                    <Checkbox
                      key={t.id}
                      checked={draftVenueTypes.includes(t.id)}
                      label={t.name}
                      onChange={() => setDraftVenueTypes((prev) => toggle(prev, t.id))}
                    />
                  )) : (
                    <div style={{ opacity: 0.7, fontWeight: 750 }}>{lang === "ru" ? "Нет типов в этом городе." : "Немає типів у цьому місті."}</div>
                  )}
                </div>

                <div style={{ marginTop: 18, fontSize: 12, fontWeight: 950, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
                  {t("cuisine")}
                </div>
                <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                  {cuisineOptions.length ? cuisineOptions.map((t) => (
                    <Checkbox
                      key={t.id}
                      checked={draftCuisines.includes(t.id)}
                      label={t.name}
                      onChange={() => setDraftCuisines((prev) => toggle(prev, t.id))}
                    />
                  )) : (
                    <div style={{ opacity: 0.7, fontWeight: 750 }}>{lang === "ru" ? "Нет кухонь в этом городе." : "Немає кухонь у цьому місті."}</div>
                  )}
                </div>
              </div>

              <div className="siteSheetFooter">
                <button
                  type="button"
                  className="siteSheetPrimary"
                  onClick={() => {
                    applyFilters();
                    setFiltersOpen(false);
                  }}
                >
                  {t("apply")}
                </button>
                <button
                  type="button"
                  className="siteSheetSecondary"
                  onClick={() => {
                    clearFilters();
                    setFiltersOpen(false);
                  }}
                >
                  {t("reset")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <SeoBottomText lang={lang} cityId={cityId || "global"} pageKey="venues" />
      <SiteFooter />
    </div>
  );
}

