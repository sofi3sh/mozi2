import { prisma } from "@/lib/prisma";
import { json } from "../../_util";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getRolePermissions } from "@/lib/auth/roles";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) return json({ user: null }, 200);

  const user = await prisma.appUser.findUnique({ where: { id: session.uid } });
  if (!user || !user.isActive) return json({ user: null }, 200);

  const permissions = await getRolePermissions(user.role);
  const cityIds = Array.isArray(user.cityIds) ? user.cityIds : [];

  return json(
    { user: { id: user.id, name: user.name, role: user.role, email: user.email, cityIds, permissions } },
    200
  );
}
