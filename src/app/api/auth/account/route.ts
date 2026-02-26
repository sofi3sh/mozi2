import { prisma } from "@/lib/prisma";
import { badRequest, conflict, readBody } from "../../_util";
import { getSessionFromRequest, cookieString, encodeSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getRolePermissions } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return badRequest("Потрібен вхід");

  const body = await readBody(req);
  const name = (body?.name ?? "").toString().trim();
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const currentPassword = (body?.currentPassword ?? "").toString();
  const newPassword = (body?.newPassword ?? "").toString();

  const user = await prisma.appUser.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return badRequest("Потрібен вхід");

  const wantsEmailChange = email && email !== user.email;
  const wantsPasswordChange = newPassword && newPassword.length >= 4;

  if (!name) return badRequest("Імʼя обовʼязкове");
  if (wantsEmailChange && !email.includes("@")) return badRequest("Невірний email");

  // For sensitive changes require current password.
  if ((wantsEmailChange || wantsPasswordChange) && user.passwordHash) {
    if (!currentPassword) return badRequest("Потрібен поточний пароль");
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return badRequest("Невірний поточний пароль");
  }

  let passwordHash: string | undefined = undefined;
  if (wantsPasswordChange) {
    passwordHash = await hashPassword(newPassword);
  }

  try {
    const updated = await prisma.appUser.update({
      where: { id: user.id },
      data: {
        name,
        ...(wantsEmailChange ? { email } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    const token = encodeSession({
      uid: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role as any,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    const permissions = await getRolePermissions(updated.role);
    const cityIds = Array.isArray(updated.cityIds) ? updated.cityIds : [];

    return new Response(
      JSON.stringify({ user: { id: updated.id, name: updated.name, role: updated.role, email: updated.email, cityIds, permissions } }),
      {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": cookieString(token, 60 * 60 * 24 * 7),
      },
      }
    );
  } catch (e: any) {
    return conflict("Такий email вже існує");
  }
}
