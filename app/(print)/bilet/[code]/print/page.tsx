import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { PrintPageActions } from '@/components/tickets/print-page-actions';
import { getPublicTicketByCode } from '@/lib/services/tickets';

interface Props {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string; id?: string }>;
}

export default async function TicketPrintPage({ params, searchParams }: Props) {
  const { code } = await params;
  const { token = '', id = '' } = await searchParams;

  const ticketCode = decodeURIComponent(code);
  const validationToken = decodeURIComponent(token);
  const ticketId = decodeURIComponent(id);

  if (!validationToken || !ticketId) notFound();

  const ticket = await getPublicTicketByCode(ticketCode, validationToken, ticketId);
  if (!ticket) notFound();

  if (ticket.isInvitation && ticket.inviteToken) {
    redirect(`/davetiye/${ticket.inviteToken}/print`);
  }

  const qrDataUrl = await QRCode.toDataURL(ticket.qrData, {
    width: 280,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const eventDate = new Date(ticket.event.startDate).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const eventTime = new Date(ticket.event.startDate).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isValid = ticket.status === 'VALID';
  const backHref = `/bilet/${encodeURIComponent(ticketCode)}?token=${encodeURIComponent(validationToken)}&id=${encodeURIComponent(ticketId)}`;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: var(--ticket-page-bg) !important; font-family: -apple-system, 'Segoe UI', sans-serif; }
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          #ticket-root { page-break-after: avoid; page-break-inside: avoid; }
        }
        @media screen {
          body { display: flex; justify-content: center; align-items: flex-start; padding: 72px 20px 40px; min-height: 100vh; }
        }
      `}</style>

      <PrintPageActions backHref={backHref} backLabel="Bilete Dön" />

      <div
        id="ticket-root"
        style={{
          width: 595,
          maxWidth: '100%',
          background: 'var(--ticket-page-bg)',
          color: '#fff',
          fontFamily: '-apple-system, "Segoe UI", sans-serif',
          margin: '0 auto',
          borderRadius: 16,
          overflow: 'hidden'
        }}
      >
        {ticket.event.coverImage && (
          <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.event.coverImage}
              alt={ticket.event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(12,16,23,0) 40%, rgba(12,16,23,1) 100%)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: 18,
                left: 22,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#fff'
              }}
            >
              bilet<span style={{ color: 'var(--bf-orange)' }}>feed</span>
            </div>
          </div>
        )}

        {!ticket.event.coverImage && (
          <div
            style={{
              background: 'linear-gradient(135deg, var(--bf-orange) 0%, var(--bf-orange-hover) 100%)',
              padding: '22px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: '#000' }}>
              bilet<span style={{ color: '#1a1a1a' }}>feed</span>
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                color: '#000',
                textTransform: 'uppercase'
              }}
            >
              Etkinlik Bileti
            </span>
          </div>
        )}

        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, color: '#fff', flex: 1 }}>
              {ticket.event.title}
            </h1>
            <span
              style={{
                flexShrink: 0,
                padding: '4px 12px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                background: isValid ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                color: isValid ? '#34d399' : '#ef4444',
                border: `1px solid ${isValid ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`
              }}
            >
              {isValid ? '✓ Geçerli' : 'Geçersiz'}
            </span>
          </div>

          <p style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Sayın <strong style={{ color: '#fff' }}>{ticket.holderName}</strong>
          </p>

          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}
          >
            {[
              { label: 'Tarih', value: eventDate },
              { label: 'Saat', value: eventTime },
              { label: 'Mekan', value: `${ticket.event.venue}, ${ticket.event.city}` },
              { label: 'Bilet Türü', value: ticket.ticketTypeName }
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    color: 'var(--bf-orange)',
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 3
                  }}
                >
                  {label}
                </p>
                <p style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ position: 'relative', margin: '28px -32px' }}>
            <div
              style={{
                borderTop: '2px dashed rgba(245,166,35,0.25)',
                marginLeft: 10,
                marginRight: 10
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
            <div
              style={{
                padding: 14,
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 0 40px rgba(245,166,35,0.12)',
                flexShrink: 0
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR Kod" width={160} height={160} />
            </div>

            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 6
                }}
              >
                Bilet Kodu
              </p>
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 4,
                  color: '#fff',
                  fontFamily: 'monospace',
                  marginBottom: 16
                }}
              >
                {ticket.ticketCode}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                Girişte bu QR kodu veya bilet kodunu gösterin. Bilet yalnızca bir kez kullanılabilir.
              </p>
              <div
                style={{
                  marginTop: 16,
                  height: 3,
                  borderRadius: 99,
                  background: 'linear-gradient(90deg, var(--bf-orange), rgba(245,166,35,0.1))'
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              biletfeed.com · Güvenli bilet sistemi
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              Bu bilet kişiye özeldir, devredilemez.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
