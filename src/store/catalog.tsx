"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/apiClient";

export type CatalogItem = { id: string; name: string; nameRu?: string };
type Kind = "venueType" | "cuisineType";

type Ctx = {
  venueTypes: CatalogItem[];
  cuisineTypes: CatalogItem[];
  addVenueType: (input: { name: string; nameRu?: string }) => CatalogItem | null;
  addCuisineType: (input: { name: string; nameRu?: string }) => CatalogItem | null;
  updateItem: (id: string, patch: { name?: string; nameRu?: string }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
};

const CatalogContext = createContext<Ctx | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normName(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [venueTypes, setVenueTypes] = useState<CatalogItem[]>([]);
  const [cuisineTypes, setCuisineTypes] = useState<CatalogItem[]>([]);

  async function refresh() {
    try {
      const data = await api<{ venueTypes: CatalogItem[]; cuisineTypes: CatalogItem[] }>("/api/catalog");
      setVenueTypes(Array.isArray(data.venueTypes) ? data.venueTypes : []);
      setCuisineTypes(Array.isArray(data.cuisineTypes) ? data.cuisineTypes : []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function add(kind: Kind, input: { name: string; nameRu?: string }): CatalogItem | null {
    const nm = normName(input.name);
    if (nm.length < 2) return null;

    const list = kind === "venueType" ? venueTypes : cuisineTypes;
    const exists = list.find((x) => x.name.toLowerCase() === nm.toLowerCase());
    if (exists) return exists;

    const created: CatalogItem = { id: uid(kind === "venueType" ? "vt" : "ct"), name: nm, nameRu: normName(input.nameRu ?? "") };

    if (kind === "venueType") setVenueTypes((prev) => [created, ...prev]);
    if (kind === "cuisineType") setCuisineTypes((prev) => [created, ...prev]);

    // persist (server can accept our id)
    api("/api/catalog", { method: "POST", body: JSON.stringify({ id: created.id, kind, name: created.name, nameRu: created.nameRu ?? "" }) })
      .then(() => refresh())
      .catch(() => {});

    return created;
  }

const value: Ctx = {
  venueTypes,
  cuisineTypes,
  addVenueType: (input) => add("venueType", input),
  addCuisineType: (input) => add("cuisineType", input),
  updateItem: async (id, patch) => {
    await api(`/api/catalog/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await refresh();
  },
  removeItem: async (id) => {
    try {
      await api(`/api/catalog/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        if (typeof window !== "undefined") {
          window.alert(e.message || "Неможливо видалити: тип використовується у закладах");
        }
        return;
      }
      throw e;
    }
  },
};

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
