"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { useSiteLang } from "@/store/siteLang";
import { useSiteT } from "@/i18n/useSiteT";
import { useCityScope } from "@/store/cityScope";
import { useVenues } from "@/store/venues";
import { useCart, formatMoneyUAH } from "@/store/cart";

function Money({ value }: { value: number }) {
  return <span style={{ fontWeight: 950 }}>{formatMoneyUAH(value)}</span>;
}

function QtyControl({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(31,41,55,0.10)",
        background: "rgba(255,255,255,0.70)",
        minWidth: 124,
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

export default function SiteCart() {
  const { lang } = useSiteLang();
  const { t } = useSiteT();
  const router = useRouter();
  const sp = useSearchParams();
  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();
  const { getByCity } = useVenues();
  const { hydrated, getCityCart, venueIds, itemsByVenue, setQty, removeItem, clearVenue, clearCity, venueTotal, cityTotal } = useCart();

  const qsCity = sp.get("city") ?? "";
  // Якщо місто визначене піддоменом — пріоритетно беремо його
  const cityId = hostCityId || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  // Не зберігаємо місто автоматично при завантаженні сторінки.

  const cart = useMemo(() => getCityCart(cityId), [getCityCart, cityId]);
  const vids = useMemo(() => {
    void cart.updatedAt;
    return venueIds(cityId);
  }, [venueIds, cityId, cart.updatedAt]);
  const cityVenues = useMemo(() => (cityId ? getByCity(cityId) : []), [getByCity, cityId]);

  function onSelectCity(id: string) {
    if (!id) return;
    setCurrentCityId(id);
    // В режимі піддоменів setCurrentCityId зробить редірект.
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;
    router.push(`/${lang}/cart?city=${encodeURIComponent(id)}`);
  }

  if (!city) {
    return (
      <>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />
        <main className="sitePage">
          <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: "-0.03em" }}>{t("choose_city")}</div>
          <div style={{ marginTop: 10, opacity: 0.72, fontWeight: 700 }}>{t("choose_city_hint")}</div>
          <div style={{ marginTop: 18 }}>
            <Link href={cityId ? `/${lang}/categories?city=${encodeURIComponent(cityId)}` : `/${lang}/categories`} style={{ textDecoration: "underline" }}>
              {t("back_home")}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  // When navigating between pages, providers are re-mounted; avoid showing a false "empty" cart
  // before localStorage hydration finishes.
  if (!hydrated) {
    return (
      <>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />
        <main className="sitePage">
          <div style={{ fontFamily: "ui-serif, Georgia, Times New Roman, serif", fontWeight: 900, fontSize: 44, letterSpacing: "-0.02em" }}>
            {t("cart")}
          </div>
          <div style={{ marginTop: 16, opacity: 0.72, fontWeight: 800 }}>{lang === "ru" ? "Загрузка корзины..." : "Завантаження кошика..."}</div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const empty = vids.length === 0;

  const useQueryCity = !(subdomainsEnabled && rootDomain);
  const checkoutHref = `/${lang}/checkout${useQueryCity && cityId ? `?city=${encodeURIComponent(cityId)}` : ""}`;

  return (
    <>
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />

      <main className="sitePage">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ fontFamily: "ui-serif, Georgia, Times New Roman, serif", fontWeight: 900, fontSize: 44, letterSpacing: "-0.02em" }}>
            {t("cart")}
          </div>

          {!empty ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(t("confirm_clear_cart"))) clearCity(cityId);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                border: "1px solid rgba(31,41,55,0.10)",
                background: "rgba(255,255,255,0.70)",
                cursor: "pointer",
                fontWeight: 950,
              }}
            >
              {t("clear")}
            </button>
          ) : null}
        </div>

        {empty ? (
          <div style={{ marginTop: 18, padding: 18, borderRadius: 22, border: "1px solid rgba(31,41,55,0.10)", background: "rgba(255,255,255,0.78)" }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{t("cart_empty_title")}</div>
            <div style={{ marginTop: 8, opacity: 0.72, fontWeight: 750 }}>{t("cart_empty_hint")}</div>
            <div style={{ marginTop: 14 }}>
              <Link href={`/${lang}/venues?city=${encodeURIComponent(cityId)}`} style={{ textDecoration: "underline", fontWeight: 900 }}>
                {t("go_to_venues")}
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 18, display: "grid", gap: 18 }}>
            {vids.map((vid) => {
              const venue = cityVenues.find((v) => v.id === vid);
              const venueName = venue?.name || cart.venues?.[vid]?.venueName || t("venue_fallback");
              const items = itemsByVenue(cityId, vid);
              return (
                <section
                  key={vid}
                  style={{
                    borderRadius: 22,
                    border: "1px solid rgba(31,41,55,0.10)",
                    background: "rgba(255,255,255,0.78)",
                    boxShadow: "0 14px 34px rgba(31,41,55,0.10)",
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>{venueName}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ fontWeight: 950, opacity: 0.9 }}>
                        {t("total_label")} <Money value={venueTotal(cityId, vid)} />
                      </div>
                      
                    </div>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                    {items.map((it) => (
                      <div
                        key={it.id}
                        style={{
                          borderRadius: 18,
                          border: "1px solid rgba(31,41,55,0.10)",
                          background: "rgba(255,255,255,0.70)",
                          padding: 12,
                          display: "grid",
                          gridTemplateColumns: "64px 1fr auto",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 14,
                            border: "1px solid rgba(31,41,55,0.10)",
                            backgroundImage: it.photoUrl ? `url(${it.photoUrl})` : "none",
                            backgroundColor: "rgba(230,162,74,0.10)",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 950 }}>{it.name}</div>
                          {it.selections?.length ? (
                            <div style={{ marginTop: 6, opacity: 0.72, fontWeight: 750, fontSize: 13, lineHeight: 1.35 }}>
                              {it.selections.map((s) => (
                                <div key={s.groupId}>
                                  <span style={{ fontWeight: 900 }}>{s.groupTitle}:</span> {s.optionTitles.join(", ")}
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 950 }}>
                              <Money value={it.unitPrice} />
                              <span style={{ opacity: 0.65, fontWeight: 800 }}> / 1</span>
                            </div>
                            <div style={{ opacity: 0.75, fontWeight: 900 }}>
                              {lang === "ru" ? "Итого:" : "Разом:"} <Money value={it.unitPrice * it.qty} />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <QtyControl
                            value={it.qty}
                            onDec={() => {
                              const next = Math.max(1, it.qty - 1);
                              if (next === 1 && it.qty === 1) return;
                              setQty(cityId, vid, it.id, next);
                            }}
                            onInc={() => setQty(cityId, vid, it.id, it.qty + 1)}
                          />

                          <button
                            type="button"
                            onClick={() => removeItem(cityId, vid, it.id)}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 999,
                              border: "1px solid rgba(31,41,55,0.10)",
                              background: "rgba(255,255,255,0.70)",
                              cursor: "pointer",
                              fontWeight: 950,
                            }}
                            title={lang === "ru" ? "Удалить" : "Видалити"}
                            aria-label={lang === "ru" ? "Удалить" : "Видалити"}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, opacity: 0.75, fontWeight: 750 }}>
                    <Link
                      href={`/${lang}/checkout?city=${encodeURIComponent(cityId)}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 999,
                        border: "1px solid rgba(230,162,74,0.70)",
                        background: "rgba(230,162,74,0.18)",
                        fontWeight: 950,
                        textDecoration: "none",
                      }}
                    >
                      {lang === "ru" ? "Перейти к оформлению" : "Перейти до оформлення"}
                    </Link>
                  </div>
                </section>
              );
            })}

            <section
              style={{
                borderRadius: 22,
                border: "1px solid rgba(31,41,55,0.10)",
                background: "rgba(255,255,255,0.78)",
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontWeight: 950, fontSize: 18 }}>
                {lang === "ru" ? "Итого по городу:" : "Разом по місту:"} <Money value={cityTotal(cityId)} />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={`/${lang}/venues?city=${encodeURIComponent(cityId)}`}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(31,41,55,0.10)",
                    background: "rgba(255,255,255,0.70)",
                    fontWeight: 950,
                    textDecoration: "none",
                  }}
                >
                  {lang === "ru" ? "Добавить ещё" : "Додати ще"}
                </Link>
                <Link
                  href={`/${lang}/checkout?city=${encodeURIComponent(cityId)}`}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(230,162,74,0.70)",
                    background: "rgba(230,162,74,0.18)",
                    fontWeight: 950,
                    textDecoration: "none",
                  }}
                >
                  {t("checkout_and_pay")}
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Mobile: sticky checkout (only on cart page) */}
      {!empty ? (
        <>
          <div className="siteMobileCheckoutSpacer" aria-hidden="true" />
          <div className="siteMobileCheckoutBar" role="region" aria-label={lang === "ru" ? "Оформление" : "Оформлення"}>
            <Link href={checkoutHref} className="siteMobileCheckoutBtn">
              <div className="siteMobileCheckoutBtnLeft">
                <div className="siteMobileCheckoutBtnTitle">{t("checkout_order")}</div>
                <div className="siteMobileCheckoutBtnSubtitle">{lang === "ru" ? "Переход к оплате и подтверждению" : "Перехід до оплати та підтвердження"}</div>
              </div>
              <div className="siteMobileCheckoutBtnRight">{formatMoneyUAH(cityTotal(cityId))}</div>
            </Link>
          </div>
        </>
      ) : null}

      <SiteFooter />
    </>
  );
}
