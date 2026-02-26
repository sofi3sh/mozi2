import { json } from "../../_util";
import { clearCookieString } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": clearCookieString(),
    },
  });
}

// convenience (optional)
export async function GET() {
  return POST();
}
