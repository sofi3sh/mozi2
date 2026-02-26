import crypto from "crypto";

// Простий, але надійний хеш паролю через scrypt.
// Формат: scrypt$N$r$p$saltB64$hashB64

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;

function b64(buf: Buffer) {
  return buf.toString("base64");
}

function fromB64(s: string) {
  return Buffer.from(s, "base64");
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) => {
      if (err) reject(err);
      else resolve(key as Buffer);
    });
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64(salt)}$${b64(derived)}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6) return false;
    const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
    const N = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

    const salt = fromB64(saltB64);
    const expected = fromB64(hashB64);

    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, expected.length, { N, r, p }, (err, key) => {
        if (err) reject(err);
        else resolve(key as Buffer);
      });
    });

    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
