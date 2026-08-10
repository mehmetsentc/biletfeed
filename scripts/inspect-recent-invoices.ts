import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { prisma } from '../lib/db/prisma';

async function main() {
  const rows = await prisma.invoice.findMany({
    orderBy: { issuedAt: 'desc' },
    take: 12,
    select: {
      invoiceNumber: true,
      status: true,
      issuedAt: true,
      eInvoiceUuid: true,
      metadata: true,
      totalGross: true
    }
  });

  for (const r of rows) {
    const m = (r.metadata ?? {}) as Record<string, unknown>;
    const einv = (m.einvoice ?? {}) as Record<string, unknown>;
    console.log(
      JSON.stringify({
        no: r.invoiceNumber,
        status: r.status,
        issuedAt: r.issuedAt,
        uuid: r.eInvoiceUuid,
        channel: einv.channel,
        provider: einv.provider,
        einvStatus: einv.status,
        mock: einv.mock,
        cancelReason: einv.cancelReason,
        providerRef: einv.providerRef,
        lastError: einv.lastError
          ? String(einv.lastError).slice(0, 200)
          : null
      })
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
