# BiletFeed — Otomatik Fatura (e-Arşiv / e-Fatura)

Bu belge checkout fatura toplama, dahili fatura motoru ve **GİB e-Arşiv Portal** bağlantısını özetler. Muhasebe modül detayları için `docs/ACCOUNTING.md`.

## Mevcut Akış

```
Ödeme tamamlandı
    → processOrderAccounting (lib/accounting/fulfillment.ts)
        → user_billing_profiles (checkout'ta kaydedilir)
        → createSaleInvoice (BF{YIL}{6 hane})
        → submitInvoiceToGib (EINVOICE_PROVIDER=gib → e-Arşiv Portal)
        → sendInvoiceEmail (Resend)
```

### Checkout fatura toplama

Ücretli siparişlerde kullanıcı checkout sırasında fatura bilgilerini girer:

| Alan | Bireysel | Kurumsal |
|------|----------|----------|
| Ad / unvan | İsteğe bağlı (katılımcı adı yedek) | Zorunlu |
| TCKN / VKN | TCKN isteğe bağlı | VKN (10 hane) zorunlu |
| Vergi dairesi | — | Zorunlu |
| Fatura adresi | İsteğe bağlı | Zorunlu |

Kayıt: `POST /api/orders/checkout` → `upsertUserBillingProfile` → `user_billing_profiles`.

Fatura tipi (`resolveInvoiceType` — rakam dışı karakterler strip edilir):

- 10 haneli VKN → `e_fatura` (**e-Arşiv portal ile gönderilmez**; entegratör gerekir)
- Diğer → `e_arsiv`

---

## GİB e-Arşiv (bağlı)

`EINVOICE_PROVIDER=gib` iken BiletFeed doğrudan **GİB e-Arşiv Portal** (`earsivportal.efatura.gov.tr`) üzerinden taslak fatura oluşturur.

| Adım | Ne olur |
|------|---------|
| Gönder | `EARSIV_PORTAL_FATURA_OLUSTUR` → taslak |
| UUID | Yalnızca GİB kabulünden / taslak listesinden resolve sonrası `eInvoiceUuid` |
| İmza | Admin `/admin/muhasebe` → SMS gönder → kod onay |
| Hata | Sınıflandırılır (GEÇİŞ, satıcı e-Fatura, oturum, ETTN…) — panel Türkçe açıklar |

### GEÇİŞ kullanıcısı

Bazı IVD hesapları yalnızca GİB’in verdiği kısa tarih aralığında fatura kesebilir. Panel:

- Hata metninden aralığı parse eder
- Fatura tarihi dışarıdaysa **GİB gönder**’i kapatır
- Muhasebeci tarihi düzeltebilir: `PATCH .../issued-at`
- Opsiyonel env (deploy’suz pencere): `EINVOICE_GECIS_DATE_FROM` / `EINVOICE_GECIS_DATE_TO` (`dd/MM/yyyy` veya ISO)

### e-Fatura alıcı / satıcı

- **Alıcı 10 hane VKN veya `type=e_fatura`:** e-Arşiv submit engellenir (özel entegratör / e-Fatura SOAP bu repoda yok).
- **Satıcı “e-Fatura kullanıcısı” hatası:** e-Arşiv gönderimi panelde kapatılır; muhasebeciye danışın.

---

## Üretim Ortamı Kontrol Listesi

### Veritabanı

- [ ] `user_billing_profiles` tablosu migrate edildi (`npx prisma migrate deploy`)
- [ ] `invoices`, `invoice_lines`, `email_deliveries` tabloları mevcut

### Şirket bilgisi (`lib/config/company.ts`)

- [ ] Ticari unvan: KSD ORGANİZASYON
- [ ] VKN: 5901381024
- [ ] Vergi dairesi ve adres güncel
- [ ] `COMPANY_IBAN` — fatura / hakediş IBAN
- [ ] `COMPANY_MERSIS_NO` — MERSİS (varsa)

