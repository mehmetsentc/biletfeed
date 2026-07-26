/**
 * iOS App Tracking Transparency (ATT) durumunu native tarafta kontrol eder /
 * gerekirse sistem izin diyaloğunu gösterir.
 *
 * Yalnızca Capacitor iOS'ta anlamlıdır. Web'de ve Android'de her zaman `true`
 * döner — Android'de ATT kavramı yok, web'de izleme rızası mevcut çerez onay
 * banner'ı ile yönetiliyor.
 *
 * App Store Guideline 5.1.2(i): Uygulama web içeriğinde tracking amaçlı çerez
 * topluyorsa (GA4 vb.), kullanıcıdan önce bu izni almak zorunludur. İzin
 * verilmezse tracking scriptleri hiç yüklenmemelidir.
 */
// Bu promise'i modül seviyesinde cache'liyoruz ki sayfada birden fazla bileşen
// (GoogleAnalytics, SiteTracker, AppSpeedInsights, vb.) aynı anda çağırdığında
// ATT sistem izin diyaloğu yalnızca bir kez gösterilsin ve hepsi aynı sonucu
// paylaşsın.
let cachedResult: Promise<boolean> | null = null;

async function checkTrackingAuthorized(): Promise<boolean> {
  const { Capacitor } = await import('@capacitor/core');
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  // Kesin olarak Android ise ATT kavramı yok — doğrudan izinli say.
  if (platform === 'android') return true;

  // Kesin olarak gerçek web (native shell DEĞİL) ise de izinli say.
  // Ama platform tespiti belirsizse (ör. native shell içinde olduğu halde
  // `getPlatform()` yanlışlıkla 'web' dönerse) burada ATT'yi atlamak yerine
  // aşağıdaki native plugin çağrısına düşüyoruz: plugin native tarafta yoksa
  // zaten hata fırlatır ve catch bloğu güvenli tarafta (false = tracking kapalı)
  // kalır. Amaç: platform algılama tek sinyale bağlı kalıp yanlışlıkla "web"
  // sanıp ATT'yi tamamen atlamasın (Guideline 5.1.1(iv) riski).
  if (platform === 'web' && !isNative) return true;

  try {
    const { AppTrackingTransparency, AppTrackingTransparencyStatus } =
      await import('capacitor-app-tracking-transparency');

    const att = new AppTrackingTransparency();
    let status = await att.getStatus();

    if (status === AppTrackingTransparencyStatus.notDetermined) {
      status = await att.requestPermission();
    }

    return status === AppTrackingTransparencyStatus.authorized;
  } catch {
    // Plugin çağrısı başarısız olursa güvenli taraf: tracking'i kapalı say
    return false;
  }
}

export async function isTrackingAuthorized(): Promise<boolean> {
  if (!cachedResult) {
    cachedResult = checkTrackingAuthorized();
  }
  return cachedResult;
}
