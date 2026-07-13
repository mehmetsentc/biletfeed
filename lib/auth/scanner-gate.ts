import { randomInt } from 'crypto';
import type { UserRole } from '@/types';
import { buildSessionCookie, SESSION_EXPIRES_MS } from '@/lib/auth/session';
import {
  buildSignedSessionToken,
  verifySignedSessionToken
} from '@/lib/auth/session-crypto';
import { getRedisClient } from '@/lib/redis';

export const SCANNER_GATE_MAX_ACTIVE_CODES = 10;
export const SCANNER_GATE_CODE_TTL_SEC = 72 * 60 * 60;

const GATE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type GateCodePayloadV1 = {
  v: 1;
  pin: string;
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
  exp: number;
  createdAt: string;
};

type GateCodePayloadV2 = {
  v: 2;
  g: string;
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
  exp: number;
  createdAt: string;
};

type GateCodePayload = GateCodePayloadV1 | GateCodePayloadV2;

type MemoryGateEntry = {
  payload: GateCodePayload;
  expiresAt: number;
};

const memoryCodes = new Map<string, MemoryGateEntry>();
const memoryOrgCodes = new Map<string, Set<string>>();

const VALID_ROLES = new Set<UserRole>([
  'ROLE_SUPER_ADMIN',
  'ROLE_ADMIN',
  'ROLE_ORGANIZER',
  'ROLE_USER'
]);

function codeKey(code: string): string {
  return `bf:scanner-gate:code:${code}`;
}

function orgCodesKey(organizerId: string): string {
  return `bf:scanner-gate:org:${organizerId}`;
}

function generateGateId(): string {
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += GATE_CODE_ALPHABET[randomInt(GATE_CODE_ALPHABET.length)];
  }
  return code;
}

function payloadGateId(payload: GateCodePayload): string {
  return payload.v === 2 ? payload.g : payload.pin;
}

function buildRedeemCode(payload: GateCodePayload): string {
  const gateId = payloadGateId(payload);
  const token = buildSignedSessionToken(payload as unknown as Record<string, unknown>);
  return `${gateId}.${token}`;
}

function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && VALID_ROLES.has(role as UserRole);
}

function isPayloadExpired(exp: unknown): boolean {
  return typeof exp !== 'number' || Date.now() >= exp;
}

function normalizeGatePayload(parsed: Record<string, unknown>): GateCodePayload | null {
  if (parsed.v === 2) {
    const gateId = parsed.g;
    if (typeof gateId !== 'string' || !/^[A-Z2-9]{8}$/i.test(gateId)) return null;
    if (
      !parsed.organizerId ||
      !parsed.uid ||
      !parsed.email ||
      !isValidRole(parsed.role)
    ) {
      return null;
    }
    if (isPayloadExpired(parsed.exp)) return null;
    return parsed as unknown as GateCodePayloadV2;
  }

  if (parsed.v === 1) {
    const pin = parsed.pin;
    if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) return null;
    if (
      !parsed.organizerId ||
      !parsed.uid ||
      !parsed.email ||
      !isValidRole(parsed.role)
    ) {
      return null;
    }
    if (isPayloadExpired(parsed.exp)) return null;
    return parsed as unknown as GateCodePayloadV1;
  }

  return null;
}

function parseSignedRedeemCode(input: string): GateCodePayload | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^([A-Z2-9]{8}|\d{6})\.(.+)$/i);
  if (!match) return null;

  const [, gateId, token] = match;
  const parsed = verifySignedSessionToken(token);
  if (!parsed) return null;

  const payload = normalizeGatePayload(parsed);
  if (!payload) return null;

  const expectedId = payloadGateId(payload);
  if (expectedId.toUpperCase() !== gateId.toUpperCase()) return null;

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
  gateId: string,
  payload: GateCodePayload
): Promise<void> {
  const redis = getRedisClient();
  const serialized = JSON.stringify(payload);

  if (redis) {
    await redis.set(codeKey(gateId), serialized, { ex: SCANNER_GATE_CODE_TTL_SEC });
    await redis.sadd(orgCodesKey(organizerId), gateId);
    await redis.expire(orgCodesKey(organizerId), SCANNER_GATE_CODE_TTL_SEC);
    return;
  }

  memoryCodes.set(gateId, {
    payload,
    expiresAt: payload.exp
  });
  const orgSet = memoryOrgCodes.get(organizerId) ?? new Set<string>();
  orgSet.add(gateId);
  memoryOrgCodes.set(organizerId, orgSet);
}

