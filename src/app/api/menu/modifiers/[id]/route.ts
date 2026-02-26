import { prisma } from "@/lib/prisma";
import { badRequest, json, notFound, readBody } from "../../../_util";

export const runtime = "nodejs";

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function normalizeOptions(raw: any): any[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((o) => {
      const name = String(o?.name ?? "").trim();
      if (!name) return null;
      return {
        id: String(o?.id ?? `opt_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`),
        name,
        priceDelta: toInt(o?.priceDelta, 0),
        grams: o?.grams == null ? undefined : Math.max(0, toInt(o?.grams, 0)),
        maxQty: o?.maxQty == null ? undefined : Math.max(0, toInt(o?.maxQty, 0)),
        isStopped: Boolean(o?.isStopped ?? false),
      };
    })
    .filter(Boolean);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const patch: any = {};
  if (body.title != null) {
    const title = String(body.title).trim();
    if (title.length < 2) return badRequest("Назва групи занадто коротка");
    patch.title = title;
  }
  if (body.required != null) patch.required = Boolean(body.required);
  if (body.minSelect != null) patch.minSelect = Math.max(0, toInt(body.minSelect, 0));
  if (body.maxSelect != null) patch.maxSelect = Math.max(0, toInt(body.maxSelect, 1));
  if (body.options !== undefined) patch.options = normalizeOptions(body.options);

  const exists = await prisma.modifierGroup.findUnique({ where: { id } });
  if (!exists) return notFound("Групу не знайдено");

  const group = await prisma.modifierGroup.update({ where: { id }, data: patch });
  return json({ group });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = String(params.id ?? "");
  if (!id) return badRequest("Missing id");

  const group = await prisma.modifierGroup.findUnique({ where: { id } });
  if (!group) return notFound("Групу не знайдено");

  // Clean up references in dishes.modifierGroupIds (JSON) for this venue.
  const dishes = await prisma.dish.findMany({
    where: { cityId: group.cityId, venueId: group.venueId },
    select: { id: true, modifierGroupIds: true },
  });

  const updates: any[] = [];
  for (const d of dishes) {
    const ids = Array.isArray(d.modifierGroupIds) ? d.modifierGroupIds.map(String) : [];
    if (!ids.includes(id)) continue;
    updates.push(
      prisma.dish.update({
        where: { id: d.id },
        data: { modifierGroupIds: ids.filter((x) => x !== id) },
      })
    );
  }

  await prisma.$transaction([
    ...updates,
    prisma.modifierGroup.delete({ where: { id } }),
  ]);

  return json({ ok: true });
}
