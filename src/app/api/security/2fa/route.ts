import { prisma } from "@/lib/prisma";
import { badRequest, json, readBody } from "../../_util";
import { getSessionFromRequest } from "@/lib/auth/session";
import { buildOtpAuthUri, generateTotpSecret, verifyTotp } from "@/lib/auth/totp";

export const runtime = "nodejs";

const GLOBAL_CITY_ID = "global";
const SETTINGS_SCOPE = "global";
const SETTINGS_KEY = "security";

type SecurityValue = {
  twoFactor?: {
    enabled?: boolean;
    userId?: string | null;
    secret?: string | null;
    pendingSecret?: string | null;
    pendingUserId?: string | null;
    issuer?: string | null;
  };
};

async function getSecurity() {
  const row = await prisma.setting.findUnique({
    where: { scope_cityId_key: { scope: SETTINGS_SCOPE, cityId: GLOBAL_CITY_ID, key: SETTINGS_KEY } },
  });
  const value = (row?.value ?? {}) as any;
  return { row, value: value as SecurityValue };
}

async function setSecurity(next: SecurityValue) {
  const created = await prisma.setting.upsert({
    where: { scope_cityId_key: { scope: SETTINGS_SCOPE, cityId: GLOBAL_CITY_ID, key: SETTINGS_KEY } },
    update: { value: next as any },
    create: { scope: SETTINGS_SCOPE, cityId: GLOBAL_CITY_ID, key: SETTINGS_KEY, value: next as any },
  });
  return created;
}

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "owner") return json({ enabled: false }, 200);

  const { value } = await getSecurity();
  const tf = value.twoFactor ?? {};

  return json({
    enabled: Boolean(tf.enabled && tf.userId === session.uid && tf.secret),
    pending: Boolean(tf.pendingSecret && tf.pendingUserId === session.uid),
    issuer: tf.issuer ?? "Mozi Admin",
    userId: tf.userId ?? null,
  });
}

export async function POST(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session || session.role !== "owner") return badRequest("Доступ заборонено");

  const body = await readBody(req);
  const action = (body?.action ?? "").toString();

  const issuer = "Mozi Admin";
  const label = `${issuer}:${session.email}`;

  const { value } = await getSecurity();
  const tf = value.twoFactor ?? {};

  if (action === "setup") {
    const secret = generateTotpSecret(20);

    const next: SecurityValue = {
      ...value,
      twoFactor: {
        ...(value.twoFactor ?? {}),
        enabled: false,
        userId: session.uid,
        issuer,
        secret: tf.secret ?? null,
        pendingSecret: secret,
        pendingUserId: session.uid,
      },
    };

    await setSecurity(next);
    return json({
      secret,
      otpauthUri: buildOtpAuthUri({ issuer, label, secret }),
    });
  }

  if (action === "verify") {
    const otp = (body?.otp ?? "").toString();
    const pendingSecret = tf.pendingSecret ?? null;
    const pendingUserId = tf.pendingUserId ?? null;
    if (!pendingSecret || pendingUserId !== session.uid) return badRequest("Немає налаштування для підтвердження");
    if (!verifyTotp(pendingSecret, otp)) return badRequest("Невірний код");

    const next: SecurityValue = {
      ...value,
      twoFactor: {
        ...(value.twoFactor ?? {}),
        enabled: true,
        userId: session.uid,
        issuer,
        secret: pendingSecret,
        pendingSecret: null,
        pendingUserId: null,
      },
    };
    await setSecurity(next);
    return json({ ok: true });
  }

  if (action === "disable") {
    const otp = (body?.otp ?? "").toString();
    const secret = tf.secret ?? null;
    const enabledForUser = Boolean(tf.enabled && tf.userId === session.uid && secret);
    if (!enabledForUser || !secret) return badRequest("2FA не увімкнено");
    if (!verifyTotp(secret, otp)) return badRequest("Невірний код");

    const next: SecurityValue = {
      ...value,
      twoFactor: {
        ...(value.twoFactor ?? {}),
        enabled: false,
        userId: null,
        secret: null,
        pendingSecret: null,
        pendingUserId: null,
      },
    };
    await setSecurity(next);
    return json({ ok: true });
  }

  return badRequest("Невідома дія");
}
