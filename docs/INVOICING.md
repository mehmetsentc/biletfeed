# BiletFeed — Otomatik Fatura (e-Arşiv / e-Fatura)

Bu belge checkout fatura toplama, dahili fatura motoru, **GİB e-Arşiv Portal** ve **BiletFeed e-Fatura kanalı** (kendi entegratör yapımız) bağlantısını özetler. Muhasebe modül detayları için `docs/ACCOUNTING.md`.

## Mevcut Akış

```
Ödeme tamamlandı
    → processOrderAccounting (lib/accounting/fulfillment.ts)
        → user_billing_profiles (checkout'ta kaydedilir)
        → createSaleInvoice (BF{YIL}{6 hane}, tip: resolveInvoiceType)
        → submitInvoiceToGib
              ├─ type=e_arsiv  → gib-earsiv (GİB e-Arşiv Portal)
              └─ type=e_fatura → gib-efatura (BiletFeed e-Fatura kanalı)
        → sendInvoiceEmail (Resend)
```

Admin `/admin/muhasebe` satırında belge tipi (e-Arşiv | e-Fatura) seçilebilir; gönderim seçilen tipe göre kanala yönlenir.

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

- 10 haneli VKN → `e_fatura` (varsayılan; admin override edebilir)
- 11 haneli TCKN / yok → `e_arsiv`

---

## GİB e-Arşiv (bağlı)

`EINVOICE_PROVIDER=gib` iken BiletFeed doğrudan **GİB e-Arşiv Portal** (`earsivportal.efatura.gov.tr`) üzerinden taslak fatura oluşturur. Yalnızca `type=e_arsiv` (ve credit note) bu kanala gider; `e_fatura` sessizce e-Arşiv’e düşmez.

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

### Satıcı e-Fatura çakışması (e-Arşiv)

- **Satıcı “e-Fatura kullanıcısı” hatası:** e-Arşiv gönderimi panelde kapatılır; belge tipini e-Fatura kanalına almak veya muhasebeciye danışmak gerekir.

---

## BiletFeed e-Fatura kanalı (kendi entegratör yapımız)

BiletFeed, üçüncü taraf fatura SaaS’ına (Paraşüt vb.) bağımlı olmadan **kendi e-Fatura integrator katmanını** taşır:

| Katman | Dosya / rol |
|--------|-------------|
| Provider arayüzü | `EInvoiceProvider` — `submit` / `submitDraft`, `getStatus`, `cancel`, `downloadPdf`, `supports` |
| e-Arşiv | `providers/gib-earsiv.ts` — `supports: ['e_arsiv']` |
| e-Fatura | `providers/gib-efatura.ts` — UBL-TR + outbox metadata + HTTP stub/mock |
| Router | `resolveProviderForKind` — tip → kanal |
| Durum | `Invoice.metadata.einvoice` — `channel`, `dispatchStatus`, `envelopeUuid`, `lastPayloadHash` |

### GİB özel entegratör lisansı (dürüst not)

Yazılımın “kendi kanalımız” olarak yapılandırılmış olması, GİB **özel entegratör lisansı** anlamına gelmez. Lisans ayrı bir yasal/sertifikasyon sürecidir. Bu kod:

- UBL-TR üretir, outbox durumu tutar, yapılandırılmış endpoint’e POST eder (veya mock simüle eder)
- Lisanslı / onaylı bir GİB uç noktası olmadan **canlı e-Fatura üretim gönderimi yapılamaz**
- Mock / skeleton dürüstçe `mock: true` ve `dispatchStatus` ile işaretlenir

### e-Fatura env

| Değişken | Açıklama |
|----------|----------|
| `EINVOICE_EFATURA_ENABLED` | `true` → kanal açık |
| `EINVOICE_EFATURA_MOCK` | `true` → endpoint olmadan mock gönderim |
| `EINVOICE_EFATURA_BASE_URL` | Kanal HTTP kökü (lisanslı uç / kendi gateway) |
| `EINVOICE_EFATURA_API_KEY` | Bearer (opsiyonel) |
| `EINVOICE_EFATURA_USERNAME` / `PASSWORD` | Basic auth (opsiyonel) |
| `EINVOICE_EFATURA_SUBMIT_PATH` | Varsayılan `/efatura/submit` |
| `EINVOICE_EFATURA_STATUS_PATH` | Varsayılan `/efatura/status/{uuid}` |
| `EINVOICE_EFATURA_CANCEL_PATH` | Varsayılan `/efatura/cancel/{uuid}` |
| `EINVOICE_EFATURA_PDF_PATH` | Varsayılan `/efatura/pdf/{uuid}` |

