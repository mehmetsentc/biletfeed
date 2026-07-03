import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isSameOriginRequest } from '@/lib/auth/csrf';

/** Tarayıcı oturumu ile yapılan admin mutasyonları için CSRF kontrolü. */
export function rejectAdminCsrf(request: NextRequest): NextResponse | null {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }
  return null;
}
