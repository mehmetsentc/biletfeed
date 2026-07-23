import {
  classifyGibError,
  formatGibDateLabel,
  isDateOutsideRange,
  parseGibDateToken,
  type ClassifiedGibError,
  type GibErrorCategory,
  type ParsedGibDateRange
} from '@/lib/accounting/einvoice/gib-errors';
import { getEInvoiceConfig } from '@/lib/accounting/einvoice/config';

export interface GibSendEligibility {
  canSend: boolean;
  /** UI / API mesajı */
  blockReason?: string;
  /** Soft confirm yeterli mi (şu an kullanılmıyor — disable tercih) */
  requireConfirm?: boolean;
  errorCategory?: GibErrorCategory;
  classified?: ClassifiedGibError | null;
  gecisRange?: ParsedGibDateRange;
  issuedOutsideGecis?: boolean;
}

function readEnvGecisRange(): ParsedGibDateRange | undefined {
  const config = getEInvoiceConfig();
  const fromRaw = config.gecisDateFrom;
  const toRaw = config.gecisDateTo;
  if (!fromRaw || !toRaw) return undefined;
  const from = parseGibDateToken(fromRaw);
  const to = parseGibDateToken(toRaw);
  if (!from || !to) return undefined;
  const [a, b] = from.getTime() <= to.getTime() ? [from, to] : [to, from];
  return {
    from: a,
    to: b,
    fromLabel: formatGibDateLabel(a),
    toLabel: formatGibDateLabel(b)
  };
}

export function resolveEffectiveGecisRange(
  lastError?: string | null
): ParsedGibDateRange | undefined {
  const classified = classifyGibError(lastError);
  if (classified?.dateRange) return classified.dateRange;
  return readEnvGecisRange();
}

/** Alıcı e-Fatura mükellefi / 10 hane VKN → e-Arşiv portal kapalı */
export function isEFaturaBuyerBlocked(params: {
  invoiceType: string;
  buyerTaxNumber?: string | null;
}): boolean {
  if (params.invoiceType === 'e_fatura') return true;
  const digits = (params.buyerTaxNumber ?? '').replace(/\D/g, '');
  return digits.length === 10;
}

export const EFATURA_BUYER_BLOCK_MESSAGE =
  'Alıcı e-Fatura mükellefi — e-Arşiv ile gönderilemez; entegratör/e-Fatura kanalı gerekli';

export const GECIS_OUTSIDE_BLOCK_MESSAGE =
  'GİB GEÇİŞ penceresi dışı — muhasebeci IVD’den yetki/tarih açmalı';

export const EFATURA_SELLER_BLOCK_MESSAGE =
  'Satıcı hesabı e-Fatura / geçiş çakışması — e-Arşiv gönderimi kapalı; muhasebeciye danışın';

/**
 * Panel ve submit yolu için ortak GİB gönderim uygunluk kontrolü.
 * Başarılı (accepted/submitted) durumlar burada kontrol edilmez.
 */
export function evaluateGibSendEligibility(params: {
  issuedAt: Date;
  invoiceType: string;
  buyerTaxNumber?: string | null;
  lastError?: string | null;
}): GibSendEligibility {
  const classified = classifyGibError(params.lastError);

  if (
    isEFaturaBuyerBlocked({
      invoiceType: params.invoiceType,
      buyerTaxNumber: params.buyerTaxNumber
    })
  ) {
    return {
      canSend: false,
      blockReason: EFATURA_BUYER_BLOCK_MESSAGE,
      errorCategory: 'unknown',
      classified
    };
  }

  if (classified?.category === 'efatura_satici') {
    return {
      canSend: false,
      blockReason: EFATURA_SELLER_BLOCK_MESSAGE,
      errorCategory: 'efatura_satici',
      classified
    };
  }

  const gecisRange = resolveEffectiveGecisRange(params.lastError);
  if (gecisRange) {
    const outside = isDateOutsideRange(params.issuedAt, gecisRange);
    if (outside) {
      const fromError = classified?.category === 'gecis_tarih';
      // Env penceresi veya GEÇİŞ hatası + tarih dışı → disable
      if (fromError || readEnvGecisRange()) {
        return {
          canSend: false,
          blockReason: `${GECIS_OUTSIDE_BLOCK_MESSAGE} (izinli: ${gecisRange.fromLabel} – ${gecisRange.toLabel})`,
          errorCategory: 'gecis_tarih',
          classified,
          gecisRange,
          issuedOutsideGecis: true
        };
      }
    }
  }

  // Son hata GEÇİŞ ama tarih aralığı parse edilemedi — uyar, yine de disable
  if (classified?.category === 'gecis_tarih') {
    const envRange = readEnvGecisRange();
    if (envRange && isDateOutsideRange(params.issuedAt, envRange)) {
      return {
        canSend: false,
        blockReason: `${GECIS_OUTSIDE_BLOCK_MESSAGE} (izinli: ${envRange.fromLabel} – ${envRange.toLabel})`,
        errorCategory: 'gecis_tarih',
        classified,
        gecisRange: envRange,
        issuedOutsideGecis: true
      };
    }
    if (!classified.dateRange && !envRange) {
      return {
        canSend: false,
        blockReason:
          'GİB GEÇİŞ hatası — izinli tarih aralığı okunamadı. Muhasebeci IVD’den yetki/tarih doğrulamalı; EINVOICE_GECIS_DATE_FROM/TO ile pencere tanımlanabilir.',
        errorCategory: 'gecis_tarih',
        classified,
        issuedOutsideGecis: true
      };
    }
  }

  return {
    canSend: true,
    classified,
    gecisRange,
    issuedOutsideGecis: gecisRange
      ? isDateOutsideRange(params.issuedAt, gecisRange)
      : false
  };
}
