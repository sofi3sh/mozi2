"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CartModifierSelection = {
  groupId: string;
  groupTitle: string;
  optionIds: string[];
  optionTitles: string[];
  priceDeltaSum: number;
  };

export type CartCustomer = {
  name: string;
  phone: string;
  email: string;
  };

export type CartAddress = {
  street: string;
  house: string;
  flat: string;
  comment: string;
  };

export type VenueDelivery = {
  mode: "asap" | "time";
  /** ISO string */
  deliverAtISO?: string;
  };

export type CartItem = {
  id: string;
  signature: string;
  cityId: string;
  venueId: string;
  dishId: string;
  name: string;
  photoUrl?: string;
  basePrice: number;
  selections: CartModifierSelection[];
  unitPrice: number;
  qty: number;
  createdAt: number;
  };

export type VenueCart = {
  venueId: string;
  venueName: string;
  items: CartItem[];
  delivery: VenueDelivery;
  };

export type CityCart = {
  cityId: string;
  venues: Record<string, VenueCart>;
  customer: CartCustomer;
  address: CartAddress;
  updatedAt: number;
  };

type AddItemInput = {
  cityId: string;
  venueId: string;
  venueName: string;
  dishId: string;
  name: string;
  photoUrl?: string;
  basePrice: number;
  qty?: number;
  selections?: CartModifierSelection[];
  };

type Ctx = {
  carts: Record<string, CityCart>;
  /** True after initial localStorage load attempt */
  hydrated: boolean;

  getCityCart: (cityId: string) => CityCart;
  venueIds: (cityId: string) => string[];
  itemsByVenue: (cityId: string, venueId: string) => CartItem[];

  addItem: (input: AddItemInput) => void;
  setQty: (cityId: string, venueId: string, itemId: string, qty: number) => void;
  removeItem: (cityId: string, venueId: string, itemId: string) => void;
  clearVenue: (cityId: string, venueId: string) => void;
  clearCity: (cityId: string) => void;

  setCustomer: (cityId: string, patch: Partial<CartCustomer>) => void;
  setAddress: (cityId: string, patch: Partial<CartAddress>) => void;
  setVenueDelivery: (cityId: string, venueId: string, patch: Partial<VenueDelivery>) => void;

  itemCount: (cityId: string) => number;
  venueTotal: (cityId: string, venueId: string) => number;
  cityTotal: (cityId: string) => number;
  };

const CartContext = createContext<Ctx | null>(null);

const LS_KEY = "mozi_cart_v2";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  }

function safeParse(json: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
  }

const defaultCustomer: CartCustomer = { name: "", phone: "", email: "" };
const defaultAddress: CartAddress = { street: "", house: "", flat: "", comment: "" };
const defaultVenueDelivery: VenueDelivery = { mode: "asap" };

function normalizeCustomer(raw: any): CartCustomer {
  return {
    name: String(raw?.name ?? ""),
    phone: String(raw?.phone ?? ""),
    email: String(raw?.email ?? ""),
  };
  }

function normalizeAddress(raw: any): CartAddress {
  return {
    street: String(raw?.street ?? ""),
    house: String(raw?.house ?? ""),
    flat: String(raw?.flat ?? ""),
    comment: String(raw?.comment ?? ""),
  };
  }

function normalizeVenueDelivery(raw: any): VenueDelivery {
  const mode = raw?.mode === "time" ? "time" : "asap";
  const deliverAtISO = raw?.deliverAtISO ? String(raw.deliverAtISO) : undefined;
  return mode === "asap" ? { mode } : { mode, deliverAtISO };
  }

function normalizeSelection(raw: any): CartModifierSelection {
  return {
    groupId: String(raw?.groupId ?? ""),
    groupTitle: String(raw?.groupTitle ?? ""),
    optionIds: Array.isArray(raw?.optionIds) ? raw.optionIds.map(String) : [],
    optionTitles: Array.isArray(raw?.optionTitles) ? raw.optionTitles.map(String) : [],
    priceDeltaSum: Number(raw?.priceDeltaSum ?? 0) || 0,
  };
  }

function normalizeItem(raw: any): CartItem {
  const selections = Array.isArray(raw?.selections) ? raw.selections.map(normalizeSelection) : [];
  const basePrice = Number(raw?.basePrice ?? 0) || 0;
  const unitPrice = Number(raw?.unitPrice ?? basePrice) || basePrice;
  const qty = Math.max(1, Math.round(Number(raw?.qty ?? 1) || 1));
  return {
    id: String(raw?.id ?? uid("ci")),
    signature: String(raw?.signature ?? ""),
    cityId: String(raw?.cityId ?? ""),
    venueId: String(raw?.venueId ?? ""),
    dishId: String(raw?.dishId ?? ""),
    name: String(raw?.name ?? ""),
    photoUrl: raw?.photoUrl ? String(raw.photoUrl) : "",
    basePrice: Math.max(0, Math.round(basePrice)),
    selections,
    unitPrice: Math.max(0, Math.round(unitPrice)),
    qty,
    createdAt: Number(raw?.createdAt ?? Date.now()) || Date.now(),
  };
  }

