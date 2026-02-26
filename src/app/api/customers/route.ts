import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../_util";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId") || undefined;

  const customers = await prisma.customer.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return json({ customers: customers.map(normalize) });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const cityId = (body?.cityId ?? "").toString();
  const name = (body?.name ?? "").toString().trim();
  if (!cityId || !name) return badRequest("cityId/name обовʼязкові");

  const created = await prisma.customer.create({
    data: {
      cityId,
      name,
      phone: (body?.phone ?? "").toString(),
      email: (body?.email ?? "").toString(),
    },
  });

  return json({ customer: normalize(created) }, 201);
}
