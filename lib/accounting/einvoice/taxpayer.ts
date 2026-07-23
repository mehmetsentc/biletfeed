import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import { normalizeTaxIdDigits } from '@/lib/accounting/invoice';
import { suggestedDocumentType } from '@/lib/accounting/invoice';
import type {
  TaxpayerQueryResult,
  TaxpayerCheckCache
} from '@/lib/accounting/einvoice/types';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Alıcı mükellef / belge tipi önerisi.
 *
 * Gerçek GİB mükellef sorgusu (e-Fatura kullanıcı listesi) özel entegratör
 * veya resmi API olmadan yapılamaz. Bu stub:
 * - VKN 10 hane → e_fatura önerisi (efaturaUser: unknown)
 * - TCKN / diğer → e_arsiv
 * - Sonucu Invoice.metadata.einvoice.taxpayerCheck içinde önbellekler
 */
export function queryTaxpayerHeuristic(
  taxNumber: string | null | undefined
): TaxpayerQueryResult {
  const digits = normalizeTaxIdDigits(taxNumber);
  const suggested = suggestedDocumentType(digits);
  const now = new Date().toISOString();

  if (digits.length === 10) {
    return {
      ok: true,
      taxId: digits,
      taxIdKind: 'vkn',
      suggestedDocumentType: 'e_fatura',
      efaturaUser: 'unknown',
      source: 'heuristic',
      checkedAt: now,
      note: '10 haneli VKN — e-Fatura adayı (GİB canlı mükellef listesi yok; stub)'
    };
  }

  if (digits.length === 11) {
    return {
      ok: true,
      taxId: digits,
      taxIdKind: 'tckn',
      suggestedDocumentType: 'e_arsiv',
      efaturaUser: 'no',
      source: 'heuristic',
      checkedAt: now,
      note: '11 haneli TCKN — e-Arşiv önerilir'
    };
  }

  return {
    ok: true,
    taxId: digits || null,
    taxIdKind: digits ? 'unknown' : 'missing',
    suggestedDocumentType: suggested,
    efaturaUser: 'unknown',
    source: 'heuristic',
    checkedAt: now,
    note: digits
      ? 'Vergi kimliği uzunluğu belirsiz — varsayılan e-Arşiv'
      : 'Vergi kimliği yok — e-Arşiv'
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) };
  }
  return {};
}

function isFreshCache(cache: TaxpayerCheckCache | undefined): boolean {
  if (!cache?.checkedAt) return false;
  const t = Date.parse(cache.checkedAt);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < CACHE_TTL_MS;
}

/** Fatura üzerinde mükellef kontrolü; sonucu metadata’ya yazar */
export async function checkInvoiceTaxpayer(params: {
  invoiceId: string;
  force?: boolean;
}): Promise<{
  result: TaxpayerQueryResult;
  cached: boolean;
}> {
  await ensureDbConnection();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: { id: true, buyerTaxNumber: true, metadata: true }
  });
  if (!invoice) {
    return {
      result: {
        ok: false,
        taxId: null,
        taxIdKind: 'missing',
        suggestedDocumentType: 'e_arsiv',
        efaturaUser: 'unknown',
        source: 'heuristic',
        checkedAt: new Date().toISOString(),
        error: 'Fatura bulunamadı'
      },
      cached: false
    };
  }

  const meta = asRecord(invoice.metadata);
  const einvoice = asRecord(meta.einvoice);
  const existing = einvoice.taxpayerCheck as TaxpayerCheckCache | undefined;

  if (!params.force && isFreshCache(existing) && existing) {
    return {
      result: {
        ok: true,
        taxId: existing.taxId,
        taxIdKind: existing.taxIdKind,
        suggestedDocumentType: existing.suggestedDocumentType,
        efaturaUser: existing.efaturaUser,
        source: existing.source,
        checkedAt: existing.checkedAt,
        note: existing.note
      },
      cached: true
    };
  }

  const result = queryTaxpayerHeuristic(invoice.buyerTaxNumber);
  const cache: TaxpayerCheckCache = {
    taxId: result.taxId,
    taxIdKind: result.taxIdKind,
    suggestedDocumentType: result.suggestedDocumentType,
    efaturaUser: result.efaturaUser,
    source: result.source,
    checkedAt: result.checkedAt,
    note: result.note
  };

  einvoice.taxpayerCheck = cache;
  meta.einvoice = einvoice;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { metadata: meta as Prisma.InputJsonValue }
  });

  return { result, cached: false };
}
