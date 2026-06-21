# Bilet Feed — Hızlı Kurulum (Türkçe)

## 1. PostgreSQL (Neon — önerilen, ~5 dk)

1. [neon.tech](https://neon.tech) → Sign up (GitHub ile)
2. **New Project** → isim: `biletfeed`
3. Dashboard → **Connection string** → `PostgreSQL` → kopyala
4. `.env.local` dosyasına yapıştır:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/biletfeed?sslmode=require
```

5. Terminal:

```bash
npm run db:setup
```

22 etkinlik + organizatörler + mekanlar veritabanına yüklenir.

### Alternatif: Docker (lokal)

```bash
docker compose up -d
```

`.env.local`:

```env
DATABASE_URL=postgresql://biletfeed:biletfeed_dev@localhost:5432/biletfeed
```

```bash
npm run db:setup
```

---

## 2. Firebase Admin (~5 dk)

1. [Firebase Console](https://console.firebase.google.com) → **BiletFeed**
2. ⚙️ **Project settings** → **Service accounts**
3. **Generate new private key** → JSON indir
4. Dosyayı proje köküne **`firebase-admin.json`** olarak kaydet

> Bu dosya `.gitignore`'da — asla commit etmeyin.

---

## 3. Firebase Authentication (~3 dk)

1. Firebase → **Authentication** → **Sign-in method**
2. **Email/Password** → Enable
3. **Google** → Enable (support email: mehmetsentc@gmail.com)
4. **Settings** → Authorized domains:
   - `localhost`
   - `biletfeed.vercel.app` ✅ (canlı)
   - Kendi domain'iniz (ör. `biletfeed.com`)

---

## 3b. Firebase Storage (~3 dk)

1. Firebase → **Storage** → **Get started**
2. **Rules** sekmesine `firebase/storage.rules` içeriğini yapıştır
3. **Publish**

---

## 4. Kurulumu doğrula

```bash
npm run setup:check
```

Tüm satırlar ✅ olmalı.

```bash
npm run dev:fresh
```

- http://localhost:3000 → ana sayfa (DB'den etkinlikler)
- http://localhost:3000/giris → Google / email giriş

---

## 5. Vercel Deploy (~20 dk)

```bash
npm i -g vercel
vercel login
vercel
```

Vercel dashboard'da **Environment Variables** — `.env.local` içeriğini ekle:

| Değişken | Not |
|----------|-----|
| `DATABASE_URL` | Neon production connection string |
| `NEXT_PUBLIC_SITE_URL` | `https://biletfeed.com` |
| `NEXT_PUBLIC_APP_URL` | aynı |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `biletfeed.com` |
| `NEXT_PUBLIC_CANONICAL_HOST` | `biletfeed.com` |
| `NEXT_PUBLIC_FIREBASE_*` | 6 adet client değişken |
| `FIREBASE_ADMIN_*` | veya Vercel'de JSON'u tek satır `FIREBASE_SERVICE_ACCOUNT_JSON` |
| `TICKET_SECRET_KEY` | `openssl rand -base64 32` |

Production deploy:

```bash
vercel --prod
```

Deploy sonrası production DB'de bir kez:

```bash
DATABASE_URL="..." npm run db:setup
```

---

## 6. İlk admin kullanıcı

Kayıt olduktan sonra Neon SQL Editor veya Prisma Studio:

```sql
UPDATE users SET role = 'ROLE_ADMIN' WHERE email = 'mehmetsentc@gmail.com';
```

Çıkış yap → tekrar giriş yap.

---

## Zaman çizelgesi

| Adım | Süre |
|------|------|
| Neon + db:setup | 10 dk |
| Firebase Admin JSON | 5 dk |
| setup:check + dev test | 10 dk |
| Vercel deploy | 20 dk |
| Domain DNS | 1–24 saat |
| **Toplam (beta canlı)** | **~1 gün** |
