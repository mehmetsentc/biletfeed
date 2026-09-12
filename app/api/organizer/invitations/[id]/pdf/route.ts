import { NextRequest, NextResponse } from 'next/server';
import { requireOrganizerSession } from '@/lib/auth/organizer-api';
import { generateOrganizerInvitationPdfs } from '@/lib/services/invitation-pdf';
import {
  bundleNamedPdfs,
  buildInvitationZipFilename
} from '@/lib/tickets/pdf/zip-pdfs';

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
  const pdfs = await generateOrganizerInvitationPdfs(id, ctx.organizer.id);
  const bundled = await bundleNamedPdfs(
    pdfs.map((pdf) => ({ filename: pdf.filename, content: pdf.buffer })),
    buildInvitationZipFilename(pdfs[0]?.eventTitle ?? 'davetiye')
  );
  if (!bundled) {
    return NextResponse.json({ error: 'Davetiye bulunamadı' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bundled.buffer), {
    headers: {
      'Content-Type': bundled.contentType,
      'Content-Disposition': `attachment; filename="${bundled.filename}"`,
      'Cache-Control': 'private, no-store'
    }
  });
}
