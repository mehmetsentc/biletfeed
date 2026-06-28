# BiletFeed — Mobil Uygulama & App Store

BiletFeed iOS/Android uygulaması Capacitor ile web uygulamasını sarmalar. App Store incelemesi için sosyal giriş, gizlilik ve hesap silme gereksinimleri burada özetlenir.

---

## Sign in with Apple (Firebase)

App Store Guideline **4.8**: Google (veya başka üçüncü taraf sosyal giriş) sunuluyorsa **Sign in with Apple** da zorunludur. BiletFeed web ve mobil giriş formlarında Google ile birlikte Apple girişi sunar.

Kod:

- `lib/firebase/apple-auth.ts` — popup + redirect fallback (`OAuthProvider('apple.com')`)
- `components/providers/auth-provider.tsx` — `signInWithApple`
- `components/auth/apple-sign-in-button.tsx` — Apple HIG siyah buton
- `components/auth/apple-auth-init.tsx` — redirect hata depolama

### 1. Apple Developer Console

1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → App ID (`com.biletfeed.app`) → **Sign In with Apple** etkinleştir → Save
3. **Identifiers** → **+** → **Services IDs**:
   - Description: `BiletFeed Web Auth`
   - Identifier: örn. `com.biletfeed.app.web` (Firebase'de kullanılacak)
   - **Sign In with Apple** → Configure:
     - Primary App ID: `com.biletfeed.app`
     - **Domains and Subdomains**: `biletfeed.com`, `www.biletfeed.com`, `localhost` (geliştirme)
     - **Return URLs** (Firebase'den alınır, aşağıda):
       - `https://<firebase-project-id>.firebaseapp.com/__/auth/handler`
       - Production custom domain kullanıyorsanız Firebase Console'daki handler URL'ini ekleyin
4. **Keys** → **+** → **Sign In with Apple**:
   - Key adı: `BiletFeed Apple Auth`
   - Key ID'yi not alın
   - `.p8` dosyasını indirin (yalnızca bir kez indirilebilir)

Ortam değişkenleri (Vercel / `.env.local`):

```bash
APPLE_TEAM_ID=ABCDE12345          # Apple Developer Team ID
# .p8 içeriği Firebase Console'a yapıştırılır; repoya commit etmeyin
```

Universal Links için `APPLE_TEAM_ID` ayrıca `lib/config/mobile-app.ts` → `buildAppleAppSiteAssociation()` tarafından kullanılır.

### 2. Firebase Console

1. [Firebase Console](https://console.firebase.google.com) → projeniz → **Authentication** → **Sign-in method**
2. **Apple** → Enable
3. **Services ID**: Apple'da oluşturduğunuz Services ID (örn. `com.biletfeed.app.web`)
4. **Apple team ID**: `APPLE_TEAM_ID`
5. **Key ID** ve **Private key**: `.p8` dosyasının içeriği
6. **OAuth redirect URI**'yi kopyalayın → Apple Services ID → Return URLs listesine ekleyin
7. **Authentication** → **Settings** → **Authorized domains**:
   - `biletfeed.com`
   - `localhost` (geliştirme)
   - Firebase hosting domain'i

### 3. Web uygulaması doğrulama

```bash
npm run dev
```

1. `/giris` veya `/kayit` → **Apple ile Giriş Yap** (siyah buton)
2. Popup engellenirse otomatik redirect fallback devreye girer
3. Başarılı giriş sonrası session cookie oluşur (`/api/auth/session`)

Yaygın hatalar:

| Kod | Çözüm |
|-----|--------|
| `auth/operation-not-allowed` | Firebase'de Apple provider kapalı |
| `auth/unauthorized-domain` | Authorized domains listesine domain ekleyin |
| `auth/invalid-credential` | Services ID, Team ID, Key ID veya `.p8` uyuşmuyor |
| Redirect sonrası oturum yok | Apple Return URL ↔ Firebase handler URL eşleşmesini kontrol edin |

### 4. Capacitor / iOS native (opsiyonel)

WebView içinde Firebase popup/redirect çalışır. Tam native deneyim için ileride:

- `@capacitor-firebase/authentication` veya Apple'ın `ASAuthorizationController` entegrasyonu
- Firebase'de iOS bundle ID (`com.biletfeed.app`) ile ek yapılandırma

App Store incelemesi için web tabanlı Apple girişi (mevcut implementasyon) yeterlidir; inceleme notlarında test adımlarını belirtin.

### 5. App Store Connect inceleme notları

```
Giriş: /giris
- E-posta/şifre: demo@biletfeed.com / Demo123!
- Google ile Giriş Yap
- Apple ile Giriş Yap (Sign in with Apple — Guideline 4.8)

Hesap silme: Ayarlar → Hesabım → Hesabı Sil (/mobil-uygulama#hesap-silme)
Gizlilik: https://biletfeed.com/gizlilik
```

---

## İlgili dosyalar

| Dosya | Açıklama |
|-------|----------|
| `lib/firebase/apple-auth.ts` | Apple OAuth akışı |
| `lib/firebase/oauth-redirect.ts` | Google + Apple paylaşımlı redirect sonucu |
| `lib/config/mobile-app.ts` | Bundle ID, Team ID, store metadata |
| `app/.well-known/apple-app-site-association/route.ts` | Universal Links |
