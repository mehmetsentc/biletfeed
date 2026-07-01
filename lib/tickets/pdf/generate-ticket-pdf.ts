import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { TicketPdfInput } from '@/lib/tickets/pdf/types';
import { registerPdfFonts, pdfFont } from '@/lib/tickets/pdf/fonts';
import { drawBarcodePdf, drawVerticalBarcodePdf } from '@/lib/tickets/design/barcode';
import { ticketPrintTokens as p } from '@/lib/tickets/design/print-tokens';
import {
  admissionRulesTr,
  bilingualFieldLabels,
  ticketKindLabels
} from '@/lib/tickets/design/ticket-receipt-shared';
import { platformContact } from '@/lib/config/contact';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';

type PdfDoc = InstanceType<typeof PDFDocument>;

const LOGO_PATH = path.join(process.cwd(), 'public/brand/logo-dark.png');

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function loadLogoBuffer(): Buffer | null {
  try {
    if (fs.existsSync(LOGO_PATH)) return fs.readFileSync(LOGO_PATH);
  } catch {
    /* ignore */
  }
  return null;
}

function sanitizeFilename(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'bilet'
  );
}

export function buildTicketPdfFilename(eventTitle: string, ticketCode: string): string {
  return `BiletFeed-${sanitizeFilename(eventTitle)}-${ticketCode}.pdf`;
}

function drawPerforatedLine(doc: PdfDoc, x: number, y: number, w: number) {
  const notchR = 6;
  doc.save();
  doc.fillColor(p.pageBg);
  doc.circle(x - 2, y, notchR).fill();
  doc.circle(x + w + 2, y, notchR).fill();
  doc.strokeColor(p.dash).lineWidth(1).dash(5, { space: 4 });
  doc.moveTo(x + notchR, y).lineTo(x + w - notchR, y).stroke();
  doc.undash();
  doc.restore();
}

function drawDetailRow(doc: PdfDoc, x: number, y: number, w: number, label: string, value: string) {
  doc.fillColor(p.textMuted).fontSize(7).font(pdfFont(true)).text(label.toUpperCase(), x, y, { width: w });
  doc.fillColor(p.text).fontSize(10).font(pdfFont(true)).text(value, x, y + 10, { width: w, lineGap: 0.5 });
}

function drawSummaryRow(doc: PdfDoc, x: number, y: number, w: number, label: string, value: string) {
  const labelW = w * 0.42;
  doc.save();
  doc.rect(x, y, labelW, 18).fill(p.accentSoft);
  doc.rect(x, y, w, 18).lineWidth(0.5).strokeColor(p.border).stroke();
  doc.restore();
  doc.fillColor(p.textMuted).fontSize(7).font(pdfFont(true)).text(label, x + 6, y + 5, { width: labelW - 10 });
  doc.fillColor(p.text).fontSize(8.5).font(pdfFont(true)).text(value, x + labelW + 6, y + 5, { width: w - labelW - 10 });
}

