import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { pdfFont, registerPdfFonts } from '@/lib/tickets/pdf/fonts';
import {
  PRINT_TICKET_NON_REFUNDABLE,
  PRINT_TICKET_TERMS,
  PRINT_TICKETS_PER_SHEET,
  groupIntoSheets
} from '@/lib/tickets/print/constants';

type PdfDoc = InstanceType<typeof PDFDocument>;

const MM = 72 / 25.4;
const LOGO_PATH = path.join(process.cwd(), 'public/brand/logo-dark.png');
const LIME = '#DFFF00';
const INK = '#111111';

export type PrintSheetTicket = {
  eventTitle: string;
  ticketTypeName: string;
  dateTimeLabel: string;
  venueName: string;
  addressLine: string;
  ticketCode: string;
  serial: string;
  sequenceLabel: string;
  qrData: string;
};

export type PrintSheetGeometry = {
  pageW: number;
  pageH: number;
  ticketW: number;
  ticketH: number;
  stubW: number;
  origins: Array<{ x: number; y: number }>;
};

/** A4, sayfada 3 yatay bilet. Ön ve arka aynı koordinatlara oturur. */
export function printSheetGeometry(): PrintSheetGeometry {
  const pageW = 595.28;
  const pageH = 841.89;
  const ticketW = 190 * MM;
  const ticketH = 68 * MM;
  const gap = 8 * MM;
  const stubW = 16 * MM;
  const marginTop = 42;
  const marginBottom = 34;
  const blockH = PRINT_TICKETS_PER_SHEET * ticketH + (PRINT_TICKETS_PER_SHEET - 1) * gap;
  const extra = pageH - marginTop - marginBottom - blockH;
  const y0 = marginTop + Math.max(0, extra / 2);
  const x = (pageW - ticketW) / 2;
  const origins = Array.from({ length: PRINT_TICKETS_PER_SHEET }, (_, index) => ({
    x,
    y: y0 + index * (ticketH + gap)
  }));
  return { pageW, pageH, ticketW, ticketH, stubW, origins };
}

function logoPath(): string | null {
  try {
    if (fs.existsSync(LOGO_PATH)) return LOGO_PATH;
  } catch {
    /* logo yoksa wordmark */
  }
  return null;
}

/**
 * 1 bit QR görseli. Interpolate kapalı olduğu için baskıda keskin kalır
 * ve 500 biletlik dosyayı şişirmez.
 */
function drawBitmapQr(doc: PdfDoc, data: string, x: number, y: number, size: number) {
  const pdf = doc as PdfDoc & { _imageCount: number };
  const qr = QRCode.create(data, { errorCorrectionLevel: 'M' });
  const count = qr.modules.size;
  const quiet = 2;
  const dim = count + quiet * 2;
  const rowBytes = Math.ceil(dim / 8);
  const bitmap = Buffer.alloc(rowBytes * dim, 0xff);

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(col, row)) continue;
      const px = col + quiet;
      const py = row + quiet;
      const byteIndex = py * rowBytes + (px >> 3);
      bitmap[byteIndex] &= ~(1 << (7 - (px & 7)));
    }
  }

  const label = `QR${++pdf._imageCount}`;
  const imageObj = doc.ref({
    Type: 'XObject',
    Subtype: 'Image',
    BitsPerComponent: 1,
    Width: dim,
    Height: dim,
    ColorSpace: 'DeviceGray',
    Interpolate: false
  });
  imageObj.end(bitmap);

  const image = {
    label,
    width: dim,
    height: dim,
    obj: imageObj,
    orientation: 1
  };
  (
    doc.image as (
      src: object,
      x: number,
      y: number,
      options: { width: number; height: number }
    ) => void
  )(image, x, y, { width: size, height: size });
}

function drawCropMarks(doc: PdfDoc, x: number, y: number, w: number, h: number) {
  const len = 10;
  const gap = 3.5;
  doc.save();
  doc.strokeColor('#111111').lineWidth(0.45);
  const pairs: Array<[number, number, number, number]> = [
    [x - gap - len, y, x - gap, y],
    [x, y - gap - len, x, y - gap],
    [x + w + gap, y, x + w + gap + len, y],
    [x + w, y - gap - len, x + w, y - gap],
    [x - gap - len, y + h, x - gap, y + h],
    [x, y + h + gap, x, y + h + gap + len],
    [x + w + gap, y + h, x + w + gap + len, y + h],
    [x + w, y + h + gap, x + w, y + h + gap + len]
  ];
  for (const [x1, y1, x2, y2] of pairs) {
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
  }
  doc.restore();
}

