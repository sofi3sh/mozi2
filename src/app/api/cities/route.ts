import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { badRequest, conflict, forbidden, json, readBody } from "../_util";
import { requireNavPermission } from "../_auth";

export const runtime = "nodejs";

export async function GET() {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });
  return json({ cities });
}

export async function POST(req: Request) {
  const auth = await requireNavPermission(req, "cities");
  if (!auth.ok) return forbidden("Недостатньо прав");

  const body = await readBody(req);
  const name = (body?.name ?? "").toString().trim();
  if (name.length < 2) return badRequest("Назва міста занадто коротка");

  const id = slugify(name);
  if (!id) return badRequest("Не вдалося згенерувати slug");

  const exists = await prisma.city.findUnique({ where: { id } });
  if (exists) return conflict("Місто з таким ID вже існує");

  const created = await prisma.city.create({ data: { id, name } });
  return json({ city: created }, 201);
}
