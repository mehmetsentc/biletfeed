# BiletFeed — Muhasebe Altyapısı

Tek ticari kaynak: `lib/config/company.ts` (KSD ORGANİZASYON, VKN 5901381024).

## Tetikleyiciler

| Olay | Servis | Açıklama |
|------|--------|----------|
| Sipariş ödendi (ücretsiz/ücretli) | `processOrderAccounting` | Fatura, mutabakat, hakediş, gelir erteleme, e-posta |
| Admin iade | `processOrderRefundAccounting` | Credit note + hakediş iptal + gelir reverse + mutabakat |
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
   Satışta `deferred`, etkinlik `endDate` geçince cron ile `recognized`. İadede `reversed`.

### Bildirim katmanı

5. **E-posta Delivery Engine** — `lib/accounting/email.ts`  
   Resend (`lib/email/resend.ts`, `lib/config/email.ts`); yapılandırılmadığında log-only mod. Detay: `docs/EMAIL.md`.

6. **Delivery Status Tracker** — `email_deliveries` tablosu  
   `queued` → `sent` / `failed`; ileride webhook ile `delivered` / `opened`.

7. **Admin İzleme Paneli** — `/admin/muhasebe`  
   Fatura, mutabakat, hakediş (ödendi/iptal), gider CRUD, CSV export, e-posta ve audit log.

### Finansal operasyonlar

8. **İade & Chargeback** — `processOrderRefundAccounting`  
   Credit note + bekleyen hakediş iptali + gelir `reversed` + mutabakat `refunded` metadata.

9. **Organizatör Hakedişi** — `lib/accounting/commission.ts`  
   Brüt = `order.total` (tahsilat); komisyon `total/subtotal` ile ölçeklenir (indirim fazla ödeme yapmaz).  
   `markPayoutPaid` (paymentRef + IBAN snapshot) / `cancelPayout`.

10. **Çoklu Para Birimi** — Prisma `Currency` enum (TRY/USD/EUR)  
    Kur farkı muhasebesi için altyapı hazır; canlı kur API entegrasyonu sonraki aşama.

11. **Komisyon Modülü** — `Order.commission` + payout satırı  
    Platform komisyonu sipariş oluşturulurken hesaplanır; hakedişte tahsilata orantılanır.

12. **Gider & Etkinlik P&L** — `lib/accounting/expenses.ts` + `accounting_expenses`  
    Kategori bazlı gider; etkinlik detayında gelir / komisyon / hakediş / gider / net.

### Raporlama & uyum

13. **Mali Tablolar** — Admin özet kartları + etkinlik P&L  
    Tam bilanço / nakit akışı ERP köprüsü ile tamamlanacak.

14. **Vergi Beyanname Hazırlığı** — CSV export  
    `GET /api/admin/accounting/export?type=kdv|ba-bs|hakedis` — Türkçe başlıklı CSV (UTF-8 BOM).

15. **Denetim İzi** — `lib/accounting/audit.ts` → `accounting_audit_logs`  
    Her fatura, mutabakat, gelir tanıma, hakediş, gider ve e-posta işlemi loglanır.

16. **ERP Köprüsü** — Metadata + REST API hazır  
    Logo / Luca / SAP / QuickBooks için webhook veya CSV export eklenecek.

### Güvenlik & altyapı

17. **PCI-DSS** — Kart verisi ödeme sağlayıcısında; platform yalnızca `paymentId` saklar.

18. **RBAC** — Admin paneli `accounting.manage`; muhasebeci rolü genişletilebilir.

19. **API-First** — Cron endpoint, admin API'ler; webhook altyapısı mevcut pattern ile genişletilir.

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

**GİB portal notu:** Yeni taslakta `faturaUuid` **boş** gönderilir. Resmi onay için SMS.  
**GEÇİŞ kullanıcısı:** Bazı hesaplar yalnızca GİB’in verdiği kısa tarih aralığında fatura kesebilir (ör. `08/07/2026–15/07/2026`). Bu aralık dışındaki tarihler reddedilir — muhasebeci / GİB ile e-Arşiv yetkisinin genişletilmesi gerekir.

Admin:
- Liste + aksiyonlar: `/admin/muhasebe`
- Yeniden gönderim: `POST /api/admin/accounting/invoices/[invoiceId]/submit-einvoice`
- SMS başlat: `POST .../sms-start`
- SMS onay: `POST .../sms-confirm` body `{ "code": "123456" }`
- Hakediş öde: `POST /api/admin/accounting/payouts/[payoutId]/mark-paid` `{ "paymentRef": "..." }`
- Hakediş iptal: `POST /api/admin/accounting/payouts/[payoutId]/cancel`
- Giderler: `GET|POST /api/admin/accounting/expenses`, `PATCH|DELETE .../expenses/[expenseId]`
- CSV: `GET /api/admin/accounting/export?type=kdv|ba-bs|hakedis`

---

## Veritabanı

Migrasyonlar:
- `prisma/migrations/20260624000000_accounting_infrastructure/`
- `prisma/migrations/20260723010000_accounting_ops_package/` — hakediş ödeme alanları, `cancelled`/`reversed`, `accounting_expenses`

Tablolar: `invoices`, `invoice_lines`, `payment_reconciliations`, `email_deliveries`, `organizer_payouts`, `revenue_recognitions`, `accounting_audit_logs`, `user_billing_profiles`, `accounting_expenses`.

Üretimde: `npm run db:migrate:deploy` (Neon pooler URL ile `npx prisma migrate deploy` takılabilir)
