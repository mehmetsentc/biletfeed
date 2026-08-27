#!/usr/bin/env tsx
/**
 * Belirli bir etkinlikte, verilen koltuk kodu/aralığındaki TÜM davetiyeleri
 * (henüz kullanılmamış olanları) iptal eder ve koltukları tekrar satışa açar.
 *
 * Kullanım:
 *   npm run invitations:cancel-seats -- --event="Gipsy Kings" --seats=Z2-Z10
 *   npm run invitations:cancel-seats -- --eventId=<uuid> --seats=Z2,Z5,Z9
 *
 * --dry-run eklenirse hiçbir şey iptal edilmez, sadece bulunan davetiyeler listelenir.
 */
import { prisma, ensureDbConnection } from '../lib/db/prisma';
import { cancelEventInvitationsBulk } from '../lib/services/event-invitations';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const [key, ...rest] = raw.slice(2).split('=');
    out[key] = rest.length ? rest.join('=') : true;
  }
  return out;
}

/** "Z2-Z10" -> ["Z2","Z3",...,"Z10"]; "Z2,Z5,Z9" -> ["Z2","Z5","Z9"] */
function expandSeatList(input: string): string[] {
  const out = new Set<string>();
  for (const part of input.split(',').map((s) => s.trim()).filter(Boolean)) {
    const rangeMatch = part.match(/^([A-Za-z]+)(\d+)-([A-Za-z]+)?(\d+)$/);
    if (rangeMatch) {
      const [, prefix1, fromStr, prefix2, toStr] = rangeMatch;
      const prefix = prefix2 || prefix1;
      if (prefix2 && prefix2.toUpperCase() !== prefix1.toUpperCase()) {
        throw new Error(`Aralığın iki tarafı da aynı satır harfiyle olmalı: ${part}`);
      }
      const from = Number(fromStr);
      const to = Number(toStr);
      if (Number.isNaN(from) || Number.isNaN(to) || from > to) {
        throw new Error(`Geçersiz aralık: ${part}`);
      }
      for (let n = from; n <= to; n++) out.add(`${prefix.toUpperCase()}${n}`);
    } else {
      out.add(part.toUpperCase());
    }
  }
  return [...out];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seatsArg = args.seats;
  if (typeof seatsArg !== 'string' || !seatsArg.trim()) {
    console.error('Kullanım: tsx scripts/cancel-invitations-by-seats.ts --event="Etkinlik adı" --seats=Z2-Z10 [--dry-run]');
    process.exit(1);
  }
  const seatIds = expandSeatList(seatsArg);
  const dryRun = Boolean(args['dry-run']);

  await ensureDbConnection();

  const event = args.eventId
    ? await prisma.event.findFirst({
        where: { id: String(args.eventId), deletedAt: null },
        select: { id: true, title: true, organizerId: true }
      })
    : args.event
      ? await prisma.event.findFirst({
          where: { title: { contains: String(args.event), mode: 'insensitive' }, deletedAt: null },
          select: { id: true, title: true, organizerId: true }
        })
      : null;

  if (!event) {
    console.error('Etkinlik bulunamadı. --event="..." veya --eventId=... verin.');
    process.exit(1);
  }

  console.log(`Etkinlik: ${event.title} (${event.id})`);
  console.log(`Aranan koltuklar: ${seatIds.join(', ')}`);

  const invitations = await prisma.eventInvitation.findMany({
    where: {
      eventId: event.id,
      deletedAt: null,
      status: { not: 'cancelled' },
      purchasedTicket: { seatUnitId: { in: seatIds } }
    },
    select: {
      id: true,
      guestName: true,
      status: true,
      purchasedTicket: { select: { seatUnitId: true, status: true } }
    }
  });

  if (invitations.length === 0) {
    console.log('Bu koltuklarda iptal edilecek aktif davetiye bulunamadı (zaten hepsi boşta olabilir).');
    await prisma.$disconnect();
    return;
  }

  console.log(`\nBulunan ${invitations.length} davetiye:`);
  for (const inv of invitations) {
    console.log(
      `  - ${inv.guestName} · koltuk ${inv.purchasedTicket.seatUnitId} · durum: ${inv.status}/${inv.purchasedTicket.status} · id: ${inv.id}`
    );
  }

  if (dryRun) {
    console.log('\n--dry-run: hiçbir şey iptal edilmedi.');
    await prisma.$disconnect();
    return;
  }

  const result = await cancelEventInvitationsBulk(
    invitations.map((i) => i.id),
    event.organizerId
  );

  console.log(`\nİptal edilen: ${result.cancelled.length}`);
  for (const c of result.cancelled) {
    console.log(`  ✓ ${c.guestName} (${c.seatUnitId ?? '—'})`);
  }
  if (result.errors.length > 0) {
    console.log(`\nİptal edilemeyen: ${result.errors.length}`);
    for (const e of result.errors) {
      console.log(`  ✗ ${e.invitationId}: ${e.error}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
