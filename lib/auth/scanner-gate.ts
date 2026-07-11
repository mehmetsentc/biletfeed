import { randomInt } from 'crypto';
import type { UserRole } from '@/types';
import { buildSessionCookie, SESSION_EXPIRES_MS } from '@/lib/auth/session';
import { getRedisClient } from '@/lib/redis';

export const SCANNER_GATE_MAX_ACTIVE_CODES = 10;
export const SCANNER_GATE_CODE_TTL_SEC = 12 * 60 * 60;

type GateCodePayload = {
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
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

function generateNumericCode(): string {
  return String(randomInt(100_000, 1_000_000));
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

async function storeGateCode(
  organizerId: string,
  code: string,
  payload: GateCodePayload
): Promise<void> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(payload);

  if (redis) {
    await redis.set(codeKey(code), serialized, { ex: SCANNER_GATE_CODE_TTL_SEC });
    await redis.sadd(orgCodesKey(organizerId), code);
    await redis.expire(orgCodesKey(organizerId), SCANNER_GATE_CODE_TTL_SEC);
    return;
  }

  memoryCodes.set(code, {
    payload,
    expiresAt: Date.now() + SCANNER_GATE_CODE_TTL_SEC * 1000
  });
  const orgSet = memoryOrgCodes.get(organizerId) ?? new Set<string>();
  orgSet.add(code);
  memoryOrgCodes.set(organizerId, orgSet);
}

async function readGateCode(code: string): Promise<GateCodePayload | null> {
  const normalized = code.trim();
  if (!/^\d{6}$/.test(normalized)) return null;

  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get<string>(codeKey(normalized));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GateCodePayload;
    } catch {
      return null;
    }
  }

  const entry = memoryCodes.get(normalized);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryCodes.delete(normalized);
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
}): Promise<{ code: string; expiresAt: Date }> {
  const active = await countActiveGateCodes(params.organizerId);
  if (active >= SCANNER_GATE_MAX_ACTIVE_CODES) {
    throw new Error(
      `En fazla ${SCANNER_GATE_MAX_ACTIVE_CODES} aktif kapı kodu olabilir. Süresi dolan kodları bekleyin veya yenileyin.`
    );
  }

  let code = generateNumericCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await readGateCode(code);
    if (!existing) break;
    code = generateNumericCode();
  }

  const payload: GateCodePayload = {
    organizerId: params.organizerId,
    uid: params.uid,
    email: params.email,
    role: params.role,
    createdAt: new Date().toISOString()
  };

  await storeGateCode(params.organizerId, code, payload);

  return {
    code,
    expiresAt: new Date(Date.now() + SCANNER_GATE_CODE_TTL_SEC * 1000)
  };
}

export async function listScannerGateCodes(organizerId: string): Promise<
  Array<{ code: string; expiresAt: Date; createdAt: string }>
> {
  const redis = getRedisClient();
  const results: Array<{ code: string; expiresAt: Date; createdAt: string }> = [];

  if (redis) {
    const codes = await redis.smembers<string[]>(orgCodesKey(organizerId));
    if (!codes?.length) return results;

    for (const code of codes) {
      const raw = await redis.get<string>(codeKey(code));
      if (!raw) {
        await redis.srem(orgCodesKey(organizerId), code);
        continue;
      }
      try {
        const payload = JSON.parse(raw) as GateCodePayload;
        results.push({
          code,
          createdAt: payload.createdAt,
          expiresAt: new Date(
            new Date(payload.createdAt).getTime() + SCANNER_GATE_CODE_TTL_SEC * 1000
          )
        });
      } catch {
        // skip invalid
      }
    }
    return results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  pruneMemoryOrgCodes(organizerId);
  const codes = memoryOrgCodes.get(organizerId);
  if (!codes) return results;

  for (const code of codes) {
    const entry = memoryCodes.get(code);
    if (!entry) continue;
    results.push({
      code,
      createdAt: entry.payload.createdAt,
      expiresAt: new Date(entry.expiresAt)
    });
  }

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function redeemScannerGateCode(code: string): Promise<{
  sessionCookie: string;
  email: string;
  organizerId: string;
} | null> {
  const payload = await readGateCode(code);
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
