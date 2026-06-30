import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { TicketPdfInput } from '@/lib/tickets/pdf/types';
import { registerPdfFonts, pdfFont } from '@/lib/tickets/pdf/fonts';
import { drawBarcodePdf } from '@/lib/tickets/design/barcode';
import { ticketDesignTokens as t } from '@/lib/tickets/design/tokens';
import {
  ticketCompanyAddressLine,
  ticketCompanyContactLine,
  ticketCompanyLegalLine,
  ticketTermsEn,
  ticketTermsTr
} from '@/lib/tickets/design/terms';

type PdfDoc = InstanceType<typeof PDFDocument>;

const LOGO_PATH = path.join(process.cwd(), 'public/brand/logo-light.png');

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

function drawInfoCell(
  doc: PdfDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
) {
  doc.save();
  doc.roundedRect(x, y, w, h, 8).fillAndStroke('#1a2230', '#2a3544');
  doc.fillColor(t.orange).fontSize(7.5).font(pdfFont(true)).text(label.toUpperCase(), x + 10, y + 8, {
    width: w - 20
  });
  doc.fillColor(t.textPrimary).fontSize(9.5).font(pdfFont(true)).text(value, x + 10, y + 20, {
    width: w - 20,
    lineGap: 1
  });
  doc.restore();
}

