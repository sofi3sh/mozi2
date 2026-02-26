import { prisma } from "@/lib/prisma";
import { badRequest, conflict, json, readBody } from "../_util";

export const runtime = "nodejs";

export async function GET() {
  const items = await prisma.catalogItem.findMany({ orderBy: { name: "asc" } });
  const venueTypes = items.filter((i) => i.kind === "venueType").map((i) => ({ id: i.id, name: i.name }));
  const cuisineTypes = items.filter((i) => i.kind === "cuisineType").map((i) => ({ id: i.id, name: i.name }));
  return json({ venueTypes, cuisineTypes });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const kind = (body?.kind ?? "").toString();
  const name = (body?.name ?? "").toString().trim();
  if (!["venueType", "cuisineType"].includes(kind)) return badRequest("Невірний kind");
  if (!name) return badRequest("Порожня назва");

  const id = typeof body?.id === "string" ? body.id : undefined;

  try {
    const created = await prisma.catalogItem.create({ data: { ...(id ? { id } : {}), kind, name } });
    return json({ item: { id: created.id, name: created.name, kind: created.kind } }, 201);
  } catch (e: any) {
    // unique constraint
    return conflict("Такий запис вже існує");
  }
}
