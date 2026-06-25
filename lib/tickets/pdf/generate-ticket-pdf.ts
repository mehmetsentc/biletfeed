import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import type { TicketPdfInput } from '@/lib/tickets/pdf/types';
import { registerPdfFonts, pdfFont } from '@/lib/tickets/pdf/fonts';

type PdfDoc = InstanceType<typeof PDFDocument>;

const BRAND_GOLD = '#f5a623';
const BG_DARK = '#0c1017';
const BG_CARD = '#13191f';
const TEXT_MUTED = '#999999';
const VALID_GREEN = '#34d399';
const INVALID_RED = '#ef4444';

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

function sanitizeFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'bilet';
}

export function buildTicketPdfFilename(eventTitle: string, ticketCode: string): string {
  return `BiletFeed-${sanitizeFilename(eventTitle)}-${ticketCode}.pdf`;
}

function drawDetailBox(
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
  doc.fillColor(BRAND_GOLD).fontSize(8).font(pdfFont(true)).text(label.toUpperCase(), x + 12, y + 10, {
    width: w - 24
  });
  doc.fillColor('#ffffff').fontSize(10).font(pdfFont(true)).text(value, x + 12, y + 24, {
    width: w - 24,
    lineGap: 2
  });
  doc.restore();
}

export async function generateTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(input.qrData, {
    width: 280,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const coverBuffer = input.coverImageUrl ? await fetchImageBuffer(input.coverImageUrl) : null;
  const isValid = input.status === 'VALID';
  const isInvitation = input.kind === 'invitation';

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
    const cardX = 40;
    const cardY = 36;
    const cardW = pageW - 80;
    const cardH = pageH - 72;

    doc.rect(0, 0, pageW, pageH).fill(BG_DARK);

    doc.save();
    doc.roundedRect(cardX, cardY, cardW, cardH, 16).fill(BG_CARD);
    doc.restore();

    let cursorY = cardY;

    if (coverBuffer) {
      const coverH = 150;
      doc.save();
      doc.roundedRect(cardX, cardY, cardW, coverH + 16, 16).clip();
      doc.image(coverBuffer, cardX, cardY, { width: cardW, height: coverH, align: 'center', valign: 'center' });
      doc.save();
      doc.fillOpacity(0.75);
      doc.rect(cardX, cardY + coverH - 70, cardW, 70).fill('#0c1017');
      doc.fillOpacity(1);
      doc.restore();
      doc.restore();

      doc.fillColor('#ffffff').fontSize(16).font(pdfFont(true)).text('bilet', cardX + 20, cardY + 18, {
        continued: true
      });
      doc.fillColor(BRAND_GOLD).text('feed');

      cursorY = cardY + coverH;
    } else {
      const headerH = 52;
      doc.save();
      doc.roundedRect(cardX, cardY, cardW, headerH, 16).clip();
      doc.rect(cardX, cardY, cardW, headerH).fill(BRAND_GOLD);
      doc.restore();

      doc.fillColor('#000000').fontSize(16).font(pdfFont(true)).text('bilet', cardX + 20, cardY + 16, {
        continued: true
      });
      doc.fillColor('#1a1a1a').text('feed');

      doc.fillColor('#000000')
        .fontSize(9)
        .font(pdfFont(true))
        .text(isInvitation ? 'DAVETİYE' : 'ETKİNLİK BİLETİ', cardX + cardW - 130, cardY + 20, {
          width: 110,
          align: 'right'
        });

      cursorY = cardY + headerH;
    }

    const contentX = cardX + 24;
    const contentW = cardW - 48;
    cursorY += 20;

    if (isInvitation) {
      doc.fillColor(BRAND_GOLD).fontSize(9).font(pdfFont(true)).text('SAYIN DAVETLİ', contentX, cursorY);
      cursorY += 16;
    }

    doc.fillColor('#ffffff').fontSize(18).font(pdfFont(true)).text(input.eventTitle, contentX, cursorY, {
      width: contentW - 90,
      lineGap: 2
    });

    const badgeLabel = isValid
      ? isInvitation
        ? 'Geçerli'
        : 'Geçerli'
      : 'Geçersiz';
    const badgeColor = isValid ? VALID_GREEN : INVALID_RED;
    const badgeW = 72;
    const badgeH = 22;
    const badgeX = cardX + cardW - badgeW - 24;
    doc.save();
    doc.fillOpacity(0.15);
    doc.roundedRect(badgeX, cursorY, badgeW, badgeH, 11).fill(badgeColor);
    doc.fillOpacity(1);
    doc.restore();
    doc.fillColor(badgeColor).fontSize(8).font(pdfFont(true)).text(badgeLabel, badgeX, cursorY + 7, {
      width: badgeW,
      align: 'center'
    });

    cursorY += doc.heightOfString(input.eventTitle, { width: contentW - 90, lineGap: 2 }) + 8;

    const holderLine = isInvitation
      ? `Sayın ${input.holderName} adına düzenlenmiştir.`
      : `Sayın ${input.holderName}`;
    doc.fillColor(TEXT_MUTED).fontSize(10).font(pdfFont()).text(holderLine, contentX, cursorY, {
      width: contentW
    });
    cursorY += 18;

    if (input.personalMessage?.trim()) {
      doc.save();
      doc.roundedRect(contentX, cursorY, contentW, 44, 8).fill('#f5a62311');
      doc.restore();
      doc.fillColor('#cccccc')
        .fontSize(9)
        .font(pdfFont())
        .text(`"${input.personalMessage.trim()}"`, contentX + 12, cursorY + 10, {
          width: contentW - 24,
          lineGap: 2
        });
      cursorY += 52;
    }

    const boxW = (contentW - 10) / 2;
    const boxH = 44;
    const details = [
      { label: 'Tarih', value: input.eventDate },
      { label: 'Saat', value: input.eventTime },
      { label: 'Mekan', value: `${input.venue}, ${input.city}` },
      {
        label: isInvitation ? 'Davetiye Türü' : 'Bilet Türü',
        value: input.ticketTypeName
      }
    ];

    details.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      drawDetailBox(
        doc,
        contentX + col * (boxW + 10),
        cursorY + row * (boxH + 10),
        boxW,
        boxH,
        item.label,
        item.value
      );
    });
    cursorY += boxH * 2 + 20;

    doc.save();
    doc.strokeColor('#f5a62344').lineWidth(1).dash(4, { space: 4 });
    doc.moveTo(contentX, cursorY).lineTo(contentX + contentW, cursorY).stroke();
    doc.undash();
    doc.restore();
    cursorY += 24;

    const qrSize = 130;
    doc.save();
    doc.roundedRect(contentX, cursorY, qrSize + 24, qrSize + 24, 14).fill('#ffffff');
    doc.restore();
    doc.image(qrBuffer, contentX + 12, cursorY + 12, { width: qrSize, height: qrSize });

    const infoX = contentX + qrSize + 44;
    const infoW = contentW - qrSize - 44;
    doc.fillColor(TEXT_MUTED).fontSize(8).font(pdfFont(true)).text(
      isInvitation ? 'DAVETİYE KODU' : 'BİLET KODU',
      infoX,
      cursorY + 8
    );
    doc.fillColor('#ffffff').fontSize(16).font(pdfFont(true)).text(input.ticketCode, infoX, cursorY + 24, {
      width: infoW,
      characterSpacing: 2
    });
    doc.fillColor(TEXT_MUTED)
      .fontSize(9)
      .font(pdfFont())
      .text(
        isInvitation
          ? 'Girişte bu QR kodu veya davetiye kodunu gösterin.'
          : 'Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.',
        infoX,
        cursorY + 52,
        { width: infoW, lineGap: 2 }
      );

    doc.save();
    doc.roundedRect(infoX, cursorY + 96, infoW, 3, 2).fill(BRAND_GOLD);
    doc.restore();

    const footerY = cardY + cardH - 36;
    doc.strokeColor('#ffffff22').lineWidth(1);
    doc.moveTo(contentX, footerY).lineTo(contentX + contentW, footerY).stroke();
    doc.fillColor('#666666').fontSize(8).font(pdfFont()).text('biletfeed.com · Güvenli bilet sistemi', contentX, footerY + 10);
    doc.text('Kişiye özeldir, devredilemez.', contentX, footerY + 10, {
      width: contentW,
      align: 'right'
    });

    doc.end();
  });
}
