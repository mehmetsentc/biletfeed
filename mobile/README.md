# BiletFeed Mobil Kabuk (Capacitor 6)

Bu klasör, [biletfeed.com](https://biletfeed.com) web uygulamasını saran native iOS ve Android kabuğudur. Uygulama içeriği sunucudan yüklenir; mağaza gönderimi için Xcode ve Android Studio ile derlenir.

## Gereksinimler

- Node.js 18+
- macOS (iOS derlemesi için)
- Xcode 15+ ve Apple Developer hesabı
- Android Studio ve Google Play Console hesabı
- `mobile/assets/` altında 1024×1024 ikon ve splash görselleri (bkz. `assets/README.md`)

## Kurulum

```bash
cd mobile
npm install
```

## Native platform ekleme (ilk kez)

```bash
npx cap add ios
npx cap add android
```

## Ortam değişkenleri

Kabuğun hangi URL’yi yükleyeceğini `CAPACITOR_SERVER_URL` belirler (varsayılan: `https://biletfeed.com`).

```bash
export CAPACITOR_SERVER_URL=https://biletfeed.com
```

Geliştirme için yerel Next.js:

```bash
export CAPACITOR_SERVER_URL=http://localhost:3000
```

## İkon ve splash üretimi

```bash
# icon-only.png (1024×1024) ve splash.png ekleyin — assets/README.md
npm run assets:generate
npm run cap:sync
```

## Senkronizasyon

Web kabuğu veya eklenti değişikliklerinden sonra:

```bash
npm run cap:sync
```

## Xcode / Android Studio

```bash
npm run cap:ios      # Xcode açar
npm run cap:android  # Android Studio açar
```

### iOS

1. Xcode’da **Signing & Capabilities** → Team ve Bundle ID (`com.biletfeed.app`)
2. Associated Domains: `applinks:biletfeed.com`
3. **Product → Archive** → App Store Connect’e yükle

### Android

1. Release keystore oluşturun ve `android/app/build.gradle` imzasını yapılandırın
2. SHA-256 parmak izini `ANDROID_SHA256_FINGERPRINT` env var’a ekleyin (Digital Asset Links)
3. **Build → Generate Signed Bundle / APK** → Play Console’a yükleyin

## Mağaza rehberi

Detaylı Türkçe gönderim rehberi: [`docs/MOBILE_APP_STORE.md`](../docs/MOBILE_APP_STORE.md)

Mağaza incelemecileri için bilgi sayfası: https://biletfeed.com/mobil-uygulama

## Proje yapılandırması

| Dosya | Açıklama |
| --- | --- |
| `capacitor.config.ts` | App ID, sunucu URL, splash/status bar |
| `www/index.html` | Ağ kesintisinde gösterilen minimal fallback |
| `assets/` | Kaynak ikon ve splash görselleri |

Sunucu tarafı metadata: `lib/config/mobile-app.ts`
