"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

export type WorkDay = {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  isClosed: boolean;
  open: string;
  close: string;
};

export type ScheduleException = {
  /** YYYY-MM-DD */
  date: string;
  isClosed: boolean;
  open: string;
  close: string;
  note?: string;
};

export type WorkSchedule = {
  days: WorkDay[];
  exceptions: ScheduleException[];
};

export const defaultSchedule: WorkDay[] = [
  { day: "mon", isClosed: false, open: "09:00", close: "21:00" },
  { day: "tue", isClosed: false, open: "09:00", close: "21:00" },
  { day: "wed", isClosed: false, open: "09:00", close: "21:00" },
  { day: "thu", isClosed: false, open: "09:00", close: "21:00" },
  { day: "fri", isClosed: false, open: "09:00", close: "22:00" },
  { day: "sat", isClosed: false, open: "10:00", close: "22:00" },
  { day: "sun", isClosed: false, open: "10:00", close: "21:00" },
];

export const defaultWorkSchedule: WorkSchedule = {
  days: defaultSchedule,
  exceptions: [],
};

export type Venue = {
  id: string;
  cityId: string;
  name: string;
  nameRu?: string;
  description: string;
  descriptionRu?: string;
  address: string;
  addressRu?: string;
  deliveryMinutes: number;
  slug: string;
  photoUrl: string;
  venueTypeIds: string[];
  cuisineTypeIds: string[];
  schedule: WorkSchedule;
};

function normalizeSchedule(raw: any): WorkSchedule {
  // Backward compatible: старі записи могли зберігати schedule як масив (тільки тижневий графік)
  if (Array.isArray(raw)) {
    return { days: raw as WorkDay[], exceptions: [] };
  }

  // Новий формат: { days, exceptions }
  if (raw && typeof raw === "object") {
    const days = Array.isArray(raw.days) ? (raw.days as WorkDay[]) : defaultSchedule;
    const exceptions = Array.isArray(raw.exceptions) ? (raw.exceptions as ScheduleException[]) : [];
    return { days, exceptions };
  }

  return defaultWorkSchedule;
}

type Ctx = {
  venues: Venue[];
  loading: boolean;
  error?: string;

  getByCity: (cityId: string) => Venue[];
  getById: (id: string) => Venue | undefined;

  addVenue: (v: Omit<Venue, "id">) => Promise<Venue>;
  updateVenue: (id: string, patch: Partial<Omit<Venue, "id" | "cityId">>) => Promise<void>;
  removeVenue: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const VenuesContext = createContext<Ctx | null>(null);

export function VenuesProvider({ children }: { children: React.ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  async function refresh() {
    setLoading(true);
    setError(undefined);
    try {
      const data = await api<{ venues: any[] }>("/api/venues");
      setVenues(
        (data.venues ?? []).map((v) => ({
          id: String(v.id),
          cityId: String(v.cityId),
          name: String(v.name ?? ""),
          nameRu: String(v.nameRu ?? ""),
          description: String(v.description ?? ""),
          descriptionRu: String(v.descriptionRu ?? ""),
          address: String(v.address ?? ""),
          addressRu: String(v.addressRu ?? ""),
          deliveryMinutes: Number(v.deliveryMinutes ?? 50) || 50,
          slug: String(v.slug ?? ""),
          photoUrl: String(v.photoUrl ?? ""),
          venueTypeIds: Array.isArray(v.venueTypeIds) ? v.venueTypeIds : [],
          cuisineTypeIds: Array.isArray(v.cuisineTypeIds) ? v.cuisineTypeIds : [],
          schedule: normalizeSchedule(v.schedule),
        }))
      );
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося завантажити заклади");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      venues,
      loading,
      error,
      refresh,
      getByCity: (cityId) => venues.filter((v) => v.cityId === cityId),
      getById: (id) => venues.find((v) => v.id === id),
      addVenue: async (v) => {
        const res = await api<{ venue: Venue }>("/api/venues", { method: "POST", body: JSON.stringify(v) });
        setVenues((prev) => [res.venue, ...prev]);
        return res.venue;
      },
      updateVenue: async (id, patch) => {
        const res = await api<{ venue: Venue }>(`/api/venues/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
        setVenues((prev) => prev.map((x) => (x.id === id ? res.venue : x)));
      },
      removeVenue: async (id) => {
        await api(`/api/venues/${id}`, { method: "DELETE" });
        setVenues((prev) => prev.filter((x) => x.id !== id));
      },
    }),
    [venues, loading, error]
  );

  return <VenuesContext.Provider value={value}>{children}</VenuesContext.Provider>;
}

export function useVenues() {
  const ctx = useContext(VenuesContext);
  if (!ctx) throw new Error("useVenues must be used within VenuesProvider");
  return ctx;
}
