"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { useSiteT } from "@/i18n/useSiteT";
import SeoBottomText from "@/components/site/seo/SeoBottomText";
import SeoFab from "@/components/site/seo/SeoFab";
import { useCityScope } from "@/store/cityScope";
import { useVenues } from "@/store/venues";
import { useMenu } from "@/store/menu";
import { useCatalog } from "@/store/catalog";
import { useCart } from "@/store/cart";
import { ClockIcon, PinIcon, StarIcon } from "@/components/site/SiteIcons";
import { cityHeroBg, venueCover } from "@/lib/site/siteMedia";
import type { ModifierGroup, ModifierOption } from "@/store/menu";
import type { CartModifierSelection } from "@/store/cart";
import IngredientsPickerModal from "@/features/site/IngredientsPickerModal";

type Props = { cityId: string; venueSlug: string };

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

function dayKey(d: number) {
  // JS: 0=sun..6=sat
  return (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[d];
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isNowOpen(schedule: any, tr: (key: string) => string) {
  try {
    const now = new Date();
    const dk = dayKey(now.getDay());

    const days = Array.isArray(schedule) ? schedule : Array.isArray(schedule?.days) ? schedule.days : [];
    const exceptions = Array.isArray(schedule?.exceptions) ? schedule.exceptions : [];
    const ex = exceptions.find((x: any) => x?.date === isoDate(now));
    const today = ex ?? days.find((x: any) => x.day === dk);
    if (!today || today.isClosed) return { open: false, text: tr("closed") };

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const nowStr = `${hh}:${mm}`;

    const open = today.open || "00:00";
    const close = today.close || "23:59";

    const isOpen = nowStr >= open && nowStr <= close;
    return { open: isOpen, text: isOpen ? tr("open") : tr("closed"), range: `${open} - ${close}` };
  } catch {
    return { open: false, text: tr("closed") };
  }
}

function Money({ value }: { value: number }) {
  return (
    <span style={{ fontWeight: 950 }}>
      {new Intl.NumberFormat("uk-UA").format(value)} ₴
    </span>
  );
}

function QtyControl({
  value,
  onDec,
  onInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 999,
        border: "1px solid rgba(31,41,55,0.10)",
        background: "rgba(255,255,255,0.70)",
        minWidth: 108,
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={onDec}
        style={{
          width: 26,
          height: 26,
          borderRadius: 10,
          border: "1px solid rgba(31,41,55,0.12)",
          background: "#fff",
          fontWeight: 950,
          cursor: "pointer",
        }}
        aria-label="Зменшити"
      >
        −
      </button>
      <div style={{ fontWeight: 950, minWidth: 18, textAlign: "center" }}>{value}</div>
      <button
        type="button"
        onClick={onInc}
        style={{
          width: 26,
          height: 26,
          borderRadius: 10,
          border: "1px solid rgba(31,41,55,0.12)",
          background: "#fff",
          fontWeight: 950,
          cursor: "pointer",
        }}
        aria-label="Збільшити"
      >
        +
      </button>
    </div>
  );
}

export default function SiteVenueMenu({ cityId, venueSlug }: Props) {
  const { t, lang } = useSiteT();
  const { cities } = useCityScope();
  const { getByCity } = useVenues();
  const { getCategories, getDishes, modifierGroups } = useMenu();
  const { venueTypes, cuisineTypes } = useCatalog();
  const { addItem } = useCart();

  // Не "запамʼятовуємо" місто автоматично.

  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);
  const venue = useMemo(() => {
    const list = getByCity(cityId);
    return list.find((v) => v.slug === venueSlug) ?? null;
  }, [getByCity, cityId, venueSlug]);

  const categories = useMemo(() => {
    if (!venue) return [];
    return getCategories(cityId, venue.id);
  }, [getCategories, cityId, venue]);

  const dishes = useMemo(() => {
    if (!venue) return [];
    return getDishes(cityId, venue.id);
  }, [getDishes, cityId, venue]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof dishes>();
    for (const d of dishes) {
      if (d.isStopped) continue;
      const arr = map.get(d.categoryId) ?? [];
      arr.push(d);
      map.set(d.categoryId, arr);
    }
    for (const [k, arr] of map) {
      arr.sort((a, b) => a.name.localeCompare(b.name, "uk"));
      map.set(k, arr);
    }
    return map;
  }, [dishes]);

  const [activeCatId, setActiveCatId] = useState<string>("");
  useEffect(() => {
    if (!activeCatId && categories.length) setActiveCatId(categories[0].id);
  }, [categories, activeCatId]);

  const [qty, setQty] = useState<Record<string, number>>({});

  const [ingOpen, setIngOpen] = useState(false);
  const [ingDishId, setIngDishId] = useState<string | null>(null);
  const [ingQty, setIngQty] = useState(1);
  const [ingBasePrice, setIngBasePrice] = useState(0);
  const [ingBaseSelections, setIngBaseSelections] = useState<CartModifierSelection[]>([]);

  const ingDish = useMemo(() => {
    if (!ingDishId) return null;
    return dishes.find((d) => d.id === ingDishId) ?? null;
  }, [dishes, ingDishId]);

  const venueModifierGroups = useMemo(() => {
    if (!venue) return [];
    return (modifierGroups || []).filter((g) => g.cityId === cityId && g.venueId === venue.id);
  }, [modifierGroups, cityId, venue]);

  const groupById = useMemo(() => {
    const m = new Map<string, ModifierGroup>();
    for (const g of venueModifierGroups) m.set(String(g.id), g);
    return m;
  }, [venueModifierGroups]);

  const addIngredientsLabel = lang === "ru" ? "Добавить ингредиенты" : "Додати інгредієнти";

  function isVarGroupTitle(title: string) {
    return String(title || "").trim().toUpperCase().startsWith("VAR::");
  }

  function cleanVarGroupTitle(title: string) {
    return String(title || "").replace(/^\s*VAR::\s*/i, "").trim();
  }

  function splitGroupsForDish(dish: any) {
    const groups: ModifierGroup[] = (dish?.modifierGroupIds || [])
      .map((id: string) => groupById.get(String(id)))
      .filter(Boolean) as ModifierGroup[];

    const varGroups = groups
      .filter((g) => isVarGroupTitle(g.title))
      .map((g) => ({ ...g, title: cleanVarGroupTitle(g.title) }));

    const ingredientGroups = groups
      .filter((g) => !isVarGroupTitle(g.title))
      .filter((g) => (g.options || []).some((o) => !o.isStopped));

    return { varGroups, ingredientGroups };
  }
  const setDishQty = (id: string, next: number) =>
    setQty((prev) => ({ ...prev, [id]: Math.max(0, next) }));

  const cover = venue?.photoUrl?.trim() ? venue.photoUrl : venue ? venueCover(venue.name) : "";
  const rating = venue ? venueRating(venue.id) : 0;
  const eta = venue ? (Number((venue as any).deliveryMinutes ?? 50) || 50) : 0;

  // NOTE: `venue` can be null/undefined briefly while data loads or if the slug is invalid.
  // Avoid reading properties from null and keep the UI stable.
  const schedule = (venue as any)?.schedule ?? { days: [], exceptions: [] };
  const tAny: (key: string) => string = (key) => t(key as any);

  const status = venue ? isNowOpen(schedule, tAny) : { open: false, text: t("closed") };
  const range = (status as any)?.range ?? "";

  const typeLabel = venue?.venueTypeIds?.[0]
    ? venueTypes.find((x) => x.id === venue.venueTypeIds[0])?.name
    : "";
  const cuisineLabel = venue?.cuisineTypeIds?.[0]
    ? cuisineTypes.find((x) => x.id === venue.cuisineTypeIds[0])?.name
    : "";

  function addToCart(dish: any, qtyCount: number, selections: any[] = [], basePriceOverride?: number) {
    if (!city || !venue) return;
    addItem({
      cityId,
      venueId: venue.id,
      venueName: venue.name,
      dishId: dish.id,
      name: dish.name,
      photoUrl: dish.photoUrl?.trim() ? dish.photoUrl : "",
      basePrice: Number(basePriceOverride ?? dish.price ?? 0),
      qty: qtyCount,
      selections,
    });
  }

  function openIngredientsModal(dish: any, qtyCount: number, basePrice: number, baseSelections: CartModifierSelection[]) {
    setIngDishId(dish.id);
    setIngQty(Math.max(1, Math.round(Number(qtyCount) || 1)));
    setIngBasePrice(Math.max(0, Math.round(Number(basePrice) || 0)));
    setIngBaseSelections(baseSelections || []);
    setIngOpen(true);
  }

  function makeVariantSelection(g: ModifierGroup, o: ModifierOption): CartModifierSelection {
    return {
      groupId: String(g.id),
      groupTitle: String(g.title),
      optionIds: [String(o.id)],
      optionTitles: [String(o.name)],
      priceDeltaSum: 0,
    };
  }

  if (!city || !venue) {
    return (
      <div>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={() => {}} />
        <main className="sitePage" style={{ paddingTop: 44 }}>
          <div style={{ fontSize: 26, fontWeight: 950 }}>{t('not_found_venue')}</div>
          <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 700 }}>
            {t('check_city_link')}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href={`/${lang}/venues?city=${encodeURIComponent(cityId)}`} style={{ textDecoration: "underline" }}>
              {t('back_to_venues')}
            </Link>
          </div>
        </main>
      <SeoBottomText lang={lang} cityId={cityId || "global"} pageKey={`venue:${venueSlug}`} />
      <SiteFooter />
      </div>
    );
  }

  const activeCat = categories.find((c) => c.id === activeCatId) ?? categories[0];
  const visibleCategories = activeCat ? [activeCat] : categories;

  return (
    <div>
<SeoFab lang={lang} cityId={cityId || "global"} pageKey={`venue:${venueSlug}`} hint={t("menu")} />
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={(id) => {}} />

      {/* Hero */}
      <section
        style={{
          // Меню: робимо фото компактнішим (менша "довжина" героя)
          height: "clamp(220px, 24vw, 280px)",
          borderBottom: "1px solid rgba(31,41,55,0.08)",
          backgroundImage: `url(${cover || cityHeroBg(city.name)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17,24,39,0.35) 0%, rgba(17,24,39,0.15) 45%, rgba(248,242,233,0.96) 100%)",
          }}
        />

        <div className="siteContainer" style={{ position: "relative", paddingTop: 28, paddingBottom: 28 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.82)", fontWeight: 800 }}>
            <Link
              href={cityId ? `/${lang}/categories?city=${encodeURIComponent(cityId)}` : "/categories"}
              style={{ textDecoration: "none", color: "rgba(255,255,255,0.86)" }}
            >
              {t('home')}
            </Link>
            <span style={{ opacity: 0.6 }}> / </span>
            <Link
              href={`/${lang}/categories?city=${encodeURIComponent(cityId)}`}
              style={{ textDecoration: "none", color: "rgba(255,255,255,0.86)" }}
            >
              {city.name}
            </Link>
            <span style={{ opacity: 0.6 }}> / </span>
            <span style={{ opacity: 0.98 }}>{venue.name}</span>
          </div>

          <div
            style={{
              marginTop: 10,
              fontFamily: "ui-serif, Georgia, Times New Roman, serif",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: 64,
              lineHeight: 1.05,
              color: "#fff",
              textShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            {venue.name}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.20)",
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <StarIcon size={16} /> {rating}
            </span>

            <span
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.20)",
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.92)",
                fontWeight: 900,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ClockIcon size={16} /> {t('eta',{min: eta})}
            </span>

            {activeCat?.name ? (
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.20)",
                  background: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 900,
                }}
              >
                {activeCat.name}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Info cards (під фото, не поверх) */}
      <section style={{ marginTop: 18 }}>
        <div className="siteContainer">
          <div className="venueInfoGrid">
            <div className="infoCard">
              <div style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.75, fontWeight: 950, textTransform: "lowercase" }}>
                <PinIcon size={18} /> {t('address')}
              </div>
              <div style={{ marginTop: 10, fontWeight: 950, fontSize: 20 }}>
                {(venue as any).address || "Адресу буде додано"}
              </div>
            </div>

            <div className="infoCard">
              <div style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.75, fontWeight: 950 }}>
                <ClockIcon size={18} /> {t('schedule')}
                <span
                  style={{
                    marginLeft: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: status.open ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.14)",
                    color: status.open ? "rgba(22,163,74,1)" : "rgba(220,38,38,1)",
                    border: "1px solid rgba(31,41,55,0.10)",
                    fontWeight: 950,
                    fontSize: 12,
                  }}
                >
                  {status.text}
                </span>
              </div>
              <div style={{ marginTop: 10, fontWeight: 950, fontSize: 20 }}>
                {range || "—"}
              </div>
            </div>

            <div className="infoCard">
              <div style={{ opacity: 0.75, fontWeight: 950 }}>{t('description')}</div>
              <div style={{ marginTop: 10, fontWeight: 850, fontSize: 16, lineHeight: 1.35 }}>
                {venue.description || t('venue_desc_fallback')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <main className="sitePage" style={{ paddingBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ fontFamily: "ui-serif, Georgia, Times New Roman, serif", fontWeight: 900, fontSize: 40, letterSpacing: "-0.02em" }}>
            {t('menu')}
          </div>

          {activeCat?.name ? (
            <span
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(230,162,74,0.45)",
                background: "rgba(230,162,74,0.14)",
                color: "#111827",
                fontWeight: 950,
              }}
            >
              {activeCat.name}
            </span>
          ) : null}
        </div>

        {/* Category pills */}
        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {categories.map((c) => {
            const active = c.id === activeCatId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCatId(c.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: active ? "1px solid rgba(230,162,74,0.70)" : "1px solid rgba(31,41,55,0.10)",
                  background: active ? "rgba(230,162,74,0.18)" : "rgba(255,255,255,0.70)",
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
{c.name}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 22, display: "grid", gap: 26 }}>
          {visibleCategories.map((c) => {
            const list = grouped.get(c.id) ?? [];
            if (!list.length) return null;
            return (
              <section key={c.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                  <div style={{ fontFamily: "ui-serif, Georgia, Times New Roman, serif", fontWeight: 900, fontSize: 34, letterSpacing: "-0.02em" }}>
                    {c.name}
                  </div>
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
                  {list.map((d) => {
                    const q = qty[d.id] ?? 0;
                    const { varGroups, ingredientGroups } = splitGroupsForDish(d);
                    const hasIngredients = ingredientGroups.length > 0;
                    return (
                      <div
                        key={d.id}
                        className="dishCard"
                      >
                        <div className="dishTop">
                          <div
                            className="dishImg"
                            style={{ backgroundImage: `url(${d.photoUrl?.trim() || venueCover(d.name)})` }}
                          />

                          <div className="dishMeta">
                            <div className="dishTitle">{d.name}</div>
                            <div className="dishDesc">{d.description || t("dish_desc_fallback")}</div>
                            {varGroups.length ?  null : (
                            <div className="dishPrice">
                              <Money value={d.price} />
                            </div>
                            )}
                          </div>

                          <div className="dishActions">
                          {varGroups.length ?  null : (
                            <div className="dishActionsRow">
                              <QtyControl
                                value={q || 1}
                                onDec={() => setDishQty(d.id, Math.max(1, (q || 1) - 1))}
                                onInc={() => setDishQty(d.id, (q || 1) + 1)}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const count = q || 1;
                                  addToCart(d, count, [], d.price);
                                  setDishQty(d.id, 1);
                                }}
                                className="dishAddBtn"
                                aria-label="Додати"
                                title="Додати"
                              >
                                +
                              </button>
                              
                            </div>
                            )}

                            {hasIngredients && !varGroups.length ?  (
                              <button
                                type="button"
                                onClick={() => {
                                  const count = q || 1;
                                  openIngredientsModal(d, count, d.price, []);
                                }}
                                className="dishIngredientsBtn"
                              >
                                {addIngredientsLabel}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {varGroups.length ? (
                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 10,
                              borderTop: "1px dashed rgba(31,41,55,0.14)",
                              display: "grid",
                              gap: 10,
                            }}
                          >
                            {varGroups.map((vg) => (
                              <div key={vg.id} style={{ display: "grid", gap: 6 }}>
                                <div style={{ opacity: 0.72, fontWeight: 950, fontSize: 12, textTransform: "uppercase" }}>
                                  {vg.title}
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  {(vg.options || []).filter((o) => !o.isStopped).map((opt) => {
                                    const variantPrice = Number((opt as any).priceDelta ?? 0) || 0;
                                    const baseSel = makeVariantSelection(vg, opt as any);
                                    return (
                                      <div
                                        key={opt.id}
                                        className="variantRow"
                                      >
                                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                                          <div style={{ fontWeight: 900 }}>{opt.name}</div>
                                          <div style={{ fontWeight: 950 }}>
                                            <Money value={variantPrice} />
                                          </div>
                                        </div>
                                        <div className="variantActions">
                                          {hasIngredients ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const count = q || 1;
                                                openIngredientsModal(d, count, variantPrice, [baseSel]);
                                              }}
                                              className="variantIngredientsBtn"
                                            >
                                              {addIngredientsLabel}
                                            </button>
                                          ) : null}

                                          <button
                                            type="button"
                                            onClick={() => {
                                              const count = q || 1;
                                              addToCart(d, count, [baseSel], variantPrice);
                                              setDishQty(d.id, 1);
                                            }}
                                            className="variantAddBtn"
                                            aria-label="Додати варіант"
                                            title="Додати"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {!categories.length ? (
          <div style={{ marginTop: 18, opacity: 0.72, fontWeight: 800 }}>
            {t('no_menu_yet')}
          </div>
        ) : null}
      </main>

      <IngredientsPickerModal
        open={ingOpen}
        dish={ingDish}
        groups={ingDish ? splitGroupsForDish(ingDish).ingredientGroups : []}
        basePrice={ingBasePrice}
        baseSelections={ingBaseSelections}
        initialQty={ingQty}
        onClose={() => {
          setIngOpen(false);
          setIngDishId(null);
        }}
        onConfirm={(qtyCount, selections) => {
          if (!ingDish) return;
          addToCart(ingDish, qtyCount, selections, ingBasePrice);
          setIngOpen(false);
          setIngDishId(null);
          setDishQty(ingDish.id, 1);
        }}
      />

      <SeoBottomText lang={lang} cityId={cityId || "global"} pageKey={`venue:${venueSlug}`} />
      <SiteFooter />

      <style jsx>{`
        .venueInfoGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .infoCard {
          border-radius: 22px;
          border: 1px solid rgba(31, 41, 55, 0.1);
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 14px 34px rgba(31, 41, 55, 0.1);
          padding: 18px 18px 16px;
        }

        /* Dish cards */
        .dishCard {
          border-radius: 22px;
          border: 1px solid rgba(31, 41, 55, 0.1);
          background: rgba(255, 255, 255, 0.78);
          box-shadow: 0 14px 34px rgba(31, 41, 55, 0.1);
          padding: 14px;
          display: grid;
          gap: 12px;
        }
        .dishTop {
          display: grid;
          grid-template-columns: 76px 1fr auto;
          gap: 14px;
          align-items: center;
        }
        .dishImg {
          width: 76px;
          height: 76px;
          border-radius: 16px;
          border: 1px solid rgba(31, 41, 55, 0.1);
          background-size: cover;
          background-position: center;
          background-color: rgba(255, 255, 255, 0.5);
        }
        .dishMeta {
          min-width: 0;
        }
        .dishTitle {
          font-weight: 950;
          font-size: 16px;
          line-height: 1.15;
        }
        .dishDesc {
          margin-top: 6px;
          font-size: 13px;
          opacity: 0.72;
          font-weight: 700;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dishPrice {
          margin-top: 8px;
        }
        .dishActions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .dishActionsRow {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .dishAddBtn {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(230, 162, 74, 0.7);
          background: #e6a24a;
          color: #fff;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(230, 162, 74, 0.25);
          font-size: 20px;
          line-height: 46px;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .dishAddBtn:active {
          transform: translateY(1px) scale(0.98);
          box-shadow: 0 8px 16px rgba(230, 162, 74, 0.18);
        }
        .dishIngredientsBtn {
          padding: 9px 12px;
          border-radius: 999px;
          border: 1px solid rgba(31, 41, 55, 0.12);
          background: rgba(255, 255, 255, 0.7);
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }

        /* Variants */
        .variantRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid rgba(31, 41, 55, 0.1);
          background: rgba(255, 255, 255, 0.7);
        }
        .variantActions {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
        }
        .variantIngredientsBtn {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(31, 41, 55, 0.12);
          background: rgba(255, 255, 255, 0.7);
          font-weight: 900;
          cursor: pointer;
          white-space: nowrap;
        }
        .variantAddBtn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(230, 162, 74, 0.7);
          background: #e6a24a;
          color: #fff;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(230, 162, 74, 0.22);
          font-size: 20px;
          line-height: 42px;
        }
        @media (max-width: 980px) {
          .venueInfoGrid {
            grid-template-columns: 1fr;
          }
        }

        /* Mobile menu layout */
        @media (max-width: 560px) {
          .dishTop {
            grid-template-columns: 64px 1fr;
            align-items: start;
          }
          .dishImg {
            width: 64px;
            height: 64px;
            border-radius: 14px;
          }
          .dishTitle {
            font-size: 15px;
          }
          .dishActions {
            grid-column: 1 / -1;
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
          }
          .dishActionsRow {
            gap: 10px;
            justify-content: space-between;
          }
          .dishIngredientsBtn {
            white-space: normal;
            text-align: center;
            padding: 10px 12px;
            width: 100%;
          }

          .variantRow {
            grid-template-columns: 1fr;
          }
          .variantActions {
            justify-content: space-between;
          }
          .variantIngredientsBtn {
            white-space: normal;
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
