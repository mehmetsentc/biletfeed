import {
  classifyGibError,
  formatGibDateLabel,
  isDateOutsideRange,
  parseGibDateToken,
  type ClassifiedGibError,
  type GibErrorCategory,
  type ParsedGibDateRange
} from '@/lib/accounting/einvoice/gib-errors';
import {
  describeEFaturaChannel,
  EFATURA_CHANNEL_NOT_CONFIGURED_MESSAGE,
  getEInvoiceConfig,
  isEFaturaChannelReady
} from '@/lib/accounting/einvoice/config';

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
  /** Kullanılacak kanal etiketi */
  channelLabel?: string;
  channelId?: string;
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

/**
 * @deprecated Tip seçimi sonrası e_arsiv override mümkün;
 * e_fatura için kanal hazırlığına bakın (`isEFaturaChannelReady`).
 * 10 hane VKN → önerilen tip e_fatura (otomatik), engel değil.
 */
export function isEFaturaBuyerBlocked(params: {
  invoiceType: string;
  buyerTaxNumber?: string | null;
}): boolean {
  if (params.invoiceType === 'e_fatura') {
    return !isEFaturaChannelReady();
  }
  return false;
}

export const EFATURA_BUYER_BLOCK_MESSAGE = EFATURA_CHANNEL_NOT_CONFIGURED_MESSAGE;

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
  const invoiceType = params.invoiceType;

  // ── e-Fatura kanalı ──────────────────────────────────────────
  if (invoiceType === 'e_fatura') {
    const channel = describeEFaturaChannel();
    if (!channel.ready) {
      return {
        canSend: false,
        blockReason:
          channel.setupHint ?? EFATURA_CHANNEL_NOT_CONFIGURED_MESSAGE,
        errorCategory: 'unknown',
        classified,
        channelLabel: channel.label,
        channelId: channel.channelId
      };
    }
    return {
      canSend: true,
      classified,
      channelLabel: channel.label,
      channelId: channel.channelId
    };
  }

  // ── e-Arşiv (ve credit_note / proforma) ───────────────────────
  const earsivChannel = {
    channelLabel: 'GİB e-Arşiv portal',
    channelId: 'gib-earsiv' as const
  };

  if (classified?.category === 'efatura_satici') {
    return {
      canSend: false,
      blockReason: EFATURA_SELLER_BLOCK_MESSAGE,
      errorCategory: 'efatura_satici',
      classified,
      ...earsivChannel
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
          issuedOutsideGecis: true,
          ...earsivChannel
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
        issuedOutsideGecis: true,
        ...earsivChannel
      };
    }
    if (!classified.dateRange && !envRange) {
      return {
        canSend: false,
        blockReason:
          'GİB GEÇİŞ hatası — izinli tarih aralığı okunamadı. Muhasebeci IVD’den yetki/tarih doğrulamalı; EINVOICE_GECIS_DATE_FROM/TO ile pencere tanımlanabilir.',
        errorCategory: 'gecis_tarih',
        classified,
        issuedOutsideGecis: true,
        ...earsivChannel
      };
    }
  }

  return {
    canSend: true,
    classified,
    gecisRange,
    issuedOutsideGecis: gecisRange
      ? isDateOutsideRange(params.issuedAt, gecisRange)
      : false,
    ...earsivChannel
  };
}
