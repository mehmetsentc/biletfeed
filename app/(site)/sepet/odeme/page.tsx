import type { Metadata } from 'next';
import Link from 'next/link';
import { CartCheckoutForm } from '@/components/cart/cart-checkout-form';

export const metadata: Metadata = {
  title: 'Sepet Ödemesi',
  robots: { index: false, follow: false }
};

export default function CartCheckoutPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:py-10">
      <Link
        href="/sepet"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Sepete dön
      </Link>
      <div className="mt-4">
        <CartCheckoutForm />
      </div>
    </div>
  );
}
