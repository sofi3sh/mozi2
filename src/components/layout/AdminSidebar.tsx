"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navForPermissions, navForRole } from "@/lib/auth/rbac";
import { useSession } from "@/store/session";
import { useCityScope } from "@/store/cityScope";

import {
  HomeIcon,
  CityIcon,
  DashboardIcon,
  StoreIcon,
  MenuIcon,
  OrdersIcon,
  ClientsIcon,
  SeoIcon,
  AnalyticsIcon,
  UsersIcon,
  SettingsIcon,
  ImportIcon,
} from "@/components/icons/Icons";

type ItemT = { href: string; label: string };

function IconFor({ label }: { label: string }) {
  const map: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    "Головна": HomeIcon,
    "Міста": CityIcon,
    "Каталог (типи)": MenuIcon,
    "Дашборд міста": DashboardIcon,
    "Заклади": StoreIcon,
    "Меню": MenuIcon,
    "Замовлення": OrdersIcon,
    "Клієнти": ClientsIcon,
    "SEO": SeoIcon,
    "Аналітика": AnalyticsIcon,
    "Користувачі": UsersIcon,
    "Ролі": UsersIcon,
    "Налаштування": SettingsIcon,
    "Інтеграції": SettingsIcon,
    "Сторінки": MenuIcon,
    "Загальні налаштування": SettingsIcon,
    "Сторінка після оплати": SettingsIcon,
    "Фото категорій": MenuIcon,
    "Імпорт": ImportIcon,
    "Страви закладу": MenuIcon,
    "Страви + Варіації": MenuIcon,
    "Інгредієнти": MenuIcon,
    "Категорії": MenuIcon,
  };

  const I = map[label] ?? DashboardIcon;
  return <I size={18} />;
}

function NavItem({ href, label, onNavigate }: ItemT & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`adminNavItem ${active ? "isActive" : ""}`.trim()}
    >
      <span className="adminNavIcon" aria-hidden>
        <IconFor label={label} />
      </span>
      <span className="adminNavLabel">{label}</span>
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="adminNavSection">
      <div className="adminNavSectionTitle">{title}</div>
      <div className="adminNavList">{children}</div>
    </div>
  );
}

export default function AdminSidebar({
  open,
  collapsed,
  onClose,
  onToggleCollapsed,
}: {
  open?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapsed?: () => void;
}) {
  const { user } = useSession();
  const { currentCityId } = useCityScope();

  const items = user.permissions ? navForPermissions(user.permissions, currentCityId) : navForRole(user.role, currentCityId);

  const base = items.filter((i) => !i.href.startsWith("/admin/c/"));
  const general = base.filter((i) => i.href.startsWith("/admin/general/"));
  const nav = base.filter((i) => !i.href.startsWith("/admin/general/"));
  const city = items.filter((i) => i.href.startsWith("/admin/c/"));

  return (
    <aside className={`adminSidebar ${open ? "isOpen" : ""} ${collapsed ? "isCollapsed" : ""}`.trim()}>
      <div className="adminSidebarHeader">
        <div className="adminBrand">
          <div className="adminBrandMark" aria-hidden>
            m
          </div>
          <div className="adminBrandText">
            <div className="adminBrandTitle">mozi</div>
            <div className="adminBrandSub">Admin panel • {user.role.toUpperCase()}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="adminCollapseBtn"
            onClick={() => onToggleCollapsed?.()}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Показати панель" : "Сховати панель"}
          >
            {collapsed ? "»" : "«"}
          </button>

          <button type="button" className="adminCloseBtn" onClick={() => onClose?.()} aria-label="Close sidebar">
            ✕
          </button>
        </div>
      </div>

      <div className="adminSidebarBody">
        <Section title="Навігація">
          {nav.map((it) => (
            <NavItem key={it.href} href={it.href} label={it.label} onNavigate={onClose} />
          ))}
        </Section>

        {general.length ? (
          <Section title="Загальні">
            {general.map((it) => (
              <NavItem key={it.href} href={it.href} label={it.label} onNavigate={onClose} />
            ))}
          </Section>
        ) : null}

        <Section title={currentCityId ? "Місто" : "Місто (не вибрано)"}>
          {currentCityId ? (
            city.map((it) => <NavItem key={it.href} href={it.href} label={it.label} onNavigate={onClose} />)
          ) : (
            <NavItem href="/admin/menu" label="Головна" onNavigate={onClose} />
          )}
        </Section>

        <div className="adminSidebarFooter">
          <div className="adminSidebarHint">
            {currentCityId ? (
              <>
                Поточне місто: <b>{currentCityId}</b>
              </>
            ) : (
              <>
                Оберіть місто у верхній панелі або на <b>Головній</b>.
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
