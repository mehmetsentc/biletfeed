/**
 * Kapı QR vs manuel BF kodu.
 * QR’da HMAC token varsa mutlaka doğrulanır — yetkili scanner eski/çalıntı token’ı
 * “kod eşleşiyor” diye kabul etmez.
 */
export function shouldRejectQrToken(params: {
  hasValidationToken: boolean;
  tokenValid: boolean;
}): boolean {
  if (!params.hasValidationToken) return false;
  return !params.tokenValid;
}
