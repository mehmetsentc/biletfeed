import { cookies } from 'next/headers';
import {
  buildSignedSessionToken,
  verifySignedSessionToken
} from '@/lib/auth/session-crypto';
import { getSessionCookieOptions } from '@/lib/auth/session-cookie';

export const SCANNER_GATE_SCOPE_COOKIE = 'scanner_gate_scope';

export type GateScope = {
  eventId: string;
  organizerId: string;
  exp: number;
};

export function buildGateScopeToken(scope: GateScope): string {
  return buildSignedSessionToken(scope as unknown as Record<string, unknown>);
}

export function verifyGateScopeToken(token: string): GateScope | null {
  const parsed = verifySignedSessionToken(token);
  if (!parsed) return null;

  const eventId = parsed.eventId;
  const organizerId = parsed.organizerId;
  const exp = parsed.exp;

  if (typeof eventId !== 'string' || typeof organizerId !== 'string') return null;
  if (typeof exp !== 'number' || Date.now() >= exp) return null;

  return { eventId, organizerId, exp };
}

export async function readGateScopeFromCookies(): Promise<GateScope | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(SCANNER_GATE_SCOPE_COOKIE)?.value;
    if (!raw) return null;
    return verifyGateScopeToken(raw);
  } catch {
    return null;
  }
}

export function gateScopeCookieOptions(maxAgeSeconds: number) {
  return getSessionCookieOptions(maxAgeSeconds);
}

export function clearedGateScopeCookieOptions() {
  return {
    ...getSessionCookieOptions(0),
    maxAge: 0
  };
}
