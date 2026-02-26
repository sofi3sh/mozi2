import { prisma } from "@/lib/prisma";
import { badRequest } from "../../_util";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { cookieString, encodeSession } from "@/lib/auth/session";
import { verifyTotp } from "@/lib/auth/totp";
import { ensureSystemRoles, getRolePermissions } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();
  const otp = (body?.otp ?? "").toString();
  if (!email || !email.includes("@")) return badRequest("Невірний email");
  if (password.length < 4) return badRequest("Пароль занадто короткий");

  // Якщо користувачів ще немає — перший вхід створює Owner.
  const usersCount = await prisma.appUser.count();
  if (usersCount === 0) {
    // Fresh install: ensure default roles exist.
    await ensureSystemRoles();

    const passwordHash = await hashPassword(password);
    const created = await prisma.appUser.create({
      data: {
        name: email.split("@")[0] || "Owner",
        email,
        role: "owner",
        cityIds: [],
        isActive: true,
        passwordHash,
      },
    });

    const permissions = await getRolePermissions(created.role);
    const cityIds = Array.isArray(created.cityIds) ? created.cityIds : [];

    const token = encodeSession({
      uid: created.id,
      email: created.email,
      name: created.name,
      role: created.role as any,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });
    return new Response(
      JSON.stringify({ user: { id: created.id, name: created.name, role: created.role, cityIds, permissions } }),
      {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": cookieString(token, 60 * 60 * 24 * 7),
      },
      }
    );
  }

  const user = await prisma.appUser.findUnique({ where: { email } });
  if (!user || !user.isActive) return badRequest("Невірний логін або пароль");

  // Legacy/demo міграція: якщо паролю ще немає, приймаємо demo1234 і записуємо хеш.
  if (!user.passwordHash) {
    if (password !== "demo1234") return badRequest("Невірний логін або пароль");
    const passwordHash = await hashPassword(password);
    await prisma.appUser.update({ where: { id: user.id }, data: { passwordHash } });
    user.passwordHash = passwordHash;
  }

  const ok = await verifyPassword(password, user.passwordHash!);
  if (!ok) return badRequest("Невірний логін або пароль");

  // Optional 2FA for owner (stored in global settings).
  try {
    const sec = await prisma.setting.findUnique({
      where: { scope_cityId_key: { scope: "global", cityId: "global", key: "security" } },
    });
    const tf = (sec?.value as any)?.twoFactor ?? null;
    const enabled = Boolean(tf?.enabled && tf?.userId === user.id && tf?.secret);
    if (enabled) {
      if (!otp) return badRequest("OTP_REQUIRED", { code: "OTP_REQUIRED" });
      if (!verifyTotp(String(tf.secret), otp)) return badRequest("OTP_INVALID", { code: "OTP_INVALID" });
    }
  } catch {
    // ignore 2FA errors; login still works if settings unavailable
  }

  const token = encodeSession({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role as any,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });

  const permissions = await getRolePermissions(user.role);
  const cityIds = Array.isArray(user.cityIds) ? user.cityIds : [];

  return new Response(JSON.stringify({ user: { id: user.id, name: user.name, role: user.role, cityIds, permissions } }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": cookieString(token, 60 * 60 * 24 * 7),
    },
  });
}
