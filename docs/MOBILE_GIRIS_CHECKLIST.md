# BiletFeed Giriş — App Store & Play Store Gönderim Checklist

## 1. İlk Kurulum (terminal)

```bash
# biletfeed uygulaması
cd mobile
npm install
npx cap add ios
npx cap add android

# giris uygulaması
cd ../mobile-giris
npm install
npx cap add ios
npx cap add android
```

---

## 2. İkonlar ve Splash (her iki uygulama için)

### Biletfeed (`mobile/assets/`)
- [ ] `icon-only.png` — 1024×1024, siyah arka plan, beyaz/turuncu logo (mevcut)
- [ ] `splash.png` — 2732×2732 (mevcut)

```bash
cd mobile && npm run assets:generate && npm run cap:sync
```

### Giriş (`mobile-giris/assets/`)
- [ ] `icon-only.png` — 1024×1024, **turuncu arka plan (#f97316)**, beyaz QR ikonu
- [ ] `splash.png` — 2732×2732, siyah arka plan

```bash
cd mobile-giris && npm run assets:generate && npm run cap:sync
```

---

## 3. Apple Developer Console

### Biletfeed
- [ ] App ID: `com.biletfeed.app` — zaten mevcut
- [ ] Sign In with Apple etkinleştir (docs/MOBILE_APP_STORE.md)
- [ ] Associated Domains: `applinks:biletfeed.com`

### Giriş
- [ ] App ID oluştur: `com.biletfeed.giris`
  - developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → +
  - App ID → com.biletfeed.giris
  - Capabilities: **Camera** (QR tarama için)
  - Associated Domains: `applinks:giris.biletfeed.com`
- [ ] Sign In with Apple: **GEREK YOK** (kurumsal/çalışan uygulaması)

---

## 4. Xcode Yapılandırması

### Her iki uygulama için (`npm run cap:ios` ile açılır):

**Biletfeed (com.biletfeed.app)**
1. Signing & Capabilities → Team seç → Bundle ID: `com.biletfeed.app`
2. + Capability → Associated Domains → `applinks:biletfeed.com`
3. Info.plist → `NSCameraUsageDescription`: "Bilet QR kodunu okutmak için kamera kullanılır"

**Giriş (com.biletfeed.giris)**
1. Signing & Capabilities → Team seç → Bundle ID: `com.biletfeed.giris`
2. + Capability → Associated Domains → `applinks:giris.biletfeed.com`
3. Info.plist → `NSCameraUsageDescription`: "Bilet QR kodlarını taramak için kamera gereklidir"

---

## 5. Android Yapılandırması

### Keystore oluşturma (tek seferlik, güvenli saklayın!)

```bash
# biletfeed
keytool -genkey -v -keystore biletfeed-release.keystore \
  -alias biletfeed -keyalg RSA -keysize 2048 -validity 10000

# giris
keytool -genkey -v -keystore biletfeed-giris-release.keystore \
  -alias giris -keyalg RSA -keysize 2048 -validity 10000
```

⚠️ Keystoreleri repoya commit ETMEYİN. Güvenli bir yerde saklayın.

### SHA-256 fingerprint (Digital Asset Links için)

```bash
keytool -list -v -keystore biletfeed-release.keystore -alias biletfeed
# SHA256 fingerprint'i kopyalayın → Vercel env: ANDROID_SHA256_FINGERPRINT
```

---

## 6. App Store Connect

### Biletfeed
- [ ] App Store Connect → + → New App
  - Platform: iOS
  - Name: BiletFeed
  - Bundle ID: com.biletfeed.app
  - SKU: biletfeed-ios-1
- [ ] Screenshots: iPhone 6.9", 6.5", iPad Pro 12.9"
- [ ] Açıklama, anahtar kelimeler, destek URL'si

### Giriş
- [ ] App Store Connect → + → New App
  - Platform: iOS
  - Name: BiletFeed Giriş
  - Bundle ID: com.biletfeed.giris
  - SKU: biletfeed-giris-ios-1
  - Category: Business (Kurumsal kullanım)
- [ ] Screenshots: İzin ekranı + QR tarama ekranı
- [ ] Açıklama: "Etkinlik personeli için QR bilet doğrulama uygulaması"

---

## 7. Google Play Console

### Biletfeed
- [ ] Play Console → Create app → biletfeed
  - App category: Events
  - Package: com.biletfeed.app
- [ ] Signed AAB yükle (Android Studio → Build → Generate Signed Bundle)

### Giriş
- [ ] Play Console → Create app → BiletFeed Giriş
  - App category: Business
  - Package: com.biletfeed.giris
- [ ] Kamera izni bildirimi ekle (Play Console → App content)

---

## 8. Vercel Env Vars (store linkleri için)

```bash
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/tr/app/biletfeed/idXXXXXXXXX
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.biletfeed.app
APPLE_TEAM_ID=XXXXXXXXXX
ANDROID_SHA256_FINGERPRINT=XX:XX:XX:...
```

---

## 9. İnceleme Süreci

| Adım | Biletfeed | Giriş |
|---|---|---|
| TestFlight (iOS) | Dahili test 1-2 gün | Dahili test 1-2 gün |
| Google Play Internal | Anında | Anında |
| App Store incelemesi | 1-7 gün | 1-3 gün (daha basit) |
| Google Play incelemesi | 3-7 gün | 1-3 gün |

---

## 10. Sıradaki Adımlar Özeti

1. ✅ `mobile/` — biletfeed Capacitor projesi hazır
2. ✅ `mobile-giris/` — giris Capacitor projesi oluşturuldu
3. ✅ İkonları hazırla — `mobile/assets/icon-only.png` ve `mobile-giris/assets/icon-only.png` (1024×1024)
   ✅ Splash ekranları — her iki uygulama için `splash.png` (2732×2732)
4. ⬜ `npx cap add ios && npx cap add android` (her iki klasörde)
5. ⬜ Xcode'da signing yapılandır
6. ⬜ Android keystore oluştur
7. ⬜ App Store Connect ve Play Console'da uygulama oluştur
8. ⬜ TestFlight ile iç test
9. ⬜ Store gönderimi
