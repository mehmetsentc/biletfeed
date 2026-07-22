# BiletFeed — Muhasebe Altyapısı

Tek ticari kaynak: `lib/config/company.ts` (KSD ORGANİZASYON, VKN 5901381024).

## Tetikleyiciler

| Olay | Servis | Açıklama |
|------|--------|----------|
| Sipariş ödendi (ücretsiz/ücretli) | `processOrderAccounting` | Fatura, mutabakat, hakediş, gelir erteleme, e-posta |
| Admin iade | `createCreditNoteForRefund` | İade faturası (credit note) |
| Cron `GET /api/cron/accounting` | `recognizeDueRevenue` | Etkinlik tarihi geçen ertelenmiş geliri tanır |

Cron yetkilendirme: `Authorization: Bearer $CRON_SECRET` veya `x-cron-secret` başlığı.

---

## Modül Haritası (18 başlık)

### Temel modüller

1. **Otomatik Fatura Motoru** — `lib/accounting/invoice.ts` + `lib/accounting/einvoice/`  
   Bilet satışı sonrası `BF{YIL}{6 hane}` numaralı e-Arşiv (bireysel) veya e-Fatura (10 haneli VKN). Satıcı bilgisi `companyLegal` metadata içinde. UBL-TR üretilir; GİB gönderimi entegratör adapter ile yapılır (`eInvoiceUuid`).

2. **Ödeme Geçidi Mutabakatı** — `lib/accounting/reconciliation.ts`  
   iyzico / PayTR / Stripe / mock için beklenen vs alınan tutar, tahmini komisyon, `reconciled` / `mismatch` durumu.

3. **Vergi Yönetimi** — `lib/accounting/tax.ts`  
   Varsayılan KDV %20 (`ACCOUNTING_VAT_RATE`). Brüt tutardan net + KDV ayrıştırma.

4. **Gelir Tanıma** — `lib/accounting/revenue.ts`  
   Satışta `deferred`, etkinlik `endDate` geçince cron ile `recognized`.

### Bildirim katmanı

5. **E-posta Delivery Engine** — `lib/accounting/email.ts`  
   Resend (`lib/email/resend.ts`, `lib/config/email.ts`); yapılandırılmadığında log-only mod. Detay: `docs/EMAIL.md`.

6. **Delivery Status Tracker** — `email_deliveries` tablosu  
   `queued` → `sent` / `failed`; ileride webhook ile `delivered` / `opened`.

7. **Admin İzleme Paneli** — `/admin/muhasebe`  
   Fatura, mutabakat, hakediş, e-posta ve audit log listeleri.

### Finansal operasyonlar

8. **İade & Chargeback** — `createCreditNoteForRefund`  
   Orijinal faturanın negatif kopyası; sipariş `refunded` olduğunda tetiklenir.

9. **Organizatör Hakedişi** — `lib/accounting/commission.ts`  
   `subtotal - commission` net hakediş; etkinlik bitişine göre `pending` planlanır.

10. **Çoklu Para Birimi** — Prisma `Currency` enum (TRY/USD/EUR)  
    Kur farkı muhasebesi için altyapı hazır; canlı kur API entegrasyonu sonraki aşama.

11. **Komisyon Modülü** — `Order.commission` + payout satırı  
    Platform komisyonu sipariş oluşturulurken hesaplanır; hakedişte net/brüt ayrışır.

### Raporlama & uyum

12. **Mali Tablolar** — Admin özet kartları + fatura toplamları  
    Tam bilanço / nakit akışı ERP köprüsü ile tamamlanacak.

13. **Vergi Beyanname Hazırlığı** — Fatura + KDV satırları export edilebilir  
    BA/BS ve KDV beyanı için `invoices` + `invoice_lines` kaynak tablo.

14. **Denetim İzi** — `lib/accounting/audit.ts` → `accounting_audit_logs`  
    Her fatura, mutabakat, gelir tanıma ve e-posta işlemi loglanır.

15. **ERP Köprüsü** — Metadata + REST API hazır  
    Logo / Luca / SAP / QuickBooks için webhook veya CSV export eklenecek.

### Güvenlik & altyapı

16. **PCI-DSS** — Kart verisi ödeme sağlayıcısında; platform yalnızca `paymentId` saklar.

17. **RBAC** — Admin paneli `requireAdminSession`; muhasebeci rolü genişletilebilir.

18. **API-First** — Cron endpoint, admin API'ler; webhook altyapısı mevcut pattern ile genişletilir.

---

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `ACCOUNTING_VAT_RATE` | KDV oranı (varsayılan 20) |
| `COMPANY_IBAN` | Fatura / hakediş IBAN |
| `COMPANY_MERSIS_NO` | MERSİS numarası |
| `RESEND_API_KEY` | Fatura ve onay e-postaları (Resend) |
| `RESEND_FROM_EMAIL` | Varsayılan gönderen (tickets@biletfeed.com) |
| `RESEND_INVOICE_FROM` | Fatura gönderen (fatura@biletfeed.com) |
| `CRON_SECRET` | Gelir tanıma cron yetkisi |
| `EINVOICE_PROVIDER` | `mock` \| `gib` \| `http` \| `none` — **`gib` = GİB e-Arşiv Portal** |
| `EINVOICE_ENABLED` | `true` / `false` — gönderimi aç/kapa |
| `EINVOICE_USERNAME` | IVD / e-Arşiv kullanıcı kodu (GİB) |
| `EINVOICE_PASSWORD` | IVD şifresi |
| `EINVOICE_SANDBOX` | `true` = test portal; `gib` için varsayılan `false` (canlı) |
| `EINVOICE_API_BASE_URL` | Yalnızca `http` provider |
| `EINVOICE_API_KEY` | Bearer token (`http`) |
| `EINVOICE_FAIL_SOFT` | GİB hatası siparişi bozmasın (varsayılan true) |

---

## e-Fatura / e-Arşiv (GİB)

Modül: `lib/accounting/einvoice/`

| Parça | Rol |
|-------|-----|
| `providers/gib-earsiv.ts` | **GİB e-Arşiv Portal** — login + taslak fatura |
| `ubl.ts` | Invoice → UBL-TR 1.2 XML + ETTN (yedek / http provider) |
| `providers/mock.ts` | Credential yokken simülasyon |
| `providers/http.ts` | Genel REST entegratör köprüsü |
| `submit.ts` | DB güncelleme (`eInvoiceUuid`, `metadata.einvoice`) |

Akış: `processOrderAccounting` → iç fatura → `submitInvoiceToGib` → e-posta.

**GİB portal notu:** `FATURA_OLUSTUR` taslak oluşturur. Resmi “Onaylandı” için admin muhasebe panelinden SMS gönder + kod gir (`sms-start` / `sms-confirm`).

Admin:
- Liste + aksiyonlar: `/admin/muhasebe`
- Yeniden gönderim: `POST /api/admin/accounting/invoices/[invoiceId]/submit-einvoice`
- SMS başlat: `POST .../sms-start`
- SMS onay: `POST .../sms-confirm` body `{ "code": "123456" }`

---

## Veritabanı

Migrasyon: `prisma/migrations/20260624000000_accounting_infrastructure/`

Tablolar: `invoices`, `invoice_lines`, `payment_reconciliations`, `email_deliveries`, `organizer_payouts`, `revenue_recognitions`, `accounting_audit_logs`, `user_billing_profiles`.

Üretimde: `npm run db:migrate:deploy` (Neon pooler URL ile `npx prisma migrate deploy` takılabilir)
