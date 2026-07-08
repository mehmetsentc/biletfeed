import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOriginRequest } from '@/lib/auth/csrf';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { buildInvitationsZip } from '@/lib/services/bulk-invitations';

const schema = z.object({
  invitationIds: z.array(z.string().uuid()).min(1).max(200)
});

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 403 });
  }

  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }

  const buffer = await buildInvitationsZip(parsed.data.invitationIds, ctx.organizer.id);
  const filename = `BiletFeed-Davetiyeler-${new Date().toISOString().slice(0, 10)}.zip`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