function normalizeVenueCart(raw: any): VenueCart {
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeItem) : [];
  return {
    venueId: String(raw?.venueId ?? ""),
    venueName: String(raw?.venueName ?? ""),
    items,
    delivery: normalizeVenueDelivery(raw?.delivery ?? defaultVenueDelivery),
  };
  }

function normalizeCityCart(raw: any): CityCart {
  const venuesRaw = raw?.venues && typeof raw.venues === "object" ? raw.venues : {};
  const venues: Record<string, VenueCart> = {};
  for (const [k, v] of Object.entries(venuesRaw)) {
    const vc = normalizeVenueCart(v);
    const key = vc.venueId || String(k);
    venues[key] = { ...vc, venueId: key };
  }
  return {
    cityId: String(raw?.cityId ?? ""),
    venues,
    customer: normalizeCustomer(raw?.customer ?? defaultCustomer),
    address: normalizeAddress(raw?.address ?? defaultAddress),
    updatedAt: Number(raw?.updatedAt ?? Date.now()) || Date.now(),
  };
  }

function computeSignature(dishId: string, selections: CartModifierSelection[]) {
  const norm = (selections || [])
    .map((s) => ({
      groupId: String(s.groupId),
      optionIds: [...(s.optionIds || [])].map(String).sort(),
    }))
    .sort((a, b) => a.groupId.localeCompare(b.groupId));
  return `${dishId}::${JSON.stringify(norm)}`;
  }

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [carts, setCarts] = useState<Record<string, CityCart>>({});
  const [hydrated, setHydrated] = useState(false);

  function persist(next: Record<string, CityCart>) {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  // load
  useEffect(() => {
    try {
      const raw = safeParse(typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null);
      if (!raw || typeof raw !== "object") return;
      const next: Record<string, CityCart> = {};
      for (const [cityId, cc] of Object.entries(raw)) {
        next[String(cityId)] = normalizeCityCart(cc);
      }
      // Do not clobber in-memory cart if user already interacted before hydration finished.
      setCarts((prev) => (Object.keys(prev).length ? prev : next));
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  // persist (best-effort) on any change
  useEffect(() => {
    persist(carts);
  }, [carts]);

  function ensureCityCart(cityId: string): CityCart {
    const id = String(cityId || "");
    const existing = carts[id];
    if (existing) return existing;
    return { cityId: id, venues: {}, customer: { ...defaultCustomer }, address: { ...defaultAddress }, updatedAt: Date.now() };
  }

  function upsertCityCart(cityId: string, updater: (cc: CityCart) => CityCart) {
    const id = String(cityId || "");
    setCarts((prev) => {
      const base = prev[id]
        ? normalizeCityCart(prev[id])
        : {
            cityId: id,
            venues: {},
            customer: { ...defaultCustomer },
            address: { ...defaultAddress },
            updatedAt: Date.now(),
          };
      const next = { ...prev, [id]: { ...updater(base), cityId: id, updatedAt: Date.now() } };
      persist(next);
      return next;
    });
  }

  function setCustomer(cityId: string, patch: Partial<CartCustomer>) {
    upsertCityCart(cityId, (cc) => ({ ...cc, customer: { ...cc.customer, ...patch } }));
  }

  function setAddress(cityId: string, patch: Partial<CartAddress>) {
    upsertCityCart(cityId, (cc) => ({ ...cc, address: { ...cc.address, ...patch } }));
  }

  function setVenueDelivery(cityId: string, venueId: string, patch: Partial<VenueDelivery>) {
    const vid = String(venueId || "");
    if (!vid) return;
    upsertCityCart(cityId, (cc) => {
      const venues = { ...(cc.venues || {}) };
      const existingVenue: VenueCart = venues[vid]
        ? normalizeVenueCart(venues[vid])
        : { venueId: vid, venueName: "", items: [], delivery: { mode: "asap" } };

      const nextDelivery: VenueDelivery = {
        ...existingVenue.delivery,
        ...patch,
      };

      // keep data consistent
      if (nextDelivery.mode === "asap") delete (nextDelivery as any).deliverAtISO;

      venues[vid] = { ...existingVenue, venueId: vid, delivery: nextDelivery };
      return { ...cc, venues };
    });
  }

  function addItem(input: AddItemInput) {
    const cityId = String(input.cityId || "");
    const venueId = String(input.venueId || "");
    if (!cityId || !venueId) return;

    const selections = (input.selections || []).map((s) => normalizeSelection(s));
    const selectionDelta = selections.reduce((sum, s) => sum + (Number(s.priceDeltaSum) || 0), 0);
    const basePrice = Math.max(0, Math.round(Number(input.basePrice ?? 0) || 0));
    const unitPrice = Math.max(0, basePrice + Math.round(selectionDelta));
    const qty = Math.max(1, Math.round(Number(input.qty ?? 1) || 1));

    const signature = computeSignature(String(input.dishId || ""), selections);

    upsertCityCart(cityId, (cc) => {
      const venues = { ...(cc.venues || {}) };
      const existingVenue: VenueCart = venues[venueId]
        ? normalizeVenueCart(venues[venueId])
        : { venueId, venueName: input.venueName || "", items: [], delivery: { mode: "asap" } };

      // merge items with same signature
      const idx = existingVenue.items.findIndex((it) => it.signature === signature);
      if (idx >= 0) {
        const it = existingVenue.items[idx];
        const nextIt: CartItem = { ...it, qty: Math.max(1, it.qty + qty) };
        existingVenue.items = existingVenue.items.map((x, i) => (i === idx ? nextIt : x));
      } else {
        const item: CartItem = {
          id: uid("ci"),
          signature,
          cityId,
          venueId,
          dishId: String(input.dishId || ""),
          name: String(input.name || ""),
          photoUrl: input.photoUrl ? String(input.photoUrl) : "",
          basePrice,
          selections,
          unitPrice,
          qty,
          createdAt: Date.now(),
        };
        existingVenue.items = [item, ...existingVenue.items];
      }

      venues[venueId] = {
        venueId,
        venueName: input.venueName || existingVenue.venueName || "",
        items: existingVenue.items,
        delivery: existingVenue.delivery || { mode: "asap" },
      };

      return { ...cc, venues };
    });
  }

  function setQty(cityId: string, venueId: string, itemId: string, qty: number) {
    const q = Math.max(1, Math.round(Number(qty) || 1));
    upsertCityCart(cityId, (cc) => {
      const venues = { ...cc.venues };
      const vc = venues[venueId] ? normalizeVenueCart(venues[venueId]) : null;
      if (!vc) return cc;
      vc.items = vc.items.map((it) => (it.id === itemId ? { ...it, qty: q } : it));
      venues[venueId] = vc;
      return { ...cc, venues };
    });
  }

  function removeItem(cityId: string, venueId: string, itemId: string) {
    upsertCityCart(cityId, (cc) => {
      const venues = { ...cc.venues };
      const vc = venues[venueId] ? normalizeVenueCart(venues[venueId]) : null;
      if (!vc) return cc;
      vc.items = vc.items.filter((it) => it.id !== itemId);
      if (!vc.items.length) {
        delete venues[venueId];
      } else {
        venues[venueId] = vc;
      }
      return { ...cc, venues };
    });
  }

  function clearVenue(cityId: string, venueId: string) {
    upsertCityCart(cityId, (cc) => {
      const venues = { ...cc.venues };
      delete venues[venueId];
      return { ...cc, venues };
    });
  }

  function clearCity(cityId: string) {
    const id = String(cityId || "");
    setCarts((prev) => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }

  function itemCount(cityId: string) {
    const cc = carts[String(cityId || "")];
    if (!cc) return 0;
    return Object.values(cc.venues || {}).reduce((sum, v) => {
      const items = Array.isArray(v.items) ? v.items : [];
      return sum + items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    }, 0);
  }

  function venueTotal(cityId: string, venueId: string) {
    const cc = carts[String(cityId || "")];
    if (!cc) return 0;
    const vc = cc.venues?.[String(venueId || "")];
    if (!vc) return 0;
    return (vc.items || []).reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0), 0);
  }

  function cityTotal(cityId: string) {
    const cc = carts[String(cityId || "")];
    if (!cc) return 0;
    return Object.keys(cc.venues || {}).reduce((sum, vid) => sum + venueTotal(cityId, vid), 0);
  }

  const value: Ctx = {
  carts,
  hydrated,
  getCityCart: (cityId) => ensureCityCart(cityId),
  venueIds: (cityId) => Object.keys(ensureCityCart(cityId).venues || {}),
  itemsByVenue: (cityId, venueId) => {
    const cc = ensureCityCart(cityId);
    const vc = cc.venues?.[String(venueId || "")];
    return vc?.items || [];
  },
  addItem,
  setQty,
  removeItem,
  clearVenue,
  clearCity,
  setCustomer,
  setAddress,
  setVenueDelivery,
  itemCount,
  venueTotal,
  cityTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
  }

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
  }

export function formatMoneyUAH(value: number) {
  const v = Math.max(0, Math.round(Number(value) || 0));
  return `${new Intl.NumberFormat("uk-UA").format(v)} ₴`;
  }
