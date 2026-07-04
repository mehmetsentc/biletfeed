const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const GIF = [0x47, 0x49, 0x46];

function startsWithBytes(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, i) => buffer[i] === byte);
}

/** Yüklenen dosyanın gerçekten görsel olup olmadığını magic byte ile doğrular */
export function detectImageMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  if (startsWithBytes(buffer, JPEG)) return 'image/jpeg';
  if (startsWithBytes(buffer, PNG)) return 'image/png';
  if (startsWithBytes(buffer, GIF)) return 'image/gif';
  if (
    startsWithBytes(buffer, WEBP_RIFF) &&
    buffer.length >= 12 &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export function assertImageUpload(buffer: Buffer, declaredType: string): string {
  const detected = detectImageMime(buffer);
  if (!detected) {
    throw new Error('Geçersiz görsel dosyası');
  }
  if (!declaredType.startsWith('image/')) {
    return detected;
  }
  const normalizedDeclared = declaredType.split(';')[0]?.trim().toLowerCase();
  const compatible =
    normalizedDeclared === detected ||
    (normalizedDeclared === 'image/jpg' && detected === 'image/jpeg');
  if (!compatible) {
    throw new Error('Dosya türü içerikle uyuşmuyor');
  }
  return detected;
}
