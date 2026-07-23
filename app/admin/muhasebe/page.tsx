import {
  getAccountingSummary,
  getAccountingInvoices,
  getAccountingEmailDeliveries,
  getAccountingPayouts,
  getAccountingReconciliations,
  getAccountingAuditLogs,
  getAccountingOrganizersOverview,
  getAccountingExpenses,
  getAccountingInvoiceAlertCounts,
  getAccountingVatSummary
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
import {
  MuhasebeTabs,
  type MuhasebeTabKey
} from '@/components/admin/muhasebe-tabs';
import { readEInvoiceMeta } from '@/lib/accounting/einvoice/meta';
import { classifyGibError } from '@/lib/accounting/einvoice/gib-errors';
import { evaluateGibSendEligibility } from '@/lib/accounting/einvoice/gib-send-guard';
import {
  describeEFaturaChannel,
  isEFaturaChannelReady
} from '@/lib/accounting/einvoice/config';
import { resolveLifecycleStatus } from '@/lib/accounting/einvoice/lifecycle';
import {
  canEditInvoiceIssuedAt,
  suggestedDocumentType
} from '@/lib/accounting/invoice';

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

function parseMuhasebeTab(raw?: string): MuhasebeTabKey {
  if (
    raw === 'faturalar' ||
    raw === 'hakedis' ||
    raw === 'vergi' ||
    raw === 'operasyon' ||
    raw === 'izleme'
  ) {
    return raw;
  }
  return 'satis';
}

function toGibRows(
  invoices: Awaited<ReturnType<typeof getAccountingInvoices>>
): InvoiceGibRow[] {
  const efaturaReady = isEFaturaChannelReady();
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
    const canEdit = canEditInvoiceIssuedAt(
      gibStatus === '—' ? undefined : gibStatus
    );
    const suggested = suggestedDocumentType(inv.buyerTaxNumber);
    const lifecycle = resolveLifecycleStatus({
      invoiceStatus: inv.status,
      einvoice: einv,
      eInvoiceUuid: inv.eInvoiceUuid
    });
    const meta =
      inv.metadata && typeof inv.metadata === 'object' && !Array.isArray(inv.metadata)
        ? (inv.metadata as Record<string, unknown>)
        : {};

    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      issuedAtLabel: inv.issuedAt.toLocaleDateString('tr-TR'),
      issuedAtDate: toIssuedAtDateInput(inv.issuedAt),
      buyerName: inv.buyerName,
      buyerTaxNumber: inv.buyerTaxNumber,
      eventTitle: inv.order.event?.title ?? '—',
      amountLabel: money(inv.totalGross, inv.currency),
      type: inv.type,
      suggestedType: suggested,
      status: inv.status,
      gibStatus,
      lifecycle,
      needsSmsSign: Boolean(einv.needsSmsSign),
      eInvoiceUuid: inv.eInvoiceUuid ?? einv.uuid ?? null,
      ettn: typeof einv.ettn === 'string' ? einv.ettn : null,
      envelopeUuid:
        typeof einv.envelopeUuid === 'string' ? einv.envelopeUuid : null,
      lastError,
      phoneMasked: einv.smsPhoneMasked ?? null,
      errorCategory: classified?.category ?? null,
      errorTitle: classified?.title ?? null,
      errorExplanation: classified?.explanation ?? null,
      sendDisabled: !eligibility.canSend || inv.status === 'cancelled',
      sendDisabledReason:
        inv.status === 'cancelled'
          ? 'Fatura iptal edilmiş'
          : (eligibility.blockReason ?? null),
      canEditIssuedAt: canEdit && inv.status !== 'cancelled',
      canEditDocumentType:
        canEdit &&
        inv.status !== 'cancelled' &&
        (inv.type === 'e_arsiv' || inv.type === 'e_fatura'),
      issuedOutsideGecis: Boolean(eligibility.issuedOutsideGecis),
      gecisRangeLabel: eligibility.gecisRange
        ? `${eligibility.gecisRange.fromLabel} – ${eligibility.gecisRange.toLabel}`
        : null,
      isRetry,
      channelLabel: eligibility.channelLabel ?? einv.channel ?? null,
      channelId:
        eligibility.channelId ??
        (typeof einv.channel === 'string' ? einv.channel : null),
      efaturaChannelReady: efaturaReady,
      mock: Boolean(einv.mock),
      isCreditNote: inv.type === 'credit_note',
      originalInvoiceNumber:
        typeof meta.originalInvoiceNumber === 'string'
          ? meta.originalInvoiceNumber
          : null,
      subtotalNet: inv.subtotalNet,
      vatRate: inv.vatRate,
      vatAmount: inv.vatAmount,
      totalGross: inv.totalGross,
      currency: inv.currency,
      lines: inv.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceNet: l.unitPriceNet,
        vatRate: l.vatRate,
        vatAmount: l.vatAmount,
        totalGross: l.totalGross
      }))
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

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminAccountingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = parseMuhasebeTab(params.tab);

  let loadError: string | null = null;
  let summary: Awaited<ReturnType<typeof getAccountingSummary>> | null = null;
  let invoiceAlerts: Awaited<ReturnType<typeof getAccountingInvoiceAlertCounts>> | null =
    null;
  let invoices: Awaited<ReturnType<typeof getAccountingInvoices>> = [];
  let emails: Awaited<ReturnType<typeof getAccountingEmailDeliveries>> = [];
  let payouts: Awaited<ReturnType<typeof getAccountingPayouts>> = [];
  let reconciliations: Awaited<ReturnType<typeof getAccountingReconciliations>> = [];
  let auditLogs: Awaited<ReturnType<typeof getAccountingAuditLogs>> = [];
  let organizers: Awaited<ReturnType<typeof getAccountingOrganizersOverview>> = [];
  let expenses: Awaited<ReturnType<typeof getAccountingExpenses>> = [];
  let vatSummary: Awaited<ReturnType<typeof getAccountingVatSummary>> | null = null;

  try {
    // Özet + rozetler her zaman; sekme gövdesi yalnızca aktif tab için
    switch (tab) {
      case 'satis': {
        const [summaryResult, alertResult, orgs] = await Promise.all([
          getAccountingSummary(),
          getAccountingInvoiceAlertCounts(),
          getAccountingOrganizersOverview()
        ]);
        summary = summaryResult;
        invoiceAlerts = alertResult;
        organizers = orgs;
        break;
      }
      case 'faturalar': {
        const [summaryResult, invs] = await Promise.all([
          getAccountingSummary(),
          getAccountingInvoices()
        ]);
        summary = summaryResult;
        invoices = invs;
        break;
      }
      case 'hakedis': {
        const [summaryResult, alertResult, pays] = await Promise.all([
          getAccountingSummary(),
          getAccountingInvoiceAlertCounts(),
          getAccountingPayouts()
        ]);
        summary = summaryResult;
        invoiceAlerts = alertResult;
        payouts = pays;
        break;
      }
      case 'vergi': {
        const [summaryResult, alertResult, vat] = await Promise.all([
          getAccountingSummary(),
          getAccountingInvoiceAlertCounts(),
          getAccountingVatSummary()
        ]);
        summary = summaryResult;
        invoiceAlerts = alertResult;
        vatSummary = vat;
        break;
      }
      case 'operasyon': {
        const [summaryResult, alertResult, recs, exps] = await Promise.all([
          getAccountingSummary(),
          getAccountingInvoiceAlertCounts(),
          getAccountingReconciliations(),
          getAccountingExpenses()
        ]);
        summary = summaryResult;
        invoiceAlerts = alertResult;
        reconciliations = recs;
        expenses = exps;
        break;
      }
      case 'izleme': {
        const [summaryResult, alertResult, mail, logs] = await Promise.all([
          getAccountingSummary(),
          getAccountingInvoiceAlertCounts(),
          getAccountingEmailDeliveries(),
          getAccountingAuditLogs()
        ]);
        summary = summaryResult;
        invoiceAlerts = alertResult;
        emails = mail;
        auditLogs = logs;
        break;
      }
    }
  } catch (e) {
    loadError =
      e instanceof Error
        ? e.message
        : 'Muhasebe verileri yüklenemedi. Veritabanı migrasyonu uygulanmış olmalı.';
  }

  const gibRows = toGibRows(invoices);
  const payoutRows = toPayoutRows(payouts);
  const expenseRows = toExpenseRows(expenses);

  const pendingSms =
    tab === 'faturalar'
      ? gibRows.filter((r) => r.needsSmsSign || r.gibStatus === 'submitted').length
      : (invoiceAlerts?.smsPending ?? 0);
  const gecisIssueCount =
    tab === 'faturalar'
      ? gibRows.filter(
          (r) => r.errorCategory === 'gecis_tarih' || r.issuedOutsideGecis
        ).length
      : (invoiceAlerts?.gecisErrors ?? 0);
  const faturalarBadge =
    tab === 'faturalar'
      ? pendingSms + gecisIssueCount
      : (invoiceAlerts?.faturalarBadge ?? 0);

  const efaturaSellerCount = gibRows.filter(
    (r) => r.errorCategory === 'efatura_satici'
  ).length;
  const efaturaTypeCount = gibRows.filter((r) => r.type === 'e_fatura').length;
  const efaturaChannel = describeEFaturaChannel();
  const showEfaturaSetup = efaturaTypeCount > 0 && !efaturaChannel.ready;

  const badges: Partial<Record<MuhasebeTabKey, number>> = {
    faturalar: faturalarBadge,
    hakedis: summary?.pendingPayoutCount ?? 0,
    izleme: summary?.emailFailed ?? 0,
    operasyon: summary?.mismatchCount ?? 0
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Muhasebe</h1>
        <p className="text-muted-foreground">
          Fatura, GİB e-Arşiv, mutabakat, hakediş, gider ve e-posta izleme
          {summary ? ` — ${summary.company.tradeName}` : ''}
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

      <MuhasebeTabs active={tab} badges={badges}>
        {tab === 'satis' && (
          <div className="space-y-6">
            {summary && (
              <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
                <StatCard
                  label="Ertelenmiş gelir"
                  value={String(summary.deferredRevenueCount)}
                  sub={money(summary.deferredRevenueAmount)}
                />
              </div>
            )}
            <Section
              title="Organizatör finans görünümü"
              description="Organizatöre tıklayıp geçmiş/gelecek etkinlik ve detay finansları açın"
            >
              <OrganizerFinanceTable organizers={organizers} />
            </Section>
          </div>
        )}

        {tab === 'faturalar' && (
          <div className="space-y-6">
            {(gecisIssueCount > 0 || efaturaSellerCount > 0 || showEfaturaSetup) && (
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
                      danışın veya belge tipini e-Fatura kanalına alın.
                    </p>
                  </div>
                )}
                {showEfaturaSetup && (
                  <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-800">
                    <p className="font-medium">
                      BiletFeed e-Fatura kanalı yapılandırılmadı — {efaturaTypeCount}{' '}
                      fatura
                    </p>
                    <p className="mt-1 text-zinc-600">
                      e-Fatura satırları e-Arşiv portalına gönderilmez. Kanalı açmak
                      için:{' '}
                      <code className="rounded bg-zinc-200 px-1 text-xs">
                        EINVOICE_EFATURA_ENABLED=true
                      </code>
                      {', '}
                      geliştirme için{' '}
                      <code className="rounded bg-zinc-200 px-1 text-xs">
                        EINVOICE_EFATURA_MOCK=true
                      </code>{' '}
                      veya canlı endpoint{' '}
                      <code className="rounded bg-zinc-200 px-1 text-xs">
                        EINVOICE_EFATURA_BASE_URL
                      </code>
                      . GİB özel entegratör lisansı ayrı yasal süreçtir — yazılım
                      kanalı hazır olsa da lisans olmadan üretim gönderimi yapılamaz.
                    </p>
                  </div>
                )}
              </div>
            )}

            {summary && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Kesilen fatura"
                  value={String(summary.invoiceCount)}
                  sub={money(summary.invoiceTotal)}
                />
                <StatCard
                  label="GİB SMS / taslak"
                  value={String(pendingSms)}
                  sub="Onay bekleyen e-Arşiv"
                />
                <StatCard
                  label="GEÇİŞ uyarısı"
                  value={String(gecisIssueCount)}
                  sub="Tarih penceresi / hata"
                />
              </div>
            )}

            <Section
              title="Faturalar"
              description="Paraşüt-benzeri akış: tip → gönder → SMS/kabul → PDF / iptal. İade (credit note) satırları listede görünür."
            >
              <InvoiceGibTable rows={gibRows} />
            </Section>
          </div>
        )}

        {tab === 'hakedis' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {summary ? (
                <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:max-w-md">
                  <StatCard
                    label="Bekleyen hakediş"
                    value={String(summary.pendingPayoutCount)}
                    sub={money(summary.pendingPayoutAmount)}
                  />
                </div>
              ) : (
                <div />
              )}
              <AccountingExportButtons types={['hakedis']} />
            </div>
            <Section
              title="Organizatör hakedişleri"
              description="Ödeme referansı ile ödendi işaretle veya iptal et"
            >
              <PayoutActionsTable rows={payoutRows} />
            </Section>
          </div>
        )}

        {tab === 'vergi' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Vergi & raporlar</h2>
                <p className="text-sm text-muted-foreground">
                  KDV ve BA/BS dışa aktarımları
                </p>
              </div>
              <AccountingExportButtons types={['kdv', 'ba-bs']} />
            </div>
            {vatSummary && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Varsayılan KDV"
                  value={`%${vatSummary.defaultVatRate}`}
                  sub="ACCOUNTING_VAT_RATE"
                />
                <StatCard
                  label="Matrah (net)"
                  value={money(vatSummary.subtotalNet)}
                  sub={`${vatSummary.invoiceCount} kesilen fatura`}
                />
                <StatCard
                  label="KDV tutarı"
                  value={money(vatSummary.vatAmount)}
                  sub="Kesilen faturalar"
                />
                <StatCard
                  label="Brüt toplam"
                  value={money(vatSummary.totalGross)}
                  sub="KDV dahil"
                />
              </div>
            )}
          </div>
        )}

        {tab === 'operasyon' && (
          <div className="space-y-6">
            {summary && (
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                  label="Mutabakat (eşleşen)"
                  value={String(summary.reconciledCount)}
                  sub="reconciled"
                />
                <StatCard
                  label="Uyumsuzluk"
                  value={String(summary.mismatchCount)}
                  sub="mismatch"
                />
              </div>
            )}
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
              title="Giderler"
              description="Platform / etkinlik giderleri — P&L hesaplamasına dahil"
            >
              <AccountingExpensesPanel rows={expenseRows} />
            </Section>
          </div>
        )}

        {tab === 'izleme' && (
          <div className="space-y-6">
            {summary && (
              <div className="grid gap-4 sm:grid-cols-2 lg:max-w-md">
                <StatCard
                  label="Başarısız e-posta"
                  value={String(summary.emailFailed)}
                  sub="failed"
                />
              </div>
            )}
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
        )}
      </MuhasebeTabs>
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

function OrganizerFinanceTable({
  organizers
}: {
  organizers: Awaited<ReturnType<typeof getAccountingOrganizersOverview>>;
}) {
  return (
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
