import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { verifySessionCookie } from '@/lib/auth/session';
import { getTicketById } from '@/lib/services/tickets';
import { formatEventDate, formatEventTime } from '@/lib/data/mock-events';

interface RouteParams {
  params: Promise<{ ticketId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ error: 'Giriş gerekli' }, { status: 401 });
  }

  const { ticketId } = await params;
  const ticket = await getTicketById(ticketId, session.uid);
  if (!ticket) {
    return NextResponse.json({ error: 'Bilet bulunamadı' }, { status: 404 });
  }

  const qrSvg = await QRCode.toString(ticket.qrData, { type: 'svg', margin: 1, width: 200 });
  const date = formatEventDate(ticket.eventDate);
  const time = formatEventTime(ticket.eventDate);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="640" viewBox="0 0 400 640">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c1017"/>
      <stop offset="100%" stop-color="#151b24"/>
    </linearGradient>
  </defs>
  <rect width="400" height="640" rx="24" fill="url(#g)"/>
  <text x="24" y="40" fill="#fff" font-family="system-ui,sans-serif" font-size="18" font-weight="700">bilet<tspan fill="#f5a623">feed</tspan></text>
  <text x="24" y="80" fill="#fff" font-family="system-ui,sans-serif" font-size="16" font-weight="700">${escapeXml(ticket.eventTitle.slice(0, 40))}</text>
  <text x="24" y="108" fill="#aaa" font-family="system-ui,sans-serif" font-size="12">${escapeXml(ticket.ticketType)}</text>
  <text x="24" y="132" fill="#ccc" font-family="system-ui,sans-serif" font-size="11">${escapeXml(date)} · ${escapeXml(time)}</text>
  <text x="24" y="154" fill="#ccc" font-family="system-ui,sans-serif" font-size="11">${escapeXml(`${ticket.venue}, ${ticket.city}`)}</text>
  <rect x="90" y="180" width="220" height="220" rx="16" fill="#fff"/>
  <g transform="translate(100,190)">${qrSvg.replace(/<\?xml[^?]*\?>/, '').replace('<svg', '<g').replace('</svg>', '</g>')}</g>
  <text x="200" y="440" fill="#fff" font-family="monospace" font-size="16" font-weight="700" text-anchor="middle" letter-spacing="3">${escapeXml(ticket.code)}</text>
  <text x="200" y="470" fill="#666" font-family="system-ui,sans-serif" font-size="10" text-anchor="middle">Powered by BiletFeed</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="bilet-${ticket.code}.svg"`
    }
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
