/** Ağ / timeout hatalarını kullanıcıya Türkçe ve eylemli göster */
export function invitationFetchErrorMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const lower = raw.toLowerCase();

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed') ||
    err instanceof TypeError
  ) {
    return 'Bağlantı kesildi veya sunucu zaman aşımına uğradı. Davetiyeler oluşmuş olabilir — listeyi yenileyin; e-postalar arka planda gönderilir (Resend\'de kontrol edin).';
  }

  if (lower.includes('timeout') || lower.includes('aborted')) {
    return 'İstek zaman aşımına uğradı. Oluşturulan davetiyeler listede görünebilir; e-posta gönderimini Resend\'den doğrulayın.';
  }

  return raw.trim() || fallback;
}
