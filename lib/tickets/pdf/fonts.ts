import path from 'path';
import fs from 'fs';
import type PDFDocument from 'pdfkit';

const FONT_DIR = path.join(process.cwd(), 'assets/fonts');

export const PDF_FONTS = {
  regular: path.join(FONT_DIR, 'NotoSans-Regular.ttf'),
  bold: path.join(FONT_DIR, 'NotoSans-Bold.ttf')
} as const;

/** PDFKit için Türkçe destekli Noto Sans fontlarını kaydet */
export function registerPdfFonts(doc: InstanceType<typeof PDFDocument>): void {
  if (!fs.existsSync(PDF_FONTS.regular) || !fs.existsSync(PDF_FONTS.bold)) {
    throw new Error('PDF font dosyaları bulunamadı (assets/fonts/NotoSans-*.ttf)');
  }

  doc.registerFont('NotoSans', PDF_FONTS.regular);
  doc.registerFont('NotoSans-Bold', PDF_FONTS.bold);
}

export function pdfFont(bold = false): string {
  return bold ? 'NotoSans-Bold' : 'NotoSans';
}
