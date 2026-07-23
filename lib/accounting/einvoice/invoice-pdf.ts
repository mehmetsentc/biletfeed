import PDFDocument from 'pdfkit';
import { companyLegal } from '@/lib/config/company';
import { registerPdfFonts, pdfFont } from '@/lib/tickets/pdf/fonts';

export type InvoicePdfLine = {
  description: string;
  quantity: number;
  unitPriceNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
};

export type InvoicePdfInput = {
  invoiceNumber: string;
  type: string;
  status: string;
  issuedAt: Date;
  buyerName: string;
  buyerTaxNumber?: string | null;
  buyerTaxOffice?: string | null;
  buyerAddress?: string | null;
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  currency: string;
  eInvoiceUuid?: string | null;
  ettn?: string | null;
  channel?: string | null;
  envelopeUuid?: string | null;
  lifecycleLabel?: string | null;
  originalInvoiceNumber?: string | null;
  lines: InvoicePdfLine[];
};

function money(n: number, currency = 'TRY'): string {
  const prefix = currency === 'TRY' ? '₺' : `${currency} `;
  return `${prefix}${n.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function typeLabel(t: string): string {
  if (t === 'e_fatura') return 'e-Fatura';
  if (t === 'e_arsiv') return 'e-Arşiv';
  if (t === 'credit_note') return 'İade (Credit Note)';
  return t;
}

/**
 * Dahili satış faturası PDF’i (pdfkit).
 * Kanal PDF’i yoksa / mock’ta admin indirmesi için kullanılır.
 */
export async function generateInvoicePdf(
  input: InvoicePdfInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `Fatura ${input.invoiceNumber}`,
        Author: companyLegal.tradeName,
        Subject: typeLabel(input.type)
      }
    });
    registerPdfFonts(doc);

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let y = doc.page.margins.top;

    doc
      .font(pdfFont(true))
      .fontSize(16)
      .fillColor('#18181b')
      .text(companyLegal.tradeName, { width: pageW });
    y = doc.y + 4;
    doc
      .font(pdfFont(false))
      .fontSize(9)
      .fillColor('#52525b')
      .text(`VKN: ${companyLegal.taxNumber} · ${companyLegal.taxOffice}`, {
        width: pageW
      })
      .text(companyLegal.address, { width: pageW });
    y = doc.y + 16;

    doc
      .font(pdfFont(true))
      .fontSize(14)
      .fillColor('#18181b')
      .text(`SATIŞ FATURASI — ${typeLabel(input.type)}`, 48, y, {
        width: pageW
      });
    y = doc.y + 8;

    const metaLeft = [
      `Fatura no: ${input.invoiceNumber}`,
      `Tarih: ${input.issuedAt.toLocaleDateString('tr-TR')}`,
      `Durum: ${input.lifecycleLabel ?? input.status}`
    ];
    if (input.originalInvoiceNumber) {
      metaLeft.push(`İade edilen: ${input.originalInvoiceNumber}`);
    }
    const metaRight = [
      input.eInvoiceUuid ? `UUID/ETTN: ${input.eInvoiceUuid}` : null,
      input.ettn && input.ettn !== input.eInvoiceUuid
        ? `ETTN: ${input.ettn}`
        : null,
      input.envelopeUuid ? `Zarf: ${input.envelopeUuid}` : null,
      input.channel ? `Kanal: ${input.channel}` : null
    ].filter(Boolean) as string[];

    doc.font(pdfFont(false)).fontSize(9).fillColor('#3f3f46');
    const leftY = y;
    for (const line of metaLeft) {
      doc.text(line, 48, y, { width: pageW / 2 - 8 });
      y = doc.y + 2;
    }
    let ry = leftY;
    for (const line of metaRight) {
      doc.text(line, 48 + pageW / 2, ry, { width: pageW / 2 - 8 });
      ry = doc.y + 2;
    }
    y = Math.max(y, ry) + 14;

    doc
      .font(pdfFont(true))
      .fontSize(10)
      .fillColor('#18181b')
      .text('Alıcı', 48, y);
    y = doc.y + 4;
    doc
      .font(pdfFont(false))
      .fontSize(9)
      .fillColor('#3f3f46')
      .text(input.buyerName, { width: pageW });
    if (input.buyerTaxNumber) {
      doc.text(`VKN/TCKN: ${input.buyerTaxNumber}`);
    }
    if (input.buyerTaxOffice) {
      doc.text(`Vergi dairesi: ${input.buyerTaxOffice}`);
    }
    if (input.buyerAddress) {
      doc.text(input.buyerAddress, { width: pageW });
    }
    y = doc.y + 16;

    // Tablo başlığı
    const cols = {
      desc: 220,
      qty: 40,
      unit: 70,
      vat: 50,
      gross: 70
    };
    doc.font(pdfFont(true)).fontSize(8).fillColor('#71717a');
    doc.text('Açıklama', 48, y, { width: cols.desc });
    doc.text('Adet', 48 + cols.desc, y, { width: cols.qty, align: 'right' });
    doc.text('Birim (net)', 48 + cols.desc + cols.qty, y, {
      width: cols.unit,
      align: 'right'
    });
    doc.text('KDV %', 48 + cols.desc + cols.qty + cols.unit, y, {
      width: cols.vat,
      align: 'right'
    });
    doc.text('Toplam', 48 + cols.desc + cols.qty + cols.unit + cols.vat, y, {
      width: cols.gross,
      align: 'right'
    });
    y = doc.y + 6;
    doc
      .strokeColor('#e4e4e7')
      .lineWidth(0.5)
      .moveTo(48, y)
      .lineTo(48 + pageW, y)
      .stroke();
    y += 8;

    doc.font(pdfFont(false)).fontSize(9).fillColor('#18181b');
    for (const line of input.lines) {
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      const rowY = y;
      doc.text(line.description, 48, rowY, { width: cols.desc });
      const descH = doc.heightOfString(line.description, { width: cols.desc });
      doc.text(String(line.quantity), 48 + cols.desc, rowY, {
        width: cols.qty,
        align: 'right'
      });
      doc.text(money(line.unitPriceNet, input.currency), 48 + cols.desc + cols.qty, rowY, {
        width: cols.unit,
        align: 'right'
      });
      doc.text(String(line.vatRate), 48 + cols.desc + cols.qty + cols.unit, rowY, {
        width: cols.vat,
        align: 'right'
      });
      doc.text(
        money(line.totalGross, input.currency),
        48 + cols.desc + cols.qty + cols.unit + cols.vat,
        rowY,
        { width: cols.gross, align: 'right' }
      );
      y = rowY + Math.max(descH, 14) + 6;
    }

    y += 8;
    doc
      .strokeColor('#e4e4e7')
      .moveTo(48 + pageW - 180, y)
      .lineTo(48 + pageW, y)
      .stroke();
    y += 10;

    const totals = [
      ['Ara toplam (net)', money(input.subtotalNet, input.currency)],
      [`KDV (%${input.vatRate})`, money(input.vatAmount, input.currency)],
      ['Genel toplam', money(input.totalGross, input.currency)]
    ] as const;

    for (const [label, value] of totals) {
      doc
        .font(label === 'Genel toplam' ? pdfFont(true) : pdfFont(false))
        .fontSize(9)
        .fillColor('#18181b')
        .text(label, 48 + pageW - 180, y, { width: 100 })
        .text(value, 48 + pageW - 80, y, { width: 80, align: 'right' });
      y = doc.y + 4;
    }

    y += 20;
    doc
      .font(pdfFont(false))
      .fontSize(8)
      .fillColor('#a1a1aa')
      .text(
        'Bu belge BiletFeed muhasebe sisteminden üretilmiştir. GİB kanal PDF’i varsa resmi kopya oradan alınmalıdır.',
        48,
        y,
        { width: pageW }
      );

    doc.end();
  });
}

export function buildInvoicePdfFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^a-zA-Z0-9_-]+/g, '-');
  return `BiletFeed-Fatura-${safe}.pdf`;
}
