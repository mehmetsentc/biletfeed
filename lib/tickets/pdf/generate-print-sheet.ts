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

const COUPON_W = 86;
const RIGHT_W = 112;

function drawWordmark(
  doc: PdfDoc,
  logo: string | null,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (logo) {
    doc.image(logo, x, y, { fit: [width, height], align: 'center' });
    return;
  }
  doc.fillColor(INK).font(pdfFont(true)).fontSize(11);
  doc.text('biletfeed', x, y + 2, {
    width,
    align: 'center',
    lineBreak: false,
    height
  });
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
  const perf = x + stubW + COUPON_W;
  const rightX = x + w - RIGHT_W;
  const bodyX = perf + 10;
  const bodyW = rightX - bodyX - 8;

  doc.save();
  doc.rect(x, y, w, h).clip();
  doc.rect(x, y, w, h).fill('#FFFFFF');
  drawBrandStub(doc, x, y, stubW, h, ticket.sequenceLabel);

  const couponQr = 52;
  const couponX = x + stubW;
  const couponQrX = couponX + (COUPON_W - couponQr) / 2;
  const couponQrY = y + 36;
  drawBitmapQr(doc, ticket.qrData, couponQrX, couponQrY, couponQr);
  doc.fillColor(INK).font(pdfFont(true)).fontSize(6.5);
  doc.text('KOÇAN', couponX + 3, couponQrY + couponQr + 4, {
    width: COUPON_W - 6,
    align: 'center',
    lineBreak: false,
    height: 8
  });
  doc.fillColor('#444444').font(pdfFont()).fontSize(5.5);
  doc.text(ticket.ticketCode, couponX + 3, y + h - 16, {
    width: COUPON_W - 8,
    align: 'center',
    lineBreak: false,
    height: 8,
    ellipsis: true
  });

  doc.fillColor(INK).font(pdfFont(true)).fontSize(13);
  doc.text(ticket.eventTitle, bodyX, y + 12, {
    width: bodyW,
    height: 32,
    ellipsis: true
  });
  doc.rect(bodyX, y + 46, 26, 2.5).fill(LIME);

  doc.fillColor('#3A3A3A').font(pdfFont(true)).fontSize(8.5);
  doc.text(ticket.ticketTypeName, bodyX, y + 54, {
    width: bodyW,
    height: 12,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor(INK).font(pdfFont(true)).fontSize(10);
  doc.text(ticket.dateTimeLabel, bodyX, y + 70, {
    width: bodyW,
    height: 13,
    ellipsis: true,
    lineBreak: false
  });

  doc.font(pdfFont(true)).fontSize(8.5);
  doc.text(ticket.venueName, bodyX, y + 86, {
    width: bodyW,
    height: 12,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor('#555555').font(pdfFont()).fontSize(7);
  doc.text(ticket.addressLine, bodyX, y + 100, {
    width: bodyW,
    height: 22,
    ellipsis: true
  });

  doc.strokeColor('#E4E4E4').lineWidth(0.6);
  doc.moveTo(bodyX, y + h - 36).lineTo(bodyX + bodyW, y + h - 36).stroke();
  doc.fillColor(INK).font(pdfFont(true)).fontSize(8);
  doc.text(ticket.ticketCode, bodyX, y + h - 30, {
    width: bodyW,
    height: 11,
    lineBreak: false,
    ellipsis: true
  });
  doc.fillColor('#666666').font(pdfFont()).fontSize(7);
  doc.text(ticket.serial, bodyX, y + h - 17, {
    width: bodyW,
    height: 10,
    lineBreak: false
  });

  doc.strokeColor('#E4E4E4').lineWidth(0.7);
  doc.moveTo(rightX, y + 8).lineTo(rightX, y + h - 8).stroke();
  drawWordmark(doc, logo, rightX + 8, y + 8, RIGHT_W - 16, 20);

  const mainQr = 56;
  const mainQrX = rightX + (RIGHT_W - mainQr) / 2;
  const mainQrY = y + 32;
  drawBitmapQr(doc, ticket.qrData, mainQrX, mainQrY, mainQr);
  doc.fillColor(INK).font(pdfFont(true)).fontSize(8);
  doc.text('biletfeed', rightX + 4, mainQrY + mainQr + 3, {
    width: RIGHT_W - 8,
    align: 'center',
    lineBreak: false,
    height: 10
  });
  doc.fillColor('#444444').font(pdfFont()).fontSize(6.5);
  doc.text(ticket.ticketTypeName, rightX + 6, mainQrY + mainQr + 14, {
    width: RIGHT_W - 12,
    align: 'center',
    height: 16,
    ellipsis: true
  });

  doc.restore();
  drawPerforation(doc, perf, y, h);
  drawTicketFrame(doc, x, y, w, h);
  if (cropMarks) drawCropMarks(doc, x, y, w, h);
}

function drawBack(
  doc: PdfDoc,
  origin: { x: number; y: number },
  geo: PrintSheetGeometry,
  ticket: PrintSheetTicket,
  logo: string | null,
  cropMarks = true
) {
  const { x, y } = origin;
  const { ticketW: w, ticketH: h, stubW } = geo;
  const perf = x + stubW + COUPON_W;
  const rightX = x + w - RIGHT_W;
  const textX = perf + 10;
  const textW = rightX - textX - 8;

  doc.save();
  doc.rect(x, y, w, h).clip();
  doc.rect(x, y, w, h).fill('#FFFFFF');
  drawBrandStub(doc, x, y, stubW, h, ticket.sequenceLabel);

  doc.fillColor(INK).font(pdfFont(true)).fontSize(8);
  doc.text('biletfeed', x + stubW + 4, y + h / 2 - 18, {
    width: COUPON_W - 8,
    align: 'center',
    lineBreak: false,
    height: 12
  });
  doc.fillColor('#666666').font(pdfFont()).fontSize(6.5);
  doc.text('KOÇAN', x + stubW + 4, y + h / 2 - 4, {
    width: COUPON_W - 8,
    align: 'center',
    lineBreak: false,
    height: 9
  });
  doc.fillColor(INK).font(pdfFont(true)).fontSize(7);
  doc.text(ticket.sequenceLabel, x + stubW + 3, y + h - 18, {
    width: COUPON_W - 6,
    align: 'center',
    lineBreak: false,
    height: 10
  });

  doc.save();
  doc.rect(textX, y + 1, textW, h - 2).clip();
  doc.fillColor('#F3F3F3').font(pdfFont(true)).fontSize(28);
  doc.text('biletfeed', textX, y + h / 2 - 16, {
    width: textW,
    align: 'center',
    lineBreak: false,
    height: 34
  });
  doc.restore();

  const barY = y + 10;
  const barH = 16;
  doc.rect(textX, barY, textW, barH).fill(INK);
  doc.rect(textX, barY, 3.5, barH).fill(LIME);
  doc.fillColor('#FFFFFF').font(pdfFont(true)).fontSize(6.5);
  doc.text(PRINT_TICKET_NON_REFUNDABLE, textX + 8, barY + 4, {
    width: textW - 12,
    height: 10,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor('#666666').font(pdfFont(true)).fontSize(6.5);
  doc.text('Açıklamalar', textX, y + 32, {
    width: textW,
    height: 9,
    lineBreak: false
  });

  doc.fillColor('#222222').font(pdfFont()).fontSize(6.5);
  doc.text(PRINT_TICKET_TERMS, textX, y + 44, {
    width: textW,
    height: 92,
    ellipsis: true,
    lineGap: 1.2
  });

  doc.fillColor('#666666').font(pdfFont()).fontSize(6);
  doc.text(ticket.ticketCode, textX, y + h - 16, {
    width: textW,
    height: 9,
    lineBreak: false,
    ellipsis: true
  });

  doc.strokeColor('#E4E4E4').lineWidth(0.7);
  doc.moveTo(rightX, y + 8).lineTo(rightX, y + h - 8).stroke();
  drawWordmark(doc, logo, rightX + 8, y + 18, RIGHT_W - 16, 22);
  doc.fillColor(INK).font(pdfFont(true)).fontSize(8);
  doc.text('biletfeed', rightX + 4, y + 48, {
    width: RIGHT_W - 8,
    align: 'center',
    lineBreak: false,
    height: 11
  });
  doc.fillColor('#666666').font(pdfFont()).fontSize(7);
  doc.text('Sıra No', rightX + 4, y + 78, {
    width: RIGHT_W - 8,
    align: 'center',
    lineBreak: false,
    height: 10
  });
  doc.fillColor(INK).font(pdfFont(true)).fontSize(12);
  doc.text(ticket.sequenceLabel, rightX + 4, y + 92, {
    width: RIGHT_W - 8,
    align: 'center',
    lineBreak: false,
    height: 16
  });

  doc.restore();
  drawPerforation(doc, perf, y, h);
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
    else drawBack(doc, origin, geo, ticket, logo, false);
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
        drawBack(doc, origin, geo, item, logo);
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
