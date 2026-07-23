import { NextRequest, NextResponse } from 'next/server';
import { guardAdminRead } from '@/lib/auth/guard-admin-api';
import { downloadInvoicePdf } from '@/lib/accounting/einvoice/download-pdf';

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: fatura PDF (kanal veya yerel pdfkit) */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminRead('accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const result = await downloadInvoicePdf(invoiceId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  if (result.source === 'channel_url' && result.redirectUrl) {
    return NextResponse.json({
      success: true,
      source: 'channel_url',
      pdfUrl: result.redirectUrl,
      filename: result.filename
    });
  }

  if (!result.buffer) {
    return NextResponse.json({ error: 'PDF üretilemedi' }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-Invoice-Pdf-Source': result.source
    }
  });
}
