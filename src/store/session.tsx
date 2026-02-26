"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/auth/rbac";

export type User = {
  id: string;
  name: string;
  role: Role;
  email?: string;
  cityIds?: string[];
  permissions?: { nav: string[] };
};

type SessionCtx = {
  user: User;
  loading: boolean;
  login: (email: string, password: string, otp?: string) => Promise<{ ok: boolean; requiresOtp?: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionCtx | null>(null);

const GUEST: User = { id: "guest", name: "Гість", role: "guest", cityIds: [], permissions: { nav: [] } };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(GUEST);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as { user: any };
      if (data?.user?.role) {
        setUser({
          id: data.user.id,
          name: data.user.name,
          role: data.user.role,
          email: data.user.email,
          cityIds: Array.isArray(data.user.cityIds) ? data.user.cityIds : [],
          permissions: data.user.permissions && Array.isArray(data.user.permissions.nav) ? data.user.permissions : { nav: [] },
        });
      } else {
        setUser(GUEST);
      }
    } catch {
      setUser(GUEST);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  const value = useMemo<SessionCtx>(
    () => ({
      user,
      loading,
      login: async (email: string, password: string, otp?: string) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, password, otp }),
          });
          const data = (await res.json().catch(() => ({}))) as any;
          if (!res.ok) {
            const code = data?.details?.code || data?.error;
            if (code === "OTP_REQUIRED") return { ok: false, requiresOtp: true, message: "Потрібен код 2FA" };
            if (code === "OTP_INVALID") return { ok: false, requiresOtp: true, message: "Невірний код 2FA" };
            return { ok: false, message: data?.error ?? "Невірний email або пароль" };
          }
          if (data?.user?.role) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              role: data.user.role,
              email,
              cityIds: Array.isArray(data.user.cityIds) ? data.user.cityIds : [],
              permissions: data.user.permissions && Array.isArray(data.user.permissions.nav) ? data.user.permissions : { nav: [] },
            });
            return { ok: true };
          }
          return { ok: false, message: "Невірний email або пароль" };
        } catch {
          return { ok: false, message: "Не вдалося виконати вхід" };
        }
      },
      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          setUser(GUEST);
        }
      },
    }),
    [user, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
