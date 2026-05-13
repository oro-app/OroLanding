import crypto from 'node:crypto';

export type SignedToken = { email: string; ts: number };

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

function fromB64url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signUnsubscribeToken(email: string, secret: string, now = Date.now()): string {
  const normalized = email.trim().toLowerCase();
  const ts = Math.floor(now / 1000);
  const payload = `${normalized}.${ts}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${b64url(normalized)}.${ts}.${sig}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secrets: string | string[],
): SignedToken | null {
  const candidates = (Array.isArray(secrets) ? secrets : [secrets]).filter((s) => s.length > 0);
  if (candidates.length === 0) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [emailEncoded, tsStr, sig] = parts;
  const email = fromB64url(emailEncoded);
  const ts = Number(tsStr);
  if (!email || !Number.isFinite(ts)) return null;

  const a = Buffer.from(sig, 'hex');
  for (const secret of candidates) {
    const expected = crypto.createHmac('sha256', secret).update(`${email}.${ts}`).digest('hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) continue;
    if (crypto.timingSafeEqual(a, b)) return { email, ts };
  }
  return null;
}
