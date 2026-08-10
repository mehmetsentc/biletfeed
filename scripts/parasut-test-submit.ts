/**
 * Tek seferlik: mevcut bir iç faturayı Paraşüt’e gönder (test).
 * Kullanım: npx dotenv -e .env.local -- npx tsx scripts/parasut-test-submit.ts [invoiceNumber]
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import { prisma } from '../lib/db/prisma';
import { submitInvoiceToGib } from '../lib/accounting/einvoice/submit';
import { describeParasutChannel } from '../lib/accounting/einvoice/parasut/config';
import { readEInvoiceMeta } from '../lib/accounting/einvoice/meta';

async function main() {
  const wanted = process.argv[2]?.trim();
  const channel = describeParasutChannel();
  console.log('Paraşüt kanal:', channel);

  if (!channel.ready) {
    throw new Error(channel.setupHint ?? 'Paraşüt yapılandırılmamış');
  }

  const invoice = wanted
    ? await prisma.invoice.findFirst({
        where: { invoiceNumber: wanted },
        select: { id: true, invoiceNumber: true, status: true, metadata: true }
      })
    : await prisma.invoice.findFirst({
        where: {
          status: 'issued',
          type: { in: ['e_arsiv', 'e_fatura'] }
        },
        orderBy: { issuedAt: 'desc' },
        select: { id: true, invoiceNumber: true, status: true, metadata: true }
      });

  if (!invoice) throw new Error('Uygun fatura bulunamadı');

  const before = readEInvoiceMeta(invoice.metadata);
  console.log('Hedef fatura:', {
    no: invoice.invoiceNumber,
    id: invoice.id,
    status: invoice.status,
    channel: before.channel,
    einvStatus: before.status,
    lastError: before.lastError
  });

  const result = await submitInvoiceToGib({
    invoiceId: invoice.id,
    force: true
  });

  console.log('Sonuç:', result);

  const after = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    select: { eInvoiceUuid: true, metadata: true, status: true }
  });
  const meta = readEInvoiceMeta(after?.metadata);
  console.log('Sonrası:', {
    status: after?.status,
    uuid: after?.eInvoiceUuid,
    channel: meta.channel,
    provider: meta.provider,
    einvStatus: meta.status,
    providerRef: meta.providerRef,
    mock: meta.mock,
    lastError: meta.lastError
  });

  await prisma.$disconnect();
  if (!result.ok) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
