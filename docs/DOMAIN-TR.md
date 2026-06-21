# Domain Bağlama — Bilet Feed

## Canlı site

- **Vercel:** https://biletfeed.vercel.app
- **Özel domain:** https://biletfeed.com (DNS ayarı sonrası)

---

## Cloudflare DNS (biletfeed.com)

Cloudflare → **biletfeed.com** → **DNS** → **Records**

Mevcut `@` ve `www` kayıtlarını silin veya düzenleyin, şunları ekleyin:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | `76.76.21.21` | DNS only (gri bulut) |
| **CNAME** | `www` | `cname.vercel-dns.com` | DNS only (gri bulut) |

> Vercel SSL için proxy kapalı (gri bulut) önerilir. Turuncu bulut kullanırsanız Cloudflare → SSL/TLS → **Full** seçin.

DNS yayılımı 5–30 dk sürebilir. Vercel dashboard'da domain yeşil olunca hazır.

---

## Cloudflare SSL/TLS

Cloudflare → **biletfeed.com** → **SSL/TLS** → **Overview**

1. Encryption mode: **Full**
2. **Edge Certificates** → **Always Use HTTPS**: ON

> DNS kayıtları gri bulut (DNS only) ise **Full** yeterli. Turuncu bulut kullanıyorsanız mutlaka **Full** seçin.

---

## Özel domain ekleme (genel)

### 1. Domain satın al
Namecheap, GoDaddy, Cloudflare vb.

### 2. Vercel'e ekle
```bash
npx vercel domains add biletfeed.com
npx vercel domains add www.biletfeed.com
```

Vercel dashboard → **biletfeed** → **Settings** → **Domains** → DNS kayıtlarını kopyala.

### 3. DNS ayarları (registrar panelinde)
Vercel'in gösterdiği kayıtları ekle (genelde):
- `A` → `76.76.21.21`
- `CNAME` www → `cname.vercel-dns.com`

### 4. Env güncelle + yeniden deploy
```bash
npm run deploy:env https://biletfeed.com
npm run deploy
```

### 5. Firebase authorized domains
Firebase Console → Authentication → Settings → Authorized domains:
- `biletfeed.com`
- `www.biletfeed.com`

---

## Firebase Storage (henüz Console'da yapılmalı)

1. [Firebase Console](https://console.firebase.google.com) → **BiletFeed** → **Storage**
2. **Get started** → production mode
3. Rules → `firebase/storage.rules` içeriğini yapıştır → **Publish**

---

## Production checklist

- [x] Vercel deploy — https://biletfeed.vercel.app
- [x] Env variables yüklendi
- [x] PostgreSQL (Neon) bağlı
- [x] Admin: mehmetsentc@gmail.com → ROLE_ADMIN
- [x] Firebase authorized domains (biletfeed.com, vercel.app)
- [x] Cloudflare DNS (A + CNAME)
- [ ] Cloudflare SSL/TLS → Full
- [ ] Firebase Storage rules → `docs/FIREBASE-STORAGE-TR.md`
- [ ] Ödeme testi (mock → DB'ye bilet kaydı)
- [ ] Profil fotoğrafı yükleme testi
