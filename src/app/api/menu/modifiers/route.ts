import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../../_util";

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

export async function POST(req: Request) {
  const body = await readBody(req);
  if (!body) return badRequest("Invalid JSON");

  const cityId = String(body.cityId ?? "");
  const venueId = String(body.venueId ?? "");
  const title = String(body.title ?? "").trim();
  const required = Boolean(body.required ?? false);
  const minSelect = Math.max(0, toInt(body.minSelect, 0));
  const maxSelect = Math.max(0, toInt(body.maxSelect, 1));
  const options = normalizeOptions(body.options);

  if (!cityId || !venueId) return badRequest("cityId та venueId обов'язкові");
  if (title.length < 2) return badRequest("Назва групи занадто коротка");

  const group = await prisma.modifierGroup.create({
    data: {
      cityId,
      venueId,
      title,
      required,
      minSelect,
      maxSelect,
      options,
    },
  });

  return json({ group });
}