`EINVOICE_PROVIDER=mock` iken e-Fatura da mock provider ile kabul edilir (geliştirme).

Kanal kapalıysa panel ve API: **"e-Fatura gönderimi için entegratör/kanal yapılandırılmadı"** — e-Arşiv’e düşmez.

---

## Üretim Ortamı Kontrol Listesi

### Veritabanı

- [ ] `user_billing_profiles` tablosu migrate edildi (`npx prisma migrate deploy`)
- [ ] `invoices`, `invoice_lines`, `email_deliveries` tabloları mevcut
- [ ] `Invoice.type` alanı kullanılıyor (`e_arsiv` / `e_fatura`) — ek tablo zorunlu değil (outbox metadata’da)

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
| `EINVOICE_EFATURA_ENABLED` | e-Fatura için | Kendi kanalı aç |
| `EINVOICE_EFATURA_MOCK` | Geliştirme | Endpoint’siz mock |
| `EINVOICE_EFATURA_BASE_URL` | Canlı kanal | HTTP kök |

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
- [ ] Kurumsal → `e_fatura` + BiletFeed e-Fatura kanalı (mock veya yapılandırılmış)

### Yasal / operasyonel

- [ ] e-Arşiv mükellefiyeti (IVD) aktif
- [ ] GEÇİŞ ise muhasebeci tarih/yetki penceresini takip eder
- [ ] e-Fatura: yazılım kanalı + (ileride) GİB özel entegratör lisansı planı
- [ ] KDV oranı ve fatura satır açıklamaları muhasebeci onayı
- [ ] İade akışı: `createCreditNoteForRefund` test edildi

---

## Admin API

| Endpoint | Açıklama |
|----------|----------|
| `GET .../invoices/[id]` | Fatura detay (satırlar, GİB meta, lifecycle) |
| `POST .../submit-einvoice` | Gönder / tekrar dene; body: `{ force?, documentType?, overrideConfirmed? }` |
| `PATCH .../document-type` | `{ "type": "e_arsiv" \| "e_fatura", "overrideConfirmed?" }` — audit log |
| `PATCH .../issued-at` | `{ "issuedAt": "ISO" }` — yalnızca hata/draft/none |
| `POST .../sms-start` | SMS imza başlat (e-Arşiv) |
| `POST .../sms-confirm` | `{ "code": "..." }` |
| `GET .../pdf` | PDF indir (kanal veya yerel pdfkit) |
| `POST .../cancel` | Kanal iptal + `status=cancelled` |
| `POST .../taxpayer-check` | Mükellef / tip önerisi (heuristic + metadata cache) |

---

## Paraşüt parity map

BiletFeed **Paraşüt API’sine bağlanmaz**; satış e-fatura yüzeyini kendi sisteminde taklit eder.
GİB özel entegratör lisansı bu tabloda “done” olsa bile yasal yetkiyi vermez.

