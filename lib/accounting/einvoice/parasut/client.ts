import type { ParasutConfig } from '@/lib/accounting/einvoice/parasut/config';
import { getParasutAccessToken } from '@/lib/accounting/einvoice/parasut/auth';

export type JsonApiResource = {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
  links?: Record<string, unknown>;
};

export type JsonApiDocument = {
  data?: JsonApiResource | JsonApiResource[] | null;
  included?: JsonApiResource[];
  errors?: Array<{ title?: string; detail?: string; status?: string }>;
  meta?: Record<string, unknown>;
};

export class ParasutApiError extends Error {
  status: number;
  body: JsonApiDocument | null;

  constructor(message: string, status: number, body: JsonApiDocument | null) {
    super(message);
    this.name = 'ParasutApiError';
    this.status = status;
    this.body = body;
  }
}

function formatErrors(doc: JsonApiDocument | null, fallback: string): string {
  const errs = doc?.errors;
  if (!errs?.length) return fallback;
  return errs
    .map((e) => e.detail || e.title || 'Paraşüt hatası')
    .filter(Boolean)
    .join('; ');
}

export async function parasutRequest(
  config: ParasutConfig,
  path: string,
  init?: {
    method?: string;
    query?: Record<string, string | number | undefined | null>;
    body?: unknown;
  }
): Promise<JsonApiDocument> {
  const token = await getParasutAccessToken(config);
  const url = new URL(
    path.startsWith('http')
      ? path
      : `${config.apiBaseUrl}/${config.companyId}${path.startsWith('/') ? path : `/${path}`}`
  );
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v === undefined || v === null || v === '') continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: init?.method ?? (init?.body ? 'POST' : 'GET'),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.api+json',
      'User-Agent': 'BiletFeed-Parasut/1.0',
      ...(init?.body
        ? { 'Content-Type': 'application/vnd.api+json' }
        : {})
    },
    body: init?.body ? JSON.stringify(init.body) : undefined
  });

  const json = (await res.json().catch(() => null)) as JsonApiDocument | null;
  if (!res.ok) {
    throw new ParasutApiError(
      formatErrors(json, `Paraşüt API ${res.status}`),
      res.status,
      json
    );
  }
  return json ?? {};
}

export function asSingleResource(
  doc: JsonApiDocument
): JsonApiResource | null {
  if (!doc.data || Array.isArray(doc.data)) return null;
  return doc.data;
}

export function asResourceList(doc: JsonApiDocument): JsonApiResource[] {
  if (!doc.data) return [];
  return Array.isArray(doc.data) ? doc.data : [doc.data];
}

export function attrString(
  resource: JsonApiResource | null | undefined,
  key: string
): string | null {
  const v = resource?.attributes?.[key];
  return typeof v === 'string' && v.trim() ? v : null;
}
