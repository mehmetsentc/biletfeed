import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { generateOrganizerInvitationPdf } from '@/lib/services/invitation-pdf';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const ctx = await requireOrganizerSession();
  if (!ctx) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { id } = await params;
  const pdf = await generateOrganizerInvitationPdf(id, ctx.organizer.id);
  if (!pdf) {
    return NextResponse.json({ error: 'Davetiye bulunamadı' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(pdf.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${pdf.filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
