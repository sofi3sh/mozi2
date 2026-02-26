"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string; // role key (system or custom)
  cityIds: string[]; // empty => all cities
  isActive: boolean;
  createdAt: string; // ISO
};

type Ctx = {
  users: AppUser[];
  list: () => AppUser[];
  addUser: (u: Omit<AppUser, "id" | "createdAt"> & { password: string }) => AppUser | null;
  updateUser: (id: string, patch: Partial<Omit<AppUser, "id" | "createdAt">> & { password?: string }) => void;
  removeUser: (id: string) => void;
};

const UsersContext = createContext<Ctx | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>([]);

  async function refresh() {
    try {
      const data = await api<{ users: AppUser[] }>("/api/users");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      users,
      list: () => users.slice(),
      addUser: (u) => {
        const email = normalizeEmail(u.email);
        if (!email || !u.name.trim()) return null;
        if (users.some((x) => normalizeEmail(x.email) === email)) return null;
        if (!u.password || u.password.length < 4) return null;

        const created: AppUser = {
          id: uid("u"),
          createdAt: new Date().toISOString(),
          name: u.name,
          email,
          role: u.role,
          cityIds: u.cityIds,
          isActive: u.isActive,
        };

        setUsers((prev) => [created, ...prev]);

        api("/api/users", {
          method: "POST",
          body: JSON.stringify({
            id: created.id,
            name: created.name,
            email: created.email,
            role: created.role,
            cityIds: created.cityIds,
            isActive: created.isActive,
            password: u.password,
          }),
        })
          .then(() => refresh())
          .catch(() => refresh());

        return created;
      },
      updateUser: (id, patch) => {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ...patch,
                  email: patch.email ? normalizeEmail(patch.email) : u.email,
                }
              : u
          )
        );

        api(`/api/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...patch,
            email: typeof patch.email === "string" ? normalizeEmail(patch.email) : undefined,
            // password is optional; do not store in state
            password: typeof (patch as any).password === "string" ? (patch as any).password : undefined,
          }),
        }).catch(() => {});
      },
      removeUser: (id) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        api(`/api/users/${id}`, { method: "DELETE" }).catch(() => {});
      },
    }),
    [users]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsers must be used within UsersProvider");
  return ctx;
}
