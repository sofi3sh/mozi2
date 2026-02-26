import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../_util";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId") || undefined;

  const orders = await prisma.order.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return json({ orders: orders.map(normalize) });
}

export async function POST(req: Request) {
  // demo: create a simple order
  const body = await readBody(req);
  const cityId = (body?.cityId ?? "").toString();
  const venueId = (body?.venueId ?? "").toString();
  const customerId = (body?.customerId ?? "").toString();
  if (!cityId || !venueId || !customerId) return badRequest("cityId/venueId/customerId обовʼязкові");

  const max = await prisma.order.aggregate({ where: { cityId }, _max: { number: true } });
  const number = (max._max.number ?? 1024) + 1;

  const items = Array.isArray(body?.items) ? body.items : [{ name: "Маргарита", qty: 1, price: 199 }];
  const total = Number(body?.total ?? items.reduce((s: number, it: any) => s + (it.price ?? 0) * (it.qty ?? 1), 0)) || 0;

  const created = await prisma.order.create({
    data: {
      number,
      cityId,
      venueId,
      customerId,
      total: Math.round(total),
      status: "new",
      items,
    },
  });

  return json({ order: normalize(created) }, 201);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId") || "";
  if (!cityId) return badRequest("cityId обовʼязковий");

  await prisma.order.deleteMany({ where: { cityId } });

  return json({ ok: true });
}
