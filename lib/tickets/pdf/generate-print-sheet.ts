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
const LOGO_ON_LIGHT = path.join(process.cwd(), 'public/brand/logo-dark.png');
const LOGO_ON_DARK = path.join(process.cwd(), 'public/brand/logo-light.png');
const INK = '#111111';
const PAPER = '#FFFFFF';
const LIME = '#DFFF00';

type BrandLogos = { onLight: string | null; onDark: string | null };

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
  const stubW = 48 * MM;
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

function existingLogo(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) return filePath;
  } catch {
    /* wordmark'a düş */
  }
  return null;
}

function brandLogos(): BrandLogos {
  return {
    onLight: existingLogo(LOGO_ON_LIGHT),
    onDark: existingLogo(LOGO_ON_DARK)
  };
}

function upper(value: string): string {
  return value.toLocaleUpperCase('tr-TR');
}

function splitDateTime(label: string): { date: string; time: string } {
  const match = label.trim().match(/^(.*)\s+(\d{1,2}:\d{2})$/);
  if (!match?.[1] || !match[2]) return { date: label, time: '' };
  return { date: match[1], time: match[2] };
}

/** Metni kutuya sığdırır. Sanatçı adı kesilmez; punto küçülür, satır kırılır. */
function drawFittedText(
  doc: PdfDoc,
  text: string,
  x: number,
  y: number,
  width: number,
  maxHeight: number,
  options: {
    maxSize: number;
    minSize: number;
    bold?: boolean;
    color?: string;
    align?: 'left' | 'center';
  }
) {
  const bold = options.bold !== false;
  const align = options.align ?? 'left';
  let size = options.maxSize;
  doc.font(pdfFont(bold));
  while (size > options.minSize) {
    doc.fontSize(size);
    const height = doc.heightOfString(text, { width, align, lineGap: 1 });
    if (height <= maxHeight) break;
    size -= 0.5;
  }
  doc.fillColor(options.color ?? INK).font(pdfFont(bold)).fontSize(size);
  doc.text(text, x, y, {
    width,
    height: maxHeight,
    align,
    lineGap: 1,
    ellipsis: false
  });
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

function drawPerforation(doc: PdfDoc, x: number, y: number, h: number, paper: string) {
  doc.save();
  doc.strokeColor(LIME).lineWidth(1.1).dash(1.4, { space: 2.1 });
  doc.moveTo(x, y + 8).lineTo(x, y + h - 8).stroke();
  doc.undash();
  doc.fillColor(paper);
  doc.circle(x, y, 5).fill();
  doc.circle(x, y + h, 5).fill();
  doc.restore();
}

function drawTicketFrame(doc: PdfDoc, x: number, y: number, w: number, h: number) {
  doc.save();
  doc.lineWidth(1.35).strokeColor(INK).roundedRect(x, y, w, h, 8).stroke();
  doc.restore();
}

function drawWordmark(
  doc: PdfDoc,
  logo: string | null,
  x: number,
  y: number,
  width: number,
  height: number,
  align: 'left' | 'center' = 'left',
  fallbackColor = INK
) {
  if (logo) {
    doc.image(logo, x, y, {
      fit: [width, height],
      align: align === 'center' ? 'center' : undefined,
      valign: 'center'
    });
    return;
  }
  doc.fillColor(fallbackColor).font(pdfFont(true)).fontSize(12);
  doc.text('biletfeed', x, y + Math.max(0, (height - 13) / 2), {
    width,
    align,
    lineBreak: false,
    height
  });
}

function drawTypeChip(doc: PdfDoc, label: string, x: number, y: number, maxWidth: number) {
  const text = upper(label);
  doc.font(pdfFont(true)).fontSize(8);
  const chipW = Math.min(maxWidth, doc.widthOfString(text) + 14);
  doc.roundedRect(x, y, chipW, 16, 3).fill(LIME);
  doc.fillColor(INK).text(text, x + 7, y + 4, {
    width: chipW - 14,
    height: 10,
    lineBreak: false,
    ellipsis: true
  });
}

function drawFront(
  doc: PdfDoc,
  origin: { x: number; y: number },
  geo: PrintSheetGeometry,
  ticket: PrintSheetTicket,
  logos: BrandLogos,
  cropMarks = true,
  paper = PAPER
) {
  const { x, y } = origin;
  const { ticketW: w, ticketH: h, stubW } = geo;
  const perf = x + w - stubW;
  const left = x + 16;
  const when = splitDateTime(ticket.dateTimeLabel);
  const dateColW = 96;
  const dateX = perf - 12 - dateColW;
  const titleW = perf - 12 - left;

  doc.save();
  doc.roundedRect(x, y, w, h, 8).clip();
  doc.rect(x, y, w, h).fill(PAPER);
  doc.rect(x, y, 5, h).fill(LIME);
  doc.rect(perf, y, x + w - perf, h).fill(INK);

  drawWordmark(doc, logos.onLight, left, y + 10, 148, 22);

  doc.fillColor(INK).font(pdfFont(true)).fontSize(10);
  doc.text(upper(when.date), dateX, y + 10, {
    width: dateColW,
    height: 12,
    ellipsis: true,
    lineBreak: false
  });
  if (when.time) {
    doc.fontSize(14);
    doc.text(when.time, dateX, y + 22, {
      width: dateColW,
      height: 16,
      lineBreak: false
    });
  }

  const title = upper(ticket.eventTitle);
  drawFittedText(doc, title, left, y + 40, titleW, 40, {
    maxSize: 18,
    minSize: 11,
    bold: true
  });
  doc.fillColor(INK).font(pdfFont(true)).fontSize(11);
  doc.text(upper(ticket.venueName), left, y + 82, {
    width: titleW,
    height: 14,
    ellipsis: true,
    lineBreak: false
  });
  doc.fillColor('#444444').font(pdfFont()).fontSize(8);
  doc.text(ticket.addressLine, left, y + 98, {
    width: titleW,
    height: 11,
    ellipsis: true,
    lineBreak: false
  });

  const qr = 48;
  const qrX = left;
  const qrY = y + h - 16 - qr;
  doc.fillColor('#555555').font(pdfFont()).fontSize(7);
  doc.text(ticket.ticketCode, qrX, qrY - 12, {
    width: qr + 8,
    height: 10,
    lineBreak: false,
    ellipsis: true
  });
  drawBitmapQr(doc, ticket.qrData, qrX, qrY, qr);

  const metaX = qrX + qr + 16;
  const metaW = dateX + dateColW - metaX;
  drawTypeChip(doc, ticket.ticketTypeName, metaX, qrY + 6, metaW);
  doc.fillColor('#444444').font(pdfFont()).fontSize(9);
  doc.text(ticket.serial, metaX, qrY + 28, {
    width: metaW,
    height: 12,
    lineBreak: false,
    ellipsis: true
  });

  const stubX = perf + 10;
  const stubTextW = stubW - 20;
  drawWordmark(doc, logos.onDark, stubX, y + 8, stubTextW, 14, 'center', '#FFFFFF');
  drawFittedText(doc, upper(ticket.eventTitle), stubX, y + 26, stubTextW, 36, {
    maxSize: 8.5,
    minSize: 6.5,
    bold: true,
    color: '#FFFFFF',
    align: 'center'
  });
  doc.fillColor('#FFFFFF').font(pdfFont()).fontSize(7);
  doc.text(upper(when.date), stubX, y + 64, {
    width: stubTextW,
    align: 'center',
    height: 9,
    ellipsis: true,
    lineBreak: false
  });
  if (when.time) {
    doc.font(pdfFont(true)).fontSize(9);
    doc.text(when.time, stubX, y + 74, {
      width: stubTextW,
      align: 'center',
      height: 11,
      lineBreak: false
    });
  }
  const stubQr = 48;
  const stubQrX = perf + (stubW - stubQr) / 2;
  const stubQrY = y + h - 94;
  doc.rect(stubQrX - 3, stubQrY - 3, stubQr + 6, stubQr + 6).fill('#FFFFFF');
  drawBitmapQr(doc, ticket.qrData, stubQrX, stubQrY, stubQr);
  doc.fillColor(LIME).font(pdfFont(true)).fontSize(8);
  doc.text('GİRİŞ', stubX, stubQrY + stubQr + 6, {
    width: stubTextW,
    align: 'center',
    lineBreak: false,
    height: 10
  });
  doc.fillColor('#FFFFFF').font(pdfFont()).fontSize(7.5);
  doc.text(upper(ticket.ticketTypeName), stubX, stubQrY + stubQr + 18, {
    width: stubTextW,
    align: 'center',
    height: 16,
    ellipsis: true
  });

  doc.restore();
  drawTicketFrame(doc, x, y, w, h);
  drawPerforation(doc, perf, y, h, paper);
  if (cropMarks) drawCropMarks(doc, x, y, w, h);
}

function drawBack(
  doc: PdfDoc,
  origin: { x: number; y: number },
  geo: PrintSheetGeometry,
  ticket: PrintSheetTicket,
  logos: BrandLogos,
  cropMarks = true,
  paper = PAPER
) {
  const { x, y } = origin;
  const { ticketW: w, ticketH: h, stubW } = geo;
  const perf = x + w - stubW;
  const left = x + 16;
  const textW = perf - left - 14;

  doc.save();
  doc.roundedRect(x, y, w, h, 8).clip();
  doc.rect(x, y, w, h).fill(PAPER);
  doc.rect(x, y, 5, h).fill(LIME);
  doc.rect(perf, y, x + w - perf, h).fill(INK);

  drawWordmark(doc, logos.onLight, left, y + 14, 140, 24);
  const barY = y + 46;
  doc.rect(left, barY, textW, 16).fill(INK);
  doc.rect(left, barY, 4, 16).fill(LIME);
  doc.fillColor('#FFFFFF').font(pdfFont(true)).fontSize(7);
  doc.text(upper(PRINT_TICKET_NON_REFUNDABLE), left + 10, barY + 4, {
    width: textW - 16,
    height: 10,
    ellipsis: true,
    lineBreak: false
  });

  doc.fillColor('#666666').font(pdfFont(true)).fontSize(7);
  doc.text('AÇIKLAMALAR', left, y + 70, {
    width: textW,
    height: 10,
    lineBreak: false
  });
  doc.fillColor('#222222').font(pdfFont()).fontSize(7.5);
  doc.text(PRINT_TICKET_TERMS, left, y + 84, {
    width: textW,
    height: 78,
    ellipsis: true,
    lineGap: 1.4
  });
  doc.fillColor('#555555').font(pdfFont()).fontSize(7);
  doc.text(ticket.ticketCode, left, y + h - 18, {
    width: textW,
    height: 10,
    lineBreak: false,
    ellipsis: true
  });

  const stubX = perf + 10;
  const stubTextW = stubW - 20;
  drawWordmark(doc, logos.onDark, stubX, y + 12, stubTextW, 16, 'center', '#FFFFFF');
  doc.fillColor(LIME).font(pdfFont(true)).fontSize(8);
  doc.text('SIRA', stubX, y + 36, {
    width: stubTextW,
    align: 'center',
    lineBreak: false,
    height: 10
  });
  doc.fillColor('#FFFFFF').fontSize(16);
  doc.text(ticket.sequenceLabel, stubX, y + 50, {
    width: stubTextW,
    align: 'center',
    lineBreak: false,
    height: 18
  });
  drawFittedText(doc, upper(ticket.eventTitle), stubX, y + 70, stubTextW, 28, {
    maxSize: 7.5,
    minSize: 6,
    bold: false,
    color: '#FFFFFF',
    align: 'center'
  });
  const stubQr = 50;
  const stubQrX = perf + (stubW - stubQr) / 2;
  const stubQrY = y + h - 16 - stubQr;
  doc.rect(stubQrX - 3, stubQrY - 3, stubQr + 6, stubQr + 6).fill('#FFFFFF');
  drawBitmapQr(doc, ticket.qrData, stubQrX, stubQrY, stubQr);

  doc.restore();
  drawTicketFrame(doc, x, y, w, h);
  drawPerforation(doc, perf, y, h, paper);
  if (cropMarks) drawCropMarks(doc, x, y, w, h);
}

/** Tek biletin ön veya arka yüzü — sunum ve prova. */
export async function generateTicketFacePdf(
  ticket: PrintSheetTicket,
  side: 'front' | 'back'
): Promise<Buffer> {
  const geo = printSheetGeometry();
  const pad = 12;
  const logos = brandLogos();

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
    const paper = '#E4E7EC';
    doc.rect(0, 0, geo.ticketW + pad * 2, geo.ticketH + pad * 2).fill(paper);
    const origin = { x: pad, y: pad };
    if (side === 'front') drawFront(doc, origin, geo, ticket, logos, false, paper);
    else drawBack(doc, origin, geo, ticket, logos, false, paper);
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

  const logos = brandLogos();
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
        drawFront(doc, origin, geo, item, logos);
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
        drawBack(doc, origin, geo, item, logos);
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
