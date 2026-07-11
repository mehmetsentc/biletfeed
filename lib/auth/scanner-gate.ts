import { randomInt } from 'crypto';
import type { UserRole } from '@/types';
import { buildSessionCookie, SESSION_EXPIRES_MS } from '@/lib/auth/session';
import {
  buildSignedSessionToken,
  verifySignedSessionToken
} from '@/lib/auth/session-crypto';
import { getRedisClient } from '@/lib/redis';

export const SCANNER_GATE_MAX_ACTIVE_CODES = 10;
export const SCANNER_GATE_CODE_TTL_SEC = 12 * 60 * 60;

type GateCodePayload = {
  v: 1;
  pin: string;
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
  exp: number;
  createdAt: string;
};

type MemoryGateEntry = {
  payload: GateCodePayload;
  expiresAt: number;
};

const memoryCodes = new Map<string, MemoryGateEntry>();
const memoryOrgCodes = new Map<string, Set<string>>();

function codeKey(code: string): string {
  return `bf:scanner-gate:code:${code}`;
}

function orgCodesKey(organizerId: string): string {
  return `bf:scanner-gate:org:${organizerId}`;
}

function generateNumericPin(): string {
  return String(randomInt(100_000, 1_000_000));
}

function buildRedeemCode(payload: GateCodePayload): string {
  const token = buildSignedSessionToken(payload as unknown as Record<string, unknown>);
  return `${payload.pin}.${token}`;
}

function parseSignedRedeemCode(input: string): GateCodePayload | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{6})\.(.+)$/);
  if (!match) return null;

  const [, pin, token] = match;
  const parsed = verifySignedSessionToken(token);
  if (!parsed || parsed.v !== 1) return null;

  const payload = parsed as unknown as GateCodePayload;
  if (payload.pin !== pin) return null;
  if (!payload.organizerId || !payload.uid || !payload.email || !payload.role) {
    return null;
  }
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;

  return payload;
}

function pruneMemoryOrgCodes(organizerId: string): void {
  const codes = memoryOrgCodes.get(organizerId);
  if (!codes) return;
  const now = Date.now();
  for (const code of codes) {
    const entry = memoryCodes.get(code);
    if (!entry || entry.expiresAt <= now) {
      codes.delete(code);
      memoryCodes.delete(code);
    }
  }
}

async function storeGateCodeLegacy(
  organizerId: string,
  pin: string,
  payload: GateCodePayload
): Promise<void> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(payload);

  if (redis) {
    await redis.set(codeKey(pin), serialized, { ex: SCANNER_GATE_CODE_TTL_SEC });
    await redis.sadd(orgCodesKey(organizerId), pin);
    await redis.expire(orgCodesKey(organizerId), SCANNER_GATE_CODE_TTL_SEC);
    return;
  }

  memoryCodes.set(pin, {
    payload,
    expiresAt: payload.exp
  });
  const orgSet = memoryOrgCodes.get(organizerId) ?? new Set<string>();
  orgSet.add(pin);
  memoryOrgCodes.set(organizerId, orgSet);
}

async function readLegacyPin(pin: string): Promise<GateCodePayload | null> {
  if (!/^\d{6}$/.test(pin)) return null;

  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get<string>(codeKey(pin));
    if (!raw) return null;
    try {
      const payload = JSON.parse(raw) as GateCodePayload;
      if (Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  const entry = memoryCodes.get(pin);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCodes.delete(pin);
    return null;
  }
  return entry.payload;
}

async function countActiveGateCodes(organizerId: string): Promise<number> {
  const redis = getRedisClient();
  if (redis) {
    const codes = await redis.smembers<string[]>(orgCodesKey(organizerId));
    if (!codes?.length) return 0;

    let active = 0;
    for (const code of codes) {
      const exists = await redis.exists(codeKey(code));
      if (exists) active += 1;
      else await redis.srem(orgCodesKey(organizerId), code);
    }
    return active;
  }

  pruneMemoryOrgCodes(organizerId);
  return memoryOrgCodes.get(organizerId)?.size ?? 0;
}

export async function createScannerGateCode(params: {
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
}): Promise<{ pin: string; redeemCode: string; expiresAt: Date }> {
  const redis = getRedisClient();
  if (redis) {
    const active = await countActiveGateCodes(params.organizerId);
    if (active >= SCANNER_GATE_MAX_ACTIVE_CODES) {
      throw new Error(
        `En fazla ${SCANNER_GATE_MAX_ACTIVE_CODES} aktif kapı kodu olabilir. Süresi dolan kodları bekleyin veya yenileyin.`
      );
    }
  }

  const exp = Date.now() + SCANNER_GATE_CODE_TTL_SEC * 1000;
  let pin = generateNumericPin();

  const payload: GateCodePayload = {
    v: 1,
    pin,
    organizerId: params.organizerId,
    uid: params.uid,
    email: params.email,
    role: params.role,
    exp,
    createdAt: new Date().toISOString()
  };

  let redeemCode = buildRedeemCode(payload);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!parseSignedRedeemCode(redeemCode)) break;
    pin = generateNumericPin();
    payload.pin = pin;
    redeemCode = buildRedeemCode(payload);
  }

  if (redis) {
    await storeGateCodeLegacy(params.organizerId, pin, payload);
  }

  return {
    pin,
    redeemCode,
    expiresAt: new Date(exp)
  };
}

export async function listScannerGateCodes(organizerId: string): Promise<
  Array<{ pin: string; redeemCode?: string; expiresAt: Date; createdAt: string }>
> {
  const redis = getRedisClient();
  const results: Array<{
    pin: string;
    redeemCode?: string;
    expiresAt: Date;
    createdAt: string;
  }> = [];

  if (redis) {
    const codes = await redis.smembers<string[]>(orgCodesKey(organizerId));
    if (!codes?.length) return results;

    for (const pin of codes) {
      const raw = await redis.get<string>(codeKey(pin));
      if (!raw) {
        await redis.srem(orgCodesKey(organizerId), pin);
        continue;
      }
      try {
        const payload = JSON.parse(raw) as GateCodePayload;
        if (Date.now() > payload.exp) continue;
        results.push({
          pin,
          redeemCode: buildRedeemCode(payload),
          createdAt: payload.createdAt,
          expiresAt: new Date(payload.exp)
        });
      } catch {
        // skip invalid
      }
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return results;
}

export async function redeemScannerGateCode(input: string): Promise<{
  sessionCookie: string;
  email: string;
  organizerId: string;
} | null> {
  const trimmed = input.trim();
  const signed = parseSignedRedeemCode(trimmed);
  const payload =
    signed ??
    (await readLegacyPin(trimmed.replace(/\D/g, '').slice(0, 6)));
  if (!payload) return null;

  const sessionCookie = buildSessionCookie(
    payload.uid,
    payload.email,
    payload.role,
    SESSION_EXPIRES_MS
  );

  return {
    sessionCookie,
    email: payload.email,
    organizerId: payload.organizerId
  };
}
