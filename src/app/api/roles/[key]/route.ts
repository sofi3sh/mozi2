import { prisma } from "@/lib/prisma";
import { ensureSystemRoles } from "@/lib/auth/roles";
import { badRequest, conflict, forbidden, json, notFound, readBody } from "../../_util";
import { requireOwner } from "../../_auth";

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

function normalizeNav(nav: any) {
  const arr = Array.isArray(nav) ? nav : [];
  const clean = arr
    .map((x) => String(x))
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  return Array.from(new Set(clean));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  await ensureSystemRoles().catch(() => {});

  const { key } = await params;
  const role = await prisma.appRole.findUnique({ where: { key } });
  if (!role) return notFound("Роль не знайдена");

  const body = await readBody(req);
  const title = body?.title !== undefined ? String(body.title).trim() : undefined;
  const nav = body?.permissions?.nav !== undefined || body?.nav !== undefined ? normalizeNav(body?.permissions?.nav ?? body?.nav) : undefined;

  if (title !== undefined && title.length < 2) return badRequest("Назва ролі занадто коротка");

  const updated = await prisma.appRole.update({
    where: { key },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(nav !== undefined ? { permissions: { nav } as any } : {}),
    },
  });

  return json({ role: normalizeRole(updated) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  await ensureSystemRoles().catch(() => {});

  const { key } = await params;
  const role = await prisma.appRole.findUnique({ where: { key } });
  if (!role) return notFound("Роль не знайдена");

  if (role.isSystem) return forbidden("Системні ролі не можна видаляти");

  const used = await prisma.appUser.count({ where: { role: key } });
  if (used > 0) return conflict("Цю роль використовують користувачі — спочатку змініть їм роль");

  await prisma.appRole.delete({ where: { key } });
  return json({ ok: true });
}
