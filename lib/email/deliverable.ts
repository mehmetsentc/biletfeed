/** Sistem içi placeholder adresler (@*.biletfeed.local) — Resend'e gönderilmez */
const SYNTHETIC_EMAIL_RE = /@(?:[\w.-]+\.)*biletfeed\.local$/i;

/** Gerçek bir posta kutusuna gönderilebilir mi? */
export function isDeliverableEmail(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return false;
  if (SYNTHETIC_EMAIL_RE.test(normalized)) return false;
  return true;
}
