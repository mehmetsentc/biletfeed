import { companyLegal } from '@/lib/config/company';

export interface TaxBreakdown {
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
}

/** KDV dahil brüt tutardan net + KDV ayrıştırır */
export function splitGrossAmount(
  gross: number,
  vatRate = companyLegal.defaultVatRate
): TaxBreakdown {
  const rate = vatRate / 100;
  const subtotalNet = Math.round((gross / (1 + rate)) * 100) / 100;
  const vatAmount = Math.round((gross - subtotalNet) * 100) / 100;
  return {
    subtotalNet,
    vatRate,
    vatAmount,
    totalGross: gross
  };
}

export function lineTaxFromNet(
  unitPriceNet: number,
  quantity: number,
  vatRate = companyLegal.defaultVatRate
): TaxBreakdown {
  const subtotalNet = Math.round(unitPriceNet * quantity * 100) / 100;
  const vatAmount = Math.round(subtotalNet * (vatRate / 100) * 100) / 100;
  return {
    subtotalNet,
    vatRate,
    vatAmount,
    totalGross: Math.round((subtotalNet + vatAmount) * 100) / 100
  };
}
