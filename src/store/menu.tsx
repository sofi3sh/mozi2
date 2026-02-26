"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";
import { stripLangPrefix } from "@/lib/lang";
import { usePathname, useSearchParams } from "next/navigation";
import { useCityScope } from "@/store/cityScope";
import { useVenues } from "@/store/venues";

export type MenuCategory = {
  id: string;
  cityId: string;
  venueId: string;
  name: string;
  sort: number;
  photoUrl?: string | null;
};

export type Dish = {
  id: string;
  cityId: string;
  venueId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  photoUrl?: string;
  isStopped?: boolean;
  modifierGroupIds: string[];
};

export type ModifierOption = {
  id: string;
  name: string;
  // For ingredients: extra price for this ingredient.
  // For variations: FULL price of the variation (not a delta).
  priceDelta: number;
  grams?: number;
  maxQty?: number;
  isStopped?: boolean;
};

export type ModifierGroup = {
  id: string;
  cityId: string;
  venueId: string;
  title: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
};

export type AddCategoryInput = Omit<MenuCategory, "id"> & { id?: string };
export type AddDishInput = Omit<Dish, "id"> & { id?: string };
export type AddGroupInput = Omit<ModifierGroup, "id" | "options"> & {
  id?: string;
  options?: Array<Partial<ModifierOption> & Pick<ModifierOption, "name">>;
};

export type AddOptionInput = Partial<ModifierOption> & Pick<ModifierOption, "name">;

