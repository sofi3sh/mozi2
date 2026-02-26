import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, readBody } from "../../_util";

export const runtime = "nodejs";

function normalize(o: any) {
  return {
    id: o.id,
    number: o.number,
    cityId: o.cityId,
    venueId: o.venueId,
    customerId: o.customerId,
    paymentId: o.paymentId ?? null,
    paymentStatus: o.paymentStatus ?? null,
    paymentProvider: o.paymentProvider ?? null,
    total: o.total,
    status: o.status,
    deliveryMode: o.deliveryMode ?? null,
    deliverAt: o.deliverAt ? o.deliverAt.toISOString() : null,
    deliveryAddress: o.deliveryAddress ?? null,
    createdAt: o.createdAt.toISOString(),
    items: (o.items ?? []) as any[],
  };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await readBody(req);
  if (!body) return badRequest("Порожнє тіло");
  const status = (body?.status ?? "").toString();
  if (!status) return badRequest("status обовʼязковий");

  const exists = await prisma.order.findUnique({ where: { id: params.id } });
  if (!exists) return notFound("Замовлення не знайдено");

  const updated = await prisma.order.update({ where: { id: params.id }, data: { status } });
  return json({ order: normalize(updated) });
}
