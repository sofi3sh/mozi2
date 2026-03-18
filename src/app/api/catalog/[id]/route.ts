import { prisma } from "@/lib/prisma";
import { badRequest, conflict, json, notFound, readBody } from "../../_util";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const body = await readBody(req);
  if (!body || typeof body !== "object") return badRequest("Invalid JSON");

  const data: any = {};
  if (body.name !== undefined) {
    const name = String(body.name ?? "").trim();
    if (name.length < 2) return badRequest("Порожня назва");
    data.name = name;
  }
  if (body.nameRu !== undefined) {
    const nameRu = String(body.nameRu ?? "").trim();
    data.nameRu = nameRu || null;
  }

  if (!Object.keys(data).length) return badRequest("Немає полів для оновлення");

  const exists = await prisma.catalogItem.findUnique({ where: { id } });
  if (!exists) return notFound("Не знайдено");

  try {
    const updated = await prisma.catalogItem.update({ where: { id }, data });
    return json({
      item: { id: updated.id, kind: updated.kind, name: updated.name, nameRu: (updated as any).nameRu ?? "" },
    });
  } catch {
    return conflict("Не вдалося оновити (можливо, така назва вже існує)");
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const exists = await prisma.catalogItem.findUnique({ where: { id } });
  if (!exists) return notFound("Не знайдено");

  // Prevent deletion when used by any venue (MySQL JSON arrays)
  try {
    const col = exists.kind === "venueType" ? "venueTypeIds" : "cuisineTypeIds";
    const sql = `SELECT id FROM \`Venue\` WHERE JSON_CONTAINS(\`${col}\`, JSON_QUOTE(?)) LIMIT 1`;
    const rows: any[] = await prisma.$queryRawUnsafe(sql, id);
    if (Array.isArray(rows) && rows.length) {
      return conflict("Неможливо видалити: тип використовується у закладах");
    }
  } catch {
    // If DB doesn't support JSON_CONTAINS for some reason, fail safe: do not delete.
    return conflict("Неможливо видалити: не вдалося перевірити використання типу у закладах");
  }

  await prisma.catalogItem.delete({ where: { id } });
  return json({ ok: true });
}

