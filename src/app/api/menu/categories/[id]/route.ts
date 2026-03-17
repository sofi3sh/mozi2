import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, readBody } from "../../../_util";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const patch: any = {};
  if (body.name != null) {
    const name = String(body.name).trim();
    if (name.length < 2) return badRequest("Назва категорії занадто коротка");
    patch.name = name;
  }
  if (body.nameRu !== undefined) {
    const nameRu = String(body.nameRu ?? "").trim();
    patch.nameRu = nameRu || null;
  }
  if (body.sort != null) {
    const n = Number(body.sort);
    if (Number.isFinite(n)) patch.sort = Math.round(n);
  }
  if (body.photoUrl !== undefined) {
    patch.photoUrl = body.photoUrl == null ? null : String(body.photoUrl);
  }

  const exists = await prisma.menuCategory.findUnique({ where: { id } });
  if (!exists) return notFound("Категорію не знайдено");

  const category = await prisma.menuCategory.update({ where: { id }, data: patch });
  return json({ category });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const exists = await prisma.menuCategory.findUnique({ where: { id } });
  if (!exists) return notFound("Категорію не знайдено");

  // Dish doesn't have a strict FK relation to MenuCategory in the schema,
  // so we clean up dishes manually.
  await prisma.$transaction([
    prisma.dish.deleteMany({ where: { categoryId: id } }),
    prisma.menuCategory.delete({ where: { id } }),
  ]);

  return json({ ok: true });
}
