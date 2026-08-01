/**
 * Capacitor WKWebView içinde kalması gereken ödeme / 3D Secure host'ları.
 * Listede olmayan harici URL'ler iOS'ta sistem Safari'ye açılır; ProcessCardForm
 * POST gövdesi kaybolunca "ProcessCardForm (0 KB)" indirmesi görülür.
 */
export const CAPACITOR_PAYMENT_ALLOW_NAVIGATION = [
  'biletfeed.com',
  '*.biletfeed.com',
  'www.biletfeed.com',
  // Tosla
  '*.tosla.com',
  'entegrasyon.tosla.com',
  'tosla.com',
  // Yaygın TR banka / kart ACS (3D Secure) host'ları
  '*.akbank.com',
  '*.akbank.com.tr',
  '*.isbank.com.tr',
  '*.garanti.com.tr',
  '*.garantibbva.com.tr',
  '*.yapikredi.com.tr',
  '*.denizbank.com',
  '*.qnbfinansbank.com',
  '*.finansbank.com.tr',
  '*.ziraatbank.com.tr',
  '*.halkbank.com.tr',
  '*.vakifbank.com.tr',
  '*.teb.com.tr',
  '*.ing.com.tr',
  '*.fibabanka.com.tr',
  '*.sekerbank.com.tr',
  '*.kuveytturk.com.tr',
  '*.albaraka.com.tr',
  '*.turkiyefinans.com.tr',
  '*.hsbc.com.tr',
  '*.odeabank.com.tr',
  '*.mastercard.com',
  '*.visa.com',
  '*.troyodeme.com',
  '*.bkm.com.tr',
  '*.param.com.tr',
  '*.iyzico.com',
  '*.payu.com.tr'
] as const;
