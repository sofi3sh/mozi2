import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../../_util";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const cityId = String(body.cityId ?? "");
  const venueId = String(body.venueId ?? "");
  const name = String(body.name ?? "").trim();
  const nameRu = String(body.nameRu ?? "").trim();
  const sort = Number.isFinite(Number(body.sort)) ? Math.round(Number(body.sort)) : 0;
  const photoUrl = body.photoUrl == null ? null : String(body.photoUrl);

  if (!cityId || !venueId) return badRequest("cityId та venueId обов'язкові");
  if (name.length < 2) return badRequest("Назва категорії занадто коротка");

  const category = await prisma.menuCategory.create({
    data: {
      cityId,
      venueId,
      name,
      nameRu: nameRu || null,
      sort,
      photoUrl,
    },
  });

  return json({ category });
}
