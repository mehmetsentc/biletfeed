import { NextResponse } from 'next/server';
import { adminUnauthorized, requireAdminSession } from '@/lib/auth/admin-api';
import { listOrdersForAdmin } from '@/lib/services/orders';

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return adminUnauthorized();

  const orders = await listOrdersForAdmin({ limit: 200 });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      commission: o.commission,
      provider: o.paymentProvider,
      paymentId: o.paymentId,
      paidAt: o.paidAt,
      createdAt: o.createdAt,
      user: o.user,
      event: o.event,
      organizer: o.organizer,
      transaction: o.transactions[0] ?? null
    })),
    total: orders.length
  });
}
