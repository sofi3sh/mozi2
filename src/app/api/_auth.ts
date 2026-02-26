import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getRolePermissions } from "@/lib/auth/roles";

/**
 * Returns app user if logged in and active.
 */
export async function getAuthenticatedUser(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session?.uid) return null;

  const user = await prisma.appUser.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return null;
  return user;
}

/**
 * Checks that a logged-in user has a given nav permission key.
 * We use `permissions.nav` as the single source of truth for section access.
 */
export async function requireNavPermission(req: Request, key: string) {
  const user = await getAuthenticatedUser(req);
  if (!user) return { ok: false as const, user: null, perms: null };

  const perms = await getRolePermissions(user.role);
  const allow = new Set((perms?.nav ?? []).map((x) => String(x)));
  if (!allow.has(key)) return { ok: false as const, user: null, perms: null };

  return { ok: true as const, user, perms };
}

/**
 * Owner-only guard (used for managing users/roles).
 */
export async function requireOwner(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return { ok: false as const, user: null };
  if (String(user.role) !== "owner") return { ok: false as const, user: null };
  return { ok: true as const, user };
}