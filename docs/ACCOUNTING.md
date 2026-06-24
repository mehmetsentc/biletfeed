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

1. **Otomatik Fatura Motoru** — `lib/accounting/invoice.ts`  
   Bilet satışı sonrası `BF{YIL}{6 hane}` numaralı e-Arşiv (bireysel) veya e-Fatura (10 haneli VKN). Satıcı bilgisi `companyLegal` metadata içinde.

2. **Ödeme Geçidi Mutabakatı** — `lib/accounting/reconciliation.ts`  
   iyzico / PayTR / Stripe / mock için beklenen vs alınan tutar, tahmini komisyon, `reconciled` / `mismatch` durumu.

3. **Vergi Yönetimi** — `lib/accounting/tax.ts`  
   Varsayılan KDV %20 (`ACCOUNTING_VAT_RATE`). Brüt tutardan net + KDV ayrıştırma.

4. **Gelir Tanıma** — `lib/accounting/revenue.ts`  
   Satışta `deferred`, etkinlik `endDate` geçince cron ile `recognized`.

### Bildirim katmanı

5. **E-posta Delivery Engine** — `lib/accounting/email.ts`  
   Resend (`lib/email/resend.ts`, `RESEND_API_KEY`); yapılandırılmadığında log-only mod.

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
| `RESEND_FROM_EMAIL` | Gönderen adresi |
| `CRON_SECRET` | Gelir tanıma cron yetkisi |

---

## Veritabanı

Migrasyon: `prisma/migrations/20260624000000_accounting_infrastructure/`

Tablolar: `invoices`, `invoice_lines`, `payment_reconciliations`, `email_deliveries`, `organizer_payouts`, `revenue_recognitions`, `accounting_audit_logs`, `user_billing_profiles`.

Üretimde: `npm run db:migrate:deploy` (Neon pooler URL ile `npx prisma migrate deploy` takılabilir)
