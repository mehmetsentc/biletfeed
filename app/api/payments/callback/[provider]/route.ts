import { NextRequest, NextResponse } from 'next/server';
import type { PaymentProviderName } from '@/lib/payments/types';
import { isMockPaymentAllowed } from '@/lib/payments/config';
import { verifyPaymentCallback } from '@/lib/payments/process';
import {
  failPendingOrder,
  fulfillPaidOrder
} from '@/lib/services/orders';

const ALLOWED: PaymentProviderName[] = [
  'mock',
  'iyzico',
  'paytr',
  'stripe'
];

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { provider: raw } = await params;
  const provider = raw.toLowerCase() as PaymentProviderName;

  if (!ALLOWED.includes(provider)) {
    return NextResponse.json({ error: 'Geçersiz sağlayıcı' }, { status: 400 });
  }

  if (provider === 'mock' && !isMockPaymentAllowed()) {
    return NextResponse.json({ error: 'Mock ödeme kapalı' }, { status: 403 });
  }

  try {
    const verified = await verifyPaymentCallback(provider, request);

    if (!verified.valid || !verified.orderId) {
      return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 400 });
    }

    if (verified.status === 'paid') {
      const result = await fulfillPaidOrder({
        orderId: verified.orderId,
        provider,
        providerPaymentId: verified.providerPaymentId
      });
      return NextResponse.json({ success: true, ...result });
    }

    await failPendingOrder({
      orderId: verified.orderId,
      provider,
      providerPaymentId: verified.providerPaymentId
    });

    return NextResponse.json({ success: false, status: verified.status });
  } catch {
    return NextResponse.json({ error: 'Callback işlenemedi' }, { status: 500 });
  }
}
