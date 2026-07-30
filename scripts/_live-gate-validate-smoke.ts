/**
 * Canlı kapı oturumu + bilet doğrulama smoke testi
 * npx dotenv -e .env.local -- npx tsx scripts/_live-gate-validate-smoke.ts
 */
import { prisma } from '../lib/db/prisma';
import { createScannerGateCode } from '../lib/auth/scanner-gate';

const TICKET_CODE = 'BF-25149FD3A153';
const GIRIS = 'https://giris.biletfeed.com';

async function main() {
  const ticket = await prisma.purchasedTicket.findFirst({
    where: { ticketCode: TICKET_CODE, deletedAt: null },
    select: {
      eventId: true,
      status: true,
      event: {
        select: {
          title: true,
          organizerId: true,
          organizer: {
            select: {
              id: true,
              owner: { select: { firebaseUid: true, email: true, role: true } }
            }
          }
        }
      }
    }
  });
  if (!ticket?.event?.organizer?.owner) {
    throw new Error(`Bilet bulunamadı: ${TICKET_CODE}`);
  }

  const owner = ticket.event.organizer.owner;
  console.log('ticket', {
    code: TICKET_CODE,
    status: ticket.status,
    event: ticket.event.title,
    eventId: ticket.eventId
  });

  const gate = await createScannerGateCode({
    organizerId: ticket.event.organizerId,
    eventId: ticket.eventId,
    uid: owner.firebaseUid,
    email: owner.email,
    role: owner.role as 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SUPER_ADMIN' | 'ROLE_ORGANIZER'
  });
  console.log('gate pin', gate.pin);

  // Deploy probe: sessionToken alanı yeni kodda var
  let sessionBody: {
    success?: boolean;
    error?: string;
    sessionToken?: string;
    gateScopeToken?: string | null;
  } = {};
  let sessionRes: Response | null = null;

  for (let attempt = 1; attempt <= 20; attempt++) {
    sessionRes = await fetch(`${GIRIS}/api/auth/scanner-gate-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://giris.biletfeed.com',
        Referer: 'https://giris.biletfeed.com/'
      },
      body: JSON.stringify({ code: gate.pin })
    });
    sessionBody = (await sessionRes.json().catch(() => ({}))) as typeof sessionBody;
    console.log(`gate-session try ${attempt}:`, sessionRes.status, {
      success: sessionBody.success,
      error: sessionBody.error,
      hasSessionToken: Boolean(sessionBody.sessionToken),
      hasScope: Boolean(sessionBody.gateScopeToken)
    });
    if (sessionRes.ok && sessionBody.sessionToken) break;
    if (sessionRes.ok && !sessionBody.sessionToken) {
      console.log('Deploy henüz sessionToken dönmüyor — bekleniyor…');
    }
    await new Promise((r) => setTimeout(r, 15000));
  }

  if (!sessionRes?.ok || !sessionBody.sessionToken) {
    throw new Error(
      `Kapı oturumu alınamadı: ${sessionRes?.status} ${JSON.stringify(sessionBody)}`
    );
  }

  const setCookie = sessionRes.headers.getSetCookie?.() ?? [];
  console.log('set-cookie count', setCookie.length);

  const validateRes = await fetch(`${GIRIS}/api/tickets/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://giris.biletfeed.com',
      Referer: 'https://giris.biletfeed.com/tarayici',
      Authorization: `Bearer ${sessionBody.sessionToken}`,
      ...(sessionBody.gateScopeToken
        ? { 'X-Scanner-Gate-Scope': sessionBody.gateScopeToken }
        : {})
    },
    body: JSON.stringify({
      ticketCode: TICKET_CODE,
      markUsed: false,
      eventId: ticket.eventId
    })
  });
  const validateBody = await validateRes.json().catch(() => ({}));
  console.log('validate', validateRes.status, validateBody);

  if (!validateRes.ok) {
    process.exitCode = 1;
    return;
  }
  if (validateBody.status !== 'VALID' && validateBody.status !== 'USED') {
    console.error('Beklenen VALID/USED, gelen:', validateBody.status);
    process.exitCode = 1;
    return;
  }

  console.log('\nSMOKE OK — canlı kapı Bearer + validate çalışıyor');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
