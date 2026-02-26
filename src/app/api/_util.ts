import { NextResponse } from "next/server";

export function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readBody(req: Request) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function badRequest(message = "Bad Request", details?: any) {
  return json({ error: message, details }, 400);
}

export function notFound(message = "Not Found") {
  return json({ error: message }, 404);
}

export function conflict(message = "Conflict") {
  return json({ error: message }, 409);
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: message }, 401);
}

export function forbidden(message = "Forbidden") {
  return json({ error: message }, 403);
}