export async function generateTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(input.qrData, {
    width: 280,
    margin: 1,
    color: { dark: '#111111', light: '#ffffff' }
  });

  const logoBuffer = loadLogoBuffer();
  const isValid = input.status === 'VALID';
  const isInvitation = input.kind === 'invitation';
  const labels = ticketKindLabels(input.kind);
  const rules = admissionRulesTr(input.kind);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `${input.eventTitle} — BiletFeed`,
        Author: 'BiletFeed',
        Subject: isInvitation ? 'Davetiye' : 'Etkinlik Bileti'
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    registerPdfFonts(doc);

    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const cardX = 32;
    const cardY = 28;
    const cardW = pageW - 64;
    const pad = 20;
    const innerX = cardX + pad;
    const innerW = cardW - pad * 2;

    doc.rect(0, 0, pageW, pageH).fill(p.pageBg);

    // Card outline
    doc.save();
    doc.roundedRect(cardX, cardY, cardW, pageH - cardY * 2, 6).lineWidth(1).strokeColor(p.border).stroke();
    doc.restore();

    let cursorY = cardY;

    // ── Header — BiletFeed marka ──
    const headerH = 50;
    doc.rect(cardX, cardY, cardW, headerH).fill(p.pageBg);

    if (logoBuffer) {
      doc.image(logoBuffer, innerX, cardY + 12, { height: 28 });
    } else {
      doc.fillColor(p.text).fontSize(14).font(pdfFont(true)).text('BiletFeed', innerX, cardY + 16);
    }

    doc.fillColor(p.text)
      .fontSize(8.5)
      .font(pdfFont(true))
      .text(labels.tr, cardX + cardW - pad - 100, cardY + 14, { width: 100, align: 'right' });

    doc.fillColor(p.textMuted)
      .fontSize(7)
      .font(pdfFont())
      .text('biletfeed.com', cardX + cardW - pad - 100, cardY + 28, { width: 100, align: 'right' });

    doc.save();
    doc.moveTo(innerX, cardY + headerH - 3)
      .lineTo(innerX + innerW, cardY + headerH - 3)
      .lineWidth(3)
      .strokeColor(p.accent)
      .stroke();
    doc.restore();

    cursorY += headerH + 12;

    // ── Admission strip (QR + rules + vertical barcode) ──
    const admissionH = 132;
    const qrSize = 96;
    const qrBox = qrSize + 16;

    doc.save();
    doc.roundedRect(innerX, cursorY, qrBox, qrBox, 4).lineWidth(0.75).strokeColor(p.border).stroke();
    doc.restore();
    doc.image(qrBuffer, innerX + 8, cursorY + 8, { width: qrSize, height: qrSize });

    const rulesX = innerX + qrBox + 16;
    const rulesW = innerW - qrBox - 16 - 44;

    doc.fillColor(p.text).fontSize(8).font(pdfFont(true)).text('GİRİŞ KURALLARI', rulesX, cursorY + 4);
    let ruleY = cursorY + 18;
    for (const line of rules) {
      doc.fillColor(p.textSecondary).fontSize(7.5).font(pdfFont()).text(line, rulesX, ruleY, { width: rulesW, lineGap: 0.5 });
      ruleY += 14;
    }

    const vBarX = cardX + cardW - pad - 18;
    drawVerticalBarcodePdf(doc, vBarX, cursorY + admissionH / 2, input.ticketCode, 110, 32, p.text);
    doc.fillColor(p.textMuted)
      .fontSize(6.5)
      .font(pdfFont())
      .text(input.ticketCode, vBarX - 28, cursorY + admissionH - 10, { width: 80, align: 'center' });

    cursorY += admissionH + 8;
    drawPerforatedLine(doc, innerX, cursorY, innerW);
    cursorY += 18;

    // ── Main ticket body ──
    const bodyLeftBarX = innerX + 6;
    drawVerticalBarcodePdf(doc, bodyLeftBarX, cursorY + 72, input.ticketCode, 90, 24, p.text);

    const bodyX = innerX + 28;
    const bodyW = innerW - 100;

    // Watermark
    doc.save();
    doc.fillColor(p.watermark).fontSize(28).font(pdfFont(true));
    doc.text(labels.en, cardX + cardW - pad - 8, cursorY + 20, {
      width: 120,
      align: 'right',
      characterSpacing: 2
    });
    doc.restore();

    doc.fillColor(p.text).fontSize(18).font(pdfFont(true)).text(input.eventTitle.toUpperCase(), bodyX, cursorY, {
      width: bodyW,
      lineGap: 1
    });
    const titleH = doc.heightOfString(input.eventTitle.toUpperCase(), { width: bodyW, lineGap: 1 });
    cursorY += titleH + 8;

    const holderLine = isInvitation
      ? `${input.holderName} adına düzenlenmiştir`
      : `Sayın ${input.holderName}`;
    doc.fillColor(p.textSecondary).fontSize(9).font(pdfFont()).text(holderLine, bodyX, cursorY, { width: bodyW });
    cursorY += 16;

    if (input.personalMessage?.trim()) {
      doc.save();
      doc.roundedRect(bodyX, cursorY, bodyW, 34, 4).fill(p.accentSoft);
      doc.restore();
      doc.fillColor(p.textSecondary)
        .fontSize(8)
        .font(pdfFont())
        .text(`"${input.personalMessage.trim()}"`, bodyX + 10, cursorY + 10, { width: bodyW - 20, lineGap: 0.5 });
      cursorY += 42;
    }

    doc.fillColor(p.accent).fontSize(9).font(pdfFont(true)).text(labels.typeLabel, bodyX, cursorY, { width: bodyW });
    cursorY += 14;

    const colW = (bodyW - 16) / 2;
    const row1Y = cursorY;
    drawDetailRow(doc, bodyX, row1Y, colW, bilingualFieldLabels.venue, `${input.venue}, ${input.city}`);
    drawDetailRow(doc, bodyX + colW + 16, row1Y, colW, bilingualFieldLabels.date, input.eventDate);

    const row2Y = row1Y + 34;
    drawDetailRow(doc, bodyX, row2Y, colW, bilingualFieldLabels.time, input.eventTime);
    drawDetailRow(
      doc,
      bodyX + colW + 16,
      row2Y,
      colW,
      isInvitation ? 'DAVETİYE TÜRÜ / TYPE' : bilingualFieldLabels.type,
      input.ticketTypeName
    );

    const row3Y = row2Y + 34;
    drawDetailRow(doc, bodyX, row3Y, colW, bilingualFieldLabels.holder, input.holderName);
    drawDetailRow(doc, bodyX + colW + 16, row3Y, colW, labels.codeLabelEn, input.ticketCode);

    cursorY = row3Y + 40;
    drawSummaryRow(doc, bodyX, cursorY, bodyW, 'Kod / Code', input.ticketCode);
    cursorY += 20;
    drawSummaryRow(doc, bodyX, cursorY, bodyW, 'Kategori / Category', input.ticketTypeName);
    cursorY += 24;

    const badgeLabel = isValid ? 'GEÇERLİ / VALID' : 'GEÇERSİZ / INVALID';
    const badgeColor = isValid ? p.success : p.danger;
    doc.save();
    doc.roundedRect(bodyX, cursorY, 72, 18, 3).fill(`${badgeColor}22`);
    doc.restore();
    doc.fillColor(badgeColor).fontSize(7.5).font(pdfFont(true)).text(badgeLabel, bodyX, cursorY + 5, {
      width: 72,
      align: 'center'
    });

    // Horizontal barcode under details
    drawBarcodePdf(doc, bodyX + 90, cursorY - 2, input.ticketCode, Math.min(bodyW - 90, 200), 26, p.text);

    cursorY += 28;
    drawPerforatedLine(doc, innerX, cursorY, innerW);
    cursorY += 14;

    // ── Footer terms ──
    doc.fillColor(p.textMuted).fontSize(7).font(pdfFont(true)).text('ŞARTLAR / TERMS', innerX, cursorY);
    cursorY += 12;

    doc.fillColor(p.textSecondary).fontSize(6.5).font(pdfFont()).text(ticketTermsTr(input.kind), innerX, cursorY, {
      width: innerW,
      lineGap: 0.5
    });
    cursorY += doc.heightOfString(ticketTermsTr(input.kind), { width: innerW, lineGap: 0.5 }) + 4;

    doc.fillColor(p.textMuted).fontSize(6).font(pdfFont()).text(ticketTermsEn(input.kind), innerX, cursorY, {
      width: innerW,
      lineGap: 0.5
    });
    cursorY += doc.heightOfString(ticketTermsEn(input.kind), { width: innerW, lineGap: 0.5 }) + 8;

    doc.save();
    doc.moveTo(innerX, cursorY).lineTo(innerX + innerW, cursorY).lineWidth(0.5).strokeColor(p.border).stroke();
    doc.restore();
    cursorY += 8;

    doc.fillColor(p.textDim).fontSize(6).font(pdfFont()).text(ticketCompanyLegalLine(), innerX, cursorY, {
      width: innerW
    });
    cursorY += 8;
    doc.text(ticketCompanyAddressLine(), innerX, cursorY, { width: innerW });
    cursorY += 8;
    doc.text(ticketCompanyContactLine(), innerX, cursorY, { width: innerW });

    doc.fillColor(p.accent).fontSize(7).font(pdfFont(true)).text('biletfeed.com', innerX, cursorY + 10, {
      width: innerW - 120,
      align: 'right'
    });
    doc.fillColor(p.textMuted).fontSize(6.5).font(pdfFont(true)).text('Yardım / Support', innerX + innerW - 115, cursorY, {
      width: 115,
      align: 'right'
    });
    doc.fillColor(p.accent).fontSize(6.5).font(pdfFont()).text(platformContact.email, innerX + innerW - 115, cursorY + 9, {
      width: 115,
      align: 'right'
    });

    doc.end();
  });
}
