"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

export type Customer = {
  id: string;
  cityId: string;
  name: string;
  phone?: string;
  email?: string;
  createdAt: string;
};

type Ctx = {
  customers: Customer[];
  loading: boolean;
  error?: string;

  getByCity: (cityId: string) => Customer[];
  getById: (id: string) => Customer | undefined;

  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Promise<Customer | null>;
  updateCustomer: (id: string, patch: Partial<Omit<Customer, "id" | "cityId" | "createdAt">>) => void;
};

const CustomersContext = createContext<Ctx | null>(null);

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  async function refresh() {
    setLoading(true);
    setError(undefined);
    try {
      const data = await api<{ customers: Customer[] }>("/api/customers");
      setCustomers(data.customers);
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося завантажити клієнтів");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      customers,
      loading,
      error,
      getByCity: (cityId) => customers.filter((c) => c.cityId === cityId),
      getById: (id) => customers.find((c) => c.id === id),
      addCustomer: async (c) => {
        try {
          const res = await api<{ customer: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(c) });
          setCustomers((prev) => [res.customer, ...prev]);
          return res.customer;
        } catch {
          return null;
        }
      },
      updateCustomer: (id, patch) => {
        setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        api(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).catch(() => {});
      },
    }),
    [customers, loading, error]
  );

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>;
}

export function useCustomers() {
  const ctx = useContext(CustomersContext);
  if (!ctx) throw new Error("useCustomers must be used within CustomersProvider");
  return ctx;
}
