# BiletFeed — App Store Gönderim Rehberi (2 Uygulama)

Repo taramasıyla doğrulanan bilgiler + eksik/riskli noktalar + kopyala-yapıştır metinler. Doğrulanamayan her yer `[DOĞRULA]` ile işaretli.

**Doğrulanan sabitler (repo'dan):**

| Alan | Değer | Kaynak |
|---|---|---|
| Apple Team ID | `VMZA353GB7` | `.mobileprovision`, `ExportOptions.plist`, `project.pbxproj` — üçü de eşleşiyor |
| Şirket (trader) | KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ (tüzel kişi / **kurumsal**) | `lib/config/company.ts` |
| VKN | 5901381024 — Antalya Kurumlar V.D. | `lib/config/company.ts` |
| Adres | Hurma Mah. 246 Sk. Adalın Park No:9 İç Kapı No:2, Konyaaltı/Antalya | `lib/config/company.ts` |
| Destek e-posta / tel | destek@biletfeed.com / 0541 953 93 00 | `lib/config/company.ts` |
| Demo hesap (App Review) | `demo@biletfeed.com` / `Demo123!` | `docs/MOBILE_APP_STORE.md` |
| Gizlilik / Hesap silme | biletfeed.com/gizlilik · biletfeed.com/mobil-uygulama#hesap-silme | `lib/config/mobile-app.ts` |
| BiletFeed bundle | `com.biletfeed.app`, sürüm 1.0 (build 1) | pbxproj |
| BiletFeed Giriş bundle | `com.biletfeed.giris`, sürüm 1.0 (build 2) | pbxproj |

---

## 🚨 Önce bunlar — kritik/riskli bulgular

1. **Provisioning profile adı 3 yerde farklı (BiletFeed):** `project.pbxproj` → `BiletFeed AppStore Jul2026`, `ExportOptions.plist` → `BiletFeed AppStore Distribution`, `.mobileprovision` içindeki `Name` → `BiletFeed AppStore`. Archive/export bu haliyle profil bulunamadığı için başarısız olur.
2. **BiletFeed Giriş'te Team atanmamış:** `mobile-giris` Xcode projesinde `CODE_SIGN_STYLE = Automatic`, `DEVELOPMENT_TEAM` boş. `ExportOptions.plist` ise manuel imzalama + `BiletFeed Giris AppStore Distribution` profili bekliyor — tutarsız, Xcode'da elle düzeltilmeli.
3. **Giriş uygulamasında kamera izin metni yanlış:** `mobile-giris/ios/.../Info.plist` içinde `NSCameraUsageDescription` = *"Profil fotoğrafı çekmek için kameraya erişim gereklidir"* — bu bir QR tarayıcı, profil fotoğrafı yok. Apple incelemesi metin/kullanım uyuşmazlığında (Guideline 5.1.1) reddedebilir. Ayrıca gereksiz `NSPhotoLibraryUsageDescription` duruyor.
4. **Associated Domains capability hiçbir projede eklenmemiş** — iki tarafta da `.entitlements` dosyası yok. Universal Links (`/.well-known/apple-app-site-association`) sunucu tarafında hazır ama istemci tarafında capability eksik.
5. **İkonlar teknik olarak doğru boyutta** (1024×1024 `icon-only.png`, 2732×2732 `splash.png`, Xcode'a sync edilmiş) ama içerik "placeholder" olduğunu belirttin — final marka görseliyle değiştirilip `npm run assets:generate && npm run cap:sync` tekrar çalıştırılmalı.
6. **BiletFeed (ana app) ana projede kamera izni yok, `@capacitor/camera` bağımlılığı da yok** — `docs/MOBILE_GIRIS_CHECKLIST.md`'deki "NSCameraUsageDescription ekle" maddesi muhtemelen güncel değil. `[DOĞRULA]`: BiletFeed uygulaması cihazda gerçekten kamera kullanıyor mu (QR bilet tarama)? Kullanmıyorsa bu adımı checklist'ten çıkar.

---

## A) Hesap / Uyumluluk (App Store Connect)

### A1. EU Trader Status
Şirket tüzel kişi (Ltd. Şti.) olduğu için **"Company/Organization" (kurumsal tüccar)** seçilmeli, "Individual/bireysel" değil.

App Store Connect → **Business** (veya **Agreements, Tax, and Banking** altında **Trader Information**) → doldurulacak alanlar:

| Alan | Değer |
|---|---|
| Trader type | Company/Organization |
| Legal name | KSD ORGANİZASYON SANAYİ VE TİC LTD ŞTİ |
| Address | Hurma Mah. 246 Sk. Adalın Park No:9 İç Kapı No:2, Konyaaltı/Antalya, Türkiye |
| Phone | +90 541 953 93 00 |
| E-posta | destek@biletfeed.com |
| Tax/registration no | VKN 5901381024 `[DOĞRULA — Apple bazen ayrıca MERSİS no ister, mevcut `mersisNo` boş]` |

`[DOĞRULA]`: Apple Developer hesabı zaten **Organization** tipi mi enrol edilmiş (D-U-N-S numarasıyla)? Eğer hesap "Individual" olarak açıldıysa Trader bilgisiyle çelişki oluşur — App Store Connect → **Account** → **Membership** sayfasından kontrol et.

### A2. Age Ratings — yeni "Social Media/UGC" soruları
Apple'ın güncel Age Rating anketinde eklenen sorulara öneri:

| Soru | Öneri | Gerekçe |
|---|---|---|
| Kullanıcı üretimi içerik (UGC) var mı? | **Hayır** | Etkinlik/bilet keşfi, kullanıcılar içerik üretmiyor |
| Uygulama içi mesajlaşma / sohbet var mı? | **Hayır** | — |
| Konum tabanlı sosyal paylaşım var mı? | **Hayır** (`[DOĞRULA]` — etkinlik konumu gösteriliyor ama kullanıcı konumu paylaşılmıyorsa Hayır) | — |
| Reklam / üçüncü taraf içerik var mı? | `[DOĞRULA]` — uygulamada reklam varsa Evet | — |

BiletFeed Giriş (B2B) için tüm bu sorular **Hayır** — kurumsal, tek kullanıcı tipi (personel).

### A3. Agreements, Tax, Banking checklist
- [ ] **Paid Applications Agreement** aktif (ücretsiz uygulama olsa da uygulama içi bilet satışı varsa gerekebilir) `[DOĞRULA]`
- [ ] Banking bilgileri (IBAN) girilmiş — `companyLegal.iban` env'den geliyor, App Store Connect'e ayrıca elle girilmeli
- [ ] Tax formu (W-8BEN-E benzeri, Türkiye şirketi için) tamamlanmış
- [ ] İki uygulama da aynı Apple Developer hesabı/Team altında (`VMZA353GB7`) — evet, ikisi de aynı team ID kullanıyor

---

## B) Metadata (her iki app)

### BiletFeed (com.biletfeed.app)

| Alan | Değer |
|---|---|
| İsim | BiletFeed |
| Alt başlık (30 karakter) | Etkinlik Keşfet, Bilet Al |
| Kategori | Eğlence (Entertainment) — `lib/config/mobile-app.ts` ile eşleşiyor |
| Yaş sınırı | 4+ |
| Support URL | https://biletfeed.com/destek `[DOĞRULA — gerçek destek sayfası yolu]` |
| Marketing URL | https://biletfeed.com |
| Privacy Policy URL | https://biletfeed.com/gizlilik |

### BiletFeed Giriş (com.biletfeed.giris)

| Alan | Değer |
|---|---|
| İsim | BiletFeed Giriş |
| Alt başlık | Kapı Personeli QR Doğrulama |
| Kategori | İş (Business) |
| Yaş sınırı | 4+ |
| Support URL | https://biletfeed.com/destek `[DOĞRULA]` |
| Marketing URL | https://giris.biletfeed.com |
| Privacy Policy URL | https://biletfeed.com/gizlilik |

### App Privacy anketi (ikisi için ortak öneri)

| Veri tipi | Toplanıyor mu | Kullanıcıyla ilişkilendirilmiş mi | Amaç |
|---|---|---|---|
| E-posta, isim | Evet | Evet | Hesap işlevi |
| Ödeme bilgisi | Evet (BiletFeed) / Hayır (Giriş) | Evet | Satın alma |
| Konum | Hayır (yalnız etkinlik konumu statik gösteriliyor) `[DOĞRULA]` | — | — |
| Kamera | Yalnız Giriş app | Hayır (görüntü saklanmıyor, sadece QR okunuyor) `[DOĞRULA]` | QR tarama |
| Kullanım verisi/analitik | `[DOĞRULA]` — Firebase Analytics vs. kullanılıyorsa Evet | — | Analitik |

### Screenshot gereksinimleri

| Cihaz | Boyut (px) | Zorunlu mu |
|---|---|---|
| iPhone 6.9" (16 Pro Max vb.) | 1320×2868 veya 1290×2796 | Evet |
| iPhone 6.5" (11 Pro Max vb.) | 1242×2688 | Artık opsiyonel ama önerilir |
| iPad Pro 12.9" (3. nesil+) | 2048×2732 | Yalnız iPad desteği varsa zorunlu |

`appstore-screenshots/` klasöründeki 6 görsel (`01-anasayfa`, `02-feed`, `03-favorilerim`, `04-biletlerim`, `05-ayarlar`, `06-menu`) **BiletFeed** için — boyutları kontrol et, 6.9" gereksinimine uymuyorsa yeniden export gerekir. **BiletFeed Giriş** için ayrı ekran görüntüsü seti yok — checklist'te belirtildiği gibi (izin ekranı + QR tarama ekranı) yeniden çekilmeli.

### 1024 ikon üretimi

```bash
# BiletFeed — mobile/assets/icon-only.png dosyasını final marka görseliyle değiştir, sonra:
cd mobile && npm run assets:generate && npm run cap:sync

# BiletFeed Giriş — mobile-giris/assets/icon-only.png (turuncu #f97316 arka plan) değiştir, sonra:
cd mobile-giris && npm run assets:generate && npm run cap:sync
```

---

## C) Build yükleme

### Ortak akış (her iki klasör için)

```bash
cd mobile            # veya mobile-giris
npm install
npm run cap:sync      # web değişikliklerini native'e senkronize eder
npm run cap:ios        # Xcode'u açar
```

### Xcode signing — BiletFeed
1. Sol panelde **App** target → **Signing & Capabilities**
2. **Team**: (kendi Apple ID'ne bağlı `VMZA353GB7` team'ini seç)
3. **Provisioning Profile**: mevcut 3 farklı isim arasındaki tutarsızlığı gider — Apple Developer portalından profili indirip Xcode'da yükle, `ExportOptions.plist`'teki isimle **birebir** eşleştir
4. **+ Capability** → **Associated Domains** → `applinks:biletfeed.com` ekle (şu an eksik)
5. **Info.plist**: BiletFeed gerçekten kamera kullanıyorsa `NSCameraUsageDescription` = *"Bilet QR kodunu okutmak için kamera kullanılır"* ekle; kullanmıyorsa atla

### Xcode signing — BiletFeed Giriş
1. Apple Developer portal → **Identifiers** → **+** → App ID `com.biletfeed.giris` oluştur (checklist'te işaretsiz) → Capability: **Camera** yok, kamera bir entitlement değil, sadece Info.plist izni yeterli
2. Xcode'da **Team** seç (şu an boş) — `CODE_SIGN_STYLE`'ı `Manual`'a çevir ve `ExportOptions.plist`'teki `BiletFeed Giris AppStore Distribution` profiliyle eşleştir
3. **+ Capability** → **Associated Domains** → `applinks:giris.biletfeed.com`
4. **Info.plist** → `NSCameraUsageDescription` metnini düzelt: *"Bilet QR kodlarını taramak için kamera gereklidir"* (mevcut yanlış metni değiştir), gereksizse `NSPhotoLibraryUsageDescription`'ı kaldır

### Archive & Upload (ikisi için aynı)
1. Xcode üstte şema/cihaz seçici → **Any iOS Device (arm64)**
2. **Product → Archive**
3. Organizer açılınca **Distribute App** → **App Store Connect** → **Upload**
4. İmzalama sorulursa **Manual** ve ilgili provisioning profili seç (Adım C'de düzeltilen profil)
5. Yükleme bitince App Store Connect → **TestFlight** sekmesinde işlenmesini bekle (5-30 dk)

### Terminal ile export (opsiyonel, Xcode UI yerine)

```bash
cd mobile/ios/App
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
  -archivePath build/App.xcarchive archive
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/export
xcrun altool --upload-app -f build/export/App.ipa -t ios \
  --apiKey <APP_STORE_CONNECT_API_KEY> --apiIssuer <ISSUER_ID>
# veya: xcrun notarytool / Transporter.app ile manuel yükleme
```

`mobile-giris` için aynı komutlar, klasör `mobile-giris/ios/App`.

### Version 1.0 — Build seçimi
App Store Connect → **App Store** sekmesi → **iOS App** → **1.0 Prepare for Submission** → **Build** alanı → yüklenen build'i seç (TestFlight işleme bitmeden görünmez).

---

## D) İnceleme notları (Review Notes — kopyala-yapıştır)

### BiletFeed

```
Giriş bilgileri:
- E-posta/şifre: demo@biletfeed.com / Demo123!
- Google ile Giriş Yap
- Apple ile Giriş Yap (Sign in with Apple — Guideline 4.8 uyumu için sunulmuştur)

Hesap silme: Uygulama içi Ayarlar → Hesabım → Hesabı Sil
Web üzerinden: https://biletfeed.com/mobil-uygulama#hesap-silme

Gizlilik politikası: https://biletfeed.com/gizlilik

Not: Uygulama biletfeed.com web deneyimini native bir kabukla (Capacitor) sarar;
etkinlik keşfi, bilet satın alma ve QR bilet görüntüleme işlevleri sunucudan yüklenir.
```

### BiletFeed Giriş

```
Bu uygulama BiletFeed platformunda satılan biletlerin etkinlik girişinde
doğrulanması için etkinlik personeli/kapı görevlileri tarafından kullanılan
kurumsal (B2B) bir araçtır — genel tüketiciye yönelik değildir.

Test erişimi:
- Demo kapı personeli hesabı: [DOĞRULA — henüz oluşturulmadıysa test kullanıcısı ekle]
- Demo QR kod / bilet: [DOĞRULA — inceleme için örnek bilet/QR sağla]

Kamera izni yalnızca bilet QR kodlarını taramak için kullanılır, görüntü
cihazda saklanmaz veya sunucuya yüklenmez.

Sign in with Apple sunulmamıştır — bu kurumsal/çalışan uygulaması olduğundan
Guideline 4.8 istisnası geçerlidir (genel tüketici girişi yoktur).
```

---

## E) Sık red sebepleri ve önlem

| Guideline | Risk | Önlem (bu projede) |
|---|---|---|
| **4.2** — Minimum işlevsellik / web wrapper | Capacitor ile web sarma "sadece tarayıcı" görünümü verirse reddedilir | Native özellikler ekli (splash, status bar, share, browser plugin); review notes'ta "native kabuk + native paylaşım/QR" vurgusu yap |
| **4.8** — Üçüncü taraf giriş varsa Apple girişi zorunlu | BiletFeed'de Google girişi var, Apple girişi de mevcut ✅ | Zaten uygulanmış (`apple-sign-in-button.tsx`) — Giriş app'te üçüncü taraf giriş yoksa istisna geçerli |
| **5.1.1** — Gizlilik / izin metinleri | Giriş app'teki kamera izin metni QR ile alakasız (bkz. Kritik Bulgu #3) | Metni düzelt, kullanılmayan izinleri kaldır |
| **Hesap silme** (5.1.1(v)) | Uygulama içinden hesap silme zorunlu | `/mobil-uygulama#hesap-silme` yolu var — uygulama içi menüden erişilebilir olduğundan emin ol |
| **Eksik demo erişimi** | Reviewer giriş yapamazsa red | Demo hesap bilgisi Review Notes'a eklendi (BiletFeed); Giriş app için demo hesap/QR eksik — oluşturulmalı |

---

## 1) Öncelikli yapılacaklar

| # | İş | Kim |
|---|---|---|
| 1 | Provisioning profile isim tutarsızlığını gider (pbxproj / ExportOptions.plist / Apple portal) | Sen (Xcode + Apple Developer portal) |
| 2 | BiletFeed Giriş'e Team ata, signing style Manual'a çevir | Sen (Xcode) |
| 3 | Giriş Info.plist kamera izin metnini düzelt, gereksiz photo library iznini kaldır | Claude (kod PR) |
| 4 | Associated Domains capability'yi iki projeye de ekle | Sen (Xcode — capability eklemek Xcode UI gerektirir) |
| 5 | Final marka ikonlarını `assets/icon-only.png` olarak koy, `assets:generate` + `cap:sync` çalıştır | Sen (tasarım) + komut |
| 6 | Apple Developer portal'da `com.biletfeed.giris` App ID oluştur | Sen |
| 7 | Giriş app için demo personel hesabı + örnek QR bilet hazırla | Sen |
| 8 | BiletFeed screenshot boyutlarını 6.9"/6.5" gereksinimine göre doğrula, Giriş app için yeni screenshot seti çek | Sen |
| 9 | EU Trader Status + Age Rating anketini App Store Connect'te doldur (bu dokümandaki değerlerle) | Sen |
| 10 | Archive → Upload → TestFlight → Build seçimi → Submit | Sen (Xcode + App Store Connect) |

---

## 2) App Store Connect tıklama rehberi

1. **appstoreconnect.apple.com** → giriş yap → **Apps**
2. **BiletFeed** karta tıkla → sol menü **App Store** → **iOS App 1.0 Prepare for Submission**
3. **Build** bölümü → **+** (Select a build before you submit) → yüklenen build'i seç
4. **App Information** (sol menü, en üstte) → Category, Age Rating, Privacy Policy URL doldur
5. **Pricing and Availability** → Free/Paid, ülke seç
6. **App Privacy** (sol menü) → **Get Started** → yukarıdaki B bölümündeki tabloya göre doldur
7. Ana **1.0 Prepare for Submission** sayfasına dön → **Screenshots** alanına görselleri sürükle-bırak (cihaz boyutuna göre sekme değişir)
8. **Description / Keywords / Support URL / Marketing URL** alanlarını Bölüm B'deki metinlerle doldur
9. **App Review Information** → **Sign-In required** işaretle → demo hesap bilgilerini gir → **Notes** kutusuna Bölüm D'deki metni yapıştır
10. Sağ üstte **Save** → sonra **Add for Review** / **Submit for Review**
11. Aynı adımları **BiletFeed Giriş** app kartı için tekrarla

**Trader / EU uyumluluk için ayrıca:** Üst menü **Business** (veya hesap adı) → **Agreements, Tax, and Banking** → **Trader Information** → Bölüm A1'deki bilgileri gir.

---

## 3) Xcode komutları (özet)

```bash
# BiletFeed
cd mobile && npm install && npm run cap:sync && npm run cap:ios

# BiletFeed Giriş
cd mobile-giris && npm install && npm run cap:sync && npm run cap:ios

# İkon/splash yeniden üretme (final görseller hazır olduğunda)
npm run assets:generate && npm run cap:sync
```

Xcode açıldıktan sonra: **Signing & Capabilities** → Team/Profile düzelt → **+ Capability** → Associated Domains → **Product → Archive** → **Distribute App**.

---

## 4) Gönderim öncesi son checklist

- [ ] Provisioning profile isimleri pbxproj = ExportOptions.plist = Apple portal'daki gerçek isimle eşleşiyor (BiletFeed)
- [ ] BiletFeed Giriş: Team atanmış, signing Manual, doğru profil seçili
- [ ] Associated Domains capability her iki projede de eklenmiş (`applinks:biletfeed.com` / `applinks:giris.biletfeed.com`)
- [ ] Giriş app Info.plist kamera izin metni QR tarama ile uyumlu, gereksiz izinler kaldırılmış
- [ ] Final marka ikonları (placeholder değil) her iki projede sync edilmiş
- [ ] BiletFeed Giriş için `com.biletfeed.giris` App ID Apple Developer portalında mevcut
- [ ] Screenshot setleri her iki app için doğru cihaz boyutlarında yüklü
- [ ] App Privacy anketi ikisi için de dolduruldu
- [ ] EU Trader Status (kurumsal) dolduruldu
- [ ] Age Rating anketi (Social Media/UGC soruları dahil) dolduruldu
- [ ] Demo hesap bilgileri (BiletFeed) ve demo personel/QR (Giriş) Review Notes'ta
- [ ] Sign in with Apple BiletFeed'de çalışıyor, test edildi
- [ ] Hesap silme akışı uygulama içinden erişilebilir ve çalışıyor
- [ ] Her iki build TestFlight'ta işlendi ve "Prepare for Submission" ekranında Build alanına seçildi
- [ ] Support URL, Marketing URL, Privacy Policy URL her iki app için doğru ve canlı
- [ ] Submit for Review

---

## Önerdiğim minimal kod değişiklikleri (PR)

1. `mobile-giris/ios/App/App/Info.plist` — `NSCameraUsageDescription` metnini QR taramaya uygun hale getir, kullanılmıyorsa `NSPhotoLibraryUsageDescription` anahtarını sil.
2. `docs/MOBILE_GIRIS_CHECKLIST.md` — BiletFeed (ana app) için kamera izni maddesini, gerçekten kullanılmıyorsa kaldır veya "opsiyonel" olarak işaretle.
3. `mobile/ios/App/ExportOptions.plist`, `project.pbxproj` ve Apple portalındaki provisioning profile ismini tek bir isimde birleştir (örn. hepsi `BiletFeed AppStore Distribution`).

Bunların hiçbiri refactor değil — sadece config/metin düzeltmesi.
