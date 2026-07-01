import QRCode from 'qrcode';

/** E-posta ve önizleme için QR kod data URL üretir */
export async function qrToDataUrl(
  payload: string,
  size = 200
): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    color: { dark: '#111111', light: '#ffffff' }
  });
}
