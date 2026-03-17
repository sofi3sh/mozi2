import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, readBody } from "../../../_util";

export const runtime = "nodejs";

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const patch: any = {};
  if (body.categoryId != null) patch.categoryId = String(body.categoryId);
  if (body.name != null) {
    const name = String(body.name).trim();
    if (name.length < 2) return badRequest("Назва страви занадто коротка");
    patch.name = name;
  }
  if (body.nameRu !== undefined) {
    const nameRu = String(body.nameRu ?? "").trim();
    patch.nameRu = nameRu || null;
  }
  if (body.description != null) patch.description = String(body.description);
  if (body.descriptionRu !== undefined) patch.descriptionRu = String(body.descriptionRu ?? "") || null;
  if (body.price != null) patch.price = Math.max(0, toInt(body.price, 0));
  if (body.photoUrl !== undefined) patch.photoUrl = body.photoUrl ? String(body.photoUrl) : null;
  if (body.isStopped != null) patch.isStopped = Boolean(body.isStopped);
  if (body.modifierGroupIds != null) {
    patch.modifierGroupIds = Array.isArray(body.modifierGroupIds) ? body.modifierGroupIds.map(String) : [];
  }

  const exists = await prisma.dish.findUnique({ where: { id } });
  if (!exists) return notFound("Страву не знайдено");

  const dish = await prisma.dish.update({ where: { id }, data: patch });
  return json({ dish });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const exists = await prisma.dish.findUnique({ where: { id } });
  if (!exists) return notFound("Страву не знайдено");

  await prisma.dish.delete({ where: { id } });
  return json({ ok: true });
}
