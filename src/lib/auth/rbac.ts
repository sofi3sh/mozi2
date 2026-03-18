export type Role = string;

export type RolePermissions = {
  /** Navigation / section access keys */
  nav: string[];
};

export type NavItem = { label: string; href: string; key: string };

// All possible nav items (keys are used in permissions.nav)
function allNav(cityId: string | null): NavItem[] {
  const base: NavItem[] = [
    { key: "home", label: "Головна", href: "/admin/menu" },
    { key: "cities", label: "Міста", href: "/admin/cities" },
    { key: "catalog", label: "Каталог (типи)", href: "/admin/catalog" },
    { key: "integrations", label: "Інтеграції", href: "/admin/general/integrations" },
    { key: "pages", label: "Сторінки", href: "/admin/general/pages" },
    { key: "general_settings", label: "Загальні налаштування", href: "/admin/general/settings" },
    { key: "checkout_success", label: "Сторінка після оплати", href: "/admin/general/checkout-success" },
    { key: "category_photos", label: "Фото категорій", href: "/admin/general/category-photos" },
    // Role management UI (permission key: "users")
    { key: "users", label: "Ролі", href: "/admin/general/roles" },
  ];

  const cityScoped: NavItem[] = cityId
    ? [
        { key: "city_dashboard", label: "Дашборд міста", href: `/admin/c/${cityId}` },
        { key: "venues", label: "Заклади", href: `/admin/c/${cityId}/venues` },
        { key: "menu", label: "Меню", href: `/admin/c/${cityId}/menu` },
        { key: "orders", label: "Замовлення", href: `/admin/c/${cityId}/orders` },
        { key: "clients", label: "Клієнти", href: `/admin/c/${cityId}/clients` },
        { key: "seo", label: "SEO", href: `/admin/c/${cityId}/seo` },
        { key: "analytics", label: "Аналітика", href: `/admin/c/${cityId}/analytics` },
        { key: "users", label: "Користувачі", href: `/admin/c/${cityId}/users` },
        { key: "import", label: "Імпорт (Excel)", href: `/admin/c/${cityId}/import` },
      ]
    : [];

  return [...base, ...cityScoped];
}

export function navForPermissions(perms: RolePermissions | null | undefined, cityId: string | null) {
  const allow = new Set((perms?.nav ?? []).map((x) => String(x)));
  return allNav(cityId).filter((i) => allow.has(i.key));
}

// Backward-compatible helper (system roles mapping)
const SYSTEM_ROLE_PERMS: Record<string, RolePermissions> = {
  owner: {
    nav: [
      "home",
      "cities",
      "catalog",
      "integrations",
      "pages",
      "general_settings",
      "checkout_success",
      "category_photos",
      "city_dashboard",
      "venues",
      "menu",
      "orders",
      "clients",
      "seo",
      "analytics",
      "users",
      "import",
    ],
  },
  admin: {
    nav: [
      "home",
      "cities",
      "catalog",
      "integrations",
      "pages",
      "general_settings",
      "checkout_success",
      "category_photos",
      "city_dashboard",
      "venues",
      "menu",
      "orders",
      "clients",
      "analytics",
      "import",
    ],
  },
  seo: { nav: ["home", "checkout_success", "category_photos", "city_dashboard", "menu", "seo"] },
  guest: { nav: [] },
};

export function navForRole(role: Role, cityId: string | null) {
  return navForPermissions(SYSTEM_ROLE_PERMS[role] ?? SYSTEM_ROLE_PERMS.guest, cityId);
}

export function canAccessCity(userCityIds: any, cityId: string) {
  const ids: string[] = Array.isArray(userCityIds) ? userCityIds.map((x) => String(x)) : [];
  return ids.length === 0 || ids.includes(cityId);
}
