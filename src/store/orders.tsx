"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

export type OrderStatus = "preorder" | "new" | "in_progress" | "delivered" | "cancelled";

export type Order = {
  id: string;
  number: number;
  cityId: string;
  venueId: string;
  customerId: string;
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentProvider?: string | null;
  total: number;
  status: string;
  deliveryMode?: string | null;
  deliverAt?: string | null; // ISO
  deliveryAddress?: any | null;
  createdAt: string; // ISO
  items: any[];
};

type Ctx = {
  orders: Order[];
  loading: boolean;
  error?: string;

  getByCity: (cityId: string) => Order[];
  updateStatus: (id: string, status: OrderStatus) => void;
  createDemoOrder: (payload: { cityId: string; venueId: string; customerId: string }) => Promise<Order | null>;
  clearByCity: (cityId: string) => Promise<boolean>;
};

const OrdersContext = createContext<Ctx | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  async function refresh() {
    setLoading(true);
    setError(undefined);
    try {
      const data = await api<{ orders: Order[] }>("/api/orders");
      setOrders(data.orders);
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      orders,
      loading,
      error,
      getByCity: (cityId) => orders.filter((o) => o.cityId === cityId),
      updateStatus: (id, status) => {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        api(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }).catch(() => {});
      },
      createDemoOrder: async ({ cityId, venueId, customerId }) => {
        try {
          const res = await api<{ order: Order }>("/api/orders", { method: "POST", body: JSON.stringify({ cityId, venueId, customerId }) });
          setOrders((prev) => [res.order, ...prev]);
          return res.order;
        } catch {
          return null;
        }
      },
      clearByCity: async (cityId: string) => {
        try {
          // Optimistic UI
          setOrders((prev) => prev.filter((o) => o.cityId !== cityId));
          const res = await fetch(`/api/orders?cityId=${encodeURIComponent(cityId)}`, { method: "DELETE" });
          if (!res.ok) {
            await refresh();
            return false;
          }
          return true;
        } catch {
          await refresh();
          return false;
        }
      },
    }),
    [orders, loading, error]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
