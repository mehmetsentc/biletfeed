# Claude Computer Use — BiletFeed iOS Yeni Build (Ödeme WebView Fix)

Bu talimat **yalnızca BiletFeed tüketici uygulaması** içindir (`com.biletfeed.app`).  
Amaç: Tosla ödemenin Safari’ye düşmeden **uygulama içinde (WKWebView)** kalması.  
`allowNavigation: ['*']` native binary’ye gömülüdür; App Store’a yeni build yüklenmeden canlıda düzelmez.

---

## Claude’a yapıştırılacak prompt (kopyala-yapıştır)

```
Görevin: Mac’te BiletFeed iOS uygulamasının yeni App Store build’ini üretip App Store Connect’e yüklemek.

KONTEKST
- Repo: /Users/user/Documents/platforms-main
- Uygulama klasörü: /Users/user/Documents/platforms-main/mobile
- Bundle ID: com.biletfeed.app
- App adı: BiletFeed
- Apple Team ID: VMZA353GB7
- Neden: capacitor.config içinde server.allowNavigation = ["*"] — Tosla ProcessCardForm + 3DS Safari’ye düşmesin diye. Bu ayar yalnızca yeni native binary ile çalışır.
- Git zaten push edildi (main). Web Vercel deploy ayrı; sen native build yapıyorsun.
- ios/ klasörü lokalde var; gitignore’da olabilir, silme.

ADIMLAR — sırayla, her adımı tamamlamadan sonrakine geçme:

1) Terminal aç, doğrula:
   cd /Users/user/Documents/platforms-main
   git pull origin main
   cd mobile
   test -f ios/App/App/capacitor.config.json && python3 -c "import json;c=json.load(open('ios/App/App/capacitor.config.json'));print(c['server'].get('allowNavigation'))"
   Beklenen çıktı: ['*']
   Eğer ['*'] değilse: npx cap sync ios  çalıştır, tekrar kontrol et.

2) Sürüm bump (zorunlu — App Store aynı build numarasını reddeder):
   Xcode’da MARKETING_VERSION şu an 1.2, CURRENT_PROJECT_VERSION şu an 1.
   Build numarasını artır: CURRENT_PROJECT_VERSION = 2 (veya App Store Connect’teki son build’den +1).
   İsteğe bağlı: MARKETING_VERSION = 1.2.1
   Bunu ya Xcode General sekmesinden yap (Version / Build) ya da project.pbxproj’de her iki target satırını güncelle (Debug+Release için tüm CURRENT_PROJECT_VERSION satırları aynı olmalı).

3) Bağımlılık + sync:
   cd /Users/user/Documents/platforms-main/mobile
   npm install
   npx cap sync ios
   Tekrar doğrula: capacitor.config.json → allowNavigation: ["*"]

4) Xcode aç:
   npx cap open ios
   Proje: ios/App/App.xcworkspace (veya Cap’in açtığı workspace) — .xcodeproj değil, workspace kullan.

5) Signing kontrolü (Xcode UI):
   - Sol tarafta App target → Signing & Capabilities
   - Team: VMZA353GB7 / KSD veya senin Apple Developer team’in
   - Bundle Identifier: com.biletfeed.app
   - Automatically manage signing AÇIK olsun (mümkünse). Manuel profil uyuşmazlığı varsa Automatic’e geç.
   - "Signing for App requires a development team" hatası varsa kullanıcıdan Apple ID ile Xcode’a giriş iste, durma.

6) Desteklenen cihaz / scheme:
   - Scheme: App
   - Destination: Any iOS Device (arm64) — Simulator seçili olmasın (Archive için)
   - Product → Clean Build Folder

7) Archive:
   - Product → Archive
   - Bitince Organizer açılır
   - En yeni archive’ı seç → Distribute App
   - App Store Connect → Upload
   - Varsayılan seçeneklerle devam et (bitcode yok, stripSwiftSymbols vb. Xcode önerisi)
   - Upload başarılı mesajını bekle

8) App Store Connect (tarayıcı: https://appstoreconnect.apple.com):
   - Apps → BiletFeed (com.biletfeed.app)
   - TestFlight veya iOS App sürümü
   - Yeni build görünene kadar bekle (işleme 5–30 dk sürebilir; Processing bitmeli)
   - Mevcut "Waiting for Review" / hazırlık sürümüne bu build’i ekle VEYA yeni sürüm oluştur (1.2 veya 1.2.1)
   - What’s New (TR önerisi):
     "Ödeme güvenliği iyileştirmesi: banka 3D Secure doğrulaması artık uygulama içinde tamamlanır."
   - Submit for Review (kullanıcı onaylamadan otomatik submit etme — hazırlığı yap, submit’i kullanıcıya sor)

9) Bittiğinde raporla:
   - Version / Build numaraları
   - Upload başarılı mı
   - allowNavigation doğrulandı mı
   - App Store Connect’te build Processing / Ready mı
   - Takıldığın hata varsa tam metin

YAPMA:
- mobile-giris uygulamasına dokunma
- Force push / git reset yapma
- ios/ klasörünü silme
- Simulator’da Archive deneme
- Kullanıcı demeden "Submit for Review" basma (Upload tamam, submit sor)
```

---

## Kısa kontrol listesi (sen / Claude)

| # | İş | Beklenen |
|---|-----|----------|
| 1 | `git pull` + `cap sync ios` | `allowNavigation: ["*"]` |
| 2 | Build bump | örn. Version **1.2.1** / Build **2** |
| 3 | Xcode Team + `com.biletfeed.app` | Signing yeşil |
| 4 | Archive → Upload | Organizer’da başarılı |
| 5 | App Store Connect | Build Ready to Submit |
| 6 | (İsteğe bağlı) Submit | What’s New metni yukarıda |

---

## TestFlight / canlı doğrulama (upload sonrası)

1. TestFlight’tan yeni build’i iPhone’a kur  
2. Etkinlik → bilet al → ödeme  
3. **Başarı:** Kart formu + banka 3D sayfası uygulama içinde; Safari / “ProcessCardForm 0 KB” indirmesi **yok**  
4. Ödeme bitince BiletFeed başarı / biletlerim ekranına dönmeli  

---

## Sık hatalar

| Hata | Çözüm |
|------|--------|
| `allowNavigation` yok / boş | `cd mobile && npx cap sync ios` |
| Duplicate build number | `CURRENT_PROJECT_VERSION` artır |
| Signing / profile mismatch | Automatic signing + Team `VMZA353GB7` |
| Archive disabled | Destination = Any iOS Device |
| Upload “ITMS” uyarıları | Metni kaydet; çoğu warning upload’u engellemez |
| Build Processing’de takılı | 30–60 dk bekle; email bildirimi gelince Refresh |

---

## Not

Web (Vercel) zaten `main`’de. Bu build **yalnız native kabuk** güncellemesi. Eski App Store sürümü hâlâ Safari’ye düşer; kullanıcılar TestFlight/App Store güncellemesini alana kadar sorun sürebilir.