function drawBrandStub(
  doc: PdfDoc,
  x: number,
  y: number,
  stubW: number,
  h: number,
  sequenceLabel: string
) {
  doc.save();
  doc.rect(x, y, stubW, h).fill(INK);
  doc.rect(x + stubW - 3.5, y, 3.5, h).fill(LIME);
  doc.fillColor('#FFFFFF').font(pdfFont(true)).fontSize(8);
  const label = 'biletfeed';
  const labelW = doc.widthOfString(label);
  const step = labelW + 16;
  const seqBand = 18;
  const blackW = stubW - 3.5;
  const span = h - 20 - seqBand;
  const count = Math.max(1, Math.floor(span / step));
  doc.save();
  doc.translate(x + blackW / 2, y + (h - seqBand) / 2);
  doc.rotate(-90);
  const total = count * step - 16;
  const start = -total / 2;
  for (let i = 0; i < count; i += 1) {
    doc.text(label, start + i * step, -4, {
      lineBreak: false,
      width: labelW + 1,
      height: 12
    });
  }
  doc.restore();
  doc.fillColor('#FFFFFF').font(pdfFont(true)).fontSize(7);
  doc.text(sequenceLabel, x + 1, y + h - 14, {
    width: blackW - 2,
    align: 'center',
    lineBreak: false,
    height: 10
  });
  doc.restore();
}

function drawPerforation(doc: PdfDoc, x: number, y: number, h: number) {
  doc.save();
  doc.strokeColor('#C8C8C8').lineWidth(0.7).dash(1.6, { space: 1.8 });
  doc.moveTo(x, y + 7).lineTo(x, y + h - 7).stroke();
  doc.undash();
  doc.fillColor('#FFFFFF');
  doc.circle(x, y, 4.5).fill();
  doc.circle(x, y + h, 4.5).fill();
  doc.restore();
}

function drawTicketFrame(doc: PdfDoc, x: number, y: number, w: number, h: number) {
  doc.save();
  doc.lineWidth(0.9).strokeColor('#111111').rect(x, y, w, h).stroke();
  doc.restore();
}

