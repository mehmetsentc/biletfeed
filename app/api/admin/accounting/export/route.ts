import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  buildVatSummaryCsv,
  buildBaBsCsv,
  buildPayoutsCsv
} from '@/lib/accounting/exports';

const querySchema = z.object({
  type: z.enum(['kdv', 'ba-bs', 'payouts', 'hakedis']),
  from: z.string().optional(),
  to: z.string().optional()
});

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Admin: KDV / BA-BS / hakediş CSV export */
export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('accounting.manage');
  if ('error' in guard) return guard.error;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: url.searchParams.get('type') ?? '',
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'type=kdv|ba-bs|payouts (veya hakedis) gerekli' },
      { status: 400 }
    );
  }

  const range = {
    from: parseDate(parsed.data.from),
    to: parseDate(parsed.data.to)
  };

  let csv: string;
  let filename: string;
  switch (parsed.data.type) {
    case 'kdv':
      csv = await buildVatSummaryCsv(range);
      filename = 'kdv-ozeti.csv';
      break;
    case 'ba-bs':
      csv = await buildBaBsCsv(range);
      filename = 'ba-bs-ozeti.csv';
      break;
    case 'payouts':
    case 'hakedis':
      csv = await buildPayoutsCsv(range);
      filename = 'hakedis.csv';
      break;
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
