import {
  getAccountingSummary,
  getAccountingInvoices,
  getAccountingEmailDeliveries,
  getAccountingPayouts,
  getAccountingReconciliations,
  getAccountingAuditLogs,
  getAccountingOrganizersOverview
} from '@/lib/services/accounting-admin';
import { Badge } from '@/components/ui/badge';
import { formatCompanyTaxLine } from '@/lib/config/company';
import Link from 'next/link';
import { adminHref } from '@/lib/config/domain';

function money(amount: number, currency = 'TRY') {
  return `${currency === 'TRY' ? '₺' : currency + ' '}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

export default async function AdminAccountingPage() {
  let loadError: string | null = null;
  let summary: Awaited<ReturnType<typeof getAccountingSummary>> | null = null;
  let invoices: Awaited<ReturnType<typeof getAccountingInvoices>> = [];
  let emails: Awaited<ReturnType<typeof getAccountingEmailDeliveries>> = [];
  let payouts: Awaited<ReturnType<typeof getAccountingPayouts>> = [];
  let reconciliations: Awaited<ReturnType<typeof getAccountingReconciliations>> = [];
  let auditLogs: Awaited<ReturnType<typeof getAccountingAuditLogs>> = [];
  let organizers: Awaited<ReturnType<typeof getAccountingOrganizersOverview>> = [];

  try {
    [summary, invoices, emails, payouts, reconciliations, auditLogs, organizers] = await Promise.all([
      getAccountingSummary(),
      getAccountingInvoices(),
      getAccountingEmailDeliveries(),
      getAccountingPayouts(),
      getAccountingReconciliations(),
      getAccountingAuditLogs(),
      getAccountingOrganizersOverview()
    ]);
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : 'Muhasebe verileri yüklenemedi. Veritabanı migrasyonu uygulanmış olmalı.';
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Muhasebe</h1>
        <p className="text-muted-foreground">
          Fatura, mutabakat, hakediş ve e-posta izleme — {summary?.company.tradeName}
        </p>
        {summary && (
          <p className="mt-1 text-xs text-muted-foreground">{formatCompanyTaxLine()}</p>
        )}
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Kesilen fatura" value={String(summary.invoiceCount)} sub={money(summary.invoiceTotal)} />
          <StatCard
            label="Bekleyen hakediş"
            value={String(summary.pendingPayoutCount)}
            sub={money(summary.pendingPayoutAmount)}
          />
          <StatCard
            label="Ertelenmiş gelir"
            value={String(summary.deferredRevenueCount)}
            sub={money(summary.deferredRevenueAmount)}
          />
          <StatCard
            label="Mutabakat / E-posta hata"
            value={String(summary.reconciledCount)}
            sub={`${summary.emailFailed} başarısız mail`}
          />
        </div>
      )}

      <Section title="Faturalar" description="e-Arşiv / e-Fatura ve iade faturaları">
        <DataTable
          headers={['No', 'Tarih', 'Alıcı', 'Etkinlik', 'Tutar', 'Tip', 'Durum']}
          rows={invoices.map((inv) => [
            inv.invoiceNumber,
            inv.issuedAt.toLocaleDateString('tr-TR'),
            inv.buyerName,
            inv.order.event?.title ?? '—',
            money(inv.totalGross, inv.currency),
            inv.type,
            inv.status
          ])}
          empty="Henüz fatura yok."
        />
      </Section>

      <Section title="Ödeme mutabakatı" description="Stripe, iyzico, PayTR ve mock ödemeler">
        <DataTable
          headers={['Sipariş', 'Sağlayıcı', 'Beklenen', 'Alınan', 'Net', 'Durum']}
          rows={reconciliations.map((r) => [
            r.orderId.slice(0, 8),
            r.provider,
            money(r.expectedAmount, r.currency),
            money(r.receivedAmount, r.currency),
            money(r.netAmount, r.currency),
            r.status
          ])}
          empty="Mutabakat kaydı yok."
        />
      </Section>

      <Section title="Organizatör hakedişleri" description="Etkinlik sonrası ödeme planı">
        <DataTable
          headers={['Organizatör', 'Etkinlik', 'Brüt', 'Komisyon', 'Net', 'Durum']}
          rows={payouts.map((p) => [
            p.organizer.name,
            p.event.title,
            money(p.grossAmount, p.currency),
            money(p.commissionAmount, p.currency),
            money(p.netAmount, p.currency),
            p.status
          ])}
          empty="Hakediş kaydı yok."
        />
      </Section>

      <Section title="Organizatör finans görünümü" description="Organizatöre tıklayıp geçmiş/gelecek etkinlik ve detay finansları açın">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Organizatör</th>
                <th className="p-3 font-medium">Komisyon</th>
                <th className="p-3 font-medium">Etkinlik</th>
                <th className="p-3 font-medium">Ödenen Sipariş</th>
                <th className="p-3 font-medium">Satış</th>
                <th className="p-3 font-medium">Hizmet Bedeli</th>
                <th className="p-3 font-medium">KDV</th>
                <th className="p-3 font-medium">Ödeme Alındı</th>
                <th className="p-3 font-medium">Bekleyen Hakediş</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map((org) => (
                <tr key={org.organizerId} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">
                    <Link href={adminHref(`/muhasebe/${org.organizerId}`)} className="font-semibold hover:underline">
                      {org.organizerName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{org.ownerEmail}</p>
                  </td>
                  <td className="p-3">
                    <span className="font-medium">%{org.commissionRatePercent}</span>
                    <p className="text-xs text-muted-foreground">
                      {org.commissionRateCustom ? 'Özel' : 'Varsayılan'}
                    </p>
                  </td>
                  <td className="p-3">{org.eventCount}</td>
                  <td className="p-3">{org.paidOrderCount}</td>
                  <td className="p-3">{money(org.grossSales)}</td>
                  <td className="p-3">
                    {money(org.serviceFee)}
                    <span className="ml-1 text-xs text-muted-foreground">(%{org.commissionRatePercent})</span>
                  </td>
                  <td className="p-3">
                    {money(org.vatAmount)}
                    <span className="ml-1 text-xs text-muted-foreground">(%{org.vatRate})</span>
                  </td>
                  <td className="p-3">{money(org.paymentReceived)}</td>
                  <td className="p-3">{money(org.payoutPending)}</td>
                </tr>
              ))}
              {organizers.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Organizatör kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="E-posta teslimatı" description="Fatura ve bilet onay mailleri">
        <DataTable
          headers={['Alıcı', 'Konu', 'Şablon', 'Durum', 'Tarih']}
          rows={emails.map((e) => [
            e.to,
            e.subject,
            e.template,
            e.status,
            (e.sentAt ?? e.createdAt).toLocaleString('tr-TR')
          ])}
          empty="E-posta kaydı yok."
        />
      </Section>

      <Section title="Denetim izi" description="Değişmez muhasebe işlem logu">
        <DataTable
          headers={['Tarih', 'İşlem', 'Varlık', 'ID']}
          rows={auditLogs.map((a) => [
            a.createdAt.toLocaleString('tr-TR'),
            a.action,
            a.entityType,
            a.entityId.slice(0, 8)
          ])}
          empty="Audit log boş."
        />
      </Section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DataTable({
  headers,
  rows,
  empty
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b bg-muted/50 text-left">
          <tr>
            {headers.map((h) => (
              <th key={h} className="p-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="p-3">
                  {j === row.length - 1 && ['issued', 'reconciled', 'sent', 'recognized'].includes(cell) ? (
                    <Badge variant="success">{cell}</Badge>
                  ) : j === row.length - 1 && ['failed', 'mismatch', 'pending', 'deferred'].includes(cell) ? (
                    <Badge variant="secondary">{cell}</Badge>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
