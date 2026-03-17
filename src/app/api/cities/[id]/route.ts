import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, json, notFound, readBody } from "../../_util";
import { requireNavPermission } from "../../_auth";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireNavPermission(req, "cities");
  if (!auth.ok) return forbidden("Недостатньо прав");

  const body = await readBody(req);
  if (!body) return badRequest("Порожнє тіло");

  const data: any = {};
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) return badRequest("Назва міста занадто коротка");
    data.name = name;
  }
  if (body.nameRu !== undefined) {
    const nameRu = String(body.nameRu ?? "").trim();
    data.nameRu = nameRu || null;
  }
  if (typeof body.photoUrl === "string" || body.photoUrl === null) {
    data.photoUrl = body.photoUrl ? body.photoUrl.toString().trim() : null;
  }
  if (!Object.keys(data).length) return badRequest("Немає полів для оновлення");

  const id = params.id;
  const exists = await prisma.city.findUnique({ where: { id } });
  if (!exists) return notFound("Місто не знайдено");

  const updated = await prisma.city.update({ where: { id }, data });
  return json({ city: updated });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireNavPermission(_, "cities");
  if (!auth.ok) return forbidden("Недостатньо прав");

  const id = params.id;
  const exists = await prisma.city.findUnique({ where: { id } });
  if (!exists) return notFound("Місто не знайдено");

  await prisma.city.delete({ where: { id } });
  return json({ ok: true });
}
