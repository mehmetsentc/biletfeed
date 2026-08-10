import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';

export type ParasutTokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

type TokenCache = ParasutTokenBundle | null;

let memoryCache: TokenCache = null;

function formBody(data: Record<string, string>): URLSearchParams {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(data)) body.set(k, v);
  return body;
}

function basicAuthHeader(clientId: string, clientSecret: string): string {
  const raw = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
}

/**
 * Paraşüt Doorkeeper: client_id/secret form body ile 401 invalid_client veriyor.
 * Client kimliği HTTP Basic ile gönderilmeli.
 */
async function requestToken(
  config: ParasutConfig,
  body: Record<string, string>
): Promise<ParasutTokenBundle> {
  const res = await fetch(`${config.oauthBaseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: basicAuthHeader(config.clientId, config.clientSecret)
    },
    body: formBody(body)
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err =
      typeof json.error_description === 'string'
        ? json.error_description
        : typeof json.error === 'string'
          ? json.error
          : `Paraşüt OAuth ${res.status}`;
    throw new Error(err);
  }
  const accessToken = String(json.access_token ?? '');
  const refreshToken = String(json.refresh_token ?? '');
  const expiresIn = Number(json.expires_in ?? 7200);
  if (!accessToken) throw new Error('Paraşüt access_token alınamadı');
  return {
    accessToken,
    refreshToken,
    // 60s safety margin
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000
  };
}

export async function getParasutAccessToken(
  config: ParasutConfig
): Promise<string> {
  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return memoryCache.accessToken;
  }

  if (memoryCache?.refreshToken) {
    try {
      memoryCache = await requestToken(config, {
        grant_type: 'refresh_token',
        refresh_token: memoryCache.refreshToken
      });
      return memoryCache.accessToken;
    } catch {
      memoryCache = null;
    }
  }

  memoryCache = await requestToken(config, {
    grant_type: 'password',
    username: config.username,
    password: config.password,
    redirect_uri: config.redirectUri
  });
  return memoryCache.accessToken;
}

/** Test / hot-reload */
export function clearParasutTokenCache(): void {
  memoryCache = null;
}
