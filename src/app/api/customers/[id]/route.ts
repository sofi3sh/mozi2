import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, readBody } from "../../_util";

export const runtime = "nodejs";

function normalize(c: any) {
  return {
    id: c.id,
    cityId: c.cityId,
    name: c.name,
    phone: c.phone ?? "",
    email: c.email ?? "",
    createdAt: c.createdAt.toISOString(),
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await readBody(req);
  if (!body) return badRequest("Порожнє тіло");

  const data: any = {};
  if (typeof body.name === "string") data.name = body.name.trim();
  if (typeof body.phone === "string") data.phone = body.phone;
  if (typeof body.email === "string") data.email = body.email;

  const exists = await prisma.customer.findUnique({ where: { id: params.id } });
  if (!exists) return notFound("Клієнта не знайдено");

  const updated = await prisma.customer.update({ where: { id: params.id }, data });
  return json({ customer: normalize(updated) });
}