export async function generateTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(input.qrData, {
    width: 320,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const coverBuffer = input.coverImageUrl ? await fetchImageBuffer(input.coverImageUrl) : null;
  const logoBuffer = loadLogoBuffer();
  const isValid = input.status === 'VALID';
  const isInvitation = input.kind === 'invitation';
  const kindLabel = isInvitation ? 'DAVETİYE' : 'ETKİNLİK BİLETİ';
  const codeLabel = isInvitation ? 'DAVETİYE KODU' : 'BİLET KODU';

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
    const cardX = 36;
    const cardY = 32;
    const cardW = pageW - 72;
    const cardH = pageH - 64;
    const contentX = cardX + 22;
    const contentW = cardW - 44;

    doc.rect(0, 0, pageW, pageH).fill(t.pageBg);

    doc.save();
    doc.roundedRect(cardX, cardY, cardW, cardH, 14).fill(t.cardBg);
    doc.restore();

    let cursorY = cardY;

    // Header strip
    const headerH = 48;
    doc.save();
    doc.roundedRect(cardX, cardY, cardW, headerH + 8, 14).clip();
    doc.rect(cardX, cardY, cardW, headerH).fill(t.orange);
    doc.restore();

    if (logoBuffer) {
      doc.image(logoBuffer, cardX + 18, cardY + 12, { height: 24 });
    } else {
      doc.fillColor('#000').fontSize(14).font(pdfFont(true)).text('bilet', cardX + 18, cardY + 16, {
        continued: true
      });
      doc.fillColor('#1a1a1a').text('feed');
    }

    doc.fillColor('#000')
      .fontSize(9)
      .font(pdfFont(true))
      .text(kindLabel, cardX + cardW - 130, cardY + 18, { width: 118, align: 'right' });

    cursorY += headerH + 16;

    // Cover image
    if (coverBuffer) {
      const coverH = 130;
      doc.save();
      doc.rect(cardX + 1, cursorY, cardW - 2, coverH).clip();
      doc.image(coverBuffer, cardX, cursorY, { width: cardW, height: coverH, align: 'center', valign: 'center' });
      doc.save();
      doc.fillOpacity(0.85);
      doc.rect(cardX, cursorY + coverH - 50, cardW, 50).fill(t.cardBg);
      doc.fillOpacity(1);
      doc.restore();
      doc.restore();
      cursorY += coverH + 12;
    }

    // Title section
    if (isInvitation) {
      doc.fillColor(t.orange).fontSize(8).font(pdfFont(true)).text('SAYIN DAVETLİ', contentX, cursorY);
      cursorY += 14;
    }

    doc.fillColor(t.textPrimary).fontSize(17).font(pdfFont(true)).text(input.eventTitle, contentX, cursorY, {
      width: contentW - 80,
      lineGap: 1
    });

    const badgeLabel = isValid ? 'Geçerli' : 'Geçersiz';
    const badgeColor = isValid ? t.success : t.danger;
    const badgeW = 68;
    const badgeH = 20;
    const badgeX = cardX + cardW - badgeW - 22;
    doc.save();
    doc.fillOpacity(0.15);
    doc.roundedRect(badgeX, cursorY, badgeW, badgeH, 10).fill(badgeColor);
    doc.fillOpacity(1);
    doc.restore();
    doc.fillColor(badgeColor).fontSize(7.5).font(pdfFont(true)).text(badgeLabel, badgeX, cursorY + 6, {
      width: badgeW,
      align: 'center'
    });

    cursorY += doc.heightOfString(input.eventTitle, { width: contentW - 80, lineGap: 1 }) + 6;

    const holderLine = isInvitation
      ? `${input.holderName} adına düzenlenmiştir.`
      : `Sayın ${input.holderName}`;
    doc.fillColor(t.textSecondary).fontSize(9.5).font(pdfFont()).text(holderLine, contentX, cursorY, {
      width: contentW
    });
    cursorY += 16;

    if (input.personalMessage?.trim()) {
      doc.save();
      doc.roundedRect(contentX, cursorY, contentW, 40, 6).fill(`${t.orange}18`);
      doc.restore();
      doc.fillColor('#cccccc')
        .fontSize(8.5)
        .font(pdfFont())
        .text(`"${input.personalMessage.trim()}"`, contentX + 10, cursorY + 10, {
          width: contentW - 20,
          lineGap: 1
        });
      cursorY += 48;
    }

    // 3-column info grid
    const gridItems = [
      { label: 'Tarih', value: input.eventDate },
      { label: 'Saat', value: input.eventTime },
      { label: 'Mekan', value: `${input.venue}, ${input.city}` },
      { label: isInvitation ? 'Davetiye Türü' : 'Bilet Türü', value: input.ticketTypeName },
      { label: 'Katılımcı', value: input.holderName }
    ];

    const cols = 3;
    const gap = 8;
    const cellW = (contentW - gap * (cols - 1)) / cols;
    const cellH = 40;

    gridItems.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      drawInfoCell(
        doc,
        contentX + col * (cellW + gap),
        cursorY + row * (cellH + gap),
        cellW,
        cellH,
        item.label,
        item.value
      );
    });

    const gridRows = Math.ceil(gridItems.length / cols);
    cursorY += gridRows * (cellH + gap) + 12;

    // Dashed divider
    doc.save();
    doc.strokeColor(t.divider).lineWidth(1).dash(4, { space: 4 });
    doc.moveTo(contentX, cursorY).lineTo(contentX + contentW, cursorY).stroke();
    doc.undash();
    doc.restore();
    cursorY += 18;

    // QR + reference section
    const qrSize = 120;
    doc.save();
    doc.roundedRect(contentX, cursorY, qrSize + 20, qrSize + 20, 12).fill('#ffffff');
    doc.restore();
    doc.image(qrBuffer, contentX + 10, cursorY + 10, { width: qrSize, height: qrSize });

    const infoX = contentX + qrSize + 36;
    const infoW = contentW - qrSize - 36;

    doc.fillColor(t.textMuted).fontSize(7.5).font(pdfFont(true)).text(codeLabel, infoX, cursorY + 4);
    doc.fillColor(t.textPrimary).fontSize(15).font(pdfFont(true)).text(input.ticketCode, infoX, cursorY + 16, {
      width: infoW,
      characterSpacing: 1.5
    });

    drawBarcodePdf(doc, infoX, cursorY + 38, input.ticketCode, Math.min(infoW, 180), 28, '#ffffff');

    doc.fillColor(t.textMuted)
      .fontSize(8)
      .font(pdfFont())
      .text(
        isInvitation
          ? 'Girişte bu QR kodu veya davetiye kodunu gösterin.'
          : 'Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.',
        infoX,
        cursorY + 72,
        { width: infoW, lineGap: 1 }
      );

    doc.save();
    doc.roundedRect(infoX, cursorY + 98, infoW, 2.5, 2).fill(t.orange);
    doc.restore();

    cursorY += qrSize + 36;

    // Terms footer
    doc.strokeColor('#ffffff18').lineWidth(0.5);
    doc.moveTo(contentX, cursorY).lineTo(contentX + contentW, cursorY).stroke();
    cursorY += 10;

    doc.fillColor(t.textMuted).fontSize(7).font(pdfFont()).text(ticketTermsTr(input.kind), contentX, cursorY, {
      width: contentW,
      lineGap: 0.5
    });
    cursorY += doc.heightOfString(ticketTermsTr(input.kind), { width: contentW, lineGap: 0.5 }) + 4;

    doc.fillColor(t.textDim).fontSize(6.5).font(pdfFont()).text(ticketTermsEn(input.kind), contentX, cursorY, {
      width: contentW,
      lineGap: 0.5
    });
    cursorY += doc.heightOfString(ticketTermsEn(input.kind), { width: contentW, lineGap: 0.5 }) + 6;

    doc.fillColor(t.textDim).fontSize(6.5).font(pdfFont()).text(ticketCompanyLegalLine(), contentX, cursorY, {
      width: contentW
    });
    cursorY += 9;
    doc.text(ticketCompanyAddressLine(), contentX, cursorY, { width: contentW });
    cursorY += 9;
    doc.text(ticketCompanyContactLine(), contentX, cursorY, { width: contentW });

    doc.fillColor(t.textDim).fontSize(6.5).font(pdfFont()).text('biletfeed.com', contentX, cursorY + 12, {
      width: contentW,
      align: 'right'
    });

    doc.end();
  });
}
