import {
  getEInvoiceConfig,
  isEFaturaChannelReady,
  type EInvoiceConfig
} from '@/lib/accounting/einvoice/config';
import { createGibEarsivProvider } from '@/lib/accounting/einvoice/providers/gib-earsiv';
import { createGibEfaturaProvider } from '@/lib/accounting/einvoice/providers/gib-efatura';
import { createHttpEInvoiceProvider } from '@/lib/accounting/einvoice/providers/http';
import { createMockEInvoiceProvider } from '@/lib/accounting/einvoice/providers/mock';
import type {
  EInvoiceDocumentKind,
  EInvoiceProvider
} from '@/lib/accounting/einvoice/types';

/** Ana e-Arşiv / genel provider (EINVOICE_PROVIDER) */
export function getEInvoiceProvider(
  config: EInvoiceConfig = getEInvoiceConfig()
): EInvoiceProvider | null {
  if (!config.enabled || config.provider === 'none') return null;

  if (config.provider === 'gib' || config.provider === 'gib-efatura') {
    // gib-efatura EINVOICE_PROVIDER değeri e-Arşiv için gib portalına düşer;
    // e-Fatura ayrı resolveProviderForKind ile seçilir.
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

/**
 * Belge tipine göre kanal seçimi:
 * - e_arsiv / credit_note → GİB e-Arşiv portal (veya mock/http)
 * - e_fatura → BiletFeed e-Fatura kanalı (gib-efatura); asla sessizce earsiv’e düşmez
 */
export function resolveProviderForKind(
  kind: EInvoiceDocumentKind,
  config: EInvoiceConfig = getEInvoiceConfig()
): EInvoiceProvider | null {
  if (kind === 'e_fatura') {
    return getEFaturaProvider(config);
  }
  return getEInvoiceProvider(config);
}

/** Yalnızca e-Fatura kanalı */
export function getEFaturaProvider(
  config: EInvoiceConfig = getEInvoiceConfig()
): EInvoiceProvider | null {
  if (!isEFaturaChannelReady(config)) {
    return null;
  }

  // Genel mock / http e-Fatura’yı da taşıyabilir
  if (config.provider === 'mock') {
    return createMockEInvoiceProvider();
  }
  if (config.provider === 'http' && config.apiBaseUrl) {
    return createHttpEInvoiceProvider(config);
  }

  // Kendi entegratör iskeleti (mock veya gerçek endpoint)
  if (config.efatura.enabled || config.efatura.mock) {
    return createGibEfaturaProvider({
      ...config,
      efatura: {
        ...config.efatura,
        // MOCK-only: provider submit’in enabled kontrolünden geçmesi için
        enabled: config.efatura.enabled || config.efatura.mock
      }
    });
  }

  return null;
}