| Paraşüt özelliği | BiletFeed | Durum | Not |
|------------------|-----------|-------|-----|
| e-Fatura / e-Arşiv belge tipi | `Invoice.type` + admin seçici | **done** | VKN→e_fatura, TCKN→e_arsiv önerisi |
| Mükellefiyete göre yönlendirme | `suggestedDocumentType` + taxpayer stub | **partial** | Canlı GİB mükellef listesi yok; heuristic + cache |
| Taslak oluştur | `submit` / `createDraft` (e-Arşiv portal) | **done** | e-Arşiv canlı portal; e-Fatura mock/HTTP |
| Gönder / resmileştir | Admin Gönder + SMS (e-Arşiv) | **done** | e-Arşiv: SMS; e-Fatura: kanal send |
| SMS imza (interaktif e-Arşiv) | `sms-start` / `sms-confirm` | **done** | Yalnızca gib-earsiv |
| Durum yaşam döngüsü | `lifecycle` (taslak…iptal) | **done** | Panel badge + filtre |
| PDF indir / paylaş | `GET .../pdf` + yerel pdfkit | **done** | Kanal URL veya dahili PDF |
| İptal (e-Arşiv 7 gün) | `POST .../cancel` | **partial** | Taslak sil + iptal denemesi; imzalı için portal fallback |
| e-Fatura iptal / red | cancel stub + status | **partial** | Temel e-fatura için karşı taraf iadesi gerekir (Paraşüt ile aynı kural) |
| İade / credit note | `createCreditNoteForRefund` + panel | **done** | İade satırları listede + gönder |
| Seri / numara | `BF{YIL}{6 hane}` | **done** | Panelde ETTN/UUID/zarf |
| Gelen kutusu (alış) | — | **planned** | Ticket SaaS çıkış odaklı; alış yok |
| Etiket / etiketleme | — | **planned** | İhtiyaç halinde metadata |
| Temel vs Ticari e-Fatura | UBL profil | **partial** | UBL TEMELFATURA; ticari profil seçimi yok |
| e-İrsaliye / e-SMM / stok / cari | — | **out of scope** | ERP değil |
| Canlı e-Fatura GİB SOAP | `gib-efatura` HTTP gateway | **mock / stub** | Endpoint + mock; lisans sonrası canlı |

### Mock vs canlı

| Kanal | Canlı mı? |
|-------|-----------|
| GİB e-Arşiv Portal (`gib-earsiv`) | Evet — IVD kullanıcı/şifre ile |
| BiletFeed e-Fatura (`gib-efatura`) | Mock veya kendi HTTP gateway; GİB lisanslı uç olmadan üretim yok |
| `EINVOICE_PROVIDER=mock` | Geliştirme simülasyonu |

---

## Nasıl test edilir

### e-Arşiv (mevcut)

```
EINVOICE_PROVIDER=gib
EINVOICE_USERNAME=...
EINVOICE_PASSWORD=...
```

Admin’de tipi **e-Arşiv** bırak → Gönder → taslak + SMS → PDF → (gerekirse) İptal.

### e-Fatura mock (kendi kanal)

```
EINVOICE_PROVIDER=gib   # e-Arşiv ayrı kalır
EINVOICE_EFATURA_ENABLED=true
EINVOICE_EFATURA_MOCK=true
```

veya tamamen lokal:

```
EINVOICE_PROVIDER=mock
```

Admin’de tipi **e-Fatura** seç → Gönder → `metadata.einvoice.channel=gib-efatura` (veya mock), `dispatchStatus=sent`. e-Arşiv portal çağrılmaz. PDF yerel üretilir. İptal mock’ta yerel `cancelled`.

### e-Fatura HTTP stub

```
EINVOICE_EFATURA_ENABLED=true
EINVOICE_EFATURA_BASE_URL=https://your-gateway.example
EINVOICE_EFATURA_API_KEY=...
```

### Panel kontrol listesi

1. `/admin/muhasebe` → Faturalar: tip/durum/tarih/arama filtreleri
2. Detay drawer: satırlar, KDV, ETTN, kanal
3. PDF indir
4. Mükellef kontrol (VKN→e-Fatura önerisi)
5. İade faturası (iade siparişi sonrası `credit_note` satırı)

---

## İlgili Dosyalar

| Dosya | Rol |
|-------|-----|
| `components/checkout/checkout-billing-section.tsx` | Checkout fatura formu |
| `lib/validation/checkout-billing.ts` | Zod doğrulama |
| `lib/services/user-billing.ts` | Profil upsert |
| `lib/accounting/fulfillment.ts` | Ödeme sonrası fatura tetikleyici |
| `lib/accounting/invoice.ts` | Fatura + tip/tarih düzeltme |
| `lib/accounting/einvoice/` | Provider’lar, router, guard, UBL, PDF, iptal, mükellef |
| `lib/accounting/einvoice/providers/gib-efatura.ts` | BiletFeed e-Fatura kanalı |
| `lib/accounting/einvoice/lifecycle.ts` | Paraşüt-benzeri durum etiketleri |
| `lib/accounting/einvoice/invoice-pdf.ts` | Yerel fatura PDF |
| `components/admin/invoice-gib-table.tsx` | Filtre + detay + PDF + iptal |
| `lib/accounting/email.ts` | Fatura e-postası |
| `prisma/schema.prisma` | `UserBillingProfile`, `Invoice` |