type Ctx = {
  categories: MenuCategory[];
  dishes: Dish[];
  modifierGroups: ModifierGroup[];

  loading: boolean;
  error?: string;

  refresh: () => Promise<void>;

  getCategories: (cityId: string, venueId: string) => MenuCategory[];
  addCategory: (input: AddCategoryInput) => Promise<MenuCategory | null>;
  updateCategory: (id: string, patch: Partial<Pick<MenuCategory, "name" | "sort" | "photoUrl">>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;

  getDishes: (cityId: string, venueId: string) => Dish[];
  addDish: (input: AddDishInput) => Promise<Dish | null>;
  updateDish: (id: string, patch: Partial<Omit<Dish, "id" | "cityId" | "venueId">>) => Promise<void>;
  removeDish: (id: string) => Promise<void>;
  setDishStopped: (id: string, isStopped: boolean) => Promise<void>;

  getGroups: (cityId: string, venueId: string) => ModifierGroup[];
  addGroup: (input: AddGroupInput) => Promise<ModifierGroup | null>;
  updateGroup: (id: string, patch: Partial<Omit<ModifierGroup, "id" | "cityId" | "venueId">>) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;

  addOption: (groupId: string, option: AddOptionInput) => Promise<void>;
  removeOption: (groupId: string, optionId: string) => Promise<void>;
  setOptionStopped: (groupId: string, optionId: string, isStopped: boolean) => Promise<void>;
};

const MenuContext = createContext<Ctx | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeCategory(c: any): MenuCategory {
  return {
    id: String(c?.id ?? uid("cat")),
    cityId: String(c?.cityId ?? ""),
    venueId: String(c?.venueId ?? ""),
    name: String(c?.name ?? ""),
    sort: toNum(c?.sort, 10),
    photoUrl: c?.photoUrl ?? null,
  };
}

function normalizeDish(d: any): Dish {
  const mg = Array.isArray(d?.modifierGroupIds) ? d.modifierGroupIds.map(String) : [];
  return {
    id: String(d?.id ?? uid("dish")),
    cityId: String(d?.cityId ?? ""),
    venueId: String(d?.venueId ?? ""),
    categoryId: String(d?.categoryId ?? ""),
    name: String(d?.name ?? ""),
    description: String(d?.description ?? ""),
    price: Math.max(0, Math.round(toNum(d?.price, 0))),
    photoUrl: d?.photoUrl ? String(d.photoUrl) : "",
    isStopped: Boolean(d?.isStopped ?? false),
    modifierGroupIds: mg,
  };
}

function normalizeOption(o: any): ModifierOption {
  const gramsRaw = o?.grams;
  const maxQtyRaw = o?.maxQty;
  return {
    id: String(o?.id ?? uid("opt")),
    name: String(o?.name ?? ""),
    priceDelta: Math.round(toNum(o?.priceDelta, 0)),
    grams: gramsRaw == null ? undefined : Math.max(0, Math.round(toNum(gramsRaw, 0))),
    maxQty: maxQtyRaw == null ? undefined : Math.max(0, Math.round(toNum(maxQtyRaw, 0))),
    isStopped: Boolean(o?.isStopped ?? false),
  };
}

function normalizeGroup(g: any): ModifierGroup {
  return {
    id: String(g?.id ?? uid("grp")),
    cityId: String(g?.cityId ?? ""),
    venueId: String(g?.venueId ?? ""),
    title: String(g?.title ?? ""),
    required: Boolean(g?.required ?? false),
    minSelect: Math.max(0, Math.round(toNum(g?.minSelect, 0))),
    maxSelect: Math.max(0, Math.round(toNum(g?.maxSelect, 1))),
    options: Array.isArray(g?.options) ? g.options.map(normalizeOption) : [],
  };
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  
const pathnameRaw = usePathname() || "";
  const pathname = stripLangPrefix(pathnameRaw || "/").pathname;
const sp = useSearchParams();
const qsCity = sp.get("city") ?? "";

const { hostCityId, currentCityId, lastCityId } = useCityScope();
const { venues, getByCity } = useVenues();

const scopeRef = useRef<{ cityId: string; venueId?: string }>({ cityId: "", venueId: "" });
const lastFetchKey = useRef<string>("");

const refreshImpl = useCallback(
  async (override?: { cityId?: string; venueId?: string }) => {
    const cityId = (override?.cityId ?? scopeRef.current.cityId ?? "").toString().trim();
    const venueId = (override?.venueId ?? scopeRef.current.venueId ?? "").toString().trim();

    if (!cityId && !venueId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const qp = new URLSearchParams();
      if (cityId) qp.set("cityId", cityId);
      if (venueId) qp.set("venueId", venueId);
      const url = `/api/menu/bootstrap?${qp.toString()}`;

      const data = await api<{ categories: any[]; dishes: any[]; modifierGroups: any[] }>(url);
      setCategories((data.categories ?? []).map(normalizeCategory));
      setDishes((data.dishes ?? []).map(normalizeDish));
      setModifierGroups((data.modifierGroups ?? []).map(normalizeGroup));
    } catch (e: any) {
      setError(e?.message ?? "Не вдалося завантажити меню");
    } finally {
      setLoading(false);
    }
  },
  []
);

// Public refresh (no args) — reload the current scope.
const refresh = useCallback(() => refreshImpl(), [refreshImpl]);

useEffect(() => {
  const needsMenu =
    pathname.startsWith("/venues") ||
    pathname.startsWith("/city/") ||
    (pathname.includes("/admin/c/") && pathname.includes("/menu"));

  if (!needsMenu) {
    setLoading(false);
    return;
  }

  const adminCityMatch = pathname.match(/^\/admin\/c\/([^\/]+)/);
  const adminCityId = adminCityMatch ? decodeURIComponent(adminCityMatch[1]) : "";

  const cityPathMatch = pathname.match(/^\/city\/([^\/]+)/);
  const cityFromPath = cityPathMatch ? decodeURIComponent(cityPathMatch[1]) : "";

  const cityId = adminCityId || cityFromPath || hostCityId || qsCity || currentCityId || lastCityId || "";

  let venueId = "";
  const adminVenueMatch = pathname.match(/^\/admin\/c\/[^\/]+\/venues\/([^\/]+)/);
  if (adminVenueMatch) {
    venueId = decodeURIComponent(adminVenueMatch[1]);
  } else {
    const venueSlugMatch = pathname.match(/^\/city\/[^\/]+\/([^\/]+)/);
    const venueSlug = venueSlugMatch ? decodeURIComponent(venueSlugMatch[1]) : "";
    if (venueSlug && cityId) {
      const v = (getByCity(cityId) || []).find((x) => x.slug === venueSlug);
      if (v) venueId = v.id;
    }
  }

  // On /city/* and admin venue-menu pages, prefer venue-scoped bootstrap for smaller payload.
  const preferVenue = Boolean(venueId) && (pathname.startsWith("/city/") || pathname.includes("/admin/c/"));

  const nextScope = { cityId, venueId: preferVenue ? venueId : "" };
  scopeRef.current = nextScope;

  const key = preferVenue ? `venue:${venueId}` : `city:${cityId}`;
  if (!cityId && !venueId) {
    setLoading(false);
    return;
  }
  if (lastFetchKey.current === key) return;
  lastFetchKey.current = key;

  refreshImpl(nextScope);
}, [pathname, qsCity, hostCityId, currentCityId, lastCityId, venues, getByCity, refreshImpl]);

  async function updateCategoryImpl(
    id: string,
    patch: Partial<Pick<MenuCategory, "name" | "sort" | "photoUrl">>
  ) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      const res = await api<{ category: any }>(`/api/menu/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const saved = normalizeCategory(res.category);
      setCategories((prev) => prev.map((c) => (c.id === id ? saved : c)));
    } catch {
      refresh();
    }
  }

  async function updateDishImpl(id: string, patch: Partial<Omit<Dish, "id" | "cityId" | "venueId">>) {
    setDishes((prev) => prev.map((d) => (d.id === id ? normalizeDish({ ...d, ...patch }) : d)));
    try {
      const res = await api<{ dish: any }>(`/api/menu/dishes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const saved = normalizeDish(res.dish);
      setDishes((prev) => prev.map((d) => (d.id === id ? saved : d)));
    } catch {
      refresh();
    }
  }

  async function updateGroupImpl(
    id: string,
    patch: Partial<Omit<ModifierGroup, "id" | "cityId" | "venueId">>
  ) {
    setModifierGroups((prev) => prev.map((g) => (g.id === id ? normalizeGroup({ ...g, ...patch }) : g)));
    try {
      const res = await api<{ group: any }>(`/api/menu/modifiers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const saved = normalizeGroup(res.group);
      setModifierGroups((prev) => prev.map((g) => (g.id === id ? saved : g)));
    } catch {
      refresh();
    }
  }

  const value: Ctx = {
    categories,
    dishes,
    modifierGroups,
    loading,
    error,
    refresh,

    getCategories: (cityId, venueId) =>
      categories
        .filter((c) => c.cityId === cityId && c.venueId === venueId)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name, "uk")),

    addCategory: async (input) => {
      const name = (input?.name ?? "").toString().trim();
      const cityId = String(input?.cityId ?? "");
      const venueId = String(input?.venueId ?? "");
      if (!cityId || !venueId) return null;
      if (name.length < 2) return null;

      const created: MenuCategory = {
        id: String(input?.id ?? uid("cat")),
        cityId,
        venueId,
        name,
        sort: Math.round(toNum(input?.sort, 10)),
        photoUrl: input?.photoUrl ?? null,
      };

      setCategories((prev) => [created, ...prev]);

      try {
        const res = await api<{ category: any }>("/api/menu/categories", {
          method: "POST",
          body: JSON.stringify(created),
        });
        const saved = normalizeCategory(res.category);
        setCategories((prev) => prev.map((c) => (c.id === created.id ? saved : c)));
        return saved;
      } catch {
        setCategories((prev) => prev.filter((c) => c.id !== created.id));
        return null;
      }
    },

    updateCategory: updateCategoryImpl,

    removeCategory: async (id) => {
      const snapshotCats = categories;
      const snapshotDishes = dishes;

      setCategories((prev) => prev.filter((c) => c.id !== id));
      setDishes((prev) => prev.filter((d) => d.categoryId !== id));

      try {
        await api(`/api/menu/categories/${id}`, { method: "DELETE" });
      } catch {
        setCategories(snapshotCats);
        setDishes(snapshotDishes);
      }
    },

    getDishes: (cityId, venueId) =>
      dishes
        .filter((d) => d.cityId === cityId && d.venueId === venueId)
        .sort((a, b) => a.name.localeCompare(b.name, "uk")),

    addDish: async (input) => {
      const cityId = String(input?.cityId ?? "");
      const venueId = String(input?.venueId ?? "");
      const categoryId = String(input?.categoryId ?? "");
      const name = (input?.name ?? "").toString().trim();
      const description = (input?.description ?? "").toString();
      const price = Math.max(0, Math.round(toNum(input?.price, 0)));
      if (!cityId || !venueId || !categoryId) return null;
      if (name.length < 2) return null;

      const created: Dish = {
        id: String(input?.id ?? uid("dish")),
        cityId,
        venueId,
        categoryId,
        name,
        description,
        price,
        photoUrl: input?.photoUrl ? String(input.photoUrl) : "",
        isStopped: Boolean(input?.isStopped ?? false),
        modifierGroupIds: Array.isArray(input?.modifierGroupIds) ? input.modifierGroupIds.map(String) : [],
      };

      setDishes((prev) => [created, ...prev]);

      try {
        const res = await api<{ dish: any }>("/api/menu/dishes", {
          method: "POST",
          body: JSON.stringify(created),
        });
        const saved = normalizeDish(res.dish);
        setDishes((prev) => prev.map((d) => (d.id === created.id ? saved : d)));
        return saved;
      } catch {
        setDishes((prev) => prev.filter((d) => d.id !== created.id));
        return null;
      }
    },

    updateDish: updateDishImpl,

    removeDish: async (id) => {
      const snapshot = dishes;
      setDishes((prev) => prev.filter((d) => d.id !== id));
      try {
        await api(`/api/menu/dishes/${id}`, { method: "DELETE" });
      } catch {
        setDishes(snapshot);
      }
    },

    setDishStopped: async (id, isStopped) => updateDishImpl(id, { isStopped }),

    getGroups: (cityId, venueId) =>
      modifierGroups
        .filter((g) => g.cityId === cityId && g.venueId === venueId)
        .sort((a, b) => a.title.localeCompare(b.title, "uk")),

    addGroup: async (input) => {
      const cityId = String(input?.cityId ?? "");
      const venueId = String(input?.venueId ?? "");
      const title = (input?.title ?? "").toString().trim();
      if (!cityId || !venueId) return null;
      if (title.length < 2) return null;

      const opts = (input?.options ?? []).map((o) =>
        normalizeOption({
          id: o.id ?? uid("opt"),
          name: (o.name ?? "").toString(),
          priceDelta: toNum((o as any).priceDelta, 0),
          isStopped: Boolean((o as any).isStopped ?? false),
        })
      );

      const created: ModifierGroup = {
        id: String(input?.id ?? uid("grp")),
        cityId,
        venueId,
        title,
        required: Boolean(input?.required ?? false),
        minSelect: Math.max(0, Math.round(toNum(input?.minSelect, 0))),
        maxSelect: Math.max(0, Math.round(toNum(input?.maxSelect, 1))),
        options: opts,
      };

      setModifierGroups((prev) => [created, ...prev]);

      try {
        const res = await api<{ group: any }>("/api/menu/modifiers", {
          method: "POST",
          body: JSON.stringify(created),
        });
        const saved = normalizeGroup(res.group);
        setModifierGroups((prev) => prev.map((g) => (g.id === created.id ? saved : g)));
        return saved;
      } catch {
        setModifierGroups((prev) => prev.filter((g) => g.id !== created.id));
        return null;
      }
    },

    updateGroup: updateGroupImpl,

    removeGroup: async (id) => {
      const snapshotGroups = modifierGroups;
      const snapshotDishes = dishes;

      setModifierGroups((prev) => prev.filter((g) => g.id !== id));
      setDishes((prev) => prev.map((d) => ({ ...d, modifierGroupIds: d.modifierGroupIds.filter((x) => x !== id) })));

      try {
        await api(`/api/menu/modifiers/${id}`, { method: "DELETE" });
      } catch {
        setModifierGroups(snapshotGroups);
        setDishes(snapshotDishes);
      }
    },

    addOption: async (groupId, option) => {
      const name = (option?.name ?? "").toString().trim();
      if (!name) return;

      const group = modifierGroups.find((g) => g.id === groupId);
      if (!group) return;

      const newOpt: ModifierOption = {
        id: String(option?.id ?? uid("opt")),
        name,
        priceDelta: Math.round(toNum(option?.priceDelta, 0)),
        grams: option?.grams == null ? undefined : Math.max(0, Math.round(toNum(option?.grams, 0))),
        maxQty: option?.maxQty == null ? undefined : Math.max(0, Math.round(toNum(option?.maxQty, 0))),
        isStopped: Boolean(option?.isStopped ?? false),
      };

      const nextOptions = [...group.options, newOpt];
      await updateGroupImpl(groupId, { options: nextOptions });
    },

    removeOption: async (groupId, optionId) => {
      const group = modifierGroups.find((g) => g.id === groupId);
      if (!group) return;

      const nextOptions = group.options.filter((o) => o.id !== optionId);
      await updateGroupImpl(groupId, { options: nextOptions });
    },

    setOptionStopped: async (groupId, optionId, isStopped) => {
      const group = modifierGroups.find((g) => g.id === groupId);
      if (!group) return;

      const nextOptions = group.options.map((o) => (o.id === optionId ? { ...o, isStopped } : o));
      await updateGroupImpl(groupId, { options: nextOptions });
    },
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
