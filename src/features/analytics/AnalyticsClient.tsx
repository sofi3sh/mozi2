"use client";

import React, { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, Select, SecondaryButton } from "@/components/ui/Input";
import { useOrders, Order } from "@/store/orders";
import { useCustomers } from "@/store/customers";
import { useVenues } from "@/store/venues";
import DataTable from "@/components/ui/DataTable";

function money(n: number) {
  return new Intl.NumberFormat("uk-UA").format(n);
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const out: string[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(dayKey(d));
  }
  return out;
}

function startDateForDays(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  // BOM for Excel
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function MiniBars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it) => (
        <div key={it.label} style={{ display: "grid", gridTemplateColumns: "140px 1fr 56px", gap: 10, alignItems: "center" }}>
          <div className="ui-subtitle" style={{ fontWeight: 900 }}>{it.label}</div>
          <div style={{ height: 10, borderRadius: 999, background: "rgba(15,23,42,0.08)", overflow: "hidden" }}>
            <div style={{ width: `${(it.value / max) * 100}%`, height: "100%", background: "var(--accent)" }} />
          </div>
          <div className="ui-subtitle" style={{ textAlign: "right", fontWeight: 900 }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

function MiniLine({ points }: { points: { day: string; value: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <Badge variant="ok">Продажі</Badge>
        <div className="ui-subtitle">за період</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 64 }}>
        {points.map((p) => (
          <div key={p.day} title={`${p.day}: ${p.value}`} style={{ width: "100%", minWidth: 6 }}>
            <div
              style={{
                height: `${(p.value / max) * 100}%`,
                borderRadius: 10,
                background: "rgba(47,123,246,0.22)",
                border: "1px solid rgba(47,123,246,0.35)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="ui-subtitle" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{points[0]?.day}</span>
        <span>{points[points.length - 1]?.day}</span>
      </div>
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ display: "flex", gap: 6, padding: 6, borderRadius: 999, border: "1px solid var(--border)", background: "var(--panel)" }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: active ? "1px solid rgba(47,123,246,0.45)" : "1px solid transparent",
              background: active ? "rgba(47,123,246,0.14)" : "transparent",
              color: "var(--text)",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AnalyticsClient({ cityId }: { cityId: string }) {
  const { getByCity } = useOrders();
  const { getByCity: getCustomers } = useCustomers();
  const { getByCity: getVenues } = useVenues();

  const [periodDays, setPeriodDays] = useState<"7" | "30" | "90">("7");
  const [venueId, setVenueId] = useState<string>("");

  const allOrders = getByCity(cityId);
  const customers = getCustomers(cityId);
  const venues = getVenues(cityId);

  const venueMap = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);

  const filteredOrders = useMemo(() => {
    const start = startDateForDays(Number(periodDays));
    return allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      if (d < start) return false;
      if (venueId && o.venueId !== venueId) return false;
      return true;
    });
  }, [allOrders, periodDays, venueId]);

  const kpis = useMemo(() => {
    const active = filteredOrders.filter((o) => o.status === "new" || o.status === "in_progress").length;
    const sum = filteredOrders.reduce((acc, o) => acc + o.total, 0);
    const delivered = filteredOrders.filter((o) => o.status === "delivered").length;
    const cancelled = filteredOrders.filter((o) => o.status === "cancelled").length;
    return { active, sum, delivered, cancelled, total: filteredOrders.length };
  }, [filteredOrders]);

  const series = useMemo(() => {
    const days = lastNDays(Number(periodDays));
    const byDay = new Map<string, number>();
    days.forEach((d) => byDay.set(d, 0));
    filteredOrders.forEach((o) => {
      const k = o.createdAt.slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + o.total);
    });
    return days.map((d) => ({ day: d.slice(5), value: byDay.get(d) ?? 0 }));
  }, [filteredOrders, periodDays]);

  const statuses = useMemo(() => {
    const m: Record<string, number> = { new: 0, in_progress: 0, delivered: 0, cancelled: 0 };
    filteredOrders.forEach((o) => (m[o.status] = (m[o.status] ?? 0) + 1));
    return [
      { label: "Нове", value: m.new },
      { label: "В процесі", value: m.in_progress },
      { label: "Доставлено", value: m.delivered },
      { label: "Скасовано", value: m.cancelled },
    ];
  }, [filteredOrders]);

  const topVenues = useMemo(() => {
    const map = new Map<string, { venueId: string; name: string; orders: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      const v = venueMap.get(o.venueId);
      const cur = map.get(o.venueId) ?? { venueId: o.venueId, name: v?.name ?? o.venueId, orders: 0, revenue: 0 };
      cur.orders += 1;
      cur.revenue += o.total;
      map.set(o.venueId, cur);
    });
    return Array.from(map.values());
  }, [filteredOrders, venueMap]);

  const popularItems = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    filteredOrders.forEach((o) => {
      o.items.forEach((it) => {
        const cur = map.get(it.name) ?? { name: it.name, qty: 0 };
        cur.qty += it.qty;
        map.set(it.name, cur);
      });
    });
    return Array.from(map.values());
  }, [filteredOrders]);

  function exportCsv() {
    const rows = filteredOrders.map((o) => {
      const v = venueMap.get(o.venueId);
      const c = customerMap.get(o.customerId);
      return {
        number: `#${o.number}`,
        createdAt: o.createdAt,
        venue: v?.name ?? o.venueId,
        customer: c?.name ?? "",
        phone: c?.phone ?? "",
        total: o.total,
        status: o.status,
      };
    });
    if (!rows.length) return;
    downloadCsv(`analytics_${cityId}_${periodDays}d${venueId ? "_" + venueId : ""}.csv`, rows);
  }

  return (
    <div className="ui-grid">
      <Card>
        <CardHeader
          title="Параметри"
          subtitle="Оберіть період, (опційно) заклад, та експортуйте CSV."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div className="ui-label">Період</div>
                <Segmented
                  value={periodDays}
                  onChange={(v) => setPeriodDays(v as any)}
                  options={[
                    { value: "7", label: "7 днів" },
                    { value: "30", label: "30 днів" },
                    { value: "90", label: "90 днів" },
                  ]}
                />
              </div>

              <div style={{ display: "grid", gap: 6, minWidth: 260 }}>
                <div className="ui-label">Заклад</div>
                <Select value={venueId} onChange={(e) => setVenueId(e.target.value)}>
                  <option value="">Всі заклади</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </Select>
              </div>

              <Button type="button" onClick={exportCsv} disabled={!filteredOrders.length}>
                Експорт CSV
              </Button>

              <SecondaryButton type="button" onClick={() => { setVenueId(""); setPeriodDays("7"); }}>
                Скинути
              </SecondaryButton>
            </div>
          }
        />
      </Card>

      <div className="ui-kpis">
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Замовлень</div>
          <div className="ui-kpiValue">{kpis.total}</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Активні</div>
          <div className="ui-kpiValue">{kpis.active}</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">На суму</div>
          <div className="ui-kpiValue">{money(kpis.sum)} ₴</div>
        </div>
        <div className="ui-kpi">
          <div className="ui-kpiLabel">Доставлено / Скасовано</div>
          <div className="ui-kpiValue">{kpis.delivered} / {kpis.cancelled}</div>
        </div>
      </div>

      <div className="ui-twoCol">
        <Card>
          <CardHeader title="Продажі" subtitle={`По днях за останні ${periodDays} днів${venueId ? " (обраний заклад)" : ""}.`} />
          <MiniLine points={series} />
        </Card>

        <Card>
          <CardHeader title="Статуси замовлень" subtitle="Розподіл за статусами у вибраному фільтрі." />
          <MiniBars items={statuses} />
        </Card>
      </div>

      {!venueId ? (
        <Card>
          <CardHeader title="Топ закладів" subtitle="Рейтинг за виручкою у вибраному періоді." />
          <DataTable
            rows={topVenues}
            getRowId={(r) => r.venueId}
            initialSortKey="revenue"
            initialSortDir="desc"
            columns={[
              { key: "name", header: "Заклад", sortable: true, sortValue: (r) => r.name, cell: (r) => <span style={{ fontWeight: 950 }}>{r.name}</span> },
              { key: "orders", header: "Замовлень", width: 140, align: "right", sortable: true, sortValue: (r) => r.orders, cell: (r) => <b>{r.orders}</b> },
              { key: "revenue", header: "Виручка", width: 160, align: "right", sortable: true, sortValue: (r) => r.revenue, cell: (r) => <b>{money(r.revenue)} ₴</b> },
            ]}
            empty={<div className="ui-subtitle">Немає даних.</div>}
          />
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Популярні позиції" subtitle="Топ позицій за кількістю у вибраному періоді." />
        <DataTable
          rows={popularItems}
          getRowId={(r) => r.name}
          initialSortKey="qty"
          initialSortDir="desc"
          columns={[
            { key: "name", header: "Позиція", sortable: true, sortValue: (r) => r.name, cell: (r) => <span style={{ fontWeight: 950 }}>{r.name}</span> },
            { key: "qty", header: "К-сть", width: 140, align: "right", sortable: true, sortValue: (r) => r.qty, cell: (r) => <b>{r.qty}</b> },
          ]}
          empty={<div className="ui-subtitle">Немає даних.</div>}
        />
      </Card>
    </div>
  );
}
