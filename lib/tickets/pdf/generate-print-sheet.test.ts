import { describe, expect, it } from 'vitest';
import {
  generatePrintSheetPdf,
  printSheetGeometry,
  type PrintSheetTicket
} from '@/lib/tickets/pdf/generate-print-sheet';

function sample(count: number): PrintSheetTicket[] {
  return Array.from({ length: count }, (_, index) => ({
    eventTitle: 'CALIBRE FEST BODRUM',
    ticketTypeName: 'General Access',
    dateTimeLabel: '10 Ağustos 2025 16:00',
    venueName: 'Calibre Fest Area',
    addressLine: 'Kızılbük, Eski Bodrum Yolu 48401, Bodrum/Muğla',
    ticketCode: `BF-TEST${String(index + 1).padStart(4, '0')}`,
    serial: `A1B2-${String(index + 1).padStart(7, '0')}`,
    sequenceLabel: String(index + 1).padStart(6, '0'),
    qrData: `https://biletfeed.com/bilet/BF-TEST${index + 1}?token=preview&id=preview-${index + 1}`
  }));
}

function pageCount(pdf: Buffer): number {
  const matches = pdf.toString('latin1').match(/\/Type \/Page(?!s)/g);
  return matches?.length ?? 0;
}

describe('baskı formu yerleşimi', () => {
  it('üç bilet kesim payı ile A4 içine sığar', () => {
    const geo = printSheetGeometry();
    expect(geo.origins).toHaveLength(3);
    const first = geo.origins[0]!;
    const last = geo.origins[2]!;
    expect(first.x).toBeGreaterThan(16);
    expect(first.y).toBeGreaterThan(36);
    expect(last.y + geo.ticketH).toBeLessThan(geo.pageH - 28);
    expect(first.x + geo.ticketW).toBeLessThan(geo.pageW - 12);
  });
});

describe('baskı PDF', () => {
  it('tek bilet için ön ve arka sayfa üretir', async () => {
    const pdf = await generatePrintSheetPdf(sample(1));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(2);
  });

  it('dört bileti iki forma, dört sayfa olarak basar', async () => {
    const pdf = await generatePrintSheetPdf(sample(4));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(4);
  });

  it('logo her bilette yeniden gömülmez', async () => {
    const few = await generatePrintSheetPdf(sample(2));
    const many = await generatePrintSheetPdf(sample(30));
    const perExtra = (many.length - few.length) / 28;
    expect(perExtra).toBeLessThan(8_000);
  });
});
