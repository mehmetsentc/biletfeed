import { createHmac, timingSafeEqual } from 'crypto';

/** Oturum imzalama — TICKET_SECRET_KEY ile karıştırılmaz */
export function getSessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET yapılandırılmamış');
  }
  return 'dev-session-secret-local-only';
}

export function signSessionPayload(b64: string): string {
  return createHmac('sha256', getSessionSecret()).update(b64).digest('hex');
}

export function verifySessionSignature(b64: string, sig: string): boolean {
  try {
    const expected = signSessionPayload(b64);
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(sig, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function buildSignedSessionToken(
  payload: Record<string, unknown>
): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${b64}.${signSessionPayload(b64)}`;
}
