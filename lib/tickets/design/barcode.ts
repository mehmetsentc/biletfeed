/** CODE128B barkod — SVG ve PDF için ortak modül desenleri */

const CODE128_PATTERNS: readonly string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110', '11010000100', '11010010000',
  '11010011100', '1100011101011'
];

const START_B = 104;
const STOP = 106;

function code128BValue(char: string): number {
  const code = char.charCodeAt(0);
  if (code < 32 || code > 127) return 0;
  return code - 32;
}

/** Metni CODE128B modül dizisine çevirir (start + data + checksum + stop) */
export function encodeCode128B(text: string): string {
  if (!text) return CODE128_PATTERNS[STOP];

  const codes: number[] = [START_B];
  for (const char of text) {
    codes.push(code128BValue(char));
  }

  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i] * i;
  }
  codes.push(checksum % 103);
  codes.push(STOP);

  return codes.map((c) => CODE128_PATTERNS[c] ?? '').join('');
}

export function barcodeToSvg(
  text: string,
  options?: { width?: number; height?: number; barColor?: string; bgColor?: string }
): string {
  const width = options?.width ?? 220;
  const height = options?.height ?? 48;
  const barColor = options?.barColor ?? '#111111';
  const bgColor = options?.bgColor ?? 'transparent';
  const modules = encodeCode128B(text);
  const moduleWidth = width / modules.length;

  let bars = '';
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      bars += `<rect x="${(i * moduleWidth).toFixed(2)}" y="0" width="${Math.max(moduleWidth, 0.5).toFixed(2)}" height="${height}" fill="${barColor}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${bgColor}"/>${bars}</svg>`;
}

export function barcodeToDataUrl(
  text: string,
  options?: { width?: number; height?: number; barColor?: string }
): string {
  const svg = barcodeToSvg(text, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** PDFKit için dikey çubuk çizimi */
type PdfDoc = {
  save(): PdfDoc;
  restore(): PdfDoc;
  fillColor(color: string): PdfDoc;
  rect(x: number, y: number, w: number, h: number): PdfDoc;
  fill(): PdfDoc;
};

export function drawBarcodePdf(
  doc: PdfDoc,
  x: number,
  y: number,
  text: string,
  width: number,
  height: number,
  color = '#111111'
): void {
  const modules = encodeCode128B(text);
  const moduleWidth = width / modules.length;

  doc.save();
  doc.fillColor(color);
  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === '1') {
      doc.rect(x + i * moduleWidth, y, Math.max(moduleWidth, 0.4), height);
      doc.fill();
    }
  }
  doc.restore();
}