### Muhasebe / e-belge env

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `ACCOUNTING_VAT_RATE` | Hayır | Varsayılan KDV %20 |
| `RESEND_API_KEY` | Evet* | Fatura e-postası (*yoksa log-only) |
| `RESEND_INVOICE_FROM` | Hayır | `fatura@biletfeed.com` |
| `CRON_SECRET` | Evet | Gelir tanıma cron |
| `DATABASE_URL` | Evet | Neon PostgreSQL |
| `EINVOICE_PROVIDER` | Evet | `gib` (canlı e-Arşiv) / `mock` / `http` / `none` |
| `EINVOICE_USERNAME` | gib için | IVD kullanıcı kodu |
| `EINVOICE_PASSWORD` | gib için | IVD şifresi |
| `EINVOICE_SANDBOX` | Hayır | `true` = test portal; gib varsayılan canlı |
| `EINVOICE_FAIL_SOFT` | Hayır | GİB hatası siparişi bozmasın (varsayılan true) |
| `EINVOICE_GECIS_DATE_FROM` | Hayır | GEÇİŞ penceresi başlangıç |
| `EINVOICE_GECIS_DATE_TO` | Hayır | GEÇİŞ penceresi bitiş |

### E-posta

- [ ] `fatura@biletfeed.com` Resend'de doğrulandı
- [ ] SPF / DKIM / DMARC kayıtları (`docs/EMAIL.md`)
- [ ] Test: `POST /api/admin/test-email` (admin oturumu)

### Ödeme sonrası doğrulama

- [ ] Ücretli test siparişi → `invoices` kaydı oluşuyor
- [ ] `invoiceNumber` formatı: `BF2026000001`
- [ ] Alıcı e-postasına fatura bildirimi gidiyor
- [ ] Admin `/admin/muhasebe` fatura listesinde görünüyor
- [ ] Bireysel → `e_arsiv` + GİB taslak (veya GEÇİŞ uyarısı)
- [ ] Kurumsal → `e_fatura`, e-Arşiv gönderimi engelli mesajı

### Yasal / operasyonel

- [ ] e-Arşiv mükellefiyeti (IVD) aktif
- [ ] GEÇİŞ ise muhasebeci tarih/yetki penceresini takip eder
- [ ] Kurumsal (e-Fatura) alıcılar için entegratör planı
- [ ] KDV oranı ve fatura satır açıklamaları muhasebeci onayı
- [ ] İade akışı: `createCreditNoteForRefund` test edildi

---

## e-Fatura entegratör (sonraki faz)

GİB e-Arşiv portal **bağlıdır**. Tam **e-Fatura (özel entegratör / SOAP)** henüz yoktur; 10 haneli alıcılar panelde yumuşak engellenir.

Planlanan:

- Özel entegratör veya GİB e-Fatura kanalı
- `e_fatura` tipi için ayrı provider
- Onaylı PDF + müşteri dashboard

Önerilen env (entegratör fazı):

```
EINVOICE_PROVIDER=http
EINVOICE_API_BASE_URL=
EINVOICE_API_KEY=
```

---

## Admin API

| Endpoint | Açıklama |
|----------|----------|
| `POST .../submit-einvoice` | GİB gönder / tekrar dene (eligibility + CSRF) |
| `PATCH .../issued-at` | `{ "issuedAt": "ISO" }` — yalnızca hata/draft/none |
| `POST .../sms-start` | SMS imza başlat |
| `POST .../sms-confirm` | `{ "code": "..." }` |

---

## İlgili Dosyalar

| Dosya | Rol |
|-------|-----|
| `components/checkout/checkout-billing-section.tsx` | Checkout fatura formu |
| `lib/validation/checkout-billing.ts` | Zod doğrulama |
| `lib/services/user-billing.ts` | Profil upsert |
| `lib/accounting/fulfillment.ts` | Ödeme sonrası fatura tetikleyici |
| `lib/accounting/invoice.ts` | Fatura oluşturma + issuedAt düzeltme |
| `lib/accounting/einvoice/` | GİB provider, hata sınıflandırma, guard |
| `components/admin/invoice-gib-table.tsx` | Muhasebe GİB tablosu |
| `lib/accounting/email.ts` | Fatura e-postası |
| `prisma/schema.prisma` | `UserBillingProfile`, `Invoice` |
