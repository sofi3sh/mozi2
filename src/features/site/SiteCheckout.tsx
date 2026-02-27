"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button, Input, SecondaryButton, Textarea } from "@/components/ui/Input";
import { api } from "@/lib/apiClient";
import { useCityScope } from "@/store/cityScope";
import { useVenues } from "@/store/venues";
import { useCart, formatMoneyUAH } from "@/store/cart";
import { useSiteT } from "@/i18n/useSiteT";
import { dayOpenClose, earliestDeliveryAt, isOpenAt } from "@/lib/site/deliveryTime";

function Money({ value }: { value: number }) {
  return <span style={{ fontWeight: 950 }}>{formatMoneyUAH(value)}</span>;
}

function fmtDateTimeShort(d: Date) {
  const time = d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const date = d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
  return isToday ? time : `${time} (${date})`;
}

function toLocalDTInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseLocalDTInput(value: string) {
  const s = String(value || "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

type VenueUi = {
  id: string;
  name: string;
  address: string;
  deliveryMinutes: number;
  schedule: any;
};

type Row = {
  vid: string;
  venueName: string;
  venueAddress: string;
  deliveryMinutes: number;
  schedule: any;
  isOpen: boolean;
  earliest: Date | null;
  itemsCount: number;
};

function computeDeliveryWindow(rows: Row[], now: Date) {
  if (!rows.length) return null as null | { start: Date; end: Date };

  for (let offset = 0; offset < 14; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    day.setHours(0, 0, 0, 0);

    let startMs = -Infinity;
    let endMs = Infinity;

    for (const r of rows) {
      const leadMs = Math.max(0, Math.round(Number(r.deliveryMinutes) || 0)) * 60_000;

      if (r.schedule) {
        const oc = dayOpenClose(r.schedule as any, day);
        if (!oc) {
          startMs = Infinity;
          endMs = -Infinity;
          break;
        }

        const openCandidate = new Date(oc.openAt.getTime() + leadMs);
        const nowCandidate = new Date(now.getTime() + leadMs);

        const earliest = offset === 0 ? new Date(Math.max(openCandidate.getTime(), nowCandidate.getTime())) : openCandidate;
        const latest = oc.closeAt;

        startMs = Math.max(startMs, earliest.getTime());
        endMs = Math.min(endMs, latest.getTime());
      } else {
        // If schedule is missing, treat as always open.
        const base = offset === 0 ? now : day;
        const earliest = new Date(base.getTime() + leadMs);
        const latest = new Date(day.getTime() + (24 * 60 - 1) * 60_000);
        startMs = Math.max(startMs, earliest.getTime());
        endMs = Math.min(endMs, latest.getTime());
      }
    }

    if (Number.isFinite(startMs) && Number.isFinite(endMs) && startMs <= endMs) {
      return { start: new Date(startMs), end: new Date(endMs) };
    }
  }

  return null;
}

export default function SiteCheckout() {
  const { t, lang } = useSiteT();
  const router = useRouter();
  const sp = useSearchParams();

  const { cities, lastCityId, hostCityId, subdomainsEnabled, rootDomain, setCurrentCityId } = useCityScope();
  const { getById: getVenueById } = useVenues();

  const { getCityCart, venueIds, venueTotal, cityTotal, setCustomer, setAddress, setVenueDelivery, clearCity } = useCart();

  const qsCity = sp.get("city") ?? "";
  // Якщо місто визначене піддоменом — пріоритетно беремо його
  const cityId = hostCityId || qsCity || lastCityId || "";
  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  const now = useMemo(() => new Date(), []);

  // Не зберігаємо місто автоматично при завантаженні сторінки.

  const cart = useMemo(() => getCityCart(cityId), [getCityCart, cityId]);
  const vids = useMemo(() => {
    void cart.updatedAt;
    return venueIds(cityId);
  }, [venueIds, cityId, cart.updatedAt]);

  const venuesUi = useMemo(() => {
    const out: Record<string, VenueUi | null> = {};
    for (const vid of vids) {
      const v = getVenueById(vid);
      out[vid] = v
        ? {
            id: v.id,
            name: v.name,
            address: v.address ?? "",
            deliveryMinutes: Number(v.deliveryMinutes ?? 50) || 50,
            schedule: v.schedule,
          }
        : null;
    }
    return out;
  }, [vids, getVenueById]);

  const rows = useMemo<Row[]>(() => {
    return vids
      .map((vid) => {
        const vc = cart.venues?.[vid];
        const v = venuesUi[vid];
        const schedule = v?.schedule;
        const deliveryMinutes = v?.deliveryMinutes ?? 50;
        const isOpen = schedule ? isOpenAt(schedule, now) : true;
        const earliest = schedule ? earliestDeliveryAt(schedule, deliveryMinutes, now) : new Date(now.getTime() + deliveryMinutes * 60_000);

        return {
          vid,
          venueName: v?.name || vc?.venueName || (lang === "ru" ? "Заведение" : "Заклад"),
          venueAddress: v?.address || "",
          deliveryMinutes,
          schedule,
          isOpen,
          earliest,
          itemsCount: (vc?.items ?? []).reduce((s, it) => s + (it.qty || 0), 0),
        };
      })
      .filter(Boolean) as Row[];
  }, [vids, cart.venues, venuesUi, now, lang]);

  const anyClosedNow = useMemo(() => rows.some((r) => !r.isOpen), [rows]);
  const window = useMemo(() => computeDeliveryWindow(rows, now), [rows, now]);

  // Derive global delivery from the first venue in cart.
  const globalDelivery = useMemo(() => {
    void cart.updatedAt;
    const first = vids[0];
    const d = first ? cart.venues?.[first]?.delivery : undefined;
    return {
      mode: d?.mode === "time" ? ("time" as const) : ("asap" as const),
      deliverAtISO: d?.deliverAtISO ? String(d.deliverAtISO) : "",
    };
  }, [vids, cart.venues, cart.updatedAt]);

  function ensureAllDelivery(mode: "asap" | "time", deliverAtISO?: string) {
    if (!cityId) return;
    if (!vids.length) return;

    const iso = mode === "time" ? String(deliverAtISO || "") : "";

    let needs = false;
    for (const vid of vids) {
      const d = cart.venues?.[vid]?.delivery;
      const curMode = d?.mode === "time" ? "time" : "asap";
      const curISO = d?.deliverAtISO ? String(d.deliverAtISO) : "";

      if (curMode !== mode) {
        needs = true;
        break;
      }
      if (mode === "time" && curISO !== iso) {
        needs = true;
        break;
      }
      if (mode === "asap" && curISO) {
        needs = true;
        break;
      }
    }

    if (!needs) return;

    for (const vid of vids) {
      if (mode === "time") setVenueDelivery(cityId, vid, { mode: "time", deliverAtISO: iso || undefined });
      else setVenueDelivery(cityId, vid, { mode: "asap" });
    }
  }

  // Local input value (for manual typing)
  const [manualDT, setManualDT] = useState<string>("");

  // Keep manual input in sync with global delivery.
  useEffect(() => {
    if (globalDelivery.mode !== "time") {
      setManualDT("");
      return;
    }
    const d = globalDelivery.deliverAtISO ? new Date(globalDelivery.deliverAtISO) : null;
    if (d && Number.isFinite(d.getTime())) {
      setManualDT(toLocalDTInputValue(d));
    } else if (window?.start) {
      setManualDT(toLocalDTInputValue(window.start));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDelivery.mode, globalDelivery.deliverAtISO, window?.start?.toISOString()]);

  // Enforce rules:
  // - If any venue is closed now -> force mode "time".
  // - If mode is "time" -> ensure deliverAt is within the global allowed window (intersection across venues).
  useEffect(() => {
    if (!cityId || !rows.length) return;

    if (anyClosedNow) {
      const iso = window?.start ? window.start.toISOString() : "";
      ensureAllDelivery("time", iso);
      return;
    }

    if (globalDelivery.mode === "time") {
      if (!window) return;
      const cur = globalDelivery.deliverAtISO ? new Date(globalDelivery.deliverAtISO) : null;
      const ok = cur && Number.isFinite(cur.getTime()) && cur.getTime() >= window.start.getTime() && cur.getTime() <= window.end.getTime();
      if (!ok) ensureAllDelivery("time", window.start.toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, anyClosedNow, window?.start?.toISOString(), window?.end?.toISOString(), rows.length, globalDelivery.mode, globalDelivery.deliverAtISO]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onSelectCity(id: string) {
    if (!id) return;
    setCurrentCityId(id);
    // В режимі піддоменів setCurrentCityId зробить редірект.
    if (subdomainsEnabled && rootDomain && typeof window !== "undefined") return;
    router.push(`/${lang}/checkout?city=${encodeURIComponent(id)}`);
  }

  const title = t("checkout_title");

  if (!city) {
    return (
      <>
        <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />
        <main className="sitePage">
          <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: "-0.03em" }}>
            {t("choose_city")}
          </div>
          <div style={{ marginTop: 12, opacity: 0.75, fontWeight: 750 }}>
            {t("choose_city_hint")}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href={cityId ? `/categories?city=${encodeURIComponent(cityId)}` : `/${lang}/categories`} style={{ textDecoration: "underline" }}>
              {t("back_home")}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const empty = vids.length === 0;

  async function submit() {
    setError(null);

    const name = cart.customer?.name?.trim() ?? "";
    const phone = cart.customer?.phone?.trim() ?? "";
    const street = cart.address?.street?.trim() ?? "";
    const house = cart.address?.house?.trim() ?? "";

    if (empty) {
      setError(t("cart_empty_short"));
      return;
    }
    if (name.length < 2) {
      setError(lang === "ru" ? "Введите имя." : "Вкажіть ім'я.");
      return;
    }
    if (phone.length < 6) {
      setError(t("err_enter_phone"));
      return;
    }
    if (!street || !house) {
      setError(t("err_fill_address"));
      return;
    }

    // Global delivery validation
    if (anyClosedNow && globalDelivery.mode !== "time") {
      setError(t("err_closed_choose_time"));
      return;
    }

    if (globalDelivery.mode === "time") {
      const d = globalDelivery.deliverAtISO ? new Date(globalDelivery.deliverAtISO) : null;
      if (!d || !Number.isFinite(d.getTime())) {
        setError(t("err_delivery_time"));
        return;
      }
      if (window && (d.getTime() < window.start.getTime() || d.getTime() > window.end.getTime())) {
        setError(
          lang === "ru"
            ? `Время доставки должно быть между ${fmtDateTimeShort(window.start)} и ${fmtDateTimeShort(window.end)}.`
            : `Час доставки має бути між ${fmtDateTimeShort(window.start)} та ${fmtDateTimeShort(window.end)}.`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        cityId,
        customer: { name, phone },
        address: { street, house, flat: cart.address?.flat ?? "", comment: cart.address?.comment ?? "" },
        venues: rows
          .map((row) => {
            const vc = cart.venues?.[row.vid];
            if (!vc || !vc.items?.length) return null;

            return {
              venueId: row.vid,
              delivery: {
                mode: globalDelivery.mode,
                deliverAtISO: globalDelivery.mode === "time" ? (globalDelivery.deliverAtISO || undefined) : undefined,
              },
              items: vc.items.map((it) => ({
                dishId: it.dishId,
                qty: it.qty,
                selections: (it.selections || []).map((s) => ({ groupId: s.groupId, optionIds: s.optionIds })),
              })),
            };
          })
          .filter(Boolean),
      };

      const res = await api<{ payment: { id: string; amount: number; status: string; provider: string }; orders: Array<{ id: string; number: number }> }>(
        "/api/checkout",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const numbers = (res.orders || []).map((o) => o.number);

      clearCity(cityId);

      const q = new URLSearchParams();
      q.set("city", cityId);
      if (numbers.length) q.set("numbers", numbers.join(","));
      router.push(`/${lang}/checkout/success?${q.toString()}`);
    } catch (e: any) {
      setError(e?.message ?? (lang === "ru" ? "Не удалось оформить заказ." : "Не вдалося оформити замовлення."));
    } finally {
      setSubmitting(false);
    }
  }

  const asapDisabled = anyClosedNow;

  return (
    <>
      <SiteHeader cities={cities} selectedCityId={cityId} onSelectCity={onSelectCity} />

      <main className="sitePage">
        <div
          style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
        >
          <div
            style={{
              fontFamily: "ui-sans-serif, Arial, Helvetica, sans-serif",
              fontWeight: 900,
              fontSize: 44,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          <Link
            href={`/${lang}/cart?city=${encodeURIComponent(cityId)}`}
            style={{ textDecoration: "none", fontWeight: 950, opacity: 0.85 }}
          >
            {lang === "ru" ? "← Вернуться в корзину" : "← Повернутись у кошик"}
          </Link>
        </div>

        {empty ? (
          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 22,
              border: "1px solid rgba(31,41,55,0.10)",
              background: "rgba(255,255,255,0.78)",
            }}
          >
            <div style={{ fontWeight: 950 }}>{t("cart_empty_short")}</div>
            <div style={{ marginTop: 10 }}>
              <Link href={`/${lang}/venues?city=${encodeURIComponent(cityId)}`} style={{ textDecoration: "underline" }}>
                {lang === "ru" ? "Выбрать заведения" : "Обрати заклади"}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="ui-siteSplit" style={{ marginTop: 18 }}>
              {/* Form (single continuous block) */}
              <Card style={{ borderRadius: 22, padding: 18 }}>
                <CardHeader
                  title={lang === "ru" ? "Данные заказа" : "Дані замовлення"}
                  subtitle={lang === "ru" ? "Контакты, адрес и время доставки" : "Контакти, адреса та час доставки"}
                />

                <div style={{ display: "grid", gap: 16 }}>
                  {/* Contacts */}
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{lang === "ru" ? "Контакты" : "Контакти"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div className="ui-field">
                        <div className="ui-label">{lang === "ru" ? "Имя" : "Ім'я"}</div>
                        <Input
                          value={cart.customer?.name ?? ""}
                          onChange={(e) => setCustomer(cityId, { name: e.target.value })}
                          placeholder={lang === "ru" ? "Иван" : "Іван"}
                          autoComplete="name"
                        />
                      </div>
                      <div className="ui-field">
                        <div className="ui-label">{lang === "ru" ? "Телефон" : "Телефон"}</div>
                        <Input
                          value={cart.customer?.phone ?? ""}
                          onChange={(e) => setCustomer(cityId, { phone: e.target.value })}
                          placeholder={"+380..."}
                          inputMode="tel"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ui-divider" />

                  {/* Address */}
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{lang === "ru" ? "Адрес доставки" : "Адреса доставки"}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10 }}>
                      <div className="ui-field">
                        <div className="ui-label">{lang === "ru" ? "Улица" : "Вулиця"}</div>
                        <Input
                          value={cart.address?.street ?? ""}
                          onChange={(e) => setAddress(cityId, { street: e.target.value })}
                          autoComplete="street-address"
                        />
                      </div>
                      <div className="ui-field">
                        <div className="ui-label">{lang === "ru" ? "Дом" : "Будинок"}</div>
                        <Input value={cart.address?.house ?? ""} onChange={(e) => setAddress(cityId, { house: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10 }}>
                      <div className="ui-field">
                        <div className="ui-label">{lang === "ru" ? "Кв." : "Кв."}</div>
                        <Input value={cart.address?.flat ?? ""} onChange={(e) => setAddress(cityId, { flat: e.target.value })} />
                      </div>
                      <div className="ui-field">
                        <div className="ui-label">{lang === "ru" ? "Комментарий" : "Коментар"}</div>
                        <Textarea
                          value={cart.address?.comment ?? ""}
                          onChange={(e) => setAddress(cityId, { comment: e.target.value })}
                          placeholder={lang === "ru" ? "Подъезд, этаж, домофон..." : "Під'їзд, поверх, домофон..."}
                          style={{ minHeight: 84 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ui-divider" />

                  {/* Delivery */}
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{lang === "ru" ? "Доставка" : "Доставка"}</div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        disabled={asapDisabled}
                        className={cx("ui-chip", globalDelivery.mode === "asap" && "ui-chip--active")}
                        onClick={() => ensureAllDelivery("asap")}
                        style={{ opacity: asapDisabled ? 0.55 : 1 }}
                      >
                        {lang === "ru" ? "Как можно быстрее" : "Як найшвидше"}
                      </button>

                      <button
                        type="button"
                        className={cx("ui-chip", globalDelivery.mode === "time" && "ui-chip--active")}
                        onClick={() => {
                          const iso = window?.start ? window.start.toISOString() : "";
                          ensureAllDelivery("time", globalDelivery.deliverAtISO || iso);
                        }}
                      >
                        {lang === "ru" ? "На время" : "На час"}
                      </button>

                      {anyClosedNow ? (
                        <span style={{ alignSelf: "center" }} className="ui-muted">
                          {lang === "ru"
                            ? "Некоторые заведения закрыты — доступна только доставка на время."
                            : "Деякі заклади зачинені — доступна лише доставка на час."}
                        </span>
                      ) : null}
                    </div>

                    {globalDelivery.mode === "time" ? (
                      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
                        <div className="ui-label">{t("label_delivery_time")}</div>
                        <Input
                          type="datetime-local"
                          value={manualDT}
                          min={window?.start ? toLocalDTInputValue(window.start) : undefined}
                          max={window?.end ? toLocalDTInputValue(window.end) : undefined}
                          onChange={(e) => {
                            const v = e.target.value;
                            setManualDT(v);
                            const d = parseLocalDTInput(v);
                            if (!d) return;
                            ensureAllDelivery("time", d.toISOString());
                          }}
                        />

                        {window ? (
                          <div className="ui-muted" style={{ fontWeight: 850 }}>
                            {lang === "ru"
                              ? `Можно заказать на время: с ${fmtDateTimeShort(window.start)} до ${fmtDateTimeShort(window.end)}.`
                              : `Можна замовити на час: з ${fmtDateTimeShort(window.start)} до ${fmtDateTimeShort(window.end)}.`}
                          </div>
                        ) : (
                          <div className="ui-muted" style={{ fontWeight: 850 }}>
                            {lang === "ru" ? "Нет доступного окна доставки в ближайшие дни." : "Немає доступного вікна доставки найближчими днями."}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <div style={{ position: "sticky", top: 18, alignSelf: "start" }} className="ui-grid">
                <Card style={{ borderRadius: 22, padding: 18 }}>
                  <CardHeader
                    title={lang === "ru" ? "Ваш заказ" : "Ваше замовлення"}
                    subtitle={lang === "ru" ? "Проверьте позиции перед оплатой" : "Перевірте позиції перед оплатою"}
                    right={<div style={{ fontWeight: 950 }}>{lang === "ru" ? "Итого:" : "Разом:"} <Money value={cityTotal(cityId)} /></div>}
                  />

                  <div style={{ display: "grid", gap: 10 }}>
                    {rows.map((row) => {
                      const vc = cart.venues?.[row.vid];
                      if (!vc || !vc.items?.length) return null;
                      const total = venueTotal(cityId, row.vid);
                      return (
                        <div key={row.vid} className="ui-row" style={{ padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 950, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.venueName}</div>
                              {row.venueAddress ? <div className="ui-muted" style={{ marginTop: 2, fontWeight: 800, fontSize: 12 }}>{row.venueAddress}</div> : null}
                            </div>
                            <span className={cx("ui-badge", row.isOpen ? "ui-badge--ok" : "ui-badge--stop")}>
                              {row.isOpen ? (lang === "ru" ? "Открыто" : "Відкрито") : (lang === "ru" ? "Закрыто" : "Зачинено")}
                            </span>
                          </div>

                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {vc.items.map((it) => (
                              <div key={it.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {it.name} <span className="ui-muted">×{it.qty}</span>
                                  </div>
                                  {it.selections?.length ? (
                                    <div style={{ fontSize: 12, marginTop: 2 }} className="ui-muted">
                                      {it.selections.map((s) => `${s.groupTitle}: ${s.optionTitles.join(", ")}`).join(" · ")}
                                    </div>
                                  ) : null}
                                </div>
                                <div style={{ fontWeight: 950, flexShrink: 0 }}>{formatMoneyUAH(it.unitPrice * it.qty)}</div>
                              </div>
                            ))}
                          </div>

                          <div className="ui-divider" style={{ margin: "12px 0" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <div className="ui-muted" style={{ fontWeight: 900 }}>{lang === "ru" ? "Сумма" : "Сума"}</div>
                            <div style={{ fontWeight: 950 }}><Money value={total} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="ui-divider" style={{ margin: "14px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>{lang === "ru" ? "К оплате" : "До сплати"}</div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}><Money value={cityTotal(cityId)} /></div>
                  </div>

                  <div style={{ marginTop: 12 }} className="ui-actions">
                    <SecondaryButton type="button" onClick={() => router.push(`/${lang}/cart?city=${encodeURIComponent(cityId)}`)} style={{ borderRadius: 999, padding: "10px 14px", color: "#000000" }}>
                      {lang === "ru" ? "Вернуться в корзину" : "Повернутись у кошик"}
                    </SecondaryButton>
                    <Button type="button" onClick={submit} disabled={submitting} style={{ 
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "1px solid rgba(230,162,74,0.70)",
                      background: "rgba(230,162,74,0.18)",
                      fontWeight: 950,
                      textDecoration: "none", 
                      color: "#000000",
                      }}>
                      {submitting ? (lang === "ru" ? "Оформляем..." : "Оформлюємо...") : lang === "ru" ? "Оформить заказ" : "Оформити замовлення"}
                    </Button>
                  </div>

                 {/* 
                  <div className="ui-muted" style={{ marginTop: 10, fontWeight: 850 }}>
                    {lang === "ru" ? "Оплата только онлайн." : "Оплата лише онлайн."}
                  </div>
                  */}

                  {error ? (
                    <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 900 }}>
                      {error}
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
