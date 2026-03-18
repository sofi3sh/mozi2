"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { useSession } from "@/store/session";
import LoginForm from "@/features/auth/LoginForm";
import UnauthorizedView from "@/components/ui/UnauthorizedView";
import { canAccessCity } from "@/lib/auth/rbac";

const adminThemeVars: React.CSSProperties = {
  // Light theme for content + controls
  // @ts-ignore CSS variables
  "--bg": "#f6f7fb",
  // @ts-ignore CSS variables
  "--panel": "#ffffff",
  // @ts-ignore CSS variables
  "--panel-2": "#f3f5f8",
  // @ts-ignore CSS variables
  "--text": "#0f172a",
  // @ts-ignore CSS variables
  "--muted": "rgba(15, 23, 42, 0.62)",
  // @ts-ignore CSS variables
  "--border": "rgba(15, 23, 42, 0.10)",
  // Brand accent (match site)
  // @ts-ignore CSS variables
  "--accent": "#e6a24a",
  // @ts-ignore CSS variables
  "--accent-rgb": "230, 162, 74",
  // @ts-ignore CSS variables
  "--shadow": "0 18px 44px rgba(15, 23, 42, 0.10)",
  // @ts-ignore CSS variables
  "--radius": "16px",
};

const moziLoginVars: React.CSSProperties = {
  // Match SiteShell (mozi)
  // @ts-ignore CSS variables
  "--bg": "#f6f0e8",
  // @ts-ignore CSS variables
  "--panel": "rgba(255,255,255,0.72)",
  // @ts-ignore CSS variables
  "--panel-2": "#ffffff",
  // @ts-ignore CSS variables
  "--text": "#1f2937",
  // @ts-ignore CSS variables
  "--muted": "rgba(31,41,55,0.62)",
  // @ts-ignore CSS variables
  "--border": "rgba(31,41,55,0.10)",
  // @ts-ignore CSS variables
  "--accent": "#e6a24a",
  // @ts-ignore CSS variables
  "--accent-rgb": "230, 162, 74",
  // @ts-ignore CSS variables
  "--shadow": "0 18px 44px rgba(15, 23, 42, 0.10)",
  // @ts-ignore CSS variables
  "--radius": "18px",
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persist desktop sidebar collapsed state.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem("admin_sidebar_collapsed");
      setSidebarCollapsed(v === "1");
    } catch {
      // ignore
    }
  }, []);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  const isAuth = !!user && user.role !== "guest";

  // --- RBAC guard (no redirects, just show Unauthorized screen) ---
  const rbac = useMemo(() => {
    if (!isAuth) return { ok: false, reason: "not-auth" as const };

    const allowed = new Set((user.permissions?.nav ?? []).map((x) => String(x)));

    // If user has no allowed sections at all, block everything except /login.
    if (allowed.size === 0) return { ok: false, reason: "no-permissions" as const };

    // Normalize pathname.
    const p = (pathname || "/").split("?")[0];

    // City-scoped routes: /admin/c/:cityId/... require both city access + section permission.
    const m = p.match(/^\/admin\/c\/([^\/]+)(?:\/(.*))?$/);
    if (m) {
      const cityId = m[1];
      const rest = (m[2] || "").toLowerCase();

      // City access check
      const cityOk = canAccessCity(user.cityIds ?? [], cityId);
      if (!cityOk) return { ok: false, reason: "city" as const };

      // Route -> permission key mapping
      const key =
        rest === "" ? "city_dashboard" :
        rest.startsWith("venues") ? "venues" :
        rest.startsWith("menu") ? "menu" :
        rest.startsWith("orders") ? "orders" :
        rest.startsWith("clients") ? "clients" :
        rest.startsWith("seo") ? "seo" :
        rest.startsWith("analytics") ? "analytics" :
        rest.startsWith("users") ? "users" :
        rest.startsWith("import") ? "import" :
        // Unknown city route -> require city_dashboard permission as a safe default
        "city_dashboard";

      return allowed.has(key) ? { ok: true } : { ok: false, reason: "nav" as const };
    }

    // Global admin routes
    if (p === "/admin" || p.startsWith("/admin/menu")) {
      return allowed.has("home") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/cities")) {
      return allowed.has("cities") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/catalog")) {
      return allowed.has("catalog") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/general/roles")) {
      return allowed.has("users") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/general/integrations")) {
      return allowed.has("integrations") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/general/pages")) {
      return allowed.has("pages") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/general/settings")) {
      return allowed.has("general_settings") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/general/checkout-success")) {
      return allowed.has("checkout_success") ? { ok: true } : { ok: false, reason: "nav" as const };
    }
    if (p.startsWith("/admin/general/category-photos")) {
      return allowed.has("category_photos") ? { ok: true } : { ok: false, reason: "nav" as const };
    }

    // Fallback: allow if user can at least access home.
    return allowed.has("home") ? { ok: true } : { ok: false, reason: "nav" as const };
  }, [isAuth, pathname, user.permissions, user.cityIds]);

  // We intentionally avoid redirecting from /admin.
  // /admin renders a dashboard landing page (better UX + fewer navigation hops).

  const guard = useMemo(() => {
    if (isAuth) return null;
    return (
      <div
        style={{
          ...moziLoginVars,
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
          backgroundImage:
            "radial-gradient(900px 600px at 10% -10%, rgba(230,162,74,0.18), transparent 55%), radial-gradient(900px 600px at 90% 0%, rgba(31,41,55,0.06), transparent 55%)",
        }}
      >
        <main
          style={{
            maxWidth: 1080,
            margin: "60px auto",
            padding: 16,
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 18,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <div style={{ fontWeight: 950, fontSize: 30, letterSpacing: "-0.03em" }}>
              Вітаємо в Адмінці нашого сайту!
            </div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: 14 }}>
              Увійдіть, щоб керувати містами, закладами, меню та налаштуваннями.
            </div>

            <div className="ui-card ui-card--soft" style={{ padding: 16, background: "rgba(255,255,255,0.55)" }}>
              <div style={{ fontWeight: 950 }}>Порада</div>
              <div className="ui-subtitle" style={{ marginTop: 8 }}>
                Після входу відкрийте <b>Міста</b> → оберіть місто → керуйте <b>Меню</b> та <b>Замовленнями</b>.
              </div>
            </div>

            <div className="ui-subtitle" style={{ marginTop: 6 }}>
              Або відкрийте класичну сторінку входу: <Link href="/login" style={{ color: "var(--accent)", fontWeight: 950 }}> /login</Link>
            </div>
          </div>

          <div className="ui-card" style={{ padding: 18, background: "rgba(255,255,255,0.75)", boxShadow: "var(--shadow)" }}>
            <div style={{ fontWeight: 950, fontSize: 16, letterSpacing: "-0.02em" }}>Вхід</div>
            <div className="ui-subtitle" style={{ marginTop: 8, marginBottom: 12 }}>
              Логін (email) + пароль
            </div>
            <LoginForm />
          </div>
        </main>
      </div>
    );
  }, [isAuth]);

  if (guard) return guard;

  if (!rbac.ok) {
    return (
      <div className="adminRoot" style={adminThemeVars}>
        <div className="adminLayout">
          <div className="adminMain" style={{ minHeight: "100vh" }}>
            <div className="adminScroll">
              <div className="adminContent">
                <UnauthorizedView reason={rbac.reason} backHref="/admin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminRoot" style={adminThemeVars}>
      <div className={`adminLayout ${sidebarCollapsed ? "isCollapsed" : ""}`.trim()}>
        <AdminSidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          onToggleCollapsed={toggleSidebarCollapsed}
        />

        {/* Overlay for mobile */}
        {sidebarOpen ? (
          <div
            className="adminOverlay"
            onClick={() => setSidebarOpen(false)}
            role="button"
            aria-label="Close sidebar"
          />
        ) : null}

        <div className="adminMain">
          <AdminTopbar
            onToggleSidebar={() => setSidebarOpen((s) => !s)}
            onNavigate={() => setSidebarOpen(false)}
            onToggleCollapsed={toggleSidebarCollapsed}
            sidebarCollapsed={sidebarCollapsed}
          />

          <div className="adminScroll">
            <div className="adminContent">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
