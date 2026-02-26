import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ensureSystemRoles } from "@/lib/auth/roles";
import { badRequest, conflict, forbidden, json, readBody } from "../_util";
import { requireOwner } from "../_auth";

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

export async function GET(req: Request) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  const users = await prisma.appUser.findMany({ orderBy: { createdAt: "desc" } });
  return json({ users: users.map(normalize) });
}

export async function POST(req: Request) {
  const auth = await requireOwner(req);
  if (!auth.ok) return forbidden("Недостатньо прав");

  await ensureSystemRoles().catch(() => {});

  const body = await readBody(req);
  const id = typeof body?.id === "string" ? body.id : undefined;
  const name = (body?.name ?? "").toString().trim();
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const role = (body?.role ?? "admin").toString().trim();
  const cityIds = Array.isArray(body?.cityIds) ? body.cityIds.map((x: any) => String(x)) : [];
  const isActive = body?.isActive === undefined ? true : Boolean(body.isActive);
  const password = (body?.password ?? "").toString();

  if (name.length < 2) return badRequest("Імʼя занадто коротке");
  if (!email || !email.includes("@")) return badRequest("Невірний email");
  if (!password || password.trim().length < 4) return badRequest("Пароль занадто короткий");

  // Validate role exists (system or custom).
  const roleExists = await prisma.appRole.findUnique({ where: { key: role } }).catch(() => null);
  if (!roleExists) return badRequest("Невірна роль (такої ролі не існує)");

  try {
    const passwordHash = await hashPassword(password);
    const created = await prisma.appUser.create({
      data: { ...(id ? { id } : {}), name, email, role, cityIds, isActive, passwordHash },
    });
    return json({ user: normalize(created) }, 201);
  } catch {
    return conflict("Користувач з таким email вже існує");
  }
}
