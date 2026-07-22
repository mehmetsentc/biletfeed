import { prisma, ensureDbConnection } from '@/lib/db/prisma';
import { companyLegal } from '@/lib/config/company';

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const bom = '\uFEFF';
  const lines = [
    headers.map(csvEscape).join(';'),
    ...rows.map((row) => row.map(csvEscape).join(';'))
  ];
  return bom + lines.join('\r\n') + '\r\n';
}

function money(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function dateTr(d: Date): string {
  return d.toLocaleDateString('tr-TR');
}

export type ExportDateRange = {
  from?: Date;
  to?: Date;
};

function invoiceDateFilter(range?: ExportDateRange) {
  if (!range?.from && !range?.to) return undefined;
  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {})
  };
}

/** KDV özeti — fatura bazlı matrah / KDV / toplam */
export async function buildVatSummaryCsv(range?: ExportDateRange): Promise<string> {
  await ensureDbConnection();

  const issuedAt = invoiceDateFilter(range);
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'issued',
      ...(issuedAt ? { issuedAt } : {})
    },
    orderBy: { issuedAt: 'asc' },
    include: {
      order: { select: { id: true, event: { select: { title: true } } } }
    }
  });

  const headers = [
    'Fatura No',
    'Tarih',
    'Tip',
    'Alıcı',
    'VKN/TCKN',
    'Etkinlik',
    'Matrah (Net)',
    'KDV Oranı (%)',
    'KDV Tutarı',
    'Toplam (Brüt)',
    'Para Birimi'
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    dateTr(inv.issuedAt),
    inv.type,
    inv.buyerName,
    inv.buyerTaxNumber ?? '',
    inv.order.event?.title ?? '',
    money(inv.subtotalNet),
    String(inv.vatRate),
    money(inv.vatAmount),
    money(inv.totalGross),
    inv.currency
  ]);

  const saleInvoices = invoices.filter((i) => i.type !== 'credit_note');
  const creditNotes = invoices.filter((i) => i.type === 'credit_note');
  const sumNet = saleInvoices.reduce((s, i) => s + i.subtotalNet, 0);
  const sumVat = saleInvoices.reduce((s, i) => s + i.vatAmount, 0);
  const sumGross = saleInvoices.reduce((s, i) => s + i.totalGross, 0);
  const creditNet = creditNotes.reduce((s, i) => s + i.subtotalNet, 0);
  const creditVat = creditNotes.reduce((s, i) => s + i.vatAmount, 0);
  const creditGross = creditNotes.reduce((s, i) => s + i.totalGross, 0);

  rows.push([
    'TOPLAM SATIŞ',
    '',
    '',
    companyLegal.tradeName,
    companyLegal.taxNumber,
    '',
    money(sumNet),
    '',
    money(sumVat),
    money(sumGross),
    'TRY'
  ]);
  rows.push([
    'TOPLAM İADE',
    '',
    'credit_note',
    '',
    '',
    '',
    money(creditNet),
    '',
    money(creditVat),
    money(creditGross),
    'TRY'
  ]);
  rows.push([
    'NET KDV',
    '',
    '',
    '',
    '',
    '',
    money(sumNet + creditNet),
    '',
    money(sumVat + creditVat),
    money(sumGross + creditGross),
    'TRY'
  ]);

  return toCsv(headers, rows);
}

/**
 * BA/BS tarzı özet — alıcı (müşteri) bazında dönem toplamları.
 * BA: mal/hizmet alanlar, BS: satanlar; burada platform satıcı, müşteri alıcı.
 */
export async function buildBaBsCsv(range?: ExportDateRange): Promise<string> {
  await ensureDbConnection();

  const issuedAt = invoiceDateFilter(range);
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'issued',
      type: { not: 'credit_note' },
      ...(issuedAt ? { issuedAt } : {})
    },
    select: {
      buyerName: true,
      buyerTaxNumber: true,
      totalGross: true,
      subtotalNet: true,
      vatAmount: true
    }
  });

  type Agg = {
    name: string;
    taxNumber: string;
    count: number;
    net: number;
    vat: number;
    gross: number;
  };

  const map = new Map<string, Agg>();
  for (const inv of invoices) {
    const key = (inv.buyerTaxNumber?.trim() || inv.buyerName.trim()).toLowerCase();
    const current = map.get(key) ?? {
      name: inv.buyerName,
      taxNumber: inv.buyerTaxNumber?.trim() ?? '',
      count: 0,
      net: 0,
      vat: 0,
      gross: 0
    };
    current.count += 1;
    current.net += inv.subtotalNet;
    current.vat += inv.vatAmount;
    current.gross += inv.totalGross;
    map.set(key, current);
  }

  const headers = [
    'Sıra',
    'Unvan / Ad Soyad',
    'VKN / TCKN',
    'Belge Adedi',
    'Matrah',
    'KDV',
    'Toplam',
    'Satıcı Ünvan',
    'Satıcı VKN'
  ];

  const sorted = [...map.values()].sort((a, b) => b.gross - a.gross);
  const rows = sorted.map((row, i) => [
    i + 1,
    row.name,
    row.taxNumber,
    row.count,
    money(row.net),
    money(row.vat),
    money(row.gross),
    companyLegal.tradeName,
    companyLegal.taxNumber
  ]);

  return toCsv(headers, rows);
}

/** Hakediş / payout CSV */
export async function buildPayoutsCsv(range?: ExportDateRange): Promise<string> {
  await ensureDbConnection();

  const createdAt =
    range?.from || range?.to
      ? {
          ...(range.from ? { gte: range.from } : {}),
          ...(range.to ? { lte: range.to } : {})
        }
      : undefined;

  const payouts = await prisma.organizerPayout.findMany({
    where: createdAt ? { createdAt } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      organizer: { select: { name: true, slug: true } },
      event: { select: { title: true } },
      order: { select: { id: true } }
    }
  });

  const headers = [
    'Hakediş ID',
    'Organizatör',
    'Etkinlik',
    'Sipariş',
    'Brüt',
    'Komisyon',
    'Net',
    'Para Birimi',
    'Durum',
    'Planlanan',
    'Ödenen',
    'Ödeme Ref',
    'IBAN Snapshot',
    'Ödeyen',
    'Oluşturma'
  ];

  const rows = payouts.map((p) => [
    p.id,
    p.organizer.name,
    p.event.title,
    p.orderId,
    money(p.grossAmount),
    money(p.commissionAmount),
    money(p.netAmount),
    p.currency,
    p.status,
    p.scheduledAt ? dateTr(p.scheduledAt) : '',
    p.paidAt ? dateTr(p.paidAt) : '',
    p.paymentRef ?? '',
    p.ibanSnapshot ?? '',
    p.paidBy ?? '',
    dateTr(p.createdAt)
  ]);

  return toCsv(headers, rows);
}
