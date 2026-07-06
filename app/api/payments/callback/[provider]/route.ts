import { NextRequest, NextResponse } from 'next/server';
import type { PaymentProviderName } from '@/lib/payments/types';
import { getAppBaseUrl, isMockPaymentAllowed } from '@/lib/payments/config';
import { logPaymentAudit } from '@/lib/payments/payment-audit';
import { verifyPaymentCallback } from '@/lib/payments/process';
import { verifyOrderPaymentAmount } from '@/lib/payments/verify-order-payment';
import {
  failPendingOrder,
  fulfillPaidOrder
} from '@/lib/services/orders';

/** Tosla 3D Host, JSON değil browser redirect ile callback yapar */
const BROWSER_REDIRECT_PROVIDERS: PaymentProviderName[] = ['tosla'];

function isBrowserRedirectProvider(p: PaymentProviderName) {
  return BROWSER_REDIRECT_PROVIDERS.includes(p);
}

function redirectResponse(provider: PaymentProviderName, orderId: string, success: boolean) {
  const base = getAppBaseUrl();
  const url = success
    ? `${base}/odeme/basarili?order=${orderId}`
    : `${base}/odeme/basarisiz?order=${orderId}`;
  // Tosla, POST callback'e dönen 302'yi takip eder
  return NextResponse.redirect(url, { status: 302 });
}

function errorRedirect(provider: PaymentProviderName) {
  const base = getAppBaseUrl();
  return NextResponse.redirect(`${base}/odeme/basarisiz`, { status: 302 });
}

const ALLOWED: PaymentProviderName[] = [
  'mock',
  'iyzico',
  'paytr',
  'stripe',
  'tosla',
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
      if (isBrowserRedirectProvider(provider)) return errorRedirect(provider);
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
        if (isBrowserRedirectProvider(provider)) return redirectResponse(provider, verified.orderId, false);
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

      if (isBrowserRedirectProvider(provider)) return redirectResponse(provider, result.orderId, true);
      return NextResponse.json({ success: true, ...result });
    }

    await failPendingOrder({
      orderId: verified.orderId,
      provider,
      providerPaymentId: verified.providerPaymentId
    });

    if (isBrowserRedirectProvider(provider)) return redirectResponse(provider, verified.orderId, false);
    return NextResponse.json({ success: false, status: verified.status });
  } catch (err) {
    logPaymentAudit('callback_failed', {
      provider,
      reason: err instanceof Error ? err.message : 'unknown'
    });
    if (isBrowserRedirectProvider(provider)) return errorRedirect(provider);
    return NextResponse.json({ error: 'Callback işlenemedi' }, { status: 500 });
  }
}
