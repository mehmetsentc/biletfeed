export type PaymentResult = {
  success: boolean;
  provider: string;
  paymentId: string;
};

/** Mock ödeme — Phase 4'te iyzico/Stripe ile değiştirilecek. */
export async function processPayment(input: {
  amount: number;
}): Promise<PaymentResult> {
  if (input.amount <= 0) {
    return { success: true, provider: 'free', paymentId: `free_${Date.now()}` };
  }

  const provider = process.env.PAYMENT_PROVIDER || 'mock';
  if (provider === 'mock') {
    return {
      success: true,
      provider: 'mock',
      paymentId: `mock_${Date.now()}`
    };
  }

  throw new Error('Ödeme sağlayıcısı henüz yapılandırılmadı');
}
