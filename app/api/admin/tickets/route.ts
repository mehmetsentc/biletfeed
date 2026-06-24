import { NextRequest, NextResponse } from 'next/server';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';
import { searchAdminTickets } from '@/lib/services/ticket-admin';

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ tickets: [] });
  }

  const tickets = await searchAdminTickets(q);
  return NextResponse.json({ tickets });
}
