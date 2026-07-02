import type { User } from '@/types';

async function fetchFromEndpoint(endpoint: string): Promise<User | null> {
  try {
    const res = await fetch(endpoint, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: User | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function fetchSessionUser(): Promise<User | null> {
  return fetchFromEndpoint('/api/auth/me');
}

export async function fetchPanelSessionUser(): Promise<User | null> {
  return fetchFromEndpoint('/api/auth/panel-me');
}

