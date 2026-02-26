import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ensureSystemRoles } from "@/lib/auth/roles";
import { badRequest, conflict, forbidden, json, notFound, readBody } from "../../_util";
import { requireOwner } from "../../_auth";

export const runtime = "nodejs";

function normalize(u: any) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    cityIds: (u.cityIds ?? []) as string[],
    isActive: Boolean(u.isActive ?? true),
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  await ensureSystemRoles().catch(() => {});

  const body = await readBody(req);
  if (!body) return badRequest("Порожнє тіло");

  const data: any = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) return badRequest("Імʼя занадто коротке");
    data.name = name;
  }
  if (typeof body.role === "string") {
    const role = String(body.role).trim();
    if (!role) return badRequest("Невірна роль");
    const roleExists = await prisma.appRole.findUnique({ where: { key: role } }).catch(() => null);
    if (!roleExists) return badRequest("Невірна роль (такої ролі не існує)");
    data.role = role;
  }
  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (!email || !email.includes("@")) return badRequest("Невірний email");
    data.email = email;
  }
  if (Array.isArray(body.cityIds)) data.cityIds = body.cityIds.map((x: any) => String(x));
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.password === "string") {
    const pass = body.password;
    if (pass.trim().length < 4) return badRequest("Пароль занадто короткий");
    data.passwordHash = await hashPassword(pass);
  }

  const exists = await prisma.appUser.findUnique({ where: { id: params.id } });
  if (!exists) return notFound("Користувача не знайдено");

  // Safety: do not allow the owner to disable or delete themselves.
  if (auth.user?.id && auth.user.id === exists.id) {
    if (typeof data.isActive === "boolean" && data.isActive === false) {
      return forbidden("Не можна вимкнути самого себе");
    }
  }

  try {
    const updated = await prisma.appUser.update({ where: { id: params.id }, data });
    return json({ user: normalize(updated) });
  } catch {
    return conflict("Не вдалося оновити (можливо, email вже зайнятий)");
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  const exists = await prisma.appUser.findUnique({ where: { id: params.id } });
  if (!exists) return notFound("Користувача не знайдено");

  if (auth.user?.id && auth.user.id === exists.id) {
    return forbidden("Не можна видалити самого себе");
  }
  if (exists.role === "owner") {
    return forbidden("Власника не можна видаляти");
  }
  await prisma.appUser.delete({ where: { id: params.id } });
  return json({ ok: true });
}
