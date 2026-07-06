# BiletFeed — Otomatik Fatura (e-Arşiv / e-Fatura)

Bu belge checkout fatura toplama, dahili fatura motoru ve GİB entegratör yol haritasını özetler. Muhasebe modül detayları için `docs/ACCOUNTING.md`.

## Mevcut Akış

```
Ödeme tamamlandı
    → processOrderAccounting (lib/accounting/fulfillment.ts)
        → user_billing_profiles (checkout'ta kaydedilir)
        → createSaleInvoice (BF{YIL}{6 hane})
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

Fatura tipi (`lib/accounting/invoice.ts`):

- 10 haneli VKN → `e_fatura`
- Diğer → `e_arsiv`

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

### Muhasebe env

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `ACCOUNTING_VAT_RATE` | Hayır | Varsayılan KDV %20 |
| `RESEND_API_KEY` | Evet* | Fatura e-postası (*yoksa log-only) |
| `RESEND_INVOICE_FROM` | Hayır | `fatura@biletfeed.com` |
| `CRON_SECRET` | Evet | Gelir tanıma cron |
| `DATABASE_URL` | Evet | Neon PostgreSQL |

### E-posta

- [ ] `fatura@biletfeed.com` Resend'de doğrulandı
- [ ] SPF / DKIM / DMARC kayıtları (`docs/EMAIL.md`)
- [ ] Test: `POST /api/admin/test-email` (admin oturumu)

### Ödeme sonrası doğrulama

- [ ] Ücretli test siparişi → `invoices` kaydı oluşuyor
- [ ] `invoiceNumber` formatı: `BF2026000001`
- [ ] Alıcı e-postasına fatura bildirimi gidiyor
- [ ] Admin `/admin/muhasebe` fatura listesinde görünüyor
- [ ] Kurumsal sipariş → `type: e_fatura`, bireysel → `e_arsiv`

### Yasal / operasyonel

- [ ] e-Arşiv mükellefiyeti ve entegratör sözleşmesi (aşağıdaki Faz 2)
- [ ] KDV oranı ve fatura satır açıklamaları muhasebeci onayı
- [ ] İade akışı: `createCreditNoteForRefund` test edildi

---

## GİB Entegratör Yol Haritası (Faz 2)

Şu an fatura kayıtları dahili veritabanında oluşturulur; GİB'e elektronik gönderim **henüz bağlı değildir**. Üretim e-Arşiv/e-Fatura için aşağıdaki fazlar planlanmıştır.

### Faz 2A — Entegratör seçimi ve sözleşme

1. Özel entegratör veya GİB doğrudan bağlantı değerlendirmesi (Logo e-Fatura, Foriba/Şık, Uyumsoft, Nilvera vb.)
2. e-Arşiv ve e-Fatura mükellefiyet aktivasyonu
3. Test ortamı API anahtarları

### Faz 2B — Teknik entegrasyon

```
lib/accounting/gib/
  client.ts          # Entegratör REST/SOAP istemcisi
  e-arsiv.ts         # Bireysel fatura gönderimi
  e-fatura.ts        # Kurumsal fatura (10 hane VKN)
  status-poll.ts     # GİB onay / red durumu
```

- `createSaleInvoice` sonrası kuyruk: `invoice.status = draft` → entegratör gönderimi → `issued` + `gibUuid`
- Webhook veya cron ile durum güncelleme
- Hata durumunda admin uyarısı ve yeniden deneme

### Faz 2C — PDF ve müşteri deneyimi

- GİB onaylı PDF veya entegratör PDF indirme linki
- E-posta şablonuna PDF eki (`lib/email/invoice-template.ts`)
- Kullanıcı dashboard: geçmiş faturalar listesi

### Faz 2D — Uyum ve raporlama

- KDV beyanı export (BA/BS hazırlığı)
- İptal / iade faturası GİB senkronu (`createCreditNoteForRefund`)
- `accounting_audit_logs` ile entegratör yanıt logları

### Önerilen env (Faz 2)

```
GIB_INTEGRATOR_URL=
GIB_INTEGRATOR_API_KEY=
GIB_INTEGRATOR_USERNAME=
GIB_INTEGRATOR_PASSWORD=
GIB_TEST_MODE=true
```

---

## İlgili Dosyalar

| Dosya | Rol |
|-------|-----|
| `components/checkout/checkout-billing-section.tsx` | Checkout fatura formu |
| `lib/validation/checkout-billing.ts` | Zod doğrulama |
| `lib/services/user-billing.ts` | Profil upsert |
| `lib/accounting/fulfillment.ts` | Ödeme sonrası fatura tetikleyici |
| `lib/accounting/invoice.ts` | Fatura oluşturma |
| `lib/accounting/email.ts` | Fatura e-postası |
| `prisma/schema.prisma` | `UserBillingProfile`, `Invoice` |
