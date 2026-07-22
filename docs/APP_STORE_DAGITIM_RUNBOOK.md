# BiletFeed — Xcode Dağıtım Runbook (2 App, Archive → Upload)

Bilinen sabitler (repo'dan doğrulandı, tekrar girmene gerek yok):

| Alan | Değer |
|---|---|
| Apple Team ID | `VMZA353GB7` |
| İmzalama sertifikası (SHA-1) | `2F313AE63D1F6BBEA5FA2FB6717A85A3984C0F0D` — her iki `ExportOptions.plist`'te aynı |
| BiletFeed version/build | 1.0 / 1 |
| Giriş version/build | 1.0 / 2 |

`[DOĞRULA]` — bunlar repo'dan görülemiyor, senin Mac'inde kontrol etmen gerekiyor:
- Yukarıdaki sertifika (`2F313AE6...`) **Keychain Access**'te "Apple Distribution" olarak yüklü ve geçerli mi (süresi dolmamış)?
- BiletFeed Giriş için `.mobileprovision` dosyası repoda yok — Apple Developer portalında henüz oluşturulmamış olabilir.

Kod değişikliği yaptım (minimal, zorunlu olduğu için):
- `mobile/ios/App/App/Info.plist` → `NSCameraUsageDescription` eklendi: *"Bilet QR kodunu okutmak için kamera kullanılır."* — **not:** `mobile/package.json`'da `@capacitor/camera` bağımlılığı yok; bu metni senin isteğinle ekledim ama uygulama fiilen kamera kullanmıyorsa bu key'in App Review'da bir etkisi olmaz (izin isteği hiç tetiklenmez). Zararı yok, ama gerçekten kullanılmayacaksa temizlenebilir.
- `mobile-giris/ios/App/App/Info.plist` → `NSCameraUsageDescription` düzeltildi: *"Bilet QR kodlarını taramak için kamera gereklidir."*, alakasız `NSPhotoLibraryUsageDescription` kaldırıldı (önceki turda yapıldı).

---

## APP 1 — BiletFeed (`mobile/`, bundle `com.biletfeed.app`)

### 1. Terminal

```bash
cd mobile
npm install
npm run assets:generate   # icon-only.png / splash.png final ise
npm run cap:sync
npm run cap:ios            # Xcode'u App.xcworkspace ile açar
```

### 2. Xcode — Team / Signing / Version

1. Sol panel → **App** target seç → üst sekme **Signing & Capabilities**
2. **Team**: dropdown'dan Team ID `VMZA353GB7`'ye karşılık gelen hesabı seç
3. **Bundle Identifier**: `com.biletfeed.app` olduğunu doğrula (zaten ayarlı)
4. **Signing Certificate**: Manual imzalama açıksa `2F313AE6...` sertifikasını seç — Keychain'de yoksa Apple Developer portal → Certificates'tan indir, çift tıkla
5. **Provisioning Profile**: ⚠️ Şu an 3 farklı isim var (pbxproj: `BiletFeed AppStore Jul2026`, ExportOptions.plist: `BiletFeed AppStore Distribution`, gerçek dosyadaki Name: `BiletFeed AppStore`). Apple Developer portal → **Profiles** → `com.biletfeed.app` için App Store profilinin **gerçek adını** gör, Xcode'daki dropdown'dan **o profili** seç (Xcode otomatik pbxproj'u günceller)
6. Üst sekme **General** → **Identity**:
   - **Version** (Marketing Version): `1.0`
   - **Build**: `1` (her yeni App Store Connect yüklemesinde bu sayıyı artırman gerekir, aynı build numarasıyla ikinci upload reddedilir)

### 3. Capabilities — Associated Domains

1. **Signing & Capabilities** sekmesinde **+ Capability** (sol üstte) → **Associated Domains** ara, çift tıkla ekle
2. Açılan listeye satır ekle: `applinks:biletfeed.com`
3. Xcode otomatik bir `App.entitlements` dosyası oluşturur — bunun target'a bağlı olduğunu (Signing & Capabilities altında göründüğünü) doğrula

### 4. Info.plist kamera metni

Zaten `mobile/ios/App/App/Info.plist` içine eklendi:
```
NSCameraUsageDescription = "Bilet QR kodunu okutmak için kamera kullanılır."
```
Xcode'da **Info** sekmesinden görsel olarak doğrulayabilirsin.

### 5. Archive → Distribute → Upload

1. Üstte şema/cihaz seçici → **Any iOS Device (arm64)** (simülatör değil!)
2. **Product → Archive** (birkaç dakika sürer)
3. **Organizer** penceresi otomatik açılır → oluşan archive'ı seç → **Distribute App**
4. **App Store Connect** → **Next**
5. **Upload** → **Next**
6. İmzalama: **Automatically manage signing** veya **Manually manage signing** (Adım 2'de seçtiğin profille aynı olmalı) → **Next**
7. Özet ekranını kontrol et → **Upload**
8. "Upload Successful" mesajını bekle (internet hızına göre birkaç dakika)

### 6. App Store Connect — Build işleme ve seçim

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps** → **BiletFeed**
2. **TestFlight** sekmesi → yüklenen build "Processing" durumunda görünür (5-30 dk)
3. İşlem bitince **App Store** sekmesi → **iOS App** → **1.0 Prepare for Submission**
4. **Build** bölümü → **+ (Select a build before you submit)** → build `1`'i seç → **Done**
5. **Save**

---

## APP 2 — BiletFeed Giriş (`mobile-giris/`, bundle `com.biletfeed.giris`)

### 1. Terminal

```bash
cd mobile-giris
npm install
npm run assets:generate   # icon-only.png (#f97316 arka plan) final ise
npm run cap:sync
npm run cap:ios
```

### 2. Xcode — Team / Signing / Version

1. **App** target → **Signing & Capabilities**
2. ⚠️ Şu an bu projede **Team boş, `Automatic` signing** ayarlı — önce **Team** dropdown'dan Team'i seç
3. **Bundle Identifier**: `com.biletfeed.giris`
4. Eğer `com.biletfeed.giris` App ID Apple Developer portalında henüz yoksa: **developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → +** → App ID oluştur, ek capability gerekmiyor (kamera bir Xcode capability'si değil, sadece Info.plist izni)
5. **Signing**: `Automatic`'i bırakabilirsin (Xcode profili kendi oluşturur) **veya** `ExportOptions.plist`'teki gibi Manual + `BiletFeed Giris AppStore Distribution` adlı profili portal'da oluşturup seç — tutarlılık için **Manual** önerilir (mevcut `ExportOptions.plist` manual bekliyor)
6. **General → Identity**: **Version** `1.0`, **Build** `2` (mevcut pbxproj değeri; her yeni yüklemede artır)

### 3. Capabilities — Associated Domains

1. **+ Capability** → **Associated Domains**
2. Satır ekle: `applinks:giris.biletfeed.com`

### 4. Info.plist kamera metni

Zaten düzeltildi — `mobile-giris/ios/App/App/Info.plist`:
```
NSCameraUsageDescription = "Bilet QR kodlarını taramak için kamera gereklidir."
```
(Eski yanlış "profil fotoğrafı" metni ve gereksiz `NSPhotoLibraryUsageDescription` kaldırıldı.)

### 5. Archive → Distribute → Upload

BiletFeed ile aynı adımlar (yukarıdaki APP 1 → Adım 5), sadece Organizer'da bu app'in archive'ını seç.

### 6. App Store Connect — Build işleme ve seçim

Aynı akış, **Apps → BiletFeed Giriş → TestFlight** üzerinden build işlenmesini bekle → **App Store → 1.0 Prepare for Submission → Build** alanına build `2`'yi seç.

---

## 7. Yaygın hatalar tablosu

| Hata | Neden | Çözüm |
|---|---|---|
| "No signing certificate found" | Sertifika Keychain'de yok veya süresi dolmuş | Apple Developer portal → Certificates → indir, çift tıkla yükle; `security find-identity -v -p codesigning` ile Keychain'i terminal'den doğrula |
| "No provisioning profiles match" / profil bulunamadı | Profil adı Xcode'da seçili olanla Apple portalındakiyle uyuşmuyor (BiletFeed'de şu an bu durum var) | Portal'daki gerçek profil adını Xcode dropdown'dan seç; gerekirse **Xcode → Settings → Accounts → Download Manual Profiles** |
| "Asset validation failed... bitcode" | Eski Xcode/Capacitor sürümünde bitcode ayarı uyuşmazlığı (Xcode 14+'ta bitcode kaldırıldı) | `ExportOptions.plist`'te `uploadBitcode=false` zaten doğru; Xcode 16+ kullanıyorsan bu anahtar gereksiz ama zararsız |
| "Missing purpose string for camera" | `NSCameraUsageDescription` eksik ama kod kamera API'sini çağırıyor | Info.plist'e ekle (bu turda ikisi için de yapıldı) |
| "The bundle ID ... doesn't match" | Xcode'daki `PRODUCT_BUNDLE_IDENTIFIER` ile App Store Connect'teki app kaydı farklı | Xcode'da Bundle ID'yi App Store Connect'teki kayıtla birebir eşleştir (`com.biletfeed.app` / `com.biletfeed.giris`) |
| "Team ID mismatch" veya export sırasında team seçilemiyor | `mobile-giris` projesinde Team ataması boş (şu an bu durum var) | Signing & Capabilities → Team'i elle seç |
| Build App Store Connect'te sonsuza kadar "Processing" | Nadir ama oluyor — genelde export uyumsuzluğu veya Apple tarafı gecikme | 1 saatten uzun sürerse Apple Developer System Status'u kontrol et, gerekirse yeniden yükle |
| Aynı build numarasıyla ikinci upload reddi | `CURRENT_PROJECT_VERSION` bir önceki yüklemeyle aynı | Her yüklemede Build numarasını artır (Xcode General → Identity) |

---

## Hazır mı? Checklist (Archive'dan önce)

**BiletFeed**
- [ ] Team seçili, sertifika Keychain'de geçerli
- [ ] Provisioning profile adı Xcode = Apple portal (3 farklı isim sorunu çözüldü)
- [ ] Associated Domains → `applinks:biletfeed.com` eklendi
- [ ] Info.plist kamera metni mevcut (eklendi) — kod gerçekten kamera kullanıyorsa doğrula, kullanmıyorsa zararsız
- [ ] Version 1.0 / Build numarası bir önceki yüklemeden farklı
- [ ] İkonlar final marka görseliyle sync edilmiş

**BiletFeed Giriş**
- [ ] `com.biletfeed.giris` App ID Apple portalında mevcut
- [ ] Xcode'da Team atanmış (şu an boş — önce bu yapılmalı)
- [ ] Provisioning profile oluşturulmuş/seçilmiş (repoda `.mobileprovision` dosyası yok, portal'da kontrol et)
- [ ] Associated Domains → `applinks:giris.biletfeed.com` eklendi
- [ ] Info.plist kamera metni düzeltildi (yapıldı)
- [ ] Version 1.0 / Build numarası bir önceki yüklemeden farklı
- [ ] İkonlar final marka görseliyle sync edilmiş (#f97316 arka plan)

**Her ikisi için**
- [ ] Archive → Organizer'da doğru app/scheme seçili
- [ ] Upload sonrası TestFlight'ta "Processing" tamamlandı
- [ ] App Store Connect → 1.0 Prepare for Submission → Build seçildi ve kaydedildi
