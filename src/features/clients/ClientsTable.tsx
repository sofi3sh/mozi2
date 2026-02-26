"use client";

import React, { useMemo, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { Button, Input } from "@/components/ui/Input";
import { useCustomers } from "@/store/customers";
import { useOrders } from "@/store/orders";

function money(n: number) {
  return new Intl.NumberFormat("uk-UA").format(n);
}

function fmtDate(dt?: string) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("uk-UA", { year: "2-digit", month: "2-digit", day: "2-digit" });
}

type Row = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
};

export default function ClientsTable({ cityId }: { cityId: string }) {
  const { getByCity } = useCustomers();
  const { getByCity: getOrders } = useOrders();

  const customers = getByCity(cityId);
  const orders = getOrders(cityId);

  const [q, setQ] = useState("");

  const rows: Row[] = useMemo(() => {
    const map = new Map<string, Row>();

    customers.forEach((c) => {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        ordersCount: 0,
        totalSpent: 0,
        lastOrderAt: undefined,
      });
    });

    orders.forEach((o) => {
      const r = map.get(o.customerId) ?? {
        id: o.customerId,
        name: "Невідомий клієнт",
        phone: "",
        ordersCount: 0,
        totalSpent: 0,
        lastOrderAt: undefined,
      };
      r.ordersCount += 1;
      r.totalSpent += o.total;
      if (!r.lastOrderAt || r.lastOrderAt < o.createdAt) r.lastOrderAt = o.createdAt;
      map.set(o.customerId, r);
    });

    return Array.from(map.values());
  }, [customers, orders]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => `${r.name} ${r.phone} ${r.email ?? ""}`.toLowerCase().includes(s));
  }, [rows, q]);

  const totals = useMemo(() => {
    const totalSpent = rows.reduce((acc, r) => acc + r.totalSpent, 0);
    const withOrders = rows.filter((r) => r.ordersCount > 0).length;
    return { total: rows.length, withOrders, totalSpent };
  }, [rows]);

  return (
    <div className="ui-grid">
      <div className="ui-tableMeta">
        <div className="ui-pill">Клієнтів: <b>{totals.total}</b></div>
        <div className="ui-pill">З замовленнями: <b>{totals.withOrders}</b></div>
        <div className="ui-pill">На суму: <b>{money(totals.totalSpent)} ₴</b></div>

        <div style={{ flex: 1 }} />

        <div style={{ minWidth: 320 }}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: ім'я, телефон, email..." />
        </div>

        <Button type="button" disabled style={{ opacity: 0.6 }}>
          + Додати (скоро)
        </Button>
      </div>

      <DataTable
        rows={filtered}
        getRowId={(r) => r.id}
        initialSortKey="totalSpent"
        initialSortDir="desc"
        columns={[
          {
            key: "name",
            header: "Клієнт",
            sortable: true,
            sortValue: (r) => r.name,
            cell: (r) => (
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 950 }}>{r.name}</div>
                <div className="ui-subtitle">{r.email ? r.email : r.phone}</div>
              </div>
            ),
          },
          {
            key: "phone",
            header: "Телефон",
            width: 170,
            sortable: true,
            sortValue: (r) => r.phone,
            cell: (r) => <span style={{ fontWeight: 900 }}>{r.phone || "—"}</span>,
          },
          {
            key: "ordersCount",
            header: "Замовлень",
            width: 130,
            align: "right",
            sortable: true,
            sortValue: (r) => r.ordersCount,
            cell: (r) => <span style={{ fontWeight: 950 }}>{r.ordersCount}</span>,
          },
          {
            key: "totalSpent",
            header: "На суму",
            width: 160,
            align: "right",
            sortable: true,
            sortValue: (r) => r.totalSpent,
            cell: (r) => <span style={{ fontWeight: 950 }}>{money(r.totalSpent)} ₴</span>,
          },
          {
            key: "lastOrderAt",
            header: "Останнє",
            width: 130,
            sortable: true,
            sortValue: (r) => (r.lastOrderAt ? new Date(r.lastOrderAt) : new Date(0)),
            cell: (r) => <span className="ui-subtitle" style={{ fontWeight: 900 }}>{fmtDate(r.lastOrderAt)}</span>,
          },
        ]}
        empty={<div className="ui-subtitle">Нічого не знайдено.</div>}
      />
    </div>
  );
}
