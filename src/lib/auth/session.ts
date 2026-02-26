import crypto from "crypto";
import type { Role } from "@/lib/auth/rbac";

export const SESSION_COOKIE = "mozi_session";
export const AUTH_COOKIE_DOMAIN = (process.env.AUTH_COOKIE_DOMAIN || "").toString().trim();

export type SessionPayload = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  exp: number; // epoch ms
};

function getSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev_secret_change_me"
  );
}

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function unbase64url(str: string) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(data: string) {
  return base64url(crypto.createHmac("sha256", getSecret()).update(data).digest());
}

export function encodeSession(payload: SessionPayload) {
  const body = base64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function decodeSession(token: string): SessionPayload | null {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = sign(body);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    const json = unbase64url(body).toString("utf8");
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload?.uid || !payload?.exp) return null;
    if (Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader: string | null) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

export function getSessionFromRequest(req: Request): SessionPayload | null {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return decodeSession(token);
}

export function cookieString(token: string, maxAgeSeconds: number) {
  const isProd = process.env.NODE_ENV === "production";
  const domain = AUTH_COOKIE_DOMAIN ? `; Domain=${AUTH_COOKIE_DOMAIN}` : "";
  const base = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${domain}`;
  return isProd ? `${base}; Secure` : base;
}

export function clearCookieString() {
  const isProd = process.env.NODE_ENV === "production";
  const domain = AUTH_COOKIE_DOMAIN ? `; Domain=${AUTH_COOKIE_DOMAIN}` : "";
  const base = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${domain}`;
  return isProd ? `${base}; Secure` : base;
}