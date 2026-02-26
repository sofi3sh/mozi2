import { prisma } from "@/lib/prisma";
import { ensureSystemRoles } from "@/lib/auth/roles";
import { badRequest, conflict, forbidden, json, readBody, unauthorized } from "../_util";
import { getAuthenticatedUser, requireOwner } from "../_auth";

export const runtime = "nodejs";

function normalizeRole(r: any) {
  const perms = (r?.permissions ?? null) as any;
  const nav = perms && typeof perms === "object" && Array.isArray(perms.nav) ? perms.nav.map((x: any) => String(x)) : [];
  return {
    key: String(r.key),
    title: String(r.title ?? ""),
    isSystem: Boolean(r.isSystem),
    permissions: { nav },
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
  };
}

function normalizeKey(raw: string) {
  const k = raw.trim().toLowerCase();
  // allow a-z, 0-9, underscore and dash
  if (!/^[a-z0-9_-]{2,48}$/.test(k)) return null;
  return k;
}

function normalizeNav(nav: any) {
  const arr = Array.isArray(nav) ? nav : [];
  // We keep this permissive; UI provides known keys.
  const clean = arr
    .map((x) => String(x))
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  // unique
  return Array.from(new Set(clean));
}

export async function GET(req: Request) {
  const user = await getAuthenticatedUser(req);
  if (!user) return unauthorized("Unauthorized");

  // Ensure system roles exist.
  await ensureSystemRoles().catch(() => {});

  const roles = await prisma.appRole.findMany({ orderBy: [{ isSystem: "desc" }, { key: "asc" }] });
  return json({ roles: roles.map(normalizeRole) });
}

export async function POST(req: Request) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  const body = await readBody(req);
  const keyRaw = (body?.key ?? "").toString();
  const title = (body?.title ?? "").toString().trim();
  const key = normalizeKey(keyRaw);
  if (!key) return badRequest("Невірний ключ ролі (допустимо: a-z, 0-9, _, -; 2-48 символів)");
  if (title.length < 2) return badRequest("Назва ролі занадто коротка");

  const nav = normalizeNav(body?.permissions?.nav ?? body?.nav);
  const permissions = { nav };

  // Ensure system roles exist; prevents collisions in fresh installs.
  await ensureSystemRoles().catch(() => {});

  const exists = await prisma.appRole.findUnique({ where: { key } });
  if (exists) return conflict("Роль з таким ключем вже існує");

  const created = await prisma.appRole.create({
    data: {
      key,
      title,
      permissions: permissions as any,
      isSystem: false,
    },
  });

  return json({ role: normalizeRole(created) }, 201);
}
