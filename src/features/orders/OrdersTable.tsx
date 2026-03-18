"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, Select, SecondaryButton } from "@/components/ui/Input";
import { useOrders, type OrderStatus } from "@/store/orders";
import { useCustomers } from "@/store/customers";
import { useVenues } from "@/store/venues";
import { useCityScope } from "@/store/cityScope";

function money(n: number) {
  return new Intl.NumberFormat("uk-UA").format(n);
}

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString("uk-UA", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDeliverAt(mode: any, deliverAt?: string | null) {
  const m = String(mode || "").toLowerCase();
  if (m === "asap") {
    return deliverAt ? "Якнайшвидше (" + fmt(deliverAt) + ")" : "Якнайшвидше";
  }
  if (m === "time") {
    return deliverAt ? fmt(deliverAt) : "На час";
  }
  return deliverAt ? fmt(deliverAt) : (m || "");
}

function fmtAddress(a: any) {
  if (!a || typeof a !== "object") return "";
  const street = String((a as any).street ?? "").trim();
  const house = String((a as any).house ?? "").trim();
  const flat = String((a as any).flat ?? "").trim();
  const comment = String((a as any).comment ?? "").trim();
  const line1 = [street, house ? "буд. " + house : ""].filter(Boolean).join(", ");
  const line2 = [flat ? "кв. " + flat : "", comment].filter(Boolean).join(", ");
  return [line1, line2].filter(Boolean).join(" • ");
}

function isVariationGroupTitle(groupTitle: any) {
  return /^VAR::/i.test(String(groupTitle ?? "").trim());
}

function computeItemPricing(it: any): { unitPrice: number; lineTotal: number } {
  const qty = Number(it?.qty ?? 1) || 1;
  const selections = Array.isArray(it?.selections) ? it.selections : [];

  const hasVariation = selections.some((sel: any) => isVariationGroupTitle(sel?.groupTitle));
  const variationFull = selections.reduce((acc: number, sel: any) => {
    if (!isVariationGroupTitle(sel?.groupTitle)) return acc;
    return acc + (Number(sel?.priceDeltaSum ?? 0) || 0);
  }, 0);

  const additive = selections.reduce((acc: number, sel: any) => {
    if (isVariationGroupTitle(sel?.groupTitle)) return acc;
    return acc + (Number(sel?.priceDeltaSum ?? 0) || 0);
  }, 0);

  const base = Number(it?.basePrice ?? it?.price ?? 0) || 0;
  const baseForUnit = hasVariation ? variationFull : base;
  const unitPrice = Math.max(0, Math.round(baseForUnit + additive));
  const lineTotal = Math.max(0, Math.round(unitPrice * qty));
  return { unitPrice, lineTotal };
}

function computeOrderTotalFromItems(items: any[]): number {
  if (!Array.isArray(items)) return 0;
  let sum = 0;
  for (const it of items) {
    const { lineTotal } = computeItemPricing(it);
    sum += Number.isFinite(lineTotal) ? lineTotal : 0;
  }
  return Math.round(sum);
}


function statusLabel(s: OrderStatus) {
  if (s === "preorder") return "Предзамовлення";
  if (s === "new") return "Нове";
  if (s === "in_progress") return "В процесі";
  if (s === "delivered") return "Доставлено";
  return "Скасовано";
}

function statusVariant(s: OrderStatus): "default" | "ok" | "stop" {
  if (s === "delivered") return "ok";
  if (s === "cancelled") return "stop";
  return "default";
}

type OrderRow = {
  id: string;
  number: number;
  cityId: string;
  venueId: string;
  customerId: string;
  total: number;
  status: OrderStatus;
  deliveryMode?: string | null;
  deliverAt?: string | null;
  deliveryAddress?: any | null;
  createdAt: string;
  items: any[];
};

export default function OrdersTable({ cityId }: { cityId: string }) {
  const { getByCity, updateStatus, createDemoOrder, clearByCity } = useOrders();
  const { getByCity: getCustomers } = useCustomers();
  const { getByCity: getVenues } = useVenues();
  const { cities } = useCityScope();

  const orders = useMemo(() => ((getByCity(cityId) as unknown as OrderRow[]) ?? []), [getByCity, cityId]);
  const customers = getCustomers(cityId);
  const venues = getVenues(cityId);

  const city = useMemo(() => cities.find((c) => c.id === cityId) ?? null, [cities, cityId]);

  const custMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);

  const [q, setQ] = useState("");
  const qn = q.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!qn) return orders;
    return orders.filter((o) => {
      const c = custMap.get(o.customerId);
      const v = venueMap.get(o.venueId);
      const hay = [String(o.number), c?.name ?? "", c?.phone ?? "", v?.name ?? "", o.status].join(" ").toLowerCase();
      return hay.includes(qn);
    });
  }, [orders, qn, custMap, venueMap]);

  const sorted = useMemo(() => {
    const list = visible.slice();
    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return tb - ta;
    });
    return list;
  }, [visible]);

  const [details, setDetails] = useState<OrderRow | null>(null);

  function addDemo() {
    const firstVenue = venues[0];
    const firstCustomer = customers[0];
    if (!firstVenue || !firstCustomer) return;
    createDemoOrder({ cityId, venueId: firstVenue.id, customerId: firstCustomer.id });
  }

  const blockStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    background: "var(--panel)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "var(--shadow)",
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: №, клієнт, телефон, заклад..." style={{ maxWidth: 420 }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <SecondaryButton
            type="button"
            onClick={async () => {
              if (!confirm("Очистити всі замовлення цього міста?")) return;
              await clearByCity(cityId);
            }}
            style={{ borderColor: "rgba(239,68,68,0.35)" }}
          >
            Очистити замовлення
          </SecondaryButton>
          <Button type="button" onClick={addDemo} disabled={!venues.length || !customers.length}>
            Додати демо-замовлення
          </Button>
        </div>
      </div>

      <div style={blockStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: "-0.02em" }}>Замовлення</div>
          <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>
            {sorted.length ? `Всього: ${sorted.length}` : ""}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {sorted.length ? (
            sorted.map((o) => {
              const v = venueMap.get(o.venueId);
              return (
                <div
                  key={o.id}
                  style={{
                    border: "1px solid rgba(31,41,55,0.10)",
                    borderRadius: 14,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    background: "var(--panel-2)",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 950 }}>
                      № {o.number} • {v?.name ?? "—"}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge variant={statusVariant(o.status)}>{statusLabel(o.status)}</Badge>
                      <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>{fmt(o.createdAt)}</div>
                    </div>
                  </div>

                  <div style={{ marginLeft: "auto" }}>
                    <Button type="button" onClick={() => setDetails(o)}>
                      Детальніше
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="ui-subtitle">Поки немає замовлень.</div>
          )}
        </div>
      </div>

      {details ? (
        <div
          className="ui-modalBackdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetails(null);
          }}
        >
          <div className="ui-modal" style={{ width: "min(980px, 96vw)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 950, fontSize: 16 }}>Замовлення №{details.number}</div>
                <div className="ui-subtitle">{venueMap.get(details.venueId)?.name ?? "—"}</div>
                <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>
                  Місто: {city?.name ?? cityId}
                  {city?.nameRu && city.nameRu !== city.name ? ` • RU: ${city.nameRu}` : ""}
                </div>
              </div>
              <SecondaryButton type="button" onClick={() => setDetails(null)}>
                Закрити
              </SecondaryButton>
            </div>

            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Клієнт</div>
                  <div style={{ fontWeight: 950 }}>{custMap.get(details.customerId)?.name ?? "—"}</div>
                  <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>
                    {custMap.get(details.customerId)?.phone ?? ""}
                  </div>
                </div>

                <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Статус</div>
                  <Select
                    value={details.status}
                    onChange={(e) => {
                      const next = e.target.value as OrderStatus;
                      updateStatus(details.id, next);
                      setDetails((prev) => (prev ? { ...prev, status: next } : prev));
                    }}
                    style={{ maxWidth: 220 }}
                  >
                    <option value="preorder">Предзамовлення</option>
                    <option value="new">Нове</option>
                    <option value="in_progress">В процесі</option>
                    <option value="delivered">Доставлено</option>
                    <option value="cancelled">Скасовано</option>
                  </Select>
                </div>

                <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Доставка</div>
                  <div style={{ fontWeight: 950 }}>{fmtDeliverAt(details.deliveryMode, details.deliverAt)}</div>
                </div>

                <div className="ui-card ui-card--soft" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Адреса</div>
                  <div style={{ fontWeight: 850, maxWidth: 420 }}>{fmtAddress(details.deliveryAddress) || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900 }}>Сума</div>
                <div style={{ fontWeight: 950, fontSize: 22 }}>{money(computeOrderTotalFromItems(details.items))} ₴</div>
              </div>

              <div>
                <div style={{ fontWeight: 950, marginBottom: 10 }}>Товари</div>
                <div style={{ display: "grid", gap: 10 }}>
                  {Array.isArray(details.items) && details.items.length ? (
                    details.items.map((it: any, idx: number) => {
                      const { unitPrice, lineTotal } = computeItemPricing(it);
                      return (
                        <div
                          key={idx}
                          style={{
                            border: "1px solid rgba(31,41,55,0.10)",
                            borderRadius: 14,
                            padding: 12,
                            background: "var(--panel)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 950, fontSize: 15 }}>{it?.name ?? "—"}</div>
                            <div style={{ fontWeight: 950, color: "var(--accent)" }}>{money(unitPrice)} ₴</div>
                          </div>
                          <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12, marginTop: 4 }}>
                            Кількість: {Number(it?.qty ?? 1) || 1} • Разом: {money(lineTotal)} ₴
                          </div>

                          {Array.isArray(it?.selections) && it.selections.length ? (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ fontWeight: 900, marginBottom: 8 }}>Варіації та інгредієнти</div>
                              <div style={{ display: "grid", gap: 6 }}>
                                {it.selections.map((sel: any, sIdx: number) => (
                                  <div key={sIdx} style={{ marginLeft: 10, fontSize: 13 }}>
                                    <div style={{ fontWeight: 900 }}>
                                      група: {String(sel?.groupTitle ?? "").replace("VAR:: ", "")}
                                    </div>
                                    <div>
                                      Назва:{" "}
                                      {Array.isArray(sel?.optionTitles) ? sel.optionTitles.join(", ") : "—"}
                                    </div>
                                    <div>Дельта (на 1 шт.): {money(Number(sel?.priceDeltaSum ?? 0) || 0)} ₴</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="ui-subtitle">Немає товарів.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
