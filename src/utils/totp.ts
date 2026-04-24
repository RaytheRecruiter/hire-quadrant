// Zero-dependency TOTP (RFC 6238) using Web Crypto API.
// Secrets are stored/passed as base32 strings. We derive a 6-digit code
// using HMAC-SHA1 on the Unix time divided by 30s.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(bytes = 20): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base32Encode(buf);
}

function base32Encode(buf: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(str: string): Uint8Array {
  const clean = str.replace(/=+$/g, '').toUpperCase().replace(/\s/g, '');
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const c of clean) {
    const idx = BASE32_ALPHABET.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

async function hmacSha1(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(sig);
}

export async function generateTotp(secretBase32: string, atSeconds?: number): Promise<string> {
  const t = Math.floor((atSeconds ?? Date.now() / 1000) / 30);
  const counter = new Uint8Array(8);
  const view = new DataView(counter.buffer);
  view.setUint32(0, Math.floor(t / 0x100000000));
  view.setUint32(4, t & 0xffffffff);
  const key = base32Decode(secretBase32);
  const sig = await hmacSha1(key, counter);
  const offset = sig[sig.length - 1] & 0xf;
  const code =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export async function verifyTotp(secretBase32: string, token: string): Promise<boolean> {
  if (!/^\d{6}$/.test(token)) return false;
  const now = Math.floor(Date.now() / 1000);
  for (const offset of [-1, 0, 1]) {
    const candidate = await generateTotp(secretBase32, now + offset * 30);
    if (candidate === token) return true;
  }
  return false;
}

export function otpauthUri(secret: string, accountLabel: string, issuer = 'HireQuadrant'): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(accountLabel)}`;
  return `otpauth://totp/${label}?${params.toString()}`;
}

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const buf = new Uint8Array(5);
    crypto.getRandomValues(buf);
    const hex = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
    codes.push(`${hex.slice(0, 4)}-${hex.slice(4, 10)}`);
  }
  return codes;
}
