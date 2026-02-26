import { prisma } from "@/lib/prisma";
import { badRequest, conflict, json, readBody } from "../_util";

export const runtime = "nodejs";

function normalizeSchedule(raw: any) {
  if (Array.isArray(raw)) {
    return { days: raw, exceptions: [] };
  }
  if (raw && typeof raw === "object") {
    const days = Array.isArray(raw.days) ? raw.days : [];
    const exceptions = Array.isArray(raw.exceptions) ? raw.exceptions : [];
    return { days, exceptions };
  }
  return { days: [], exceptions: [] };
}

function normalizeVenue(v: any) {
  return {
    id: v.id,
    cityId: v.cityId,
    name: v.name,
    description: v.description ?? "",
    address: (v as any).address ?? "",
    deliveryMinutes: Number((v as any).deliveryMinutes ?? 50) || 50,
    slug: v.slug,
    photoUrl: v.photoUrl ?? "",
    venueTypeIds: (v.venueTypeIds ?? []) as string[],
    cuisineTypeIds: (v.cuisineTypeIds ?? []) as string[],
    schedule: normalizeSchedule(v.schedule),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = searchParams.get("cityId") || undefined;

  const venues = await prisma.venue.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { updatedAt: "desc" },
  });

  return json({ venues: venues.map(normalizeVenue) });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const cityId = (body?.cityId ?? "").toString();
  const name = (body?.name ?? "").toString().trim();
  const description = (body?.description ?? "").toString();
  const address = (body?.address ?? "").toString();
  const deliveryMinutes = Number(body?.deliveryMinutes ?? 50) || 50;
  const slug = (body?.slug ?? "").toString().trim();
  if (!cityId) return badRequest("cityId обовʼязковий");
  if (name.length < 2) return badRequest("Назва закладу занадто коротка");
  if (!slug) return badRequest("slug обовʼязковий");

  const venueTypeIds = Array.isArray(body?.venueTypeIds) ? body.venueTypeIds : [];
  const cuisineTypeIds = Array.isArray(body?.cuisineTypeIds) ? body.cuisineTypeIds : [];
  const schedule = normalizeSchedule(body?.schedule);
  const photoUrl = (body?.photoUrl ?? "").toString();

  try {
    const created = await prisma.venue.create({
      data: { cityId, name, description, address, deliveryMinutes, slug, photoUrl, venueTypeIds, cuisineTypeIds, schedule },
    });
    return json({ venue: normalizeVenue(created) }, 201);
  } catch (e: any) {
    return conflict("Заклад з таким slug вже існує в цьому місті");
  }
}
