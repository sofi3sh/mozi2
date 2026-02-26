import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../../_util";

export const runtime = "nodejs";

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const cityId = String(body.cityId ?? "");
  const venueId = String(body.venueId ?? "");
  const categoryId = String(body.categoryId ?? "");
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "");
  const price = Math.max(0, toInt(body.price, 0));
  const photoUrl = body.photoUrl ? String(body.photoUrl) : null;
  const isStopped = Boolean(body.isStopped ?? false);

  const modifierGroupIds = Array.isArray(body.modifierGroupIds) ? body.modifierGroupIds.map(String) : [];

  if (!cityId || !venueId || !categoryId) return badRequest("cityId, venueId, categoryId обов'язкові");
  if (name.length < 2) return badRequest("Назва страви занадто коротка");

  const dish = await prisma.dish.create({
    data: {
      cityId,
      venueId,
      categoryId,
      name,
      description,
      price,
      photoUrl,
      isStopped,
      modifierGroupIds,
    },
  });

  return json({ dish });
}
