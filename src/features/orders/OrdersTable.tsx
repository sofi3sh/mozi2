"use client";

import React, { useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button, Input, Select, SecondaryButton } from "@/components/ui/Input";
import { useOrders, type OrderStatus } from "@/store/orders";
import { useCustomers } from "@/store/customers";
import { useVenues } from "@/store/venues";

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
};

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: "-0.02em" }}>{title}</div>
        <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>{count ? `Всього: ${count}` : ""}</div>
      </div>
      {children}
    </div>
  );
}

export default function OrdersTable({ cityId }: { cityId: string }) {
  const { getByCity, updateStatus, createDemoOrder, clearByCity } = useOrders();
  const { getByCity: getCustomers } = useCustomers();
  const { getByCity: getVenues } = useVenues();

  const orders = useMemo(() => ((getByCity(cityId) as unknown as OrderRow[]) ?? []), [getByCity, cityId]);
  const customers = getCustomers(cityId);
  const venues = getVenues(cityId);

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

  const byStatus = useMemo(() => {
    const s: Record<OrderStatus, OrderRow[]> = {
      preorder: [],
      new: [],
      in_progress: [],
      delivered: [],
      cancelled: [],
    };
    for (const o of visible) {
      const st = (o.status as any) as OrderStatus;
      if (st === ("canceled" as any)) s.cancelled.push({ ...o, status: "cancelled" });
      else if (st in s) s[st].push(o);
      else s.new.push({ ...o, status: "new" });
    }
    return s;
  }, [visible]);

  const columns = useMemo<Column<OrderRow>[]>(() => {
    return [
      {
        key: "number",
        header: "№",
        width: 90,
        sortable: true,
        sortValue: (r) => r.number,
        cell: (r) => <div style={{ fontWeight: 950 }}>{r.number}</div>,
      },
      {
        key: "customer",
        header: "Клієнт",
        sortable: true,
        sortValue: (r) => custMap.get(r.customerId)?.name ?? "",
        cell: (r) => {
          const c = custMap.get(r.customerId);
          return (
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 900 }}>{c?.name ?? "—"}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 800 }}>{c?.phone ?? ""}</div>
            </div>
          );
        },
      },
      {
        key: "venue",
        header: "Заклад",
        sortable: true,
        sortValue: (r) => venueMap.get(r.venueId)?.name ?? "",
        cell: (r) => <div style={{ fontWeight: 900 }}>{venueMap.get(r.venueId)?.name ?? "—"}</div>,
      },
      {
        key: "deliverAt",
        header: "Доставка на",
        width: 220,
        sortable: true,
        sortValue: (r) => r.deliverAt ? new Date(r.deliverAt) : new Date(0),
        cell: (r) => (
          <div style={{ fontWeight: 900 }}>
            {fmtDeliverAt(r.deliveryMode, r.deliverAt)}
          </div>
        ),
      },
      {
        key: "address",
        header: "Адреса",
        sortable: true,
        sortValue: (r) => fmtAddress(r.deliveryAddress),
        cell: (r) => (
          <div style={{ fontWeight: 850, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fmtAddress(r.deliveryAddress) || "—"}
          </div>
        ),
      },

      {
        key: "total",
        header: "Сума",
        align: "right",
        width: 130,
        sortable: true,
        sortValue: (r) => r.total,
        cell: (r) => <div style={{ fontWeight: 950 }}>{money(r.total)} ₴</div>,
      },
      {
        key: "status",
        header: "Статус",
        width: 240,
        sortable: true,
        sortValue: (r) => r.status,
        cell: (r) => (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge variant={statusVariant(r.status)}>{statusLabel(r.status)}</Badge>
            <Select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value as OrderStatus)} style={{ maxWidth: 160 }}>
              <option value="preorder">Предзамовлення</option>
              <option value="new">Нове</option>
              <option value="in_progress">В процесі</option>
              <option value="delivered">Доставлено</option>
              <option value="cancelled">Скасовано</option>
            </Select>
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Дата",
        width: 170,
        sortable: true,
        sortValue: (r) => new Date(r.createdAt),
        cell: (r) => <div style={{ fontWeight: 900 }}>{fmt(r.createdAt)}</div>,
      },
    ];
  }, [custMap, venueMap, updateStatus]);

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

      <div style={{ display: "grid", gap: 18 }}>
        <div style={blockStyle}>
          <Section title="Предзамовлення" count={byStatus.preorder.length}>
            <DataTable
              rows={byStatus.preorder}
              columns={columns}
              getRowId={(r) => r.id}
              initialSortKey="createdAt"
              initialSortDir="desc"
              empty={<div className="ui-subtitle">Поки немає предзамовлень.</div>}
            />
          </Section>
        </div>

        <div style={blockStyle}>
          <Section title="Нові замовлення" count={byStatus.new.length}>
            <DataTable
              rows={byStatus.new}
              columns={columns}
              getRowId={(r) => r.id}
              initialSortKey="createdAt"
              initialSortDir="desc"
              empty={<div className="ui-subtitle">Поки немає нових замовлень.</div>}
            />
          </Section>
        </div>

        <div style={blockStyle}>
          <Section title="В процесі" count={byStatus.in_progress.length}>
            <DataTable
              rows={byStatus.in_progress}
              columns={columns}
              getRowId={(r) => r.id}
              initialSortKey="createdAt"
              initialSortDir="desc"
              empty={<div className="ui-subtitle">Поки немає замовлень в процесі.</div>}
            />
          </Section>
        </div>

        <div style={blockStyle}>
          <Section title="Доставлено" count={byStatus.delivered.length}>
            <DataTable
              rows={byStatus.delivered}
              columns={columns}
              getRowId={(r) => r.id}
              initialSortKey="createdAt"
              initialSortDir="desc"
              empty={<div className="ui-subtitle">Поки немає доставлених замовлень.</div>}
            />
          </Section>
        </div>

        <div style={blockStyle}>
          <Section title="Скасовані" count={byStatus.cancelled.length}>
            <DataTable
              rows={byStatus.cancelled}
              columns={columns}
              getRowId={(r) => r.id}
              initialSortKey="createdAt"
              initialSortDir="desc"
              empty={<div className="ui-subtitle">Поки немає скасованих замовлень.</div>}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
