import {
  getAccountingSummary,
  getAccountingInvoices,
  getAccountingEmailDeliveries,
  getAccountingPayouts,
  getAccountingReconciliations,
  getAccountingAuditLogs,
  getAccountingOrganizersOverview,
  getAccountingExpenses
} from '@/lib/services/accounting-admin';
import { Badge } from '@/components/ui/badge';
import { formatCompanyTaxLine } from '@/lib/config/company';
import Link from 'next/link';
import { adminHref } from '@/lib/config/domain';
import {
  InvoiceGibTable,
  type InvoiceGibRow
} from '@/components/admin/invoice-gib-table';
import {
  PayoutActionsTable,
  type PayoutActionRow
} from '@/components/admin/payout-actions-table';
import { AccountingExportButtons } from '@/components/admin/accounting-export-buttons';
import {
  AccountingExpensesPanel,
  type ExpenseRow
} from '@/components/admin/accounting-expenses-panel';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import { classifyGibError } from '@/lib/accounting/einvoice/gib-errors';
import { evaluateGibSendEligibility } from '@/lib/accounting/einvoice/gib-send-guard';
import { canEditInvoiceIssuedAt } from '@/lib/accounting/invoice';

function money(amount: number, currency = 'TRY') {
  return `${currency === 'TRY' ? '₺' : currency + ' '}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
}

function toIssuedAtDateInput(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

function toGibRows(
  invoices: Awaited<ReturnType<typeof getAccountingInvoices>>
): InvoiceGibRow[] {
  return invoices.map((inv) => {
    const einv = readEInvoiceMeta(inv.metadata);
    const gibStatus = einv.status ?? (inv.eInvoiceUuid ? 'submitted' : '—');
    const lastError = einv.lastError ?? null;
    const classified = classifyGibError(lastError);
    const eligibility = evaluateGibSendEligibility({
      issuedAt: inv.issuedAt,
      invoiceType: inv.type,
      buyerTaxNumber: inv.buyerTaxNumber,
      lastError
    });
    const isRetry =
      gibStatus === 'failed' ||
      gibStatus === 'rejected' ||
      Boolean(lastError);

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issuedAtLabel: inv.issuedAt.toLocaleDateString('tr-TR'),
      issuedAtDate: toIssuedAtDateInput(inv.issuedAt),
      buyerName: inv.buyerName,
      eventTitle: inv.order.event?.title ?? '—',
      amountLabel: money(inv.totalGross, inv.currency),
      type: inv.type,
      status: inv.status,
      gibStatus,
      needsSmsSign: Boolean(einv.needsSmsSign),
      eInvoiceUuid: inv.eInvoiceUuid ?? einv.uuid ?? null,
      lastError,
      phoneMasked: einv.smsPhoneMasked ?? null,
      errorCategory: classified?.category ?? null,
      errorTitle: classified?.title ?? null,
      errorExplanation: classified?.explanation ?? null,
      sendDisabled: !eligibility.canSend,
      sendDisabledReason: eligibility.blockReason ?? null,
      canEditIssuedAt: canEditInvoiceIssuedAt(
        gibStatus === '—' ? undefined : gibStatus
      ),
      issuedOutsideGecis: Boolean(eligibility.issuedOutsideGecis),
      gecisRangeLabel: eligibility.gecisRange
        ? `${eligibility.gecisRange.fromLabel} – ${eligibility.gecisRange.toLabel}`
        : null,
      isRetry
    };
  });
}

function toPayoutRows(
  payouts: Awaited<ReturnType<typeof getAccountingPayouts>>
): PayoutActionRow[] {
  return payouts.map((p) => ({
    id: p.id,
    organizerName: p.organizer.name,
    eventTitle: p.event.title,
    grossLabel: money(p.grossAmount, p.currency),
    commissionLabel: money(p.commissionAmount, p.currency),
    netLabel: money(p.netAmount, p.currency),
    status: p.status,
    paymentRef: p.paymentRef
  }));
}

function toExpenseRows(
  expenses: Awaited<ReturnType<typeof getAccountingExpenses>>
): ExpenseRow[] {
  return expenses.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amountLabel: money(e.amount, e.currency),
    vatLabel: money(e.vatAmount, e.currency),
    eventTitle: e.event?.title ?? '—',
    organizerName: e.organizer?.name ?? '—',
    incurredAtLabel: e.incurredAt.toLocaleDateString('tr-TR')
  }));
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
  let expenses: Awaited<ReturnType<typeof getAccountingExpenses>> = [];

  try {
    [summary, invoices, emails, payouts, reconciliations, auditLogs, organizers, expenses] =
      await Promise.all([
        getAccountingSummary(),
        getAccountingInvoices(),
        getAccountingEmailDeliveries(),
        getAccountingPayouts(),
        getAccountingReconciliations(),
        getAccountingAuditLogs(),
        getAccountingOrganizersOverview(),
        getAccountingExpenses()
      ]);
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : 'Muhasebe verileri yüklenemedi. Veritabanı migrasyonu uygulanmış olmalı.';
  }

  const gibRows = toGibRows(invoices);
  const payoutRows = toPayoutRows(payouts);
  const expenseRows = toExpenseRows(expenses);
  const pendingSms = gibRows.filter((r) => r.needsSmsSign || r.gibStatus === 'submitted').length;
  const gecisIssueCount = gibRows.filter(
    (r) => r.errorCategory === 'gecis_tarih' || r.issuedOutsideGecis
  ).length;
  const efaturaSellerCount = gibRows.filter(
    (r) => r.errorCategory === 'efatura_satici'
  ).length;
  const efaturaBuyerBlocked = gibRows.filter(
    (r) =>
      r.sendDisabled &&
      r.sendDisabledReason?.includes('Alıcı e-Fatura')
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Muhasebe</h1>
          <p className="text-muted-foreground">
            Fatura, GİB e-Arşiv, mutabakat, hakediş, gider ve e-posta izleme —{' '}
            {summary?.company.tradeName}
          </p>
          {summary && (
            <p className="mt-1 text-xs text-muted-foreground">{formatCompanyTaxLine()}</p>
          )}
        </div>
        <AccountingExportButtons />
      </div>

      {loadError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {(gecisIssueCount > 0 || efaturaSellerCount > 0 || efaturaBuyerBlocked > 0) && (
        <div className="space-y-2">
          {gecisIssueCount > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">
                GİB GEÇİŞ penceresi — {gecisIssueCount} fatura
              </p>
              <p className="mt-1 text-amber-900/90">
                Bu faturalar GİB’in izin verdiği tarih aralığı dışında veya GEÇİŞ
                hatası almış. Muhasebeci IVD’den e-Arşiv yetkisi/tarih açmalı;
                gerekirse aşağıdaki listeden fatura tarihini pencere içine
                taşıyın. Opsiyonel env:{' '}
                <code className="rounded bg-amber-100 px-1 text-xs">
                  EINVOICE_GECIS_DATE_FROM
                </code>{' '}
                /{' '}
                <code className="rounded bg-amber-100 px-1 text-xs">
                  EINVOICE_GECIS_DATE_TO
                </code>
              </p>
            </div>
          )}
          {efaturaSellerCount > 0 && (
            <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-950">
              <p className="font-medium">
                Satıcı e-Fatura / geçiş çakışması — {efaturaSellerCount} fatura
              </p>
              <p className="mt-1 text-orange-900/90">
                Satıcı VKN e-Fatura kullanıcısı olarak görünüyor olabilir.
                e-Arşiv portal gönderimi bu satırlar için kapatıldı — muhasebeciye
                danışın.
              </p>
            </div>
          )}
          {efaturaBuyerBlocked > 0 && (
            <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-800">
              <p className="font-medium">
                Alıcı e-Fatura mükellefi — {efaturaBuyerBlocked} fatura
              </p>
              <p className="mt-1 text-zinc-600">
                10 haneli VKN / <code className="text-xs">e_fatura</code> tipi
                e-Arşiv portal ile gönderilemez; özel entegratör / e-Fatura kanalı
                gerekir.
              </p>
            </div>
          )}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Kesilen fatura" value={String(summary.invoiceCount)} sub={money(summary.invoiceTotal)} />
          <StatCard
            label="GİB SMS / taslak"
            value={String(pendingSms)}
            sub="Onay bekleyen e-Arşiv"
          />
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

      <Section
        title="Faturalar"
        description="BiletFeed faturası + GİB e-Arşiv: taslak gönder, SMS ile imzala"
      >
        <InvoiceGibTable rows={gibRows} />
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

      <Section
        title="Organizatör hakedişleri"
        description="Ödeme referansı ile ödendi işaretle veya iptal et"
      >
        <PayoutActionsTable rows={payoutRows} />
      </Section>

      <Section
        title="Giderler"
        description="Platform / etkinlik giderleri — P&L hesaplamasına dahil"
      >
        <AccountingExpensesPanel rows={expenseRows} />
      </Section>

      <Section
        title="Organizatör finans görünümü"
        description="Organizatöre tıklayıp geçmiş/gelecek etkinlik ve detay finansları açın"
      >
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
                    <Link
                      href={adminHref(`/muhasebe/${org.organizerId}`)}
                      className="font-semibold hover:underline"
                    >
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
                    <span className="ml-1 text-xs text-muted-foreground">
                      (%{org.commissionRatePercent})
                    </span>
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
                  {j === row.length - 1 &&
                  ['issued', 'reconciled', 'sent', 'recognized', 'paid'].includes(cell) ? (
                    <Badge variant="success">{cell}</Badge>
                  ) : j === row.length - 1 &&
                    [
                      'failed',
                      'mismatch',
                      'pending',
                      'deferred',
                      'cancelled',
                      'scheduled'
                    ].includes(cell) ? (
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
