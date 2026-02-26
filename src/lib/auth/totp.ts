import crypto from "crypto";

// Minimal TOTP (RFC 6238) implementation for Node.js runtime.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";

  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

function base32Decode(str: string) {
  const clean = str.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];

  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

function hotp(secret: Buffer, counter: number) {
  const msg = Buffer.alloc(8);
  // big-endian 64-bit integer
  for (let i = 7; i >= 0; i--) {
    msg[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }

  const h = crypto.createHmac("sha1", secret).update(msg).digest();
  const offset = h[h.length - 1] & 0x0f;
  const code =
    ((h[offset] & 0x7f) << 24) |
    ((h[offset + 1] & 0xff) << 16) |
    ((h[offset + 2] & 0xff) << 8) |
    (h[offset + 3] & 0xff);

  return code;
}

export function totpToken(secretBase32: string, nowMs = Date.now(), stepSeconds = 30, digits = 6) {
  const secret = base32Decode(secretBase32);
  const counter = Math.floor(nowMs / 1000 / stepSeconds);
  const code = hotp(secret, counter) % 10 ** digits;
  return String(code).padStart(digits, "0");
}

export function verifyTotp(secretBase32: string, token: string, window = 1) {
  const t = String(token || "").replace(/\s+/g, "");
  if (!/^[0-9]{6}$/.test(t)) return false;
  const now = Date.now();
  for (let w = -window; w <= window; w++) {
    const candidate = totpToken(secretBase32, now + w * 30_000);
    if (candidate === t) return true;
  }
  return false;
}

export function buildOtpAuthUri(opts: { issuer: string; label: string; secret: string }) {
  const issuer = encodeURIComponent(opts.issuer);
  const label = encodeURIComponent(opts.label);
  const secret = encodeURIComponent(opts.secret);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
