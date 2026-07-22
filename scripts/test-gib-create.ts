/**
 * Live GİB draft create smoke test.
 * node --env-file=.env.local --import tsx scripts/test-gib-create.ts
 */
import { getEInvoiceConfig } from '../lib/accounting/einvoice/config';
import { createGibEarsivProvider } from '../lib/accounting/einvoice/providers/gib-earsiv';
import { buildEInvoicePayload } from '../lib/accounting/einvoice/ubl';
import { companyLegal } from '../lib/config/company';

async function main() {
  const cfg = getEInvoiceConfig();
  const provider = createGibEarsivProvider(cfg);
  const payload = buildEInvoicePayload({
    invoiceId: 'test-local',
    invoiceNumber: `BFTEST${Date.now().toString().slice(-6)}`,
    kind: 'e_arsiv',
    issuedAt: new Date(),
    currency: 'TRY',
    subtotalNet: 100,
    vatRate: 20,
    vatAmount: 20,
    totalGross: 120,
    buyer: {
      name: 'Test Alici',
      taxNumber: null,
      isCorporate: false,
      email: 'test@biletfeed.com',
      address: 'Antalya'
    },
    lines: [
      {
        description: 'Test bilet',
        quantity: 1,
        unitPriceNet: 100,
        vatRate: 20,
        vatAmount: 20,
        totalGross: 120
      }
    ]
  });

  console.log(
    JSON.stringify({
      provider: cfg.provider,
      sandbox: cfg.sandbox,
      sellerVKN: companyLegal.taxNumber
    })
  );

  const r = await provider.submit(payload);
  const raw = r.raw as Record<string, unknown> | undefined;
  console.log(
    JSON.stringify(
      {
        ok: r.ok,
        status: r.status,
        uuid: r.uuid,
        error: r.error,
        rawData: raw?.data,
        rawError: raw?.error
      },
      null,
      2
    )
  );
  process.exit(r.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