async function readLegacyGateId(gateId: string): Promise<GateCodePayload | null> {
  const normalized = gateId.trim().toUpperCase();
  if (!/^[A-Z2-9]{8}$/.test(normalized)) return null;

  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get<string>(codeKey(normalized));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return normalizeGatePayload(parsed);
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

async function readLegacyPin(pin: string): Promise<GateCodePayload | null> {
  if (!/^\d{6}$/.test(pin)) return null;

  const redis = getRedisClient();
  if (redis) {
    const raw = await redis.get<string>(codeKey(pin));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return normalizeGatePayload(parsed);
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

type ValidGateEntry = { gateId: string; payload: GateCodePayload };

async function loadValidGateEntries(organizerId: string): Promise<ValidGateEntry[]> {
  const redis = getRedisClient();
  if (redis) {
    const codes = await redis.smembers<string[]>(orgCodesKey(organizerId));
    if (!codes?.length) return [];

    const valid: ValidGateEntry[] = [];
    for (const gateId of codes) {
      const raw = await redis.get<string>(codeKey(gateId));
      if (!raw) {
        await redis.srem(orgCodesKey(organizerId), gateId);
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const payload = normalizeGatePayload(parsed);
        if (!payload) {
          await redis.del(codeKey(gateId));
          await redis.srem(orgCodesKey(organizerId), gateId);
          continue;
        }
        valid.push({ gateId, payload });
      } catch {
        await redis.del(codeKey(gateId));
        await redis.srem(orgCodesKey(organizerId), gateId);
      }
    }
    return valid;
  }

  pruneMemoryOrgCodes(organizerId);
  const codes = memoryOrgCodes.get(organizerId);
  if (!codes) return [];

  const valid: ValidGateEntry[] = [];
  for (const gateId of codes) {
    const entry = memoryCodes.get(gateId);
    if (!entry || entry.expiresAt <= Date.now()) {
      codes.delete(gateId);
      memoryCodes.delete(gateId);
      continue;
    }
    valid.push({ gateId, payload: entry.payload });
  }
  return valid;
}

async function countActiveGateCodes(organizerId: string): Promise<number> {
  const valid = await loadValidGateEntries(organizerId);
  return valid.length;
}

/** Remove expired or orphaned entries from the org gate-code set (Redis or memory). */
export async function pruneStaleScannerGateCodes(
  organizerId: string
): Promise<{ removed: number; remaining: number }> {
  const redis = getRedisClient();
  if (redis) {
    const before = (await redis.smembers<string[]>(orgCodesKey(organizerId)))?.length ?? 0;
    const valid = await loadValidGateEntries(organizerId);
    return { removed: before - valid.length, remaining: valid.length };
  }

  const before = memoryOrgCodes.get(organizerId)?.size ?? 0;
  const valid = await loadValidGateEntries(organizerId);
  return { removed: before - valid.length, remaining: valid.length };
}

export function normalizeScannerGateInput(input: string): string {
  const trimmed = input.trim();
  const gateParam = trimmed.match(/[?&]gate=([^&#]+)/i)?.[1];
  if (gateParam) {
    return decodeURIComponent(gateParam).trim().replace(/\s+/g, '');
  }
  return trimmed.replace(/\s+/g, '');
}

export function isSixDigitGateInput(input: string): boolean {
  return /^\d{6}$/.test(normalizeScannerGateInput(input));
}

export function isShortGateIdInput(input: string): boolean {
  return /^[A-Z2-9]{8}$/i.test(normalizeScannerGateInput(input));
}

export async function createScannerGateCode(params: {
  organizerId: string;
  uid: string;
  email: string;
  role: UserRole;
}): Promise<{ pin: string; redeemCode: string; expiresAt: Date }> {
  const exp = Date.now() + SCANNER_GATE_CODE_TTL_SEC * 1000;
  let gateId = generateGateId();

  const payload: GateCodePayloadV2 = {
    v: 2,
    g: gateId,
    organizerId: params.organizerId,
    uid: params.uid,
    email: params.email,
    role: params.role,
    exp,
    createdAt: new Date().toISOString()
  };

  let redeemCode = buildRedeemCode(payload);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (parseSignedRedeemCode(redeemCode)) break;
    gateId = generateGateId();
    payload.g = gateId;
    redeemCode = buildRedeemCode(payload);
  }

  if (!parseSignedRedeemCode(redeemCode)) {
    throw new Error('Kapı kodu oluşturulamadı. Tekrar deneyin.');
  }

  const redis = getRedisClient();
  if (redis) {
    await pruneStaleScannerGateCodes(params.organizerId);
    const active = await countActiveGateCodes(params.organizerId);
    if (active < SCANNER_GATE_MAX_ACTIVE_CODES) {
      await storeGateCodeLegacy(params.organizerId, gateId, payload);
    }
  } else {
    pruneMemoryOrgCodes(params.organizerId);
    const active = memoryOrgCodes.get(params.organizerId)?.size ?? 0;
    if (active < SCANNER_GATE_MAX_ACTIVE_CODES) {
      await storeGateCodeLegacy(params.organizerId, gateId, payload);
    }
  }

  return {
    pin: gateId,
    redeemCode,
    expiresAt: new Date(exp)
  };
}

export async function listScannerGateCodes(organizerId: string): Promise<
  Array<{ pin: string; redeemCode?: string; expiresAt: Date; createdAt: string }>
> {
  const valid = await loadValidGateEntries(organizerId);
  return valid
    .map(({ payload }) => ({
      pin: payloadGateId(payload),
      redeemCode: buildRedeemCode(payload),
      createdAt: payload.createdAt,
      expiresAt: new Date(payload.exp)
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function redeemScannerGateCode(input: string): Promise<{
  sessionCookie: string;
  email: string;
  organizerId: string;
} | null> {
  const trimmed = normalizeScannerGateInput(input);
  const signed = parseSignedRedeemCode(trimmed);
  const payload =
    signed ??
    (await readLegacyGateId(trimmed)) ??
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
