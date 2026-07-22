import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminMutation } from '@/lib/auth/guard-admin-api';
import {
  updateAccountingExpense,
  deleteAccountingExpense
} from '@/lib/accounting/expenses';

const expenseCategories = [
  'psp_fee',
  'marketing',
  'venue',
  'staff',
  'software',
  'other'
] as const;

const updateSchema = z.object({
  description: z.string().trim().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  vatAmount: z.number().min(0).optional(),
  category: z.enum(expenseCategories).optional(),
  currency: z.enum(['TRY', 'USD', 'EUR']).optional(),
  eventId: z.string().uuid().nullable().optional(),
  organizerId: z.string().uuid().nullable().optional(),
  incurredAt: z.string().datetime().optional()
});

interface RouteParams {
  params: Promise<{ expenseId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { expenseId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' },
      { status: 400 }
    );
  }

  try {
    const expense = await updateAccountingExpense({
      id: expenseId,
      ...parsed.data,
      incurredAt: parsed.data.incurredAt
        ? new Date(parsed.data.incurredAt)
        : undefined,
      actorId: guard.ctx.access.userId
    });
    return NextResponse.json({ success: true, expense });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gider güncellenemedi';
    const status = message.includes('bulunamadı') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const guard = await guardAdminMutation(request, 'accounting.manage');
  if ('error' in guard) return guard.error;

  const { expenseId } = await params;

  try {
    await deleteAccountingExpense({
      id: expenseId,
      actorId: guard.ctx.access.userId
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Gider silinemedi';
    const status = message.includes('bulunamadı') ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
