import { prisma } from "@/lib/prisma";

export type RolePermissions = {
  /** Navigation / section access keys */
  nav: string[];
};

export const SYSTEM_ROLES: Array<{ key: string; title: string; permissions: RolePermissions; isSystem: boolean }> = [
  {
    key: "owner",
    title: "Власник",
    isSystem: true,
    permissions: {
      nav: [
        "home",
        "cities",
        "integrations",
        "pages",
        "general_settings",
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
  },
  {
    key: "admin",
    title: "Адмін",
    isSystem: true,
    permissions: {
      nav: [
        "home",
        "cities",
        "integrations",
        "pages",
        "general_settings",
        "city_dashboard",
        "venues",
        "menu",
        "orders",
        "clients",
        "analytics",
        "import",
      ],
    },
  },
  {
    key: "seo",
    title: "SEO",
    isSystem: true,
    permissions: { nav: ["home", "city_dashboard", "menu", "seo"] },
  },
  {
    key: "guest",
    title: "Гість",
    isSystem: true,
    permissions: { nav: [] },
  },
];

/**
 * Ensures built-in/system roles exist in DB.
 * Safe to call often:
 * - creates missing roles
 * - does NOT overwrite permissions for existing roles (so admin UI edits persist)
 */
export async function ensureSystemRoles() {
  const client = (prisma as any).appRole;
  if (!client?.upsert) return; // prisma client not generated yet
  for (const r of SYSTEM_ROLES) {
    const existing = await client.findUnique({ where: { key: r.key } }).catch(() => null);
    const perms = (existing?.permissions ?? null) as any;
    const hasValidNav = perms && typeof perms === "object" && Array.isArray(perms.nav);

    if (!existing) {
      await client.create({
        data: { key: r.key, title: r.title, permissions: r.permissions as any, isSystem: r.isSystem },
      });
      continue;
    }

    await client.update({
      where: { key: r.key },
      data: {
        title: r.title,
        isSystem: r.isSystem,
        ...(hasValidNav ? {} : { permissions: r.permissions as any }),
      },
    });
  }
}

export async function getRolePermissions(roleKey: string): Promise<RolePermissions> {
  const client = (prisma as any).appRole;
  if (client?.count && client?.findUnique) {
    // If roles table is empty (fresh install), ensure defaults exist.
    const count = await client.count().catch(() => 0);
    if (count === 0) {
      await ensureSystemRoles();
    }

    const role = await client.findUnique({ where: { key: roleKey } }).catch(() => null);
    const perms = (role?.permissions ?? null) as any;
    if (perms && typeof perms === "object" && Array.isArray(perms.nav)) {
      return { nav: perms.nav.map((x: any) => String(x)) };
    }
  }
  // Fallback to built-in defaults if role record is missing.
  const fallback = SYSTEM_ROLES.find((r) => r.key === roleKey)?.permissions;
  return fallback ? { nav: fallback.nav.slice() } : { nav: [] };
}
