import { NextRequest, NextResponse } from 'next/server';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { startInvoiceSmsSign } from '@/lib/accounting/einvoice/sms';

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: GİB SMS imza kodu gönder */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const result = await startInvoiceSmsSign(invoiceId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'SMS başlatılamadı' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    oid: result.oid,
    phoneMasked: result.phoneMasked
  });
}
