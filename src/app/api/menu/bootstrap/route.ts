import { prisma } from "@/lib/prisma";
import { badRequest } from "../../_util";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

export const runtime = "nodejs";

function cleanId(v: string | null) {
  return (v || "").toString().trim();
}

function sha1(s: string) {
  return createHash("sha1").update(s).digest("hex");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cityId = cleanId(searchParams.get("cityId"));
  const venueId = cleanId(searchParams.get("venueId"));

  if (!cityId && !venueId) {
    return badRequest("cityId або venueId обовʼязкові");
  }

  const where: any = {};
  if (cityId) where.cityId = cityId;
  if (venueId) where.venueId = venueId;

  const [categories, dishes, modifierGroups] = await Promise.all([
    prisma.menuCategory.findMany({
      where,
      orderBy: [{ venueId: "asc" }, { sort: "asc" }],
    }),
    prisma.dish.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.modifierGroup.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const payload = { categories, dishes, modifierGroups };
  const body = JSON.stringify(payload);
  const etag = `W/"${sha1(body)}"`;

  const inm = req.headers.get("if-none-match");
  if (inm && inm === etag) {
    const res = new NextResponse(null, { status: 304 });
    res.headers.set("ETag", etag);
    res.headers.set("Cache-Control", "public, max-age=0, s-maxage=120, stale-while-revalidate=600");
    return res;
  }

  const res = NextResponse.json(payload, { status: 200 });
  res.headers.set("ETag", etag);
  res.headers.set("Cache-Control", "public, max-age=0, s-maxage=120, stale-while-revalidate=600");
  return res;
}
