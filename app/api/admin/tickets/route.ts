import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRead } from '@/lib/auth/guard-admin-api';
import { searchAdminTickets } from '@/lib/services/ticket-admin';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('tickets.view');
  if ('error' in guard) return guard.error;

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ tickets: [] });
  }

  const tickets = await searchAdminTickets(q);
  return NextResponse.json({ tickets });
}
