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
| **CNAME** | `panel` | `cname.vercel-dns.com` | Proxied veya DNS only |

> **Organizatör paneli:** `panel.biletfeed.com` — OtelEvent `panel.otelevent.com` ile aynı model. Vercel'e domain ekleyin, Cloudflare'de `panel` CNAME kaydı oluşturun.

DNS yayılımı 5–30 dk sürebilir. Vercel dashboard'da domain yeşil olunca hazır.

---

## Panel alt alanı (panel.biletfeed.com)

### Cloudflare DNS

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **CNAME** | `panel` | `cname.vercel-dns.com` | Proxied (turuncu) veya DNS only |

OtelEvent örneğinde olduğu gibi turuncu bulut (Proxied) kullanılabilir. Ana site gri bulut ise panel için de **DNS only** + SSL/TLS **Full** yeterlidir.

### Vercel

```bash
npx vercel domains add panel.biletfeed.com
```

Vercel → **biletfeed** → **Settings** → **Domains** → `panel.biletfeed.com` yeşil olmalı.

### Uygulama davranışı

- `https://panel.biletfeed.com` → organizatör paneli (`/organizator-panel/baslangic`)
- `https://biletfeed.com/organizator-panel/*` → otomatik `panel.biletfeed.com` yönlendirmesi (production)
- Oturum çerezi `.biletfeed.com` — ana site ve panel arasında paylaşılır

### Lokal geliştirme

```bash
# panel.localhost:3000
open http://panel.localhost:3000
```

### Firebase authorized domains

Firebase Console → Authentication → Authorized domains:

- `panel.biletfeed.com`
- `organizer.biletfeed.com` (eski alias, isteğe bağlı)

### Env (opsiyonel)

```bash
NEXT_PUBLIC_PANEL_URL=https://panel.biletfeed.com
NEXT_PUBLIC_ENABLE_SUBDOMAINS=true
```

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
npx vercel domains add panel.biletfeed.com
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
- `panel.biletfeed.com`

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
