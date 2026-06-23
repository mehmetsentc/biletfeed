import { NextRequest, NextResponse } from 'next/server';
import type { PaymentProviderName } from '@/lib/payments/types';
import { isMockPaymentAllowed } from '@/lib/payments/config';
import { logPaymentAudit } from '@/lib/payments/payment-audit';
import { verifyPaymentCallback } from '@/lib/payments/process';
import { verifyOrderPaymentAmount } from '@/lib/payments/verify-order-payment';
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

  logPaymentAudit('callback_received', { provider });

  try {
    const verified = await verifyPaymentCallback(provider, request);

    if (!verified.valid || !verified.orderId) {
      logPaymentAudit('callback_failed', {
        provider,
        reason: 'invalid_verification'
      });
      return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 400 });
    }

    logPaymentAudit('callback_verified', {
      provider,
      orderId: verified.orderId,
      status: verified.status,
      providerPaymentId: verified.providerPaymentId
    });

    if (verified.status === 'paid') {
      const amountCheck = await verifyOrderPaymentAmount({
        orderId: verified.orderId,
        amount: verified.amount,
        currency: verified.currency,
        provider
      });
      if (!amountCheck.ok) {
        return NextResponse.json({ error: amountCheck.reason }, { status: 400 });
      }

      const result = await fulfillPaidOrder({
        orderId: verified.orderId,
        provider,
        providerPaymentId: verified.providerPaymentId
      });

      logPaymentAudit('callback_fulfilled', {
        provider,
        orderId: verified.orderId,
        ticketCount: result.ticketCount
      });

      return NextResponse.json({ success: true, ...result });
    }

    await failPendingOrder({
      orderId: verified.orderId,
      provider,
      providerPaymentId: verified.providerPaymentId
    });

    return NextResponse.json({ success: false, status: verified.status });
  } catch (err) {
    logPaymentAudit('callback_failed', {
      provider,
      reason: err instanceof Error ? err.message : 'unknown'
    });
    return NextResponse.json({ error: 'Callback işlenemedi' }, { status: 500 });
  }
}