function drawFront(
  doc: PdfDoc,
  origin: { x: number; y: number },
  geo: PrintSheetGeometry,
  ticket: PrintSheetTicket,
  logo: string | null,
  cropMarks = true
) {
  const { x, y } = origin;
  const { ticketW: w, ticketH: h, stubW } = geo;
  const rightW = 98;
  const bodyX = x + stubW + 12;
  const bodyW = w - stubW - rightW - 24;
  const rightX = x + w - rightW;

  doc.save();
  doc.rect(x, y, w, h).clip();
  doc.rect(x, y, w, h).fill('#FFFFFF');
  drawBrandStub(doc, x, y, stubW, h, ticket.sequenceLabel);

  doc.fillColor(INK).font(pdfFont(true)).fontSize(14);
  doc.text(ticket.eventTitle, bodyX, y + 12, {
    width: bodyW,
    height: 34,
    ellipsis: true
  });
  doc.rect(bodyX, y + 48, 28, 2.5).fill(LIME);

  doc.fillColor('#3A3A3A').font(pdfFont(true)).fontSize(9);
  doc.text(ticket.ticketTypeName, bodyX, y + 56, {
    width: bodyW,
    height: 12,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor(INK).font(pdfFont(true)).fontSize(11);
  doc.text(ticket.dateTimeLabel, bodyX, y + 72, {
    width: bodyW,
    height: 14,
    ellipsis: true,
    lineBreak: false
  });

  doc.font(pdfFont(true)).fontSize(9);
  doc.text(ticket.venueName, bodyX, y + 90, {
    width: bodyW,
    height: 12,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor('#555555').font(pdfFont()).fontSize(7.5);
  doc.text(ticket.addressLine, bodyX, y + 106, {
    width: bodyW,
    height: 26,
    ellipsis: true
  });

  doc.strokeColor('#E4E4E4').lineWidth(0.6);
  doc.moveTo(bodyX, y + h - 40).lineTo(bodyX + bodyW, y + h - 40).stroke();

  doc.fillColor(INK).font(pdfFont(true)).fontSize(9);
  doc.text(ticket.ticketCode, bodyX, y + h - 32, {
    width: bodyW,
    height: 12,
    lineBreak: false,
    ellipsis: true
  });
  doc.fillColor('#666666').font(pdfFont()).fontSize(7.5);
  doc.text(ticket.serial, bodyX, y + h - 18, {
    width: bodyW,
    height: 10,
    lineBreak: false
  });

  const qrSize = 58;
  const stackH = 16 + 8 + qrSize + 16;
  const stackTop = y + Math.max(10, (h - stackH) / 2);
  if (logo) {
    doc.image(logo, rightX + 6, stackTop, { fit: [rightW - 16, 14], align: 'center' });
  } else {
    doc.fillColor(INK).font(pdfFont(true)).fontSize(8);
    doc.text('biletfeed', rightX + 4, stackTop, {
      width: rightW - 12,
      align: 'center',
      lineBreak: false,
      height: 12
    });
  }

  const qrTop = stackTop + 20;
  const qrX = rightX + (rightW - qrSize) / 2;
  drawBitmapQr(doc, ticket.qrData, qrX, qrTop, qrSize);

  doc.fillColor(INK).font(pdfFont(true)).fontSize(6.5);
  doc.text('biletfeed.com', rightX + 4, qrTop + qrSize + 3, {
    width: rightW - 12,
    align: 'center',
    lineBreak: false,
    height: 9
  });

  doc.restore();
  drawPerforation(doc, x + stubW, y, h);
  drawTicketFrame(doc, x, y, w, h);
  if (cropMarks) drawCropMarks(doc, x, y, w, h);
}

function drawBack(
  doc: PdfDoc,
  origin: { x: number; y: number },
  geo: PrintSheetGeometry,
  ticket: PrintSheetTicket,
  cropMarks = true
) {
  const { x, y } = origin;
  const { ticketW: w, ticketH: h, stubW } = geo;
  const textX = x + stubW + 10;
  const textW = w - stubW - 20;

  doc.save();
  doc.rect(x, y, w, h).clip();
  doc.rect(x, y, w, h).fill('#FFFFFF');
  drawBrandStub(doc, x, y, stubW, h, ticket.sequenceLabel);

  doc.save();
  doc.rect(x + stubW + 1, y + 1, w - stubW - 2, h - 2).clip();
  doc.fillColor('#F3F3F3').font(pdfFont(true)).fontSize(42);
  doc.text('biletfeed', textX, y + h / 2 - 22, {
    width: textW,
    align: 'center',
    lineBreak: false,
    height: 48
  });
  doc.restore();

  const barY = y + 10;
  const barH = 18;
  doc.rect(textX, barY, textW, barH).fill(INK);
  doc.rect(textX, barY, 3.5, barH).fill(LIME);
  doc.fillColor('#FFFFFF').font(pdfFont(true)).fontSize(7.5);
  doc.text(PRINT_TICKET_NON_REFUNDABLE, textX + 10, barY + 4.5, {
    width: textW - 16,
    height: 11,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor('#666666').font(pdfFont(true)).fontSize(7);
  doc.text('Açıklamalar', textX, y + 36, {
    width: textW,
    height: 10,
    lineBreak: false
  });

  doc.fillColor('#222222').font(pdfFont()).fontSize(7);
  doc.text(PRINT_TICKET_TERMS, textX, y + 50, {
    width: textW,
    height: 78,
    ellipsis: true,
    lineGap: 1.4
  });

  doc.fillColor('#666666').font(pdfFont()).fontSize(6);
  doc.text(`BiletFeed · biletfeed.com · ${ticket.ticketCode}`, textX, y + h - 34, {
    width: textW * 0.62,
    height: 18,
    ellipsis: true
  });

  doc.fillColor('#111111').font(pdfFont(true)).fontSize(9);
  doc.text(`Sıra No: ${ticket.sequenceLabel}`, textX, y + h - 28, {
    width: textW,
    align: 'right',
    lineBreak: false,
    height: 12
  });

  doc.restore();
  drawPerforation(doc, x + stubW, y, h);
  drawTicketFrame(doc, x, y, w, h);
  if (cropMarks) drawCropMarks(doc, x, y, w, h);
}

/** Tek biletin ön veya arka yüzü — sunum ve prova. */
export async function generateTicketFacePdf(
  ticket: PrintSheetTicket,
  side: 'front' | 'back'
): Promise<Buffer> {
  const geo = printSheetGeometry();
  const pad = 12;
  const logo = logoPath();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [geo.ticketW + pad * 2, geo.ticketH + pad * 2],
      margin: 0,
      info: {
        Title: side === 'front' ? 'BiletFeed bilet ön yüz' : 'BiletFeed bilet arka yüz',
        Author: 'BiletFeed'
      }
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    registerPdfFonts(doc);
    doc.rect(0, 0, geo.ticketW + pad * 2, geo.ticketH + pad * 2).fill('#F4F4F4');
    const origin = { x: pad, y: pad };
    if (side === 'front') drawFront(doc, origin, geo, ticket, logo, false);
    else drawBack(doc, origin, geo, ticket, false);
    doc.end();
  });
}

function drawSheetLabel(
  doc: PdfDoc,
  geo: PrintSheetGeometry,
  side: 'front' | 'back',
  sheetNumber: number,
  sheetCount: number
) {
  const label =
    side === 'front'
      ? `ÖN YÜZ · Çift yüz yazdırın, uzun kenardan çevirin · Kesim çizgilerine göre kesin · Forma ${sheetNumber}/${sheetCount}`
      : `ARKA YÜZ · Bir önceki sayfanın arkası · Uzun kenardan çevirin · Forma ${sheetNumber}/${sheetCount}`;
  doc.fillColor('#444444').font(pdfFont()).fontSize(7.5);
  doc.text(label, 28, 16, {
    width: geo.pageW - 56,
    align: 'center',
    lineBreak: false,
    height: 12
  });
  doc.fontSize(6.5).fillColor('#777777');
  doc.text('BiletFeed baskı dosyası · bu satır kesim payındadır, biletin üzerinde kalmaz', 28, geo.pageH - 22, {
    width: geo.pageW - 56,
    align: 'center',
    lineBreak: false,
    height: 10
  });
}

export async function generatePrintSheetPdf(tickets: PrintSheetTicket[]): Promise<Buffer> {
  if (tickets.length === 0) {
    throw new Error('Baskı dosyası için bilet yok');
  }

  const logo = logoPath();
  const geo = printSheetGeometry();
  const sheets = groupIntoSheets(tickets);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `${tickets[0]?.eventTitle ?? 'Etkinlik'} — BiletFeed baskı`,
        Author: 'BiletFeed',
        Subject: 'Basıma hazır bilet',
        Keywords: 'biletfeed, baskı, bilet'
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    registerPdfFonts(doc);

    sheets.forEach((sheet, sheetIndex) => {
      if (sheetIndex > 0) doc.addPage();
      drawSheetLabel(doc, geo, 'front', sheetIndex + 1, sheets.length);
      sheet.forEach((item, row) => {
        const origin = geo.origins[row];
        if (!origin) return;
        drawFront(doc, origin, geo, item, logo);
        doc.fillColor('#111111').font(pdfFont()).fontSize(7);
        doc.text(String(row + 1), 8, origin.y + geo.ticketH / 2 - 4, {
          width: 14,
          align: 'center',
          lineBreak: false,
          height: 10
        });
      });

      doc.addPage();
      drawSheetLabel(doc, geo, 'back', sheetIndex + 1, sheets.length);
      sheet.forEach((item, row) => {
        const origin = geo.origins[row];
        if (!origin) return;
        drawBack(doc, origin, geo, item);
        doc.fillColor('#111111').font(pdfFont()).fontSize(7);
        doc.text(String(row + 1), 8, origin.y + geo.ticketH / 2 - 4, {
          width: 14,
          align: 'center',
          lineBreak: false,
          height: 10
        });
      });
    });

    doc.end();
  });
}
