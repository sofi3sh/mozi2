"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

export type CatalogItem = { id: string; name: string };
type Kind = "venueType" | "cuisineType";

type Ctx = {
  venueTypes: CatalogItem[];
  cuisineTypes: CatalogItem[];
  addVenueType: (name: string) => CatalogItem | null;
  addCuisineType: (name: string) => CatalogItem | null;
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

  function add(kind: Kind, name: string): CatalogItem | null {
    const nm = normName(name);
    if (nm.length < 2) return null;

    const list = kind === "venueType" ? venueTypes : cuisineTypes;
    const exists = list.find((x) => x.name.toLowerCase() === nm.toLowerCase());
    if (exists) return exists;

    const created: CatalogItem = { id: uid(kind === "venueType" ? "vt" : "ct"), name: nm };

    if (kind === "venueType") setVenueTypes((prev) => [created, ...prev]);
    if (kind === "cuisineType") setCuisineTypes((prev) => [created, ...prev]);

    // persist (server can accept our id)
    api("/api/catalog", { method: "POST", body: JSON.stringify({ id: created.id, kind, name: created.name }) })
      .then(() => refresh())
      .catch(() => {});

    return created;
  }

const value: Ctx = {
  venueTypes,
  cuisineTypes,
  addVenueType: (name) => add("venueType", name),
  addCuisineType: (name) => add("cuisineType", name),
};

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
