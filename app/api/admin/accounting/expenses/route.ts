import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation, guardAdminRead } from '@/lib/auth/guard-admin-api';
import {
  listAccountingExpenses,
  createAccountingExpense
} from '@/lib/accounting/expenses';

const expenseCategories = [
  'psp_fee',
  'marketing',
  'venue',
  'staff',
  'software',
  'other'
] as const;

const createSchema = z.object({
  description: z.string().trim().min(1).max(500),
  amount: z.number().positive(),
  vatAmount: z.number().min(0).optional(),
  category: z.enum(expenseCategories).optional(),
  currency: z.enum(['TRY', 'USD', 'EUR']).optional(),
  eventId: z.string().uuid().nullable().optional(),
  organizerId: z.string().uuid().nullable().optional(),
  incurredAt: z.string().datetime().optional()
});

export async function GET(request: NextRequest) {
  const guard = await guardAdminRead('accounting.manage');
  if ('error' in guard) return guard.error;

  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId') ?? undefined;
  const organizerId = url.searchParams.get('organizerId') ?? undefined;

  const expenses = await listAccountingExpenses({ eventId, organizerId });
  return NextResponse.json({ expenses });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }

  try {
    const expense = await createAccountingExpense({
      ...parsed.data,
      incurredAt: parsed.data.incurredAt
        ? new Date(parsed.data.incurredAt)
        : undefined,
      actorId: guard.ctx.access.userId
    });
    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gider oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
