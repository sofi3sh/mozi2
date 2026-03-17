import { prisma } from "@/lib/prisma";
import { badRequest, conflict, json, notFound, readBody } from "../../_util";

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
    nameRu: (v as any).nameRu ?? "",
    description: v.description ?? "",
    descriptionRu: (v as any).descriptionRu ?? "",
    address: (v as any).address ?? "",
    addressRu: (v as any).addressRu ?? "",
    deliveryMinutes: Number((v as any).deliveryMinutes ?? 50) || 50,
    slug: v.slug,
    photoUrl: v.photoUrl ?? "",
    venueTypeIds: (v.venueTypeIds ?? []) as string[],
    cuisineTypeIds: (v.cuisineTypeIds ?? []) as string[],
    schedule: normalizeSchedule(v.schedule),
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = await prisma.venue.findUnique({ where: { id } });
  if (!venue) return notFound("Заклад не знайдено");
  return json({ venue: normalizeVenue(venue) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readBody(req);
  if (!body || typeof body !== "object") return badRequest("Некоректне тіло запиту");

  // Дозволяємо оновлювати тільки whitelist полів
  const data: any = {};
  if ("name" in body) data.name = String(body.name ?? "");
  if ("nameRu" in body) data.nameRu = String(body.nameRu ?? "") || null;
  if ("description" in body) data.description = String(body.description ?? "");
  if ("descriptionRu" in body) data.descriptionRu = String(body.descriptionRu ?? "") || null;
  if ("address" in body) data.address = String(body.address ?? "");
  if ("addressRu" in body) data.addressRu = String(body.addressRu ?? "") || null;
  if ("deliveryMinutes" in body) data.deliveryMinutes = Number(body.deliveryMinutes ?? 50) || 50;
  if ("slug" in body) data.slug = String(body.slug ?? "").trim();
  if ("photoUrl" in body) data.photoUrl = String(body.photoUrl ?? "");
  if ("venueTypeIds" in body) data.venueTypeIds = Array.isArray(body.venueTypeIds) ? body.venueTypeIds : [];
  if ("cuisineTypeIds" in body) data.cuisineTypeIds = Array.isArray(body.cuisineTypeIds) ? body.cuisineTypeIds : [];
  if ("schedule" in body) data.schedule = normalizeSchedule(body.schedule);

  if ("slug" in data && !data.slug) return badRequest("slug обовʼязковий");

  try {
    const updated = await prisma.venue.update({ where: { id }, data });
    return json({ venue: normalizeVenue(updated) });
  } catch (e: any) {
    // Найчастіше тут буде конфлікт уникального slug
    return conflict("Не вдалося оновити заклад (можливо, slug вже зайнятий)");
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.venue.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return notFound("Заклад не знайдено");
  }
}
