import type { User } from '@/types';

export async function fetchSessionUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', {
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
