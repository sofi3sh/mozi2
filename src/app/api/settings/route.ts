import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../_util";

export const runtime = "nodejs";

/**
 * На shared-хостингах MySQL часто не любить nullable поля в @@unique.
 * Ми використовуємо "global" як cityId для глобальних налаштувань.
 */
const GLOBAL_CITY_ID = "global";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "global";
  const cityParam = searchParams.get("cityId"); // undefined => default

  const where: any = { scope };

  if (scope === "global") {
    // для глобальних налаштувань cityId завжди "global"
    where.cityId = GLOBAL_CITY_ID;
  } else {
    // scope === "city" або інші: можна відфільтрувати по місту, або отримати всі
    if (cityParam !== null && cityParam !== undefined && cityParam !== "") {
      where.cityId = cityParam === "null" ? GLOBAL_CITY_ID : cityParam;
    }
  }

  const settings = await prisma.setting.findMany({
    where,
    orderBy: [{ cityId: "asc" }, { key: "asc" }],
  });

  return json({ settings });
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const scope = (body?.scope ?? "global").toString();
  let cityId = (body?.cityId ?? "").toString();
  const key = (body?.key ?? "").toString();
  const value = body?.value ?? {};

  if (!key) return badRequest("key обовʼязковий");

  if (scope === "global") {
    cityId = GLOBAL_CITY_ID;
  } else {
    if (!cityId) return badRequest("cityId обовʼязковий для scope=city");
  }

  const created = await prisma.setting.upsert({
    where: { scope_cityId_key: { scope, cityId, key } },
    update: { value },
    create: { scope, cityId, key, value },
  });

  return json({ setting: created }, 201);
}
