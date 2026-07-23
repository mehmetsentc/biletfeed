import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import { checkInvoiceTaxpayer } from '@/lib/accounting/einvoice/taxpayer';

const bodySchema = z.object({
  force: z.boolean().optional()
});

interface RouteParams {
  params: Promise<{ invoiceId: string }>;
}

/** Admin: alıcı mükellef / belge tipi önerisi (heuristic + metadata cache) */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { invoiceId } = await params;
  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }

  const { result, cached } = await checkInvoiceTaxpayer({
    invoiceId,
    force: parsed.data.force
  });

  if (!result.ok && result.error) {
    const status = result.error.includes('bulunamadı') ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true, cached, ...result });
}
