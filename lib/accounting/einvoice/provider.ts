import {
  getEInvoiceConfig,
  type EInvoiceConfig
} from '@/lib/accounting/einvoice/config';
import { createGibEarsivProvider } from '@/lib/accounting/einvoice/providers/gib-earsiv';
import { createHttpEInvoiceProvider } from '@/lib/accounting/einvoice/providers/http';
import { createMockEInvoiceProvider } from '@/lib/accounting/einvoice/providers/mock';
import type { EInvoiceProvider } from '@/lib/accounting/einvoice/types';

export function getEInvoiceProvider(
  config: EInvoiceConfig = getEInvoiceConfig()
): EInvoiceProvider | null {
  if (!config.enabled || config.provider === 'none') return null;

  if (config.provider === 'gib') {
    if (!config.username || !config.password) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[einvoice] EINVOICE_PROVIDER=gib ama kullanıcı/şifre yok — mock'
        );
      }
      return createMockEInvoiceProvider();
    }
    return createGibEarsivProvider(config);
  }

  if (config.provider === 'http') {
    if (!config.apiBaseUrl) {
      if (config.sandbox) return createMockEInvoiceProvider();
      return null;
    }
    return createHttpEInvoiceProvider(config);
  }

  return createMockEInvoiceProvider();
}
