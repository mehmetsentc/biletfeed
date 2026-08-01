/**
 * Capacitor WKWebView içinde kalacak host'lar.
 *
 * `*` = tüm harici navigasyon (Tosla ProcessCardForm + bilinmeyen banka ACS/3DS)
 * uygulama içinde kalır; Safari'ye düşmez.
 *
 * Capacitor dokümantasyonu production için whitelist önerir; TR kart 3DS ACS
 * host'ları kart veren bankaya göre değiştiği için tam liste tutulamaz.
 * BiletFeed kabuğu zaten remote `biletfeed.com` yükler — ödeme akışı için `*` gerekli.
 *
 * @see CAPInstanceConfiguration.doesHost — `pattern == "*"` → true
 */
export const CAPACITOR_PAYMENT_ALLOW_NAVIGATION = ['*'] as const;
