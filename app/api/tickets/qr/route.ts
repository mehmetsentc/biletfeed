import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getPublicTicketByCode } from '@/lib/services/tickets';
import { rateLimitOrNullAsync } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

/** E-posta istemcileri data: URI QR’ı engeller — HTTPS PNG. */
export async function GET(request: NextRequest) {
  const limited = await rateLimitOrNullAsync(request, 'ticket-qr-public', 60, 60_000);
  if (limited) return limited;

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code')?.trim() ?? '';
  const token = searchParams.get('token')?.trim() ?? '';
  const id = searchParams.get('id')?.trim() ?? '';

  if (!code || !token || !id) {
    return NextResponse.json({ error: 'Geçersiz bilet bağlantısı' }, { status: 400 });
  }

  const ticket = await getPublicTicketByCode(code, token, id);
  if (!ticket) {
    return NextResponse.json({ error: 'Bilet bulunamadı' }, { status: 404 });
  }

  const png = await QRCode.toBuffer(ticket.qrData, {
    type: 'png',
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#111111', light: '#ffffff' }
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': `inline; filename="${ticket.ticketCode}.png"`
    }
  });
}
